import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";

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
async function checkAccessibility(page,label){
  const audit=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]).analyze();
  assert.deepEqual(audit.violations.map(item=>({id:item.id,impact:item.impact,targets:item.nodes.map(node=>node.target)})),[],label+" accessibility violations");
}
let browser;
try{
  assert.ok(executablePath,"Chromium/Chrome executable not found on CI runner");
  browser=await chromium.launch({executablePath,headless:true,args:["--no-sandbox"]});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("http://127.0.0.1:"+port+"/search-preview.html",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelector("#status")?.textContent?.includes("筆資料已載入"),null,{timeout:20000});
  const expectedCount=await page.evaluate(async()=> (await (await fetch("search-index.json")).json()).items.length);
  const initialStatus=await page.locator("#status").innerText();
  const loadedCount=Number(initialStatus.match(/^(\d+) 筆資料已載入/)?.[1]);
  assert.ok(loadedCount>=3602,"production corpus dropped below 3602 records");
  assert.equal(loadedCount,expectedCount,"search UI silently excluded valid indexed records");
  assert.ok(await page.locator("#results article").count()>0,"no initial results");
  assert.equal(await page.getByRole("search",{name:"教材搜尋條件"}).count(),1);
  assert.equal(await page.locator("#results").getAttribute("aria-busy"),"false");
  await checkAccessibility(page,"desktop");
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.locator("#query").fill("物權");
  await page.waitForFunction(()=>document.querySelector("#status")?.textContent?.includes("找到"),null,{timeout:5000});
  assert.ok(await page.locator("#results article").count()>0,"keyword query returned no results");
  await page.selectOption("#subject","property");
  await page.selectOption("#kind","question");
  const metas=await page.locator("#results article .meta").allTextContents();
  assert.ok(metas.length>0,"subject/type filters returned no results");
  assert.ok(metas.every(x=>x.includes("物權")&&x.includes("題目")),"filtered result mismatch");
  assert.ok(page.url().includes("subject=property"),"filter not reflected in share URL");
  await page.reload({waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelector("#status")?.textContent?.includes("筆資料已載入"),null,{timeout:20000});
  assert.equal(await page.locator("#subject").inputValue(),"property","subject not restored from share URL");
  assert.equal(await page.locator("#kind").inputValue(),"question","type not restored from share URL");
  assert.equal(await page.locator("#query").inputValue(),"物權","query not restored from share URL");
  await page.selectOption("#subject","");
  await page.selectOption("#kind","");
  await page.locator("#query").fill("");
  await page.waitForFunction(count=>document.querySelector("#status")?.textContent?.includes("目前顯示 "+count+" 筆"),expectedCount,{timeout:12000});
  const expectedPages=Math.ceil(expectedCount/20);
  await page.evaluate(()=>{
    const original=Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView=function(options){window.lastSearchScroll=options;original.call(this,options)};
  });
  await page.locator("#next").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#results h2").first().evaluate(el=>el===document.activeElement),true,"paging lost keyboard focus");
  assert.equal(await page.locator("#page-label").innerText(),"第 2／"+expectedPages+" 頁","pagination failed");
  assert.equal(await page.evaluate(()=>window.lastSearchScroll.behavior),"instant","reduced-motion preference ignored");
  await page.locator("#previous").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#results h2").first().evaluate(el=>el===document.activeElement),true,"previous page lost keyboard focus");
  assert.equal(await page.locator("#page-label").innerText(),"第 1／"+expectedPages+" 頁","previous page failed");
  await page.locator("#query").fill("zzzxxyy-no-match");
  await page.waitForFunction(()=>document.querySelector("#status")?.textContent?.includes("找到 0 筆"),null,{timeout:5000});
  assert.equal(await page.locator("#results article").count(),0,"no-match query returned results");
  assert.equal(await page.locator("#pager").isHidden(),true,"pager shown for no matches");
  await page.setViewportSize({width:320,height:700});
  await page.locator("#query").fill("行政法");
  await page.selectOption("#subject","admin");
  await page.selectOption("#kind","");
  // The previous no-match query also displays "找到"; wait until the
  // debounced mobile query is actually applied before testing pager focus.
  await page.waitForFunction(()=>{
    const params=new URLSearchParams(location.search);
    return params.get("q")==="行政法" && params.get("subject")==="admin"
      && document.querySelector("#status")?.textContent?.includes("找到")
      && !document.querySelector("#pager").hidden;
  },null,{timeout:5000});
  assert.ok(await page.locator("#results article").count()>0,"mobile search returned no results");
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  assert.ok(width.scroll<=width.viewport+2,"mobile horizontal overflow: "+JSON.stringify(width));
  const buttonSize=await page.locator("#next").boundingBox();
  assert.ok(buttonSize&&buttonSize.height>=44&&buttonSize.width>=44,"pager touch target too small");
  await page.locator("#next").focus();
  const beforeMobileEnter=await page.evaluate(()=>({
    activeId:document.activeElement?.id,
    pagerHidden:document.querySelector("#pager").hidden,
    nextDisabled:document.querySelector("#next").disabled,
    pageLabel:document.querySelector("#page-label").textContent,
    status:document.querySelector("#status").textContent,
    url:location.search
  }));
  // Locator.press re-establishes page focus after the mobile viewport resize,
  // while still exercising keyboard activation (not a mouse click).
  await page.locator("#next").press("Enter");
  // A pending keyword debounce must not reset pagination after an immediate filter search.
  await page.waitForTimeout(250);
  const mobilePagingState=await page.evaluate(()=>({
    focused:document.querySelector("#results h2")===document.activeElement,
    activeTag:document.activeElement?.tagName,
    activeId:document.activeElement?.id,
    pagerHidden:document.querySelector("#pager").hidden,
    nextDisabled:document.querySelector("#next").disabled,
    pageLabel:document.querySelector("#page-label").textContent,
    url:location.search
  }));
  assert.ok(mobilePagingState.pageLabel.startsWith("第 2／"),"mobile paging did not advance: "+JSON.stringify({beforeMobileEnter,mobilePagingState}));
  assert.equal(mobilePagingState.focused,true,"mobile paging lost focus: "+JSON.stringify({beforeMobileEnter,mobilePagingState}));
  const focusedBox=await page.locator("#results h2").first().boundingBox();
  assert.ok(focusedBox&&focusedBox.y>=0&&focusedBox.y+focusedBox.height<=700,"mobile paging left focused result outside viewport");
  await checkAccessibility(page,"320px mobile");
  await page.emulateMedia({colorScheme:"dark"});
  await checkAccessibility(page,"mobile dark preference");
  assert.deepEqual(errors,[],"uncaught browser errors");
  const failurePage=await browser.newPage();
  await failurePage.route("**/search-index.json",route=>route.abort("failed"));
  await failurePage.goto("http://127.0.0.1:"+port+"/search-preview.html",{waitUntil:"domcontentloaded"});
  await failurePage.waitForFunction(()=>document.querySelector("#status")?.textContent?.includes("資料載入失敗"),null,{timeout:10000});
  assert.equal(await failurePage.locator("#results").getAttribute("aria-busy"),"false","failed load left results busy");
  await failurePage.locator("#query").fill("物權");
  await failurePage.waitForTimeout(250);
  assert.match(await failurePage.locator("#status").innerText(),/資料載入失敗/,"search input erased the load error");
  assert.equal(await failurePage.locator("#retry").isVisible(),true,"retry button missing");
  await failurePage.unroute("**/search-index.json");
  await failurePage.locator("#retry").click();
  await failurePage.waitForFunction(count=>document.querySelector("#status")?.textContent?.includes(count+" 筆資料已載入"),expectedCount,{timeout:20000});
  assert.ok(await failurePage.locator("#results article").count()>0,"retry did not restore results");
  await failurePage.close();
  // Regression: collapsed whitespace used to shift excerpt offsets and hide
  // the matching term from the result preview.
  const excerptPage=await browser.newPage();
  await excerptPage.route("**/search-index.json",async route=>{
    const fixture=JSON.parse(await readFile(resolve(site,"search-index.json"),"utf8"));
    fixture.items.push({
      id:"note:excerpt-offset-regression",type:"note",subject:"property",
      title:"片段位置回歸測試",body:"前".repeat(90)+" ".repeat(260)+"定位詞　ＡＢＣ 後文",
      href:"courses.html"
    });
    await route.fulfill({status:200,contentType:"application/json; charset=utf-8",body:JSON.stringify(fixture)});
  });
  await excerptPage.goto("http://127.0.0.1:"+port+"/search-preview.html",{waitUntil:"domcontentloaded"});
  await excerptPage.waitForFunction(()=>document.querySelector("#status")?.textContent?.includes("筆資料已載入"),null,{timeout:20000});
  await excerptPage.locator("#query").fill("定位詞");
  const excerptRecord=excerptPage.locator("#results article").filter({has:excerptPage.getByRole("heading",{name:"片段位置回歸測試"})});
  await excerptRecord.waitFor({timeout:5000});
  const excerptText=await excerptRecord.locator("p").innerText();
  assert.match(excerptText,/定位詞/,"search excerpt omitted the matching term after collapsed whitespace");
  assert.match(excerptText,/ABC/,"search excerpt did not normalize full-width characters");
  await excerptPage.close();
  const practice=await browser.newPage({viewport:{width:1280,height:800}});
  await practice.goto("http://127.0.0.1:"+port+"/practice.html",{waitUntil:"domcontentloaded"});
  await practice.waitForSelector("#practice-issue",{timeout:12000});
  for(const id of ["practice-issue","practice-rule","practice-debate","practice-application","practice-conclusion"]){
    assert.equal(await practice.locator("#"+id).count(),1,"missing dynamic practice field "+id);
  }
  await practice.close();
  const discipline=await context.newPage();
  await discipline.setViewportSize({width:320,height:800});
  await discipline.goto("http://127.0.0.1:"+port+"/class-notes/administrative-discipline-remedies.html",{waitUntil:"domcontentloaded"});
  await discipline.waitForFunction(()=>document.body.classList.contains("has-site-sidebar"));
  assert.equal(await discipline.getByRole("heading",{name:"實務補充｜釋字第785號",exact:true}).count(),1);
  assert.ok(await discipline.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"discipline page horizontal overflow");
  for(const region of await discipline.locator(".scroll").all()){
    assert.equal(await region.getAttribute("tabindex"),"0");
    await region.focus();await region.press("ArrowRight");
    await discipline.waitForFunction(el=>el.scrollLeft>0,await region.elementHandle(),{timeout:5000});
  }
  await checkAccessibility(discipline,"administrative discipline mobile page");
  await discipline.close();
  for(const readingWidth of [1280,320]){
    const readingContext=await browser.newContext({viewport:{width:readingWidth,height:900},reducedMotion:"reduce"});
    for(const filename of (await readdir(resolve(site,"class-notes"))).filter(name=>name.endsWith(".html"))){
      const reading=await readingContext.newPage();
      await reading.goto("http://127.0.0.1:"+port+"/class-notes/"+filename,{waitUntil:"domcontentloaded"});
      if(filename==="study-hub.html"){
        await reading.waitForURL("**/courses.html");
      }else{
        await reading.waitForFunction(()=>document.body.classList.contains("document-page"));
        assert.ok(await reading.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),filename+" overflows at "+readingWidth);
        await checkAccessibility(reading,filename+" at "+readingWidth);
      }
      await reading.close();
    }
    await readingContext.close();
  }
  console.log("Chromium E2E PASS: "+expectedCount+" records, filters, share URL restore, pagination, no-match, offline/retry, mobile width, visible paging focus, axe accessibility scans, essay anchors, administrative discipline keyboard tables.");
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
