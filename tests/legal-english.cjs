const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync('content/legal-english.json','utf8'));
assert.equal(data.exam.date,'2026-10-29');assert.equal(data.exam.venue,'M517');assert.equal(data.exam.scope.length,3);assert.equal(data.exam.excluded.length,0);
const c={window:{LEX_LIBRARY:{questions:[{id:'existing-1'}]}},};vm.createContext(c);for(const f of ['legal-english-data.js','legal-english-adapter.js'])vm.runInContext(fs.readFileSync('site/'+f,'utf8'),c);vm.runInContext(fs.readFileSync('site/legal-english-adapter.js','utf8'),c);assert.equal(c.window.LEX_LIBRARY.questions.length,62);assert.equal(c.window.LEX_LIBRARY.questions[0].id,'existing-1');
for(const q of data.questions){assert.equal(new Set(q.options).size,4);assert.equal(q.explanations.length,4);assert(q.source);assert(q.options[q.answer]);}
for(const view of ['notes','vocabulary','practice','reading','writing','sources']){
 const nodes={},events={};const el=id=>nodes[id]??={innerHTML:'',textContent:'',addEventListener(){}};
 const st=new Map([['lex-nexus-library-v1',JSON.stringify({answers:{old:2},drafts:{old:'preserve'}})]]);
 const env={window:{LEX_ENGLISH:data},URL,location:{href:'https://example.org/legal-english.html?view='+view},document:{getElementById:el,querySelectorAll:()=>[],addEventListener:(t,f)=>events[t]=f},localStorage:{getItem:k=>st.get(k),setItem:(k,v)=>st.set(k,v)}};
 vm.runInNewContext(fs.readFileSync('site/legal-english.js','utf8'),env);
 assert(el('englishContent').innerHTML.length>100,view);assert(!el('englishContent').innerHTML.includes('undefined'),view);
 events.input({target:{dataset:{draft:'en-writing-0'},value:'Test answer'}});const saved=JSON.parse(st.get('lex-nexus-library-v1'));assert.equal(saved.answers.old,2);assert.equal(saved.drafts.old,'preserve');assert.equal(saved.drafts['en-writing-0'],'Test answer');
}
console.log('PASS: English six views, exam evidence, unique choices, idempotent shared bank and preservation of existing records.');
