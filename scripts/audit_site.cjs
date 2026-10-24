const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),site=path.join(root,'site'),c=vm.createContext({window:{}});
const html=fs.readFileSync(path.join(site,'library.html'),'utf8');
for(const m of html.matchAll(/<script src="([^?]+)\?[^"]+"><\/script>/g)){if(m[1].startsWith('library-'))vm.runInContext(fs.readFileSync(path.join(site,m[1]),'utf8'),c);}
const lib=c.window.LEX_LIBRARY,personal=JSON.parse(fs.readFileSync(path.join(root,'content/personal-notes.json'))),kb=JSON.parse(fs.readFileSync(path.join(root,'content/knowledge-base.json')));
const ids=xs=>{assert.equal(new Set(xs.map(x=>x.id)).size,xs.length);};
ids(lib.questions);ids(personal.subjects.flatMap(s=>s.chapters));ids(kb.subjects.flatMap(s=>s.cards));
const errors=[];
for(const q of lib.questions){if(q.options.length!==4||q.explanations.length!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3||!q.currentReview)errors.push(q.id);}
const suspicious=[];
const terms=/二十歲|20歲|女.{0,3}十六|女.{0,3}16|第12.?1條|1223|第96條|§96/;
for(const q of lib.questions){const s=q.question+' '+q.options[q.answer]+' '+q.explanations.join(' ');if(terms.test(s))suspicious.push({id:q.id,subject:q.subject,question:q.question,answer:q.options[q.answer],explanations:q.explanations,review:q.currentReview});}
const broken=[];
for(const file of fs.readdirSync(site).filter(x=>x.endsWith('.html'))){for(const m of fs.readFileSync(path.join(site,file),'utf8').matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)){const p=m[1];if(!/^(https?:|data:|mailto:)/.test(p)&&!fs.existsSync(path.join(site,p)))broken.push({file,path:p});}}
const book=JSON.parse(fs.readFileSync(path.join(site,'books/wan-jie-fa-shen/manifest.json')));
const report={date:'2026-10-24',scope:'全站結構、來源及重點風險檢查；不等於1770題逐題法律審定',counts:{archivedQuestions:lib.questions.length,archivedNotes:lib.notes.length,teacherBlocks:lib.teacherQuestions.length,personalUnits:personal.subjects.reduce((n,s)=>n+s.chapters.length,0),summaryCards:kb.subjects.reduce((n,s)=>n+s.cards.length,0),novelChapters:book.chapters.length},invalidQuestions:errors,brokenLocalLinks:broken,suspicious};
fs.writeFileSync(path.join(root,'content/maintenance/site-audit-2026-10-24.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(root,'../audit-questions.json'),JSON.stringify(lib.questions));
console.log(JSON.stringify({counts:report.counts,invalid:errors,broken,lawtext:lib.questions.filter(q=>q.id.startsWith('lawtext-')).reduce((o,q)=>(o[q.id.split('-')[1]]=(o[q.id.split('-')[1]]||0)+1,o),{})}));
