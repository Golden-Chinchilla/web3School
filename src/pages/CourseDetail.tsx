import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider, Contract } from "ethers";
import { CONTRACTS } from "../lib/contracts";

type Address = `0x${string}`;
type CourseMeta = {
    courseId: number;
    title: string;
    description: string;
    videoUrl: string;
    author: Address;
    price: string;
    tokenAddress: Address;
    createdAt: number;
    status: "active" | "inactive";
};

const API_BASE = import.meta.env.VITE_WORKER_BASE_URL ?? "";

export function CourseDetail() {
    const { id } = useParams<{ id: string }>();
    const courseId = Number(id);

    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [course, setCourse] = useState<CourseMeta | null>(null);
    const [owned, setOwned] = useState(false);
    const [playToken, setPlayToken] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    // 拉详情
    useEffect(() => {
        (async () => {
            if (!courseId) return;
            try {
                const res = await fetch(`${API_BASE}/api/courses/${courseId}`);
                if (!res.ok) return;
                const data = await res.json();
                setCourse(data as CourseMeta);
            } catch (e) {
                console.error(e);
            }
        })();
    }, [courseId]);

    // 检查是否持有
    useEffect(() => {
        (async () => {
            if (!walletClient || !address || !courseId) return;
            try {
                const provider = new BrowserProvider(walletClient as any);
                const signer = await provider.getSigner();
                const pass1155 = new Contract(
                    CONTRACTS.CoursePass1155.address,
                    CONTRACTS.CoursePass1155.abi,
                    signer
                );
                const bal: bigint = await pass1155.balanceOf(address, courseId);
                setOwned(bal > 0n);
            } catch (e) {
                console.error(e);
            }
        })();
    }, [walletClient, address, courseId]);

    async function handlePlay() {
        if (!walletClient || !address || !courseId) return;
        try {
            setStatus("生成播放令牌…");
            const provider = new BrowserProvider(walletClient as any);
            const signer = await provider.getSigner();

            const nonce = crypto.randomUUID();
            const ts = Date.now();
            const message =
                `web3u:play\n` +
                `addr=${address}\n` +
                `courseId=${courseId}\n` +
                `ts=${ts}\n` +
                `nonce=${nonce}`;

            const signature = await signer.signMessage(message);

            const res = await fetch(`${API_BASE}/api/auth/issue-play-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId, address, message, signature }),
            });
            const data = await res.json().catch(() => null);

            if (res.ok && data?.token) {
                setPlayToken(data.token);
                setStatus("播放令牌已生成 ✅");
            } else {
                setStatus(`生成播放令牌失败：${data?.error || res.status}`);
            }
        } catch (err) {
            console.error(err);
            setStatus("播放失败 ❌");
        }
    }

    return (
        <div>
            {!course ? (
                <p className="text-zinc-400">加载中…</p>
            ) : (
                <div className="space-y-6">
                    <header>
                        <h1 className="text-2xl font-bold">{course.title}</h1>
                        <p className="mt-2 text-sm text-zinc-400">{course.description}</p>
                    </header>

                    {owned ? (
                        <div className="space-y-4">
                            <button
                                onClick={handlePlay}
                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium"
                            >
                                播放课程
                            </button>

                            {playToken && (
                                <div className="rounded-lg bg-black/30 border border-white/10 p-4">
                                    <p className="text-sm text-zinc-300 mb-2">播放令牌已生成，可播放视频：</p>
                                    <video
                                        controls
                                        className="w-full rounded-lg border border-white/10"
                                        src={`${API_BASE}/api/play?courseId=${courseId}&token=${playToken}`}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 bg-white/5 rounded-lg text-sm">
                            你尚未购买本课程。
                            <Link to="/buy" className="ml-2 text-indigo-400 hover:underline">去购买 →</Link>
                        </div>
                    )}

                    {status && <p className="text-sm text-zinc-200 bg-white/5 p-2 rounded">{status}</p>}
                </div>
            )}
        </div>
    );
}
