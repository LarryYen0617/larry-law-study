"""Ensure the final Pages search index contains every published novel chapter."""


def validate_novel_index(manifest, index):
    if not isinstance(manifest, dict) or not isinstance(manifest.get('chapters'), list):
        raise ValueError('Invalid novel manifest')
    chapters = manifest['chapters']
    if manifest.get('chapterCount') != len(chapters) or len(chapters) < 525:
        raise ValueError('Novel manifest chapter count dropped or disagrees with chapters')
    if not isinstance(index, dict) or index.get('version') != 1 or not isinstance(index.get('items'), list):
        raise ValueError('Invalid published search index')
    book = manifest.get('id')
    if book != 'wan-jie-fa-shen':
        raise ValueError('Unexpected novel identifier')
    expected = {}
    for number, chapter in enumerate(chapters, 1):
        if (not isinstance(chapter, dict) or chapter.get('number') != number
                or not isinstance(chapter.get('title'), str) or not chapter['title'].strip()):
            raise ValueError(f'Invalid novel chapter metadata at {number}')
        expected[f'novel:{book}-{number}'] = (
            chapter['title'], f'reading.html?book={book}&chapter={number}')
    found = {}
    found_order = []
    for row in index['items']:
        if not isinstance(row, dict):
            raise ValueError('Invalid published index row')
        key = row.get('id')
        if isinstance(key, str) and key.startswith(f'novel:{book}-'):
            if key in found:
                raise ValueError(f'Duplicate published novel entry: {key}')
            found[key] = (row.get('title'), row.get('href'))
            found_order.append(key)
            if row.get('type') != 'novel' or row.get('subject') != '':
                raise ValueError(f'Invalid published novel classification: {key}')
    missing = sorted(set(expected) - set(found))
    extra = sorted(set(found) - set(expected))
    incorrect = sorted(key for key in expected.keys() & found.keys()
                       if expected[key] != found[key])
    if missing or extra or incorrect:
        raise ValueError(f'Published novel index mismatch: missing={missing[:5]}, extra={extra[:5]}, incorrect={incorrect[:5]}')
    if found_order != list(expected):
        raise ValueError('Published novel chapter order differs from manifest')
    return len(found)
