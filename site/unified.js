(()=>{
 if(typeof MutationObserver==='undefined')return;
 const version='20261023-nocturne10',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const names=[['criminalgeneral','刑法總則'],['civilgeneral','民法總則'],['constitution','憲法'],['crime','刑法分則'],['family','親屬法'],['debt','債權'],['property','物權'],['admin','行政法'],['tax','租稅法']];
 function surface(){
  const brand=document.querySelector('.brand,.sidebar-brand');if(brand){brand.classList.add('sidebar-brand');brand.innerHTML='<b>LEX NEXUS</b><span>法律 · 閱讀 · 創作</span>';}
  document.querySelectorAll('main>footer').forEach(f=>f.innerHTML=`<span>LEX NEXUS · 閱讀、理解、練習。</span><a href="coverage.html?v=${version}">資料來源</a><a href="settings.html?v=${version}">資料與備份</a>`);
  const mainApp=document.getElementById('mainNav');
  document.body.classList.toggle('is-dashboard',Boolean(mainApp&&typeof page!=='undefined'&&page==='dashboard'&&!query));
  if(mainApp&&typeof page!=='undefined'&&page==='dashboard'&&!query){
   document.getElementById('title').textContent='讓知識成為你的底氣。';document.getElementById('intro').textContent='讀懂法律的脈絡，練出自己的觀點；也為故事，留一段安靜的時間。';
   let resume='';try{const last=JSON.parse(localStorage.getItem('lex-nexus-reading-position-v1')||'null'),href=window.LEX_NAVIGATION.resume(last);if(href)resume=`<div class="resume-card"><div><small>CONTINUE READING</small><h2>${esc(last.title)}</h2></div><a class="solid-link" href="${esc(href)}">接續閱讀 →</a></div>`;}catch{}
   document.getElementById('content').innerHTML=`${resume}<div class="home-primary-grid"><a class="home-primary-card" href="essentials.html?v=${version}"><span class="card-number">01 / STUDY</span><h2>法律筆記</h2><p>從核心觀念、要件與比較表，建立自己的理解。</p><span class="card-link">開始閱讀 →</span></a><a class="home-primary-card" href="index.html?v=${version}#/crime/quiz/0"><span class="card-number">02 / PRACTICE</span><h2>題庫與申論</h2><p>選擇題、老師題型與三級申論，循序練習。</p><span class="card-link">進入練習 →</span></a><a class="home-primary-card" href="reading.html?v=${version}"><span class="card-number">03 / READING</span><h2>小說與閱讀</h2><p>長篇小說與個人書架，留住每次閱讀的位置。</p><span class="card-link">走進閱讀書房 →</span></a></div><div class="section-title"><h2>九科法律</h2><span>選擇今天的研讀方向</span></div><nav class="course-pills" aria-label="九科重點">${names.map(([id,name])=>`<a href="essentials.html?v=${version}&amp;subject=${id}">${name}</a>`).join('')}</nav><nav class="quick-access" aria-label="常用功能"><a href="index.html?v=${version}#/daily">每日導讀 ↗</a><a href="index.html?v=${version}#/allwrong">錯題複習 ↗</a><a href="study-toolkit.html?v=${version}#draft">我的申論草稿 ↗</a><a href="index.html?v=${version}#/crime/progress/0">學習進度 ↗</a></nav>`;
  }
 }
 const main=document.querySelector('main');if(main){const tools=document.createElement('div');tools.className='page-reading-tools';const focus=document.createElement('button');focus.className='focus-toggle';focus.type='button';focus.textContent='專注模式';focus.setAttribute('aria-pressed','false');focus.onclick=()=>{const active=document.body.classList.toggle('focus-reading');focus.textContent=active?'離開專注模式':'專注模式';focus.setAttribute('aria-pressed',String(active));};tools.append(focus);main.prepend(tools);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('focus-reading'))focus.click();});}
 if(document.getElementById('mainNav')&&typeof render==='function'){const previous=render;render=function(){previous();surface();};}
 surface();
})();
