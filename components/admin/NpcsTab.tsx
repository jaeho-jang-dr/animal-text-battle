

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NPC {
    id: string;
    characterName: string;
    animal: { emoji: string; korean_name: string };
    baseScore: number;
    isActive: boolean;
    wins: number;
    losses: number;
}

export default function NpcsTab() {
    const [npcs, setNpcs] = useState<NPC[]>([]);
    const [loading, setLoading] = useState(true);
    const [genCount, setGenCount] = useState(15);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchNpcs();
    }, []);

    const fetchNpcs = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/npcs');
            const data = await response.json();

            if (data.success) {
                const bots = data.data as NPC[];
                // Sort by Score desc
                bots.sort((a, b) => b.baseScore - a.baseScore);
                setNpcs(bots);
            } else {
                throw new Error(data.error || 'Failed to fetch NPCs');
            }
        } catch (e) {
            console.error(e);
            alert('NPC 불러오기 실패');
        } finally {
            setLoading(false);
        }
    };

    const toggleNpc = async (id: string, currentStatus: boolean) => {
        try {
            const response = await fetch('/api/admin/npcs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !currentStatus })
            });

            const data = await response.json();
            if (data.success) {
                setNpcs(prev => prev.map(n => n.id === id ? { ...n, isActive: !currentStatus } : n));
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            console.error(e);
            alert('상태 변경 실패');
        }
    };

    const deleteNpc = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            const response = await fetch('/api/admin/npcs', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            const data = await response.json();
            if (data.success) {
                setNpcs(prev => prev.filter(n => n.id !== id));
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            console.error(e);
            alert('삭제 실패');
        }
    };

    const generateNpcs = async () => {
        if (!confirm(`NPC ${genCount}마리를 생성하시겠습니까?`)) return;
        try {
            setLoading(true);
            const response = await fetch('/api/admin/generate-npcs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: genCount })
            });

            const data = await response.json();
            if (data.success) {
                alert(`${data.count}개의 NPC가 생성되었습니다!`);
                await fetchNpcs();
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            console.error(e);
            alert('생성 실패');
            setLoading(false);
        }
    };

    const [sortField, setSortField] = useState<'name' | 'power' | 'wins'>('power');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const filteredNpcs = npcs.filter(npc =>
        npc.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        npc.animal?.korean_name.includes(searchTerm)
    ).sort((a, b) => {
        let diff = 0;
        if (sortField === 'name') {
            diff = a.characterName.localeCompare(b.characterName, 'ko');
        } else if (sortField === 'power') {
            diff = a.baseScore - b.baseScore;
        } else if (sortField === 'wins') {
            diff = a.wins - b.wins;
        }
        return sortOrder === 'asc' ? diff : -diff;
    });

    return (
        <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold">🤖 NPC 부대 관리</h2>

                <div className="flex gap-4 w-full md:w-auto">
                    <input
                        type="number"
                        value={genCount}
                        onChange={(e) => setGenCount(Number(e.target.value))}
                        className="w-20 px-3 py-2 border rounded-xl"
                        min="1"
                        max="100"
                    />
                    <button
                        onClick={generateNpcs}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition whitespace-nowrap"
                    >
                        + 생성
                    </button>
                </div>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="NPC 검색 (이름, 동물)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-3 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <div className="flex gap-2">
                    <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as any)}
                        className="px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-gray-700"
                    >
                        <option value="power">⚡ 전투력순</option>
                        <option value="name">가나다 이름순</option>
                        <option value="wins">🏆 승리순</option>
                    </select>

                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="px-4 py-3 border rounded-xl bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-gray-700"
                        title={sortOrder === 'asc' ? '오름차순 (낮은 순)' : '내림차순 (높은 순)'}
                    >
                        {sortOrder === 'desc' ? '⬇️ 내림차순' : '⬆️ 오름차순'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">로딩 중...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNpcs.map(npc => (
                        <div key={npc.id} className={`p-4 rounded-2xl border-2 transition-all relative ${npc.isActive ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-75'
                            }`}>

                            <div className="flex justify-between items-start mb-2">
                                <div className="text-4xl">{npc.animal?.emoji || '❓'}</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleNpc(npc.id, npc.isActive)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${npc.isActive
                                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
                                    >
                                        {npc.isActive ? '⏸️ 활동 보류' : '▶️ 활동 재개'}
                                    </button>
                                    <button
                                        onClick={() => deleteNpc(npc.id)}
                                        className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs hover:bg-red-200 font-bold"
                                    >
                                        🗑️ 삭제
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg">{npc.characterName}</h3>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${npc.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                    {npc.isActive ? '활동 중' : '보류됨'}
                                </span>
                                <span className="text-sm text-gray-600">전투력: {npc.baseScore}</span>
                            </div>
                            <div className="mt-2 text-xs flex gap-2 bg-white/50 p-2 rounded-lg">
                                <span className="font-bold text-blue-600">Win: {npc.wins}</span>
                                <span className="font-bold text-red-500">Loss: {npc.losses}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
