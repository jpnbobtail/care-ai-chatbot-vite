import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// ⚠️ pdf-parse を CommonJS として読み込む
const pdfParse = require("pdf-parse");

export default async function loadPdfTexts(): Promise<string[]> {
  const pdfDir = path.join(process.cwd(), "data/pdfs");

  let files: string[] = [];
  try {
    files = fs.readdirSync(pdfDir);
  } catch {
    return [];
  }

  const texts: string[] = [];

  for (const file of files) {
    if (!file.toLowerCase().endsWith(".pdf")) continue;

    const buffer = fs.readFileSync(path.join(pdfDir, file));

    // 🔑 ここがポイント：render を完全に無効化
    const data = await pdfParse(buffer, {
      pagerender: () => "",
    });

    if (data?.text) {
      texts.push(data.text);
    }
  }

  return texts;
}
