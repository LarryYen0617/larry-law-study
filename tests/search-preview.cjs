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
const history={replaceState(){}};
const context={
  document,window:{},history,location:{pathname:'/search-preview.html',href:'https://example.test/search-preview.html'},
  URL,URLSearchParams,AbortController,setTimeout,clearTimeout,
  matchMedia:()=>({matches:false}),Option:class {},fetch:async()=>{throw Error('not expected')}
};
vm.runInNewContext(script+'\nwindow.previewTest={queryGroups,snippet,search,load,subjectLabel:key=>label(subjectNames,key),setRecords(value){records=value;ready=true},getHits(){return hits},setQuery(value){input.value=value}};',context);
const api=context.window.previewTest;
const normalize=value=>String(value).normalize('NFKC').toLocaleLowerCase('zh-TW').replace(/\s+/g,' ').trim();
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
api.setRecords([...rows,english,photonics]);
api.setQuery('法英');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['english'],'法英 must find the Legal English course via subject label');
api.setQuery('法英 jurisdiction');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['english'],'abbreviation + English term must retain AND semantics');
api.setQuery('法英 不存在');api.search();
assert.equal(api.getHits().length,0,'unmatched terms must still exclude Legal English records');
assert.equal(api.subjectLabel('legalenglish'),'法學英文','Legal English filter label must be localized');
assert.equal(api.subjectLabel('photonics'),'光電科技','Photonics filter label must be localized');
// Empty results should explain the state and offer a one-action mobile-friendly reset.
api.setQuery('不存在的組合');api.search();
assert.equal(api.getHits().length,0);
assert.ok(nodes.get('#results').children[0].textContent.includes('找不到符合條件'),'empty search must be explained');
assert.equal(nodes.get('#reset').hidden,false,'reset appears when a filter is active');
nodes.get('#reset').onclick();
assert.equal(api.getHits().length,5,'reset restores all records without refetching the index');
assert.equal(nodes.get('#reset').hidden,true,'reset hides after clearing all filters');
assert.equal(nodes.get('#query').focused,true,'keyboard focus returns to search input');
// A corrupted/partial live index must show an error and a retry option,
 // rather than claiming that a tiny subset is the full production corpus.
context.fetch=async()=>({ok:true,json:async()=>({version:1,items:rows})});
api.load().then(()=>{
  assert.match(nodes.get('#status').textContent,/資料載入失敗.*資料庫筆數低於完整基準/);
  assert.equal(nodes.get('#retry').hidden,false,'partial corpus offers retry');
  console.log('PASS: legal citations, AND semantics, aliases, and partial-corpus guard');
}).catch(error=>{console.error(error);process.exitCode=1});
