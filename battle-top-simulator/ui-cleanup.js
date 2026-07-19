/* Clean initial interface: hide release notes until real battle events appear */
(() => {
 const style=document.createElement('style');
 style.textContent='#log:empty{display:none}';
 document.head.appendChild(style);
 const log=document.querySelector('#log');
 if(log)log.textContent='';
})();
