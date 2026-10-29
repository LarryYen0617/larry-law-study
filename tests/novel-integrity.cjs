'use strict';
/**
 * 全職法師：萬界法神 — 連載資料完整性與章節字數巡檢。
 * 結構錯誤應使部署失敗；字數不足只列為編輯待辦，不阻擋網站發布。
 * 使用 Unicode code points（含標點與空白）統計正文 text，不含章名。
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const base = path.join(__dirname, '..', 'site', 'books', 'wan-jie-fa-shen');
const manifest = JSON.parse(fs.readFileSync(path.join(base, 'manifest.json'), 'utf8'));
assert(Array.isArray(manifest.chapters), 'manifest.chapters must be an array');
assert.equal(manifest.chapterCount, manifest.chapters.length, 'manifest chapterCount mismatch');
// SHA-256 of published chapter bodies, independently generated from the
// preserved revision ZIP (excluding the chapter title). This prevents a
// web-only edit from silently diverging from the reviewed master manuscript.
const revisionHashes = new Map([
  [421, '0dd87324b1d3aa8e67c8842767c61956e0b12cf58c89dde6af550c55fd53d7ac'],
  [422, 'db449a97f17ec3b19b05d89d8755528f309958f23ff3c58bbbb0c34e5dfcfab7'],
  [423, '5d39567d9bbe8351923ee0d1876e933d2f46c98a71dbcaf5aab1d7aa5ca194e6'],
  [424, '77d881b7d2f2217d91f98f1865bd0ae736cc570390158a955ee9b237c39b988e'],
  [425, 'e7174dc61f1184bfc2bc398074fdf77cf65be81f36a7577094bac5ac74fa7e1e'],
  [426, 'fc80347e00ee6ec8b20acdbd997eef07d31375a89d6f791f904d654eb40e6123'],
  [427, '78bac79e9fe5dfd2a478cf15f8beac73e24e13d1ee7657c152719a9016c634d8'],
  [428, '4aab5d7c8cc56a06e7ac76b906804df514ce4827e38085456255642117f032b9'],
  [429, '7bf0176be7ec480b5ebfbca213538fb7df4e4f28ad0bcc11466be20f5af2dbb2'],
  [430, '26d102b89bee848e1b0192f6f886e5c763792179f707dfa91257e060cc7aeaa2'],
  [431, '879233ae2d6435732da42c4be67fe006c69f6b860c6058953894aeae055e3fa5'],
  [432, '92e127a511990dbe9a50a45b96589e71509e808a165afd493cc6463d27744e10'],
  [433, '30cf7709e385d904d069729a07015d055ba544bc60469cbbfe87c44ab4d96dfe'],
  [434, 'fb74421bb7b8b0263aaefdfa49a9dd96829a2f3a5994ec0c54dd15b42b4727bb'],
  [435, '5ce07f4f1b1b97289565a9bbc74c3b462ebe28652468e6b149ccad0d480cbf11'],
  [436, '375dc8094cdd824d6ee1f14d34d8089cd73c965675ce62f3e5484c594aa7b5ea'],
  [437, '1c04e22656c0f108ad1e76bd6604ca37dc68072422ee98dbca6e74d6bcc2b56d'],
  [438, 'b07d75765b2655b1d3e10e3d5e900986b50ac4e82dd9f2678b3853c8e34fd248'],
  [439, 'bb261d42ea67fb4a29f374507e1fe3fc69b96501ecaa70accc78bea21b4fb40b'],
  [440, 'ff9af0dc5dec152b91e793426a42db1e268e6c2493bd613b5ef6b51218b02982'],
  [441, '4d4f98705b7927931ad13c14e3b7aa80d10389e1b946be69a9d054e24c5433a2'],
  [442, '8f8503319923649c931856b55e897a6fb6c9dc46895fad762684535e5806bd76'],
  [443, '596591ef3a57b78e696fa76de6f97f506b29f898c0e7aa57cd39ddd1d4f7442b'],
  [444, '40e2b432b4c02d385555ea0abb3336e9064ff67329ee5b82e73082be53042da6'],
]);
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
  if (chapter.number >= 376 && chapter.number <= 444) {
    assert(effective >= 2500, 'revised chapter below 2500 effective characters: ' + chapter.number);
  }
  if (revisionHashes.has(chapter.number)) {
    const actualHash = crypto.createHash('sha256').update(chapter.text, 'utf8').digest('hex');
    assert.equal(actualHash, revisionHashes.get(chapter.number),
      'published chapter diverges from reviewed master archive: ' + chapter.number);
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
