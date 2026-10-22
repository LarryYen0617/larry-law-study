// 固定入口與情境導覽；內容、練習及儲存仍沿用既有控制器。
const contentRender=render;
const workspaceEntries=[['dashboard','總覽','學習總覽','⌂'],['courses','課程','六科課程','▤'],['practice','題庫','題庫練習','◇'],['essays','申論','申論工作台','✎'],['materials','教材','教材管理','▣']];
function activeWorkspace(){if(page==='dashboard'||page==='progress')return 'dashboard';if(page==='quiz'||page==='wrong'||page==='allwrong')return 'practice';if(page==='essays')return 'essays';if(page==='materials')return 'materials';return 'courses';}
function tabsForWorkspace(workspace){if(workspace==='courses')return [['chapters','章節重點'],['laws','法條索引']];if(workspace==='practice')return [['quiz','本科練習'],['wrong','本科錯題'],['allwrong','跨科錯題']];if(workspace==='dashboard')return [['dashboard','學習總覽'],['progress','跨科進度']];return [];}
render=function(){contentRender();const active=activeWorkspace();document.body.dataset.workspace=active;
$('#mainNav').innerHTML=workspaceEntries.map(([key,short,label,icon])=>`<button data-workspace="${key}" class="${active===key?'selected':''}" aria-current="${active===key?'page':'false'}"><span class="nav-icon" aria-hidden="true">${icon}</span><span class="nav-desktop">${label}</span><span class="nav-mobile">${short}</span></button>`).join('');
const selector=$('#courseSelector');selector.value=course.id;$('#courseControl').hidden=active==='dashboard'||page==='allwrong';
$('#tabs').innerHTML=tabsForWorkspace(active).map(([key,label])=>`<button data-context="${key}" class="${key===page?'active':''}" aria-pressed="${key===page}">${label}</button>`).join('');
$('#workspaceLabel').textContent=workspaceEntries.find(x=>x[0]===active)[2];$('#crumb').textContent=active==='dashboard'?'我的學習':course.name;
if(active==='courses'){$('#title').textContent=course.name;$('#intro').textContent='先理解概念，再核對條文，接著練習。';}
if(active==='essays'){$('#title').textContent=course.name+'・申論工作台';$('#intro').textContent='選擇難度，先寫答案，再看擬答與自評。';}
if(active==='practice'){$('#title').textContent=page==='allwrong'?'跨科錯題本':course.name+'・題庫練習';$('#intro').textContent='作答、檢查理由、訂正，再練一次。';}
if(active==='materials'){$('#title').textContent=course.name+'・教材管理';$('#intro').textContent='保留教材原文，逐筆記錄考試範圍的證據。';}
$('#search').placeholder=page==='dashboard'||page==='allwrong'?'搜尋六科內容':'搜尋本科內容';
};
document.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;const menu=$('.utilities');if(menu&&button.closest?.('.utilities'))menu.open=false;const target=button.dataset.workspace||button.dataset.context;if(!target)return;const pages={dashboard:'dashboard',courses:'chapters',practice:'quiz',essays:'essays',materials:'materials'};page=pages[target]||target;query='';$('#search').value='';render();if(window.matchMedia&&window.matchMedia('(max-width:720px)').matches)$('#workspaceTop').scrollIntoView({behavior:'smooth',block:'start'});});
$('#courseSelector').addEventListener('change',e=>{const selected=COURSES.find(c=>c.id===e.target.value);if(!selected)return;course=selected;level=0;query='';$('#search').value='';render();});
render();
