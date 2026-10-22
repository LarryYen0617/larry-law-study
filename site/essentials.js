const KNOWLEDGE_KEY='lex-nexus-study-v1',knowledge=window.LEX_KNOWLEDGE;
const ke=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $k=s=>document.querySelector(s);
let knowledgeMode=typeof location!=='undefined'&&location.hash==='#teacher'?'teacher':typeof location!=='undefined'&&location.hash==='#inventory'?'inventory':'notes',knowledgeSubject='',knowledgeQuery='',onlyKnowledgeWrong=false,knowledgeState={familiar:{},answers:{},drafts:{}};
try{const v=JSON.parse(localStorage.getItem(KNOWLEDGE_KEY)||'null');if(v&&typeof v==='object')for(const key of ['familiar','answers','drafts'])if(v[key]&&typeof v[key]==='object'&&!Array.isArray(v[key]))knowledgeState[key]=v[key];}catch{}
function knowledgeSave(){try{localStorage.setItem(KNOWLEDGE_KEY,JSON.stringify(knowledgeState));return true;}catch{$k('#knowledgeStatus').textContent='本機儲存失敗，請先下載練習紀錄備份。';return false;}}
function kr(refs){return `<div class="ref-links">${refs.map(r=>{let u;try{u=new URL(r.url);}catch{return '';}return u.protocol==='https:'&&u.hostname.endsWith('.gov.tw')?`<a href="${ke(u.href)}" target="_blank" rel="noopener noreferrer">${ke(r.label)} ↗</a>`:'';}).join('')}</div>`;}
function knowledgeMatches(v){return !knowledgeQuery||JSON.stringify(v).toLowerCase().includes(knowledgeQuery.toLowerCase());}
function visibleKnowledgeSubjects(){return knowledge.subjects.filter(s=>knowledgeSubject==='all'||s.id===knowledgeSubject);}
function renderKnowledge(){
 $k('header h1').textContent=knowledgeMode==='teacher'?'老師題型練習':knowledgeMode==='inventory'?'教材整合進度':'純重點整理';
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===knowledgeMode)));
 const count=Object.values(knowledgeState.answers).filter(a=>a&&Number.isInteger(a.choice)).length;
 $k('#knowledgeStatus').textContent=knowledgeMode==='notes'?'只顯示概念與重點，不混入題目。':knowledgeMode==='teacher'?`本頁已作答 ${count}/${knowledge.quizzes.length} 題；擬答均為自編。`:'來源與整合狀態逐筆列出，不把「已讀取」當成「全部已校核」。';
 if(!knowledgeSubject&&knowledgeMode!=='inventory'){$k('#knowledgeContent').innerHTML=`<h2>先選你要讀的科目</h2><div class="subject-picker">${knowledge.subjects.map(s=>`<button data-knowledge-course="${ke(s.id)}">${ke(s.name)}</button>`).join('')}</div><p class="muted">選好後只顯示本科內容；隨時可用上方科目選單切換。</p>`;return;}
 if(knowledgeMode==='notes'){
 let total=0;const html=visibleKnowledgeSubjects().map(s=>{const cards=s.cards.map((c,i)=>({...c,index:i})).filter(knowledgeMatches);total+=cards.length;return cards.length?`<h2 class="topic-heading">${ke(s.name)}</h2><p class="muted">${ke(s.status)}</p><div class="notes-grid">${cards.map(c=>{const key=c.id;return `<article><h3>${ke(c.title)}</h3><ul>${c.points.map(t=>`<li>${ke(t)}</li>`).join('')}</ul>${c.trap?`<p class="trap">易錯：${ke(c.trap)}</p>`:''}${kr(c.refs)}<p class="source">整理依據：${ke(c.source)}</p><label class="familiar"><input type="checkbox" data-familiar="${ke(key)}" ${knowledgeState.familiar[key]?'checked':''}>我已自行確認理解</label></article>`;}).join('')}</div>`:'';}).join('');
 $k('#knowledgeContent').innerHTML=html||'<p class="empty">沒有符合的重點，試試較短的關鍵字。</p>';return;
 }
 if(knowledgeMode==='inventory'){
 $k('#knowledgeContent').innerHTML=`<p class="integration-notice">${ke(knowledge.integrationNotice)}</p><h2>已發現並處理的來源</h2><div class="source-list">${knowledge.inventory.filter(knowledgeMatches).map(x=>`<article><h3>${ke(x.name)}</h3><p>${ke(x.status)}${x.pages?' · '+x.pages+'頁':''}</p><p class="muted">${ke(x.privacy)}</p></article>`).join('')}</div><h2>校正與待確認</h2><ul>${knowledge.corrections.map(t=>`<li>${ke(t)}</li>`).join('')}</ul><p>目前未登錄任何「老師明確不考」範圍；沒有原話與位置就不推測。</p>`;return;
 }
 const cases=knowledge.cases.filter(c=>(knowledgeSubject==='all'||c.subject===knowledgeSubject)&&knowledgeMatches(c));
 const quizzes=knowledge.quizzes.filter(q=>(knowledgeSubject==='all'||q.subject===knowledgeSubject)&&knowledgeMatches(q)&&(!onlyKnowledgeWrong||(knowledgeState.answers[q.id]&&knowledgeState.answers[q.id].choice!==q.correct)));
 $k('#knowledgeContent').innerHTML=`<p class="integration-notice">依提供題型改寫；原題全文與私人檔案未公開。每題列出來源位置，自編擬答不等於教師標準答案。</p><div class="teacher-tools"><label><input id="knowledgeWrong" type="checkbox" ${onlyKnowledgeWrong?'checked':''}>只看本頁目前答錯的選擇題</label></div>${!onlyKnowledgeWrong?cases.map(c=>`<article class="exam-card"><p class="tag">${ke(c.source)}</p><h2>${ke(c.title)}</h2><p>${ke(c.facts)}</p><h3>先辨識爭點</h3><ul>${c.issues.map(t=>`<li>${ke(t)}</li>`).join('')}</ul><details><summary>三級練習提示</summary>${c.levels.map(t=>`<p>${ke(t)}</p>`).join('')}</details><label>先寫自己的涵攝<textarea data-case-draft="${ke(c.id)}" maxlength="12000" placeholder="寫出法條要件、關鍵事實與你的結論。">${ke(knowledgeState.drafts[c.id]||'')}</textarea></label><details><summary>查看完整自編擬答</summary>${c.answer.map(t=>`<p class="answer-step">${ke(t)}</p>`).join('')}</details>${kr(c.refs)}<p class="source">${ke(c.provenance)}</p></article>`).join(''):''}<h2>已校核選擇題（${quizzes.length}）</h2>${quizzes.map(q=>{const a=knowledgeState.answers[q.id],selected=a&&Number.isInteger(a.choice)?a.choice:null;return `<article class="exam-card"><p class="tag">${ke(q.source)}</p><h3>${ke(q.title)}</h3><div class="options">${q.options.map((o,i)=>`<button data-knowledge-answer="${ke(q.id)}:${i}" class="${selected===i?'selected':''}">${'ABCD'[i]} · ${ke(o)}</button>`).join('')}</div>${selected!==null?`<div class="quiz-feedback">${selected===q.correct?'本次答對':'再確認要件'} · 正確答案 ${'ABCD'[q.correct]}<p>${ke(q.why)}</p><button data-knowledge-retry="${ke(q.id)}">收起答案重作</button></div>`:''}${kr(q.refs)}<p class="source">${ke(q.status)}</p></article>`;}).join('')}${!cases.length&&!quizzes.length?'<p class="empty">本科尚無已校核的老師題型；原有九科基礎題仍可在主站練習。</p>':''}`;
}
if(typeof location!=='undefined'&&location.href){try{const s=new URL(location.href).searchParams.get('subject');if(knowledge.subjects.some(x=>x.id===s))knowledgeSubject=s;}catch{}}
const knowledgeSelector=$k('#knowledgeSubject');knowledgeSelector.innerHTML+=knowledge.subjects.map(s=>`<option value="${ke(s.id)}">${ke(s.name)}</option>`).join('');
knowledgeSelector.value=knowledgeSubject;
knowledgeSelector.addEventListener('change',e=>{knowledgeSubject=e.target.value;renderKnowledge();});
$k('#knowledgeSearch').addEventListener('input',e=>{knowledgeQuery=e.target.value.trim();renderKnowledge();});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.knowledgeCourse){knowledgeSubject=b.dataset.knowledgeCourse;knowledgeSelector.value=knowledgeSubject;renderKnowledge();}
 if(b.dataset.mode){knowledgeMode=b.dataset.mode;renderKnowledge();}
 if(b.dataset.knowledgeAnswer){const [id,n]=b.dataset.knowledgeAnswer.split(':'),q=knowledge.quizzes.find(q=>q.id===id),i=Number(n);if(!q||!Number.isInteger(i)||i<0||i>=q.options.length)return;knowledgeState.answers[id]={choice:i,count:(knowledgeState.answers[id]?.count||0)+1};renderKnowledge();knowledgeSave();}
 if(b.dataset.knowledgeRetry){delete knowledgeState.answers[b.dataset.knowledgeRetry];renderKnowledge();knowledgeSave();}
});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.familiar){knowledgeState.familiar[t.dataset.familiar]=t.checked;knowledgeSave();}if(t.id==='knowledgeWrong'){onlyKnowledgeWrong=t.checked;renderKnowledge();}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.caseDraft){knowledgeState.drafts[t.dataset.caseDraft]=t.value;knowledgeSave();}});
function knowledgeDownload(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$k('#exportEssentials').addEventListener('click',()=>{const text=['法域中樞｜純重點整理','來源查讀日：'+knowledge.updatedAt,...visibleKnowledgeSubjects().flatMap(s=>['\n## '+s.name,...s.cards.flatMap(c=>['\n### '+c.title,...c.points.map(t=>'- '+t),c.trap?'易錯：'+c.trap:'','整理依據：'+c.source,...c.refs.map(r=>r.label+' '+r.url)])])].join('\n');knowledgeDownload('LEX-NEXUS-重點.md',text,'text/markdown;charset=utf-8');});
$k('#exportKnowledgeState').addEventListener('click',()=>knowledgeDownload('LEX-NEXUS-練習備份.json',JSON.stringify({version:1,state:knowledgeState},null,2),'application/json'));
$k('#printEssentials').addEventListener('click',()=>window.print());
renderKnowledge();
