const audit=window.LEX_COVERAGE,ae=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.getElementById('auditScope').textContent=audit.scope;
document.getElementById('coverageTable').innerHTML='<thead><tr><th>科目</th><th>筆記單元</th><th>已整理</th><th>仍待補足</th></tr></thead><tbody>'+audit.subjects.map(s=>`<tr><td><a href="essentials.html?v=20261024-audit11&amp;subject=${ae(s.id)}">${ae(s.name)}</a></td><td>${s.units}</td><td>${ae(s.covered)}</td><td>${ae(s.gaps)}</td></tr>`).join('')+'</tbody>';
document.getElementById('auditChanges').innerHTML=audit.changes.map(c=>`<article><h3>${ae(c.title)}</h3><p>${ae(c.detail)}</p></article>`).join('');
document.getElementById('auditSources').innerHTML=audit.sources.map(s=>`<article><h3>${ae(s.name)}</h3><p>${ae(s.status)}</p></article>`).join('');

const verification=window.LEX_VERIFICATION;
if(verification){const box=document.getElementById('verificationSummary');box.innerHTML=`<p>查核日期：${ae(verification.checkedAt)}</p><ul><li>${verification.statuteSnapshots}條筆記法條快照已更新。</li><li>${verification.quoteQuestionsMatched}題法條填空逐字比對相符。</li><li>${verification.citationTextComparisonsMatched}處題庫法源引文完成比對。</li></ul><p>${ae(verification.correction)}</p><p>${ae(verification.scope)}</p>`;}
