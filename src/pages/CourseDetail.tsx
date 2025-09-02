// src/pages/CourseDetail.tsx
import { useParams, Link } from "react-router";
import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS } from "../lib/contracts";
import { useState } from "react";

const videos: Record<string, string> = {
    "1": "https://www.w3schools.com/html/mov_bbb.mp4",
    "2": "https://www.w3schools.com/html/movie.mp4",
    "3": "https://www.w3schools.com/html/mov_bbb.mp4",
};

export const CourseDetail = () => {
    const { id } = useParams();
    const { address, isConnected } = useAccount();
    const [done, setDone] = useState(false);

    const { data: balance } = useReadContract({
        address: CONTRACTS.CoursePass1155.address,
        abi: CONTRACTS.CoursePass1155.abi,
        functionName: "balanceOf",
        args: address && id ? [address, BigInt(id)] : undefined,
        query: { enabled: !!address && !!id },
    });

    if (!id) return <div className="p-6 text-red-500">无效课程</div>;
    const owned = (balance ?? 0n) > 0n;
    const videoUrl = videos[id];

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-3">课程 #{id}</h1>

            {!isConnected && (
                <div className="mb-4 text-sm text-gray-600">
                    你还未连接钱包，请先右上角连接。
                </div>
            )}

            {!owned ? (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                    你还没有该课程的通行证。请先
                    <Link to={`/buy/${id}`} className="text-blue-600 underline ml-1">
                        购买
                    </Link>
                    。
                </div>
            ) : (
                <>
                    <video
                        key={id}
                        className="w-full rounded border"
                        controls
                        onEnded={() => setDone(true)}
                    >
                        <source src={videoUrl} type="video/mp4" />
                    </video>
                    {done && (
                        <p className="mt-3 text-green-600 font-medium">✅ 已完成观看</p>
                    )}
                </>
            )}
        </div>
    );
}
