import { useParams } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import type { CourseMeta, Address } from '../lib/types';
import { useAccount } from 'wagmi';
import { useEthersSigner, makeContract } from '../lib/ethers-adapter';
import { ERC1155_MIN_ABI } from '../lib/abi-min';
import { CONTRACTS } from '../lib/contracts';

async function fetchCourse(id: number): Promise<CourseMeta | null> {
    const r = await fetch(`/api/courses/${id}`);
    if (!r.ok) return null;
    return (await r.json()) as CourseMeta;
}

function buildPlayMessage(addr: Address, courseId: number) {
    const nonce = crypto.randomUUID();
    const ts = Date.now();
    // 与后端约定的多行模板（严格！）
    return `web3u:play
addr=${addr}
courseId=${courseId}
ts=${ts}
nonce=${nonce}`;
}

export function CourseDetail() {
    const { id } = useParams();
    const courseId = Number(id);
    const { address } = useAccount();
    const { getSigner, ready } = useEthersSigner();

    const [meta, setMeta] = useState<CourseMeta | null>(null);
    const [hasPass, setHasPass] = useState<boolean | null>(null);
    const [videoSrc, setVideoSrc] = useState<string>('');
    const [busy, setBusy] = useState(false);

    useEffect(() => { (async () => setMeta(await fetchCourse(courseId)))(); }, [courseId]);

    // 判权：ERC1155 balanceOf(address, id) > 0
    useEffect(() => {
        (async () => {
            if (!address || !ready) { setHasPass(null); return; }
            const signer = await getSigner();
            const provider = signer.provider!;
            const pass = makeContract<any>(CONTRACTS.CoursePass1155.address, ERC1155_MIN_ABI, provider);
            const bal: bigint = await pass.balanceOf(address, courseId);
            setHasPass(bal > 0n);
        })();
    }, [address, ready, courseId]);

    const onPlay = async () => {
        if (!address || !ready || !meta) return;
        setBusy(true);
        try {
            const signer = await getSigner();
            const message = buildPlayMessage(address, courseId);
            const signature = await signer.signMessage(message); // ethers 前端签名

            const resp = await fetch('/api/auth/issue-play-token', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ courseId, address, message, signature }),
            });
            const j = await resp.json();
            if (!resp.ok) throw new Error(j?.error || 'ISSUE_TOKEN_FAILED');

            const src = `/api/play?courseId=${courseId}&token=${encodeURIComponent(j.token)}`;
            setVideoSrc(src);
        } finally {
            setBusy(false);
        }
    };

    if (!meta) return <div className="text-zinc-400">Loading…</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <h1 className="text-3xl font-extrabold">{meta.title}</h1>
                <p className="text-zinc-300 mt-4">{meta.description}</p>

                <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 bg-black/30 aspect-video">
                    {videoSrc ? (
                        <video src={videoSrc} controls className="w-full h-full" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-400">
                            {hasPass === false ? '购买后可观看' : '点击下方按钮开始播放'}
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    <button
                        disabled={!hasPass || busy}
                        onClick={onPlay}
                        className="px-4 py-2 rounded-xl bg-indigo-500/90 hover:bg-indigo-400 text-white disabled:opacity-50"
                    >
                        {busy ? 'Authorizing…' : hasPass ? 'Play' : 'No Access'}
                    </button>
                </div>
            </div>

            <aside className="space-y-4">
                <div className="rounded-2xl border border-white/10 p-4">
                    <div className="text-sm text-zinc-400">Course #{meta.courseId}</div>
                    <div className="mt-2 text-zinc-200 text-sm">Author: {meta.author}</div>
                    <div className="mt-1 text-zinc-200 text-sm">Token: {meta.tokenAddress}</div>
                </div>
            </aside>
        </div>
    );
}
