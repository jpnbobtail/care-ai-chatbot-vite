import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const FAQ_WEBAPP_URL = process.env.FAQ_WEBAPP_URL || "";
    const FAQ_API_KEY = process.env.FAQ_API_KEY || "";

    if (!FAQ_WEBAPP_URL || !FAQ_API_KEY) {
      return res.status(500).json({ error: "FAQ env vars missing" });
    }

    const question = String(req.body?.question ?? "").trim();
    const answer = String(req.body?.answer ?? "").trim();

    if (!question || !answer) {
      return res.status(400).json({ error: "question/answer missing" });
    }

    // ✅ GASに確実に渡る形式（e.parameter で取れる）
    const body = new URLSearchParams({
      action: "add",
      apiKey: FAQ_API_KEY,      // ★これが重要
      question,
      answer,
      createdAt: new Date().toISOString(),
    }).toString();

    const r = await fetch(FAQ_WEBAPP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body,
    });

    const text = await r.text();

    // GASが {ok:true} を返す前提
    // 失敗時のJSONやHTMLもそのまま返して原因が見えるようにする
    if (!r.ok) {
      return res.status(500).json({ error: "FAQ add failed", detail: text });
    }

    // GASが {error:"..."} の場合も拾う
    try {
      const data = JSON.parse(text);
      if (data?.error) {
        return res.status(500).json({ error: "FAQ add failed", detail: data });
      }
      return res.status(200).json({ ok: true });
    } catch {
      // JSONでないならそのまま
      return res.status(200).json({ ok: true, raw: text });
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "FAQ add failed", detail: String(err) });
  }
}
