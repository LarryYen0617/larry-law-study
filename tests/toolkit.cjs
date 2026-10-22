const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../site'),nodes=new Map(),saved=new Map();
const el=s=>{if(!nodes.has(s))nodes.set(s,{innerHTML:'',textContent:'',value:'',handlers:{},addEventListener(t,f){this.handlers[t]=f;}});return nodes.get(s);};
const ctx=vm.createContext({window:{print(){}},document:{querySelector:el,createElement:()=>({click(){}})},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},Blob,URL:{createObjectURL:()=> 'blob:fixture',revokeObjectURL(){}},setTimeout:f=>f()});
vm.runInContext(fs.readFileSync(path.join(root,'study-toolkit-data.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'study-toolkit.js'),'utf8'),ctx);
const expected=JSON.parse(fs.readFileSync(path.join(root,'../content/study-resources.json'),'utf8'));
assert.equal(JSON.stringify(ctx.window.LAW_STUDY_RESOURCES),JSON.stringify(expected));
assert.equal(expected.length,9);for(const r of expected){assert.ok(r.steps.length===3);for(const s of r.sources){const u=new URL(s.url);assert.equal(u.protocol,'https:');assert.ok(u.hostname.endsWith('.gov.tw'));}}
assert.equal((el('#resources').innerHTML.match(/<article>/g)||[]).length,9);
el('#subject').handlers.change({target:{value:'tax'}});assert.equal((el('#resources').innerHTML.match(/<article>/g)||[]).length,1);assert.ok(el('#resources').innerHTML.includes('納稅者權利保護法'));
el('#draftText').value='這是我的涵攝草稿';el('#draftText').handlers.input();assert.ok(el('#draftStatus').textContent.includes('未儲存'));
el('#saveDraft').handlers.click();assert.equal(saved.get('larry-law-toolkit-draft-v1'),'這是我的涵攝草稿');assert.equal(saved.size,1);
ctx.localStorage.setItem=()=>{throw Error('quota')};el('#saveDraft').handlers.click();assert.ok(el('#draftStatus').textContent.includes('儲存失敗'));
assert.equal(vm.runInContext('toolEsc("<script>測試</script>")',ctx),'&lt;script&gt;測試&lt;/script&gt;');
console.log('PASS: nine official resource groups, subject filter, isolated draft saving, unsaved notice, quota error, escaping, data consistency.');
