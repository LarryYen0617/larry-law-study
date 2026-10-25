(()=>{
 const data=window.LEX_ESSAY_TEMPLATES,H=window.LEX_ESSAY_HELPERS;if(!data||!H)return;
 const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),host=document.getElementById('essayTemplateDesk');let selectedSubject='crime',selectedTopic='base';
 try{const p=new URL(location.href).searchParams;if(data.subjects.some(s=>s.subject===p.get('subject')))selectedSubject=p.get('subject');if(data.topics.some(t=>t.id===p.get('template')&&t.subject===selectedSubject))selectedTopic=p.get('template');}catch{}
 function current(){return selectedTopic==='base'?{...data.subjects.find(s=>s.subject===selectedSubject),id:'base-'+selectedSubject,title:data.subjects.find(s=>s.subject===selectedSubject).name+'通用'}:data.topics.find(t=>t.id===selectedTopic);}
 function resolve(id){return id.startsWith('base-')?(()=>{const s=data.subjects.find(s=>'base-'+s.subject===id);return s?{...s,id,title:s.name+'通用'}:null;})():data.topics.find(t=>t.id===id);}
 function status(id,message){const node=host?document.getElementById('essayDeskStatus'):document.querySelector('.chapter-reader [data-essay-status="'+id+'"]');if(node)node.textContent=message;}
 function render(){if(!host)return;const t=current();host.innerHTML=`<div class="essay-subjects" role="group" aria-label="申論模板科目">${data.subjects.map(s=>`<button type="button" data-essay-subject="${s.subject}" aria-pressed="${s.subject===selectedSubject}">${E(s.name)}</button>`).join('')}</div><nav class="essay-topic-tabs" aria-label="模板題型"><button type="button" data-essay-topic="base" aria-pressed="${selectedTopic==='base'}">本科通用</button>${data.topics.filter(t=>t.subject===selectedSubject).map(t=>`<button type="button" data-essay-topic="${E(t.id)}" aria-pressed="${selectedTopic===t.id}">${E(t.title)}</button>`).join('')}</nav><article class="essay-template"><p class="eyebrow">WRITE WITH REASONS</p><h3>${E(t.title)}・申論模板</h3><p>將【】替換成題目事實與自己的理由。</p><div class="template-steps">${t.steps.map(s=>`<h4>${E(s.heading)}</h4><p>${E(s.text)}</p>`).join('')}</div>${t.counterHint?`<p><strong>反論提示：</strong>${E(t.counterHint)}</p>`:''}<div class="essay-template-actions"><a href="practice.html?v=20261026-practice21&amp;${t.id.startsWith('base-')?'subject='+selectedSubject:'case='+E(t.id)}">進入作答演練 ↗</a><button type="button" data-essay-copy="${E(t.id)}">複製模板</button><button type="button" data-essay-append="${E(t.id)}">附加到我的草稿</button><button type="button" data-essay-download="${E(t.id)}">下載模板</button>${t.example?`<a href="essentials.html?v=20261026-essay20&amp;subject=${t.subject}#${E(t.id)}">回到本章筆記 ↗</a>`:''}</div><p id="essayDeskStatus" role="status" aria-live="polite"></p>${t.example?`<section class="template-sample"><h4>虛構案例與完整示範</h4><p>${E(t.example.facts)}</p>${t.example.answer.map(p=>`<p>${E(p)}</p>`).join('')}</section>`:'<p class="muted">選擇上方章節題型，可對照完整案例示範。</p>'}</article>`;}
 function updateURL(){try{const u=new URL(location.href);u.searchParams.set('subject',selectedSubject);if(selectedTopic==='base')u.searchParams.delete('template');else u.searchParams.set('template',selectedTopic);u.hash='templates';history.replaceState(null,'',u);}catch{}}
 function download(t){const u=URL.createObjectURL(new Blob([H.text(t)],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='LEX-NEXUS-'+t.title+'-申論模板.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
 document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.essaySubject){if(!data.subjects.some(s=>s.subject===b.dataset.essaySubject))return;selectedSubject=b.dataset.essaySubject;selectedTopic='base';updateURL();render();return;}
  if(b.dataset.essayTopic){if(b.dataset.essayTopic!=='base'&&!data.topics.some(t=>t.id===b.dataset.essayTopic&&t.subject===selectedSubject))return;selectedTopic=b.dataset.essayTopic;updateURL();render();return;}
  for(const action of ['jump','copy','append','download']){
   const id=b.dataset['essay'+action[0].toUpperCase()+action.slice(1)];if(!id)continue;const t=resolve(id);if(!t)return;
   if(action==='jump'){const section=document.querySelector('.chapter-reader #'+id+' .essay-template');if(section){section.scrollIntoView({behavior:'smooth',block:'start'});const heading=section.querySelector('h3');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}}
   if(action==='copy'){try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(H.text(t));status(id,'模板已複製。');}catch{status(id,'未能自動複製，可直接選取模板文字，或下載模板。');}}
   if(action==='download'){download(t);status(id,'已要求下載模板，請確認瀏覽器下載結果。');}
   if(action==='append'){
    try{
     if(host){const field=document.getElementById('draftText'),result=H.append(field.value,t,30000);field.value=result.value;if(!result.duplicate)field.dispatchEvent(new Event('input',{bubbles:true}));status(id,result.duplicate?'這份模板已在草稿中。':'模板已附加，請到草稿區編寫並按「儲存草稿」。');field.focus();field.scrollIntoView({block:'center'});}
     else if(typeof knowledgeState!=='undefined'&&typeof knowledgeSave==='function'){
      const existed=Object.hasOwn(knowledgeState.drafts,id),previous=knowledgeState.drafts[id]||'',result=H.append(previous,t,12000);if(result.duplicate){status(id,'這份模板已在本章草稿中。');return;}
      knowledgeState.drafts[id]=result.value;if(!knowledgeSave()){if(existed)knowledgeState.drafts[id]=previous;else delete knowledgeState.drafts[id];status(id,'未能儲存模板，原有草稿保留；請改用下載。');return;}
      const field=document.querySelector('.chapter-reader textarea[data-case-draft="'+id+'"]');if(field){field.value=result.value;field.focus();field.scrollIntoView({block:'center'});}status(id,'模板已附加並儲存，原有文字保留。');
     }
    }catch(err){status(id,err.message||'附加失敗，請改用下載模板。');}
   }
  }
 });render();
})();
