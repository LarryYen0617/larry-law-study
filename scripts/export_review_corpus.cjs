/* Export the same corrected corpus that the browser loads, not stale archives. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(process.argv[2],'Usage: node scripts/export_review_corpus.cjs OUTPUT.json');
const root=path.resolve(__dirname,'..'),site=path.join(root,'site'),context=vm.createContext({window:{},URL,console});
for(const match of fs.readFileSync(path.join(site,'library.html'),'utf8').matchAll(/<script src="([^"?]+)(?:\?[^" ]*)?"><\/script>/g)){
 if(match[1]==='library.js')break;
 vm.runInContext(fs.readFileSync(path.join(site,match[1]),'utf8'),context,{filename:match[1]});
}
const library=context.window.LEX_LIBRARY;
fs.writeFileSync(path.resolve(process.argv[2]),JSON.stringify([...library.questions,...library.teacherQuestions]));
console.log(JSON.stringify({questions:library.questions.length,teacherBlocks:library.teacherQuestions.length}));
