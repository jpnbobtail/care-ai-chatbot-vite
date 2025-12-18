import { loadManualTexts } from "./loadManual.js";
import { splitText } from "./splitText.js";
import { scoreSimilarity } from "./similarity.js";

export function searchManual(question: string): string[] {
  // すべてのマニュアルを読み込む
  const manuals = loadManualTexts();

  // マニュアルを分割して1つの配列にまとめる
  const chunks = manuals.flatMap((manual) => splitText(manual));

  // 質問との類似度を計算
  const ranked = chunks
    .map((chunk) => ({
      chunk,
      score: scoreSimilarity(question, chunk),
    }))
    .sort((a, b) => b.score - a.score);

  // 上位3件を返す
  return ranked.slice(0, 3).map((r) => r.chunk);
}
