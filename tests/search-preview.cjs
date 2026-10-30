const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../site/search-preview.html'),'utf8');
const match=html.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(match,'search page inline module missing');
const script=match[1].replace(/\bload\(\);\s*$/,'');
const nodes=new Map();
function element(name){
  if(!nodes.has(name))nodes.set(name,{
    value:'',textContent:'',hidden:false,disabled:false,children:[],
    get options(){return this.children},
    addEventListener(type,handler){this["on"+type]=handler},focus(){this.focused=true},setAttribute(){},querySelector(){return null},
    replaceChildren(...items){this.children=items},
    append(...items){this.children.push(...items)}
  });
  return nodes.get(name);
}
const document={
  querySelector:element,
  createElement:tag=>({
    tagName:tag,textContent:'',children:[],append(...items){this.children.push(...items)}
  })
};
const history={lastURL:"",replaceState(_state,_title,url){this.lastURL=url}};
const context={
  document,window:{},history,location:{pathname:'/search-preview.html',href:'https://example.test/search-preview.html'},
  URL,URLSearchParams,AbortController,setTimeout,clearTimeout,
  matchMedia:()=>({matches:false}),Option:class {},fetch:async()=>{throw Error('not expected')}
};
vm.runInNewContext(script+'\nwindow.previewTest={queryGroups,snippet,search,load,changePage,pageFromUrl,getPage:()=>page,subjectLabel:key=>label(subjectNames,key),kindLabel:key=>label(kindNames,key),setRecords(value){records=value;ready=true},getHits(){return hits},setQuery(value){input.value=value}};',context);
const api=context.window.previewTest;
const normalize=value=>String(value).normalize('NFKC').toLocaleLowerCase('zh-TW')
 .replace(/第\s*(\d+)\s*-\s*(\d+)\s*條/g,'第$1條之$2')
 .replace(/第\s*(\d+)\s*條\s*之\s*(\d+)/g,'第$1條之$2')
 .replace(/第\s*(\d+)\s*條/g,'第$1條')
 .replace(/§\s*(\d+)\s*(?:-\s*(\d+)|之\s*(\d+))/g,(_,n,a,b)=>'§'+n+'-'+(a||b))
 .replace(/§\s*(\d+)/g,'§$1')
 .replace(/\s+/g,' ').trim();
const rows=[
 {id:'full',title:'刑法總則故意',body:'前言'.repeat(120)+'刑法總則：故意',subject:'criminalgeneral',type:'note',href:'index.html'},
 {id:'short',title:'刑總小考',body:'故意案例',subject:'criminalgeneral',type:'note',href:'index.html'},
 {id:'civil',title:'民法總則',body:'物權第 ７５７ 條',subject:'civilgeneral',type:'note',href:'index.html'}
].map(row=>({...row,_title:normalize(row.title),_body:normalize(row.body),
 _subject:normalize(row.subject==='criminalgeneral'?'刑法總則':'民法總則')}));
api.setRecords(rows);
api.setQuery('刑總');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['full','short'],'abbreviation matches both full and short names');
api.setQuery('刑總 故意');api.search();
assert.equal(api.getHits().length,2,'multiple terms retain AND semantics');
api.setQuery('刑總 物權');api.search();
assert.equal(api.getHits().length,0,'AND terms must not match different records');
api.setQuery('第７５７條');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['civil'],'spaced legal article is normalized');
api.setQuery('§７５７');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['civil'],'section symbol finds equivalent article reference');
api.setQuery('民法第 ７５７ 條');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['civil'],'compound statute reference uses AND semantics');
assert.equal(api.queryGroups('民法第 ７５７ 條').length,2,'compound statute splits into two AND terms');
api.setQuery('刑法第 ７５７ 條');api.search();
assert.equal(api.getHits().length,0,'unrelated statute name cannot match by article number alone');
api.setQuery('７５７');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['civil'],'NFKC digits still match');
assert.ok(api.snippet(rows[0],api.queryGroups('刑總')).includes('刑法總則'),'excerpt includes the actual full-name hit');
assert.ok(api.snippet(rows[2],api.queryGroups('第757條')).includes('第757條'),'excerpt keeps the normalized legal citation visible');
const inserted={id:'inserted',title:'民法物權登記',body:'民法第 759-1 條：善意第三人信賴登記',subject:'property',type:'note',href:'index.html',
  _title:normalize('民法物權登記'),_body:normalize('民法第 759-1 條：善意第三人信賴登記'),_subject:normalize('物權')};
