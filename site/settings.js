(()=>{
 const W=window.LEX_WORKSPACE,$=id=>document.getElementById(id);let staged=null;
 const status=t=>$('settingsStatus').textContent=t;
 async function snapshot(includeBooks){const entries={};for(const key of W.keys){const value=localStorage.getItem(key);if(value!==null)entries[key]=value;}return {format:'lex-nexus-backup',version:1,createdAt:new Date().toISOString(),entries,books:includeBooks?await W.books():[]};}
 async function backup(includeBooks=true,prefix='LEX-NEXUS-完整備份'){const data=await snapshot(includeBooks);W.download(prefix+'-'+new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'})+'.json',data);return data;}
 function validate(data){
  if(!data||data.format!=='lex-nexus-backup'||data.version!==1||!data.entries||Array.isArray(data.entries)||!Array.isArray(data.books)||data.books.length>100)throw Error('這不是支援的完整備份格式。');
  const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
  for(const [key,value] of Object.entries(data.entries)){
   if(!W.keys.includes(key)||typeof value!=='string'||value.length>10_000_000)throw Error('備份含不支援的資料項目。');if(key==='larry-law-toolkit-draft-v1')continue;
   let item;try{item=JSON.parse(value);}catch{throw Error('備份中的紀錄格式錯誤。');}if(!obj(item))throw Error('備份中的紀錄格式錯誤。');
   if(key==='larry-law-midterm-v1'&&(item.version!==1||!Array.isArray(item.notes)))throw Error('九科進度格式不符。');
   if(key==='lex-nexus-collections-v1'&&!window.LEX_DISCOVER?.validCollection(item))throw Error('收藏與複習紀錄格式不符。');
   if(key==='lex-nexus-essay-practice-v1'&&!window.LEX_PRACTICE?.valid(item))throw Error('申論演練紀錄格式不符。');
   for(const field of ['done','answers','drafts','checks','familiar'])if(item[field]!==undefined&&!obj(item[field]))throw Error('作答或筆記格式不符。');
  }
  if(!data.books.every(W.validBook)||data.books.reduce((n,b)=>n+b.chapters.reduce((m,c)=>m+c.text.length,0),0)>30_000_000)throw Error('書籍資料超過支援範圍。');return data;
 }
 $('backupAll').onclick=async()=>{try{await backup($('includeBooks').checked);status('備份已下載。');}catch(e){status(e.message+' 可取消包含書籍後再下載學習紀錄。');}};
 $('restoreAll').onchange=async e=>{staged=null;$('confirmRestore').disabled=true;const f=e.target.files?.[0];if(!f)return;try{if(f.size>50_000_000)throw Error('備份檔需小於 50 MB。');staged=validate(JSON.parse(await f.text()));$('restorePreview').textContent=`將套用 ${Object.keys(staged.entries).length} 組學習紀錄、${staged.books.length} 本書籍。`; $('confirmRestore').disabled=false;status('已檢查格式，尚未套用。');}catch(err){status(err.message||'無法讀取備份。');}};
 $('confirmRestore').onclick=async()=>{if(!staged)return;const old={};let oldBooks=[];try{
  const safety=await backup(true,'LEX-NEXUS-還原前副本');oldBooks=safety.books;for(const key of Object.keys(staged.entries))old[key]=localStorage.getItem(key);
  for(const [key,value] of Object.entries(staged.entries))localStorage.setItem(key,value);
  await W.putMany(staged.books);
  status('備份已套用，重新開啟筆記或練習即可接續。');$('confirmRestore').disabled=true;staged=null;summary();
 }catch(e){for(const [key,value] of Object.entries(old)){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{}}for(const b of oldBooks){try{await W.books('put',b);}catch{}}status('還原未完成：'+e.message+'。請保留剛下載的安全副本。');}};
 async function summary(){try{const n=W.keys.filter(k=>localStorage.getItem(k)!==null).length,books=await W.books();$('storageSummary').textContent=`本機已有 ${n} 組紀錄、${books.length} 本書籍。`;}catch(e){status(e.message);}}summary();
})();
