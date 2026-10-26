'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../site');
const dir=path.join(root,'class-notes');
const pages=fs.readdirSync(dir).filter(name=>name.endsWith('.html'));
const read=file=>fs.readFileSync(file,'utf8');
const hub=read(path.join(dir,'study-hub.html'));
const required=['刑法分則','民法親屬','民法債編','民法物權','行政法','租稅法','法學英文'];
for(const name of required)assert(hub.includes(name),'科目入口缺少：'+name);
for(const name of ['administrative-law-principles.html','four-subjects-roadmap.html','criminal-property-offenses.html'])assert(hub.includes(name),'未從科目入口連結：'+name);
let checked=0;
for(const name of pages){
  const file=path.join(dir,name),html=read(file);
  assert(/<html[^>]+lang="zh-Hant"/i.test(html),'語言標記缺漏：'+name);
  assert(/<title>[^<]+<\/title>/i.test(html),'網頁標題缺漏：'+name);
  for(const match of html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)){
    const href=match[1];
    if(/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(href))continue;
    const [raw,hash='']=href.split('#'),clean=raw.split('?')[0];
    const target=clean?path.resolve(dir,decodeURIComponent(clean)):file;
    assert(target.startsWith(root+path.sep),'連結超出發布目錄：'+name+' → '+href);
    assert(fs.existsSync(target),'站內連結不存在：'+name+' → '+href);
    if(hash&&target.endsWith('.html')){
      const targetHtml=read(target),id=decodeURIComponent(hash);
      assert(targetHtml.includes('id="'+id+'"')||targetHtml.includes("id='"+id+"'"),'連結錨點不存在：'+name+' → '+href);
    }
    checked++;
  }
}
console.log('PASS: '+required.length+' 科入口、'+pages.length+' 頁教材、'+checked+' 個站內連結與錨點。');
