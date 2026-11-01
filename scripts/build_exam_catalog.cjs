const fs=require('fs'),vm=require('vm');
const read=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''),catalog=JSON.parse(read('content/course-catalog.json')),source=JSON.parse(read('content/exam-catalog.json'));
const ctx={window:{},URL,console};vm.createContext(ctx);
for(const m of read('site/library.html').matchAll(/<script src="([^"?]+)(?:\?[^" ]*)?"><\/script>/g)){if(m[1]==='library.js')break;vm.runInContext(read('site/'+m[1]),ctx,{filename:m[1]});}
const output={updatedAt:source.updatedAt,notice:source.notice,courses:catalog.courses.map(c=>{
 const extra=source.courses[c.id]||{},questions=ctx.window.LEX_LIBRARY.questions.filter(q=>(q.subject==='債編總論'?'債權':q.subject)===c.name||q.subject===c.id);
 return {id:c.id,name:c.name,group:c.group,description:c.description,reading:c.reading,practice:'questions.html?view=choice&subject='+encodeURIComponent(c.name),essay:c.essay,practiceCount:questions.length,midterm:extra.midterm||[],final:extra.final||[],unassigned:extra.unassigned||[],materials:c.materials};
})};
// Inheritance exists in the imported question bank, independently of the eleven course outlines.
output.courses.push({id:'inheritance',name:'繼承法',group:'題庫專題',description:'既有題庫專題，未取得本學期課綱',reading:'questions.html?view=choice&subject='+encodeURIComponent('繼承法'),readingLabel:'題庫專題',practice:'questions.html?view=choice&subject='+encodeURIComponent('繼承法'),essay:'questions.html?view=choice&subject='+encodeURIComponent('繼承法'),essayLabel:'查看解析',practiceCount:ctx.window.LEX_LIBRARY.questions.filter(q=>q.subject==='繼承法').length,midterm:[],final:[],unassigned:[],materials:[]});
for(const c of output.courses)for(const item of [...c.midterm,...c.final,...c.unassigned]){const [file,fragment]=item.href.split('#');if(!fs.existsSync('site/'+file.split('?')[0]))throw Error('Missing exam destination '+item.href);if(fragment&&!read('site/'+file.split('?')[0]).includes(`id="${fragment}"`))throw Error('Missing anchor '+item.href);}
fs.writeFileSync('site/exam-data.js','window.LEX_EXAMS='+JSON.stringify(output)+';\n');
console.log('Exam catalog:',output.courses.length,'courses;',output.courses.filter(c=>c.midterm.length).length,'with midterm evidence;',output.courses.filter(c=>c.final.length).length,'with final evidence');
