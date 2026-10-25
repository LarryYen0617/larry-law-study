/* Browser-local books and progress. No network or account identifiers. */
(()=>{
 const keys=['larry-law-midterm-v1','lex-nexus-study-v1','lex-nexus-library-v1','larry-law-toolkit-draft-v1','lex-nexus-reading-position-v1','lex-nexus-reader-preferences-v1','lex-nexus-public-reading-v1','lex-nexus-collections-v1'];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function chapters(text){
  const clean=String(text).replace(/\r\n?/g,'\n').replace(/\u0000/g,'').trim();if(!clean||clean.length>3_000_000)throw Error('內容需介於 1 字至 300 萬字之間。');
  const lines=clean.split('\n'),rows=[];let title='正文',part=[];
  const flush=()=>{if(part.join('').trim())rows.push({title,text:part.join('\n').trim()});part=[];};
  for(const line of lines){if(/^\s*(?:第[〇零一二三四五六七八九十百千萬兩\d]{1,14}[章回節卷部]|chapter\s+\d+)[^\n]{0,90}$/i.test(line)){flush();title=line.trim();}else part.push(line);}
  flush();if(!rows.length)throw Error('未找到可閱讀文字。');return rows;
 }
 function validBook(b){return b&&typeof b.id==='string'&&/^[a-z0-9-]{1,100}$/.test(b.id)&&typeof b.title==='string'&&b.title.length<=300&&Array.isArray(b.chapters)&&b.chapters.length>0&&b.chapters.length<=5000&&b.chapters.every(c=>typeof c.title==='string'&&typeof c.text==='string')&&b.chapters.reduce((n,c)=>n+c.text.length,0)<=3_000_000;}
 function db(){return new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(Error('目前瀏覽器無法儲存書籍。'));return;}const req=indexedDB.open('lex-nexus-books-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('books',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(Error('書籍儲存空間無法開啟。'));});}
 async function books(action='getAll',value){const d=await db();try{return await new Promise((resolve,reject)=>{const tx=d.transaction('books',action==='getAll'?'readonly':'readwrite'),store=tx.objectStore('books'),req=action==='getAll'?store.getAll():store.put(value);let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(Error('儲存失敗，可能是空間不足。'));tx.onabort=()=>reject(Error('儲存未完成。'));});}finally{d.close();}}
 function download(name,data){const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
 async function putMany(rows){const d=await db();try{return await new Promise((resolve,reject)=>{const tx=d.transaction('books','readwrite'),store=tx.objectStore('books');for(const b of rows)store.put(b);tx.oncomplete=resolve;tx.onerror=()=>reject(Error('書籍還原失敗。'));tx.onabort=()=>reject(Error('書籍還原未完成，原有書架已保留。'));});}finally{d.close();}}
 window.LEX_WORKSPACE={keys,esc,chapters,validBook,books,putMany,download};
})();
