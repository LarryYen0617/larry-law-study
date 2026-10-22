/* Shared, data-driven navigation. All destinations stay within this site. */
(()=>{
 const version='20261023-navigation7',subjects=['crime','family','debt','property','admin','tax','criminalgeneral','civilgeneral','constitution'];
 const groups=[
  ['學習總覽',[['home','學習首頁','index.html','#/dashboard'],['progress','學習進度','index.html','progress']]],
  ['閱讀與課程',[['notes','我的重點筆記','essentials.html',''],['archivenotes','舊版重點與解析','library.html','#notes'],['daily','每日導讀與消息','index.html','#/daily'],['chapters','課程章節','index.html','chapters'],['laws','法條索引','index.html','laws']]],
  ['題庫與申論',[['quiz','基礎選擇題','index.html','quiz'],['archive','完整舊版題庫','library.html','#questions'],['teacher','已校核老師題型','essentials.html','#teacher'],['originals','課堂原題與原附擬答','library.html','#teacher'],['essays','三級申論練習','index.html','essays'],['wrong','跨科錯題本','index.html','#/allwrong'],['method','申論框架與草稿','study-toolkit.html','#method']]],
  ['教材與工具',[['materials','個人教材與考試範圍','index.html','materials'],['coverage','教材完整度與校訂','coverage.html',''],['sources','原始教材盤點','library.html','#sources'],['official','官方資料與法源','study-toolkit.html','#sources'],['help','備份與使用說明','help.html','']]]
 ];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function destination(file,target,subject='crime',current=''){
  const id=subjects.includes(subject)?subject:'crime';let hash=target;
  if(target&&!target.startsWith('#'))hash=`#/${id}/${target}/0`;
  return (file==='index.html'&&current==='index.html'?'':`${file}?v=${version}`)+hash;
 }
 function resume(last){return last&&subjects.includes(last.subject)&&/^personal-[a-z0-9-]+$/.test(last.chapter)?`essentials.html?v=${version}&subject=${last.subject}#${last.chapter}`:null;}
 function markup(ctx={}){
  const last=resume(ctx.last);
  return `<div class="side-intro"><span>WORKSPACE</span><p>學習導覽</p></div>${last?`<a class="sidebar-resume" href="${esc(last)}"><small>接續上次閱讀 →</small><span>${esc(ctx.last.title||'我的重點筆記')}</span></a>`:''}${groups.map(([label,items])=>`<section class="sidebar-group"><h2>${label}</h2>${items.map(([id,label,file,target])=>`<a class="sidebar-link" data-nav-id="${id}" href="${esc(destination(file,target,ctx.subject,ctx.file))}" ${ctx.active===id?'aria-current="page"':''}><span class="sidebar-marker" aria-hidden="true"></span>${label}</a>`).join('')}</section>`).join('')}<p class="sidebar-local">個人筆記與紀錄保存在此瀏覽器<br>換裝置前請先備份。</p>`;
 }
 window.LEX_NAVIGATION={groups,destination,resume,markup,version};
})();
