import { GoogleGenAI } from "@google/genai";
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API key found in environment");
    process.exit(1);
}
const genAI = new GoogleGenAI(apiKey);

async function run() {
  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
    "gemini-pro"
  ];

  for (const model of modelsToTry) {
      try {
        const result = await genAI.getGenerativeModel({ model }).generateContent("Hi");
        console.log(`${model} success:`, result.response.text());
      } catch (e) {
        console.log(`${model} error:`, e.message);
      }
  }
}
run();
