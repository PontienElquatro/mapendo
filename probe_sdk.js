import { GoogleGenAI } from "@google/genai";
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const response = await genAI.models.list();
    console.log("Models list response keys:", Object.keys(response));
    if (response.models) {
        console.log("Models count:", response.models.length);
        response.models.slice(0, 10).forEach(m => console.log(`- ${m.name}`));
    } else if (Array.isArray(response)) {
        console.log("Response is array, length:", response.length);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
