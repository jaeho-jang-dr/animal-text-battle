'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function AdminButton() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const { user, isLoading } = useAuth();

  // 관리자 이메일 목록
  const adminEmails = ['drjang000@gmail.com', 'drjang00@gmail.com', '102030hohoho@gmail.com'];
  const isAdmin = user && user.email && adminEmails.includes(user.email);

  const handleClick = () => {
    if (isAdmin) {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  // 로딩 중이거나 렌더링 준비가 안되었을 때는 표시하지 않음 (선택적)
  if (isLoading) {
    return null;
  }

  // 관리자가 아니면 버튼을 숨길 수도 있음.
  // 여기서는 로그인 상태면 보여주는 것으로 유지하거나, 원래대로 유지.
  // 원래 코드는 "관리자 토큰"이 없으면 "로그인"이라고 표시했음.
  // 하지만 이제 메인 페이지에서 로그인을 하므로, 
  // 이 버튼은 '관리자' 접근용으로만 사용하거나 숨기는 게 나을 수 있음.
  // 일단 '관리자'인 경우에만 특별하게 표시하고, 아니면 숨기는 방향으로 변경 고려.
  // 또는 '홈으로' 버튼 역할을 할 수도 있음.

  // 변경: 단순화를 위해 '관리자' 페이지로 이동하는 히든 버튼처럼 유지하되,
  // 로그인 상태를 useAuth로 체크.

  if (!isAdmin) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.3 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ opacity: 0.9 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.5
        }}
        className="fixed bottom-4 right-4 z-50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className={`relative w-10 h-10 rounded-full shadow-sm transition-all duration-300 ${isAdmin
            ? 'bg-gradient-to-br from-purple-400/50 to-pink-400/50'
            : 'bg-gradient-to-br from-gray-300/50 to-gray-400/50'
            } hover:shadow-lg backdrop-blur-sm`}
        >
          <motion.span
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl absolute inset-0 flex items-center justify-center opacity-70"
          >
            🦄
          </motion.span>

          {/* 호버 시 텍스트 표시 */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
              >
                <div className="bg-purple-800/90 text-white px-2 py-1 rounded-md shadow-md text-xs">
                  <span className="font-medium">
                    {isAdmin ? '관리자' : '홈으로'}
                  </span>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                    <div className="border-4 border-transparent border-l-purple-800/90"></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* 반짝이는 효과 - 호버 시에만 표시 */}
        {isHovered && (
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300/30 to-pink-300/30 pointer-events-none"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}