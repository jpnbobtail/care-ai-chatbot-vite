// force rebuild

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body ?? {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ answer: "質問内容が空です。" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "あなたは介護業界向けのITサポートAIです。",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const answer =
      completion.choices?.[0]?.message?.content ??
      "回答を生成できませんでした。";

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Groq API Error:", error);
    return res.status(500).json({
      answer: "AI呼び出しでエラーが発生しました。",
    });
  }
}
