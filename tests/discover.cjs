const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');const root=path.resolve(__dirname,'../site'),ctx={window:{},URL,Date};vm.runInNewContext(fs.readFileSync(path.join(root,'discover-core.js'),'utf8'),ctx);const C=ctx.window.LEX_DISCOVER,index=JSON.parse(fs.readFileSync(path.join(root,'search-index.json'),'utf8'));
assert(C.validIndex(index));assert.equal(index.items.length,new Set(index.items.map(x=>x.id)).size);
// Protect the historical 3,602-record corpus without rejecting legitimate new lessons and questions.
const floors={question:1803,novel:513,note:97,card:40,teacher:92,archive:1016,reading:14,lesson:27};
assert(index.items.length>=3602,'original search corpus truncated');
for(const [type,min] of Object.entries(floors))assert(index.items.filter(x=>x.type===type).length>=min,type+' corpus below historical baseline');
assert(C.validIndex({version:1,items:[...index.items,{...index.items[0],id:'regression:future-added-record'}]}),'future valid additions must not break index validation');
assert(C.search(index.items,{q:'意思表示',type:'note',subject:'civilgeneral'}).length>0);assert(C.search(index.items,{q:'刑總'}).every(x=>x.subject==='criminalgeneral'||(x.title+x.body).includes('刑法總則')));assert(C.search(index.items,{q:'臺中的清晨',type:'novel'})[0].href.endsWith('chapter=1'));assert.equal(C.search(index.items,{q:'不存在的關鍵字__123'}).length,0);assert.equal(C.search(index.items,{q:'意思表示 不存在的關鍵字__123'}).length,0);
for(const href of ['javascript:alert(1)','https://evil.test/index.html','//evil.test/reading.html','../library.html','settings.html'])assert(!C.safeHref(href),href);assert(!C.validIndex({version:1,items:[{...index.items[0],href:'javascript:alert(1)'}]}));assert(!C.validIndex({version:1,items:[index.items[0],index.items[0]]}));
assert.equal(C.today(new Date('2026-10-25T16:01:00Z')),'2026-10-26');assert.equal(C.dueDate('2026-12-31',1),'2027-01-01');assert(!C.validDate('2026-02-30'));
const id=index.items[0].id,r={id,addedOn:'2026-10-26',dueOn:'2026-10-26',stage:0};let s={version:1,items:{[id]:r}};assert(C.validCollection(s));let next=C.review(r,'2026-10-26');assert.equal(next.dueOn,'2026-10-27');assert.equal(next.stage,1);assert.equal(C.review(next,'2026-10-27').dueOn,'2026-10-30');assert.equal(C.review(next,'2026-10-27',true).stage,1);assert.equal(r.stage,0);
assert(!C.validCollection({version:1,items:{[id]:{...r,stage:-1}}}));assert(!C.validCollection({version:1,items:{[id]:{...r,dueOn:'2026-02-30'}}}));assert(C.validCollection({version:1,items:{'note:missing-in-new-index':{...r,id:'note:missing-in-new-index'}}}));let stored='keep';assert.throws(()=>C.persist({setItem(){throw Error('quota');}},s));assert.equal(stored,'keep');C.persist({setItem:(k,v)=>{assert.equal(k,C.key);stored=v;}},s);assert.equal(JSON.parse(stored).items[id].stage,0);
// NFKC expansion and full-width whitespace must not shift excerpt offsets.
const expanded='㍿'.repeat(120)+'關鍵字'+'結尾'.repeat(80);
assert(C.excerpt(expanded,'關鍵字').includes('關鍵字'),'excerpt should locate terms after NFKC expansion');
assert(C.excerpt('　'.repeat(80)+'刑法總則'+'後續'.repeat(80),'刑總').includes('刑法總則'),'search aliases should work in excerpts');
assert(C.excerpt('ＡＢＣ'.repeat(80)+'物權'+'結尾'.repeat(80),'物權').includes('物權'),'full-width characters should not misalign excerpts');
assert.equal(C.excerpt(null,'物權'),'');
 // All query words must participate in AND matching; abbreviations match both
 // abbreviated-only records and the corresponding full course name.
