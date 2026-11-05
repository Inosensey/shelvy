export function skuPrefix(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean);
  if (words.length === 0) return 'PRD';
  if (words.length === 1) return words[0].slice(0, 3);
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('');
}
