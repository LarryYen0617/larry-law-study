import test from 'node:test';
import assert from 'node:assert/strict';
import { searchLawNotes } from '../dist/legal-search.js';
const notes = [
  { id: '1', subject: '民法物權', title: '物權法定原則', statute: '民法第757條', body: '物權不得任意創設', tags: ['期中考'], examPriority: 5 },
  { id: '2', subject: '刑法分則', title: '竊盜罪', statute: '刑法第320條', body: '他人動產' },
  { id: '3', subject: '民法物權', title: '動產交付', body: '物權變動' },
];
test('empty queries return no results', () => assert.deepEqual(searchLawNotes(notes, '  '), []));
test('Chinese term matches title', () => assert.equal(searchLawNotes(notes, '物權')[0].note.id, '1'));
test('NFKC normalization matches fullwidth digits', () => assert.equal(searchLawNotes(notes, '７５７')[0].note.id, '1'));
test('AND query matches across fields', () => assert.equal(searchLawNotes(notes, '物權 757').length, 1));
test('subject filter excludes other subjects', () => assert.equal(searchLawNotes(notes, '動產', {subject:'刑法分則'}).length, 1));
test('limit truncates results', () => assert.equal(searchLawNotes(notes, '物權', {limit:1}).length, 1));
test('missing optional fields are handled', () => assert.equal(searchLawNotes(notes, '竊盜').length, 1));

const articleNotes = [
  { id: 'a', subject: '民法物權', title: '繼承登記', statute: '民法第759條', body: '非法律行為取得' },
  { id: 'b', subject: '民法物權', title: '登記推定', statute: '民法第759條之1', body: '善意第三人' },
  { id: 'c', subject: '民法物權', title: '測試其他增訂條', statute: '民法第759條之10', body: '僅供編號測試' },
  { id: 'd', subject: '測試', title: '另一引用寫法', statute: '§759-1', body: '相同條號' },
];
const ids = query => searchLawNotes(articleNotes, query).map(hit => hit.note.id);
test('base article does not collide with inserted article', () => {
  assert.deepEqual(ids('第759條'), ['a']);
  assert.deepEqual(ids('§759'), ['a']);
  assert.deepEqual(ids('第759條之1'), ['b', 'd']);
  assert.deepEqual(ids('第759條之10'), ['c']);
});
test('inserted article accepts canonical, section and bare shorthand', () => {
  for (const query of ['§759-1', '759-1', '７５９－１']) {
    assert.deepEqual(ids(query), ['b', 'd'], query);
  }
});
test('law name and attached inserted article use AND semantics', () => {
  assert.deepEqual(ids('民法759-1'), ['b']);
  assert.deepEqual(ids('民法第759條之1'), ['b']);
  assert.deepEqual(ids('民法第759條'), ['a']);
});
test('non-finite limits cannot bypass the default result cap', () => {
  assert.equal(searchLawNotes(notes, '物權', {limit: Number.NaN}).length, 2);
  assert.equal(searchLawNotes(notes, '物權', {limit: Number.POSITIVE_INFINITY}).length, 2);
});
