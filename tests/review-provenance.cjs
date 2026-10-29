const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const questions=[{id:'pending',status:'pending',options:['a'],explanations:['a'],subject:'test',topic:'test'},
 {id:'old',status:'reviewed',checkedAt:'2025-01-01',options:['a'],explanations:['a'],subject:'test',topic:'test'},
 {id:'corrected',status:'pending',options:['a'],explanations:['a'],subject:'test',topic:'test'}];
const window={LEX_LIBRARY:{questions,teacherQuestions:[],notes:[]},LEX_QUESTION_CORRECTIONS:[{id:'corrected',checkedAt:'2026-10-29',reviewNote:'explicit correction'}]};
vm.runInNewContext(fs.readFileSync('site/review-layer.js','utf8'),{window});
assert.equal(questions[0].status,'pending');assert.equal(questions[0].checkedAt,undefined);
assert.equal(questions[1].status,'reviewed');assert.equal(questions[1].checkedAt,'2025-01-01');
assert.equal(questions[2].status,'reviewed');assert.equal(questions[2].checkedAt,'2026-10-29');
assert(!questions.some(q=>q.status==='source-checked'));
console.log('PASS: loading a corpus never certifies untouched questions or invents review dates.');
