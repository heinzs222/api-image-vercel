// index.js
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(bodyParser.json());

app.post("/generate-ai-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt?.trim())
      return res.status(400).json({ error: "prompt required" });

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

    // find the base64 image in response.output
    const output = response.output.find(
      (o) => o.type === "image_generation_call"
    );
    if (!output?.result) throw new Error("No image returned");

    return res.json({ imageBase64: output.result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
