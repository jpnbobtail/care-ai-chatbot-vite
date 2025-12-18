import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

export default async function loadPdfTexts(): Promise<string[]> {
  const pdfDir = path.join(process.cwd(), "data/pdfs");
  const files = fs.readdirSync(pdfDir);

  const texts: string[] = [];

  for (const file of files) {
    if (!file.toLowerCase().endsWith(".pdf")) continue;

    const buffer = fs.readFileSync(path.join(pdfDir, file));
    const data = await pdf(buffer);
    texts.push(data.text);
  }

  return texts;
}


