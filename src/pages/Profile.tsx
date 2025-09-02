// src/pages/Profile.tsx
import { useAccount, useSignMessage, useReadContracts } from "wagmi";
import { useMemo, useState } from "react";
import { CONTRACTS } from "../lib/contracts";

const COURSE_IDS = [1n, 2n, 3n];

export const Profile = () => {
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const [nickname, setNickname] = useState("");

    // 批量读取 1155 余额
    const { data: results } = useReadContracts({
        contracts: COURSE_IDS.map((cid) => ({
            address: CONTRACTS.CoursePass1155.address,
            abi: CONTRACTS.CoursePass1155.abi,
            functionName: "balanceOf",
            args: address ? [address, cid] : undefined,
        })),
        query: { enabled: !!address },
    });

    const owned = useMemo(() => {
        if (!results) return [];
        return results
            .map((r, i) => {
                const v = (r.result ?? 0n) as bigint;
                return v > 0n ? Number(COURSE_IDS[i]) : null;
            })
            .filter(Boolean) as number[];
    }, [results]);

    const handleSign = async () => {
        if (!isConnected || !nickname.trim()) return;
        const msg = `update-name:${nickname.trim()}`;
        const sig = await signMessageAsync({ message: msg });
        alert(`签名成功（演示）：${sig.slice(0, 42)}…\n请在后端验签后保存昵称`);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <section className="bg-white p-5 rounded shadow">
                <h2 className="text-xl font-semibold mb-2">账户</h2>
                <p className="text-gray-700 break-all">
                    地址：{isConnected ? address : "未连接（右上角连接钱包）"}
                </p>
            </section>

            <section className="bg-white p-5 rounded shadow">
                <h2 className="text-xl font-semibold mb-3">修改昵称（签名示例）</h2>
                <div className="flex gap-3">
                    <input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="输入新昵称"
                        className="flex-1 px-3 py-2 border rounded"
                    />
                    <button
                        onClick={handleSign}
                        className="px-4 py-2 bg-indigo-600 text-white rounded"
                    >
                        提交签名
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    实际项目：把 <code>address/msg/signature/nickname</code> POST 到后端验签保存。
                </p>
            </section>

            <section className="bg-white p-5 rounded shadow">
                <h2 className="text-xl font-semibold mb-3">我的课程</h2>
                {owned.length === 0 ? (
                    <p className="text-gray-500">暂无</p>
                ) : (
                    <ul className="list-disc pl-5">
                        {owned.map((id) => (
                            <li key={id}>课程 #{id}</li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
