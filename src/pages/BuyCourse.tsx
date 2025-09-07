import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider, Contract, formatUnits } from "ethers";
import { CONTRACTS } from "../lib/contracts";

type Address = `0x${string}`;
type CourseMeta = {
    courseId: number;
    title: string;
    description: string;
    videoUrl: string;
    author: Address;
    price: string;           // wei
    tokenAddress: Address;
    createdAt: number;
    status: "active" | "inactive";
};

const API_BASE = import.meta.env.VITE_WORKER_BASE_URL ?? "";

export function BuyCourse() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const navigate = useNavigate();

    const [courses, setCourses] = useState<CourseMeta[]>([]);
    const [loading, setLoading] = useState(false);
    const [txStatus, setTxStatus] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/courses`, {
                    headers: { Accept: "application/json" },
                });
                const json = await res.json().catch(() => null);
                const list: CourseMeta[] = Array.isArray(json?.items) ? json.items : [];
                setCourses(list);
            } catch (e) {
                console.error(e);
                setCourses([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function handleBuy(course: CourseMeta) {
        if (!walletClient || !address) return;
        try {
            setTxStatus("准备交易…");
            const provider = new BrowserProvider(walletClient as any);
            const signer = await provider.getSigner();

            const price = BigInt(course.price);
            const erc20 = new Contract(
                CONTRACTS.PHANTOM_TOKEN.address,
                CONTRACTS.PHANTOM_TOKEN.abi,
                signer
            );
            const allowance: bigint = await erc20.allowance(
                address,
                CONTRACTS.CourseRegistry.address
            );
            if (allowance < price) {
                setTxStatus("执行 Approve…");
                const txApprove = await erc20.approve(
                    CONTRACTS.CourseRegistry.address,
                    price
                );
                await txApprove.wait();
            }

            const registry = new Contract(
                CONTRACTS.CourseRegistry.address,
                CONTRACTS.CourseRegistry.abi,
                signer
            );
            setTxStatus("购买课程中…");
            const txBuy = await registry.purchase(course.courseId);
            await txBuy.wait();

            setTxStatus("购买成功 ✅，正在跳转到课程…");
            navigate(`/course/${course.courseId}`);
        } catch (err) {
            console.error(err);
            setTxStatus("交易失败 ❌");
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">可购买课程</h1>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-40 rounded-xl border border-white/10 bg-white/[0.04] animate-pulse" />
                    ))}
                </div>
            ) : courses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <div
                            key={course.courseId}
                            className="rounded-xl border border-white/10 bg-white/[0.03] p-5 shadow hover:shadow-lg hover:border-white/20 transition"
                        >
                            <h2 className="text-lg font-semibold">{course.title}</h2>
                            <p className="mt-2 text-sm text-zinc-400 line-clamp-3">
                                {course.description}
                            </p>
                            <p className="mt-4 text-sm text-zinc-200">
                                价格: {formatUnits(course.price, 18)}{" "}
                                {CONTRACTS.PHANTOM_TOKEN.symbol ?? "TOKEN"}
                            </p>

                            <button
                                onClick={() => handleBuy(course)}
                                className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
                            >
                                购买
                            </button>

                            <Link
                                to={`/course/${course.courseId}`}
                                className="mt-2 inline-flex text-xs text-indigo-300 hover:text-indigo-200"
                            >
                                查看详情 →
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-zinc-400">
                    暂无课程可购买。你可以先到
                    <strong className="mx-1 text-zinc-200">“我的” → “创建课程”</strong>
                    添加一门课程。
                </div>
            )}

            {txStatus && (
                <div className="mt-6 p-3 rounded-lg bg-white/5 text-sm text-zinc-200">
                    {txStatus}
                </div>
            )}
        </div>
    );
}
