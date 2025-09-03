// src/pages/Profile.tsx
import { useAccount, useSignMessage, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useMemo, useState, useEffect } from "react";
import type { Abi } from "viem";
import { CONTRACTS } from "../lib/contracts";
import { parseUnits } from "viem";

const COURSE_IDS = [1n, 2n, 3n] as const;

export const Profile = () => {
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const [nickname, setNickname] = useState("");

    const [coursePrice, setCoursePrice] = useState("");

    const { data: hash, writeContractAsync, isPending: isCreatePending, isError: isCreateWriteError, error: createWriteError } = useWriteContract();

    const { isLoading: isCreateConfirming, isSuccess: isCreateConfirmed, isError: isCreateTxError, error: createTxError } = useWaitForTransactionReceipt({
        hash,
    });

    // 修复：使用 useEffect 监听交易确认成功，并在确认成功后重置表单或执行其他逻辑
    useEffect(() => {
        if (isCreateConfirmed) {
            console.log("课程创建成功!");
            // 交易成功后可以清除输入框
            setCoursePrice("");
            // 也可以在这里添加其他逻辑，例如显示成功提示或刷新页面数据
        }
    }, [isCreateConfirmed]);

    // 批量读取 1155 余额
    const { data: results } = useReadContracts({
        contracts: address
            ? COURSE_IDS.map((cid) => ({
                address: CONTRACTS.CoursePass1155.address as `0x${string}`,
                abi: CONTRACTS.CoursePass1155.abi as Abi,
                functionName: "balanceOf" as const,
                args: [address, cid] as const,
            }))
            : [],
        query: { enabled: !!address },
    });

    const owned = useMemo(() => {
        if (!results) return [];
        return results
            .map((r, i) => {
                const v = (r.result ?? 0n) as bigint;
                return v > 0n ? Number(COURSE_IDS[i]) : null;
            })
            .filter((x): x is number => x !== null);
    }, [results]);

    const handleSign = async () => {
        if (!isConnected || !nickname.trim()) return;
        const msg = `update-nickname:${nickname}`;
        try {
            const signature = await signMessageAsync({ message: msg });
            console.log("签名成功:", signature);
        } catch (error) {
            console.error("签名失败:", error);
        }
    };

    const handleCreateCourse = async () => {
        if (!isConnected || !coursePrice) return;
        try {
            const priceInWei = parseUnits(coursePrice, 18);
            await writeContractAsync({
                address: CONTRACTS.CourseRegistry.address,
                abi: CONTRACTS.CourseRegistry.abi,
                functionName: "createCourse",
                args: [priceInWei],
            });
        } catch (error) {
            console.error("Create course transaction failed:", error);
        }
    };

    // 优先显示最近发生的错误信息，如果没有错误则为 null
    const displayError = (isCreateWriteError && createWriteError?.message) || (isCreateTxError && createTxError?.message) || null;

    return (
        <div className="max-w-xl mx-auto p-6 space-y-6">
            <section className="bg-white p-5 rounded shadow">
                <h2 className="text-xl font-semibold mb-3">连接状态</h2>
                <p className="text-gray-700 break-all">
                    钱包地址: {isConnected ? address : "未连接（右上角连接钱包）"}
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
                <h2 className="text-xl font-semibold mb-3">创建新课程</h2>
                <div className="flex gap-3">
                    <input
                        type="number"
                        value={coursePrice}
                        onChange={(e) => setCoursePrice(e.target.value)}
                        placeholder="输入课程价格 (PHT)"
                        className="flex-1 px-3 py-2 border rounded"
                        min="0"
                    />
                    <button
                        onClick={handleCreateCourse}
                        disabled={!isConnected || !coursePrice || isCreatePending || isCreateConfirming}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                        创建课程
                    </button>
                </div>
                {isCreatePending && <p className="mt-3 text-sm text-blue-500">等待钱包确认...</p>}
                {isCreateConfirming && !isCreateConfirmed && !isCreateTxError && <p className="mt-3 text-sm text-yellow-500">正在等待链上确认...</p>}
                {isCreateConfirmed && <p className="mt-3 text-sm text-green-600 font-medium">✅ 课程创建成功！</p>}
                {displayError && (
                    <div className="mt-3 text-sm text-red-500">
                        <p>创建失败: 请检查您的输入或重试。</p>
                        <p className="mt-1 text-xs break-all opacity-70">错误详情: {displayError}</p>
                    </div>
                )}
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
};