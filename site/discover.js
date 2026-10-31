(()=>{
 const C=window.LEX_DISCOVER,$=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let index=[],loaded=false,view='search',type='',subject='',page=0,collection={version:1,items:{}},storageError=false;
 let searchCache={key:null,rows:[]}; // Reuse filtered results across page navigation.
 let loadSequence=0,activeLoadController=null; // Ignore stale retry responses.
 function readCollection(){searchCache.key=null;try{const raw=localStorage.getItem(C.key);if(raw===null){collection={version:1,items:{}};storageError=false;return;}const value=JSON.parse(raw);if(!C.validCollection(value))throw Error();collection=value;storageError=false;}catch{storageError=true;$('collectionStatus').textContent='收藏紀錄暫時無法讀取，原有資料已保留。可到「資料與備份」下載副本。';}}
 function hash(){const params=new URLSearchParams(location.hash.slice(1));view=['search','saved','due'].includes(params.get('view'))?params.get('view'):'search';type=Object.hasOwn(C.types,params.get('type'))?params.get('type'):'';subject=Object.hasOwn(C.subjects,params.get('subject'))?params.get('subject'):'';$('discoverQuery').value=(params.get('q')||'').slice(0,150);const rawPage=params.get('page')||'';page=/^[1-9]\d{0,3}$/.test(rawPage)?Number(rawPage)-1:0;}
 function url(){const p=new URLSearchParams();if(view!=='search')p.set('view',view);if($('discoverQuery').value.trim())p.set('q',$('discoverQuery').value.trim());if(type)p.set('type',type);if(subject)p.set('subject',subject);if(page>0)p.set('page',String(page+1));history.replaceState(null,'','#'+p);}
 function render(){
  const active=document.activeElement,focusData=active?.tagName==='BUTTON'?{...active.dataset}:null;
  const day=C.today(),saved=Object.values(collection.items),known=new Set(index.map(x=>x.id));$('savedCount').textContent=saved.length;$('dueCount').textContent=saved.filter(r=>r.dueOn<=day).length;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  $('typeFilters').innerHTML=[['','全部內容'],...Object.entries(C.types)].map(([id,name])=>`<button type="button" data-type="${id}" aria-pressed="${id===type}">${esc(name)}</button>`).join('');
  $('subjectFilters').innerHTML=[['','全部科目'],...Object.entries(C.subjects)].map(([id,name])=>`<button type="button" data-subject="${id}" aria-pressed="${id===subject}">${esc(name)}</button>`).join('');
  $('resultsTitle').textContent=({search:'全站內容',saved:'我的收藏',due:'今日複習'})[view];
  if(!loaded)return;
  // A due-list cached yesterday is stale after the Taipei calendar day changes.
  // Keep the fast pagination cache for ordinary searches and saved items.
  const q=$('discoverQuery').value.trim(),cacheKey=JSON.stringify([view,type,subject,q,view==='due'?day:null]);
  if(searchCache.key!==cacheKey){
   const base=index.filter(x=>view==='search'||collection.items[x.id]&&(view!=='due'||collection.items[x.id].dueOn<=day));
   const rows=C.search(base,{q,type,subject});
   if(view!=='search'&&!q)rows.sort((a,b)=>collection.items[a.id].dueOn.localeCompare(collection.items[b.id].dueOn));
   searchCache={key:cacheKey,rows};
  }
  const rows=searchCache.rows;const pages=Math.max(1,Math.ceil(rows.length/24));const requestedPage=page;page=Math.max(0,Math.min(page,pages-1));if(page!==requestedPage)url();
  const first=rows.length?page*24+1:0,last=Math.min(rows.length,(page+1)*24);
  $('discoverStatus').textContent=`${rows.length.toLocaleString()} 筆結果 · 共 ${index.length.toLocaleString()} 筆可搜尋內容${rows.length?` · 目前顯示第 ${first}–${last} 筆`:''}${view!=='search'&&saved.some(r=>!known.has(r.id))?'；部分已收藏內容目前不在索引中，紀錄仍保留。':''}`;
  $('discoverPage').textContent=`${page+1} / ${pages}`;$('discoverPrev').disabled=page===0;$('discoverNext').disabled=page+1>=pages;
  $('discoverPageJump').max=String(pages);$('discoverPageJump').value=String(page+1);$('discoverGoPage').disabled=rows.length===0;
  $('discoverResults').innerHTML=rows.slice(page*24,page*24+24).map(x=>{const r=collection.items[x.id];return `<article class="discover-card"><span class="result-meta">${esc(C.types[x.type])}${x.subject?' / '+esc(C.subjects[x.subject]||x.subject):''}</span><h3><a href="${esc(x.href)}">${esc(x.title)}</a></h3><p>${esc(C.excerpt(x.body,q))}</p>${r?`<span class="review-date">${r.dueOn<=day?'待複習':'下次複習 '+r.dueOn} · 已複習 ${r.stage>=5?'5 次以上':r.stage+' 次'}</span>`:''}<div class="result-actions"><a class="open-result" href="${esc(x.href)}">${x.type==='question'?'開始作答':'開啟內容'} ↗</a><button type="button" data-save="${esc(x.id)}" aria-pressed="${!!r}" ${storageError?'disabled':''}>${r?'取消收藏':'＋ 收藏'}</button>${r?`<button type="button" data-review="${esc(x.id)}" ${storageError?'disabled':''}>已複習</button><button type="button" data-snooze="${esc(x.id)}" ${storageError?'disabled':''}>明天再看</button>`:''}</div></article>`;}).join('')||`<div class="discover-empty"><h3>${view==='search'?'沒有找到符合的內容':view==='saved'?'把重要觀念收進自己的書桌':'今天的複習已完成'}</h3><p>${q||type||subject?'可清除篩選，或換一個關鍵字。':view==='saved'?'在全站搜尋中，點「＋ 收藏」開始累積。':view==='due'?'收藏內容會依複習進度安排下次日期。':'試試較短的關鍵字。'}</p></div>`;
  if(focusData){const entry=Object.entries(focusData)[0];if(entry)Array.from(document.querySelectorAll('button')).find(b=>b.dataset[entry[0]]===entry[1])?.focus({preventScroll:true});}
 }
 function update(id,action){if(storageError)return;readCollection();if(storageError)return;const current=collection.items[id];if(!index.some(x=>x.id===id))return;const next={version:1,items:{...collection.items}};if(action==='save'){if(current)delete next.items[id];else{if(Object.keys(next.items).length>=5000){$('collectionStatus').textContent='收藏已達 5,000 筆，請先整理。';return;}next.items[id]={id,addedOn:C.today(),dueOn:C.today(),stage:0};}}else if(current)next.items[id]=C.review(current,C.today(),action==='snooze');try{C.persist(localStorage,next);collection=next;$('collectionStatus').textContent=action==='save'?(current?'已取消收藏。':'已收藏，加入今日複習。'):action==='snooze'?'已安排明天再看。':'已記錄複習，下次 '+next.items[id].dueOn+'。';render();}catch{$('collectionStatus').textContent='紀錄未儲存，可能是瀏覽器空間不足。請先下載備份。';}}
 $('discoverForm').onsubmit=e=>{e.preventDefault();page=0;url();render();};$('clearFilters').onclick=()=>{type='';subject='';$('discoverQuery').value='';page=0;url();render();};
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.view!==undefined){view=b.dataset.view;page=0;url();render();}if(b.dataset.type!==undefined){type=b.dataset.type;page=0;url();render();}if(b.dataset.subject!==undefined){subject=b.dataset.subject;page=0;url();render();}for(const action of ['save','review','snooze'])if(b.dataset[action])update(b.dataset[action],action);});
 $('discoverPrev').onclick=()=>{page=Math.max(0,page-1);url();render();$('resultsTitle').scrollIntoView({block:'start'});};function jumpToPage(){
  const field=$('discoverPageJump'),raw=String(field.value).trim(),pages=Math.max(1,Math.ceil(searchCache.rows.length/24));
  if(!/^[1-9]\d{0,3}$/.test(raw)||Number(raw)>pages){
   field.value=String(page+1);$('collectionStatus').textContent=`頁碼超出範圍，請輸入 1 至 ${pages}。`;return;
  }
  page=Number(raw)-1;url();render();$('resultsTitle').scrollIntoView({block:'start'});
 }
 $('discoverGoPage').onclick=jumpToPage;
 $('discoverPageJump').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();jumpToPage();}};
 $('discoverNext').onclick=()=>{page++;url();render();$('resultsTitle').scrollIntoView({block:'start'});};
 async function load(){
  // Do not let an earlier, slower fetch (or its failure) overwrite a successful retry.
  const requestId=++loadSequence;
  activeLoadController?.abort();
  const controller=new AbortController();
  activeLoadController=controller;
  // Slow mobile connections must offer a retry instead of waiting indefinitely.
  const timeout=setTimeout(()=>controller.abort(),15000);
  loaded=false;
  $('retrySearch').hidden=true;
  $('discoverResults').setAttribute('aria-busy','true');
  $('discoverStatus').textContent='正在讀取搜尋資料…';
  try{
   const r=await fetch('search-index.json',{credentials:'omit',cache:'no-cache',signal:controller.signal});
   if(!r.ok)throw Error('HTTP '+r.status);
   const d=await r.json();
   if(requestId!==loadSequence)return;
   // The preview search already protects the original 3,602-record baseline.
   // Apply the same release floor here; a valid but truncated JSON must fail closed.
   if(!C.validIndex(d)||d.items.length<3602)throw Error('索引格式錯誤或低於 3,602 筆完整基準');
   index=d.items;searchCache.key=null;loaded=true;render();
  }catch(error){
   if(requestId!==loadSequence)return;
   index=[];searchCache.key=null;
   $('discoverResults').innerHTML='';
   $('discoverStatus').textContent=error?.name==='AbortError'?'搜尋連線逾時，請重新載入。':error?.message?.includes('3,602')?'搜尋索引不完整，已停止顯示以避免漏列；請重試。':'搜尋資料暫時無法載入，請重試。';
   $('retrySearch').hidden=false;
  }finally{
   clearTimeout(timeout);
   if(requestId===loadSequence){
    activeLoadController=null;
    $('discoverResults').setAttribute('aria-busy','false');
   }
  }
 }
 $('retrySearch').onclick=load;window.addEventListener('hashchange',()=>{hash();render();});window.addEventListener('storage',e=>{if(e.key===C.key){readCollection();render();}});document.addEventListener('visibilitychange',()=>{if(!document.hidden){readCollection();render();}});readCollection();hash();render();load();
})();
