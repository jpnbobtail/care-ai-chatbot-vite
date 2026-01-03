import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = process.env.FAQ_WEBAPP_URL;
  const apiKey = process.env.FAQ_API_KEY;

  if (!url || !apiKey) {
    return res.status(500).json({ error: "FAQ env vars missing" });
  }

  try {
    // GAS側がGET対応ならこれでOK（POSTしか無い場合は下のコメント案に切替）
    const r = await fetch(`${url}?action=list&apiKey=${encodeURIComponent(apiKey)}`, {
      method: "GET",
    });

    const text = await r.text();
    if (!r.ok) {
      return res.status(500).json({ error: "FAQ list failed", detail: text });
    }

    let data: any = [];
    try {
      data = JSON.parse(text);
    } catch {
      data = [];
    }

    return res.status(200).json({ items: data });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "FAQ list error" });
  }
}

/**
 * もしGASが「POSTでしかlistできない」仕様なら、上の fetch をこれに差し替え：
 *
 * const r = await fetch(url, {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({ apiKey, action: "list" }),
 * });
 */
