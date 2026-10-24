import pathlib,json,urllib.request,re,html,hashlib
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
root=pathlib.Path(__file__).resolve().parents[1]
qs=json.loads((root.parent/'audit-questions.json').read_text(encoding='utf-8'))
codes=sorted({q['id'].split('-')[1] for q in qs if q['id'].startswith('lawtext-')})
codes+=['G0340001','G0340142']
def fetch(code):
 u='https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode='+code
 s=urllib.request.urlopen(u,timeout=30).read().decode('utf-8-sig')
 articles={}
 for no,block in re.findall(r'name="([\d-]+)"[^>]*>.*?<div class="law-article">(.*?)(?=<div class="row"|<ul class="btnZone|</form>)',s,re.S):
  block=block.split('<div class="h3')[0]
  articles[no]=html.unescape(re.sub('<[^>]+>',' ',block))
 return code,{'url':u,'textHash':hashlib.sha256(s.encode()).hexdigest(),'articles':articles,'status':'read'}
with ThreadPoolExecutor(max_workers=3) as pool:sources=dict(pool.map(fetch,codes))
norm=lambda s:re.sub(r'\s+','',s)
checked=[];mismatch=[]
for q in qs:
 if not q['id'].startswith('lawtext-'):continue
 m=re.match(r'lawtext-([A-Z0-9]+)-(\d+(?:-\d+)?)-(\d+)$',q['id'])
 if not m:continue
 code,no,_=m.groups();quote=re.search('「(.*?)」',q['question'],re.S)
 if not quote or '【空格】' not in quote.group(1):continue
 restored=quote.group(1).replace('【空格】',q['options'][q['answer']])
 official=sources[code]['articles'].get(no,'')
 row={'id':q['id'],'law':code,'article':no,'restored':restored}
 if norm(restored) in norm(official):checked.append(q['id'])
 else:mismatch.append(dict(row,official=official[:1500]))
report={'date':'2026-10-24','method':'還原法條填空的原附答案，移除空白後逐字比對本次下載官方所有條文；僅檢查引文，不代表情境題、選項唯一性或法律適用已逐題審定。所有條文頁可能含尚未施行修文，個別題仍須核對施行日。','sources':{k:{a:b for a,b in v.items() if a!='articles'} for k,v in sources.items()},'checkedAt':datetime.now(timezone.utc).isoformat(),'matchedCount':len(checked),'matchedIds':checked,'mismatches':mismatch}
(root/'content/maintenance/statute-quotes-2026-10-24.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root.parent/'official-statutes.json').write_text(json.dumps(sources,ensure_ascii=False),encoding='utf-8')
print(json.dumps({'matched':len(checked),'mismatches':mismatch},ensure_ascii=False))
