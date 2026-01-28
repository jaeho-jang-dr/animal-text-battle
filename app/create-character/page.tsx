'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { Character, Animal } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateCharacterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const animalId = searchParams.get('animal');

  const { user, firebaseUser, isLoading: authLoading } = useAuth(); // Use AuthContext

  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [battleText, setBattleText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingCharacters, setExistingCharacters] = useState<Character[]>([]);
  const [error, setError] = useState('');

  // New State for Modal
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);
  const [allAnimals, setAllAnimals] = useState<Animal[]>([]);

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    // Only fetch user-specific data here
    fetchUserCharacters();
  }, [user, authLoading]);

  // Animal fetch check (Independent)
  useEffect(() => {
    if (animalId) {
      fetchAnimal(animalId);
    }
  }, [animalId]);

  const fetchUserCharacters = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'characters'),
        where('userId', '==', user.id),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      const chars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Character));

      setExistingCharacters(chars);
      if (chars.length >= 3) {
        alert('캐릭터는 최대 3개까지만 만들 수 있어요!');
        router.push('/play');
      }
    } catch (error) {
      console.error('Failed to fetch characters:', error);
    }
  };

  const fetchAnimal = async (id: string) => {
    try {
      // Force freshness
      const response = await fetch(`/api/animals?t=${Date.now()}`);
      const data = await response.json();
      if (data.success) {
        const animal = data.data.find((a: Animal) => a.id === parseInt(id));
        if (animal) {
          setSelectedAnimal(animal);
        } else {
          console.warn("Animal not found for ID:", id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch animal:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAnimal) {
      setError('동물을 선택해주세요!');
      return;
    }

    if (characterName.length < 2 || characterName.length > 20) {
      setError('이름은 2자 이상 20자 이하로 입력해주세요!');
      return;
    }

    if (battleText.length < 10 || battleText.length > 100) {
      setError('배틀 텍스트는 10자 이상 100자 이하로 입력해주세요!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (!user) throw new Error("로그인이 필요합니다.");

      const characterId = uuidv4();
      const newCharacter = {
        id: characterId,
        userId: user.id,
        animalId: selectedAnimal.id,
        characterName,
        battleText,
        // Default stats
        baseScore: 1000,
        eloScore: 1000,
        wins: 0,
        losses: 0,
        isActive: true,
        activeBattlesToday: 0,
        lastBattleReset: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Embedded animal data
        animal: {
          id: selectedAnimal.id,
          name: selectedAnimal.name,
          korean_name: selectedAnimal.korean_name,
          category: selectedAnimal.category,
          sub_category: selectedAnimal.sub_category,
          emoji: selectedAnimal.emoji,
          description: selectedAnimal.description,
          kid_description: selectedAnimal.kid_description,
          habitat: selectedAnimal.habitat,
          food: selectedAnimal.food,
          speciality: selectedAnimal.speciality,
          fun_fact: selectedAnimal.fun_fact,
          power: selectedAnimal.power || 50,
          defense: selectedAnimal.defense || 50,
          speed: selectedAnimal.speed || 50,
          intelligence: selectedAnimal.intelligence || 50,
          battle_cry: selectedAnimal.battle_cry,
          rarity: selectedAnimal.rarity,
          unlock_level: selectedAnimal.unlock_level
        }
      };

      await setDoc(doc(db, 'characters', characterId), newCharacter);
      console.log("Character created successfully");

      // Force refresh user data or redirect
      await router.push('/play');

    } catch (error: any) {
      console.error('Failed to create character:', error);
      alert(error.message || '캐릭터 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all animals for the modal
  const fetchAllAnimals = async () => {
    try {
      const response = await fetch('/api/animals');
      const data = await response.json();
      if (data.success) {
        setAllAnimals(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch animals:', error);
    }
  };

  useEffect(() => {
    fetchAllAnimals();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 relative">
      <AnimatePresence>
        {isAnimalModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsAnimalModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <h3 className="text-2xl font-bold">🦁 동물 친구 선택하기</h3>
                <button
                  onClick={() => setIsAnimalModalOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allAnimals.map((animal) => (
                  <button
                    key={animal.id}
                    onClick={() => {
                      setSelectedAnimal(animal);
                      setIsAnimalModalOpen(false);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${selectedAnimal?.id === animal.id
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-gray-100 hover:border-purple-300 hover:shadow-md'
                      }`}
                  >
                    <div className="text-5xl mb-2 text-center">{animal.emoji}</div>
                    <div className="font-bold text-center text-gray-800">{animal.korean_name}</div>
                    <div className="text-xs text-center text-gray-500 mt-1 truncate">{animal.name}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 shadow-lg rounded-b-3xl mb-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">🎮 캐릭터 만들기</h1>
          <p className="text-purple-200">
            나만의 캐릭터를 만들어보세요! ({existingCharacters.length}/3)
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 동물 선택 */}
            <div>
              <label className="block text-lg font-bold mb-4">
                1️⃣ 동물 선택
              </label>
              {selectedAnimal ? (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 relative group">
                  <button
                    type="button"
                    onClick={() => setIsAnimalModalOpen(true)}
                    className="absolute top-4 right-4 bg-white/50 hover:bg-white p-2 rounded-xl text-sm font-bold shadow-sm backdrop-blur transition-all opacity-0 group-hover:opacity-100"
                  >
                    🔄 변경하기
                  </button>
                  <div className="text-center">
                    <div className="text-6xl mb-2 animate-bounce-slow">{selectedAnimal.emoji}</div>
                    <h3 className="text-xl font-bold">{selectedAnimal.korean_name}</h3>
                    <p className="text-gray-600 mt-2">{selectedAnimal.description}</p>
                  </div>

                  {/* 능력치 표시 */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="bg-red-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-700">⚔️ 공격력</span>
                        <span className="font-bold text-red-800">{selectedAnimal.power}</span>
                      </div>
                      <div className="w-full bg-red-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-red-500 h-1.5 rounded-full"
                          style={{ width: `${selectedAnimal.power}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-orange-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-orange-700">🛡️ 방어력</span>
                        <span className="font-bold text-orange-800">{selectedAnimal.defense}</span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-orange-500 h-1.5 rounded-full"
                          style={{ width: `${selectedAnimal.defense}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-blue-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">🏃 속도</span>
                        <span className="font-bold text-blue-800">{selectedAnimal.speed}</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${selectedAnimal.speed}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-green-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-700">🧠 지능</span>
                        <span className="font-bold text-green-800">{selectedAnimal.intelligence}</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${selectedAnimal.intelligence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-center text-sm">
                    <span className="text-gray-600">총 능력치: </span>
                    <span className="font-bold text-gray-800">
                      {selectedAnimal.power + selectedAnimal.defense + selectedAnimal.speed + selectedAnimal.intelligence}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAnimalModalOpen(true)}
                  className="w-full bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 p-8 rounded-2xl transition-all duration-200 border-2 border-dashed border-purple-200 hover:border-purple-300"
                >
                  <div className="text-4xl mb-2">🦁</div>
                  <p className="text-gray-700 font-bold text-lg">눌러서 동물 선택하기</p>
                  <p className="text-gray-400 text-sm mt-1">도감으로 이동하지 않고 바로 선택할 수 있어요!</p>
                </button>
              )}
            </div>

            {/* 캐릭터 이름 */}
            <div>
              <label className="block text-lg font-bold mb-4">
                2️⃣ 캐릭터 이름 (2-20자)
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value.slice(0, 20))}
                placeholder="예: 용감한 사자왕"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                required
              />
              <div className="text-right mt-2 text-sm text-gray-600">
                {characterName.length}/20자
              </div>
            </div>

            {/* 배틀 텍스트 */}
            <div>
              <label className="block text-lg font-bold mb-4">
                3️⃣ 배틀 텍스트 (10-100자)
              </label>
              <textarea
                value={battleText}
                onChange={(e) => setBattleText(e.target.value.slice(0, 100))}
                placeholder="예: 나는 정글의 왕! 용감하고 강력한 사자다. 모든 동물들이 나를 존경한다!"
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none h-32 text-lg"
                required
              />
              <div className="flex justify-between mt-2 text-sm items-center">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => router.push('/text-guide')}
                    className="text-purple-600 hover:text-purple-700 font-bold"
                  >
                    📝 작성 가이드
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!characterName || !selectedAnimal) {
                        alert("먼저 동물과 이름을 정해주세요!");
                        return;
                      }
                      try {
                        setIsLoading(true);
                        const res = await fetch('/api/ai/generate-text', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            animalName: selectedAnimal.korean_name,
                            characterName: characterName
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          setBattleText(data.text);
                        } else {
                          console.error("Server error:", data.error);
                          alert(`생성에 실패했어요 ㅠㅠ\n이유: ${data.error}`);
                        }
                      } catch (e) {
                        console.error(e);
                        alert("오류가 발생했어요.");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1"
                  >
                    ✨ AI로 자동 생성
                  </button>
                </div>
                <span className={`${battleText.length < 10 ? 'text-red-600' :
                  battleText.length > 100 ? 'text-red-600' : 'text-green-600'
                  }`}>
                  {battleText.length}/100자
                </span>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 text-red-700">
                {error}
              </div>
            )}

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading || !selectedAnimal || !characterName || !battleText}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
              >
                {isLoading ? '생성 중...' : '🎮 캐릭터 생성하기'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/play')}
                className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-lg transition-all duration-200"
              >
                취소
              </button>
            </div>
          </form>
        </motion.div>

        {/* 캐릭터 목록 */}
        {existingCharacters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white rounded-3xl shadow-xl p-8"
          >
            <h2 className="text-xl font-bold mb-4">내 캐릭터 목록 ({existingCharacters.length}/3)</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {existingCharacters.map((char) => (
                <div key={char.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">{char.animal?.emoji}</div>
                  <p className="font-bold">{char.characterName}</p>
                  <p className="text-sm text-gray-600">{char.animal?.korean_name}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}