const fixture={id:'note:term-regression',type:'note',subject:'criminalgeneral',title:'刑總',body:'甲 乙 丙 丁 戊 己 庚 辛'};
assert.equal(C.search([fixture],{q:'甲 乙 丙 丁 戊 己 庚 辛 壬'}).length,0,'ninth term cannot be ignored');
assert.equal(C.search([fixture],{q:'甲 乙 丙 丁 戊 己 庚 辛'}).length,1);
assert.equal(C.search([fixture],{q:'刑總'}).length,1,'abbreviated-only title must match');
assert.equal(C.search([{...fixture,title:'其他',body:'刑法總則'}],{q:'刑總'}).length,1,'full course name must match abbreviation');
assert(C.excerpt('前文'.repeat(120)+'物權','刑總 物權').includes('物權'),'excerpt should locate a later body term');
// Legal English is a real course: its abbreviation must find entries even when only the subject names it.
const englishFixture={id:'note:legalenglish-regression',type:'note',subject:'legalenglish',title:'Court structure',body:'Jurisdiction and appeal'};
assert.equal(C.search([englishFixture],{q:'法英'}).length,1,'法英 should match 法學英文 subject');
assert.equal(C.search([englishFixture],{q:'法英 jurisdiction'}).length,1,'abbreviation and English body term must both match');
assert.equal(C.search([englishFixture],{q:'法英 不存在'}).length,0,'English abbreviation must retain AND semantics');

// End-to-end controller behavior without a browser: failed fetch, retry, save failure, and review mutation.
(async()=>{
 const nodes={},listeners={},saved=new Map();let fetchFail=true,quota=false;const node=id=>nodes[id]??={value:'',innerHTML:'',textContent:'',hidden:false,setAttribute(){},scrollIntoView(){}};
 const document={hidden:false,getElementById:node,querySelectorAll:()=>[],addEventListener:(type,fn)=>{(listeners[type]??=[]).push(fn);}};
 const location={hash:'#q='+encodeURIComponent('臺中的清晨')};const storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>{if(quota)throw Error('quota');saved.set(k,v);}};
 const context={window:{LEX_DISCOVER:C,addEventListener(){}},URLSearchParams,document,location,history:{replaceState(){}},localStorage:storage,fetch:async()=>{if(fetchFail)throw Error('offline');return {ok:true,json:async()=>index};},Date,console};vm.runInNewContext(fs.readFileSync(path.join(root,'discover.js'),'utf8'),context);await new Promise(r=>setImmediate(r));assert(node('discoverStatus').textContent.includes('無法載入'));assert(!node('retrySearch').hidden);fetchFail=false;await node('retrySearch').onclick();assert(node('discoverResults').innerHTML.includes('chapter=1'));
 // Paging must not rescan all 3,602 indexed records when search criteria are unchanged.
 const originalSearch=C.search;let searchCalls=0;
 C.search=(...args)=>{searchCalls++;return originalSearch(...args);};
 node('discoverQuery').value='';node('discoverForm').onsubmit({preventDefault(){}});
 assert(node('discoverResults').innerHTML.includes('discover-card'));
 const callsBeforePaging=searchCalls;
 node('discoverNext').onclick();assert.equal(searchCalls,callsBeforePaging,'pagination should reuse cached search results');
 C.search=originalSearch;
 const novel=index.items.find(x=>x.type==='novel'&&x.href.endsWith('chapter=1'));
 const click=dataset=>{for(const fn of listeners.click||[])fn({target:{closest:()=>({dataset})}});};quota=true;click({save:novel.id});assert(!saved.has(C.key));assert(node('collectionStatus').textContent.includes('未儲存'));quota=false;click({save:novel.id});assert.equal(JSON.parse(saved.get(C.key)).items[novel.id].stage,0);click({review:novel.id});assert.equal(JSON.parse(saved.get(C.key)).items[novel.id].stage,1);click({view:'due'});assert(node('discoverResults').innerHTML.includes('今天的複習已完成'));
 console.log('PASS: full search corpus, Chinese filters, safe links, Taipei dates, spaced review, invalid backups, quota handling, fetch retry and controller mutations.');
})().catch(e=>{console.error(e);process.exitCode=1;});
