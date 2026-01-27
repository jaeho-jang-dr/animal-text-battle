import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Character } from '../types';

interface BattleSceneProps {
    attacker: Character;
    defender: Character;
    onBattleEnd: () => void;
    result: any; // Battle result object from API
}

export default function BattleScene({ attacker, defender, onBattleEnd, result }: BattleSceneProps) {
    const [step, setStep] = useState<'intro' | 'clash' | 'result'>('intro');
    const [showDamage, setShowDamage] = useState(false);

    useEffect(() => {
        // 1. Intro sequence
        const timer1 = setTimeout(() => {
            setStep('clash');
        }, 1500);

        // 2. Clash & Damage
        const timer2 = setTimeout(() => {
            setShowDamage(true);
        }, 2500);

        // 3. Result
        const timer3 = setTimeout(() => {
            setStep('result');
        }, 4500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    const winner = result?.winner === 'attacker' ? attacker : defender;
    const isPlayerWinner = result?.winner === 'attacker';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4"
        >
            <div className="w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10">

                {/* Battle Area */}
                <div className="relative h-96 w-full bg-[url('/battle-bg.jpg')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-black/40" />

                    {/* Characters */}
                    <div className="absolute inset-0 flex items-center justify-between px-8">
                        {/* Attacker (Left) */}
                        <motion.div
                            initial={{ x: -100, opacity: 0 }}
                            animate={{
                                x: step === 'clash' ? 50 : 0,
                                scale: step === 'clash' ? 1.2 : 1,
                                opacity: 1
                            }}
                            transition={{ type: "spring", stiffness: 100 }}
                            className="flex flex-col items-center z-10"
                        >
                            <div className="text-8xl filter drop-shadow-2xl">
                                {attacker.animal?.emoji}
                            </div>
                            <div className="mt-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                                <span className="text-white font-bold">{attacker.characterName}</span>
                            </div>
                            {/* Damage Number */}
                            <AnimatePresence>
                                {showDamage && !isPlayerWinner && (
                                    <motion.div
                                        initial={{ y: 0, opacity: 1, scale: 0.5 }}
                                        animate={{ y: -50, opacity: 0, scale: 1.5 }}
                                        className="absolute -top-10 text-4xl font-black text-red-500 stroke-white"
                                    >
                                        -{Math.abs(result?.attackerScoreChange)}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* VS Badge */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="text-6xl font-black text-yellow-500 italic drop-shadow-lg"
                            >
                                VS
                            </motion.div>
                        </div>

                        {/* Defender (Right) */}
                        <motion.div
                            initial={{ x: 100, opacity: 0 }}
                            animate={{
                                x: step === 'clash' ? -50 : 0,
                                scale: step === 'clash' ? 1.2 : 1,
                                opacity: 1,
                                filter: step === 'result' && isPlayerWinner ? "grayscale(100%) blur(2px)" : "none"
                            }}
                            transition={{ type: "spring", stiffness: 100 }}
                            className="flex flex-col items-center z-10"
                        >
                            <div className="text-8xl filter drop-shadow-2xl transform scale-x-[-1]">
                                {defender.animal?.emoji}
                            </div>
                            <div className="mt-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                                <span className="text-white font-bold">{defender.characterName}</span>
                            </div>
                            {/* Damage Number */}
                            <AnimatePresence>
                                {showDamage && isPlayerWinner && (
                                    <motion.div
                                        initial={{ y: 0, opacity: 1, scale: 0.5 }}
                                        animate={{ y: -50, opacity: 0, scale: 1.5 }}
                                        className="absolute -top-10 text-4xl font-black text-red-500 stroke-white"
                                    >
                                        -{Math.abs(result?.defenderScoreChange)}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>

                {/* Result Overlay */}
                <AnimatePresence>
                    {step === 'result' && (
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            className="bg-white p-8 text-center"
                        >
                            <h2 className="text-3xl font-black mb-2">
                                {isPlayerWinner ? "🎉 승리! 🎉" : "💔 패배... 💔"}
                            </h2>
                            <p className="text-gray-600 mb-6">
                                {isPlayerWinner
                                    ? `${defender.characterName}를 멋지게 이겼어요!`
                                    : `${defender.characterName}에게 졌어요. 다음엔 이길 수 있어요!`}
                            </p>

                            <div className="flex justify-center gap-4 text-lg font-bold mb-8">
                                <div className="text-green-600">
                                    점수: {attacker.baseScore + result.attackerScoreChange}
                                    <span className="text-sm"> ({result.attackerScoreChange > 0 ? '+' : ''}{result.attackerScoreChange})</span>
                                </div>
                            </div>

                            <button
                                onClick={onBattleEnd}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-105"
                            >
                                돌아가기
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </motion.div>
    );
}
