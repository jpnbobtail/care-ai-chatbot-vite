import fs from "fs";
import path from "path";

export default function loadManualTexts(): string[] {
  const dir = path.join(process.cwd(), "data/manuals");

  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".txt"))
    .map((file) =>
      fs.readFileSync(path.join(dir, file), "utf-8")
    );
}
