const TOOLKIT_KEY='larry-law-toolkit-draft-v1';
const toolEsc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderResources(selected='all'){
 document.querySelector('#resources').innerHTML=window.LAW_STUDY_RESOURCES.filter(r=>selected==='all'||r.id===selected).map(r=>`<article><h3>${toolEsc(r.name)}</h3><div class="resource-links">${r.sources.map(s=>`<a href="${toolEsc(s.url)}" target="_blank" rel="noopener noreferrer">${toolEsc(s.title)} ↗</a>`).join('')}</div><p><b>閱讀路線</b></p><ul>${r.steps.map(t=>`<li>${toolEsc(t)}</li>`).join('')}</ul><p class="muted">${toolEsc(r.prompt)}</p></article>`).join('');
}
const subjectSelect=document.querySelector('#subject');
subjectSelect.innerHTML+=window.LAW_STUDY_RESOURCES.map(r=>`<option value="${toolEsc(r.id)}">${toolEsc(r.name)}</option>`).join('');
subjectSelect.addEventListener('change',e=>renderResources(e.target.value));
const draftText=document.querySelector('#draftText'),draftStatus=document.querySelector('#draftStatus');
try{draftText.value=localStorage.getItem(TOOLKIT_KEY)||'';}catch{draftStatus.textContent='瀏覽器儲存空間無法讀取，請使用文字備份。';}
document.querySelector('#saveDraft').addEventListener('click',()=>{try{localStorage.setItem(TOOLKIT_KEY,draftText.value);draftStatus.textContent='已儲存在這個瀏覽器。';}catch{draftStatus.textContent='儲存失敗，請下載文字備份。';}});
draftText.addEventListener('input',()=>{draftStatus.textContent='尚有未儲存的變更。';});
document.querySelector('#exportDraft').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([draftText.value],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='LEX-NEXUS-申論草稿.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);draftStatus.textContent='已要求下載；請確認瀏覽器的下載結果。';});
document.querySelector('#printToolkit').addEventListener('click',()=>window.print());
renderResources();
