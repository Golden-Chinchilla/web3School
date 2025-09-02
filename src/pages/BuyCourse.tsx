import { useParams, useNavigate } from "react-router";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { CONTRACTS } from "../lib/contracts";
import { useMemo } from "react";

const priceTable: Record<string, string> = { "1": "10", "2": "20", "3": "30" }; // 演示价

export const BuyCourse = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();
    const { writeContractAsync } = useWriteContract();

    const price = id ? priceTable[id] : undefined;
    const needed = useMemo(
        () => (price ? parseUnits(price, 18) : 0n),
        [price]
    );

    // 读取 allowance，决定是否需要先 Approve
    const { data: allowance } = useReadContract({
        address: CONTRACTS.PHANTOM_TOKEN.address,
        abi: CONTRACTS.PHANTOM_TOKEN.abi,
        functionName: "allowance",
        args: address && id ? [address, CONTRACTS.CourseRegistry.address] : undefined,
        query: { enabled: !!address && !!id && !!price },
    });

    const enough = (allowance ?? 0n) >= needed;

    const handleApprove = async () => {
        if (!isConnected || !price) return;
        await writeContractAsync({
            address: CONTRACTS.PHANTOM_TOKEN.address,
            abi: CONTRACTS.PHANTOM_TOKEN.abi,
            functionName: "approve",
            args: [CONTRACTS.CourseRegistry.address, needed],
        });
        // 省事起见这里不等确认；生产可加等待并刷新 allowance
        alert("授权提交成功，接着点 Buy 完成购买。");
    };

    const handleBuy = async () => {
        if (!isConnected || !id) return;
        await writeContractAsync({
            address: CONTRACTS.CourseRegistry.address,
            abi: CONTRACTS.CourseRegistry.abi,
            functionName: "purchase",
            args: [BigInt(id)],
        });
        alert("购买成功 ✅");
        navigate(`/course/${id}`);
    };

    if (!id || !price) {
        return <div className="p-6 text-red-500">无效课程</div>;
    }

    return (
        <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-2">购买课程 #{id}</h1>
            <p className="text-gray-600 mb-4">
                价格：{price} {CONTRACTS.PHANTOM_TOKEN.symbol}
            </p>

            <div className="flex gap-3">
                {!enough && (
                    <button
                        onClick={handleApprove}
                        disabled={!isConnected}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                        Approve
                    </button>
                )}
                <button
                    onClick={handleBuy}
                    disabled={!isConnected}
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
                >
                    Buy
                </button>
            </div>

            {!isConnected && (
                <p className="mt-3 text-sm text-gray-500">请先右上角连接钱包</p>
            )}
        </div>
    );
}
