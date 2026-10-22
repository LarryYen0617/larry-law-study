const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../site'),nodes=new Map(),events={},saved=new Map();
const node=s=>{if(!nodes.has(s))nodes.set(s,{innerHTML:'',value:'',textContent:'',dataset:{},addEventListener(t,f){this[t]=f;}});return nodes.get(s);};
const ctx=vm.createContext({window:{print(){}},URL,Blob,setTimeout,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},document:{querySelector:node,querySelectorAll:()=>[],addEventListener(t,f){(events[t]??=[]).push(f);},createElement:()=>({click(){}})}});
for(const name of ['knowledge-data.js','personal-notes-data.js','personal-notes.js','essentials.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx);
const data=ctx.window.LEX_PERSONAL_NOTES,run=s=>vm.runInContext(s,ctx);
assert.equal(data.subjects.length,9);assert.equal(data.subjects.find(s=>s.id==='criminalgeneral').chapters.filter(c=>c.source.startsWith('CriminalLaw.html')).length,21);assert.equal(data.subjects.find(s=>s.id==='civilgeneral').chapters.length,14);assert.equal(data.subjects.find(s=>s.id==='constitution').chapters.filter(c=>c.source.startsWith('Constitution.html')).length,13);
assert.equal(JSON.stringify(data),JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'../content/personal-notes.json'),'utf8'))));
for(const s of data.subjects)for(const c of s.chapters){assert(c.id&&c.source&&c.focus&&c.text&&c.review);assert(!/<(?:script|iframe|style|img)\b/i.test(c.body));assert(!/\son\w+\s*=|javascript:/i.test(c.body));}
node('#knowledgeSubject').change({target:{value:'criminalgeneral'}});assert(node('#knowledgeContent').innerHTML.includes('我的複習筆記'));assert(node('#knowledgeContent').innerHTML.includes('先記這一句'));assert(!node('#knowledgeContent').innerHTML.includes('可減輕或免除其刑'));
const id=data.subjects[0].chapters[0].id;for(const f of events.input)f({target:{dataset:{caseDraft:id},value:'我自己的補充'}});assert.equal(JSON.parse(saved.get('lex-nexus-study-v1')).drafts[id],'我自己的補充');assert(run('personalMarkdown()').includes('我自己的補充'));
node('#knowledgeSearch').input({target:{value:'客觀歸責'}});assert(node('#knowledgeContent').innerHTML.includes('客觀歸責'));
node('#knowledgeSearch').input({target:{value:'not-found-abc'}});assert(node('#knowledgeContent').innerHTML.includes('沒有符合的筆記'));
console.log('PASS: 48 restored full chapters, nine-subject integration, inert imported HTML, source provenance, corrections, search, personal annotations and complete-note export.');
