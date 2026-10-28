import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const site=resolve(dirname(fileURLToPath(import.meta.url)),"../../site");
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
             ".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8"};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://127.0.0.1");
    const path=resolve(site,"."+url.pathname);
    if(!path.startsWith(site+"/")){res.writeHead(403);res.end();return}
    const data=await readFile(path);
    res.writeHead(200,{"content-type":types[extname(path)]||"application/octet-stream"});
    res.end(data);
  }catch{res.writeHead(404);res.end("Not found")}
});
await new Promise((ok,fail)=>server.once("error",fail).listen(0,"127.0.0.1",ok));
const port=server.address().port;
const candidates=[process.env.CHROME_PATH,"/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium","/usr/bin/chromium-browser"];
const executablePath=candidates.find(p=>p&&existsSync(p));
let browser;
try{
  assert.ok(executablePath,"Chromium/Chrome executable not found on CI runner");
  browser=await chromium.launch({executablePath,headless:true,args:["--no-sandbox"]});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("http://127.0.0.1:"+port+"/search-preview.html",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelector("#status")?.textContent?.includes("筆資料已載入"),null,{timeout:20000});
  assert.match(await page.locator("#status").innerText(),/3602 筆資料已載入/);
  assert.ok(await page.locator("#results article").count()>0,"no initial results");
  await page.locator("#query").fill("物權");
  await page.waitForFunction(()=>document.querySelector("#status")?.textContent?.includes("找到"),null,{timeout:5000});
  assert.ok(await page.locator("#results article").count()>0,"keyword query returned no results");
  await page.selectOption("#subject","property");
  await page.selectOption("#kind","question");
  const metas=await page.locator("#results article .meta").allTextContents();
  assert.ok(metas.length>0,"subject/type filters returned no results");
  assert.ok(metas.every(x=>x.includes("物權")&&x.includes("題目")),"filtered result mismatch");
  assert.ok(page.url().includes("subject=property"),"filter not reflected in share URL");
  await page.setViewportSize({width:390,height:844});
  await page.locator("#query").fill("行政法");
  await page.selectOption("#subject","admin");
  await page.selectOption("#kind","");
  await page.waitForFunction(()=>document.querySelector("#status")?.textContent?.includes("找到"),null,{timeout:5000});
  assert.ok(await page.locator("#results article").count()>0,"mobile search returned no results");
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  assert.ok(width.scroll<=width.viewport+2,"mobile horizontal overflow: "+JSON.stringify(width));
  assert.deepEqual(errors,[],"uncaught browser errors");
  console.log("Chromium E2E PASS: 3602 records, query, subject/type filters, share URL, mobile width.");
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
