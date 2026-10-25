"""Build public daily JSON from official RSS + authored reading library. No API keys."""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from html import unescape
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
TAIPEI = timezone(timedelta(hours=8))
UTC = timezone.utc
MAX_BYTES = 2_000_000
ANCHOR = datetime(2026, 10, 22, 9, tzinfo=TAIPEI).date()

def utc_iso(value):
    return value.astimezone(UTC).isoformat().replace('+00:00', 'Z')

def edition_date(now):
    return (now.astimezone(TAIPEI) - timedelta(hours=9)).date()

def safe_link(url, official=False):
    try:
        p = urlparse(url)
        return p.scheme == 'https' and bool(p.hostname) and not p.username and not p.password and (not official or p.hostname.endswith('.gov.tw'))
    except (ValueError, AttributeError):
        return False

def get_bytes(url):
    if not safe_link(url):
        raise ValueError('HTTPS source required')
    request = Request(url, headers={'User-Agent': 'LarryStudyDaily/1.0 (public RSS reader)', 'Accept': 'application/rss+xml,application/atom+xml,application/xml,text/xml,application/json'})
    with urlopen(request, timeout=15) as response:
        if not safe_link(response.url, official=(urlparse(url).hostname or '').endswith('.gov.tw')):
            raise ValueError('Unsafe redirect')
        raw = response.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise ValueError('Source too large')
        return raw

def parse_date(value):
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
    except (ValueError, TypeError):
        try:
            parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            return None
    # A timezone-free timestamp is not silently treated as "today".
    return parsed.astimezone(UTC) if parsed.tzinfo else None

def plain(value, limit=160):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', unescape(value or ''))).strip()[:limit]

def parse_feed(raw, source, now):
    if b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():
        raise ValueError('DTD/entity declarations not accepted')
    tree = ET.fromstring(raw)
    local = lambda tag: tag.split('}')[-1]
    if local(tree.tag).lower() not in ('rss', 'feed', 'rdf'):
        raise ValueError('Response is not RSS/Atom')
    result = []
    for entry in tree.iter():
        if local(entry.tag) not in ('item', 'entry'):
            continue
        values = {}
        for child in entry:
            tag = local(child.tag)
            if tag == 'link' and child.attrib.get('href') and child.attrib.get('rel', 'alternate') == 'alternate':
                values['link'] = child.attrib['href']
            elif child.text:
                values[tag] = child.text.strip()
        link = values.get('link', '')
        stamp = parse_date(values.get('pubDate') or values.get('published') or values.get('date') or values.get('updated'))
        if not stamp or not safe_link(link, official=True):
            continue
        if stamp > now + timedelta(minutes=5) or stamp < now - timedelta(days=7):
            continue
        title = plain(values.get('title'), 180)
        if not title:
            continue
        result.append({'title': title, 'url': link, 'source': source['name'], 'publishedAt': utc_iso(stamp), 'sourceId': source['id'], 'kind': '官方RSS標題・未附AI事件判斷'})
    return result

def fetch_one(source, now):
    try:
        if not safe_link(source['url'], official=True):
            raise ValueError('Official feed URL required')
        rows = parse_feed(get_bytes(source['url']), source, now)
        return rows, {'id': source['id'], 'name': source['name'], 'status': 'ok', 'checkedAt': utc_iso(now), 'items': len(rows)}
    except Exception as error:
        # Do not log credentials, response bodies, or arbitrary remote text.
        return [], {'id': source['id'], 'name': source['name'], 'status': 'error', 'checkedAt': utc_iso(now), 'error': type(error).__name__}

