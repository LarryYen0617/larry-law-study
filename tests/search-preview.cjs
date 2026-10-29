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
    addEventListener(){},setAttribute(){},querySelector(){return null},
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
vm.runInNewContext(script+'\nwindow.previewTest={queryGroups,snippet,search,setRecords(value){records=value;ready=true},getHits(){return hits},setQuery(value){input.value=value}};',context);
const api=context.window.previewTest;
const normalize=value=>String(value).normalize('NFKC').toLocaleLowerCase('zh-TW').replace(/\s+/g,' ').trim();
const rows=[
 {id:'full',title:'刑法總則故意',body:'前言'.repeat(120)+'刑法總則：故意',subject:'criminalgeneral',type:'note',href:'index.html'},
 {id:'short',title:'刑總小考',body:'故意案例',subject:'criminalgeneral',type:'note',href:'index.html'},
 {id:'civil',title:'民法總則',body:'物權第７５７條',subject:'civilgeneral',type:'note',href:'index.html'}
].map(row=>({...row,_title:normalize(row.title),_body:normalize(row.body),
 _subject:normalize(row.subject==='criminalgeneral'?'刑法總則':'民法總則')}));
api.setRecords(rows);
api.setQuery('刑總');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['full','short'],'abbreviation matches both full and short names');
api.setQuery('刑總 故意');api.search();
assert.equal(api.getHits().length,2,'multiple terms retain AND semantics');
api.setQuery('刑總 物權');api.search();
assert.equal(api.getHits().length,0,'AND terms must not match different records');
api.setQuery('７５７');api.search();
assert.deepEqual(Array.from(api.getHits(),x=>x.id),['civil'],'NFKC digits still match');
assert.ok(api.snippet(rows[0],api.queryGroups('刑總')).includes('刑法總則'),'excerpt includes the actual full-name hit');
assert.equal(api.queryGroups('刑總').length,1,'alias variants count as one query term');
console.log('PASS: preview search aliases, AND semantics, NFKC, and excerpt visibility');
