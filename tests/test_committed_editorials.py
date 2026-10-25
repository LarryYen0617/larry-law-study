import sys,json,tempfile,shutil
from pathlib import Path
from datetime import datetime,timezone,timedelta
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import publish_editorials as p
ROOT=Path(__file__).resolve().parents[1]
class CommittedOriginalTests(unittest.TestCase):
    def test_news_guide_evidence_and_archive(self):
        guides=p.load_news_guides();self.assertGreaterEqual(len(guides),1)
        a=guides[0];self.assertEqual(a['date'],'2026-10-26')
        e=json.loads((ROOT/'content/news-guide-evidence/2026-10-26-storm-tax.json').read_text(encoding='utf-8'))
        a['claims'][0]['evidence'][0]['quote']='這段引文並不存在官方原文內'
        with self.assertRaises(ValueError):p.validate_evidence(a,e)
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);shutil.copytree(ROOT/'content',root/'content');(root/'site/updates').mkdir(parents=True)
            shutil.copy(ROOT/'site/updates/daily.json',root/'site/updates/daily.json')
            p.publish(root,datetime(2026,10,25,1,tzinfo=timezone.utc))
            self.assertEqual(json.loads((root/'site/updates/guides/index.json').read_text()),[])
            p.publish(root,datetime(2026,10,26,1,tzinfo=timezone.utc))
            idx=json.loads((root/'site/updates/guides/index.json').read_text(encoding='utf-8'))
            self.assertEqual(idx[0]['id'],guides[0]['id'])
            self.assertTrue((root/'site/updates/readings/2026-10-23.json').exists())
            self.assertTrue((root/'site/updates/readings/2026-10-26.json').exists())
    def test_real_article_and_quotes_validate_offline(self):
        articles=p.load_originals();self.assertGreaterEqual(len(articles),1)
        self.assertEqual(articles[0]['kind'],'agent_original')
    def test_quote_tampering_rejected(self):
        a=json.loads((ROOT/'content/editorials/2026-10-23.json').read_text(encoding='utf-8'))
        e=json.loads((ROOT/'content/editorial-evidence/2026-10-23.json').read_text(encoding='utf-8'))
        a['claims'][0]['evidence'][0]['quote']='這段引文根本不存在原始來源內'
        with self.assertRaises(ValueError):p.validate_evidence(a,e)
    def test_publication_roundtrip_and_future_not_released(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);shutil.copytree(ROOT/'content',root/'content');(root/'site/updates').mkdir(parents=True)
            shutil.copy(ROOT/'site/updates/daily.json',root/'site/updates/daily.json')
            old=p.publish(root,datetime(2026,10,22,1,tzinfo=timezone.utc))
            self.assertIsNone(old['editorial']['article'])
            new=p.publish(root,datetime(2026,10,23,1,tzinfo=timezone.utc))
            self.assertEqual(new['editorial']['status'],'published')
            self.assertTrue((root/'site/updates/readings/2026-10-23.json').exists())
            latest=max(p.load_originals(root),key=lambda a:a['date'])['date']
            later=p.publish(root,datetime.fromisoformat(latest).replace(hour=1,tzinfo=timezone.utc)+timedelta(days=1))
            self.assertEqual(later['editorial']['status'],'awaiting_original');self.assertEqual(later['editorial']['article']['date'],latest)
