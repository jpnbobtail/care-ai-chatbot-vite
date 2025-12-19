import loadManualTexts from "./loadManual.js";
import { splitText } from "./splitText.js";
import { scoreSimilarity } from "./similarity.js";


export async function searchManual(question: string): Promise<string[]> {
  const manuals = await loadPdfTexts();
  const chunks = manuals.flatMap((m) => splitText(m));

  const ranked = chunks
    .map((chunk) => ({
      chunk,
      score: scoreSimilarity(question, chunk),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, 3).map((r) => r.chunk);
}

