const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../site/side-navigation.js'),'utf8'),ctx);
const nav=ctx.window.LEX_NAVIGATION,ids=nav.groups.flatMap(g=>g[1].map(i=>i[0]));
assert.equal(nav.groups.length,4);assert.equal(ids.length,20);assert.equal(new Set(ids).size,20);
for(const subject of ['crime','family','debt','property','admin','tax','criminalgeneral','civilgeneral','constitution']){
 assert.equal(nav.destination('index.html','essays',subject,'index.html'),`#/${subject}/essays/0`);
 assert(nav.destination('index.html','progress',subject,'essentials.html').endsWith(`#/${subject}/progress/0`));
}
assert(nav.destination('index.html','laws','injected/../../x','').endsWith('#/crime/laws/0'));
assert.equal(nav.resume({subject:'debt',chapter:'javascript:alert(1)'}),null);
assert.equal(nav.resume({subject:'bad',chapter:'personal-debt-guide'}),null);
const last={subject:'debt',chapter:'personal-debt-guide',title:'<img onerror="bad">'};
const html=nav.markup({active:'archive',subject:'debt',file:'index.html',last});
assert(html.includes('接續上次閱讀'));assert(html.includes('&lt;img'));assert(!html.includes('<img'));assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
assert(!html.includes('<select'));assert(!html.includes('<details'));assert(html.includes('library.html?v=20261023-unified9#teacher'));assert(html.includes('library.html?v=20261023-unified9#sources'));
for(const name of ['index','essentials','library','coverage','study-toolkit','settings','reading']){
 const page=fs.readFileSync(path.join(__dirname,'../site',name+'.html'),'utf8');assert(page.includes('side-navigation.css?'));assert(page.indexOf('side-navigation.js?')<page.indexOf('studio.js?'));
}
console.log('PASS: 20 classified destinations, all nine course routes, cross-page navigation, safe reading resume, active state and shared sidebar assets.');
