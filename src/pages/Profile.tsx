import { useState, useMemo } from "react";
import { useAccount, useSignMessage } from "wagmi";

type PurchasedCourse = {
    id: string;
    title: string;
    progress: number; // 0~100，演示用
};

export const Profile = () => {
    const { address, isConnected } = useAccount();

    // —— 昵称修改（签名演示） ——
    const [nickname, setNickname] = useState("");
    const [lastSig, setLastSig] = useState<string | null>(null);

    const { signMessageAsync, isPending: signing } = useSignMessage();

    const handleUpdateNickname = async () => {
        if (!isConnected) {
            alert("请先连接钱包");
            return;
        }
        if (!nickname.trim()) {
            alert("请输入昵称");
            return;
        }
        try {
            const msg = `update-name:${nickname.trim()}`;
            const signature = await signMessageAsync({ message: msg });
            setLastSig(signature);

            // TODO: 实际项目中，把 { address, nickname, msg, signature }
            // 发送到你的后端进行验签，然后写数据库：
            // await fetch("/api/updateName", { method: "POST", body: JSON.stringify({ address, nickname, msg, signature }) })

            alert("签名成功（演示）。已在下方展示签名摘要。");
        } catch (err) {
            console.error(err);
            alert("签名失败，控制台查看详情");
        }
    };

    // —— 已购课程（演示数据；实际请调用合约 hasPurchased 或读你的后端缓存） ——
    const purchased: PurchasedCourse[] = useMemo(
        () => [
            { id: "1", title: "React 入门课程", progress: 100 },
            { id: "2", title: "区块链基础课程", progress: 40 },
            // 需要的话再加：{ id: "3", title: "Web3 DApp 实战课程", progress: 0 }
        ],
        []
    );

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* 基本信息 */}
            <section className="mb-6 bg-white rounded-xl shadow p-5">
                <h2 className="text-xl font-semibold mb-3">个人信息</h2>
                <p className="text-gray-600 break-all">
                    钱包地址：
                    {isConnected ? (
                        <span className="font-mono">{address}</span>
                    ) : (
                        <span className="text-red-500">未连接（请右上角连接钱包）</span>
                    )}
                </p>
            </section>

            {/* 昵称修改（签名） */}
            <section className="mb-6 bg-white rounded-xl shadow p-5">
                <h2 className="text-xl font-semibold mb-3">修改昵称（签名验证示例）</h2>
                <div className="flex gap-3 items-center">
                    <input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="输入新昵称"
                        className="flex-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={handleUpdateNickname}
                        disabled={signing}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60"
                    >
                        {signing ? "签名中…" : "提交签名"}
                    </button>
                </div>

                {lastSig && (
                    <div className="mt-4 text-sm text-gray-700">
                        <p className="mb-1">最近一次签名（前 42 位）：</p>
                        <code className="block p-2 bg-gray-100 rounded break-all">
                            {lastSig.slice(0, 42)}…
                        </code>
                        <p className="mt-2 text-gray-500">
                            说明：这里演示把昵称变更请求用钱包签名。实际项目应把 <code>address/nickname/message/signature</code> 发到后端，后端使用
                            <code>recover</code> 验签后写数据库。
                        </p>
                    </div>
                )}
            </section>

            {/* 已购课程列表（演示） */}
            <section className="bg-white rounded-xl shadow p-5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">我的课程</h2>
                    <span className="text-sm text-gray-500">共 {purchased.length} 门</span>
                </div>

                {purchased.length === 0 ? (
                    <p className="text-gray-500">还没有购买课程</p>
                ) : (
                    <ul className="space-y-3">
                        {purchased.map((c) => (
                            <li
                                key={c.id}
                                className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50"
                            >
                                <div>
                                    <p className="font-medium">{c.title}</p>
                                    <p className="text-sm text-gray-500">课程ID：{c.id}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-40 bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-green-500 h-2"
                                            style={{ width: `${c.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-600">{c.progress}%</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <p className="mt-3 text-xs text-gray-500">
                    * 实际项目中，这里应通过合约 <code>hasPurchased(user, courseId)</code> 或后端接口拉取你已拥有的课程列表。
                </p>
            </section>
        </div>
    );
}
