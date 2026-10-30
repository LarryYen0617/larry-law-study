/* Read-only audit: every published search result must point to an existing local HTML file. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

function audit(index, siteRoot) {
  const problems = [];
  const root = path.resolve(siteRoot);
  if (!index || index.version !== 1 || !Array.isArray(index.items)) {
    return { total: 0, problems: ['invalid index schema'] };
  }
  const seen = new Set();
  for (const [position, item] of index.items.entries()) {
    const row = position + 1;
    if (!item || typeof item !== 'object') {
      problems.push('row ' + row + ': invalid record');
      continue;
    }
    if (typeof item.id !== 'string' || !item.id.trim() || seen.has(item.id)) {
      problems.push('row ' + row + ': missing or duplicate id');
    } else seen.add(item.id);
    const href = item.href;
    if (typeof href !== 'string' || /[\\\x00-\x1f]/.test(href)) {
      problems.push('row ' + row + ': invalid link');
      continue;
    }
    const rawPath = href.split(/[?#]/, 1)[0];
    if (!rawPath || rawPath.startsWith('/') || !rawPath.endsWith('.html') ||
        /%2e|%2f|%5c/i.test(rawPath) || rawPath.split('/').some(p => !p || p === '.' || p === '..')) {
      problems.push('row ' + row + ': unsafe path');
      continue;
    }
    let target;
    try {
      const url = new URL(href, 'https://audit.invalid/site/');
      if (url.origin !== 'https://audit.invalid' || !url.pathname.startsWith('/site/')) {
        problems.push('row ' + row + ': off-site link');
        continue;
      }
      target = path.resolve(root, rawPath);
    } catch {
      problems.push('row ' + row + ': malformed link');
      continue;
    }
    if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
      problems.push('row ' + row + ': missing local HTML target (' + rawPath + ')');
    }
  }
  return { total: index.items.length, problems };
}

function auditPropertyCards(index, cards) {
  const problems = [];
  const byId = new Map(index.items.map(row => [row.id, row]));
  for (const card of cards) {
    const id = 'card:' + card.id;
    const hit = byId.get(id);
    if (!hit) { problems.push('missing property midterm card: ' + id); continue; }
    const expected = 'essentials.html?subject=property&card=' + encodeURIComponent(card.id)
      + '&focus=' + encodeURIComponent(card.title);
    if (hit.type !== 'card' || hit.subject !== 'property' || hit.title !== card.title || hit.href !== expected) {
      problems.push('incorrect property midterm card metadata: ' + id);
    }
    if (hit.body.includes('originalQuestion') || hit.body.includes('originalAnswer')) {
      problems.push('private teacher source marker in property midterm card: ' + id);
    }
  }
  return problems;
}

function selfTest() {
  const os = require('node:os');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'search-index-links-'));
  try {
    fs.writeFileSync(path.join(temp, 'index.html'), '<title>ok</title>');
    const entry = (id, href) => ({ id, href });
    assert.equal(audit({ version: 1, items: [entry('a', 'index.html?q=x#part')] }, temp).problems.length, 0);
    for (const href of ['../index.html', '/index.html', 'https://evil.test/index.html',
      'javascript:evil.html', 'missing.html', 'sub/%2e%2e/index.html', 'index.html\\bad']) {
      assert.ok(audit({ version: 1, items: [entry('a', href)] }, temp).problems.length, href);
    }
    assert.ok(audit({ version: 1, items: [entry('a', 'index.html'), entry('a', 'index.html')] }, temp).problems.length);
    assert.ok(audit({ version: 2, items: [] }, temp).problems.length);
    const card = {id:'property-midterm-demo',title:'民法第828條：公同共有'};
    const good = {version:1,items:[{id:'card:'+card.id,type:'card',subject:'property',
      title:card.title,body:'自編卡片',href:'essentials.html?subject=property&card=property-midterm-demo&focus='+encodeURIComponent(card.title)}]};
    assert.deepEqual(auditPropertyCards(good,[card]),[],'published property card is searchable');
    assert.ok(auditPropertyCards({version:1,items:[]},[card]).length,'missing property card must fail');
    assert.ok(auditPropertyCards({version:1,items:[{...good.items[0],href:'wrong.html'}]},[card]).length,
      'incorrect property card target must fail');
    console.log('PASS: search link audit rejects missing, external, traversal, duplicate and malformed entries');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (require.main === module) {
  if (process.argv.includes('--self-test')) selfTest();
  else {
    const root = path.resolve(__dirname, '../site');
    const index = JSON.parse(fs.readFileSync(path.join(root, 'search-index.json'), 'utf8'));
    const report = audit(index, root);
    const propertyCards = JSON.parse(fs.readFileSync(path.resolve(__dirname,'../content/property-midterm-cards.json'),'utf8')).cards;
    report.problems.push(...auditPropertyCards(index, propertyCards));
    console.log('Search link audit: ' + report.total + ' entries; ' + report.problems.length + ' problems');
    if (report.problems.length) {
      console.error(report.problems.slice(0, 30).join('\n'));
      if (report.problems.length > 30) console.error('... ' + (report.problems.length - 30) + ' additional problems');
      process.exitCode = 1;
    }
  }
}
module.exports = { audit };
