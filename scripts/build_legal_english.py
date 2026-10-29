"""Publish authored learning material; never copy private course originals."""
from pathlib import Path
import json
from public_learning import public_knowledge
ROOT=Path(__file__).resolve().parents[1]
def build():
 d=json.loads((ROOT/'content/legal-english.json').read_text(encoding='utf-8'))
 for group in ['units','vocabulary','questions','oral']:
  ids=[x['id'] for x in d[group]]
  assert len(ids)==len(set(ids)),group
 for q in d['questions']:
  assert len(set(q['options']))==4 and len(q['options'])==4 and 0<=q['answer']<4 and len(q['explanations'])==4
  assert q['source'] and q['provenance']=='自編練習'
 (ROOT/'site/legal-english-data.js').write_text('window.LEX_ENGLISH='+json.dumps(d,ensure_ascii=False)+';\n',encoding='utf-8')
 kb=json.loads((ROOT/'content/knowledge-base.json').read_text(encoding='utf-8'))
 (ROOT/'site/knowledge-data.js').write_text('window.LEX_KNOWLEDGE = '+json.dumps(public_knowledge(kb),ensure_ascii=False)+';\n',encoding='utf-8')
 print({k:len(d[k]) for k in ['units','vocabulary','questions','oral']})
if __name__=='__main__':build()
