import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import generate_editorial as g
import update_daily as u
import unittest
from copy import deepcopy
from datetime import datetime, timezone

NOW=datetime(2026,10,23,2,tzinfo=timezone.utc)
QUOTE='這是一段僅供離線測試使用的官方文件模擬引文'
def draft():
    return dict(title='測試專用導讀並非真實新聞',intro='模擬導入與問題意識。'*10,
        sections=[dict(heading='測試段落'+str(i),text=('模擬分析不代表真實事實。'+str(i))*18,sourceIds=['S1','S2']) for i in range(5)],
        claims=[dict(id='C'+str(i),claim='這是離線測試的模擬事實主張。',evidence=[dict(sourceId='S1' if i<3 else 'S2',quote=QUOTE)]) for i in range(1,4)],
        counterargument='模擬反面觀點。'*10,limits='模擬適用界線。'*10,scenario='虛構案例。'*10,scenarioAnalysis='虛構涵攝。'*10,reflection='哪些結論尚待查證？')
def review():
    return dict(verdict='pass',issues=[],claimChecks=[dict(claimId='C'+str(i),supported=True) for i in range(1,4)],allFactualAssertionsCovered=True,distinguishesFactsAnalysisAndHypothesis=True,noUnsupportedLegalOrBookClaims=True)
class EditorialTests(unittest.TestCase):
    def setUp(self):
        self.daily=dict(editionDate='2026-10-23',news=[dict(title='測試',url='https://www.ey.gov.tw/fixture-'+str(i),source='測試',publishedAt='2026-10-23T01:00:00Z') for i in range(2)],plan=dict(courseId='crime',courseName='刑法'))
        self.calls=[]
    def source(self,n):
        return dict(title=n['title'],url=n['url'],publisher=n['source'],publishedAt=n['publishedAt'],text=QUOTE*20,contentHash='test')
    def model(self,*args):
        self.calls.append(args)
        return draft() if len(self.calls)%2 else review()
    def produce(self,**kw):
        return g.produce(self.daily,NOW,source_loader=self.source,model_call=self.model,**kw)
    def test_opt_in_off_no_calls(self):
        self.assertEqual(self.produce()[0]['status'],'not_enabled');self.assertEqual(self.calls,[])
    def test_missing_configuration_no_calls(self):
        self.assertEqual(self.produce(enabled=True)[0]['status'],'not_configured');self.assertEqual(self.calls,[])
    def test_publish_two_passes_and_idempotent(self):
        result,history=self.produce(enabled=True,key='dummy',model='test')
        self.assertEqual(result['status'],'published');self.assertEqual(len(self.calls),2)
        self.assertFalse(result['article']['verification']['humanReviewed'])
        self.daily.update(editorial=result,editorialHistory=history)
        self.assertEqual(self.produce(enabled=True,key='dummy',model='test')[0]['status'],'already_published');self.assertEqual(len(self.calls),2)
    def test_insufficient_sources_no_calls(self):
        self.daily['news']=self.daily['news'][:1]
        self.assertEqual(self.produce(enabled=True,key='dummy',model='test')[0]['status'],'no_sources');self.assertEqual(self.calls,[])
    def test_invalid_quote(self):
        d=draft();d['claims'][0]['evidence'][0]['quote']='這段捏造引文不存在於模擬來源之內'
        with self.assertRaisesRegex(g.GateError,'quote_not_in_source'):g.validate_draft(d,[dict(id='S1',text=QUOTE),dict(id='S2',text=QUOTE)],[])
    def test_duplicate(self):
        d=draft()
        with self.assertRaisesRegex(g.GateError,'near_duplicate'):g.validate_draft(d,[dict(id='S1',text=QUOTE),dict(id='S2',text=QUOTE)],[dict(body=g.body_text(d))])
    def test_review_missing_or_unsupported(self):
        r=review();r['claimChecks'][0]['supported']=False
        with self.assertRaises(g.GateError):g.validate_review(r,draft())
        r=review();r['claimChecks']=r['claimChecks'][:1]
        with self.assertRaises(g.GateError):g.validate_review(r,draft())
    def test_failure_retains_article(self):
        old=dict(date='2026-10-22',verification=dict(status='automated_pass'))
        self.daily['editorial']=dict(article=old)
        def fail(*a):raise RuntimeError('sensitive-error-not-for-publication')
        result,_=g.produce(self.daily,NOW,True,'dummy','test',source_loader=self.source,model_call=fail)
        self.assertEqual(result['article'],old);self.assertEqual(result['reason'],'generation_or_review_failed')
    def test_html_visible_text(self):
        p=g.VisibleText();p.feed('<script>bad</script><nav>menu</nav><article>真正原文</article>')
        self.assertEqual(p.parts,['真正原文'])
    def test_updater_carries_editorial_even_with_new_news(self):
        import json
        root=Path(__file__).resolve().parents[1]
        prev=dict(schemaVersion=1,news=[],editorial=dict(status='published',article=dict(date='2026-10-22')),editorialHistory=[dict(body='old')])
        data=u.assemble(NOW,json.loads((root/'content/subjects.json').read_text(encoding='utf-8-sig')),json.loads((root/'content/readings.json').read_text(encoding='utf-8-sig')),[([] ,dict(status='ok'))],prev)
        self.assertEqual(data['editorial'],prev['editorial']);self.assertEqual(data['editorialHistory'],prev['editorialHistory'])
