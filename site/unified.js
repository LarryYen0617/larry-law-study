(()=>{
 if(typeof MutationObserver==='undefined')return;
 const version='20261027-architecture',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const descriptions={criminalgeneral:'犯罪成立 · 違法與罪責',civilgeneral:'法律行為 · 意思表示',constitution:'基本權 · 權力分立',crime:'個別犯罪 · 要件辨析',family:'婚姻 · 親子與財產',debt:'契約 · 給付與責任',property:'所有權 · 物權變動',admin:'行政行為 · 權利救濟',tax:'租稅法定 · 納稅保障'};
 const legacyNames=[['criminalgeneral','刑法總則'],['civilgeneral','民法總則'],['constitution','憲法'],['crime','刑法分則'],['family','親屬法'],['debt','債權'],['property','物權'],['admin','行政法'],['tax','租稅法']];
 const names=(window.LEX_COURSE_CATALOG?.courses||legacyNames.map(([id,name])=>({id,name,description:descriptions[id],reading:'essentials.html?subject='+id}))).map(c=>[c.id,c.name,c.reading,c.description]);
 function surface(){
  const rootPrefix=location.pathname.includes('/class-notes/')?'../':'';const brand=document.querySelector('.brand,.sidebar-brand');if(brand){brand.classList.add('sidebar-brand');brand.innerHTML='<b>LEX NEXUS</b><span>法域中樞 · 法律與閱讀</span>';}
  document.querySelectorAll('main>footer').forEach(f=>f.innerHTML=`<span>LEX NEXUS · 閱讀、理解、練習。</span><a href="${rootPrefix}coverage.html?v=${version}">資料來源</a><a href="${rootPrefix}settings.html?v=${version}">資料與備份</a>`);
  const mainApp=document.getElementById('mainNav');
  if(!mainApp){try{const pref=JSON.parse(localStorage.getItem('larry-law-midterm-v1')||'{}');document.body.classList.toggle('dark',pref.dark===true);}catch{}}
  document.body.classList.toggle('is-dashboard',Boolean(mainApp&&typeof page!=='undefined'&&page==='dashboard'&&!query));
  if(mainApp&&typeof page!=='undefined'&&page==='dashboard'&&!query){
   document.getElementById('title').textContent='把考題讀懂，把知識串起來。';document.getElementById('intro').textContent='按科目讀筆記，按期別準備考試，再用練習把觀念變成自己的能力。';
   const eyebrow=document.querySelector('.hero .eyebrow');if(eyebrow)eyebrow.textContent='LEX NEXUS / STUDY & EXAMS';
   let practiceHref='questions.html?view=essay',practiceLabel='國考申論';try{const P=window.LEX_PRACTICE,s=P&&JSON.parse(localStorage.getItem(P.key)||'null');if(P&&P.valid(s)&&s.lastCase){practiceHref+='&case='+s.lastCase;practiceLabel='接續上次申論';}}catch{}
   let resume='';try{const last=JSON.parse(localStorage.getItem('lex-nexus-reading-position-v1')||'null'),href=window.LEX_NAVIGATION.resume(last);if(href)resume=`<div class="resume-card"><div><small>CONTINUE READING</small><h2>${esc(last.title)}</h2></div><a class="solid-link" href="${esc(href)}">接續閱讀 →</a></div>`;}catch{}
   document.getElementById('content').innerHTML=`${resume}<div class="firm-home firm-home-minimal"><header class="minimal-heading"><p class="eyebrow">LARRY LAW STUDY</p><h2>法律學習，從這裡開始。</h2><p>筆記、法條、題庫與考試資料，集中整理。</p></header><form id="homeSearch" class="minimal-search" role="search"><label class="sr-only" for="homeSearchQuery">全站搜尋</label><input id="homeSearchQuery" type="search" maxlength="150" placeholder="搜尋筆記、法條或題目" aria-label="全站搜尋"><button type="submit">搜尋</button></form><nav class="minimal-links" aria-label="常用功能"><a href="essentials.html"><strong>法律筆記</strong><span>法條與重點整理 →</span></a><a href="questions.html"><strong>題庫練習</strong><span>選擇題與申論 →</span></a><a href="exams.html"><strong>考試準備</strong><span>期中與期末 →</span></a><a href="courses.html"><strong>全部課程</strong><span>瀏覽學習科目 →</span></a></nav><div class="minimal-bottom"><a href="discover.html">全站搜尋 →</a><a href="reading.html">閱讀書架 →</a><a href="settings.html">備份與設定 →</a></div><p class="minimal-note">個人法學學習平台 · 法律資料以官方最新版本為準</p></div>`
  }
 }
 const main=document.querySelector('main');if(main){const tools=document.createElement('div');tools.className='page-reading-tools';const focus=document.createElement('button');focus.className='focus-toggle';focus.type='button';focus.textContent='專注模式';focus.setAttribute('aria-pressed','false');focus.onclick=()=>{const active=document.body.classList.toggle('focus-reading');focus.textContent=active?'離開專注模式':'專注模式';focus.setAttribute('aria-pressed',String(active));};tools.append(focus);main.prepend(tools);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('focus-reading'))focus.click();});}
 if(document.getElementById('mainNav')&&typeof render==='function'){const previous=render;render=function(){previous();surface();};}
 document.addEventListener('submit',e=>{if(e.target.id==='homeSearch'){e.preventDefault();location.href='discover.html#q='+encodeURIComponent(document.getElementById('homeSearchQuery').value.trim());}});
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!e.target.closest('input,textarea,[contenteditable=true]')){e.preventDefault();const input=document.getElementById('homeSearchQuery')||document.getElementById('discoverQuery');if(input)input.focus();else location.href='discover.html';}});
 surface();
})();
