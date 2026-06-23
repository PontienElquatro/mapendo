import { GoogleGenAI } from "@google/genai";
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey });

async function run() {
  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash-image",
    "imagen-3.0-generate-001"
  ];

  for (const modelName of modelsToTry) {
      try {
        console.log(`Trying ${modelName}...`);
        const result = await genAI.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: "Hello" }] }]
        });
        console.log(`- ${modelName} success`);
      } catch (e) {
        console.log(`- ${modelName} error: ${e.message}`);
      }
  }
}
run();
