'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'main' | 'email' | 'guest'>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [dailyBattleLimit, setDailyBattleLimit] = useState(10);

  const {
    user,
    isLoading: authLoading,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    guestLogin,
    logout
  } = useAuth();

  const router = useRouter();

  useEffect(() => {
    loadBattleLimit();
  }, []);

  const loadBattleLimit = async () => {
    try {
      const response = await fetch(`/api/settings/battle-limit?_t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDailyBattleLimit(data.data.dailyBattleLimit);
        }
      }
    } catch (error) {
      console.error('Failed to load battle limit:', error);
    }
  };

  // Automatic redirect removed to allow users to see the landing page.
  useEffect(() => {
    router.prefetch('/play');
  }, [router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      if (isLoginMode) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = '인증 중 오류가 발생했습니다.';
      switch (error.code) {
        case 'auth/operation-not-allowed':
          message = '⚠️ 이메일/비밀번호 로그인이 설정되지 않았습니다.\nFirebase Console > Build > Authentication > Sign-in method에서 "이메일/비밀번호"를 사용 설정해주세요.';
          break;
        case 'auth/user-not-found':
        case 'auth/invalid-login-credentials':
          message = '가입되지 않은 이메일이거나 비밀번호가 틀렸습니다.';
          break;
        case 'auth/email-already-in-use':
          message = '이미 가입된 이메일입니다.';
          break;
        case 'auth/weak-password':
          message = '비밀번호는 6자 이상이어야 합니다.';
          break;
        case 'auth/invalid-email':
          message = '잘못된 이메일 형식입니다.';
          break;
        case 'auth/popup-closed-by-user':
          return; // Ignore popup closed
      }
      alert(message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error('Google login error:', error);
      alert('구글 로그인 실패: ' + error.message);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await guestLogin();
    } catch (error: any) {
      console.error('Guest login failed:', error);
      alert('게스트 로그인 실패: ' + error.message);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white/50 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-x-hidden">

      {/* Global Header is used instead of local nav to prevent duplication */}

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-12 pb-32 overflow-hidden">
          {/* Quick Links for Landing Page Content - positioned to be non-intrusive */}
          <div className="absolute top-4 right-4 md:right-12 z-20 flex gap-6 text-sm font-bold text-gray-400">
            <a href="#rules" className="hover:text-purple-600 transition-colors flex items-center gap-1">📜 규칙</a>
            <a href="#scoring" className="hover:text-purple-600 transition-colors flex items-center gap-1">💯 점수</a>
          </div>

          {/* Background Elements */}
          <div className="absolute top-20 left-10 text-9xl opacity-10 animate-blob">🦒</div>
          <div className="absolute bottom-20 right-10 text-9xl opacity-10 animate-blob animation-delay-2000">🐘</div>
          <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="inline-block bg-white/80 backdrop-blur rounded-full px-4 py-1 text-sm font-bold text-purple-600 border border-purple-100 shadow-sm">
                  ✨ 상상력이 힘이 되는 곳
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">애니멀 챗팅 배틀</span>에<br />
                  오신 것을 환영합니다!
                </h1>
                <p className="text-lg text-slate-600 leading-relaxed">
                  나만의 동물 친구를 만들고, 전 세계 친구들(그리고 20마리의 NPC!)과
                  상상력 대결을 펼쳐보세요.
                  가장 창의적이고 강력한 묘사로 아레나의 챔피언이 되어보세요!
                </p>

                {/* Arena Illustration (CSS Art/Emoji Layout) */}
                <div className="mt-8 p-6 bg-white/60 backdrop-blur rounded-3xl shadow-xl border-4 border-white/50 transform rotate-1 hover:rotate-0 transition-transform duration-500 hidden md:block">
                  <div className="aspect-[16/9] bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center relative overflow-hidden group border-2 border-indigo-50">
                    {/* Decorative Arena Elements */}
                    <div className="absolute bottom-0 w-full h-1/3 bg-green-100/50 rounded-t-[50%] scale-150"></div>
                    <div className="text-9xl group-hover:scale-110 transition-transform duration-500 z-10 drop-shadow-2xl">🏟️</div>
                    <div className="absolute top-4 right-4 text-4xl animate-bounce">🦄</div>
                    <div className="absolute top-4 left-4 text-4xl animate-pulse">🐉</div>
                    <div className="absolute bottom-4 left-4 text-sm font-bold text-purple-500 bg-white/80 px-3 py-1 rounded-full">Battle Arena</div>
                  </div>
                  <p className="text-center mt-3 font-bold text-slate-500">전설의 배틀 아레나에서 만나요!</p>
                </div>
              </motion.div>

              {/* Login/Action Card */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/50 relative"
              >
                {!user ? (
                  <AnimatePresence mode="wait">
                    {currentView === 'main' && (
                      <motion.div
                        key="main"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                      >
                        <div className="text-center mb-8">
                          <div className="text-6xl mb-4 animate-bounce">🦁</div>
                          <h2 className="text-3xl font-bold text-slate-800">모험 시작하기</h2>
                          <p className="text-slate-500">로그인하고 나만의 캐릭터를 만들어보세요!</p>
                        </div>

                        <div className="space-y-3">
                          <button
                            onClick={handleGoogleLogin}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 px-6 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
                          >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                            <span className="text-lg">구글 계정으로 계속하기</span>
                          </button>

                          <button
                            onClick={() => setCurrentView('email')}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
                          >
                            <span className="text-xl">✉️</span> 이메일로 시작하기
                          </button>

                          <div className="relative border-t border-slate-200 my-4">
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-slate-400">또는</span>
                          </div>

                          <button
                            onClick={handleGuestLogin}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all"
                          >
                            <span className="text-xl">🎮</span> 게스트로 체험하기
                          </button>
                        </div>
                      </motion.div>
                    )}
                    {currentView === 'email' && (
                      <motion.div key="email" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}>
                        <div className="text-center mb-6">
                          <h3 className="text-2xl font-bold text-slate-800">{isLoginMode ? '이메일 로그인' : '새 계정 만들기'}</h3>
                        </div>
                        <form onSubmit={handleEmailAuth} className="space-y-4">
                          <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 transition-all" required />
                          <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-400 transition-all" required minLength={6} />
                          <button type="submit" className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-purple-700 transition-all transform hover:scale-[1.02]">{isLoginMode ? '로그인' : '가입하기'}</button>
                        </form>
                        <div className="mt-4 flex justify-between text-sm font-medium">
                          <button onClick={() => setCurrentView('main')} className="text-slate-500 hover:text-slate-800">← 뒤로가기</button>
                          <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-purple-600 hover:text-purple-800">{isLoginMode ? '계정이 없나요?' : '로그인하기'}</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-10">
                    <div className="text-6xl mb-4 animate-bounce">🦁</div>
                    <h2 className="text-2xl font-bold mb-4 text-slate-800">준비 완료!</h2>
                    <p className="text-slate-600 mb-8">이제 캐릭터를 만들고 배틀을 시작해보세요.</p>
                    <button
                      onClick={() => router.push('/play')}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg"
                    >
                      내 캐릭터 관리 화면으로 이동 🚀
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Game Rules Section */}
        <section id="rules" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-purple-600 font-bold tracking-wider uppercase bg-purple-100 px-3 py-1 rounded-full text-sm">How to Play</span>
              <h2 className="text-4xl font-black text-slate-900 mt-4">게임 방법 🎮</h2>
              <p className="text-slate-500 mt-2">간단한 3단계로 배틀을 시작하세요!</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-shadow hover:-translate-y-1 transform duration-300">
                <div className="text-5xl mb-6 bg-white w-20 h-20 flex items-center justify-center rounded-2xl shadow-sm mx-auto">1️⃣</div>
                <h3 className="text-xl font-bold mb-4 text-center">캐릭터 생성</h3>
                <p className="text-slate-600 text-center leading-relaxed">
                  로그인 후 최대 <b>3개</b>까지 나만의 캐릭터를 만들 수 있어요.
                  <br /><b>동물 도감</b>을 참고해서 동물의 특징을 살려보세요!
                </p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-shadow hover:-translate-y-1 transform duration-300">
                <div className="text-5xl mb-6 bg-white w-20 h-20 flex items-center justify-center rounded-2xl shadow-sm mx-auto">2️⃣</div>
                <h3 className="text-xl font-bold mb-4 text-center">리더보드 & NPC 배틀</h3>
                <p className="text-slate-600 text-center leading-relaxed">
                  리더보드에 대기 중인 <b>20마리의 NPC</b>들에게 도전하세요.
                  <br />나의 강력함을 증명하고 랭킹을 올려보세요!
                </p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-shadow hover:-translate-y-1 transform duration-300">
                <div className="text-5xl mb-6 bg-white w-20 h-20 flex items-center justify-center rounded-2xl shadow-sm mx-auto">3️⃣</div>
                <h3 className="text-xl font-bold mb-4 text-center">AI 심판과 랭킹</h3>
                <p className="text-slate-600 text-center leading-relaxed">
                  배틀은 공정한 <b>AI 심판</b>이 판정합니다.
                  승리하면 점수가 오르고, 1-3위에게는<br />특별한 <b>뱃지</b>가 수여됩니다! 🥇
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Scoring System Section */}
        <section id="scoring" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-indigo-600 font-bold tracking-wider uppercase bg-indigo-100 px-3 py-1 rounded-full text-sm">System</span>
                <h2 className="text-4xl font-black text-slate-900 mb-6 mt-4">📊 점수 계산 방식</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-3 rounded-2xl text-green-600 font-bold text-xl min-w-[60px] text-center">ELO</div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800">국제 체스 랭킹 시스템 (ELO)</h4>
                      <p className="text-slate-600 text-sm mt-1">자신보다 강한 상대를 이기면 더 많은 점수를 얻고, 약한 상대에게 지면 더 많은 점수를 잃습니다. 실력이 비슷할수록 공정한 대결이 됩니다.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 font-bold text-xl min-w-[60px] text-center">WIN</div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800">기본 승리 보상</h4>
                      <p className="text-slate-600 text-sm mt-1">승리 시 기본 점수 <b>+10점</b>은 보장됩니다. 연승 시 보너스 점수가 추가될 수 있습니다!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-2xl text-red-600 font-bold text-xl min-w-[60px] text-center">AI</div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800">AI 심판의 판정 요소</h4>
                      <ul className="text-slate-600 text-sm mt-2 space-y-1 list-disc list-inside">
                        <li><b>논리성</b>: 말이 되는 공격인가?</li>
                        <li><b>창의성</b>: 기발한 묘사인가?</li>
                        <li><b>특성 반영</b>: 동물의 실제 능력을 활용했는가?</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 transform rotate-2 hover:rotate-0 transition-all duration-500">
                <div className="text-center border-b border-gray-100 pb-6 mb-6">
                  <div className="text-6xl mb-2">🏆</div>
                  <h3 className="text-2xl font-bold text-slate-800">랭킹 보상</h3>
                  <p className="text-slate-400 text-sm">명예의 전당에 이름을 올리세요!</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🥇</span>
                      <span className="font-bold text-yellow-800">1위 (Champion)</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-600 px-3 py-1 bg-yellow-100 rounded-full">골드 뱃지</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🥈</span>
                      <span className="font-bold text-gray-700">2위 (Master)</span>
                    </div>
                    <span className="text-sm font-bold text-gray-600 px-3 py-1 bg-gray-200 rounded-full">실버 뱃지</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🥉</span>
                      <span className="font-bold text-orange-800">3위 (Expert)</span>
                    </div>
                    <span className="text-sm font-bold text-orange-600 px-3 py-1 bg-orange-100 rounded-full">브론즈 뱃지</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white/50 backdrop-blur py-8 border-t border-white/20">
          <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
            <p>© 2026 Animal Text Battle. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <a href="/privacypolicy" className="hover:text-purple-600">개인정보처리방침</a>
              <a href="/terms" className="hover:text-purple-600">이용약관</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}