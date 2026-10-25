/* State schema shared by the practice workspace and full-backup restore. */
(()=>{
 const key='lex-nexus-essay-practice-v1',fields=['issue','rule','debate','application','conclusion'],labels=['爭點定位','法律規範','爭議與反面論證','具體涵攝','結論與效果'];
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x),id=x=>typeof x==='string'&&/^personal-[a-z0-9-]{1,120}$/.test(x),date=x=>typeof x==='string'&&/^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
 function empty(){return {version:1,entries:{},lastCase:'',timer:null};}
 function entry(){return {sections:Object.fromEntries(fields.map(k=>[k,''])),checks:Object.fromEntries(fields.map(k=>[k,false])),updatedAt:new Date().toISOString(),completedAt:null};}
 function valid(s){if(!object(s)||s.version!==1||!object(s.entries)||Object.keys(s.entries).length>300||s.lastCase!==''&&!id(s.lastCase))return false;let total=0;for(const [k,e] of Object.entries(s.entries)){if(!id(k)||!object(e)||!object(e.sections)||!object(e.checks)||Object.keys(e.sections).length!==5||Object.keys(e.checks).length!==5||!date(e.updatedAt)||e.completedAt!==null&&!date(e.completedAt))return false;for(const f of fields){if(typeof e.sections[f]!=='string'||e.sections[f].length>6000||typeof e.checks[f]!=='boolean')return false;total+=e.sections[f].length;}}if(total>2000000)return false;const t=s.timer;if(t!==null&&(!object(t)||!id(t.topicId)||typeof t.running!=='boolean'||!Number.isFinite(t.remainingMs)||t.remainingMs<0||t.remainingMs>14400000||t.running&&(!Number.isFinite(t.deadline)||t.deadline<946684800000||t.deadline>4102444800000)||!t.running&&t.deadline!==null))return false;return true;}
 const remaining=(t,now=Date.now())=>!t?0:Math.max(0,t.running?t.deadline-now:t.remainingMs);
 function start(topicId,minutes,now=Date.now()){if(!id(topicId)||![15,30,60].includes(minutes))throw Error('計時設定不符');return {topicId,running:true,remainingMs:minutes*60000,deadline:now+minutes*60000};}
 const pause=(t,now=Date.now())=>({...t,running:false,remainingMs:remaining(t,now),deadline:null});
 function resume(t,now=Date.now()){if(!t||t.running||remaining(t,now)<=0)throw Error('請重新開始計時');return {...t,running:true,deadline:now+t.remainingMs};}
 function save(storage,s,expected){if(!valid(s))throw Error('練習紀錄格式不符。');if(storage.getItem(key)!==expected)throw Error('另一個分頁已更新紀錄，請先備份本頁。');const raw=JSON.stringify(s);storage.setItem(key,raw);return raw;}
 const content=e=>e&&fields.some(f=>e.sections[f].trim()),checks=e=>e?fields.filter(f=>e.checks[f]).length:0;
 function markdown(topic,e){return '# '+topic.title+'｜我的申論作答\n\n'+topic.example.facts+'\n\n'+fields.map((f,i)=>'## '+labels[i]+'\n\n'+(e?.sections[f]||'（尚未作答）')).join('\n\n')+'\n\n## 自我檢核\n\n'+fields.map((f,i)=>'- ['+(e?.checks[f]?'x':' ')+'] '+labels[i]).join('\n')+'\n\n本紀錄是自行作答與自評，不是自動法律評分。\n';}
 window.LEX_PRACTICE={key,fields,labels,empty,entry,valid,id,remaining,start,pause,resume,save,content,checks,markdown};
})();
