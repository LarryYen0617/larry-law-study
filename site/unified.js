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
   document.getElementById('content').innerHTML=`<section class="new-home" aria-labelledby="new-home-title"><div class="new-home-mark" aria-hidden="true">L</div><p class="new-home-kicker">LARRY LAW STUDY</p><h1 id="new-home-title">法域中樞</h1><p class="new-home-subtitle">法律 · 思辨 · 研究</p><div class="new-home-rule" aria-hidden="true"></div><p class="new-home-caption">以知識為基礎，以思辨為方法。</p><a class="new-home-enter" href="courses.html" aria-label="進入學習平台，查看課程與功能">進入網站 <span aria-hidden="true">→</span></a></section>`
  }
 }
 const main=document.querySelector('main');if(main){const tools=document.createElement('div');tools.className='page-reading-tools';const focus=document.createElement('button');focus.className='focus-toggle';focus.type='button';focus.textContent='專注模式';focus.setAttribute('aria-pressed','false');focus.onclick=()=>{const active=document.body.classList.toggle('focus-reading');focus.textContent=active?'離開專注模式':'專注模式';focus.setAttribute('aria-pressed',String(active));};tools.append(focus);main.prepend(tools);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('focus-reading'))focus.click();});}
 if(document.getElementById('mainNav')&&typeof render==='function'){const previous=render;render=function(){previous();surface();};}
 document.addEventListener('submit',e=>{if(e.target.id==='homeSearch'){e.preventDefault();location.href='discover.html#q='+encodeURIComponent(document.getElementById('homeSearchQuery').value.trim());}});
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!e.target.closest('input,textarea,[contenteditable=true]')){e.preventDefault();const input=document.getElementById('homeSearchQuery')||document.getElementById('discoverQuery');if(input)input.focus();else location.href='discover.html';}});
 surface();
})();
