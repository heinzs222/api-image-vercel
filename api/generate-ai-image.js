// /api/generate-ai-image.js
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";

export default async function handler(req, res) {
  // CORS for any site — tighten to your own domain in production
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end(); // pre-flight

  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  const prompt = (req.body?.prompt || "").trim();
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  try {
    // Init clients (pull from env runtime-side)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // 1) DALL·E-3 → base64
    const img = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      response_format: "b64_json",
    });
    const b64 = img.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned");

    // 2) Upload to Cloudinary
    const upload = await cloudinary.uploader.upload(
      `data:image/png;base64,${b64}`,
      { folder: "ai-generated" }
    );

    // 3) Respond with image URL
    return res.json({ url: upload.secure_url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
