// A small navigation layer; existing controllers, IDs and storage remain unchanged.
const navigationRender=render;
render=function(){
 navigationRender();
 const home=page==='dashboard'&&!query,practice=['quiz','essays','wrong','allwrong'].includes(page);
 $('#mainNav').innerHTML=`<a class="navigation-primary" href="essentials.html"><span aria-hidden="true">01</span>看重點</a><button class="navigation-primary ${practice?'selected':''}" data-workspace="practice" ${practice?'aria-current="page"':''}><span aria-hidden="true">02</span>做練習</button><button class="navigation-primary ${page==='progress'?'selected':''}" data-workspace="progress" ${page==='progress'?'aria-current="page"':''}><span aria-hidden="true">03</span>看進度</button>`;
 if(home){
 document.body.dataset.workspace='home';$('#title').textContent='今天，從哪一步開始？';$('#intro').textContent='第一次來，先點「看重點」，再選你要讀的科目。';$('#crumb').textContent='首頁';$('#workspaceLabel').textContent='';$('#tabs').innerHTML='';$('#stats').innerHTML='';$('#courseControl').hidden=true;
 $('#content').innerHTML=`<div class="home-grid"><a href="essentials.html" class="home-choice recommended"><span class="home-number">01 · 推薦先從這裡</span><h2>看重點</h2><p>選一科，讀概念、法條與易錯處。</p><span class="home-action">開啟純重點整理 →</span></a><article class="home-choice"><span class="home-number">02 · 讀完就試試</span><h2>做練習</h2><p>選擇題、申論與老師題型，分開練習。</p><button data-workspace="practice">開始練習 →</button></article><article class="home-choice"><span class="home-number">03 · 回看自己的累積</span><h2>看進度</h2><p>查看已掌握章節、作答與申論自評。</p><button data-workspace="progress">查看學習進度 →</button></article></div><p class="home-guide">學習順序：看重點 → 選科目 → 做練習。九科課程都保留在同一個網站。</p><details class="home-secondary"><summary>今日導讀與其他工具</summary><div class="home-secondary-links"><button data-daily-open="true">今日導讀與官方消息</button><a href="essentials.html#teacher">老師題型與自編擬答</a><a href="study-toolkit.html">官方法源與申論工具</a><a href="essentials.html#inventory">教材整合進度</a><button data-workspace="courses">原課程章節與法條</button><button data-workspace="materials">個人教材與範圍管理</button></div></details>`;
 }
 if(practice){$('#workspaceLabel').textContent='做練習';$('#tabs').innerHTML+=`<a class="teacher-practice-link" href="essentials.html#teacher">老師題型 →</a>`;}
 if(page==='progress'){document.body.dataset.workspace='progress';$('#title').textContent='我的學習進度';$('#intro').textContent='標記、作答與自評都在這裡，接著完成尚未掌握的部分。';$('#workspaceLabel').textContent='看進度';$('#stats').innerHTML='';$('#tabs').innerHTML='';}
};
render();
