import fs from "fs";
import path from "path";

export function loadManualTexts(): string[] {
  const dir = path.join(process.cwd(), "data/manuals");
  const files = fs.readdirSync(dir);

  return files.map((file) =>
    fs.readFileSync(path.join(dir, file), "utf-8")
  );
}
