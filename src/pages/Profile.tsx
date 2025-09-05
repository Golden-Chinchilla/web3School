import { useEffect, useMemo, useState } from 'react';
import type { CourseMeta, Address } from '../lib/types';
import { useAccount } from 'wagmi';
import { makeContract, useEthersSigner, weiToToken, toWei } from '../lib/ethers-adapter';
import { ERC1155_MIN_ABI, ERC20_MIN_ABI } from '../lib/abi-min';
import { CONTRACTS } from '../lib/contracts';

async function fetchCourses(): Promise<CourseMeta[]> {
    const r = await fetch('/api/courses');
    const j = await r.json();
    return j.items as CourseMeta[];
}

export function Profile() {
    const { address } = useAccount();
    const { getSigner, ready } = useEthersSigner();

    const [all, setAll] = useState<CourseMeta[]>([]);
    const [mine, setMine] = useState<CourseMeta[]>([]);
    const [created, setCreated] = useState<CourseMeta[]>([]);
    const [busy, setBusy] = useState(false);

    const [form, setForm] = useState({
        title: '', description: '', videoUrl: '',
        price: '', tokenAddress: '' as Address,
    });

    useEffect(() => { (async () => setAll(await fetchCourses()))(); }, []);

    // 计算我已购 & 我创建
    useEffect(() => {
        (async () => {
            if (!address || !ready || all.length === 0) { setMine([]); setCreated([]); return; }
            const signer = await getSigner();
            const provider = signer.provider!;
            const pass = makeContract<any>(CONTRACTS.CoursePass1155.address, ERC1155_MIN_ABI, provider);
            const holds: CourseMeta[] = [];
            const authored: CourseMeta[] = [];
            for (const c of all) {
                if (c.author.toLowerCase() === address.toLowerCase()) authored.push(c);
                const bal: bigint = await pass.balanceOf(address, c.courseId);
                if (bal > 0n) holds.push(c);
            }
            setMine(holds);
            setCreated(authored);
        })();
    }, [address, ready, all]);

    const onCreate = async () => {
        if (!ready || !address) return;
        setBusy(true);
        try {
            const signer = await getSigner();

            // 1) 链上 create
            const reg = new (await import('ethers')).Contract(
                CONTRACTS.CourseRegistry.address,
                CONTRACTS.CourseRegistry.abi,
                signer,
            );
            // 假设签名：createCourse(uint256 priceWei, address tokenAddress)
            const tx = await (reg as any).createCourse(toWei(form.price, 18), form.tokenAddress);
            const receipt = await tx.wait();

            // 从事件里抓 courseId（事件名随 ABI 解析）
            let courseId: number | null = null;
            for (const log of receipt.logs ?? []) {
                try {
                    const parsed = (reg as any).interface.parseLog(log);
                    if (parsed && parsed.name.toLowerCase().includes('course') && 'courseId' in parsed.args) {
                        courseId = Number(parsed.args.courseId);
                        break;
                    }
                } catch { }
            }

            if (courseId == null) {
                alert('Create succeeded but courseId not parsed. Please check ABI/event name.');
                return;
            }

            // 2) 写入后端 KV
            const meta: CourseMeta = {
                courseId,
                title: form.title,
                description: form.description,
                videoUrl: form.videoUrl,
                author: address,
                price: (toWei(form.price, 18)).toString(),
                tokenAddress: form.tokenAddress,
                createdAt: Date.now(),
                status: 'active',
            };
            const r = await fetch('/api/courses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(meta) });
            if (!r.ok) throw new Error('KV write failed');

            setAll((prev) => [meta, ...prev]);
            setForm({ title: '', description: '', videoUrl: '', price: '', tokenAddress: '0x' as Address });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左：我创建的 */}
            <section className="lg:col-span-2 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">My Courses</h2>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {created.map(c => (
                            <div key={c.courseId} className="rounded-xl border border-white/10 p-4 bg-white/5">
                                <div className="text-sm text-zinc-400">#{c.courseId}</div>
                                <div className="font-medium">{c.title}</div>
                            </div>
                        ))}
                        {created.length === 0 && <div className="text-zinc-400">暂无创建课程</div>}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold">Owned</h2>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mine.map(c => (
                            <div key={c.courseId} className="rounded-xl border border-white/10 p-4 bg-white/5">
                                <div className="text-sm text-zinc-400">#{c.courseId}</div>
                                <div className="font-medium">{c.title}</div>
                            </div>
                        ))}
                        {mine.length === 0 && <div className="text-zinc-400">尚未购买课程</div>}
                    </div>
                </div>
            </section>

            {/* 右：创建表单（MVP） */}
            <aside>
                <div className="rounded-2xl border border-white/10 p-5 bg-white/5">
                    <h3 className="font-semibold">Create Course</h3>
                    <div className="mt-4 space-y-3">
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full bg-zinc-900 rounded-lg p-2 text-sm border border-white/10" />
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full bg-zinc-900 rounded-lg p-2 text-sm border border-white/10 h-24" />
                        <input value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} placeholder="Video URL" className="w-full bg-zinc-900 rounded-lg p-2 text-sm border border-white/10" />
                        <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price (tokens)" className="w-full bg-zinc-900 rounded-lg p-2 text-sm border border-white/10" />
                        <input value={form.tokenAddress} onChange={e => setForm({ ...form, tokenAddress: e.target.value as Address })} placeholder="ERC20 Address" className="w-full bg-zinc-900 rounded-lg p-2 text-sm border border-white/10" />
                        <button disabled={busy} onClick={onCreate} className="w-full rounded-xl bg-indigo-500/90 hover:bg-indigo-400 text-white py-2 disabled:opacity-50">
                            {busy ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
