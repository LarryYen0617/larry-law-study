/* Larry Law Study visual foundation: law-firm design is built in, not a palette option. */
(()=>{
 const base=document.currentScript?.src||location.href;
 for(const [file,version] of [['law-firm.css','20261105-integrated1'],['rebuild.css','20261105-rebuild1']]){
  const link=document.createElement('link');link.rel='stylesheet';link.href=new URL(file+'?v='+version,base).href;document.head.append(link);
 }
 document.documentElement.dataset.palette='lawfirm';
 try{localStorage.removeItem('lex-nexus-palette-v2');}catch{}
})();