api.setRecords([...rows,inserted]);
for(const spelling of ['第759條之1','§759-1','§ ７５９－１','民法第759條之1','民法第759-1條']){
  api.setQuery(spelling);api.search();
  assert.deepEqual(Array.from(api.getHits(),x=>x.id),['inserted'],'inserted article lookup failed: '+spelling);
}
// Common shorthand without 第/§ must resolve to the same *exact* inserted article.
for(const spelling of ['759-1','759之1','759條之1','７５９－１']){
  api.setQuery(spelling);api.search();
  assert.deepEqual(Array.from(api.getHits(),x=>x.id),['inserted'],'bare inserted article lookup failed: '+spelling);
}
api.setQuery('刑法第759條之1');api.search();
assert.equal(api.getHits().length,0,'compound inserted article must still match the statute name');
assert.ok(api.snippet(inserted,api.queryGroups('§759-1')).includes('第759條之1'),'excerpt normalizes inserted article spelling');
// Prefix matches are incorrect for statute articles, even when the
// requested number appears at the beginning of a longer inserted article.
const nextInserted={...inserted,id:'next-inserted',body:'民法第759條之10：另一增訂條文',
  _body:normalize('民法第759條之10：另一增訂條文')};
api.setRecords([inserted,nextInserted]);
for(const spelling of ['第759條','§759']){
  api.setQuery(spelling);api.search();
  assert.equal(api.getHits().length,0,'base article must not match inserted articles: '+spelling);
}
for(const spelling of ['第759條之1','§759-1','759-1','759之1']){
  api.setQuery(spelling);api.search();
  assert.deepEqual(Array.from(api.getHits(),x=>x.id),['inserted'],'article suffix must not match a longer suffix: '+spelling);
}
api.setQuery('第759條之10');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['next-inserted']);
const excerpt={body:'第759條之10 '+('背景'.repeat(120))+' 第759條之1：應顯示此處'};
assert.ok(api.snippet(excerpt,api.queryGroups('第759條之1')).includes('應顯示此處'),'excerpt must highlight the exact article rather than a prefix');
// Teacher notes frequently cite an inserted article as "民法759-1" with
// neither 第...條 nor §. The index must match that text, but not longer
// article suffixes or unrelated numeric prefixes.
const bareCitationRows=[
  ['raw-exact','民法759-1：登記推定'],
  ['raw-next','民法759-10：其他條文'],
  ['raw-prefix','民法1759-1：不同條號'],
  ['raw-hyphen','民法759-1-2：非單一條號']
].map(([id,body])=>({id,title:'民法物權案例',body,subject:'property',type:'note',href:'index.html',
  _title:normalize('民法物權案例'),_body:normalize(body),_subject:normalize('物權')}));
api.setRecords(bareCitationRows);
for(const spelling of ['759-1','§759-1','第759條之1','民法第759條之1']){
  api.setQuery(spelling);api.search();
  assert.deepEqual(Array.from(api.getHits(),x=>x.id),['raw-exact'],
    'bare source citations must match exact inserted article: '+spelling);
}
assert.ok(api.snippet(bareCitationRows[0],api.queryGroups('759-1')).includes('759-1'),
  'snippet must locate the exact bare citation');
// Compound shorthand citations must match a fully written article while
// preserving the statute name as a separate AND term.
const fullCitation={id:'full-citation',title:'登記推定與善意信賴',
  body:'民法第759條之1：不動產登記的推定與信賴保護',subject:'property',type:'note',href:'index.html',
  _title:normalize('登記推定與善意信賴'),
  _body:normalize('民法第759條之1：不動產登記的推定與信賴保護'),_subject:normalize('物權')};
api.setRecords([fullCitation]);
for(const spelling of ['民法759-1','民法759之1','民法759條之1','民法７５９－１']){
  assert.equal(api.queryGroups(spelling).length,2,'compound shorthand must be an AND query: '+spelling);
  api.setQuery(spelling);api.search();
  assert.deepEqual(Array.from(api.getHits(),x=>x.id),['full-citation'],'compound shorthand failed: '+spelling);
}
api.setQuery('刑法759-1');api.search();
assert.equal(api.getHits().length,0,'shorthand must not match a different statute');
api.setRecords(rows);

