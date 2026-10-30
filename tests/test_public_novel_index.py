"""Regression tests for the final published novel search index."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from public_novel_index import validate_novel_index


def sample(count=525):
    manifest = {'id': 'wan-jie-fa-shen', 'chapterCount': count,
                'chapters': [{'number': n, 'title': f'第{n}章'} for n in range(1, count + 1)]}
    index = {'version': 1, 'items': [
        {'id': f'novel:wan-jie-fa-shen-{n}', 'type': 'novel', 'subject': '',
         'title': f'第{n}章', 'href': f'reading.html?book=wan-jie-fa-shen&chapter={n}'}
        for n in range(1, count + 1)]}
    return manifest, index


class PublishedNovelIndexTests(unittest.TestCase):
    def test_complete_index(self):
        self.assertEqual(validate_novel_index(*sample()), 525)

    def test_missing_chapter_rejected(self):
        manifest, index = sample()
        index['items'].pop()
        with self.assertRaisesRegex(ValueError, 'missing='):
            validate_novel_index(manifest, index)

    def test_wrong_title_or_link_rejected(self):
        for field in ('title', 'href'):
            with self.subTest(field=field):
                manifest, index = sample()
                index['items'][-1][field] = 'wrong'
                with self.assertRaisesRegex(ValueError, 'incorrect='):
                    validate_novel_index(manifest, index)

    def test_duplicate_and_extra_chapter_rejected(self):
        manifest, index = sample()
        index['items'].append(dict(index['items'][0]))
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            validate_novel_index(manifest, index)
        manifest, index = sample()
        index['items'].append({'id': 'novel:wan-jie-fa-shen-526', 'type': 'novel',
                               'subject': '', 'title': 'extra', 'href': 'reading.html'})
        with self.assertRaisesRegex(ValueError, 'extra='):
            validate_novel_index(manifest, index)

    def test_wrong_category_and_manifest_number_rejected(self):
        manifest, index = sample()
        index['items'][0]['type'] = 'question'
        with self.assertRaisesRegex(ValueError, 'classification'):
            validate_novel_index(manifest, index)
        manifest, index = sample()
        manifest['chapters'][1]['number'] = 3
        with self.assertRaisesRegex(ValueError, 'metadata'):
            validate_novel_index(manifest, index)

    def test_out_of_order_chapters_rejected(self):
        manifest, index = sample()
        index['items'][0], index['items'][1] = index['items'][1], index['items'][0]
        with self.assertRaisesRegex(ValueError, 'order differs'):
            validate_novel_index(manifest, index)

    def test_truncated_manifest_rejected(self):
        manifest, index = sample(513)
        with self.assertRaisesRegex(ValueError, 'count dropped'):
            validate_novel_index(manifest, index)


if __name__ == '__main__':
    unittest.main()
