/* Pure, bounded append: never replace existing writing or silently truncate. */
(()=>{
 function text(template){return '# '+template.title+'｜申論模板\n\n'+template.steps.map(s=>s.heading+'\n'+s.text).join('\n\n');}
 function append(existing,template,limit){const block=text(template),old=String(existing||'');if(old.includes(block))return {value:old,duplicate:true};const value=old+(old.trim()?'\n\n── 附加模板 ──\n\n':'')+block;if(value.length>limit)throw Error('草稿將超過字數上限，請改用下載模板。');return {value,duplicate:false};}
 const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function argument(t){const a=t.argument;if(!a)return '';return `<section class="essay-argument"><h4>本題正反論證</h4><div class="deep-table"><table><thead><tr><th>論證步驟</th><th>本題內容</th></tr></thead><tbody>${[['可能反對',a.objection],['本文採取理由',a.response],['涵攝關鍵事實',a.keyFacts],['變式與界線',a.boundary]].map(([k,v])=>`<tr><th scope="row">${E(k)}</th><td>${E(v)}</td></tr>`).join('')}</tbody></table></div><p class="muted">以上是本題自編對照論證；具名學說與裁判見解另於「學理爭點與實務」附來源。</p></section>`;}
 function answer(t){return '# '+t.title+'｜完整自編擬答\n\n'+t.example.facts+'\n\n'+t.example.answer.join('\n\n')+'\n\n## 法源\n'+(t.references||[]).map(r=>r.label+' '+r.url).join('\n');}
 window.LEX_ESSAY_HELPERS={text,append,argument,answer};
})();
