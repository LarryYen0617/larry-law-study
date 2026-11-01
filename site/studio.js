/* Visible subject navigation reuses the existing change handlers and storage. */
(()=>{
 if(typeof MutationObserver==='undefined')return;
 for(const id of ['courseSelector','subject']){
  const select=document.getElementById(id);if(!select)continue;
  const nav=document.createElement('div');nav.className='subject-switcher';nav.setAttribute('role','group');nav.setAttribute('aria-label','切換科目');
  select.after(nav);select.hidden=true;select.setAttribute('aria-hidden','true');
  const sync=()=>{nav.innerHTML=Array.from(select.options).filter(o=>o.value||o.textContent.includes('全部')).map(o=>{const b=document.createElement('button');b.type='button';b.textContent=o.textContent;b.dataset.subjectValue=o.value;b.setAttribute('aria-pressed',String(o.value===select.value));return b.outerHTML;}).join('');};
  nav.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;select.value=b.dataset.subjectValue;select.dispatchEvent(new Event('change',{bubbles:true}));sync();});
  select.addEventListener('change',()=>{sync();if(id==='knowledgeSubject'){const url=new URL(location.href);url.searchParams.set('subject',select.value);if(url.hash.startsWith('#personal-'))url.hash='';history.replaceState(null,'',url);}});try{if(select.nodeType===1)new MutationObserver(sync).observe(select,{childList:true});}catch{}
  document.addEventListener('click',()=>{for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.subjectValue===select.value));});sync();
 }
})();

/* One navigation system across the app, notes, archive and source tools. */
(()=>{
 if(typeof MutationObserver==='undefined'||!window.LEX_NAVIGATION)return;
 const key='lex-nexus-reading-position-v1',file=location.pathname.split('/').pop()||'index.html',main=document.getElementById('mainNav');
 let last=null;try{last=JSON.parse(localStorage.getItem(key)||'null');}catch{}
 const rootPrefix=location.pathname.includes('/class-notes/')?'../':'';
 const aside=main?main.closest('aside'):document.createElement('aside');aside.classList.add('site-sidebar');
 const nav=main||document.createElement('nav');nav.id=main?'mainNav':'siteNavigation';nav.setAttribute('aria-label','完整功能分類');
 if(!main){aside.innerHTML=`<a class="sidebar-brand" href="${rootPrefix}index.html?v=${window.LEX_NAVIGATION.version}#/dashboard"><b>LEX NEXUS</b><span>法域中樞 · 法律學習工作室</span></a>`;aside.append(nav);document.body.prepend(aside);}
 else aside.querySelector('.sidebar-foot')?.remove();
 document.body.classList.add('has-site-sidebar');if(main)document.body.classList.add('has-main-app');
 const toggle=document.createElement('button');toggle.className='sidebar-toggle';toggle.textContent='☰ 功能分類';toggle.type='button';toggle.setAttribute('aria-controls',nav.id);toggle.setAttribute('aria-expanded','false');aside.insertBefore(toggle,nav);
 const skip=document.createElement('a');skip.className='skip-content';skip.href='#mainReadingContent';skip.textContent='跳至主要內容';document.body.prepend(skip);
 const content=document.querySelector('main');if(content&&!content.id)content.id='mainReadingContent';if(content){content.tabIndex=-1;skip.href='#'+content.id;skip.addEventListener('click',e=>{e.preventDefault();content.focus({preventScroll:true});content.scrollIntoView({block:'start'});});}
 function context(){
  let subject=typeof course!=='undefined'?course.id:'crime',active='home';
  if(main){const p=typeof page==='undefined'?'dashboard':page;active=({dashboard:'home',quiz:'quiz',allwrong:'wrong',wrong:'wrong'})[p]||p;}
  else if(file==='essentials.html'){subject=typeof knowledgeSubject==='undefined'?'crime':knowledgeSubject;active=typeof knowledgeMode!=='undefined'&&knowledgeMode==='teacher'?'teacher':typeof knowledgeMode!=='undefined'&&knowledgeMode==='inventory'?'coverage':'notes';}
  else if(file==='library.html')active=typeof mode!=='undefined'?({questions:'archive',teacher:'originals',sources:'sources',notes:'archivenotes'})[mode]:'archive';
  else if(location.pathname.includes('/class-notes/')||file==='courses.html')active='courses';else if(file==='legal-english.html')active='english';else if(file==='photonics.html')active='science';
  else if(file==='discover.html')active=new URLSearchParams(location.hash.slice(1)).get('view')==='saved'||new URLSearchParams(location.hash.slice(1)).get('view')==='due'?'saved':'search';
  else if(file==='exams.html')active='exams';else if(file==='practice.html'||file==='questions.html')active='questions';
  else if(file==='coverage.html')active='coverage';else if(file==='settings.html')active='settings';else if(file==='reading.html')active='reading';else if(file==='study-toolkit.html')active=location.hash==='#method'||location.hash==='#draft'||location.hash==='#templates'?'method':'official';
  return {subject,active,file,last};
 }
 function mount(){const scroll=aside.scrollTop;nav.innerHTML=window.LEX_NAVIGATION.markup(context());aside.scrollTop=scroll;}
 function remember(updateURL=true){
  if(file!=='essentials.html'||typeof knowledgeMode==='undefined'||knowledgeMode!=='notes')return;
  const id=document.querySelector('.chapter-reader .personal-chapter')?.id;if(!id)return;
  const subject=window.LEX_PERSONAL_NOTES?.subjects.find(s=>s.chapters.some(c=>c.id===id)),chapter=subject?.chapters.find(c=>c.id===id);if(!chapter)return;
  last={subject:subject.id,chapter:id,title:subject.name+' · '+chapter.title,updatedAt:new Date().toISOString()};try{localStorage.setItem(key,JSON.stringify(last));}catch{}
  if(updateURL){const url=new URL(location.href);url.hash=id;history.replaceState(null,'',url);}
 }
 function close(){aside.classList.remove('sidebar-open');toggle.setAttribute('aria-expanded','false');}
 toggle.addEventListener('click',()=>{const open=aside.classList.toggle('sidebar-open');toggle.setAttribute('aria-expanded',String(open));});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&aside.classList.contains('sidebar-open')){close();toggle.focus();}});
 document.addEventListener('click',e=>{
  if(e.target.closest('.sidebar-link,.sidebar-resume'))close();
  const b=e.target.closest('button[data-mode]');
  if(b&&file==='essentials.html'){const url=new URL(location.href);url.hash=b.dataset.mode==='teacher'?'teacher':b.dataset.mode==='inventory'?'inventory':'';history.replaceState(null,'',url);}
  remember();mount();
 });
 if(main&&typeof render==='function'){const previous=render;render=function(){previous();mount();};}
 window.addEventListener('hashchange',()=>{close();mount();});
 window.addEventListener('storage',e=>{if(e.key===key){try{last=JSON.parse(e.newValue||'null');}catch{last=null;}mount();}});
 remember(false);mount();
})();
