import dotenv from 'dotenv';
dotenv.config();

const runTest = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        console.log('--- MODELS SUPPORTING GENERATECONTENT ---');
        data.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
            .forEach(m => {
                console.log(`- ${m.name}`);
            });
    } catch (error) {
        console.error(error);
    }
};

runTest();
