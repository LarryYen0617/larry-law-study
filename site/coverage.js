const audit=window.LEX_COVERAGE,ae=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.getElementById('auditScope').textContent=audit.scope;
document.getElementById('coverageTable').innerHTML='<thead><tr><th>科目</th><th>筆記單元</th><th>已整理</th><th>仍待補足</th></tr></thead><tbody>'+audit.subjects.map(s=>`<tr><td><a href="essentials.html?v=20261023-audit5&amp;subject=${ae(s.id)}">${ae(s.name)}</a></td><td>${s.units}</td><td>${ae(s.covered)}</td><td>${ae(s.gaps)}</td></tr>`).join('')+'</tbody>';
document.getElementById('auditChanges').innerHTML=audit.changes.map(c=>`<article><h3>${ae(c.title)}</h3><p>${ae(c.detail)}</p></article>`).join('');
document.getElementById('auditSources').innerHTML=audit.sources.map(s=>`<article><h3>${ae(s.name)}</h3><p>${ae(s.status)}</p></article>`).join('');
