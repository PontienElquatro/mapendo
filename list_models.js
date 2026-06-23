import { GoogleGenAI } from "@google/genai";
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const models = await genAI.models.list();
    console.log("Available models:");
    for (const model of models) {
      console.log(`- ${model.name}`);
    }
  } catch (e) {
    console.error("Error listing models:", e.message);
  }
}
run();
