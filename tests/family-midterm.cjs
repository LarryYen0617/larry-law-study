const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context={window:{LEX_LIBRARY:{teacherQuestions:[]}}};
for(let n=1;n<=5;n++)vm.runInNewContext(fs.readFileSync(`site/library-teacher-${String(n).padStart(2,'0')}.js`,'utf8'),context);
const html=fs.readFileSync('site/class-notes/family-midterm-1151.html','utf8');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])).replace(/ +(?=\n)/g,s=>'&#32;'.repeat(s.length));
const originals=context.window.LEX_LIBRARY.teacherQuestions;
assert.equal(originals.length,91);
for(const row of originals){assert(html.includes(`id="${row.id}"`));assert(html.includes(`<pre>${escape(row.question)}</pre>`));if(row.answer)assert(html.includes(`<pre>${escape(row.answer)}</pre>`));}
const correction=JSON.parse(fs.readFileSync('content/teacher-corrections.json')).items;
for(const row of originals)assert(html.includes(escape(correction.find(c=>c.id===row.id).analysis)));
const audit=JSON.parse(fs.readFileSync('content/maintenance/family-midterm-2026-11-01.json'));
assert.equal(audit.attachments.length,10);assert.equal(audit.attachments.reduce((n,r)=>n+r.pages,0),80);
const index=JSON.parse(fs.readFileSync('site/search-index.json')).items;
const guide=index.find(r=>r.href==='class-notes/family-midterm-1151.html');assert(guide);
for(const row of originals)if(row.question.length>80)assert(!guide.body.includes(row.question.slice(0,80)),'Original copied into search result');
console.log('PASS: 91 stable original prompts/answers and independent corrections, 10 PDFs/80 pages, guide discoverable without copied original answers.');
