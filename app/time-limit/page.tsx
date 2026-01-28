"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function TimeLimitPage() {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    // 다음날 자정까지 남은 시간 계산
    const calculateTimeRemaining = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${hours}시간 ${minutes}분`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-100 to-purple-100">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="text-center max-w-md"
      >
        {/* 시계 아이콘 애니메이션 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="text-8xl mb-6"
        >
          ⏰
        </motion.div>

        {/* 메시지 */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          오늘의 게임 시간이 끝났어요!
        </h1>

        <div className="card-animal p-6 mb-6">
          <p className="text-xl text-gray-700 mb-4">
            하루에 정해진 시간만 게임을 하는 건<br />
            건강한 습관이에요! 💪
          </p>

          <div className="bg-yellow-100 rounded-lg p-4 mb-4">
            <p className="font-bold text-lg mb-2">다음 게임까지:</p>
            <p className="text-2xl text-kid-blue font-bold">{timeRemaining || '계산 중...'}</p>
          </div>

          <p className="text-gray-600">
            내일 다시 만나요! 그동안 다른 재미있는 활동을 해보는 건 어때요?
          </p>
        </div>

        {/* 추천 활동 */}
        <div className="card-animal p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-kid-purple">
            🎨 추천 활동
          </h2>
          <div className="grid grid-cols-2 gap-4 text-left">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg p-3 shadow"
            >
              <span className="text-2xl">📚</span>
              <p className="text-sm mt-1">책 읽기</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg p-3 shadow"
            >
              <span className="text-2xl">🎨</span>
              <p className="text-sm mt-1">그림 그리기</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg p-3 shadow"
            >
              <span className="text-2xl">🏃</span>
              <p className="text-sm mt-1">운동하기</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg p-3 shadow"
            >
              <span className="text-2xl">🧩</span>
              <p className="text-sm mt-1">퍼즐 맞추기</p>
            </motion.div>
          </div>
        </div>

        {/* 홈으로 가기 버튼 */}
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
          >
            홈으로 돌아가기
          </motion.button>
        </Link>

        {/* 부모님 메시지 */}
        <p className="text-sm text-gray-500 mt-6">
          💌 부모님께: 자녀의 건강한 게임 습관을 위해 플레이 시간이 제한되었습니다.
        </p>
      </motion.div>

      {/* 움직이는 별들 배경 */}
      <StarBackground />
    </main>
  );
}

function StarBackground() {
  const [stars, setStars] = useState<{ id: number; x: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        duration: Math.random() * 10 + 10,
        delay: Math.random() * 10,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute text-2xl"
          initial={{
            x: star.x,
            y: -50,
          }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 50 : 1000,
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "linear",
          }}
        >
          ⭐
        </motion.div>
      ))}
    </div>
  );
}