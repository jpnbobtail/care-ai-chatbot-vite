import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const FAQ_WEBAPP_URL = process.env.FAQ_WEBAPP_URL || "";
    const FAQ_API_KEY = process.env.FAQ_API_KEY || "";

    if (!FAQ_WEBAPP_URL || !FAQ_API_KEY) {
      return res.status(500).json({ error: "FAQ env vars missing" });
    }

    const url = new URL(FAQ_WEBAPP_URL);
    url.searchParams.set("action", "list");
    url.searchParams.set("apiKey", FAQ_API_KEY);

    const r = await fetch(url.toString(), { method: "GET" });
    const text = await r.text();

    if (!r.ok) {
      return res.status(500).json({ error: "FAQ list failed", detail: text });
    }

    // ✅ GASの返却 { items: [...] } をそのまま返す（包まない）
    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      return res.status(500).json({ error: "FAQ list parse failed", detail: text });
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "FAQ list failed", detail: String(err) });
  }
}
