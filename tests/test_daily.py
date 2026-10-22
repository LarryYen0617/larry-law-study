import importlib.util
from pathlib import Path
import unittest
from datetime import datetime, timezone
import json

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('daily', ROOT / 'scripts/update_daily.py')
daily = importlib.util.module_from_spec(spec)
spec.loader.exec_module(daily)
NOW = datetime(2026, 10, 22, 3, tzinfo=timezone.utc)
SOURCE = {'id':'test-only', 'name':'測試來源（非真實新聞）'}
RSS = b'''<?xml version="1.0"?><rss version="2.0"><channel><item><title><![CDATA[Test &amp; title]]></title><link>https://www.ey.gov.tw/test-fixture-only</link><pubDate>Thu, 22 Oct 2026 02:00:00 GMT</pubDate></item><item><title>Undated</title><link>https://www.ey.gov.tw/undated</link></item><item><title>Unsafe</title><link>javascript:alert(1)</link><pubDate>Thu, 22 Oct 2026 02:00:00 GMT</pubDate></item></channel></rss>'''

class DailyTests(unittest.TestCase):
    def setUp(self):
        self.courses = json.loads((ROOT / 'content/subjects.json').read_text(encoding='utf-8-sig'))
        self.readings = json.loads((ROOT / 'content/readings.json').read_text(encoding='utf-8-sig'))

    def test_taipei_nine_boundary(self):
        self.assertEqual(daily.edition_date(datetime(2026,10,22,0,59,tzinfo=timezone.utc)).isoformat(), '2026-10-21')
        self.assertEqual(daily.edition_date(datetime(2026,10,22,1,tzinfo=timezone.utc)).isoformat(), '2026-10-22')

    def test_twenty_seven_day_cycle_covers_all_topics(self):
        from datetime import timedelta
        plans = [daily.choose_plan(NOW + timedelta(days=i), self.courses, self.readings) for i in range(27)]
        self.assertEqual(len({(p['courseId'], p['topicIndex']) for p in plans}), 27)
        self.assertTrue(all(len(p['reading']['sections']) == 5 for p in plans))

    def test_rss_requires_date_and_official_link(self):
        rows = daily.parse_feed(RSS, SOURCE, NOW)
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]['title'],'Test & title')
        self.assertEqual(rows[0]['publishedAt'],'2026-10-22T02:00:00Z')

    def test_atom(self):
        atom=b'<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Fixture</title><link href="https://www.dot.gov.tw/test-only"/><published>2026-10-22T10:00:00+08:00</published></entry></feed>'
        self.assertEqual(len(daily.parse_feed(atom,SOURCE,NOW)),1)

    def test_html_and_entities_are_rejected(self):
        with self.assertRaises(ValueError):
            daily.parse_feed(b'<html><body>blocked</body></html>',SOURCE,NOW)
        with self.assertRaises(ValueError):
            daily.parse_feed(b'<!DOCTYPE rss [<!ENTITY x "x">]><rss/>',SOURCE,NOW)

    def test_all_failure_keeps_old_news_and_timestamp(self):
        rows=daily.parse_feed(RSS,SOURCE,NOW)
        previous={'schemaVersion':1,'news':rows,'newsUpdatedAt':'2026-10-22T02:30:00Z'}
        result=daily.assemble(NOW,self.courses,self.readings,[([],{'status':'error'})],previous)
        self.assertEqual(result['newsState'],'error')
        self.assertTrue(result['carriedNews'])
        self.assertEqual(result['newsUpdatedAt'],previous['newsUpdatedAt'])
        self.assertEqual(len(result['news']),1)

    def test_no_fake_news_on_first_failure(self):
        result=daily.assemble(NOW,self.courses,self.readings,[([],{'status':'error'})])
        self.assertEqual(result['news'],[])
        self.assertIsNone(result['newsUpdatedAt'])

    def test_empty_success_is_not_source_failure(self):
        result=daily.assemble(NOW,self.courses,self.readings,[([],{'status':'ok'})])
        self.assertEqual(result['newsState'],'ok')
        self.assertFalse(result['carriedNews'])

    def test_partial_success_and_deduplication(self):
        rows=daily.parse_feed(RSS,SOURCE,NOW)
        result=daily.assemble(NOW,self.courses,self.readings,[(rows+rows,{'status':'ok'}),([] ,{'status':'error'})])
        self.assertEqual(result['newsState'],'partial')
        self.assertEqual(len(result['news']),1)

    def test_old_future_and_timezone_free_not_current(self):
        self.assertIsNone(daily.parse_date('2026-10-22T10:00:00'))
        self.assertEqual(daily.parse_feed(RSS.replace(b'22 Oct 2026',b'22 Oct 2025'),SOURCE,NOW),[])
        self.assertEqual(daily.parse_feed(RSS.replace(b'22 Oct 2026',b'23 Oct 2026'),SOURCE,NOW),[])

if __name__=='__main__':
    unittest.main()
