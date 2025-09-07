// src/layouts/HeaderLayout.tsx
import { Outlet, NavLink, Link } from "react-router";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

const navLinkBase =
    "px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:text-white/90";
const navLinkActive =
    "bg-white/5 text-white shadow-sm ring-1 ring-white/10";
const navLinkIdle = "text-zinc-300 hover:bg-white/5";

export function HeaderLayout() {
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    // 可选：从环境变量指定目标链（如 137 = Polygon）
    const targetChainIdRaw = import.meta.env.VITE_CHAIN_ID as
        | string
        | undefined;
    const targetChainId = targetChainIdRaw ? Number(targetChainIdRaw) : NaN;
    const enforceChain = Number.isInteger(targetChainId);
    const wrongNetwork =
        isConnected && enforceChain && chainId !== Number(targetChainId);

    const handleSwitch = () => {
        if (!enforceChain || !switchChain) return;
        // 注意：确保你的 wagmi 配置里包含 targetChainId 对应的链
        switchChain({ chainId: Number(targetChainId) });
    };

    return (
        <div className="min-h-screen bg-[#0b0e11] text-zinc-100">
            {/* 顶部导航 */}
            <header className="sticky top-0 z-50 backdrop-blur bg-[#0b0e11]/70 border-b border-white/10">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="h-16 flex items-center justify-between gap-4">
                        {/* 品牌区 */}
                        <Link to="#" className="flex items-center gap-2 group">
                            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-md group-hover:scale-105 transition-transform" />
                            <span className="font-semibold tracking-wide">
                                Web3School
                            </span>
                        </Link>

                        {/* 导航 */}
                        <nav className="hidden md:flex items-center gap-1">
                            <NavLink
                                to="/buy"
                                className={({ isActive }) =>
                                    `${navLinkBase} ${isActive ? navLinkActive : navLinkIdle}`
                                }
                            >
                                购买课程
                            </NavLink>

                            <NavLink
                                to="/me"
                                className={({ isActive }) =>
                                    `${navLinkBase} ${isActive ? navLinkActive : navLinkIdle}`
                                }
                            >
                                我的
                            </NavLink>
                        </nav>

                        {/* 钱包按钮 */}
                        <div className="flex items-center">
                            <ConnectButton
                                chainStatus="icon"
                                showBalance={false}
                                accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
                            />
                        </div>
                    </div>
                </div>

                {/* 网络不匹配提示（可选） */}
                {wrongNetwork && (
                    <div className="bg-amber-500/10 border-t border-amber-500/30">
                        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between gap-3">
                            <p className="text-sm text-amber-200">
                                当前连接的网络（chainId {chainId}）与项目目标网络（
                                {String(targetChainId)}）不一致。
                            </p>
                            <button
                                onClick={handleSwitch}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-400/20 text-amber-100 hover:bg-amber-400/30 transition-colors"
                            >
                                一键切换
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* 主体容器 */}
            <main className="mx-auto max-w-6xl px-4 py-8">
                {/* 统一卡片化内容区域，风格靠近 Uniswap/Aave */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                    <div className="p-6">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* 页脚（可选） */}
            <footer className="py-8 text-center text-xs text-zinc-500">
                © {new Date().getFullYear()} Web3School · Built with RainbowKit ·
                Ethers · Tailwind
            </footer>
        </div>
    );
}
