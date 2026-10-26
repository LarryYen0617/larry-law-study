/* Add course and checked classroom questions without moving their saved records. */
(()=>{
 const L=window.LEX_LIBRARY,K=window.LEX_KNOWLEDGE;if(!L||typeof COURSES==='undefined')return;
 L.teacherQuestions.forEach(q=>q.subject??='親屬法');
 const names=Object.fromEntries(COURSES.map(c=>[c.id,c.name]));
 const extra=COURSES.flatMap(c=>c.topics.map((t,i)=>({id:'course-'+c.id+'-'+i,subject:c.name,topic:t.title,question:t.question,options:t.options,answer:t.correct,explanations:t.options.map(()=>t.explain),hint:t.rule,origin:'課程自編基礎練習',archiveFile:'site/data.js',currentReview:'2026-10-26',checkedAt:'2026-10-26',native:{kind:'course',id:c.id+'-'+i}})));
 for(const q of K?.quizzes||[])extra.push({id:'class-'+q.id,subject:names[q.subject],topic:'課堂題型改寫',question:q.title,options:q.options,answer:q.correct,explanations:q.options.map(()=>q.why),hint:'先分辨題目所問要件。',origin:q.source,archiveFile:'content/knowledge-base.json',currentReview:'2026-10-26',checkedAt:'2026-10-26',native:{kind:'class',id:q.id}});
 L.questions.push(...extra);
 for(const c of K?.cases||[])L.teacherQuestions.push({id:c.id,subject:names[c.subject],topic:c.title,question:c.facts+'\n'+c.issues.join('；'),answer:c.answer.join('\n\n'),source:c.source,page:'原題題號見來源',provenance:c.provenance,correction:{label:'課堂題型改寫・自編擬答',analysis:c.answer.join('\n\n'),sources:c.refs.map(r=>({title:r.label,url:r.url}))}});
 const key=q=>q.native.kind==='course'?'larry-law-midterm-v1':'lex-nexus-study-v1';
 function read(q){try{const s=JSON.parse(localStorage.getItem(key(q))||'{}');if(s.retake?.[q.native.id])return undefined;return s.answers?.[q.native.id]?.choice;}catch{return undefined;}}
 function write(q,choice){const k=key(q),s=JSON.parse(localStorage.getItem(k)||'{}'),id=q.native.id;s.answers??={};if(choice===null){if(q.native.kind==='course'){s.retake??={};s.retake[id]=true;}else delete s.answers[id];}else{const old=s.answers[id]||{};s.answers[id]={...old,choice,count:(old.count||0)+1,...(q.native.kind==='course'?{wrong:old.wrong||choice!==q.answer,misses:(old.misses||0)+(choice!==q.answer?1:0)}:{})};if(s.retake)delete s.retake[id];}if(q.native.kind==='course')s.version=1;localStorage.setItem(k,JSON.stringify(s));}
 window.LEX_QUESTION_ADAPTER={read,write};
})();
