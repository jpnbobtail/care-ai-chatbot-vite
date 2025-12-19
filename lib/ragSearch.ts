import loadManualTexts from "./loadManual.js";
import { splitText } from "./splitText.js";
import { similarity } from "./similarity.js";

/**
 * 質問文に近いマニュアルの文章を返す
 */
export async function searchManual(query: string): Promise<string[]> {
  // ✅ TXTマニュアルのみ読み込む
  const manuals = loadManualTexts();

  if (!manuals.length) {
    return [];
  }

  const chunks = manuals.flatMap((text) => splitText(text, 300));

  const scored = chunks.map((chunk) => ({
    text: chunk,
    score: similarity(query, chunk),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.text);
}
