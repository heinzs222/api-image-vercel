// api/generate-ai-image.js
import OpenAI from "openai";

export const config = { runtime: "nodejs20.x" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt } = req.body || {};
  if (!prompt?.trim()) {
    return res.status(400).json({ error: "prompt required" });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt.trim(),
      tools: [
        {
          type: "image_generation",
          background: "transparent",
          quality: "high",
        },
      ],
    });

    const output = response.output.find(
      (o) => o.type === "image_generation_call"
    );
    if (!output?.result) throw new Error("No image returned");

    return res.status(200).json({ imageBase64: output.result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
