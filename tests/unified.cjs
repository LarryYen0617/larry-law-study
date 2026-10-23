const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');const root=path.resolve(__dirname,'../site');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'workspace-data.js'),'utf8'),context);const W=context.window.LEX_WORKSPACE;
assert.equal(W.chapters('第一章 初見\n第一段\n\n第二章 相逢\n第二段').length,2);assert.equal(W.chapters('一篇沒有章名的短文')[0].title,'正文');assert.throws(()=>W.chapters(''));assert(W.esc('<img src=x>')==='&lt;img src=x&gt;');
assert(!W.validBook({id:'../../unsafe',title:'x',chapters:[{title:'x',text:'x'}]}));assert(W.validBook({id:'book-123',title:'x',chapters:[{title:'x',text:'安全的文字'}]}));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'books/wan-jie-fa-shen/manifest.json'),'utf8'));assert.equal(manifest.chapters.length,513);const rows=[];for(const p of [...new Set(manifest.chapters.map(c=>c.part))])rows.push(...JSON.parse(fs.readFileSync(path.join(root,'books/wan-jie-fa-shen',p),'utf8')));
assert.deepEqual(rows.map(x=>x.number),Array.from({length:513},(_,i)=>i+1));assert(rows.every(x=>x.text.trim().length>0));assert.equal(rows.length,new Set(rows.map(c=>c.number)).size);assert(rows.reduce((n,c)=>n+c.text.length,0)>1_000_000);
assert(!fs.existsSync(path.join(root,'help.html')));for(const f of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){const text=fs.readFileSync(path.join(root,f),'utf8');assert(!text.includes('help.html'));for(const m of text.matchAll(/(?:src|href)="([^"#:]+\.(?:js|css))(?:\?[^"#]*)?"/g))assert(fs.existsSync(path.join(root,m[1])),m[1]);}
assert(!/(^|[},])nav a\{/.test(fs.readFileSync(path.join(root,'library.css'),'utf8')));
const css=fs.readFileSync(path.join(root,'design-system.css'),'utf8');assert(css.includes('.sidebar-link{background:transparent;color:#e2eceb'));assert(css.includes('.sidebar-link[aria-current=page]'));
async function testRestore(){
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',checked:true,disabled:false});return nodes.get(id);};const saved=new Map([['lex-nexus-study-v1',JSON.stringify({familiar:{old:true},answers:{},drafts:{}})],['unrelated-setting','keep']]);let downloads=0,failBooks=false;
 const local={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
 const api={...W,books:async()=>[],putMany:async()=>{if(failBooks)throw Error('quota');},download:()=>downloads++};
 vm.runInNewContext(fs.readFileSync(path.join(root,'settings.js'),'utf8'),{window:{LEX_WORKSPACE:api},document:{getElementById:get},localStorage:local,Date,JSON,Error});
 const incoming={format:'lex-nexus-backup',version:1,entries:{'lex-nexus-study-v1':JSON.stringify({familiar:{new:true},answers:{},drafts:{}})},books:[]};
 const upload=async data=>get('restoreAll').onchange({target:{files:[{size:200,text:async()=>JSON.stringify(data)}]}});
 await upload({...incoming,entries:{'other-key':'bad'}});assert(get('confirmRestore').disabled);assert.equal(saved.get('unrelated-setting'),'keep');
 await upload(incoming);assert(!get('confirmRestore').disabled);failBooks=true;await get('confirmRestore').onclick();assert(JSON.parse(saved.get('lex-nexus-study-v1')).familiar.old);assert.equal(downloads,1);
 failBooks=false;await upload(incoming);await get('confirmRestore').onclick();assert(JSON.parse(saved.get('lex-nexus-study-v1')).familiar.new);assert.equal(saved.get('unrelated-setting'),'keep');assert.equal(downloads,2);
 console.log('PASS: 513 ordered novel chapters, safe text import/rendering, removed help page, isolated sidebar styles, backup validation and rollback without clearing unrelated records.');
}
testRestore().catch(e=>{console.error(e);process.exitCode=1;});
