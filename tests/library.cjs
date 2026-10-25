const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../site'),nodes={},events={},storage=new Map();
function node(id){return nodes[id]??=( {value:'',checked:false,innerHTML:'',textContent:'',addEventListener(k,f){this[k]=f;}});}
const context=vm.createContext({window:{},location:{hash:''},URL,Blob,setTimeout,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{getElementById:node,querySelectorAll:()=>[],addEventListener:(k,f)=>(events[k]??=[]).push(f),createElement:()=>({click(){}})}});
const html=fs.readFileSync(path.join(root,'library.html'),'utf8');
for(const match of html.matchAll(/<script src="([^?]+)\?[^\"]+"><\/script>/g))vm.runInContext(fs.readFileSync(path.join(root,match[1]),'utf8'),context);
const run=s=>vm.runInContext(s,context);const data=context.window.LEX_LIBRARY;
assert.equal(data.questions.length,1770);assert.equal(data.teacherQuestions.length,91);assert.equal(new Set(data.questions.map(q=>q.id)).size,1770);
assert.equal(data.notes.length,1016);assert.equal(data.sources.filter(q=>!q.duplicateOf&&q.name.endsWith('.pdf')).length,19);
for(const q of data.questions){assert.equal(q.options.length,4);assert(q.answer>=0&&q.answer<4);assert.equal(q.explanations.length,4);assert(q.archiveFile&&q.currentReview);}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'../content/library-index.json'),'utf8'));
for(const [name,hash] of Object.entries(manifest.files))assert.equal(require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n/g,'\n')).digest('hex'),hash);
assert(node('items').innerHTML.includes('重點整理'));assert.equal((node('items').innerHTML.match(/<article>/g)||[]).length,12);
node('subject').value='刑法總則';node('subject').change();assert(!node('items').innerHTML.includes('民法總則'));
function click(dataset){events.click.forEach(f=>f({target:{closest:()=>({dataset})}}));}
click({mode:'questions'});assert(node('status').textContent.includes('260'));
const q=data.questions.find(q=>q.subject==='刑法總則');click({answer:q.id,choice:String((q.answer+1)%4)});assert(!node('items').innerHTML.includes('待本次複核'));assert(storage.has('lex-nexus-library-v1'));assert(!storage.has('larry-law-midterm-v1'));
node('wrong').checked=true;node('wrong').change();assert(node('status').textContent.includes('找到 1 題'));
click({retry:q.id});assert(node('status').textContent.includes('找到 0 題'));
node('subject').value='';click({mode:'teacher'});assert(node('items').innerHTML.includes('教師原附擬答'));assert(!node('items').innerHTML.includes('data-answer'));
node('search').value='<script>';node('search').input();assert(!node('items').innerHTML.includes('<script>'));
assert.equal(run('escapeText("<img onerror=1>")'),'&lt;img onerror=1&gt;');assert.equal(run('refs([{url:"javascript:alert(1)",title:"bad"}])'),'');
console.log('PASS: archive counts and deduplication, 91 source-mapped teacher blocks, pagination, course/search filters, corrected-answer display, retry, storage isolation and escaping.');

// A pre-correction choice is retained in storage but cannot be silently graded against rewritten options.
run("libraryState.answers['gem-1-46']=0;delete libraryState.answerRevisions['gem-1-46']");assert.equal(run("currentAnswer(corpus.questions.find(q=>q.id==='gem-1-46'))"),undefined);assert.equal(run("libraryState.answers['gem-1-46']"),0);click({answer:'gem-1-46',choice:'2'});assert.equal(run("currentAnswer(corpus.questions.find(q=>q.id==='gem-1-46'))"),2);assert.equal(run("libraryState.answerRevisions['gem-1-46']"),'2026-10-24');

nodes.search.value='';nodes.subject.value='';nodes.wrong.checked=false;run("targetItem='core-001';mode='questions';pageIndex=0;renderLibrary()");assert(nodes.status.textContent.includes('找到 1 題'));assert(nodes.items.innerHTML.includes('民事問題'));run("targetItem='note-0';mode='notes';renderLibrary()");assert(nodes.status.textContent.includes('找到 1 則筆記'));run("targetItem='teacher-eba1c1ab78636e7f';mode='teacher';renderLibrary()");assert(nodes.status.textContent.includes('找到 1 則課堂'));nodes.search.value='';nodes.search.input();assert(run('targetItem')==='');
