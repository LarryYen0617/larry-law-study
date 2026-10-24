const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),site=path.join(root,'site');
const ctx=vm.createContext({window:{}});
for(const m of fs.readFileSync(path.join(site,'library.html'),'utf8').matchAll(/<script src="([^?]+)\?[^"]+"><\/script>/g)){if(m[1]==='library.js')break;vm.runInContext(fs.readFileSync(path.join(site,m[1]),'utf8'),ctx);}
const c=ctx.window.LEX_LIBRARY,get=id=>c.questions.find(q=>q.id===id),teacher=c.teacherQuestions;
// Regressions from independently identified legal errors, not merely field counts.
assert.equal(get('gem-1-46').answer,2);assert(get('gem-1-46').hint.includes('信賴'));
assert(get('gem-1-17').options[1].includes('心中'));assert(get('gem-1-17').hint.includes('六個月'));
assert(get('gem-2-1').options[3].includes('從舊從輕'));
assert.equal(get('gem-2-2').answer,2);assert.equal(get('gem-2-20').answer,0);
assert.equal(get('gem-2-44').answer,0);assert(get('gem-2-39').options[0].includes('變得之物'));
assert(get('gem-2-11').options[3].includes('刑事責任'));
assert(get('gem-3-14').options[3].includes('警察機關'));assert(!get('gem-3-49').question.includes('現行民法未允許'));
assert(teacher[90].correction.analysis.includes('效力未定'));assert(teacher[90].correction.analysis.startsWith('17歲丙'));assert(teacher[90].correction.analysis.includes('1119')); assert(teacher[70].correction.analysis.includes('原附「無須解除表示」錯誤'));
assert(teacher[84].correction.analysis.includes('基礎380'));assert(teacher[84].correction.analysis.includes('基礎180'));
assert(!teacher[30].correction.analysis.includes('1055-3'));assert(teacher[87].correction.analysis.includes('245'));
for(const q of c.questions){assert.equal(new Set(q.options.map(x=>x.trim())).size,4,q.id);assert(q.explanations.length===4);assert(!/待補充查核/.test(q.explanations.join('')),q.id);}
for(const q of teacher){assert(q.correction?.analysis.length>20,q.id);assert(q.correction.sources.every(s=>s.url.startsWith('https://law.moj.gov.tw/')),q.id);}
assert.equal(c.notes.filter(n=>n.table).length,4);
const ledger=JSON.parse(fs.readFileSync(path.join(root,'content/maintenance/question-review-2026-10-24.json'),'utf8'));
assert.equal(ledger.questions.length,1770);assert.equal(ledger.teacher.length,91);
assert.equal(ledger.questions.filter(q=>q.revised).length,152);
for(const q of ledger.questions){assert(q.basis.length);assert.equal(q.sha256.length,64);}
console.log('PASS: substantive answer corrections, unambiguous choices, 91 authored teacher analyses, calculation regressions, comparison tables and complete evidence coverage.');
