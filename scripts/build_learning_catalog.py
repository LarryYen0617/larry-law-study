"""Build the shared course inventory without publishing source course files."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
def build():
 c=json.loads((ROOT/'content/course-catalog.json').read_text(encoding='utf-8'))
 p=json.loads((ROOT/'content/personal-notes.json').read_text(encoding='utf-8'))
 e=json.loads((ROOT/'content/legal-english.json').read_text(encoding='utf-8'))
 s=json.loads((ROOT/'content/photonics.json').read_text(encoding='utf-8'))
 assert len({x['id'] for x in c['courses']})==len(c['courses'])==11
 for course in c['courses']:
  note=next((n for n in p['subjects'] if n['id']==course['id']),None)
  course['units']=len(note['chapters']) if note else len(e['units']) if course['id']=='legalenglish' else len(s['units'])
  for key in ['reading','practice','essay']:
   path=course[key].split('?')[0].split('#')[0]
   assert (ROOT/'site'/path).is_file(),path
 for material in c['materials']:assert (ROOT/'site'/material['href']).is_file(),material['href']
 for q in s['questions']:
  assert len(set(q['options']))==4 and 0<=q['answer']<4 and len(q['explanations'])==4
 (ROOT/'site/course-catalog-data.js').write_text('window.LEX_COURSE_CATALOG='+json.dumps(c,ensure_ascii=False)+';\n',encoding='utf-8')
 (ROOT/'site/photonics-data.js').write_text('window.LEX_PHOTONICS='+json.dumps(s,ensure_ascii=False)+';\n',encoding='utf-8')
 classroom=json.loads((ROOT/'content/classroom-practice.json').read_text(encoding='utf-8'))
 assert len({q['id'] for q in classroom['questions']})==len(classroom['questions'])
 (ROOT/'site/classroom-practice-data.js').write_text('window.LEX_CLASSROOM_PRACTICE='+json.dumps(classroom,ensure_ascii=False)+';\n',encoding='utf-8')
 print('Learning catalog:',len(c['courses']),'courses;',len(c['materials']),'classroom resources')
if __name__=='__main__':build()
