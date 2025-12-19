export function similarity(a: string, b: string): number {
  const setA = new Set(a);
  const setB = new Set(b);

  const intersection = [...setA].filter((x) => setB.has(x));

  return intersection.length / Math.max(setA.size, setB.size);
}
