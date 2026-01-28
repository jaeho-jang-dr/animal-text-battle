
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function testDirect() {
    // Read .env.local directly to ensure we get the latest file content
    const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.+)/);
    
    if (!match) {
        console.error("Could not find GEMINI_API_KEY in .env.local file");
        return;
    }
    
    // Trim whitespace and quotes
    let key = match[1].trim();
    if (key.startsWith('"') && key.endsWith('"')) {
        key = key.slice(1, -1);
    }
    
    console.log(`Testing Key from file: ${key.substring(0, 10)}...`);
    
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    try {
        const result = await model.generateContent("Hello?");
        const response = await result.response;
        console.log("✅ SUCCESS! Response: " + response.text());
    } catch (error) {
        console.error("❌ FAILED: " + error.message);
    }
}

testDirect();
