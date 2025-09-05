import { useEffect, useMemo, useState } from 'react';
import type { CourseMeta, Address } from '../lib/types';
import { useAccount } from 'wagmi';
import { makeContract, useEthersSigner, weiToToken } from '../lib/ethers-adapter';
import { ERC20_MIN_ABI } from '../lib/abi-min';
import { CONTRACTS } from '../lib/contracts';
import { formatUnits } from 'ethers';

type ItemView = CourseMeta & {
    decimals?: number;
    symbol?: string;
    allowance?: bigint;
    priceWei: bigint; // parsed from meta.price
};

async function fetchCourses(): Promise<CourseMeta[]> {
    const r = await fetch('/api/courses');
    const j = await r.json();
    return j.items as CourseMeta[];
}

export function BuyCourse() {
    const { address } = useAccount();
    const { getSigner, ready } = useEthersSigner();

    const [items, setItems] = useState<ItemView[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const list = await fetchCourses();
            const mapped: ItemView[] = list.map((m) => ({ ...m, priceWei: BigInt(m.price) }));
            setItems(mapped);
            setLoading(false);
        })();
    }, []);

    // 拉取每个 token 的 decimals/symbol & allowance
    useEffect(() => {
        (async () => {
            if (!address || !ready || items.length === 0) return;
            const signer = await getSigner();
            const provider = signer.provider!;

            const updated = await Promise.all(items.map(async (it) => {
                const erc20 = makeContract<any>(it.tokenAddress, ERC20_MIN_ABI, provider);
                const [dec, sym, allow] = await Promise.all([
                    erc20.decimals(),
                    erc20.symbol(),
                    erc20.allowance(address, CONTRACTS.CourseRegistry.address),
                ]);
                return { ...it, decimals: Number(dec), symbol: sym as string, allowance: BigInt(allow) };
            }));
            setItems(updated);
        })();
    }, [address, ready, items.length]);

    const approveNeeded = (it: ItemView) => {
        if (!it.decimals) return true;
        return (it.allowance ?? 0n) < it.priceWei;
    };

    const onApprove = async (it: ItemView) => {
        if (!address || !ready) return;
        setBusyId(it.courseId);
        try {
            const signer = await getSigner();
            const erc20 = makeContract<any>(it.tokenAddress, ERC20_MIN_ABI, signer);
            const tx = await erc20.approve(CONTRACTS.CourseRegistry.address, it.priceWei);
            await tx.wait();
            // refresh allowance
            const allow = await erc20.allowance(address, CONTRACTS.CourseRegistry.address);
            setItems((prev) => prev.map(p => p.courseId === it.courseId ? { ...p, allowance: BigInt(allow) } : p));
        } finally {
            setBusyId(null);
        }
    };

    const onBuy = async (it: ItemView) => {
        if (!ready) return;
        setBusyId(it.courseId);
        try {
            const signer = await getSigner();
            const reg = new (await import('ethers')).Contract(
                CONTRACTS.CourseRegistry.address,
                CONTRACTS.CourseRegistry.abi,
                signer,
            );
            // 你的合约方法名若为 buyCourse，请把 'buy' 改成 'buyCourse'
            const tx = await (reg as any).buy(it.courseId);
            await tx.wait();
            // todo: 可触发一个“购买成功”toast
        } finally {
            setBusyId(null);
        }
    };

    if (loading) return <div className="text-zinc-400">Loading courses…</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((it) => {
                const priceText = it.decimals != null
                    ? `${weiToToken(it.priceWei, it.decimals)} ${it.symbol ?? ''}`
                    : `${formatUnits(it.priceWei)} (loading token…)`;

                return (
                    <div key={it.courseId} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-white/20 transition">
                        <div className="text-sm text-zinc-400">#{it.courseId}</div>
                        <h3 className="text-lg font-semibold mt-1">{it.title}</h3>
                        <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{it.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-indigo-300 font-medium">{priceText}</div>
                            <div className="flex gap-2">
                                {approveNeeded(it) ? (
                                    <button
                                        disabled={busyId === it.courseId}
                                        onClick={() => onApprove(it)}
                                        className="px-3 py-2 text-sm rounded-xl bg-indigo-500/90 hover:bg-indigo-400 text-white disabled:opacity-50"
                                    >{busyId === it.courseId ? 'Approving…' : 'Approve'}</button>
                                ) : (
                                    <button
                                        disabled={busyId === it.courseId}
                                        onClick={() => onBuy(it)}
                                        className="px-3 py-2 text-sm rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-white disabled:opacity-50"
                                    >{busyId === it.courseId ? 'Buying…' : 'Buy'}</button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
