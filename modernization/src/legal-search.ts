/**
 * Larry Law Study — dependency-free legal note search core.
 * Safe to integrate with a static site or a TypeScript frontend.
 * This module does not modify existing notes or persist user data.
 */
export type LawNote = {
  id: string;
  subject: string;
  title: string;
  body: string;
  statute?: string;
  tags?: string[];
  examPriority?: number;
};
export type SearchHit = { note: LawNote; score: number; matchedFields: string[] };
const normalize = (value: string): string =>
  value.normalize("NFKC").toLocaleLowerCase("zh-TW").replace(/\s+/g, " ").trim();
const tokens = (value: string): string[] => normalize(value).split(/\s+/).filter(Boolean);
export function searchLawNotes(
  notes: readonly LawNote[],
  query: string,
  options: { subject?: string; limit?: number } = {},
): SearchHit[] {
  const terms = tokens(query);
  if (!terms.length) return [];
  const limit = Math.max(0, Math.min(500, Math.trunc(options.limit ?? 30)));
  return notes.flatMap((note) => {
    if (options.subject && note.subject !== options.subject) return [];
    const fields = {
      title: normalize(note.title),
      statute: normalize(note.statute ?? ""),
      tags: normalize((note.tags ?? []).join(" ")),
      body: normalize(note.body),
      subject: normalize(note.subject),
    };
    const matchedFields = new Set<string>();
    let score = 0;
    for (const term of terms) {
      let found = false;
      for (const [field, value] of Object.entries(fields)) {
        if (value.includes(term)) {
          found = true;
          matchedFields.add(field);
          score += ({ title: 8, statute: 7, tags: 5, subject: 3, body: 1 } as Record<string, number>)[field];
        }
      }
      if (!found) return [];
    }
    score += Math.max(0, Math.min(5, note.examPriority ?? 0));
    return [{ note, score, matchedFields: [...matchedFields] }];
  }).sort((a, b) => b.score - a.score || a.note.id.localeCompare(b.note.id)).slice(0, limit);
}
