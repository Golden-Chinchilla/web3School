import { Outlet, NavLink } from 'react-router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export function HeaderLayout() {
    const { address } = useAccount();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <header className="sticky top-0 z-50 backdrop-blur bg-zinc-950/60 border-b border-white/10">
                <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="font-black tracking-wide text-lg">Web3<span className="text-indigo-400">U</span></div>
                        <nav className="flex items-center gap-4 text-sm">
                            <NavLink to="/" className={({ isActive }) => isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}>Buy</NavLink>
                            <NavLink to="/profile" className={({ isActive }) => isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}>Profile</NavLink>
                        </nav>
                    </div>
                    <ConnectButton showBalance={false} accountStatus={{ smallScreen: 'address', largeScreen: 'full' }} />
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8">
                <Outlet />
            </main>

            <footer className="py-10 text-center text-xs text-zinc-500">© Web3U</footer>
        </div>
    );
}
