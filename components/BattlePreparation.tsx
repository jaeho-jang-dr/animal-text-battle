'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Character } from '../types';

interface BattlePreparationProps {
  attacker: Character | any;
  defender: Character | any;
  onBattleStart: () => void;
  onEditBattleText?: () => void;
  onCancel: () => void;
  isBattling: boolean;
  showEditButton?: boolean;
}

export default function BattlePreparation({
  attacker,
  defender,
  onBattleStart,
  onEditBattleText,
  onCancel,
  isBattling,
  showEditButton = true
}: BattlePreparationProps) {
  const [showStats, setShowStats] = useState(false);

  // Helper to get animal emoji
  const getEmoji = (character: any) => {
    return character?.animal?.emoji || character?.animalIcon || '🐾';
  };

  // Helper to get character name
  const getName = (character: any) => {
    return character?.characterName || character?.character_name || '???';
  };

  // Helper to get battle text
  const getBattleText = (character: any) => {
    return character?.battleText || character?.battle_text || '배틀 텍스트가 없습니다';
  };

  // Helper to get stats
  const getStats = (character: any) => {
    const animal = character?.animal || {};
    return {
      attack_power: animal.attack_power || character?.attack_power || 50,
      strength: animal.strength || character?.strength || 50,
      speed: animal.speed || character?.speed || 50,
      energy: animal.energy || character?.energy || 50
    };
  };

  const attackerStats = getStats(attacker);
  const defenderStats = getStats(defender);
  const attackerTotal = attackerStats.attack_power + attackerStats.strength + attackerStats.speed + attackerStats.energy;
  const defenderTotal = defenderStats.attack_power + defenderStats.strength + defenderStats.speed + defenderStats.energy;

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-6">⚔️ 배틀 준비!</h2>
      
      {/* 캐릭터 대결 구도 */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-center flex-1">
          <motion.div 
            className="text-6xl mb-2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {getEmoji(attacker)}
          </motion.div>
          <h3 className="text-xl font-bold">{getName(attacker)}</h3>
          <p className="text-sm text-gray-600">나의 캐릭터</p>
        </div>
        
        <div className="text-4xl animate-pulse mx-4">VS</div>
        
        <div className="text-center flex-1">
          <motion.div 
            className="text-6xl mb-2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            {getEmoji(defender)}
          </motion.div>
          <h3 className="text-xl font-bold">{getName(defender)}</h3>
          <p className="text-sm text-gray-600">
            상대 캐릭터
            {defender?.isBot && ' (🤖 봇)'}
          </p>
        </div>
      </div>

      {/* 배틀 텍스트 표시 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="font-bold text-blue-700 mb-2">📢 내 배틀 텍스트</h4>
          <p className="text-sm text-gray-700 italic mb-3">"{getBattleText(attacker)}"</p>
          {showEditButton && onEditBattleText && (
            <button
              onClick={onEditBattleText}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors"
            >
              ✏️ 배틀 텍스트 수정하기
            </button>
          )}
        </div>

        <div className="bg-red-50 rounded-xl p-4">
          <h4 className="font-bold text-red-700 mb-2">📢 상대 배틀 텍스트</h4>
          <p className="text-sm text-gray-700 italic">"{getBattleText(defender)}"</p>
        </div>
      </div>

      {/* 능력치 토글 버튼 */}
      <div className="text-center mb-4">
        <button
          onClick={() => setShowStats(!showStats)}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          {showStats ? '능력치 숨기기' : '능력치 보기'} {showStats ? '▲' : '▼'}
        </button>
      </div>

      {/* 능력치 표시 (토글) */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-bold text-center mb-3 text-blue-700">내 캐릭터 능력치</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>⚔️ 공격력</span>
                <span className="font-bold">{attackerStats.attack_power}</span>
              </div>
              <div className="flex justify-between">
                <span>💪 힘</span>
                <span className="font-bold">{attackerStats.strength}</span>
              </div>
              <div className="flex justify-between">
                <span>🏃 속도</span>
                <span className="font-bold">{attackerStats.speed}</span>
              </div>
              <div className="flex justify-between">
                <span>⚡ 에너지</span>
                <span className="font-bold">{attackerStats.energy}</span>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <div className="flex justify-between">
                  <span className="font-medium">총 전투력</span>
                  <span className="font-bold text-lg text-blue-700">{attackerTotal}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-4">
            <h4 className="font-bold text-center mb-3 text-red-700">상대 캐릭터 능력치</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>⚔️ 공격력</span>
                <span className="font-bold">{defenderStats.attack_power}</span>
              </div>
              <div className="flex justify-between">
                <span>💪 힘</span>
                <span className="font-bold">{defenderStats.strength}</span>
              </div>
              <div className="flex justify-between">
                <span>🏃 속도</span>
                <span className="font-bold">{defenderStats.speed}</span>
              </div>
              <div className="flex justify-between">
                <span>⚡ 에너지</span>
                <span className="font-bold">{defenderStats.energy}</span>
              </div>
              <div className="pt-2 border-t border-red-200">
                <div className="flex justify-between">
                  <span className="font-medium">총 전투력</span>
                  <span className="font-bold text-lg text-red-700">{defenderTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 배틀 시작 버튼 */}
      <div className="text-center mb-4">
        <motion.button
          onClick={onBattleStart}
          disabled={isBattling}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-xl text-xl disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 shadow-lg"
        >
          {isBattling ? '배틀 진행 중... ⚔️' : '⚔️ 배틀 시작! ⚔️'}
        </motion.button>
        {!isBattling && (
          <p className="text-sm text-gray-600 mt-2">능력치가 3초에 걸쳐 충돌합니다!</p>
        )}
      </div>

      {/* 취소 버튼 */}
      <button
        onClick={onCancel}
        className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded-lg transition-colors"
      >
        취소
      </button>
    </div>
  );
}