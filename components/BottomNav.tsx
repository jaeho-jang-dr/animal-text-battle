import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: '/play', label: '홈', icon: '🏠' },
        { href: '/animals', label: '도감', icon: '📖' },
        { href: '/leaderboard', label: '랭킹', icon: '🏆' },
        { href: '/profile', label: '설정', icon: '⚙️' },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[360px] bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl z-50">
            <div className="flex justify-around items-center p-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} className="w-full" prefetch={true}>
                            <div className="flex flex-col items-center justify-center py-2 relative group">
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute -top-2 w-12 h-1 bg-purple-500 rounded-full"
                                    />
                                )}
                                <span className={`text-2xl transition-transform duration-200 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className={`text-xs font-medium mt-1 ${isActive ? 'text-purple-600' : 'text-gray-400'}`}>
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
