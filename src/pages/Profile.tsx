import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider, Contract, parseUnits, Interface } from "ethers";
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

export function Profile() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [ownedCourses, setOwnedCourses] = useState<CourseMeta[]>([]);
    const [createdCourses, setCreatedCourses] = useState<CourseMeta[]>([]);
    const [form, setForm] = useState({ title: "", description: "", videoUrl: "", price: "" });
    const [status, setStatus] = useState<string | null>(null);

    // 我已购课程
    useEffect(() => {
        (async () => {
            if (!address || !walletClient) return;
            try {
                const res = await fetch(`${API_BASE}/api/courses`);
                const json = await res.json().catch(() => null);
                const all: CourseMeta[] = Array.isArray(json?.items) ? json.items : [];
                const provider = new BrowserProvider(walletClient as any);
                const pass1155 = new Contract(
                    CONTRACTS.CoursePass1155.address,
                    CONTRACTS.CoursePass1155.abi,
                    provider
                );
                const ids = all.map((c) => c.courseId);
                const addrs = ids.map(() => address);
                const balances: bigint[] = await pass1155.balanceOfBatch(addrs, ids);
                const owned = all.filter((_, i) => balances[i] > 0n);
                setOwnedCourses(owned);
            } catch (e) {
                console.error(e);
                setOwnedCourses([]);
            }
        })();
    }, [address, walletClient]);

    // 我创建的课程
    useEffect(() => {
        (async () => {
            if (!address) return;
            try {
                const res = await fetch(`${API_BASE}/api/courses`);
                const json = await res.json().catch(() => null);
                const all: CourseMeta[] = Array.isArray(json?.items) ? json.items : [];
                setCreatedCourses(all.filter((c) => c.author.toLowerCase() === address.toLowerCase()));
            } catch (e) {
                console.error(e);
                setCreatedCourses([]);
            }
        })();
    }, [address]);

    async function handleCreateCourse(e: React.FormEvent) {
        e.preventDefault();
        if (!walletClient || !address) return;

        try {
            setStatus("正在创建课程…");
            const provider = new BrowserProvider(walletClient as any);
            const signer = await provider.getSigner();

            // 1) 上链 createCourse
            const registry = new Contract(
                CONTRACTS.CourseRegistry.address,
                CONTRACTS.CourseRegistry.abi,
                signer
            );
            const priceWei = parseUnits(form.price || "0", 18);
            const tx = await registry.createCourse(priceWei);
            const receipt = await tx.wait();

            // 2) 解析 CourseCreated 事件
            const iface = new Interface(CONTRACTS.CourseRegistry.abi);
            let courseId: number | undefined;
            for (const log of receipt.logs) {
                try {
                    const parsed = iface.parseLog(log);
                    if (parsed?.name === "CourseCreated") {
                        courseId = Number(parsed.args.id);
                        break;
                    }
                } catch { }
            }
            if (courseId === undefined) {
                setStatus("未解析到 CourseCreated 事件 ❌");
                return;
            }

            // 3) 写入后端（CourseMeta）
            const payload: CourseMeta = {
                courseId,
                title: form.title,
                description: form.description,
                videoUrl: form.videoUrl,
                author: address as Address,
                price: priceWei.toString(),
                tokenAddress: CONTRACTS.PHANTOM_TOKEN.address,
                createdAt: Date.now(),
                status: "active",
            };
            const res = await fetch(`${API_BASE}/api/courses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const text = await res.text();
            console.log("[POST /api/courses]", res.status, text.slice(0, 200));
            if (!res.ok) {
                setStatus(`课程创建成功（链上）但写入后端失败：HTTP ${res.status} ${text}`);
                return;
            }

            setStatus("课程创建成功 ✅");
            setForm({ title: "", description: "", videoUrl: "", price: "" });

            // 刷新“我创建的课程”
            const res2 = await fetch(`${API_BASE}/api/courses`);
            const json2 = await res2.json().catch(() => null);
            const all: CourseMeta[] = Array.isArray(json2?.items) ? json2.items : [];
            setCreatedCourses(all.filter((c) => c.author.toLowerCase() === address.toLowerCase()));
        } catch (err) {
            console.error(err);
            setStatus("课程创建失败 ❌");
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">我的主页</h1>

            {/* 我已购课程（可点击进入详情播放） */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-3">我已购课程</h2>
                {ownedCourses.length === 0 ? (
                    <p className="text-sm text-zinc-400">暂无已购课程。</p>
                ) : (
                    <ul className="grid gap-4 md:grid-cols-2">
                        {ownedCourses.map((c) => (
                            <li
                                key={c.courseId}
                                className="rounded-lg border border-white/10 bg-white/[0.03] p-4 hover:border-white/20 transition"
                            >
                                <Link to={`/course/${c.courseId}`} className="block">
                                    <h3 className="font-medium">{c.title}</h3>
                                    <p className="text-sm text-zinc-400 line-clamp-2">{c.description}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* 我创建的课程（也能点进详情） */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-3">我创建的课程</h2>
                {createdCourses.length === 0 ? (
                    <p className="text-sm text-zinc-400">暂无创建课程。</p>
                ) : (
                    <ul className="grid gap-4 md:grid-cols-2">
                        {createdCourses.map((c) => (
                            <li
                                key={c.courseId}
                                className="rounded-lg border border-white/10 bg-white/[0.03] p-4 hover:border-white/20 transition"
                            >
                                <Link to={`/course/${c.courseId}`} className="block">
                                    <h3 className="font-medium">{c.title}</h3>
                                    <p className="text-sm text-zinc-400 line-clamp-2">{c.description}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* 创建课程表单 */}
            <section>
                <h2 className="text-lg font-semibold mb-3">创建课程</h2>
                <form
                    onSubmit={handleCreateCourse}
                    className="space-y-3 max-w-md bg-white/[0.03] p-5 rounded-xl border border-white/10"
                >
                    <input
                        type="text"
                        placeholder="课程标题"
                        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                    />
                    <textarea
                        placeholder="课程描述"
                        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        required
                    />
                    <input
                        type="url"
                        placeholder="视频 URL"
                        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
                        value={form.videoUrl}
                        onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        min="0"
                        step="0.000000000000000001"
                        placeholder="价格 (token)"
                        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        required
                    />
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium hover:bg-indigo-500"
                    >
                        创建课程
                    </button>
                </form>
                {status && (
                    <p className="mt-3 text-sm text-zinc-200 bg-white/5 p-2 rounded">
                        {status}
                    </p>
                )}
            </section>
        </div>
    );
}