assert.equal(api.queryGroups('刑總').length,1,'alias variants count as one query term');
// All terms must count. Previously the ninth term was silently ignored,
// returning documents that did not satisfy the user's AND query.
const nineTerms='刑總 故意 故意 故意 故意 故意 故意 故意 不存在';
assert.equal(api.queryGroups(nineTerms).length,9,'all nine search terms are retained');
api.setQuery(nineTerms);api.search();
assert.equal(api.getHits().length,0,'the ninth unmatched term must exclude results');
api.setQuery('刑總 故意 故意 故意 故意 故意 故意 故意 故意');api.search();
assert.equal(api.getHits().length,2,'nine matching terms still return both records');
// The live corpus includes Legal English and Photonics, not only the original nine law courses.
const english={id:'english',title:'Court structure',body:'Jurisdiction and appeal',subject:'legalenglish',type:'note',href:'legal-english.html',_title:normalize('Court structure'),_body:normalize('Jurisdiction and appeal'),_subject:normalize('法學英文')};
const photonics={id:'photonics',title:'Solar cells',body:'Photovoltaic conversion',subject:'photonics',type:'note',href:'photonics.html',_title:normalize('Solar cells'),_body:normalize('Photovoltaic conversion'),_subject:normalize('光電科技')};
// The public novel index uses subject:"". Its filter must not collide with
// the empty string used by the "all subjects" select option.
const uncategorized={id:'uncategorized',title:'小說第一章',body:'故事正文',subject:'',type:'novel',href:'reading.html',
 _title:normalize('小說第一章'),_body:normalize('故事正文'),_subject:normalize('小說／未分類')};
api.setRecords([...rows,english,photonics,uncategorized]);
nodes.get('#subject').value='__uncategorized__';
api.setQuery('');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['uncategorized'],
  'uncategorized subject filter must exclude classified records');
assert.match(history.lastURL,/subject=__uncategorized__/,
  'uncategorized selection must be shareable in the URL');
nodes.get('#kind').value='note';api.search();
assert.equal(api.getHits().length,0,'subject and type filters must combine');
nodes.get('#kind').value='novel';api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['uncategorized'],
  'novel type and uncategorized subject must combine');
nodes.get('#subject').value='';nodes.get('#kind').value='';
api.setRecords([...rows,english,photonics]);
api.setQuery('法英');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['english'],'法英 must find the Legal English course via subject label');
api.setQuery('法英 jurisdiction');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['english'],'abbreviation + English term must retain AND semantics');
api.setQuery('法英 不存在');api.search();
assert.equal(api.getHits().length,0,'unmatched terms must still exclude Legal English records');
assert.equal(api.subjectLabel('legalenglish'),'法學英文','Legal English filter label must be localized');
assert.equal(api.subjectLabel('photonics'),'光電科技','Photonics filter label must be localized');
assert.equal(api.kindLabel('teacher'),'自編案例','public teacher-type entries must be labelled as authored cases, not original teacher materials');
assert.match(html,/教師限制閱覽原題不列入公開搜尋/,'public search page must clarify source-only teacher questions are excluded');
// Empty results should explain the state and offer a one-action mobile-friendly reset.
api.setQuery('不存在的組合');api.search();
assert.equal(api.getHits().length,0);
assert.ok(nodes.get('#results').children[0].textContent.includes('找不到符合條件'),'empty search must be explained');
assert.equal(nodes.get('#reset').hidden,false,'reset appears when a filter is active');
nodes.get('#reset').onclick();
assert.equal(api.getHits().length,5,'reset restores all records without refetching the index');
assert.equal(nodes.get('#reset').hidden,true,'reset hides after clearing all filters');
assert.equal(nodes.get('#query').focused,true,'keyboard focus returns to search input');
// Shared search links should reopen the same result page, while a new query
// resets to page one. Invalid page parameters must not create out-of-range state.
const many=Array.from({length:45},(_,i)=>({...rows[0],id:'page-'+i,title:'刑總範例'+i,_title:normalize('刑總範例'+i)}));
api.setRecords(many);api.setQuery('');api.search();
api.changePage(1);
assert.equal(api.getPage(),1,'next button advances to second page');
assert.match(nodes.get('#status').textContent,/目前顯示第 21–40 筆/,'screen-reader status announces the visible result range');
assert.match(history.lastURL,/\bpage=2\b/,'shareable URL records page two');
api.changePage(1);
assert.equal(api.getPage(),2,'third page remains reachable');
assert.match(nodes.get('#status').textContent,/目前顯示第 41–45 筆/,'last page announces its actual range');
assert.match(history.lastURL,/\bpage=3\b/);
api.changePage(1);
assert.equal(api.getPage(),2,'page navigation clamps at the final page');
assert.equal(api.pageFromUrl(new URLSearchParams('page=3')),2,'URL page restores zero-based offset');
for(const invalid of ['0','-1','abc','10000','2.5']){
  assert.equal(api.pageFromUrl(new URLSearchParams('page='+invalid)),0,'invalid page is ignored: '+invalid);
}
api.setQuery('不存在');api.search();
assert.equal(api.getPage(),0,'new search resets to first page');
assert.doesNotMatch(history.lastURL,/page=/,'reset query drops stale page from URL');
api.setRecords(rows);

