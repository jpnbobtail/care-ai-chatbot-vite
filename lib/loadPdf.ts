import fs from "fs";
import path from "path";
import * as pdfParse from "pdf-parse";

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
    const data = await pdfParse.default(buffer);

    if (data.text) {
      texts.push(data.text);
    }
  }

  return texts;
}

