/* Visible subject navigation reuses the existing change handlers and storage. */
(()=>{
 if(typeof MutationObserver==='undefined')return;
 for(const id of ['knowledgeSubject','courseSelector','subject']){
  const select=document.getElementById(id);if(!select)continue;
  const nav=document.createElement('div');nav.className='subject-switcher';nav.setAttribute('role','group');nav.setAttribute('aria-label','切換科目');
  select.after(nav);select.hidden=true;select.setAttribute('aria-hidden','true');
  const sync=()=>{nav.innerHTML=Array.from(select.options).filter(o=>o.value||o.textContent.includes('全部')).map(o=>{const b=document.createElement('button');b.type='button';b.textContent=o.textContent;b.dataset.subjectValue=o.value;b.setAttribute('aria-pressed',String(o.value===select.value));return b.outerHTML;}).join('');};
  nav.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;select.value=b.dataset.subjectValue;select.dispatchEvent(new Event('change',{bubbles:true}));sync();});
  select.addEventListener('change',()=>{sync();if(id==='knowledgeSubject'){const url=new URL(location.href);url.searchParams.set('subject',select.value);if(url.hash.startsWith('#personal-'))url.hash='';history.replaceState(null,'',url);}});new MutationObserver(sync).observe(select,{childList:true});
  document.addEventListener('click',()=>{for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.subjectValue===select.value));});sync();
 }
})();
