"""Compile authored, source-mapped note expansions without changing chapter IDs or user data."""
import json,re,html,hashlib
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]
NAMES={'B0000001':'民法','C0000001':'刑法','A0030055':'行政程序法','G0340142':'納稅者權利保護法','A0000001':'憲法','A0000002':'憲法增修條文'}
def compile_expansions(root=ROOT):
 source=json.loads((root/'content/note-expansions.json').read_text(encoding='utf-8-sig'))
 personal=json.loads((root/'content/personal-notes.json').read_text(encoding='utf-8-sig'))
 units={u['chapterId']:u for u in source['units']}
 chapters={c['id']:c for s in personal['subjects'] for c in s['chapters']}
 if len(units)!=len(source['units']) or set(units)-set(chapters):raise ValueError('Missing/duplicate chapter targets')
 evidence=json.loads((root/'content/maintenance/note-depth-2026-10-26.json').read_text(encoding='utf-8'))['sources']
 for k,e in evidence.items():
  if urlparse(e['url']).scheme!='https' or urlparse(e['url']).hostname!='law.moj.gov.tw':raise ValueError('Non-official statutory reference')
  if hashlib.sha256(e['text'].encode()).hexdigest()!=e['sha256']:raise ValueError('Statutory snapshot hash mismatch')
 esc=lambda x:html.escape(str(x),quote=True)
 for id,u in units.items():
  if len(u['explain'])<2 or len(u['comparison'])<3 or len(u['example']['answer'])<4:raise ValueError('Incomplete note expansion')
  for n in u['articles']:
   if u['lawCode']+':'+n not in evidence:raise ValueError('Missing statutory evidence')
  refs=[{'label':NAMES[u['lawCode']]+'第'+n+'條','url':evidence[u['lawCode']+':'+n]['url']} for n in u['articles']]
  paragraphs=lambda rows:''.join('<p>'+esc(t)+'</p>' for t in rows)
  table='<table><thead><tr>'+''.join('<th scope="col">'+h+'</th>' for h in ['項目','判斷重點','辨別關鍵'])+'</tr></thead><tbody>'+''.join('<tr>'+''.join(('<th scope="row">' if i==0 else '<td>')+esc(cell)+('</th>' if i==0 else '</td>') for i,cell in enumerate(row))+'</tr>' for row in u['comparison'])+'</tbody></table>'
  body='<section class="note-expansion" data-depth-version="1"><p class="depth-label">CONCEPT / APPLICATION</p><h3>深入理解</h3>'+paragraphs(u['explain'])+'<h3>要件與界線比較</h3><p class="deep-table-hint">表格可左右滑動</p><div class="deep-table" tabindex="0" role="region" aria-label="要件與界線比較表格">'+table+'</div>'+ '<section class="worked-example"><h3>案例拆解・逐步涵攝</h3><p class="example-facts">'+esc(u['example']['facts'])+'</p>'+paragraphs(u['example']['answer'])+'</section><h3>換一個事實，結論如何改變？</h3><p>'+esc(u['boundary'])+'</p><h3>申論落筆</h3><p>'+esc(u['method'])+'</p><p class="depth-sources">法源對照：'+''.join('<a href="'+esc(r['url'])+'" target="_blank" rel="noopener noreferrer">'+esc(r['label'])+' ↗</a> ' for r in refs)+'</p></section>'
  markdown='\n\n## 深入理解\n\n'+'\n\n'.join(u['explain'])+'\n\n### 要件與界線比較\n\n| 項目 | 判斷重點 | 辨別關鍵 |\n| --- | --- | --- |\n'+'\n'.join('| '+' | '.join(row)+' |' for row in u['comparison'])+'\n\n### 案例拆解・逐步涵攝\n\n'+u['example']['facts']+'\n\n'+'\n\n'.join(u['example']['answer'])+'\n\n### 換一個事實，結論如何改變？\n\n'+u['boundary']+'\n\n### 申論落筆\n\n'+u['method']+'\n\n法源對照：\n'+'\n'.join(r['label']+' '+r['url'] for r in refs)
  c=chapters[id]
  c['body']=c['body'].split('<section class="note-expansion"')[0].rstrip()+'\n'+body
  c['text']=c['text'].split('\n\n## 深入理解')[0].rstrip()+markdown
  c['depth']={'version':1,'checkedAt':source['checkedAt'],'references':refs,'authorship':source['authorship']}
 personal['updatedAt']=source['checkedAt']
 (root/'content/personal-notes.json').write_text(json.dumps(personal,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 kbpath=root/'content/knowledge-base.json';kb=json.loads(kbpath.read_text(encoding='utf-8-sig'))
 kb['noteDepth']={'updatedAt':source['checkedAt'],'unitCount':len(units),'chapterIds':list(units),'source':'content/note-expansions.json','reviewRecord':'content/maintenance/note-depth-2026-10-26.json','kind':'自編深化筆記；維持原有章節及個人紀錄識別碼'}
 kbpath.write_text(json.dumps(kb,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 return len(units)
if __name__=='__main__':print('Compiled deep-note chapters:',compile_expansions())
