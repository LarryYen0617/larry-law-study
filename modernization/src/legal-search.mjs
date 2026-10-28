/** Runtime counterpart of legal-search.ts, for Node's built-in test runner. */
const normalize = value => value.normalize("NFKC").toLocaleLowerCase("zh-TW").replace(/\s+/g, " ").trim();
export function searchLawNotes(notes, query, options = {}) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const limit = Math.max(0, Math.min(500, Math.trunc(options.limit ?? 30)));
  return notes.flatMap(note => {
    if (options.subject && note.subject !== options.subject) return [];
    const fields = { title: normalize(note.title), statute: normalize(note.statute ?? ""), tags: normalize((note.tags ?? []).join(" ")), body: normalize(note.body), subject: normalize(note.subject) };
    const matchedFields = new Set();
    let score = 0;
    for (const term of terms) {
      let found = false;
      for (const [field, value] of Object.entries(fields)) {
        if (value.includes(term)) {
          found = true;
          matchedFields.add(field);
          score += { title: 8, statute: 7, tags: 5, subject: 3, body: 1 }[field];
        }
      }
      if (!found) return [];
    }
    score += Math.max(0, Math.min(5, note.examPriority ?? 0));
    return [{ note, score, matchedFields: [...matchedFields] }];
  }).sort((a, b) => b.score - a.score || a.note.id.localeCompare(b.note.id)).slice(0, limit);
}
