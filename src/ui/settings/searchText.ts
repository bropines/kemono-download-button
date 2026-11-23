// Text matching of the settings search (no DOM, so tests can load it alone).

/** Lower case without accents and with single spaces: "Ёлка  Café" → "елка cafe". */
export function foldText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** The words of a query, folded; empty when there is nothing to look for. */
export function queryTerms(query: string): string[] {
  return foldText(query).split(' ').filter(Boolean);
}

/** Every term occurs in the (folded) text, in any order. */
export function matchesTerms(folded: string, terms: string[]): boolean {
  return terms.length > 0 && terms.every((term) => folded.includes(term));
}
