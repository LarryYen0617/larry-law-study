import unittest,json,tempfile,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from publish_note_expansions import compile_expansions
class NoteExpansionTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
  for name in ['content/personal-notes.json','content/knowledge-base.json','content/note-expansions.json','content/maintenance/note-depth-2026-10-26.json']:
   dest=self.root/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/name,dest)
 def tearDown(self):self.temp.cleanup()
 def test_idempotent_and_ids_preserved(self):
  before=json.loads((self.root/'content/personal-notes.json').read_text(encoding='utf-8'))
  ids=[c['id'] for s in before['subjects'] for c in s['chapters']]
  self.assertEqual(compile_expansions(self.root),27)
  first=(self.root/'content/personal-notes.json').read_text(encoding='utf-8');compile_expansions(self.root)
  self.assertEqual(first,(self.root/'content/personal-notes.json').read_text(encoding='utf-8'))
  after=json.loads(first);self.assertEqual(ids,[c['id'] for s in after['subjects'] for c in s['chapters']]);self.assertEqual(len(ids),97)
  for s in after['subjects']:
   deep=[c for c in s['chapters'] if c.get('depth')];self.assertEqual(len(deep),3)
   for c in deep:
    self.assertEqual(c['body'].count('class="note-expansion"'),1);self.assertEqual(c['text'].count('## 深入理解'),1)
    for field in ['深入理解','要件與界線比較','案例拆解','申論落筆']:self.assertIn(field,c['body']);self.assertIn(field,c['text'])
    self.assertIn('虛構',c['body']);self.assertIn('scope="col"',c['body']);self.assertGreater(len(c['depth']['references']),1)
 def test_evidence_tampering_and_nonofficial_links_rejected(self):
  p=self.root/'content/maintenance/note-depth-2026-10-26.json';d=json.loads(p.read_text(encoding='utf-8'));k=next(iter(d['sources']));original=d['sources'][k]['text'];d['sources'][k]['text']+='篡改';p.write_text(json.dumps(d),encoding='utf-8')
  with self.assertRaisesRegex(ValueError,'hash mismatch'):compile_expansions(self.root)
  d['sources'][k]['text']=original;d['sources'][k]['url']='javascript:alert(1)';p.write_text(json.dumps(d),encoding='utf-8')
  with self.assertRaisesRegex(ValueError,'Non-official'):compile_expansions(self.root)
 def test_missing_target_rejected(self):
  p=self.root/'content/note-expansions.json';d=json.loads(p.read_text(encoding='utf-8'));d['units'][0]['chapterId']='missing';p.write_text(json.dumps(d),encoding='utf-8')
  with self.assertRaisesRegex(ValueError,'chapter targets'):compile_expansions(self.root)
if __name__=='__main__':unittest.main()
