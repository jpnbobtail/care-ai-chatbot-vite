import type { VercelRequest, VercelResponse } from "@vercel/node";
import Groq from "groq-sdk";
import { searchManual } from "../lib/ragSearch.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log("🔥 chat API called"); // ← これを追加

  if (req.method !== "POST") {
    console.log("❌ not POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body ?? {};
    console.log("📩 message =", message); // ← 追加

    if (!message || typeof message !== "string") {
      console.log("❌ invalid message");
      return res.status(400).json({ answer: "質問内容が空です。" });
    }

    console.log("🔍 start searchManual");
    const contextChunks = await searchManual(message);
    console.log("✅ searchManual done", contextChunks.length);

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
以下は社内マニュアル（PDF）からの抜粋です。
この内容を元に回答してください。

${contextChunks.join("\n---\n")}
          `,
        },
        { role: "user", content: message },
      ],
    });

    const answer =
      completion.choices?.[0]?.message?.content ??
      "回答を生成できませんでした。";

    console.log("🤖 answer generated");
    return res.status(200).json({ answer });
  } catch (err) {
    console.error("💥 runtime error:", err);
    return res.status(500).json({
      answer: "AI呼び出しでエラーが発生しました。",
    });
  }
}

