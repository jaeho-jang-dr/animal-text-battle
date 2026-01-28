// Quick test for port 3009
async function quickTest() {
    console.log('🧪 포트 3009 빠른 테스트...\n');

    const response = await fetch('http://localhost:3009/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            animalName: '호랑이',
            characterName: '용맹이'
        })
    });

    const data = await response.json();

    if (data.success) {
        console.log('✅ 성공!');
        console.log('생성된 텍스트:', data.text);
    } else {
        console.log('❌ 실패:', data.error);
    }
}

quickTest();
