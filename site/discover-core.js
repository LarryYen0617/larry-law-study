/* Shared pure functions: public search and browser-local review scheduling. */
(()=>{
 const key='lex-nexus-collections-v1',types={note:'重點筆記',card:'觀念補充',question:'選擇題',teacher:'課堂解析',archive:'解析筆記',reading:'法律導讀',novel:'小說章名',lesson:'課程章節'};
 const subjects={criminalgeneral:'刑法總則',civilgeneral:'民法總則',constitution:'憲法',crime:'刑法分則',family:'親屬法',debt:'債權',property:'物權',admin:'行政法',tax:'租稅法',legalenglish:'法學英文',photonics:'光電科技'};
 // Canonicalize Taiwanese statute citations before tokenization, including full-width digits.
 const normalizeCitations=s=>String(s??'').normalize('NFKC')
  .replace(/第\s*(\d+)\s*-\s*(\d+)\s*條/g,'第$1條之$2')
  .replace(/第\s*(\d+)\s*條\s*-\s*(\d+)/g,'第$1條之$2')
  .replace(/第\s*(\d+)\s*條\s*之\s*(\d+)/g,'第$1條之$2')
  .replace(/第\s*(\d+)\s*條/g,'第$1條')
  .replace(/§\s*(\d+)\s*(?:-\s*(\d+)|之\s*(\d+))/g,(_,n,a,b)=>'§'+n+'-'+(a||b))
  .replace(/§\s*(\d+)/g,'§$1')
  .replace(/\s+/g,' ').trim();
 const normalize=s=>normalizeCitations(s).toLowerCase();
 const terms=s=>normalize(s).split(' ').filter(Boolean);
 const aliases={刑總:'刑法總則',民總:'民法總則',債總:'債權',刑分:'刑法分則',法英:'法學英文'};
 // AND across terms; OR across spellings of the same legal citation or course alias.
 function queryGroups(value){return terms(value).flatMap(token=>{
  const compound=token.match(/^(.+?)(第\d+條(?:之\d+)?|§\d+(?:-\d+)?)$/)
   ||token.match(/^(.+?法)(\d{1,4}(?:-|條之|之)\d{1,3})$/)
   ||token.match(/^(.+?法)(\d{1,4}條)$/);
  return (compound?[compound[1],compound[2]]:[token]).map(term=>{
   const bareBase=term.match(/^(\d{1,4})條$/);
   if(bareBase)return ['第'+bareBase[1]+'條','§'+bareBase[1],bareBase[1]+'條'];
   const bare=term.match(/^(\d{1,4})(?:-|條之|之)(\d{1,3})$/);
   if(bare)return ['第'+bare[1]+'條之'+bare[2],'§'+bare[1]+'-'+bare[2],bare[1]+'-'+bare[2]];
   const article=term.match(/^(?:第(\d+)條(?:之(\d+))?|§(\d+)(?:-(\d+))?)$/);
   if(article){const n=article[1]||article[3],suffix=article[2]||article[4];
    return suffix?['第'+n+'條之'+suffix,'§'+n+'-'+suffix,n+'-'+suffix]:['第'+n+'條','§'+n,n+'條'];
   }
   return aliases[term]?[term,aliases[term]]:[term];
  });
 });}
 // Avoid matching 第759條之10 when the user asks for 第759條之1.
 function termIndex(text,term){
  const named=term.match(/^第(\d+)條(?:之(\d+))?$/);
  if(named)return text.search(new RegExp('第'+named[1]+'條'+(named[2]?'之'+named[2]+'(?![\\d-])':'(?!之\\d)')));
  const section=term.match(/^§(\d+)(?:-(\d+))?$/);
  if(section)return text.search(new RegExp('§'+section[1]+(section[2]?'-'+section[2]+'(?![\\d-])':'(?![-\\d])')));
  const bareBase=term.match(/^(\d{1,4})條$/);
  if(bareBase)return text.search(new RegExp('(?:^|[^\\d])'+bareBase[1]+'條(?!之\\d)'));
  const bare=term.match(/^(\d+)-(\d+)$/);
  if(bare)return text.search(new RegExp('(?:^|[^\\d-])'+bare[1]+'-'+bare[2]+'(?![\\d-])'));
  return text.indexOf(term);
 }
 const today=(at=new Date())=>new Date(at).toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
 const validDate=s=>typeof s==='string'&&/^20\d\d-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
 function validCollection(value){return !!value&&value.version===1&&value.items&&typeof value.items==='object'&&!Array.isArray(value.items)&&Object.keys(value.items).length<=5000&&Object.entries(value.items).every(([id,r])=>/^[a-z]+:[A-Za-z0-9_-]{1,150}$/.test(id)&&r&&r.id===id&&validDate(r.addedOn)&&validDate(r.dueOn)&&Number.isInteger(r.stage)&&r.stage>=0&&r.stage<=5);}
 function dueDate(day,days){if(!validDate(day))throw Error('日期格式不符');const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
 function review(record,day=today(),snooze=false){if(!validDate(day))throw Error('日期格式不符');const intervals=[1,3,7,14,30,30];return {...record,dueOn:dueDate(day,snooze?1:intervals[record.stage]),stage:snooze?record.stage:Math.min(5,record.stage+1)};}
 function safeHref(href){if(typeof href!=='string'||! /^(?:essentials|library|index|reading|legal-english|photonics|courses|class-notes\/[a-z0-9-]+)\.html(?:[?#]|$)/.test(href))return false;try{const u=new URL(href,'https://lex.invalid/');return u.origin==='https://lex.invalid'&&(['/essentials.html','/library.html','/index.html','/reading.html','/courses.html','/legal-english.html','/photonics.html'].includes(u.pathname)||/^\/class-notes\/[a-z0-9-]+\.html$/.test(u.pathname))&&!u.username&&!u.password;}catch{return false;}}
 function validIndex(d){return d?.version===1&&Array.isArray(d.items)&&d.items.length<=20000&&d.items.every(x=>x&&typeof x==='object'&&/^[a-z]+:[A-Za-z0-9_-]{1,150}$/.test(x.id)&&Object.hasOwn(types,x.type)&&typeof x.title==='string'&&x.title.trim().length>0&&x.title.length<=1000&&typeof x.body==='string'&&x.body.length<=100000&&typeof x.subject==='string'&&safeHref(x.href))&&new Set(d.items.map(x=>x.id)).size===d.items.length;}
 // Normalize each immutable index row once, not on every mobile filter/search.
 // Revalidate source strings so tests and future in-memory edits cannot use stale text.
 const normalizedCache=new WeakMap();
 function indexedText(x){
  const cached=normalizedCache.get(x);
  if(cached&&cached.rawTitle===x.title&&cached.rawBody===x.body&&cached.rawSubject===x.subject)return cached;
  const value={rawTitle:x.title,rawBody:x.body,rawSubject:x.subject,
   title:normalize(x.title),body:normalize(x.body),name:normalize(subjects[x.subject]||x.subject)};
  normalizedCache.set(x,value);return value;
 }
 function search(items,{q='',subject='',type=''}={}){const words=queryGroups(q);return items.filter(x=>(!type||x.type===type)&&(!subject||x.subject===subject)).map(x=>{const {title,body,name}=indexedText(x);let score=0;for(const forms of words){const inTitle=forms.some(v=>termIndex(title,v)>=0),inSubject=forms.some(v=>termIndex(name,v)>=0),inBody=forms.some(v=>termIndex(body,v)>=0);if(!inTitle&&!inSubject&&!inBody)return null;score+=inTitle?10:inSubject?6:1;}return {item:x,score};}).filter(Boolean).sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title,'zh-Hant')).map(x=>x.item);}
 function excerpt(text,q){const words=queryGroups(q).flat();const s=normalizeCitations(String(text??'').replace(/\|[\s:-]+(?=\|)/g,' ').replace(/[|#*`]/g,' '));const searchable=s.toLowerCase();let pos=-1;for(const term of words){pos=termIndex(searchable,term);if(pos>=0)break;}const start=Math.max(0,pos-30);return (start?'…':'')+s.slice(start,start+155)+(s.length>start+155?'…':'');}
 function persist(storage,value){if(!validCollection(value))throw Error('收藏紀錄格式不符。');storage.setItem(key,JSON.stringify(value));return value;}
 window.LEX_DISCOVER={key,types,subjects,normalize,today,validDate,validCollection,dueDate,review,safeHref,validIndex,search,excerpt,persist};
})();
