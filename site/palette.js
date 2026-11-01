/* Visual preference only: never changes learning records. */
(()=>{
 const key='lex-nexus-palette-v1',names={forest:'書院墨綠',navy:'典藏藏藍',gold:'曜石燙金',rose:'玫瑰書箋'};
 function apply(value){const id=Object.hasOwn(names,value)?value:'forest';document.documentElement.dataset.palette=id;document.querySelectorAll('[data-palette-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paletteChoice===id)));return id;}
 let initial='forest';try{initial=localStorage.getItem(key)||initial;}catch{}apply(initial);
 const css=document.createElement('link');css.rel='stylesheet';css.href=document.currentScript?.src?new URL('palette.css?v=20261026-palette26',document.currentScript.src).href:'palette.css?v=20261026-palette26';document.head.append(css);const campus=document.createElement('link');campus.rel='stylesheet';campus.href=document.currentScript?.src?new URL('campus.css?v=20261102',document.currentScript.src).href:'campus.css?v=20261102';document.head.append(campus);
 window.addEventListener('storage',e=>{if(e.key===key)apply(e.newValue);});
 if(new URL(location.href).searchParams.get('embed')==='1')return;
 const open=document.createElement('button');open.type='button';open.className='palette-open';open.textContent='◈ 配色';open.setAttribute('aria-haspopup','dialog');
 const dialog=document.createElement('dialog');dialog.className='palette-dialog';dialog.setAttribute('aria-labelledby','paletteTitle');dialog.innerHTML='<h2 id="paletteTitle">選擇工作室配色</h2><p>整站套用，下次開啟也會保留。</p><div class="palette-options">'+Object.entries(names).map(([id,name])=>'<button type="button" data-palette-choice="'+id+'"><span class="palette-swatch swatch-'+id+'" aria-hidden="true"></span>'+name+'</button>').join('')+'</div><p id="paletteStatus" role="status"></p><button type="button" class="palette-close">完成</button>';
 document.body.append(open,dialog);apply(initial);open.onclick=()=>dialog.showModal();dialog.querySelector('.palette-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>open.focus());
 dialog.addEventListener('click',e=>{const b=e.target.closest('[data-palette-choice]');if(!b)return;const id=apply(b.dataset.paletteChoice);try{localStorage.setItem(key,id);dialog.querySelector('#paletteStatus').textContent='已套用：'+names[id];}catch{dialog.querySelector('#paletteStatus').textContent='已套用；瀏覽器無法儲存偏好，下次開啟需重新選擇。';}document.querySelectorAll('iframe').forEach(f=>{try{f.contentWindow.dispatchEvent(new StorageEvent('storage',{key,newValue:id}));}catch{}});});
})();
