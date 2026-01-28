'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Character, Animal } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useBattleSound } from '../../hooks/useBattleSound';

import CharacterCard from '../../components/CharacterCard';
import BottomNav from '../../components/BottomNav';

export default function PlayPage() {
  const { user, firebaseUser } = useAuth();
  const { playBattleStartSound, playVictorySound, playDefeatSound } = useBattleSound();
  const router = useRouter();

  // State
  const [characters, setCharacters] = useState<Character[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Removed opponents, selectedOpponent, battleResult, viewState as we are simplifying the flow
  // const [viewState, setViewState] = useState<'dashboard' | 'select-opponent' | 'battle'>('dashboard');
  // const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  // const [selectedOpponent, setSelectedOpponent] = useState<Character | null>(null);
  // const [battleResult, setBattleResult] = useState<any>(null);

  const [lastRefresh, setLastRefresh] = useState(0); // Trigger re-fetch

  // 1. Auth Check & Data Load
  // 1. Auth Check & Data Load
  useEffect(() => {
    if (!user) return; // Wait for auth

    const fetchCharacters = async () => {
      try {
        const q = query(
          collection(db, 'characters'),
          where('userId', '==', user?.id),
          where('isActive', '==', true)
        );

        const querySnapshot = await getDocs(q);
        const chars = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Character));
        setCharacters(chars);
        setError(null);
      } catch (err) {
        console.error("Load chars error:", err);
        setError("데이터를 불러올 수 없습니다. (Firestore Error)");
      }
    };

    fetchCharacters();

    // Load Animals (Cached usually but fine to fetch)
    fetch('/api/animals')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAnimals(data.data);
      })
      .catch(err => console.error("Load animals error:", err));

  }, [user, lastRefresh]);

  // 2. Battle Logic
  const handleBattleClick = (char: Character) => {
    router.push(`/leaderboard?attackerId=${char.id}`);
  };

  // 3. Update Battle Text
  const handleUpdateBattleText = async (characterId: string, newText: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/characters/${characterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ battleText: newText })
      });

      const data = await res.json();
      if (data.success) {
        // Update local state
        setCharacters(prev => prev.map(c =>
          c.id === characterId ? { ...c, battleText: newText } : c
        ));
        setError(null);
      } else {
        setError(data.error || "대사 수정 실패");
      }
    } catch (error) {
      console.error("Update battle text error:", error);
      setError("대사 수정 중 오류가 발생했습니다.");
    }
  };


  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-24">

      {/* Header - Global Design System */}
      <div className="px-6 py-6 flex justify-between items-center bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm rounded-b-[2.5rem] mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            배틀 아레나
          </h1>
          <p className="text-sm font-bold text-slate-500">VS {user.displayName || '플레이어'}</p>
        </div>
        <div className="bg-white/50 border border-white/50 p-3 rounded-2xl shadow-sm font-bold text-indigo-600">
          🦁 {characters.length}/3
        </div>
      </div>

      <main className="px-4 py-4 max-w-7xl mx-auto">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-md"
            role="alert"
          >
            <p className="font-bold">오류 발생</p>
            <p>{error}</p>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {characters.length === 0 ? (
            <div className="text-center py-20 max-w-lg mx-auto">
              <div className="text-6xl mb-4">🥚</div>
              <h2 className="text-xl font-bold text-gray-700">아직 캐릭터가 없어요!</h2>
              <p className="text-gray-500 mb-8">나만의 동물 친구를 만들어보세요.</p>
              <button
                onClick={() => router.push('/create-character')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform"
              >
                캐릭터 생성하기 +
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {characters.map(char => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    onUpdateBattleText={handleUpdateBattleText}
                    actionButton={
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBattleClick(char); }}
                        className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform"
                      >
                        ⚔️ 배틀 하러 가기!
                      </button>
                    }
                  />
                ))}
              </div>

              {characters.length < 3 && (
                <div className="flex justify-center">
                  <button
                    onClick={() => router.push('/create-character')}
                    className="w-full md:w-auto md:px-12 py-4 border-2 border-dashed border-purple-200 bg-purple-50/50 rounded-[2.5rem] text-purple-400 font-bold hover:bg-purple-50 transition-all hover:border-purple-300"
                  >
                    + 새로운 캐릭터 추가 ({characters.length}/3)
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}