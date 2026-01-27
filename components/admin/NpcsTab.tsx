
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
            const res = await fetch('/api/admin/npcs');
            const data = await res.json();
            if (data.success) {
                setNpcs(data.data.sort((a: any, b: any) => b.baseScore - a.baseScore));
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
            const res = await fetch('/api/admin/npcs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !currentStatus })
            });
            const data = await res.json();
            if (data.success) {
                setNpcs(prev => prev.map(n => n.id === id ? { ...n, isActive: !currentStatus } : n));
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
            alert('상태 변경 실패');
        }
    };

    const deleteNpc = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            const res = await fetch('/api/admin/npcs', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.success) {
                setNpcs(prev => prev.filter(n => n.id !== id));
            } else {
                alert(data.error);
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
            const res = await fetch('/api/admin/generate-npcs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'dev_secret', count: genCount })
            });
            const data = await res.json();
            if (data.success) {
                alert(`${data.count}마리 생성 완료!`);
                fetchNpcs();
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
            alert('생성 실패');
        } finally {
            setLoading(false);
        }
    };

    const filteredNpcs = npcs.filter(npc =>
        npc.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        npc.animal?.korean_name.includes(searchTerm)
    );

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

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="NPC 검색 (이름, 동물)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            {loading ? (
                <div className="text-center py-10">로딩 중...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNpcs.map(npc => (
                        <div key={npc.id} className={`p-4 rounded-2xl border-2 transition-all relative group ${npc.isActive ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-75'
                            }`}>

                            <button
                                onClick={() => deleteNpc(npc.id)}
                                className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                            >
                                삭제
                            </button>

                            <div className="flex justify-between items-start mb-2">
                                <div className="text-4xl">{npc.animal?.emoji || '❓'}</div>
                                <button
                                    onClick={() => toggleNpc(npc.id, npc.isActive)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${npc.isActive
                                        ? 'bg-green-200 text-green-800'
                                        : 'bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {npc.isActive ? '출격 중 ✅' : '대기 중 💤'}
                                </button>
                            </div>
                            <h3 className="font-bold text-lg">{npc.characterName}</h3>
                            <p className="text-sm text-gray-600">전투력(ELO): {npc.baseScore}</p>
                            <div className="mt-2 text-xs flex gap-2">
                                <span className="text-blue-600">{npc.wins}승</span>
                                <span className="text-red-500">{npc.losses}패</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
