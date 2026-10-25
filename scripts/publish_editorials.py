"""Publish source-checked originals committed by the editorial agent; no model API calls."""
from datetime import datetime, timezone
import json
import re
from hashlib import sha256
from update_daily import ROOT, TAIPEI, atomic_json, safe_link, utc_iso
from generate_editorial import normalize

def validate_article(a):
    if not isinstance(a,dict) or a.get('kind')!='agent_original' or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',a.get('date','')):
        raise ValueError('Invalid original article identity')
    datetime.fromisoformat(a['date'])
    for k,limit in [('id',100),('title',250),('intro',1000),('reflection',2000)]:
        if not isinstance(a.get(k),str) or not a[k].strip() or len(a[k])>limit:raise ValueError('Invalid article text')
    if a.get('verification',{}).get('status')!='source_checked' or a['verification'].get('humanReviewed') is not False:
        raise ValueError('Missing honest review status')
    sources=a.get('sources',[])
    if not 2<=len(sources)<=3 or len({s['id'] for s in sources})!=len(sources):raise ValueError('Two distinct source IDs required')
    for s in sources:
        if not safe_link(s.get('url'),official=True) or not isinstance(s.get('title'),str) or len(s['title'])>300:raise ValueError('Invalid official source')
    known={s['id'] for s in sources}
    if len(a.get('sections',[]))!=7:raise ValueError('Seven sections required')
    for s in a['sections']:
        if not isinstance(s.get('heading'),str) or len(s['heading'])>200 or not isinstance(s.get('text'),str) or len(s['text'])>7000 or not isinstance(s.get('sourceIds'),list) or set(s['sourceIds'])-known:raise ValueError('Invalid section')
    claims=a.get('claims',[])
    if not 1<=len(claims)<=10:raise ValueError('Evidence claims required')
    for c in claims:
        if not isinstance(c.get('claim'),str) or len(c['claim'])>400 or not 1<=len(c.get('evidence',[]))<=3:raise ValueError('Invalid claim')
        for e in c['evidence']:
            if e.get('sourceId') not in known or not isinstance(e.get('quote'),str) or not 12<=len(e['quote'])<=100:raise ValueError('Invalid evidence')
    if a.get('sourceKeys')!=[]:raise ValueError('Use actual original sources')
    return a

def validate_evidence(article,evidence):
    for s in article['sources']:
        item=evidence.get(s['id'],{})
        if item.get('url')!=s['url'] or not isinstance(item.get('text'),str) or sha256(item['text'].encode()).hexdigest()!=s.get('contentHash'):raise ValueError('Source snapshot/hash mismatch')
    for c in article['claims']:
        for e in c['evidence']:
            if normalize(e['quote']) not in normalize(evidence[e['sourceId']]['text']):raise ValueError('Quote absent from source snapshot')

def load_originals(root=ROOT):
    articles=[];seen=set()
    for path in sorted((root/'content/editorials').glob('*.json')):
        a=validate_article(json.loads(path.read_text(encoding='utf-8-sig')))
        if path.stem!=a['date'] or a['date'] in seen:raise ValueError('Article filename/date collision')
        validate_evidence(a,json.loads((root/'content/editorial-evidence'/(a['date']+'.json')).read_text(encoding='utf-8-sig')))
        text=normalize(a['intro']+''.join(s['text'] for s in a['sections']))
        # Every newly committed article is checked against all earlier originals.
        grams={text[i:i+9] for i in range(max(0,len(text)-8))}
        for old in articles[-30:]:
            previous=normalize(old['intro']+''.join(s['text'] for s in old['sections']))
            other={previous[i:i+9] for i in range(max(0,len(previous)-8))}
            if len(grams&other)/max(1,min(len(grams),len(other)))>.65:raise ValueError('Near-duplicate original')
        articles.append(a);seen.add(a['date'])
    return articles

def load_news_guides(root=ROOT):
    guides=[]
    for path in sorted((root/'content/news-guides').glob('*.json')):
        a=validate_article(json.loads(path.read_text(encoding='utf-8-sig')))
        if not a['id'].startswith('news-'+a['date']+'-') or not path.stem.startswith(a['date']+'-'):raise ValueError('Invalid news guide identity')
        validate_evidence(a,json.loads((root/'content/news-guide-evidence'/path.name).read_text(encoding='utf-8-sig')))
        guides.append(a)
    if len({a['id'] for a in guides})!=len(guides):raise ValueError('Duplicate news guide ID')
    return guides

