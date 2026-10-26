"""Build chapter links only from explicit official citations; capture official statute text."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,parse_qs
from urllib.request import urlopen,Request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
import json,re,html,hashlib
ROOT=Path(__file__).resolve().parents[1]
class Articles(HTMLParser):
 def __init__(self):super().__init__();self.no='';self.number=False;self.depth=0;self.buf=[];self.rows={};self.title='';self.in_title=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);classes=a.get('class','').split()
  if tag=='title':self.in_title=True
  if tag=='div':
   if 'col-no' in classes:self.number=True;self.no=''
   if self.depth:self.depth+=1
   elif 'law-article' in classes:self.depth=1;self.buf=[]
  if self.depth and tag=='br':self.buf.append('\n')
 def handle_endtag(self,tag):
  if tag=='title':self.in_title=False
  if tag=='div':
   self.number=False
   if self.depth:
    self.buf.append('\n');self.depth-=1
    if self.depth==0:
     match=re.search(r'第\s*([0-9-]+)\s*條',self.no)
     if match:self.rows[match.group(1)]='\n'.join(x.strip() for x in ''.join(self.buf).splitlines() if x.strip())
 def handle_data(self,data):
  if self.in_title:self.title+=data
  if self.number:self.no+=data
  if self.depth:self.buf.append(data)
def build():
 notes=json.loads((ROOT/'content/personal-notes.json').read_text(encoding='utf-8-sig'));requests={};chapters={};subjects={}
 for s in notes['subjects']:
  subjects[s['id']]=[]
  for c in s['chapters']:
   ids=[]
   for raw in re.findall(r'href="([^\"]+)"',c['body']):
    u=html.unescape(raw);p=urlparse(u)
    if p.scheme!='https' or p.hostname!='law.moj.gov.tw' or p.path.lower()!='/lawclass/lawsingle.aspx':continue
    q={k.lower():v[0] for k,v in parse_qs(p.query).items()};code=q.get('pcode','').upper();no=q.get('flno','')
    if not re.fullmatch('[A-Z][0-9]{7}',code) or not re.fullmatch('[0-9]+(?:-[0-9]+)?',no):continue
    key=code+'-'+no;requests[key]=(code,no);ids.append(key);subjects[s['id']].append(key)
   chapters[c['id']]=list(dict.fromkeys(ids))
 codes=sorted({x[0] for x in requests.values()})
 def fetch(code):
  url='https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode='+code;cache=ROOT.parent/'law-captures'/ (code+'.html');cache.parent.mkdir(exist_ok=True)
  try:
   raw=urlopen(url,timeout=25).read();p=Articles();p.feed(raw.decode('utf-8'));assert p.rows,code;p.versionRaw=html.unescape(re.sub('<[^>]+>',' ',raw.decode('utf-8').split('法規類別')[0]));cache.write_bytes(raw);return code,p,hashlib.sha256(raw).hexdigest()
  except Exception as e:print('Unavailable',code,type(e).__name__,flush=True);return code,None,None
 with ThreadPoolExecutor(max_workers=4) as pool:pages={c:(p,h) for c,p,h in pool.map(fetch,codes)}
 rows={};missing=[];checked=datetime.now(timezone.utc).isoformat()
 for key,(code,no) in requests.items():
  parser,pagehash=pages[code];body=parser.rows.get(no) if parser else None
  if not body:missing.append(key);continue
  name=parser.title.strip().split('-全國法規')[0].strip();url='https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode='+code+'&flno='+no
  rows[key]={'id':key,'code':code,'number':no,'law':name,'label':name+' 第'+no+'條','text':body,'url':url,'checkedAt':checked,'pageHash':pagehash,'textHash':hashlib.sha256(body.encode()).hexdigest()}
 for key,r in rows.items():
  page=pages[r['code']][0]
  if r['code']=='B0000001' and r['number']=='166-1' and '尚未生效' in page.versionRaw and re.search(r'166-1.{0,20}條條文施行日期',page.versionRaw):r['status']='尚未施行';r['versionNote']='官方沿革載本條施行日期由行政院會同司法院另定；不可當作已施行規定套用。'
 data={'version':1,'checkedAt':checked,'chapters':chapters,'subjects':{k:list(dict.fromkeys(v)) for k,v in subjects.items()},'articles':rows,'missing':missing,'notice':'依筆記已明列的官方引用連結對照；條文為查讀快照，施行資訊及沿革請核對官方原頁。'}
 (ROOT/'content/note-law-links.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(ROOT/'site/note-law-data.js').write_text('window.LEX_NOTE_LAWS='+json.dumps(data,ensure_ascii=False)+';\n',encoding='utf-8');print(json.dumps({'articles':len(rows),'chaptersLinked':sum(bool(x) for x in chapters.values()),'missing':missing}))
if __name__=='__main__':build()
