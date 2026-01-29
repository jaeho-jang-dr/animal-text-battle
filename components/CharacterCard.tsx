import { useState } from 'react';
import { motion } from 'framer-motion';
import { Character } from '../types';

interface CharacterCardProps {
    character: Character;
    isSelected?: boolean;
    onClick?: () => void;
    showStats?: boolean;
    actionButton?: React.ReactNode;
    onUpdateBattleText?: (id: string, text: string) => Promise<void>;
}

export default function CharacterCard({
    character,
    isSelected = false,
    onClick,
    showStats = true,
    actionButton,
    onUpdateBattleText
}: CharacterCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(character.battleText || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onUpdateBattleText) return;

        setIsSaving(true);
        try {
            await onUpdateBattleText(character.id, editText);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update battle text", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(false);
        setEditText(character.battleText || '');
    };

    // 동물별 배경 색상/그라데이션 매핑 (예시)
    const getGradient = (category: string) => {
        switch (category) {
            case 'mythical': return 'from-purple-400 to-indigo-500';
            case 'prehistoric': return 'from-amber-600 to-red-600';
            case 'legend': return 'from-yellow-300 to-amber-500';
            default: return 'from-blue-400 to-cyan-400';
        }
    };

    const gradient = getGradient(character.animal?.category || 'current');

    return (
        <motion.div
            layout
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 ${isSelected ? 'ring-4 ring-white shadow-2xl scale-105' : 'shadow-xl'
                }`}
        >
            {/* 배경 그라데이션 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />

            {/* 유리 질감 오버레이 */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

            {/* 컨텐츠 */}
            <div className="relative p-6 text-white">
                {/* 상단: 이모지 및 기본 정보 */}
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                        <span className="text-4xl filter drop-shadow-lg">
                            {character.animal?.emoji || '🐾'}
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="bg-black/20 px-3 py-1 rounded-full text-xs font-bold mb-1 inline-block">
                            Ref: {character.activeBattlesToday || 0}/10
                        </div>
                        <div>
                            {character.wins}승 {character.losses}패
                        </div>
                    </div>
                </div>

                {/* 이름 및 설명 */}
                <h3 className="text-2xl font-bold mb-1 shadow-black/10 drop-shadow-sm">
                    {character.characterName}
                </h3>
                <p className="text-white/80 text-sm mb-4 font-medium">
                    {character.animal?.korean_name || character.animal?.koreanName}
                </p>

                {/* 스탯 바 (간소화) */}
                {showStats && (
                    <div className="space-y-2 mb-4 bg-black/10 p-3 rounded-xl">
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <span>🔥 파워</span>
                            <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((character.baseScore / 2000) * 100, 100)}%` }}
                                    className="h-full bg-yellow-400 rounded-full"
                                />
                            </div>
                            <span>{character.baseScore}</span>
                        </div>
                    </div>
                )}

                {/* 배틀 대사 (Inline Edit) */}
                <div className="mb-4 bg-black/20 p-3 rounded-xl backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white/70">💬 배틀 대사</span>
                        {!isEditing && onUpdateBattleText && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition"
                            >
                                ✏️ 수정
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-black/30 text-white text-sm p-2 rounded-lg border border-white/20 focus:outline-none focus:border-white/50"
                                rows={2}
                                maxLength={50}
                                placeholder="배틀 시작 시 외칠 대사!"
                            />

                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-white/60">
                                    💡 나만의 대사를 써보세요!
                                </span>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancel}
                                        className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition"
                                        disabled={isSaving}
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="text-xs px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 transition font-bold"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? '저장...' : '저장'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm italic text-white/90 min-h-[1.5em]">
                            "{character.battleText || '준비 완료!'}"
                        </p>
                    )}
                </div>

                {/* 액션 버튼 영역 */}
                {actionButton && (
                    <div className="mt-2 text-center">
                        {actionButton}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
