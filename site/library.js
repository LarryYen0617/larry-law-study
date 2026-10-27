/* Source-backed archive reader. No imported code is executed. */
const corpus=window.LEX_LIBRARY,el=id=>document.getElementById(id),escapeText=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
corpus.notes.forEach((r,i)=>r.id??=('note-'+i));
let targetItem=(()=>{try{return new URL(location.href).searchParams.get('item')||'';}catch{return '';}})();
const revealedAnswers=new Set();let teacherFilter='original';const teacherOriginal=q=>q.questionOrigin==='teacher-original';
const libraryKey='lex-nexus-library-v1';let libraryState={answers:{},drafts:{}},mode=['questions','teacher','sources'].includes(location.hash.slice(1))?location.hash.slice(1):'notes',pageIndex=0;
try{const saved=JSON.parse(localStorage.getItem(libraryKey));if(saved&&saved.answers&&saved.drafts)libraryState=saved;}catch{}
libraryState.answerRevisions??={};
const currentAnswer=q=>q.native?window.LEX_QUESTION_ADAPTER.read(q):q.originalVersion&&libraryState.answerRevisions[q.id]!=='2026-10-24'?undefined:libraryState.answers[q.id];
const subjectName=s=>s==='債編總論'?'債權':s;
const subjects=[...new Set([...corpus.notes,...corpus.questions].map(q=>subjectName(q.subject)))];el('subject').innerHTML+=subjects.map(s=>`<option>${escapeText(s)}</option>`).join('');
try{const requested=new URL(location.href).searchParams.get('subject');if(subjects.includes(requested))el('subject').value=requested;}catch{}
el('notice').textContent=corpus.notice;el('totals').innerHTML=`<b>${corpus.questions.length.toLocaleString()} 題整合練習</b><b>${corpus.teacherQuestions.length} 則課堂題目與解析</b><b>${corpus.notes.length.toLocaleString()} 則重點／解析筆記</b><b>${corpus.sources.filter(s=>!s.duplicateOf&&s.name.endsWith('.pdf')).length} 份課堂教材</b>`;
function refs(sources=[]){return sources.map(s=>{try{const u=new URL(s.url);return u.protocol==='https:'&&u.hostname.endsWith('.gov.tw')?`<a target="_blank" rel="noopener noreferrer" href="${escapeText(u.href)}">${escapeText(s.title)} ↗</a>`:'';}catch{return '';}}).join(' · ');}
function saveLibrary(){try{localStorage.setItem(libraryKey,JSON.stringify(libraryState));}catch{el('status').textContent='儲存空間不足，請先備份紀錄。';}}
function renderTeacher(q){
 const original=teacherOriginal(q),teacherAnswer=q.answerOrigin==='teacher-original',analysis=q.correction?.analysis||'',answer=q.answer||'';
 let content='';
 if(teacherAnswer)content+=`<section class="answer-original"><h3>教師原附擬答</h3><p class="original-text">${escapeText(answer)}</p></section>`;
 else if(original)content+='<p class="source">原題未附解答；下方擬答或解析由本站自編。</p>';
 if(analysis&&analysis!==answer)content+=`<section class="feedback"><h3>${teacherAnswer?'校訂解析與現行法對照':'自編解析'}</h3><p class="original-text">${escapeText(analysis)}</p><p>${refs(q.correction.sources)}</p></section>`;
 if(!teacherAnswer&&answer)content+=`<section class="answer-original"><h3>自編擬答</h3><p class="original-text">${escapeText(answer)}</p><p>${refs(q.correction?.sources)}</p></section>`;
 return `<article><span class="badge">${escapeText(q.subject||'親屬法')} / ${original?'老師原題':escapeText(q.provenance||'補充自編題')}</span><h2>${escapeText(q.topic)}</h2><p class="original-text">${escapeText(q.question)}</p>${content}<p class="source">${escapeText(q.source)}${original&&q.answerOrigin!=='authored'?' · 第 '+escapeText(q.page)+' 頁起':''}</p></article>`;
}
function renderLibrary(){
 const title=document.querySelector?.('header h1');if(title)title.textContent=mode==='sources'?'教材目錄':mode==='notes'?'題目解析筆記':'題庫與申論';
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 el('wrongLabel').hidden=mode!=='questions';const query=el('search').value.trim().toLowerCase(),subject=el('subject').value;
 let rows=(mode==='questions'?corpus.questions:mode==='teacher'?corpus.teacherQuestions:mode==='sources'?corpus.sources:corpus.notes).filter(q=>(!targetItem||q.id===targetItem)&&(mode==='sources'||!subject||subjectName(q.subject)===subject)&&(!query||JSON.stringify(q).toLowerCase().includes(query)));
 if(mode==='teacher'&&!targetItem){rows=rows.filter(q=>teacherFilter==='all'||(teacherFilter==='original'?teacherOriginal(q):!teacherOriginal(q)));rows.sort((a,b)=>Number(teacherOriginal(b))-Number(teacherOriginal(a)));}
 el('teacherFilters').hidden=mode!=='teacher';el('teacherFilters').innerHTML=[['original','老師原題'],['authored','補充自編題'],['all','全部']].map(([id,label])=>`<button data-teacher-filter="${id}" aria-pressed="${(targetItem?'all':teacherFilter)===id}">${label}</button>`).join('');
 if(mode==='questions'&&el('wrong').checked)rows=rows.filter(q=>Number.isInteger(currentAnswer(q))&&currentAnswer(q)!==q.answer);
 const pages=Math.max(1,Math.ceil(rows.length/12));pageIndex=Math.min(pageIndex,pages-1);el('status').textContent=`找到 ${rows.length} ${mode==='questions'?'題':mode==='teacher'?'則課堂題目與解析':mode==='sources'?'份檔案':'則筆記'} · 每頁最多 12 筆`;el('page').textContent=`${pageIndex+1} / ${pages}`;el('prev').disabled=pageIndex===0;el('next').disabled=pageIndex+1>=pages;if(el('bankPage')){el('bankPage').textContent=`第 ${pageIndex+1} / ${pages} 頁 · ${rows.length? pageIndex*12+1:0}–${Math.min((pageIndex+1)*12,rows.length)} / ${rows.length} 筆`;el('bankPrev').disabled=pageIndex===0;el('bankNext').disabled=pageIndex+1>=pages;el('bankJump').max=pages;el('bankJump').value=pageIndex+1;}
 el('items').innerHTML=rows.slice(pageIndex*12,pageIndex*12+12).map(q=>{
  if(mode==='sources')return `<article><span class="badge">${q.duplicateOf?'已去重':'來源盤點'}</span><h2>${escapeText(q.name)}</h2><p>${escapeText(q.status)}</p><p>${q.pages||'—'} 頁 · ${q.characters||0} 字${q.duplicateOf?' · 重複於 '+escapeText(q.duplicateOf):''}</p></article>`;
  if(mode==='teacher')return renderTeacher(q);
  if(mode==='notes')return `<article><span class="badge">${escapeText(q.subject)} · 重點整理</span><h2>${escapeText(q.topic)}</h2>${q.table?`<div class="table-scroll"><table><thead><tr>${q.table.headers.map(h=>`<th scope="col">${escapeText(h)}</th>`).join('')}</tr></thead><tbody>${q.table.rows.map(row=>`<tr>${row.map((cell,i)=>i?`<td>${escapeText(cell)}</td>`:`<th scope="row">${escapeText(cell)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`:`<ul>${q.points.map(p=>`<li>${escapeText(p)}</li>`).join('')}</ul>`}${q.trap?`<p class="notice">易錯：${escapeText(q.trap)}</p>`:''}<details><summary>法源與出處</summary><p>${refs(q.sources)}</p><p>${escapeText(q.source)}</p></details></article>`;
  const selected=currentAnswer(q),answered=Number.isInteger(selected);
  return `<article><span class="badge">${escapeText(q.subject)} / ${escapeText(q.topic)}</span><h2>${escapeText(q.question)}</h2><div class="options">${q.options.map((o,i)=>`<button data-answer="${escapeText(q.id)}" data-choice="${i}" aria-pressed="${selected===i}">${String.fromCharCode(65+i)}．${escapeText(o)}</button>`).join('')}</div>${answered||revealedAnswers.has(q.id)?`<div class="feedback"><h3>答案與解析</h3>${answered?'你選 '+String.fromCharCode(65+selected)+' · ':''}正確答案 ${String.fromCharCode(65+q.answer)}${q.originalVersion?`<p>${escapeText(q.reviewNote)}</p><p>${refs(q.sources)}</p><h4>選項解析</h4><ol>${q.explanations.map(t=>`<li>${escapeText(t)}</li>`).join('')}</ol>`:`<ol>${q.explanations.map(t=>`<li>${escapeText(t)}</li>`).join('')}</ol>`}<button ${answered?'data-retry':'data-hide-answer'}="${escapeText(q.id)}">${answered?'收起解析，重新練習':'收起答案'}</button></div>`:`<button class="show-answer" data-show-answer="${escapeText(q.id)}">查看答案與解析</button>`}<details><summary>看提示與來源</summary><p>${escapeText(q.hint)}</p><p>${refs(q.sources)}</p><p>法源對照日期：${escapeText(q.checkedAt)}</p><p>${escapeText(q.origin)}</p><p class="source">原始歸檔：${escapeText(q.archiveFile)} · ${escapeText(q.id)}</p></details>${q.originalVersion?`<details><summary>校訂紀錄與原題對照</summary><p>${escapeText(q.reviewNote)}</p><p>${escapeText(q.originalVersion.question)}</p><ol type="A">${q.originalVersion.options.map(o=>`<li>${escapeText(o)}</li>`).join('')}</ol><p>原附答案：${String.fromCharCode(65+q.originalVersion.answer)}；練習以本頁校訂題為準。</p></details>`:''}<details><summary>寫下自己的理由與涵攝</summary><textarea data-draft="${escapeText(q.id)}" maxlength="12000" placeholder="哪一項事實符合哪一個法律要件？">${escapeText(libraryState.drafts[q.id]||'')}</textarea></details></article>`;
 }).join('')||'<article>沒有符合的內容，試試縮短關鍵字。</article>';
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.teacherFilter&&['original','authored','all'].includes(b.dataset.teacherFilter)){teacherFilter=b.dataset.teacherFilter;targetItem='';pageIndex=0;renderLibrary();return;}if(b.dataset.hideAnswer){revealedAnswers.delete(b.dataset.hideAnswer);renderLibrary();return;}if(b.dataset.showAnswer){revealedAnswers.add(b.dataset.showAnswer);renderLibrary();return;}if(b.dataset.mode){targetItem='';mode=b.dataset.mode;pageIndex=0;try{history.replaceState(null,'','#'+mode);}catch{}renderLibrary();}if(b.dataset.answer){const q=corpus.questions.find(q=>q.id===b.dataset.answer),i=Number(b.dataset.choice);if(q&&Number.isInteger(i)&&i>=0&&i<q.options.length){if(q.native){try{window.LEX_QUESTION_ADAPTER.write(q,i);}catch{el('status').textContent='無法儲存，原紀錄未清除。';return;}}libraryState.answers[q.id]=i;libraryState.answerRevisions[q.id]='2026-10-24';saveLibrary();renderLibrary();}}if(b.dataset.retry){revealedAnswers.delete(b.dataset.retry);const q=corpus.questions.find(q=>q.id===b.dataset.retry);if(q?.native){try{window.LEX_QUESTION_ADAPTER.write(q,null);}catch{el('status').textContent='無法儲存，請先備份。';return;}}delete libraryState.answers[b.dataset.retry];delete libraryState.answerRevisions[b.dataset.retry];saveLibrary();renderLibrary();}});
el('search').addEventListener('input',()=>{targetItem='';pageIndex=0;renderLibrary();});el('subject').addEventListener('change',()=>{targetItem='';pageIndex=0;renderLibrary();});el('wrong').addEventListener('change',()=>{targetItem='';pageIndex=0;renderLibrary();});
el('prev').onclick=()=>{pageIndex--;renderLibrary();};el('next').onclick=()=>{pageIndex++;renderLibrary();};document.addEventListener('input',e=>{if(e.target.dataset.draft){libraryState.drafts[e.target.dataset.draft]=e.target.value;saveLibrary();}});
el('backup').onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify({version:1,state:libraryState},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='LEX-NEXUS-資料庫練習備份.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};renderLibrary();

try{if(new URL(location.href).searchParams.get("wrong")==="1"){el("wrong").checked=true;mode="questions";renderLibrary();}}catch{}

if(el('bankPrev')){
 const top=()=>el('status').scrollIntoView({block:'start'});
 el('bankPrev').onclick=()=>{if(pageIndex>0)pageIndex--;renderLibrary();top();};
 el('bankNext').onclick=()=>{pageIndex++;renderLibrary();top();};
 el('bankGo').onclick=()=>{const n=Number(el('bankJump').value);if(Number.isInteger(n)&&n>=1){pageIndex=n-1;renderLibrary();top();}};
 el('bankReset').onclick=()=>{targetItem='';el('subject').value='';el('search').value='';el('wrong').checked=false;pageIndex=0;el('subject').dispatchEvent(new Event('change',{bubbles:true}));renderLibrary();};
 el('prev').onclick=el('bankPrev').onclick;el('next').onclick=el('bankNext').onclick;
}