def choose_plan(now, courses, readings):
    day = (edition_date(now) - ANCHOR).days
    selected = courses[day % len(courses)]
    topic_index = (day // len(courses)) % len(selected['topics'])
    reading = next(r for r in readings if r['subject'] == selected['id'])
    return {'courseId': selected['id'], 'courseName': selected['name'], 'topicIndex': topic_index, 'topicTitle': selected['topics'][topic_index]['title'], 'reading': reading, 'mode': '內建研讀庫輪替；不是當日新寫文章'}

def valid_previous(previous):
    return isinstance(previous, dict) and previous.get('schemaVersion') == 1 and isinstance(previous.get('news'), list)

def assemble(now, courses, readings, source_results, previous=None, offline=False):
    rows = [row for group, _ in source_results for row in group]
    statuses = [status for _, status in source_results]
    success = any(s['status'] == 'ok' for s in statuses)
    seen = set()
    news = []
    for row in sorted(rows, key=lambda n: n['publishedAt'], reverse=True):
        if row['url'] not in seen:
            news.append(row)
            seen.add(row['url'])
        if len(news) == 8:
            break
    carried = False
    news_updated_at = utc_iso(now) if success else None
    if not success and valid_previous(previous):
        for row in previous['news']:
            if not isinstance(row, dict):
                continue
            stamp = parse_date(row.get('publishedAt'))
            if stamp and now - timedelta(days=14) <= stamp <= now and safe_link(row.get('url'), official=True):
                news.append(row)
        news = news[:8]
        carried = bool(news)
        news_updated_at = previous.get('newsUpdatedAt') if carried else None
    state = 'offline' if offline else 'ok' if success and all(s['status'] == 'ok' for s in statuses) else 'partial' if success else 'error'
    return {'schemaVersion': 1, 'editionDate': edition_date(now).isoformat(), 'generatedAt': utc_iso(now), 'newsUpdatedAt': news_updated_at, 'timezone': 'Asia/Taipei', 'releaseHour': 9, 'newsState': state, 'carriedNews': carried, 'sources': statuses, 'news': news, 'plan': choose_plan(now, courses, readings), 'editorial': previous.get('editorial', {}) if valid_previous(previous) else {}, 'editorialHistory': previous.get('editorialHistory', [])[-14:] if valid_previous(previous) and isinstance(previous.get('editorialHistory', []), list) else [], 'notice': '官方消息保留發布日期；導讀另行查讀撰寫，歷史文章持續保存。'}

def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(path)

def build(now=None, offline=False, previous_url=None):
    now = now or datetime.now(UTC)
    courses = json.loads((ROOT / 'content/subjects.json').read_text(encoding='utf-8-sig'))
    readings = json.loads((ROOT / 'content/readings.json').read_text(encoding='utf-8-sig'))
    feeds = json.loads((ROOT / 'content/feeds.json').read_text(encoding='utf-8-sig'))
    previous = None
    current = ROOT / 'site/updates/daily.json'
    if current.exists():
        previous = json.loads(current.read_text(encoding='utf-8-sig'))
    if previous_url:
        host = urlparse(previous_url).hostname or ''
        if not host.endswith('.github.io'):
            raise ValueError('Previous data must come from GitHub Pages, never InfinityFree cron requests')
        try:
            candidate = json.loads(get_bytes(previous_url))
            if valid_previous(candidate):
                previous = candidate
        except Exception:
            pass
    if offline:
        results = [([], {'id': s['id'], 'name': s['name'], 'status': 'not_run', 'checkedAt': None, 'items': 0}) for s in feeds]
    else:
        with ThreadPoolExecutor(max_workers=3) as executor:
            results = list(executor.map(lambda s: fetch_one(s, now), feeds))
    data = assemble(now, courses, readings, results, previous, offline)
    atomic_json(current, data)
    atomic_json(ROOT / 'site/updates/archive' / (data['editionDate'] + '.json'), data)
    (ROOT / 'site/reading-library.js').write_text('const LAW_READING_LIBRARY = ' + json.dumps(readings, ensure_ascii=False) + ';\n', encoding='utf-8')
    (ROOT / 'site/daily-snapshot.js').write_text('window.LAW_DAILY_SNAPSHOT = ' + json.dumps(data, ensure_ascii=False) + ';\n', encoding='utf-8')
    for old in sorted((ROOT / 'site/updates/archive').glob('*.json'))[:-60]:
        old.unlink()
    print(json.dumps({'editionDate': data['editionDate'], 'newsState': data['newsState'], 'newsItems': len(data['news']), 'carriedNews': data['carriedNews']}, ensure_ascii=True))
    return data

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--offline', action='store_true', help='Build an explicitly offline snapshot without fetching news')
    parser.add_argument('--now', help='ISO timestamp with timezone, for reproducible local tests')
    parser.add_argument('--previous-url', help='Previous public GitHub Pages JSON to retain on source failure')
    args = parser.parse_args()
    stamp = datetime.fromisoformat(args.now.replace('Z', '+00:00')) if args.now else None
    if stamp is not None and stamp.tzinfo is None:
        parser.error('--now must include a timezone')
    build(stamp, args.offline, args.previous_url)
