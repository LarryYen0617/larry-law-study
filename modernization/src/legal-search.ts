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
// Canonicalize spaced and shorthand statute citations before tokenization.
// For example, "民法第 ７５９－１ 條" becomes "民法第759條之1".
const normalizeCitations = (value: string): string =>
  value.normalize("NFKC")
    .replace(/第\s*(\d+)\s*-\s*(\d+)\s*條/g, "第$1條之$2")
    .replace(/第\s*(\d+)\s*條\s*-\s*(\d+)/g, "第$1條之$2")
    .replace(/第\s*(\d+)\s*條\s*之\s*(\d+)/g, "第$1條之$2")
    .replace(/第\s*(\d+)\s*條/g, "第$1條")
    .replace(/§\s*(\d+)\s*(?:-\s*(\d+)|之\s*(\d+))/g,
      (_match, number: string, a: string | undefined, b: string | undefined) => "§" + number + "-" + (a || b))
    .replace(/§\s*(\d+)/g, "§$1")
    .replace(/\s+/g, " ").trim();
const normalize = (value: string): string =>
  normalizeCitations(value).toLocaleLowerCase("zh-TW");
const tokens = (value: string): string[] => normalize(value).split(/\s+/).filter(Boolean);
const aliases: Record<string, string> = {
  刑總: "刑法總則", 民總: "民法總則", 債總: "債權", 刑分: "刑法分則", 法英: "法學英文",
};

// Keep inserted article numbers exact: 759, 759-1 and 759-10 are distinct.
// Queries may use 第759條之1, §759-1, 759-1, or 民法759-1.
function variants(term: string): string[] {
  const named = term.match(/^第(\d+)條(?:之(\d+))?$/);
  const section = term.match(/^§(\d+)(?:-(\d+))?$/);
  // Students also write 759-1, 759之1, or 759條之1 without 第/§.
  const bare = term.match(/^(\d{1,4})(?:-|條之|之)(\d{1,3})$/);
  if (!named && !section && !bare) return aliases[term] ? [term, aliases[term]] : [term];
  const number = named?.[1] ?? section?.[1] ?? bare?.[1] ?? "";
  const suffix = named?.[2] ?? section?.[2] ?? bare?.[2];
  return suffix
    ? ["第" + number + "條之" + suffix, "§" + number + "-" + suffix, number + "-" + suffix]
    : ["第" + number + "條", "§" + number];
}
function queryGroups(query: string): string[][] {
  return tokens(query).flatMap(token => {
    const compound = token.match(/^(.+?)(第\d+條(?:之\d+)?|§\d+(?:-\d+)?)$/)
      || token.match(/^(.+?法)(\d{1,4}(?:-|條之|之)\d{1,3})$/);
    return (compound ? [compound[1], compound[2]] : [token]).map(variants);
  });
}
function containsTerm(text: string, term: string): boolean {
  const named = term.match(/^第(\d+)條(?:之(\d+))?$/);
  if (named) {
    const pattern = "第" + named[1] + "條" +
      (named[2] ? "之" + named[2] + "(?![\\d-])" : "(?!之\\d)");
    return new RegExp(pattern).test(text);
  }
  const section = term.match(/^§(\d+)(?:-(\d+))?$/);
  if (section) {
    const pattern = "§" + section[1] +
      (section[2] ? "-" + section[2] + "(?![\\d-])" : "(?![-\\d])");
    return new RegExp(pattern).test(text);
  }
  const bare = term.match(/^(\d+)-(\d+)$/);
  if (bare) return new RegExp("(?:^|[^\\d-])" + bare[1] + "-" + bare[2] + "(?![\\d-])").test(text);
  return text.includes(term);
}
export function searchLawNotes(
  notes: readonly LawNote[],
  query: string,
  options: { subject?: string; limit?: number } = {},
): SearchHit[] {
  const terms = queryGroups(query);
  if (!terms.length) return [];
  const requestedLimit = options.limit ?? 30;
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(0, Math.min(500, Math.trunc(requestedLimit))) : 30;
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
    for (const alternatives of terms) {
      let found = false;
      for (const [field, value] of Object.entries(fields)) {
        if (alternatives.some(term => containsTerm(value, term))) {
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
