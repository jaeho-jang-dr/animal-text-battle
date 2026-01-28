
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Animal } from '../types';

// Hardcoded list of animals for bots if API is not used
const BOT_ANIMALS = [
    { name: 'Lion', korean_name: '사자', emoji: '🦁', category: 'current' },
    { name: 'Tiger', korean_name: '호랑이', emoji: '🐯', category: 'current' },
    { name: 'Bear', korean_name: '곰', emoji: '🐻', category: 'current' },
    { name: 'Wolf', korean_name: '늑대', emoji: '🐺', category: 'current' },
    { name: 'Fox', korean_name: '여우', emoji: '🦊', category: 'current' },
    { name: 'Elephant', korean_name: '코끼리', emoji: '🐘', category: 'current' },
    { name: 'Dragon', korean_name: '드래곤', emoji: '🐉', category: 'mythical' },
    { name: 'Unicorn', korean_name: '유니콘', emoji: '🦄', category: 'mythical' },
    { name: 'T-Rex', korean_name: '티라노사우루스', emoji: '🦖', category: 'prehistoric' },
    { name: 'Eagle', korean_name: '독수리', emoji: '🦅', category: 'current' },
    { name: 'Shark', korean_name: '상어', emoji: '🦈', category: 'current' },
    { name: 'Crocodile', korean_name: '악어', emoji: '🐊', category: 'current' },
    { name: 'Gorilla', korean_name: '고릴라', emoji: '🦍', category: 'current' },
    { name: 'Panda', korean_name: '판다', emoji: '🐼', category: 'current' },
    { name: 'Kangaroo', korean_name: '캥거루', emoji: '🦘', category: 'current' },
    { name: 'Leopard', korean_name: '표범', emoji: '🐆', category: 'current' },
    { name: 'Zebra', korean_name: '얼룩말', emoji: '🦓', category: 'current' },
    { name: 'Giraffe', korean_name: '기린', emoji: '🦒', category: 'current' },
    { name: 'Hippo', korean_name: '하마', emoji: '🦛', category: 'current' },
    { name: 'Rhino', korean_name: '코뿔소', emoji: '🦏', category: 'current' },
    // Extended List
    { name: 'Cheetah', korean_name: '치타', emoji: '🐆', category: 'current' },
    { name: 'Buffalo', korean_name: '물소', emoji: '🐃', category: 'current' },
    { name: 'Boar', korean_name: '멧돼지', emoji: '🐗', category: 'current' },
    { name: 'Rabbit', korean_name: '토끼', emoji: '🐰', category: 'current' },
    { name: 'Snake', korean_name: '뱀', emoji: '🐍', category: 'current' }
];

const BATTLE_TEXTS = [
    "나는야 숲의 지배자! 내 포효를 들어라!",
    "작다고 얕보지 마라, 내 스피드는 빛보다 빠르다!",
    "내 가죽은 강철보다 단단하지. 공격해 봐라!",
    "어둠 속에서 너를 지켜보고 있다...",
    "배고픈데 잘 됐다. 오늘 저녁은 너다!",
    "전설의 힘을 보여주마! 크아아앙!",
    "평화롭게 살고 싶었지만, 네가 먼저 건드렸다.",
    "나의 앞발 펀치는 바위도 부수지!",
    "물속에서는 내가 왕이다! 덤벼!",
    "하늘의 제왕이 누구인지 똑똑히 알려주마!",
    "내 뿔에 받히면 엄청 아플걸?",
    "조심해, 난 화나면 아무도 못 말려!",
    "빙글빙글 돌아서 어지럽게 해주지!",
    "내 독니 맛을 좀 볼래?",
    "쿵! 쿵! 땅이 울리는 소리가 들리느냐!"
];

export const generateBots = async (count: number = 20) => {
    try {
        const promises = [];

        for (let i = 0; i < count; i++) {
            const animalIndex = Math.floor(Math.random() * BOT_ANIMALS.length);
            const animal = BOT_ANIMALS[animalIndex];
            const textIndex = Math.floor(Math.random() * BATTLE_TEXTS.length);
            const randomText = BATTLE_TEXTS[textIndex];

            const id = uuidv4();
            const baseScore = 1000 + Math.floor(Math.random() * 500); // 1000-1500
            const eloScore = 1200 + Math.floor(Math.random() * 800);  // 1200-2000

            const botCharacter = {
                id,
                userId: 'bot-system', // Special user ID for bots
                animalId: 9900 + Math.floor(Math.random() * 10000), // Random Fake ID
                characterName: `${animal.korean_name} 봇 ${Math.floor(Math.random() * 100)}호`,
                battleText: randomText,
                baseScore,
                eloScore,
                wins: Math.floor(Math.random() * 50),
                losses: Math.floor(Math.random() * 50),
                activeBattlesToday: 0,
                passiveBattlesToday: 0,
                totalActiveBattles: Math.floor(Math.random() * 100),
                totalPassiveBattles: Math.floor(Math.random() * 100),
                isActive: true,
                isBot: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastBattleReset: serverTimestamp(),
                animal: {
                    id: 9900 + animalIndex, // Keep consistent animal ID base if needed, or random
                    name: animal.name,
                    korean_name: animal.korean_name,
                    category: animal.category,
                    sub_category: 'Bot',
                    emoji: animal.emoji,
                    description: 'AI 훈련용 봇입니다.',
                    kid_description: 'AI 훈련용 봇입니다.',
                    habitat: 'Unknown',
                    food: 'Unknown',
                    speciality: 'Unknown',
                    fun_fact: 'Unknown',
                    power: 50 + Math.floor(Math.random() * 50),
                    defense: 50 + Math.floor(Math.random() * 50),
                    speed: 50 + Math.floor(Math.random() * 50),
                    intelligence: 50 + Math.floor(Math.random() * 50),
                    battle_cry: 'Roar!',
                    rarity: 'common',
                    unlock_level: 1
                }
            };

            promises.push(setDoc(doc(db, 'characters', id), botCharacter));
        }

        await Promise.all(promises);
        alert(`${count}명의 NPC가 훈련소에 입소했습니다!`);
        window.location.reload();

    } catch (error) {
        console.error('Error generating bots:', error);
        alert('봇 생성 중 오류가 발생했습니다.');
    }
};
