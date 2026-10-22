const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.resolve(__dirname,'../site');
const elements=new Map(),events={};function el(s){if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',value:'',style:{},dataset:{},prepend(node){this.innerHTML=node.innerHTML+this.innerHTML},setAttribute(){},querySelectorAll(){return []},addEventListener(t,f){this[t]=f},scrollIntoView(){},focus(){this.focused=true},click(){},before(){},parentElement:{before(){}},classList:{toggle(){},remove(){}},dispatchEvent(e){for(const x of events[e.type]||[])x.f({target:this})}});return elements.get(s)}
const storage=new Map();const ctx=vm.createContext({console,document:{querySelector:el,createElement:()=>el('created'),body:el('body'),addEventListener(t,f,c){(events[t]??=[]).push({f,c:!!c})}},window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},setTimeout:()=>1,clearTimeout(){},confirm:()=>true,Blob,URL,Set,Date,history:{replaceState(){}},location:{hash:'',protocol:'file:',href:'file:///public-preview/index.html'},Event:class{constructor(type){this.type=type}}});
vm.runInContext(['config.js','data.js','statutes.js','app.js','enhanced.js','layout.js','reading-library.js','daily-snapshot.js','editorials.js','daily.js','navigation.js'].map(n=>fs.readFileSync(path.join(root,n),'utf8')).join('\n'),ctx);const run=s=>vm.runInContext(s,ctx);
function click(dataset,id=''){const e={target:{closest:()=>({dataset,id})}};for(const x of [...events.click].sort((a,b)=>Number(b.c)-Number(a.c)))x.f(e)}
assert.equal(run('page'),'dashboard');assert.ok(el('#content').innerHTML.includes('推薦先從這裡'));click({workspace:'dashboard'});assert.ok(el('#content').innerHTML.includes('九科課程'));
run(`COURSES.forEach(c=>{course=c;['chapters','laws','essays','quiz','wrong','progress','materials','dashboard','allwrong'].forEach(p=>{page=p;render()})})`);
click({openCourse:'crime',openLevel:'0'});assert.equal(run('page'),'essays');assert.equal(run('course.id'),'crime');
click({page:'quiz'});click({answer:'0:0'});assert.equal(run('state.answers[id(0)].wrong'),true);click({retake:'0'});assert.equal(run('state.retake[id(0)]'),true);assert.ok(!el('#content').innerHTML.includes('正確答案 B'));
click({answer:'0:1'});assert.equal(run('state.retake[id(0)]'),undefined);assert.equal(run('state.answers[id(0)].choice'),1);assert.equal(run('state.answers[id(0)].count'),2);assert.equal(run('state.answers[id(0)].wrong'),true);click({allwrong:'true'});assert.ok(el('#content').innerHTML.includes('共有 1 題'));
click({openWrong:'crime',openLevel:'0'});assert.equal(run('page'),'wrong');assert.equal(run('state.retake[id(0)]'),true);click({answer:'0:1'});click({clearwrong:'0'});assert.equal(run('totalStats().wrong'),0);
click({openCourse:'debt',openLevel:'2'});click({dashboard:'true'});click({resume:'true'});assert.equal(run('course.id'),'debt');assert.equal(run('level'),2);assert.equal(run('page'),'essays');
click({dashboard:'true'});run(`query='善意';render()`);assert.ok(el('#content').innerHTML.includes('動產善意取得與遺失物'));run(`query='找不到XYZ';render()`);assert.ok(el('#content').innerHTML.includes('沒有符合'));
run(`location.hash='#/tax/essays/2';route()`);assert.equal(run('course.id'),'tax');assert.equal(run('page'),'essays');assert.equal(run('level'),2);
run(`location.hash='#/wrong/missing/999';route()`);assert.equal(run('page'),'dashboard');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const f of html.matchAll(/(?:src|href)="([^"#:]+\.(?:js|css))"/g))assert.ok(fs.existsSync(path.join(root,f[1])),f[1]);
assert.equal((el('#mainNav').innerHTML.match(/data-workspace=/g)||[]).length,2);assert.equal((el('#mainNav').innerHTML.match(/navigation-primary/g)||[]).length,3);click({workspace:'courses'});assert.equal(run('page'),'chapters');assert.equal(el('body').dataset.workspace,'courses');assert.equal((el('#tabs').innerHTML.match(/data-context=/g)||[]).length,2);click({workspace:'practice'});assert.equal(run('page'),'quiz');assert.equal((el('#tabs').innerHTML.match(/data-context=/g)||[]).length,3);click({context:'allwrong'});assert.equal(run('page'),'allwrong');assert.equal(el('#courseControl').hidden,true);click({workspace:'essays'});el('#courseSelector').change({target:{value:'family'}});assert.equal(run('course.id'),'family');assert.equal(run('page'),'essays');assert.equal(run('level'),0);click({workspace:'materials'});assert.equal(run('page'),'materials');assert.equal(el('#tabs').innerHTML,'');click({workspace:'dashboard'});assert.equal(run('page'),'dashboard');assert.equal(el('#courseControl').hidden,true);
console.log('PASS: 81 course/page renders; three main entries; contextual tabs; subject switching; dashboard; search; retry; wrong-review cycle; resume; routes; v1 data compatibility; local assets.');
assert.equal(run(`dailyPlan(Date.parse('2026-10-22T00:59:59Z')).editionDate`),'2026-10-21');
assert.equal(run(`dailyPlan(Date.parse('2026-10-22T01:00:00Z')).editionDate`),'2026-10-22');
assert.equal(run(`new Set(Array.from({length:27},(_,i)=>{const p=dailyPlan(DAILY_ANCHOR+i*86400000);return p.course.id+':'+p.index})).size`),27);
click({dailyOpen:'true'});assert.equal(run('page'),'daily');assert.ok(el('#content').innerHTML.includes('非人工審定'));
const k=run(`dailyPlan().course.id+'-'+dailyPlan().index`),oldCount=run(`state.answers[${JSON.stringify(k)}]?.count||0`);
click({dailyAnswer:String(run('(dailyPlan().topic.correct+1)%4'))});assert.equal(run(`state.answers[${JSON.stringify(k)}].wrong`),true);assert.equal(run(`state.answers[${JSON.stringify(k)}].count`),oldCount+1);
click({dailyRetry:'true'});assert.ok(!el('#content').innerHTML.includes('正確答案'));
click({dailyAnswer:String(run('dailyPlan().topic.correct'))});assert.ok(el('#content').innerHTML.includes('本次答對'));
click({dailyEssay:'true'});assert.equal(run('page'),'essays');assert.equal(run('course.id'),run('dailyPlan().course.id'));assert.equal(run('level'),run('dailyPlan().index'));
run(`location.hash='#/daily';route()`);assert.equal(run('page'),'daily');
click({},'shareSite');assert.ok(el('#toast').textContent.includes('本機路徑'));
ctx.AbortController=AbortController;
(async()=>{const payload=JSON.parse(run(`JSON.stringify({...window.LAW_DAILY_SNAPSHOT,editionDate:dailyPlan().editionDate,generatedAt:new Date().toISOString(),newsUpdatedAt:new Date().toISOString(),newsState:'ok',news:[{title:'<img src=x onerror=alert(1)>',url:'https://www.ey.gov.tw/test-fixture-only',source:'測試來源（非真實新聞）',publishedAt:new Date().toISOString()}]})`));ctx.fetch=async()=>({ok:true,text:async()=>JSON.stringify(payload)});await run('refreshDaily()');assert.equal(run('dailyFeed.news.length'),1);assert.ok(el('#content').innerHTML.includes('&lt;img'));assert.ok(!el('#content').innerHTML.includes('<img src=x'));
const bad={...payload,news:[{...payload.news[0],url:'javascript:alert(1)'}]};ctx.fetch=async()=>({ok:true,text:async()=>JSON.stringify(bad)});await run('refreshDaily()');assert.equal(run('dailyFeed.news[0].url'),'https://www.ey.gov.tw/test-fixture-only');assert.ok(run('dailyError.length')>0);
ctx.fetch=async()=>{throw Error('offline test')};await run('refreshDaily()');assert.equal(run('dailyFeed.news.length'),1);assert.ok(run('feedStateText()').includes('保留'));
console.log('PASS: daily 09:00 rollover, 27-day cycle, reading, daily quiz persistence, retry, essay routing, local-file sharing guard, feed validation, XSS escaping, source failure retention.');})().catch(e=>{console.error(e);process.exitCode=1});




const savedFeed=run('dailyFeed');
const ai={id:'original-fixture',date:'2026-10-22',kind:'ai_original',title:'<script>fixture</script>',intro:'測試導入',reflection:'反思',sourceKeys:[],verification:{status:'automated_pass',humanReviewed:false},sources:[{id:'S1',title:'原文一',url:'https://www.ey.gov.tw/fixture1'},{id:'S2',title:'原文二',url:'https://www.ey.gov.tw/fixture2'}],sections:Array.from({length:7},()=>({heading:'測試段落',text:'<img src=x onerror=bad>',sourceIds:['S1']})),claims:[{claim:'測試主張',evidence:[{quote:'測試引文',sourceId:'S1'}]}]};
ctx.fixtureArticle=ai;
run('validateEditorial(fixtureArticle);dailyFeed={...dailyFeed,editorial:{status:"rejected",article:fixtureArticle}};page="daily";render()');
assert.ok(el('#content').innerHTML.includes('非人工審定'));
assert.ok(el('#content').innerHTML.includes('未通過檢查'));
assert.ok(el('#content').innerHTML.includes('&lt;script&gt;fixture'));
assert.ok(!el('#content').innerHTML.includes('<img src=x'));
assert.ok(el('#content').innerHTML.includes('查看事實主張與引用證據'));
ai.sources[0].url='javascript:alert(1)';assert.throws(()=>run('validateEditorial(fixtureArticle)'));
run('dailyFeed=null');assert.ok(run('currentReading(dailyPlan()).sourceKeys.length')>0);
ctx.restoreFeed=savedFeed;run('dailyFeed=restoreFeed');
console.log('PASS: AI disclosure, rejection status, evidence links, unsafe-source rejection, escaped AI output, library fallback.');

run('dailyFeed=restoreFeed;selectedEditorialDate="2026-10-23";page="daily";render()');
assert.ok(el('#content').innerHTML.includes('三級虛構案例'));
assert.ok(el('#content').innerHTML.includes('課程補充'));
assert.ok(el('#content').innerHTML.includes('歷史原創導讀'));
assert.ok(!el('#content').innerHTML.includes('第二次模型複核及近'));
click({editorialDate:'latest'});assert.equal(run('selectedEditorialDate'),'');
console.log('PASS: committed original, archive selection, course supplements, truthful agent review disclosure.');

require('./toolkit.cjs');

assert.equal(run("COURSES.length"),9);for(const c of ["criminalgeneral","civilgeneral","constitution"]){run(`location.hash="#/${c}/essays/2";route()`);assert.equal(run("course.id"),c);assert.equal(run("level"),2);assert.ok(run("STATUTES[course.id].length")===3);}
console.log("PASS: three added subjects, direct routes, advanced essays and statute excerpts; original IDs preserved.");

run("page='daily';render()");

require('./essentials.cjs');
