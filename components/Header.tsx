'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiBookOpen, FiAward, FiUser, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: '홈', path: '/play', icon: FiHome },
    { name: '도감', path: '/animals', icon: FiBookOpen },
    { name: '랭킹', path: '/leaderboard', icon: FiAward },
    { name: '프로필', path: '/profile', icon: FiUser },
    { name: '관리자', path: '/admin', icon: () => <span className="text-lg">🦄</span> },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <span className="text-2xl">🦁</span>
          <span className="hidden text-xl font-bold text-gray-900 sm:block font-display tracking-tight">
            동물 텍스트 배틀
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-full border border-white/50">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${active
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                  }`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <item.icon className={`h-4 w-4 ${active ? 'text-white' : ''}`} />
                  <span>{item.name}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right Side: User Profile / Auth */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/profile" className="hidden sm:flex items-center gap-2 rounded-full bg-white/50 px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-white hover:ring-indigo-300 hover:shadow-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <FiUser className="h-3.5 w-3.5" />
                </div>
                <span className="max-w-[100px] truncate">{user.display_name}</span>
              </Link>
              <button
                onClick={() => logout()}
                className="rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="로그아웃"
              >
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105 hover:bg-gray-800 hover:shadow-lg"
            >
              로그인
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden rounded-full p-2 text-gray-600 hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white/90 backdrop-blur-xl overflow-hidden"
          >
            <div className="space-y-1 p-4">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors ${active
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <item.icon className={`h-5 w-5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
              {user && (
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <FiUser className="h-3 w-3" />
                  </div>
                  내 프로필 ({user.display_name})
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
