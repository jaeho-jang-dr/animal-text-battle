
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function diagnose() {
    const key = process.env.GEMINI_API_KEY;
    console.log(`🔑 Testing API Key: ${key ? key.substring(0, 8) + '...' : 'MISSING'}`);

    if (!key) return;

    const genAI = new GoogleGenerativeAI(key);
    
    // List of potential model names to test
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];

    for (const modelName of models) {
        console.log(`\n🤖 Attempting validation for: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test.");
            const response = await result.response;
            console.log(`✅ SUCCESS! Model '${modelName}' is working.`);
            console.log(`   Response: ${response.text().substring(0, 20)}...`);
        } catch (error) {
            console.log(`❌ FAILED for '${modelName}'`);
            console.log(`   Error Message: ${error.message}`);
            
            if (error.message.includes("403")) {
                console.log("   👉 CAUSE: Permission Denied. API Key may be invalid, or API not enabled in Cloud Console.");
            } else if (error.message.includes("404")) {
                console.log("   👉 CAUSE: Model not found. This model might not be available to your API key/Project yet.");
            }
        }
    }
}

diagnose();
