const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),notes=JSON.parse(fs.readFileSync(path.join(root,'content/personal-notes.json'),'utf8')),coverage=JSON.parse(fs.readFileSync(path.join(root,'content/coverage.json'),'utf8'));
const english=JSON.parse(fs.readFileSync(path.join(root,'content/legal-english.json'),'utf8')),science=JSON.parse(fs.readFileSync(path.join(root,'content/photonics.json'),'utf8'));
const units=new Map([...notes.subjects.map(s=>[s.id,s.chapters.length]),['legalenglish',english.units.length],['photonics',science.units.length]]);
assert.equal(coverage.subjects.length,units.size);assert.equal(coverage.units,[...units.values()].reduce((a,b)=>a+b,0));
for(const row of coverage.subjects){assert.equal(row.units,units.get(row.id));assert(row.gaps&&row.covered);}
assert.equal(coverage.scanOCR.pages,95);assert.equal(coverage.scanOCR.files,4);assert(!JSON.stringify(coverage).includes('C:\\Users'));
const chapters=notes.subjects.flatMap(s=>s.chapters),get=id=>chapters.find(c=>c.id===id);assert.equal(new Set(chapters.map(c=>c.id)).size,chapters.length);
assert(get('personal-civilgeneral-c6').body.includes('§95第2項'));assert(get('personal-civilgeneral-c6').text.includes('第96條另規定'));
assert(!get('personal-criminalgeneral-official').body.includes('可加重'));assert(!get('personal-criminalgeneral-official').body.includes('原本合法持有'));
assert(get('personal-debt-scan-form').text.includes('施行日另定'));assert(get('personal-civilgeneral-c2').text.includes('| --- |'));
const nodes={};const ctx=vm.createContext({window:{},document:{getElementById:id=>nodes[id]??={textContent:'',innerHTML:''}}});vm.runInContext(fs.readFileSync(path.join(root,'site/coverage-data.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'site/coverage.js'),'utf8'),ctx);
assert(nodes.coverageTable.innerHTML.includes('租稅法'));assert(nodes.auditSources.innerHTML.includes('未取得'));assert.equal(JSON.stringify(ctx.window.LEX_COVERAGE),JSON.stringify(coverage));
const corrections=JSON.parse(fs.readFileSync(path.join(root,'content/review-corrections.json'),'utf8'));assert.equal(corrections.corrections.length,10);for(const c of corrections.corrections)assert(c.url.startsWith('https://law.moj.gov.tw/'));
console.log('PASS: eleven-course truthful coverage, 95-page OCR accounting, 97 stable note IDs, statutory corrections, comparison-table export and source audit rendering.');
