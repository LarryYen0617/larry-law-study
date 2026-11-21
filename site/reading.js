(()=>{
 const NOVEL_ID='zhu-tian-wan-jie-v2';
 const W=window.LEX_WORKSPACE,E=W.esc,$=id=>document.getElementById(id);let collection=[],published=[],book=null,chapter=0,font=18,renderTicket=0,tocPage=0;
 try{const p=JSON.parse(localStorage.getItem('lex-nexus-reader-preferences-v1')||'{}');font=Math.max(16,Math.min(26,Number(p.font)||18));}catch{}
 const status=s=>$('readerStatus').textContent=s;

 const NOVEL_PREF_KEY='lex-nexus-novel-preferences-v1';
 const NOVEL_OPTIONS={
  fontFace:{kai:'標楷體',serif:'明體',sans:'黑體'},
  spacing:{compact:'緊湊',regular:'適中',relaxed:'寬鬆'},
  theme:{paper:'米白',white:'純白',green:'淡綠',night:'夜間'},
 };
 const NOVEL_DEFAULTS={fontFace:'kai',spacing:'compact',theme:'paper'};
 const novelPrefs={...NOVEL_DEFAULTS};
 try{
  const stored=JSON.parse(localStorage.getItem(NOVEL_PREF_KEY)||'{}');
  for(const [key,options] of Object.entries(NOVEL_OPTIONS)){
   if(Object.hasOwn(options,stored[key]))novelPrefs[key]=stored[key];
  }
  if(Number.isInteger(stored.size)&&stored.size>=14&&stored.size<=28)novelPrefs.size=stored.size;
 }catch{}
 novelPrefs.size??=font-2;

 function novelSettings(){
  const fields=[['fontFace','字體'],['spacing','行距'],['theme','背景']];
  return `<details class="novel-settings"><summary>閱讀設定</summary>
   <div class="novel-settings-fields">
    <label>字級 <output id="novelFontValue" for="novelFontSize">${novelPrefs.size} px</output>
     <input id="novelFontSize" type="range" min="14" max="28" value="${novelPrefs.size}" data-novel-pref="size" aria-label="正文字級">
    </label>
    ${fields.map(([key,label])=>`<label>${label}<select data-novel-pref="${key}">${Object.entries(NOVEL_OPTIONS[key]).map(([value,name])=>`<option value="${value}" ${value===novelPrefs[key]?'selected':''}>${name}</option>`).join('')}</select></label>`).join('')}
    <button type="button" id="resetNovelPreferences">恢復預設</button>
   </div>
  </details>`;
 }

 function applyNovelPreferences(save=false){
  const article=$('novelProse');
  if(article){
   article.dataset.fontFace=novelPrefs.fontFace;
   article.dataset.spacing=novelPrefs.spacing;
   article.dataset.theme=novelPrefs.theme;
   article.style.setProperty('--reader-font',novelPrefs.size+'px');
   $('novelFontSize').value=novelPrefs.size;
   $('novelFontValue').textContent=novelPrefs.size+' px';
   for(const control of $('bookReader').querySelectorAll('select[data-novel-pref]')){
    control.value=novelPrefs[control.dataset.novelPref];
   }
  }
  if(save){
   try{localStorage.setItem(NOVEL_PREF_KEY,JSON.stringify(novelPrefs));}
   catch{status('目前無法儲存閱讀設定。');}
  }
 }

 $('bookReader').addEventListener('input',event=>{
  if(event.target.dataset.novelPref!=='size')return;
  novelPrefs.size=Number(event.target.value);
  applyNovelPreferences();
 });
 $('bookReader').addEventListener('change',event=>{
  const key=event.target.dataset.novelPref;
  if(key==='size')novelPrefs.size=Number(event.target.value);
  else if(Object.hasOwn(NOVEL_OPTIONS,key)&&Object.hasOwn(NOVEL_OPTIONS[key],event.target.value)){
   novelPrefs[key]=event.target.value;
  }else return;
  applyNovelPreferences(true);
 });
 function shelf(){const all=[...published,...collection]; $('bookshelf').innerHTML=`<div class="section-title"><h2>我的書架</h2><span>${all.length} 本</span></div>${all.length?`<div class="shelf-grid">${all.map(b=>`<article class="book-card"><button class="shelf-cover" data-open-book="${E(b.id)}" aria-label="閱讀${E(b.title)}"><span>${E(b.title)}</span></button><div><p class="eyebrow">${b.published?E(b.subtitle||'公開連載'):'PERSONAL LIBRARY'}</p><h3>${E(b.title)}</h3><p>${b.chapterCount||b.chapters.length} 章 · 已讀至第 ${Math.min((b.position||0)+1,(b.chapterCount||b.chapters.length))} 章</p><button data-open-book="${E(b.id)}">接續閱讀 →</button></div></article>`).join('')}</div>`:'<div class="shelf-empty"><h3>把想讀的文字放進書架。</h3><p>匯入自己的小說或長文，即可使用章節目錄、字級調整與閱讀接續。</p><p class="muted">可直接開啟未加密 EPUB；書籍不會上傳或分享給其他訪客。</p></div>'}`; }
 async function remember(){if(!book)return;if(book.published){try{const state=JSON.parse(localStorage.getItem('lex-nexus-public-reading-v1')||'{}');state[book.id]={chapter,updatedAt:new Date().toISOString()};localStorage.setItem('lex-nexus-public-reading-v1',JSON.stringify(state));book.position=chapter;}catch{status('閱讀進度無法儲存，請先備份。');}return;}book.position=chapter;book.updatedAt=new Date().toISOString();try{await W.books('put',book);}catch(e){status(e.message);}}
 async function render(){if(!book)return;const ticket=++renderTicket;
 if(book.published&&book.chapters[chapter]?.text===undefined){
  $('bookshelf').hidden=true;$('bookReader').hidden=false;$('bookReader').innerHTML='<p role="status">正在開啟章節…</p>';
  try{const current=book,part=current.chapters[chapter].part;if(!/^chapters-\d{3}\.json$/.test(part))throw Error('章節資料有誤。');const response=await fetch(current.base+part,{credentials:'omit'});if(!response.ok)throw Error('章節暫時無法讀取。');const rows=await response.json();if(!Array.isArray(rows))throw Error('章節格式不符。');for(const row of rows){const c=current.chapters[row.number-1];if(c&&typeof row.text==='string'&&row.text.length<200000)c.text=row.text;}if(ticket!==renderTicket)return;if(typeof current.chapters[chapter].text!=='string')throw Error('這個章節沒有正文。');status('');}catch(e){if(ticket!==renderTicket)return;status(e.message);$('bookReader').innerHTML='<p>章節尚未載入。</p><button id="backShelf">返回書架</button><button data-book-chapter="'+chapter+'">重新載入</button>';return;}
 }
chapter=Math.max(0,Math.min(book.chapters.length-1,chapter));const c=book.chapters[chapter];$('bookshelf').hidden=true;$('bookReader').hidden=false;$('bookReader').innerHTML=`${book.id===NOVEL_ID?novelSettings():''}<div class="reader-toolbar"><button id="backShelf">← 返回書架</button><span>${E(book.title)}${book.subtitle?' · '+E(book.subtitle):''}</span><div class="chapter-jump"><label>第 <input id="chapterNumber" type="number" min="1" max="${book.chapters.length}" value="${chapter+1}" aria-label="前往章號"> 章</label><button data-jump-book="true">前往</button></div><div><button data-font="-1" aria-label="縮小閱讀字級">A−</button><button data-font="1" aria-label="放大閱讀字級">A＋</button></div></div><div class="reading-workbench"><nav class="chapter-rail" aria-label="小說章節目錄">${book.chapters.slice(tocPage*25,tocPage*25+25).map((c,i)=>`<button data-book-chapter="${tocPage*25+i}" aria-pressed="${tocPage*25+i===chapter}">${E(c.title)}</button>`).join('')}<div class="toc-pager"><button data-toc-page="${tocPage-1}" ${tocPage===0?'disabled':''}>← 目錄</button><span>${tocPage*25+1}–${Math.min(book.chapters.length,tocPage*25+25)}</span><button data-toc-page="${tocPage+1}" ${(tocPage+1)*25>=book.chapters.length?'disabled':''}>目錄 →</button></div></nav><article class="prose-reader${book.id===NOVEL_ID?' novel-prose':''}" ${book.id===NOVEL_ID?'id="novelProse"':''} style="--reader-font:${font}px"><p class="eyebrow">${chapter+1} / ${book.chapters.length}</p><h2>${E(c.title)}</h2>${c.text.split(/\n\s*\n|\n/).filter(Boolean).map(t=>`<p>${E(t)}</p>`).join('')}<nav class="chapter-pagination" aria-label="章節翻頁"><button data-book-chapter="${chapter-1}" ${chapter===0?'disabled':''}>← 上一章</button><span>${chapter+1} / ${book.chapters.length}</span><button data-book-chapter="${chapter+1}" ${chapter===book.chapters.length-1?'disabled':''}>下一章 →</button></nav></article></div>`;if(book.id===NOVEL_ID){
 const reader=$('bookReader');
 reader.insertAdjacentHTML('beforeend','<nav class="mobile-reader-menu" aria-label="閱讀工具"><button data-sheet="catalog">目錄</button><button data-sheet="progress">進度</button><button data-sheet="marks">書籤</button><button data-sheet="settings">設定</button><button id="mobileShelf">書架</button><button class="reader-dismiss" aria-label="收起閱讀工具">收起</button></nav><button class="reader-shade" aria-label="關閉面板"></button><button class="reader-tools-toggle" aria-label="顯示或收起閱讀工具">閱讀工具</button>');
 delete reader.dataset.sheet;
 if(reader.dataset.chapter!==String(chapter))reader.scrollTop=0;
 reader.dataset.chapter=String(chapter);
 const marks=readMarks();
 reader.insertAdjacentHTML('beforeend','<section class="novel-marks"><h2>章節書籤</h2><button id="toggleNovelMark">'+(marks.includes(chapter)?'移除本章書籤':'收藏本章')+'</button>'+marks.map(n=>'<button data-book-chapter="'+n+'">'+E(book.chapters[n].title)+'</button>').join('')+'</section>');
 applyNovelPreferences();
}}
 function resolvePath(base,href){const path=href.split('#')[0].split('?')[0];if(/^[a-z]+:|^\/\//i.test(path))throw Error('書籍包含不支援的外部章節。');const parts=(base.slice(0,base.lastIndexOf('/')+1)+decodeURIComponent(path)).split('/'),out=[];for(const p of parts){if(p==='..')out.pop();else if(p&&p!=='.')out.push(p);}return out.join('/');}
 async function epub(file){
  const buf=await file.arrayBuffer(),view=new DataView(buf),bytes=new Uint8Array(buf),decoder=new TextDecoder('utf-8');let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
  if(end<0)throw Error('這不是有效的 EPUB 壓縮檔。');const count=view.getUint16(end+10,true);if(count>5000)throw Error('章節或附件數量過多。');let pos=view.getUint32(end+16,true),total=0;const entries=new Map();
  for(let i=0;i<count;i++){if(pos+46>bytes.length||view.getUint32(pos,true)!==0x02014b50)throw Error('EPUB 目錄損毀。');const flags=view.getUint16(pos+8,true),method=view.getUint16(pos+10,true),size=view.getUint32(pos+20,true),plain=view.getUint32(pos+24,true),n=view.getUint16(pos+28,true),extra=view.getUint16(pos+30,true),comment=view.getUint16(pos+32,true),offset=view.getUint32(pos+42,true);total+=plain;if(total>40_000_000||plain>12_000_000)throw Error('解壓後內容超過支援大小。');entries.set(decoder.decode(bytes.slice(pos+46,pos+46+n)),{flags,method,size,plain,offset});pos+=46+n+extra+comment;}
  async function read(name){const e=entries.get(name);if(!e)throw Error('缺少書籍章節：'+name);if(e.flags&1)throw Error('無法開啟加密 EPUB。');if(e.offset+30>bytes.length||view.getUint32(e.offset,true)!==0x04034b50)throw Error('章節檔案損毀。');const start=e.offset+30+view.getUint16(e.offset+26,true)+view.getUint16(e.offset+28,true);if(start+e.size>bytes.length)throw Error('章節資料不完整。');const raw=bytes.slice(start,start+e.size);let out;if(e.method===0)out=raw;else if(e.method===8){if(typeof DecompressionStream==='undefined')throw Error('此瀏覽器不支援 EPUB 解壓，請改匯入 TXT。');const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw')),reader=stream.getReader(),chunks=[];let length=0;while(true){const x=await reader.read();if(x.done)break;length+=x.value.length;if(length>e.plain||length>12_000_000){await reader.cancel();throw Error('章節解壓大小不符。');}chunks.push(x.value);}out=new Uint8Array(length);let at=0;for(const c of chunks){out.set(c,at);at+=c.length;}}else throw Error('不支援此 EPUB 壓縮方式。');if(out.length!==e.plain)throw Error('章節長度不符。');return decoder.decode(out);}
  const parser=new DOMParser(),container=parser.parseFromString(await read('META-INF/container.xml'),'application/xml'),root=container.getElementsByTagName('rootfile')[0]?.getAttribute('full-path');if(!root)throw Error('未找到 EPUB 主檔。');const opf=parser.parseFromString(await read(root),'application/xml'),items=new Map(Array.from(opf.getElementsByTagName('item')).map(x=>[x.getAttribute('id'),x.getAttribute('href')])),refs=Array.from(opf.getElementsByTagName('itemref'));const rows=[];
  for(const ref of refs){const href=items.get(ref.getAttribute('idref'));if(!href)continue;const rawHTML=(await read(resolvePath(root,href))).replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi,'').replace(/<(?:img|link|iframe|object|embed|video|audio|source|meta)\b[^>]*>/gi,'');const doc=parser.parseFromString(rawHTML,'text/html');doc.querySelectorAll('script,style,iframe,object,svg,nav').forEach(x=>x.remove());const title=doc.querySelector('h1,h2,h3')?.textContent.trim()||doc.title||'第 '+(rows.length+1)+' 節',parts=Array.from(doc.querySelectorAll('p,li,blockquote,pre')).map(x=>x.textContent.trim()).filter(Boolean),text=parts.join('\n\n')||doc.body.textContent.trim();if(text)rows.push({title,text});}
  if(!rows.length)throw Error('書籍中沒有可讀文字。');return {title:opf.getElementsByTagNameNS('*','title')[0]?.textContent.trim()||file.name.replace(/\.epub$/i,''),chapters:rows};
 }
 $('bookFile').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>20_000_000)throw Error('單檔請小於 20 MB。');status('正在整理章節…');const data=/\.epub$/i.test(f.name)?await epub(f):/\.txt$/i.test(f.name)?{title:f.name.replace(/\.txt$/i,''),chapters:W.chapters(await f.text())}:null;if(!data)throw Error('請選擇 TXT 或 EPUB。');const hash=await crypto.subtle.digest('SHA-256',await f.arrayBuffer()),id='book-'+Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');const previous=collection.find(b=>b.id===id),entry={...data,id,position:previous?.position||0,updatedAt:new Date().toISOString()};if(!W.validBook(entry))throw Error('書籍內容超出支援範圍。');await W.books('put',entry);collection=await W.books();shelf();status('已加入書架，點選「接續閱讀」開始。');}catch(err){status(err.message||'無法匯入，請改用 UTF-8 TXT。');}finally{e.target.value='';}});
 async function openBook(id,requested=null){book=[...published,...collection].find(x=>x.id===id);if(!book){status(id==='wan-jie-fa-shen'?'舊版《全職法師：萬界法神》已下架。你仍可使用個人書架，原閱讀紀錄會保留。':'找不到這本書。');return;}if(book.published&&!book.chapters){try{status('正在開啟目錄…');const response=await fetch(book.base+'manifest.json',{credentials:'omit'});if(!response.ok)throw Error('目錄暫時無法讀取。');const manifest=await response.json();if(!Array.isArray(manifest.chapters)||manifest.chapters.length!==book.chapterCount)throw Error('章節目錄不完整。');book.chapters=manifest.chapters;status('');}catch(err){status(err.message);return;}}chapter=requested===null?(book.position||0):requested-1;if(!Number.isInteger(chapter)||chapter<0||chapter>=book.chapters.length){status('章號超出目錄範圍。');return;}tocPage=Math.floor(chapter/25);await render();if(book.published&&typeof book.chapters[chapter].text==='string')await remember();$('bookReader').scrollIntoView({block:'start'});}
 function readMarks(){
  try{
   const saved=JSON.parse(localStorage.getItem('lex-novel-v2-bookmarks')||'[]');
   return Array.isArray(saved)?[...new Set(saved.filter(n=>Number.isInteger(n)&&n>=0&&n<book.chapters.length))].sort((a,b)=>a-b):[];
  }catch{return [];}
 }
 $('bookReader').addEventListener('click',event=>{
  const reader=$('bookReader'), target=event.target;
  if(target.closest('#toggleNovelMark')){
   const marks=readMarks();
   try{localStorage.setItem('lex-novel-v2-bookmarks',JSON.stringify(marks.includes(chapter)?marks.filter(n=>n!==chapter):marks.concat(chapter)));}
   catch{status('無法儲存書籤。');return;}
   render().then(()=>{reader.dataset.sheet='marks';});return;
  }
  if(target.closest('#mobileShelf')){ $('backShelf').click();return; }
  const sheet=target.closest('[data-sheet]')?.dataset.sheet;
  if(['settings','progress','catalog','marks'].includes(sheet)&&target.closest('.mobile-reader-menu')){
   reader.classList.add('tools-visible');
   reader.dataset.sheet=reader.dataset.sheet===sheet?'':sheet;
   for(const button of reader.querySelectorAll('.mobile-reader-menu [data-sheet]'))button.setAttribute('aria-expanded',String(button.dataset.sheet===reader.dataset.sheet));
   const settings=reader.querySelector('.novel-settings');
   if(settings)settings.open=reader.dataset.sheet==='settings';
  }else if(target.closest('.reader-shade,.reader-dismiss')){
   delete reader.dataset.sheet;
   if(target.closest('.reader-dismiss'))reader.classList.remove('tools-visible');
   for(const button of reader.querySelectorAll('.mobile-reader-menu [data-sheet]'))button.setAttribute('aria-expanded','false');
  }else if(target.closest('.reader-tools-toggle')||(target.closest('#novelProse')&&!target.closest('button')&&!window.getSelection()?.toString())){
   reader.classList.toggle('tools-visible');delete reader.dataset.sheet;
  }
 });
 document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.openBook){await openBook(b.dataset.openBook);}if(b.dataset.bookChapter!==undefined&&book){const n=Number(b.dataset.bookChapter);if(Number.isInteger(n)&&n>=0&&n<book.chapters.length){chapter=n;tocPage=Math.floor(chapter/25);await render();await remember();$('bookReader').scrollIntoView({block:'start'});}}if(b.dataset.tocPage!==undefined&&book){const n=Number(b.dataset.tocPage);if(Number.isInteger(n)&&n>=0&&n*25<book.chapters.length){tocPage=n;await render();$('bookReader').dataset.sheet='catalog';}}if(b.dataset.jumpBook&&book){const n=Number($('chapterNumber').value)-1;if(Number.isInteger(n)&&n>=0&&n<book.chapters.length){chapter=n;tocPage=Math.floor(chapter/25);await render();await remember();$('bookReader').scrollIntoView({block:'start'});}else status('請輸入有效的章號。');}if(b.id==='resetNovelPreferences'){Object.assign(novelPrefs,NOVEL_DEFAULTS,{size:16});applyNovelPreferences(true);}
 if(b.dataset.font&&book?.id===NOVEL_ID){novelPrefs.size=Math.max(14,Math.min(28,novelPrefs.size+Number(b.dataset.font)));applyNovelPreferences(true);return;}
 if(b.dataset.font){font=Math.max(16,Math.min(26,font+Number(b.dataset.font)));try{localStorage.setItem('lex-nexus-reader-preferences-v1',JSON.stringify({font}));}catch{}render();}if(b.id==='backShelf'){await remember();$('bookReader').hidden=true;$('bookshelf').hidden=false;collection=await W.books();shelf();}});
 Promise.allSettled([W.books(),fetch('books/catalog.json',{credentials:'omit'}).then(r=>{if(!r.ok)throw Error('書目暫時無法讀取。');return r.json();})]).then(async results=>{if(results[0].status==='fulfilled')collection=results[0].value.filter(W.validBook);let progress={};try{progress=JSON.parse(localStorage.getItem('lex-nexus-public-reading-v1')||'{}');}catch{}if(results[1].status==='fulfilled')published=results[1].value.filter(b=>b.id===NOVEL_ID&&b.base==='books/'+NOVEL_ID+'/'&&Number.isInteger(b.chapterCount)&&b.chapterCount>0).map(b=>({...b,position:Number.isInteger(progress[b.id]?.chapter)?Math.max(0,Math.min(b.chapterCount-1,progress[b.id].chapter)):0}));else status('公開書目暫時無法載入，仍可使用本機書架。');shelf();const params=new URL(location.href).searchParams;const id=params.get('book'),number=params.get('chapter');if(id===NOVEL_ID||id==='wan-jie-fa-shen')await openBook(id,/^\d{1,4}$/.test(number||'')?Number(number):null);});
})();
