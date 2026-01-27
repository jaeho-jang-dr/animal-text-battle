'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface Animal {
  id: number;
  name: string;
  korean_name: string;
  category: string;
  description: string;
  abilities: string;
  emoji: string;
  image_url?: string;
  color?: string;
  attack_power: number;
  strength: number;
  speed: number;
  energy: number;
}

export default function AnimalsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchAnimals();
  }, []);

  const isLoggedIn = !!user;

  const fetchAnimals = async () => {
    try {
      const response = await fetch('/api/animals');
      const data = await response.json();
      if (data.success) {
        setAnimals(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch animals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnimals = animals.filter(animal => {
    const matchesCategory = selectedCategory === 'all' || animal.category === selectedCategory;
    const matchesSearch = searchTerm === '' ||
      animal.korean_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'current': return '🌍 현존 동물';
      case 'mythical': return '✨ 전설의 동물';
      case 'prehistoric': return '🦖 고생대 동물';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'current': return 'from-green-400 to-blue-500';
      case 'mythical': return 'from-purple-400 to-pink-500';
      case 'prehistoric': return 'from-orange-400 to-red-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 shadow-lg rounded-b-3xl mb-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">🦁 동물 도감</h1>
          <p className="text-purple-200">다양한 동물들을 만나보세요!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* 검색 바 */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="동물 이름을 검색해보세요..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 pr-4 text-lg border-2 border-purple-300 rounded-full focus:outline-none focus:border-purple-500"
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl">🔍</span>
          </div>
        </div>

        {/* 통계 표시 */}
        {stats && (
          <div className="text-center mb-6">
            <p className="text-lg text-gray-600">
              전체 <span className="font-bold text-purple-600">{stats.total}</span>마리의 동물이 있어요!
            </p>
          </div>
        )}

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-full font-bold transition-all duration-200 transform hover:scale-105 ${selectedCategory === 'all'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            전체 보기
          </button>
          {['current', 'mythical', 'prehistoric'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-bold transition-all duration-200 transform hover:scale-105 ${selectedCategory === category
                ? `bg-gradient-to-r ${getCategoryColor(category)} text-white shadow-lg`
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              <span>{getCategoryName(category)}</span>
              {stats && (
                <span className="ml-2 text-sm opacity-90">
                  ({stats.byCategory[category as keyof typeof stats.byCategory]})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 동물 그리드 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-4xl animate-bounce">🦄</div>
            <p className="text-gray-600 mt-4">동물들을 불러오는 중...</p>
          </div>
        ) : filteredAnimals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😔</div>
            <p className="text-gray-600">검색 결과가 없어요...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {filteredAnimals.map((animal, index) => (
              <motion.div
                key={animal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 1) }}
                whileHover={{ scale: 1.1, zIndex: 10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedAnimal(animal)}
                className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-xl transition-all duration-200 relative"
                style={{
                  backgroundColor: animal.color ? `${animal.color}15` : 'white',
                  borderColor: animal.color || '#e5e7eb',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <div className="text-4xl text-center mb-2" style={{ color: animal.color || 'inherit' }}>{animal.emoji}</div>
                <h3 className="font-bold text-center text-xs text-gray-800 line-clamp-1">{animal.korean_name}</h3>
                <div className={`mt-2 h-0.5 rounded-full bg-gradient-to-r ${getCategoryColor(animal.category)}`} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 동물 상세 모달 */}
      <AnimatePresence>
        {selectedAnimal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAnimal(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* 모달 헤더 */}
              <div className={`bg-gradient-to-r ${getCategoryColor(selectedAnimal.category)} p-8 text-white relative`}>
                <button
                  onClick={() => setSelectedAnimal(null)}
                  className="absolute top-4 right-4 text-3xl hover:scale-110 transition-transform"
                >
                  ✕
                </button>
                <div className="text-8xl text-center mb-4">{selectedAnimal.emoji}</div>
                <h2 className="text-3xl font-bold text-center">{selectedAnimal.korean_name}</h2>
                <p className="text-xl text-center mt-2 opacity-90">{selectedAnimal.name}</p>
              </div>

              {/* 모달 내용 */}
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <span>📖</span> 설명
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{selectedAnimal.description}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <span>⚡</span> 특수 능력
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{selectedAnimal.abilities}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <span>🏷️</span> 분류
                  </h3>
                  <span className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${getCategoryColor(selectedAnimal.category)} text-white font-bold`}>
                    {getCategoryName(selectedAnimal.category)}
                  </span>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <span>📊</span> 능력치
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-red-700">⚔️ 공격력</span>
                        <span className="font-bold text-red-800">{selectedAnimal.attack_power}</span>
                      </div>
                      <div className="w-full bg-red-200 rounded-full h-2.5">
                        <div
                          className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${selectedAnimal.attack_power}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-orange-700">💪 힘</span>
                        <span className="font-bold text-orange-800">{selectedAnimal.strength}</span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-2.5">
                        <div
                          className="bg-orange-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${selectedAnimal.strength}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-700">🏃 속도</span>
                        <span className="font-bold text-blue-800">{selectedAnimal.speed}</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${selectedAnimal.speed}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-green-700">⚡ 에너지</span>
                        <span className="font-bold text-green-800">{selectedAnimal.energy}</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${selectedAnimal.energy}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-center p-3 bg-gray-100 rounded-lg">
                    <span className="text-sm text-gray-600">총 능력치: </span>
                    <span className="font-bold text-gray-800">
                      {selectedAnimal.attack_power + selectedAnimal.strength + selectedAnimal.speed + selectedAnimal.energy}
                    </span>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="mt-8">
                  {isLoggedIn ? (
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          router.push(`/create-character?animal=${selectedAnimal.id}`);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 flex items-center justify-center gap-2 mx-auto"
                      >
                        ✅ 이 동물로 시작하기
                      </button>
                    </div>
                  ) : (
                    <div className="text-center mb-4">
                      <button
                        onClick={() => {
                          // Save redirection intention
                          localStorage.setItem('auth_redirect', `/create-character?animal=${selectedAnimal.id}`);
                          router.push('/');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 flex items-center justify-center gap-2 mx-auto"
                      >
                        ✅ 이 동물로 시작하기
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedAnimal(null)}
                    className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all duration-200"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}