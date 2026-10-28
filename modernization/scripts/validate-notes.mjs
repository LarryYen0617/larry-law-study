import { readFileSync } from 'node:fs';
const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/validate-notes.mjs notes.json'); process.exit(2); }
let notes;
try { notes = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(e.message); process.exit(2); }
if (!Array.isArray(notes)) { console.error('Expected a JSON array'); process.exit(1); }
const ids = new Set(), issues = [];
for (const [i, n] of notes.entries()) {
  if (!n || typeof n !== 'object') { issues.push(`Row ${i}: not an object`); continue; }
  for (const key of ['id','subject','title','body']) if (typeof n[key] !== 'string' || !n[key].trim()) issues.push(`Row ${i}: missing ${key}`);
  if (typeof n.id === 'string') { if (ids.has(n.id)) issues.push(`Row ${i}: duplicate id ${n.id}`); ids.add(n.id); }
  if (n.tags !== undefined && (!Array.isArray(n.tags) || n.tags.some(t => typeof t !== 'string'))) issues.push(`Row ${i}: invalid tags`);
  if (n.examPriority !== undefined && (!Number.isInteger(n.examPriority) || n.examPriority < 0 || n.examPriority > 5)) issues.push(`Row ${i}: invalid examPriority`);
}
if (issues.length) { console.error(issues.join('\n')); process.exit(1); }
console.log(`Validated ${notes.length} notes`);
