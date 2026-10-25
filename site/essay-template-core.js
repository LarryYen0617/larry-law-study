/* Pure, bounded append: never replace existing writing or silently truncate. */
(()=>{
 function text(template){return '# '+template.title+'｜申論模板\n\n'+template.steps.map(s=>s.heading+'\n'+s.text).join('\n\n');}
 function append(existing,template,limit){const block=text(template),old=String(existing||'');if(old.includes(block))return {value:old,duplicate:true};const value=old+(old.trim()?'\n\n── 附加模板 ──\n\n':'')+block;if(value.length>limit)throw Error('草稿將超過字數上限，請改用下載模板。');return {value,duplicate:false};}
 window.LEX_ESSAY_HELPERS={text,append};
})();
