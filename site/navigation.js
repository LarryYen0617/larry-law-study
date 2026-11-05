// A small navigation layer; existing controllers, IDs and storage remain unchanged.
const navigationRender=render;
render=function(){
 navigationRender();
 const home=page==='dashboard'&&!query,practice=['quiz','essays','wrong','allwrong'].includes(page);
 $('#mainNav').innerHTML=`<a class="navigation-primary" href="essentials.html?v=20261024-edition14"><span aria-hidden="true">01</span>看重點</a><button class="navigation-primary ${practice?'selected':''}" data-workspace="practice" ${practice?'aria-current="page"':''}><span aria-hidden="true">02</span>做練習</button><button class="navigation-primary ${page==='progress'?'selected':''}" data-workspace="progress" ${page==='progress'?'aria-current="page"':''}><span aria-hidden="true">03</span>看進度</button>`;
 // Published chapter notes and Legal English live under site/class-notes (Pages deploys site/ only).
 $('#mainNav').innerHTML += '<a class="navigation-primary" href="class-notes/study-hub.html"><span aria-hidden="true">04</span>教材章節</a><a class="navigation-primary" href="class-notes/legal-english.html"><span aria-hidden="true">05</span>法學英文</a>';

 if(home){document.body.dataset.workspace='home';$('#crumb').textContent='首頁';$('#workspaceLabel').textContent='';$('#tabs').innerHTML='';$('#stats').innerHTML='';$('#courseControl').hidden=true;}

 if(practice){$('#workspaceLabel').textContent='做練習';$('#tabs').innerHTML+=`<a class="teacher-practice-link" href="essentials.html?v=20261024-edition14#teacher">老師題型 →</a>`;}
 if(page==='progress'){document.body.dataset.workspace='progress';$('#title').textContent='我的學習進度';$('#intro').textContent='標記、作答與自評都在這裡，接著完成尚未掌握的部分。';$('#workspaceLabel').textContent='看進度';$('#stats').innerHTML='';$('#tabs').innerHTML='';}
};
render();

const auditedNavigationRender=render;
render=function(){auditedNavigationRender();if(page==='progress'){try{const personal=JSON.parse(localStorage.getItem('lex-nexus-study-v1')||'{}'),archive=JSON.parse(localStorage.getItem('lex-nexus-library-v1')||'{}');const familiar=Object.values(personal.familiar||{}).filter(Boolean).length,drafts=Object.values(personal.drafts||{}).filter(x=>typeof x==='string'&&x.trim()).length,answers=Object.values(archive.answers||{}).filter(Number.isInteger).length;$('#content').innerHTML+=`<article class="card"><h2>筆記與整合題庫的紀錄</h2><p>已標記熟悉 ${familiar} 則 · 已寫補充／草稿 ${drafts} 則 · 整合題庫已選答 ${answers} 題</p><a href="library.html#questions">回到整合題庫 →</a></article>`;}catch{}}};
render();
