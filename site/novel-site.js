'use strict';
const app = document.querySelector('#app');
const panel = document.querySelector('#panel');
const panelContent = document.querySelector('#panel-content');
const base = 'books/zhu-tian-wan-jie-v2/';
const bookId = 'zhu-tian-wan-jie-v2';
const progressKey = 'lex-nexus-public-reading-v1';
const marksKey = 'lex-novel-v2-bookmarks';
const prefsKey = 'lex-nexus-novel-preferences-v1';
const offsetKey = 'novel-reading-offset-v1';
const batches = new Map();
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const read = (key,fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
function write(key,value) {
  try { localStorage.setItem(key,JSON.stringify(value)); }
  catch { /* Reading remains available without persistent storage. */ }
}
const prefs = {fontFace:'kai', size:18, spacing:'compact', theme:'paper', ...read(prefsKey,{})};
const choices = {
  fontFace:{kai:'標楷體／文楷',serif:'明體',sans:'黑體'},
  spacing:{compact:'緊湊',regular:'適中',relaxed:'寬鬆'},
  theme:{paper:'米白',white:'純白',green:'淡綠',night:'夜間'}
};
let chapters = [], active = null, ticket = 0, queryTicket = 0;
let scrollQueued = false;
function applyPrefs() {
  const root = document.documentElement;
  root.dataset.theme = Object.hasOwn(choices.theme,prefs.theme) ? prefs.theme : 'paper';
  root.style.setProperty('--size',Math.max(14,Math.min(28,Number(prefs.size)||16))+'px');
  root.style.setProperty('--leading',{compact:1.55,regular:1.8,relaxed:2.1}[prefs.spacing] || 1.55);
  root.style.setProperty('--face',{kai:'var(--kai)',serif:'"Songti TC",serif',sans:'system-ui,sans-serif'}[prefs.fontFace] || 'var(--kai)');
}
async function json(path) {
  const response = await fetch(base+path);
  if (!response.ok) throw Error('資料暫時無法載入');
  return response.json();
}
function batch(part) {
  if (!batches.has(part)) {
    batches.set(part,json(part).catch(error => {batches.delete(part);throw error;}));
  }
  return batches.get(part);
}
const chapterLink = n => '#chapter/'+n;
const resumeNumber = () => {
  const index = read(progressKey,{})[bookId]?.chapter;
  return Number.isInteger(index)&&index>=0&&index<chapters.length ? index+1 : 1;
};
const marks = () => {
  const saved = read(marksKey,[]);
  return Array.isArray(saved) ? saved.filter(n=>Number.isInteger(n)&&chapters[n]) : [];
};
function savePosition() {
  if (active===null) return;
  const paragraphs = app.querySelectorAll('.prose p');
  const index = Array.from(paragraphs).findIndex(p=>p.getBoundingClientRect().bottom>10);
  if(index<0)return;
  const positions = read(offsetKey,{});
  positions[active] = index;
  write(offsetKey,positions);
}
function recordChapter(n) {
  write(progressKey,{...read(progressKey,{}),[bookId]:{chapter:n-1,updatedAt:new Date().toISOString()}});
}
function shell(content) {
  return '<main class="shell"><header class="site-head"><a class="brand" href="#shelf">書架</a><button data-panel="search" class="search-icon" aria-label="搜尋">⌕</button></header>'+content+'</main>';
}
function toc(current) {
  return '<ul class="results">'+chapters.map(chapter=>'<li><a '+(chapter.number===current?'aria-current="page" ':'')+'href="'+chapterLink(chapter.number)+'">'+esc(chapter.title)+'</a></li>').join('')+'</ul>';
}
function library(detail) {
  const n=resumeNumber(), latest=chapters.at(-1);
  const cover='<a class="cover" href="#book" aria-label="諸天萬界作品詳情"><span>諸天萬界</span></a>';
  if(!detail){
    const resume = chapterLink(n);
    app.innerHTML=shell('<div class="shelf-grid"><section>'+cover.replace('href="#book"', 'href="'+resume+'"').replace('作品詳情','繼續閱讀')+'<a class="book-name" href="'+resume+'">諸天萬界</a><small>'+n+'章／'+chapters.length+'章</small></section></div>');
    return;
  }
  const description=detail?'<p class="blurb">顏凌淵與沈月璃從博城出發，在不同世界追尋線索，逐步揭開兩人命運交會的原因。</p>':'';
  app.innerHTML=shell('<h1 class="shelf-title">'+(detail?'作品詳情':'我的書架')+'</h1><section class="book">'+cover+
  '<div><h2>諸天萬界</h2><p class="meta">新版試閱 · 已更新 '+chapters.length+' 章</p>'+description+
  '<div class="actions"><a class="action primary" href="'+chapterLink(n)+'">'+(n===1?'開始閱讀':'續讀第 '+n+' 章')+'</a>'+
  (detail?'<a class="action" href="'+chapterLink(latest.number)+'">最新章</a>':'<a class="action" href="#book">作品詳情</a>')+
  '</div></div></section>'+(detail?'<section class="toc"><div class="toc-head"><h2>章節目錄</h2><button data-panel="marks">書籤</button></div>'+toc(n)+'</section>':''));
}
function navigation(n,label) {
  return chapters[n-1] ? '<a class="action" href="'+chapterLink(n)+'">'+label+'</a>' : '<button disabled>'+label+'</button>';
}
async function openChapter(n, version) {
  const meta=chapters[n-1];
  app.innerHTML='<main class="reader"><p class="message" role="status">正在載入章節…</p></main>';
  const row=(await batch(meta.part)).find(entry=>entry.number===n);
  if (version!==ticket) return;
  if(typeof row?.text!=='string')throw Error('本章正文無法載入');
  active=n;
  recordChapter(n);
  document.title=meta.title+'｜諸天萬界';
  const paragraphs=row.text.split(/\n\s*\n|\n/).map(t=>t.trim()).filter(Boolean);
  app.innerHTML='<main class="reader"><header class="reader-head"><a href="#shelf">‹ 書架</a><button class="show-tools" aria-label="閱讀工具">選單</button></header>'+
  '<h1 class="chapter-caption"><a href="#book" aria-label="章節目錄">‹</a> '+esc(meta.title)+'</h1><article class="prose">'+paragraphs.map(p=>'<p>'+esc(p)+'</p>').join('')+
  '</article><nav class="chapter-turn" aria-label="章節翻頁">'+navigation(n-1,'上一章')+navigation(n+1,'下一章')+
  '</nav></main><nav class="reader-dock" aria-label="閱讀工具"><button data-panel="toc">目錄</button><button data-panel="progress">進度</button>'+
  '<button data-panel="prefs">設定</button></nav>';
  const offset=read(offsetKey,{})[n];
  if (Number.isInteger(offset)&&offset>0) app.querySelectorAll('.prose p')[offset]?.scrollIntoView();
}
async function route() {
  const version=++ticket;
  if(panel.open)panel.close();
  queryTicket++;
  active=null;
  document.body.dataset.chrome=location.hash.startsWith('#chapter/')?'off':'on';
  document.title='諸天萬界｜小說書房';
  window.scrollTo(0,0);
  const match=location.hash.match(/^#chapter\/(\d+)$/);
  if(match&&chapters[Number(match[1])-1]){
    try{await openChapter(Number(match[1]),version);}
    catch(error){if(version===ticket)showError(error);}
  }else library(location.hash==='#book');
}
function showError(error) {
  app.innerHTML=shell('<p class="message" role="status">'+esc(error.message)+'</p><button data-retry>重新載入</button> <a href="#shelf">返回書架</a>');
}
function preferences() {
  const fields=[['fontFace','字體'],['spacing','行距']];
  const themes=Object.entries(choices.theme).map(([value,name])=>'<button type="button" class="theme-chip" data-theme-choice="'+value+'" aria-pressed="'+(prefs.theme===value)+'"><i></i>'+name+'</button>').join('');
  return '<div class="theme-chips" aria-label="閱讀背景">'+themes+'</div><label class="setting">字級 <output id="size-value">'+esc(prefs.size)+' px</output><input aria-label="字級" type="range" min="14" max="28" value="'+esc(prefs.size)+'" data-setting="size"></label>'+
  fields.map(([key,label])=>'<label class="setting">'+label+'<select data-setting="'+key+'">'+Object.entries(choices[key]).map(([value,name])=>'<option value="'+value+'" '+(prefs[key]===value?'selected':'')+'>'+name+'</option>').join('')+'</select></label>').join('');
}
function openPanel(type) {
  queryTicket++;
  document.querySelector('#panel-title').textContent={toc:'章節目錄',progress:'閱讀進度',marks:'書籤',search:'全文搜尋',prefs:'閱讀設定'}[type];
  if(type==='toc') panelContent.innerHTML='<nav class="toc-tabs"><button data-panel="marks">書籤</button><button data-panel="search">搜全文</button></nav>'+toc(active);
  if(type==='prefs') panelContent.innerHTML=preferences();
  if(type==='progress') panelContent.innerHTML='<p class="meta">第 '+active+' 章，共 '+chapters.length+' 章</p><form id="jump"><label>前往第 <input name="number" type="number" min="1" max="'+chapters.length+'" value="'+active+'" required> 章</label><button>前往</button></form>';
  if(type==='search') panelContent.innerHTML='<form id="search-form"><input id="query" name="query" type="search" autocomplete="off" placeholder="書中文字或章名" aria-label="搜尋關鍵字" required maxlength="60"><button>搜尋</button></form><div id="results" aria-live="polite"></div>';
  if(type==='marks'){
    const saved=marks();
    panelContent.innerHTML=(active===null?'':'<button data-bookmark>'+ (saved.includes(active-1)?'移除本章書籤':'收藏本章')+'</button>')+
      (saved.length?'<ul class="results">'+saved.map(index=>'<li><a href="'+chapterLink(index+1)+'">'+esc(chapters[index].title)+'</a></li>').join('')+'</ul>':'<p class="meta">目前沒有書籤</p>');
  }
  if(!panel.open)panel.showModal();
  if(type==='toc')requestAnimationFrame(()=>panel.querySelector('[aria-current]')?.scrollIntoView({block:'center'}));
}
async function search(term) {
  const version=++queryTicket, results=document.querySelector('#results');
  results.textContent='正在搜尋…';
  try {
    const parts=[...new Set(chapters.map(chapter=>chapter.part))];
    const content=new Map((await Promise.all(parts.map(batch))).flat().map(row=>[row.number,row.text]));
    if(version!==queryTicket)return;
    const needle=term.toLocaleLowerCase();
    const hits=[];
    for(const chapter of chapters){
      const body=content.get(chapter.number)||'';
      const index=body.toLocaleLowerCase().indexOf(needle);
      if(index>=0||chapter.title.toLocaleLowerCase().includes(needle)){
        hits.push('<li><a href="'+chapterLink(chapter.number)+'">'+esc(chapter.title)+(index>=0?'<small>'+esc(body.slice(Math.max(0,index-18),index+needle.length+32))+'</small>':'')+'</a></li>');
      }
    }
    results.innerHTML=hits.length?'<p class="meta">'+hits.length+' 章符合</p><ul class="results">'+hits.join('')+'</ul>':'<p class="meta">找不到符合的章節</p>';
  }catch(error){if(version===queryTicket)results.textContent=error.message;}
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(button?.dataset.themeChoice){prefs.theme=button.dataset.themeChoice;applyPrefs();write(prefsKey,prefs);panelContent.innerHTML=preferences();}
  if(button?.dataset.panel)openPanel(button.dataset.panel);
  if(button?.id==='close-panel'||event.target===panel)panel.close();
  if(button?.hasAttribute('data-retry'))location.reload();
  if(button?.hasAttribute('data-bookmark')&&active!==null){
    const saved=marks(), index=active-1;
    write(marksKey,saved.includes(index)?saved.filter(n=>n!==index):[...saved,index]);
    openPanel('marks');
  }
  if(button?.classList.contains('show-tools')||(event.target.closest('.prose')&&!window.getSelection()?.toString()))document.body.dataset.chrome=document.body.dataset.chrome==='off'?'on':'off';
  if(event.target.closest('a[href^="#"]')&&panel.open)panel.close();
});
panel.addEventListener('close',()=>queryTicket++);
panel.addEventListener('input',event=>{
  const key=event.target.dataset.setting;
  if(!key)return;
  prefs[key]=key==='size'?Number(event.target.value):event.target.value;
  if(key==='size')document.querySelector('#size-value').textContent=prefs.size+' px';
  applyPrefs();
  write(prefsKey,prefs);
});
panel.addEventListener('submit',event=>{
  event.preventDefault();
  const data=new FormData(event.target);
  if(event.target.id==='jump'){
    const n=Number(data.get('number'));
    if(chapters[n-1]){panel.close();location.hash=chapterLink(n);}
  }else if(event.target.id==='search-form'){
    const term=String(data.get('query')).trim();
    if(term)search(term);
  }
});
window.addEventListener('scroll',()=>{
  if(scrollQueued)return;
  scrollQueued=true;
  requestAnimationFrame(()=>{scrollQueued=false;savePosition();});
},{passive:true});
window.addEventListener('pagehide',savePosition);
window.addEventListener('hashchange',route);
history.scrollRestoration='manual';
applyPrefs();
json('manifest.json').then(manifest=>{
  chapters=manifest.chapters;
  if(!Array.isArray(chapters)||!chapters.length)throw Error('章節目錄暫時無法載入');
  return route();
}).catch(showError);
