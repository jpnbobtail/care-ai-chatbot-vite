import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, answer } = req.body ?? {};

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "question is required" });
  }
  if (!answer || typeof answer !== "string" || !answer.trim()) {
    return res.status(400).json({ error: "answer is required" });
  }

  const url = process.env.FAQ_WEBAPP_URL;
  const apiKey = process.env.FAQ_API_KEY;

  if (!url || !apiKey) {
    return res.status(500).json({ error: "FAQ env vars missing" });
  }

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        action: "add",
        question,
        answer,
        createdAt: new Date().toISOString(),
      }),
    });

    const text = await r.text();
    if (!r.ok) {
      return res.status(500).json({ error: "FAQ add failed", detail: text });
    }

    // GAS側がJSONを返す/返さない両対応
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: true };
    }

    return res.status(200).json({ ok: true, data });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "FAQ add error" });
  }
}
