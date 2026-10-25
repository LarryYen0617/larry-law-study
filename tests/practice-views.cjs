const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const site=path.resolve(__dirname,'../site'),nodes=new Map(),events={};
function node(id){if(!nodes.has(id))nodes.set(id,{hidden:false,innerHTML:'',textContent:'',scrollIntoView(){},setAttribute(){}});return nodes.get(id);}
let topic,canSave=true,guided=0;
const ctx=vm.createContext({URL,console,location:{href:'https://example.org/practice.html?view=templates'},history:{replaceState(){}},navigator:{clipboard:{writeText:async()=>{}}},window:{},document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener:(e,f)=>events[e]=f}});
for(const f of ['essay-template-data.js','essay-template-core.js','exam-disputes.js'])vm.runInContext(fs.readFileSync(path.join(site,f),'utf8'),ctx);
const data=ctx.window.LEX_ESSAY_TEMPLATES;
topic=data.topics[0];ctx.window.LEX_PRACTICE_DESK={topic:()=>topic,flush:()=>canSave,guided:()=>guided++};
vm.runInContext(fs.readFileSync(path.join(site,'practice-views.js'),'utf8'),ctx);
async function click(dataset){await events.click({target:{closest:sel=>sel==='button'?{dataset}:null}});}
(async()=>{
 for(const t of data.topics){topic=t;ctx.window.LEX_EXAM_VIEWS.refresh();assert(node('practiceTemplatePanel').innerHTML.includes(t.example.answer[0].replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")));assert(node('practiceTemplatePanel').innerHTML.includes('完整自編擬答'));}
 await click({examBase:'yes'});assert(node('practiceTemplatePanel').innerHTML.includes('本科作答總架構'));
 await click({examView:'disputes'});assert(node('practiceWritingPanel').hidden);assert(!node('practiceDoctrinePanel').hidden);assert(node('practiceSubjects').hidden);
 for(const r of ctx.window.LEX_EXAM_DISPUTES){await click({examDispute:r.id});assert(node('practiceDoctrinePanel').innerHTML.includes(r.citation));assert(node('practiceDoctrinePanel').innerHTML.includes(r.example.answer[0]));assert.equal(r.views.length,2);assert(new URL(r.url).hostname.endsWith('.judicial.gov.tw'));}
 canSave=false;await click({examView:'writing'});assert(node('practiceWritingPanel').hidden);
 canSave=true;await click({examView:'writing'});assert(!node('practiceWritingPanel').hidden);assert(!node('practiceSubjects').hidden);
 await click({examView:'templates'});await click({examWrite:'true'});assert.equal(guided,1);assert(!node('practiceWritingPanel').hidden);
 console.log('PASS: 27 topic templates and answers, subject frames, four sourced disputes, consolidated view switching and failed-save protection.');
})().catch(e=>{console.error(e);process.exitCode=1;});
