'use strict';
/**
 * 全職法師：萬界法神 — 連載資料完整性與章節字數巡檢。
 * 結構錯誤應使部署失敗；字數不足只列為編輯待辦，不阻擋網站發布。
 * 使用 Unicode code points（含標點與空白）統計正文 text，不含章名。
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.join(__dirname, '..', 'site', 'books', 'wan-jie-fa-shen');
const manifest = JSON.parse(fs.readFileSync(path.join(base, 'manifest.json'), 'utf8'));
assert(Array.isArray(manifest.chapters), 'manifest.chapters must be an array');
assert.equal(manifest.chapterCount, manifest.chapters.length, 'manifest chapterCount mismatch');
const files = new Map();
const allNumbers = new Set();
let under2500 = 0;
let under2500Effective = 0;
let under1500 = 0;
let totalCharacters = 0;
for (let i = 0; i < manifest.chapters.length; i++) {
  const entry = manifest.chapters[i];
  assert.equal(entry.number, i + 1, 'manifest chapter numbering must be consecutive');
  assert(/^chapters-\d{3}\.json$/.test(entry.part), 'unexpected chapter part path');
  if (!files.has(entry.part)) {
    const chapters = JSON.parse(fs.readFileSync(path.join(base, entry.part), 'utf8'));
    assert(Array.isArray(chapters), 'chapter part must be an array: ' + entry.part);
    files.set(entry.part, chapters);
  }
  const matching = files.get(entry.part).filter(c => c.number === entry.number);
  assert.equal(matching.length, 1, 'missing or duplicate chapter ' + entry.number + ' in ' + entry.part);
  const chapter = matching[0];
  assert.equal(typeof chapter.text, 'string', 'missing text in chapter ' + entry.number);
  assert(chapter.text.trim().length > 0, 'empty chapter ' + entry.number);
  assert.equal(chapter.title, entry.title, 'chapter title differs from manifest: ' + entry.number);
  assert(!allNumbers.has(chapter.number), 'duplicate chapter number ' + chapter.number);
  allNumbers.add(chapter.number);
  const length = [...chapter.text].length;
  // Effective length excludes whitespace and punctuation; keep this gate in
  // sync with the last chapter published from the revised master archive.
  const effective = [...chapter.text].filter(ch => /[\p{L}\p{N}]/u.test(ch)).length;
  if (chapter.number >= 376 && chapter.number <= 411) {
    assert(effective >= 2500, 'revised chapter below 2500 effective characters: ' + chapter.number);
  }
  if (effective < 2500) under2500Effective++;
  totalCharacters += length;
  if (length < 2500) under2500++;
  if (length < 1500) under1500++;
}
const partsTotal = [...files.values()].reduce((n, a) => n + a.length, 0);
assert.equal(partsTotal, manifest.chapterCount, 'unindexed chapters exist in parts');
console.log(JSON.stringify({
  project: manifest.title,
  chapterCount: manifest.chapterCount,
  totalCharacters,
  averageCharacters: Math.round(totalCharacters / manifest.chapterCount),
  under2500,
  under2500Effective,
  under1500,
  target: 2500,
  note: '字數不足為待編修警示，不視為通過品質審查。'
}, null, 2));
