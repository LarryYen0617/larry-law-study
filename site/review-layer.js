/* Apply checked revisions after immutable archive imports, before the reader. */
(()=>{
 const c=window.LEX_LIBRARY;if(!c)return;
 const revisions=new Map((window.LEX_QUESTION_CORRECTIONS||[]).map(x=>[x.id,x]));
 for(const q of c.questions){
  const r=revisions.get(q.id);
  if(r){q.originalVersion={question:q.question,options:[...q.options],answer:q.answer,explanations:[...q.explanations]};const {id,...fields}=r;Object.assign(q,fields);}
  q.status='source-checked';q.checkedAt='2026-10-24';q.currentReview='2026-10-24 AI法源對照';
 }
 const teacher=new Map((window.LEX_TEACHER_CORRECTIONS||[]).map(x=>[x.id,x]));
 for(const q of c.teacherQuestions){const r=teacher.get(q.id);if(r)q.correction=r;}
 const groups=new Map();
 for(const q of c.questions){const key=q.subject+'|'+q.topic;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(q);}
 for(const n of c.notes){
  const matches=groups.get(n.subject+'|'+n.topic);
  if(!n.archive||!matches)continue;
  n.originalPoints=[...n.points];n.sources=[...new Map(matches.flatMap(q=>q.sources||[]).map(s=>[s.url,s])).values()];
  n.points=[...new Set(matches.map(q=>q.explanations[q.answer]))];
  n.source='依對應練習題校訂解析彙整 · 2026-10-24';
 }
 const tables=[
  {match:'撤銷權」比較',headers:['項目','財產行為','身分行為'],rows:[['行使方式','原則依第116條以意思表示；第74、244條等另須法院裁判','婚姻撤銷依第989、991、995至997條請求法院；第990條已刪除'],['撤銷效果','第114條原則視為自始無效','婚姻依第998條不溯及既往；收養、終止收養依各自特別規定']],refs:['116','114','989','990','991','995','996','997','998']},
  {match:'解除婚約、婚姻無效',headers:['原因','財產損害','非財產損害'],rows:[['解除婚約（第977條）','無過失一方向有過失他方請求','被害人無過失始得請求相當金額'],['結婚無效、撤銷（第999條）','受損害者向有過失他方請求；與有過失另論','被害人無過失為要件'],['判決離婚（第1056條）','受損害者向有過失他方請求','被害人無過失為要件'],['前婚視為消滅（第988-1條）','無過失之前婚配偶向他方請求，義務人不以有過失為必要','被害人無過失始得請求']],refs:['977','999','1056','988-1']},
  {match:'一般代理與家務代理',headers:['比較','一般代理','日常家務代理'],rows:[['依據','第103條代理人在權限內以本人名義表示，直接對本人發生效力','第1003條夫妻互為日常家務代理人，先檢查是否日常家務'],['限制的對抗','第107條事後限制、撤回不得對抗善意且無過失第三人','第1003條限制不得對抗善意第三人，法條未另要求無過失'],['與家用債務的關係','一般代理規定不等於夫妻全部債務均連帶','家庭生活費所生債務另依第1003-1條連帶；內部分擔依經濟能力、家務等']],refs:['103','107','1003','1003-1']},
  {match:'婚姻無效與婚姻撤銷',headers:['項目','無效','得撤銷'],rows:[['法定事由','第988條：形式、禁婚、重婚；重婚另有善意無過失例外','第989條婚齡、第991條監護、第995條不能人道不能治、第996條無意識精神錯亂、第997條詐欺脅迫'],['時效與期間','不因經過六個月即自動有效','依各條分別：監護婚逾一年、不能治知悉逾三年、回復常態或發見詐欺等逾六個月；未成年另有成年、懷孕限制'],['效力','原則自始無效','第998條撤銷不溯及既往'],['財產與子女','第999、999-1條及親子身分另判','第999-1條第2項準用第1055、1055-1、1055-2、1057、1058條']],refs:['988','989','990','991','995','996','997','998','999','999-1']}
 ];
 for(const t of tables){const n=c.notes.find(n=>n.topic.includes(t.match));if(n){n.originalPoints=[...n.points];n.table=t;n.points=[];n.source='課堂比較表校訂 · 2026-10-24';n.sources=t.refs.map(no=>({title:'民法第'+no+'條',url:'https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=B0000001&flno='+no}));}}
 c.notice='';c.reviewDate='2026-10-24';
})();
