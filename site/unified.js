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
   document.getElementById('content').innerHTML=`${resume}<div class="firm-home">
<section class="firm-home-intro" aria-labelledby="firm-home-title"><div><p class="eyebrow">LEGAL KNOWLEDGE / RESEARCH DESK</p><h2 id="firm-home-title">從法律問題出發，<br>建立完整的論證。</h2><p>整合課堂教材、法條、題庫與申論練習。先找到資料，再理解規範，最後完成涵攝。</p></div><div class="firm-home-index" aria-label="研究步驟"><span>01 / 查找法源</span><span>02 / 理解爭點</span><span>03 / 案例涵攝</span></div></section>
<form class="firm-home-search" id="homeSearch" role="search"><label for="homeSearchQuery">搜尋法律研究資料</label><div><input type="search" id="homeSearchQuery" maxlength="150" placeholder="輸入法律概念、條號、題目或關鍵字" autocomplete="off"><button type="submit">搜尋全站 →</button></div><p>支援筆記、題庫與閱讀資料檢索。快捷鍵 Ctrl / ⌘ + K。</p></form>
<section class="firm-home-actions" aria-label="常用工作"><a href="essentials.html"><span>01 · RESEARCH</span><h3>法律筆記與法條</h3><p>整理概念、核對法源、閱讀完整分析。</p><b>開始研究 →</b></a><a href="questions.html"><span>02 · PRACTICE</span><h3>題庫與申論</h3><p>從選擇題到法律爭點與案例涵攝。</p><b>開始練習 →</b></a><a href="exams.html"><span>03 · EXAM PREP</span><h3>期中與期末考題</h3><p>依考試期別查找題目、來源與解答。</p><b>查看考題 →</b></a></section>
<div class="firm-home-lower"><section class="firm-home-subjects"><div class="firm-home-section-heading"><div><p class="eyebrow">PRACTICE AREAS</p><h2>法律學習領域</h2></div><a href="courses.html">完整課程總覽 →</a></div><nav class="firm-home-subject-grid" aria-label="法律科目">${names.map(([id,name,reading,description],i)=>`<a href="${esc(reading)}"><small>${String(i+1).padStart(2,'0')}</small><strong>${esc(name)}</strong><span>${esc(description||'課程與筆記')}</span></a>`).join('')}</nav></section><aside class="firm-home-aside"><div class="firm-home-aside-card"><p class="eyebrow">YOUR DESK</p><h2>接續你的學習</h2><a href="${esc(practiceHref)}">${esc(practiceLabel)} →</a><a href="questions.html?view=wrong">錯題複習 →</a><a href="index.html?v=${version}#/crime/progress/0">學習進度 →</a></div><div class="firm-home-aside-card"><p class="eyebrow">LIBRARY</p><h2>閱讀與資料</h2><a href="reading.html">小說與個人書架 →</a><a href="coverage.html">資料來源與校訂 →</a><a href="settings.html">備份與資料管理 →</a></div></aside></div>
<p class="firm-home-disclaimer">本站為個人法學學習與研究平台，並非執業法律事務所；內容不構成個案法律意見。法條與實務資料請以官方最新公布版本為準。</p></div>`
  }
 }
 const main=document.querySelector('main');if(main){const tools=document.createElement('div');tools.className='page-reading-tools';const focus=document.createElement('button');focus.className='focus-toggle';focus.type='button';focus.textContent='專注模式';focus.setAttribute('aria-pressed','false');focus.onclick=()=>{const active=document.body.classList.toggle('focus-reading');focus.textContent=active?'離開專注模式':'專注模式';focus.setAttribute('aria-pressed',String(active));};tools.append(focus);main.prepend(tools);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('focus-reading'))focus.click();});}
 if(document.getElementById('mainNav')&&typeof render==='function'){const previous=render;render=function(){previous();surface();};}
 document.addEventListener('submit',e=>{if(e.target.id==='homeSearch'){e.preventDefault();location.href='discover.html#q='+encodeURIComponent(document.getElementById('homeSearchQuery').value.trim());}});
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!e.target.closest('input,textarea,[contenteditable=true]')){e.preventDefault();const input=document.getElementById('homeSearchQuery')||document.getElementById('discoverQuery');if(input)input.focus();else location.href='discover.html';}});
 surface();
})();
