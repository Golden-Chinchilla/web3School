// src/layouts/AppLayout.tsx
import { NavLink, Outlet } from "react-router";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function HeaderLayout() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* 顶部导航栏 */}
            <header className="flex items-center justify-between bg-gray-900 text-white px-6 py-4">
                {/* 左侧导航 */}
                <nav className="flex gap-6">
                    <NavLink
                        to="/course/1"
                        className={({ isActive }) =>
                            `hover:text-yellow-400 ${isActive ? "text-yellow-400 font-semibold" : ""}`
                        }
                    >
                        课程详情
                    </NavLink>
                    <NavLink
                        to="/buy/1"
                        className={({ isActive }) =>
                            `hover:text-yellow-400 ${isActive ? "text-yellow-400 font-semibold" : ""}`
                        }
                    >
                        购买课程
                    </NavLink>
                    <NavLink
                        to="/me"
                        className={({ isActive }) =>
                            `hover:text-yellow-400 ${isActive ? "text-yellow-400 font-semibold" : ""}`
                        }
                    >
                        个人中心
                    </NavLink>
                </nav>

                {/* 右侧连接钱包按钮 */}
                <ConnectButton />
            </header>

            {/* 页面内容 */}
            <main className="flex-1 p-6 bg-gray-50">
                <Outlet />
            </main>
        </div>
    );
}
