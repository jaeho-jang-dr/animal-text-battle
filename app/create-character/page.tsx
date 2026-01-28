'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { Character, Animal } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

function CreateCharacterContent() {
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
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative pb-24">
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
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="text-2xl font-black text-slate-800">🦁 동물 친구 선택하기</h3>
                <button
                  onClick={() => setIsAnimalModalOpen(false)}
                  className="text-slate-400 hover:bg-slate-100 rounded-full p-2 transition-colors"
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
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] ${selectedAnimal?.id === animal.id
                      ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-200 shadow-lg'
                      : 'border-slate-100 hover:border-purple-300 hover:shadow-md bg-white'
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

      {/* 헤더 - Global Design System */}
      <div className="px-6 py-12 flex flex-col items-center bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm rounded-b-[2.5rem] mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">🎮 캐릭터 만들기</h1>
        <p className="text-lg font-medium text-slate-500">
          나만의 캐릭터를 만들어보세요! ({existingCharacters.length}/3)
        </p>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-2xl p-10"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 동물 선택 */}
            <div>
              <label className="block text-xl font-black text-slate-800 mb-4">
                1️⃣ 동물 선택
              </label>
              {selectedAnimal ? (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2rem] p-8 relative group border border-indigo-100">
                  <button
                    type="button"
                    onClick={() => setIsAnimalModalOpen(true)}
                    className="absolute top-6 right-6 bg-white hover:bg-slate-50 p-3 rounded-2xl text-sm font-bold shadow-md border border-slate-100 transition-all opacity-0 group-hover:opacity-100 text-indigo-600"
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
                    className="w-full bg-white hover:bg-slate-50 p-12 rounded-[2.5rem] transition-all duration-200 border-2 border-dashed border-slate-200 hover:border-purple-400 group"
                  >
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-200">🦁</div>
                    <p className="text-slate-800 font-black text-xl mb-1">눌러서 동물 선택하기</p>
                    <p className="text-slate-400 font-medium text-sm">도감으로 이동하지 않고 바로 선택할 수 있어요!</p>
                  </button>
              )}
            </div>

            {/* 캐릭터 이름 */}
            <div>
              <label className="block text-xl font-black text-slate-800 mb-4">
                2️⃣ 캐릭터 이름 (2-20자)
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value.slice(0, 20))}
                placeholder="예: 용감한 사자왕"
                className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:outline-none text-lg font-bold placeholder-slate-300 transition-all bg-slate-50 focus:bg-white"
                required
              />
              <div className="text-right mt-2 text-sm text-gray-600">
                {characterName.length}/20자
              </div>
            </div>

            {/* 배틀 텍스트 */}
            <div>
              <label className="block text-xl font-black text-slate-800 mb-4">
                3️⃣ 배틀 텍스트 (10-100자)
              </label>
              <textarea
                value={battleText}
                onChange={(e) => setBattleText(e.target.value.slice(0, 100))}
                placeholder="예: 나는 정글의 왕! 용감하고 강력한 사자다. 모든 동물들이 나를 존경한다!"
                className="w-full p-6 border-2 border-slate-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:outline-none resize-none h-40 text-lg font-medium placeholder-slate-300 transition-all bg-slate-50 focus:bg-white"
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
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 border border-indigo-200"
                  >
                    <span>✨</span> AI로 자동 생성
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
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading || !selectedAnimal || !characterName || !battleText}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:scale-[1.02] disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-5 px-8 rounded-2xl text-xl transition-all duration-200 transform shadow-lg disabled:scale-100 disabled:shadow-none"
              >
                {isLoading ? '생성 중...' : '🎮 캐릭터 생성하기'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/play')}
                className="px-10 py-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-2xl text-xl transition-all duration-200"
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
            className="mt-8 bg-white/60 backdrop-blur-lg border border-white/50 rounded-[2.5rem] shadow-lg p-10"
          >
            <h2 className="text-xl font-black text-slate-800 mb-6">내 캐릭터 목록 ({existingCharacters.length}/3)</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {existingCharacters.map((char) => (
                <div key={char.id} className="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-sm">
                  <div className="text-4xl mb-3">{char.animal?.emoji}</div>
                  <p className="font-bold text-slate-800 text-lg">{char.characterName}</p>
                  <p className="text-sm text-slate-500 font-medium">{char.animal?.korean_name}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function CreateCharacterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center text-2xl">⏳ 로딩 중...</div>}>
      <CreateCharacterContent />
    </Suspense>
  );
}