def publish(root=ROOT,now=None):
    now=now or datetime.now(timezone.utc)
    today=now.astimezone(TAIPEI).date().isoformat()
    coverage_path=root/'content/coverage.json'
    if coverage_path.exists():
        coverage=json.loads(coverage_path.read_text(encoding='utf-8-sig'))
        (root/'site/coverage-data.js').write_text('window.LEX_COVERAGE='+json.dumps(coverage,ensure_ascii=False)+';\n',encoding='utf-8')
    personal_path=root/'content/personal-notes.json'
    if personal_path.exists():
        personal=json.loads(personal_path.read_text(encoding='utf-8-sig'))
        (root/'site/personal-notes-data.js').write_text('window.LEX_PERSONAL_NOTES='+json.dumps(personal,ensure_ascii=False)+';\n',encoding='utf-8')
    knowledge_path=root/'content/knowledge-base.json'
    if knowledge_path.exists():
        kb=json.loads(knowledge_path.read_text(encoding='utf-8-sig'))
        (root/'site/knowledge-data.js').write_text('window.LEX_KNOWLEDGE = '+json.dumps(kb,ensure_ascii=False)+';\n',encoding='utf-8')
    resources=root/'content/study-resources.json'
    if resources.exists():
        data=json.loads(resources.read_text(encoding='utf-8-sig'))
        (root/'site/study-toolkit-data.js').write_text('window.LAW_STUDY_RESOURCES = '+json.dumps(data,ensure_ascii=False)+';\n',encoding='utf-8')
    guides=[a for a in load_news_guides(root) if a['date']<=today]
    (root/'site/news-guides.js').write_text('window.LAW_NEWS_GUIDES = '+json.dumps(guides,ensure_ascii=False)+';\n',encoding='utf-8')
    for a in guides:atomic_json(root/'site/updates/guides'/(a['id']+'.json'),a)
    atomic_json(root/'site/updates/guides/index.json',[{'id':a['id'],'date':a['date'],'title':a['title'],'subject':a['subject']} for a in reversed(guides)])
    disputes=root/'content/exam-disputes.json'
    if disputes.exists():(root/'site/exam-disputes.js').write_text('window.LEX_EXAM_DISPUTES='+json.dumps(json.loads(disputes.read_text(encoding='utf-8'))['items'],ensure_ascii=False)+';\n',encoding='utf-8')
    articles=[a for a in load_originals(root) if a['date']<=today]
    daily=json.loads((root/'site/updates/daily.json').read_text(encoding='utf-8-sig'))
    daily['editorialMode']='agent_committed_originals'
    daily['editorial']={'status':'published' if articles and articles[-1]['date']==today else 'awaiting_original','attemptedDate':today,'attemptedAt':utc_iso(now),'reason':'committed_original' if articles else 'no_original_yet','article':articles[-1] if articles else None}
    daily['generatedAt']=utc_iso(now)
    for a in articles:atomic_json(root/'site/updates/readings'/(a['date']+'.json'),a)
    atomic_json(root/'site/updates/readings/index.json',[{'date':a['date'],'title':a['title'],'subject':a['subject']} for a in reversed(articles)])
    atomic_json(root/'site/updates/daily.json',daily)
    atomic_json(root/'site/updates/archive'/(daily['editionDate']+'.json'),daily)
    (root/'site/editorials.js').write_text('window.LAW_EDITORIAL_ARCHIVE = '+json.dumps(articles,ensure_ascii=False)+';\n',encoding='utf-8')
    (root/'site/daily-snapshot.js').write_text('window.LAW_DAILY_SNAPSHOT = '+json.dumps(daily,ensure_ascii=False)+';\n',encoding='utf-8')
    print(json.dumps({'editorialStatus':daily['editorial']['status'],'articleDate':articles[-1]['date'] if articles else None,'archivedOriginals':len(articles)}))
    return daily

if __name__=='__main__':publish()
