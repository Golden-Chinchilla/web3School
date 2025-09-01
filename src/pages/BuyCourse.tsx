import { useState } from "react";
import { useParams } from "react-router";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";

// 假设已经在 lib/contracts.ts 中定义了 ABI & 地址
import { CONTRACTS } from "../lib/contracts";

const courses: Record<string, { title: string; price: string }> = {
    "1": { title: "React 入门课程", price: "10" },
    "2": { title: "区块链基础课程", price: "20" },
    "3": { title: "Web3 DApp 实战课程", price: "30" },
};

export const BuyCourse = () => {
    const { id } = useParams();
    const { address, isConnected } = useAccount();

    const course = id ? courses[id] : null;
    const [status, setStatus] = useState("");

    // Approve 调用
    const { writeContract: approve, isPending: approving } = useWriteContract();
    // Purchase 调用
    const { writeContract: purchase, isPending: buying } = useWriteContract();

    if (!course) {
        return <h1 className="p-6 text-red-500">课程不存在</h1>;
    }

    const handleApprove = async () => {
        if (!isConnected) {
            alert("请先连接钱包");
            return;
        }
        try {
            setStatus("正在授权…");
            await approve({
                address: CONTRACTS.YDToken.address,
                abi: CONTRACTS.YDToken.abi,
                functionName: "approve",
                args: [
                    CONTRACTS.Registry.address, // 授权给业务合约
                    parseUnits(course.price, 18), // 授权额度
                ],
            });
            setStatus("授权成功 ✅");
        } catch (err) {
            console.error(err);
            setStatus("授权失败 ❌");
        }
    };

    const handleBuy = async () => {
        if (!isConnected) {
            alert("请先连接钱包");
            return;
        }
        try {
            setStatus("正在购买课程…");
            await purchase({
                address: CONTRACTS.Registry.address,
                abi: CONTRACTS.Registry.abi,
                functionName: "purchase",
                args: [id], // 传 courseId
            });
            setStatus("购买成功 ✅");
        } catch (err) {
            console.error(err);
            setStatus("购买失败 ❌");
        }
    };

    return (
        <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
            <p className="text-gray-600 mb-4">价格：{course.price} YD</p>

            <div className="flex gap-4">
                <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                >
                    {approving ? "授权中…" : "Approve"}
                </button>

                <button
                    onClick={handleBuy}
                    disabled={buying}
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
                >
                    {buying ? "购买中…" : "Buy"}
                </button>
            </div>

            {status && <p className="mt-4 text-gray-700">{status}</p>}
        </div>
    );
}
