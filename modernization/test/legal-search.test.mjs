import test from 'node:test';
import assert from 'node:assert/strict';
import { searchLawNotes } from '../src/legal-search.mjs';
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
