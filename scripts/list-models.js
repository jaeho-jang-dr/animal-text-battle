// List available models
const apiKey = 'AIzaSyCjv0BVGDcWmfqKOE3RusylwDaL4JSHtT4';

async function listModels() {
    console.log('📋 사용 가능한 모델 목록 조회...\n');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);

        console.log('응답 상태:', response.status, response.statusText);

        const data = await response.json();

        if (response.ok) {
            console.log('\n✅ 성공! 사용 가능한 모델:');
            if (data.models) {
                data.models.forEach(model => {
                    console.log(`  - ${model.name}`);
                    console.log(`    지원 메서드: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
                });
            }
        } else {
            console.log('\n❌ 실패!');
            console.log('에러:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('\n❌ 네트워크 에러:', error.message);
    }
}

listModels();
