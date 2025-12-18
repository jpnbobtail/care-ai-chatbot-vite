export function scoreSimilarity(a: string, b: string): number {
  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);

  let score = 0;

  aWords.forEach((word) => {
    if (bWords.includes(word)) {
      score++;
    }
  });

  return score;
}
