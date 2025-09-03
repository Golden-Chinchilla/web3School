// src/pages/BuyCourse.tsx
import { useState, useMemo, useEffect } from "react";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS } from "../lib/contracts";
import type { Abi } from "viem";

// 这是一个用于展示所有课程的页面
export const BuyCourse = () => {
    const { address, isConnected } = useAccount();

    // 1. 获取已创建的课程总数
    const { data: nextIdData, isLoading: isNextIdLoading, isError: isNextIdError } = useReadContract({
        address: CONTRACTS.CourseRegistry.address,
        abi: CONTRACTS.CourseRegistry.abi,
        functionName: "nextId",
    });

    // --- 调试日志 #1: 检查从合约读取的 nextId ---
    console.log(
        "【调试 #1】读取 nextId:",
        { isLoading: isNextIdLoading, isError: isNextIdError, data: nextIdData }
    );

    // 使用 ?? 0n 更安全，确保在加载完成前不执行循环
    const nextId = (nextIdData as bigint | undefined) ?? 0n;

    const courseIds = useMemo(() => {
        const ids = [];
        // 确认 nextId 是一个已加载的有效值再生成ID列表
        if (nextId > 0n) {
            for (let i = 1; i <= Number(nextId); i++) {
                ids.push(BigInt(i));
            }
        }
        return ids;
    }, [nextId]);

    // --- 调试日志 #2: 检查生成的 courseIds 数组 ---
    console.log("【调试 #2】生成的 courseIds 数组:", courseIds);

    // 2. 批量读取所有课程的详细信息
    const { data: coursesData, isLoading: isCoursesLoading, isError: isCoursesError } = useReadContracts({
        contracts: courseIds.map((courseId) => ({
            address: CONTRACTS.CourseRegistry.address as `0x${string}`,
            abi: CONTRACTS.CourseRegistry.abi as Abi,
            functionName: "courses",
            args: [courseId],
        })),
        query: { enabled: courseIds.length > 0 },
    });

    // --- 调试日志 #3: 检查批量读取的课程结果 ---
    console.log(
        "【调试 #3】批量读取课程详情:",
        { isLoading: isCoursesLoading, isError: isCoursesError, data: coursesData }
    );


    // 3. 批量读取用户的代币授权额度
    const { data: allowancesData, isLoading: isAllowancesLoading } = useReadContracts({
        contracts: courseIds.map((courseId) => ({
            address: CONTRACTS.PHANTOM_TOKEN.address as `0x${string}`,
            abi: CONTRACTS.PHANTOM_TOKEN.abi as Abi,
            functionName: "allowance" as const,
            args: [address, CONTRACTS.CourseRegistry.address],
        })),
        query: { enabled: !!address && courseIds.length > 0 },
    });

    const [processingId, setProcessingId] = useState<bigint | null>(null);
    const { data: hash, writeContractAsync, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTxError, error: txError } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isConfirmed) {
            setProcessingId(null);
        }
    }, [isConfirmed]);

    const handleAction = async (courseId: bigint, needed: bigint, action: 'approve' | 'buy') => {
        if (!isConnected) return;
        setProcessingId(courseId);
        try {
            if (action === 'approve') {
                await writeContractAsync({
                    address: CONTRACTS.PHANTOM_TOKEN.address,
                    abi: CONTRACTS.PHANTOM_TOKEN.abi,
                    functionName: "approve",
                    args: [CONTRACTS.CourseRegistry.address, needed],
                });
            } else {
                await writeContractAsync({
                    address: CONTRACTS.CourseRegistry.address,
                    abi: CONTRACTS.CourseRegistry.abi,
                    functionName: "purchase",
                    args: [courseId],
                });
            }
        } catch (error) {
            console.error("Transaction failed:", error);
            setProcessingId(null);
        }
    };

    const displayError = isTxError && txError?.message;

    // --- 调试日志 #4: 渲染前最终检查 ---
    console.log(
        "【调试 #4】渲染前最终检查:",
        {
            shouldShowLoading: isCoursesLoading || isAllowancesLoading,
            shouldShowEmpty: (coursesData?.length ?? 0) === 0
        }
    );

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
            <h1 className="text-3xl font-bold mb-6 text-center">所有课程</h1>

            {(isCoursesLoading || isAllowancesLoading) && !coursesData ? (
                <p className="text-center text-gray-500 mt-6">正在加载课程...</p>
            ) : (coursesData?.length ?? 0) === 0 ? (
                <p className="text-center text-gray-500 mt-6">暂无课程可供购买。（请检查控制台调试信息）</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coursesData?.map((course, index) => {
                        if (!course || course.status !== 'success' || !course.result) {
                            // --- 调试日志 #5: 某个课程数据读取失败 ---
                            console.error(`【调试 #5】课程ID ${courseIds[index]} 数据读取失败:`, course);
                            return null;
                        }

                        const allowanceResult = allowancesData?.[index];
                        if (!allowanceResult || allowanceResult.status !== 'success') {
                            console.warn(`Allowance data for course ${courseIds[index]} is not available.`);
                        }

                        const courseId = courseIds[index];
                        const courseInfo = course.result as unknown as { author: string; price: bigint; exists: boolean };
                        const allowance = (allowanceResult?.result as bigint | undefined) ?? 0n;

                        if (!courseInfo?.exists) return null;

                        const price = formatUnits(courseInfo.price, 18);
                        const isEnough = allowance >= courseInfo.price;
                        const isProcessing = processingId === courseId;

                        return (
                            <div key={Number(courseId)} className="border p-4 rounded-lg shadow-sm flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-bold mb-2">课程 #{Number(courseId)}</h2>
                                    <p className="text-gray-600 mb-1">作者: <span className="font-mono text-xs break-all">{courseInfo.author}</span></p>
                                    <p className="text-gray-600">价格: <span className="font-bold text-lg text-green-600">{price} PHT</span></p>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => handleAction(courseId, courseInfo.price, 'approve')}
                                        disabled={!isConnected || isEnough || isProcessing}
                                        className="flex-1 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(courseId, courseInfo.price, 'buy')}
                                        disabled={!isConnected || !isEnough || isProcessing}
                                        className="flex-1 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
                                    >
                                        Buy
                                    </button>
                                </div>
                                {isProcessing && (
                                    <div className="mt-2 text-center text-sm">
                                        {isPending ? (
                                            <p className="text-blue-500">等待钱包确认...</p>
                                        ) : isConfirming ? (
                                            <p className="text-yellow-500">等待链上确认...</p>
                                        ) : isConfirmed ? (
                                            <p className="text-green-600">✅ 交易成功！</p>
                                        ) : displayError ? (
                                            <p className="text-red-500">❌ 交易失败</p>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {!isConnected && (
                <p className="text-center text-gray-500 mt-6">请先连接钱包来查看课程。</p>
            )}
        </div>
    );
};