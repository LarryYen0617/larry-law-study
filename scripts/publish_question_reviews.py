"""Publish authored review data without changing its date or review status."""
import json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
for name,var,expected in [('question','LEX_QUESTION_CORRECTIONS',152),('teacher','LEX_TEACHER_CORRECTIONS',91)]:
    data=json.loads((ROOT/f'content/{name}-corrections.json').read_text(encoding='utf-8'))
    rows=data['items']
    if len(rows)!=expected or len({r['id'] for r in rows})!=expected:
        raise ValueError(f'{name}: missing or duplicate reviewed items')
    for row in rows:
        if not row.get('sources') or not all(s['url'].startswith('https://law.moj.gov.tw/') for s in row['sources']):
            raise ValueError(f"{row['id']}: official legal basis required")
        if name=='question' and (len(row['explanations'])!=4 or not row.get('reviewNote')):
            raise ValueError(f"{row['id']}: authored analysis required")
        if name=='teacher' and not row.get('analysis'):
            raise ValueError(f"{row['id']}: authored analysis required")
    (ROOT/f'site/{name}-corrections.js').write_text('window.'+var+'='+json.dumps(rows,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    print(f'{name}: {len(rows)} authored reviews published')