// A corrupted/partial live index must show an error and a retry option,
 // rather than claiming that a tiny subset is the full production corpus.
context.fetch=async()=>({ok:true,json:async()=>({version:1,items:rows})});
api.load().then(async()=>{
  assert.match(nodes.get('#status').textContent,/資料載入失敗.*資料庫筆數低於完整基準/);
  assert.equal(nodes.get('#retry').hidden,false,'partial corpus offers retry');
  // Even when 3,602 valid rows remain, one malformed or duplicate row
  // means the original production index was not loaded in full.
  const complete=Array.from({length:3602},(_,i)=>({...rows[0],id:'complete-'+i}));
  const badRows=[...complete,{...rows[0],id:'complete-0'}];
  context.fetch=async()=>({ok:true,json:async()=>({version:1,items:badRows})});
  await api.load();
  assert.match(nodes.get('#status').textContent,/資料載入失敗.*無效或重複記錄/,
    'duplicate row must not be silently dropped just because minimum remains');
  assert.equal(nodes.get('#retry').hidden,false,'corrupt corpus offers retry');
  context.fetch=async()=>({ok:true,json:async()=>({version:1,items:[...complete,{...rows[0],id:'blank-title',title:'   '}]})});
  await api.load();
  assert.match(nodes.get('#status').textContent,/資料載入失敗.*無效或重複記錄/,
    'blank title must not be counted as a valid searchable record');
  assert.equal(nodes.get('#retry').hidden,false);
  // A retry can finish before the original request. Late success or failure
  // must not replace the newer complete index or show a stale error.
  let finishOld;
  const oldResponse=new Promise(resolve=>{finishOld=resolve});
  context.fetch=async()=>oldResponse;
  const staleSuccess=api.load();
  context.fetch=async()=>({ok:true,json:async()=>({version:1,items:complete})});
  await api.load();
  assert.match(nodes.get('#status').textContent,/3602 筆資料已載入/);
  assert.equal(nodes.get('#retry').hidden,true);
  finishOld({ok:true,json:async()=>({version:1,items:rows})});
  await staleSuccess;
  assert.match(nodes.get('#status').textContent,/3602 筆資料已載入/,
    'late partial response must not overwrite successful retry');
  assert.equal(nodes.get('#retry').hidden,true);

  let rejectOld;
  const oldFailure=new Promise((_resolve,reject)=>{rejectOld=reject});
  context.fetch=async()=>oldFailure;
  const staleFailure=api.load();
  context.fetch=async()=>({ok:true,json:async()=>({version:1,items:complete})});
  await api.load();
  rejectOld(new Error('stale connection failed'));
  await staleFailure;
  assert.match(nodes.get('#status').textContent,/3602 筆資料已載入/,
    'late network error must not hide the valid index');
  assert.equal(nodes.get('#retry').hidden,true);
  // A shared link restores its query and page when the user has not edited the form.
  context.location.search='?q=%E5%88%91%E7%B8%BD&page=2';
  nodes.get('#query').value='';
  context.fetch=async()=>({ok:true,json:async()=>({version:1,items:complete})});
  await api.load();
  assert.equal(nodes.get('#query').value,'刑總','untouched shared link restores its search');
  assert.equal(api.getPage(),1,'untouched shared link restores its page');
  // Typing while an initial/retry fetch is pending must not be overwritten
  // by the old URL parameters when the response eventually arrives.
  let finishDraft;
  const draftResponse=new Promise(resolve=>{finishDraft=resolve});
  context.fetch=async()=>draftResponse;
  const draftLoad=api.load();
  nodes.get('#query').value='物權';
  nodes.get('#query').oninput();
  finishDraft({ok:true,json:async()=>({version:1,items:complete})});
  await draftLoad;
  assert.equal(nodes.get('#query').value,'物權','pending user input survives completed fetch');
  assert.equal(api.getPage(),0,'edited search starts at first page');
  assert.match(history.lastURL,/q=%E7%89%A9%E6%AC%8A/,"shared URL follows the user's new query");
  assert.doesNotMatch(history.lastURL,/page=/,'stale page is removed after editing during load');
  console.log('PASS: legal citations, AND semantics, atomic index guard, retry safety and pending-input restoration');
}).catch(error=>{console.error(error);process.exitCode=1});
