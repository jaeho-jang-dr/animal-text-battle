'use client';

import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import BottomNav from '../../components/BottomNav';

export default function ProfilePage() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen pb-24 bg-slate-50">
            <div className="bg-white p-6 shadow-sm mb-6 rounded-b-2xl">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                        설정 및 프로필
                    </h1>
                </div>
            </div>

            <main className="p-6 space-y-6 max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl">
                            👤
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                {user?.display_name || '게스트'}
                            </h2>
                            <p className="text-slate-500 text-sm">
                                {user?.email || '비회원 로그인 중'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4"
                >
                    <h3 className="font-bold text-slate-700">계정 관리</h3>

                    <button
                        onClick={() => logout()}
                        className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                        👋 로그아웃
                    </button>
                </motion.div>

                <div className="text-center text-slate-400 text-xs mt-8">
                    Animal Text Battle v0.0.9
                </div>
            </main>
        </div>
    );
}
