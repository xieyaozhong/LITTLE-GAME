/* Chrono name override: rename the time-stop top without changing its internal key or mechanics */
(() => {
 const KEY='chronoClockEmperor';
 const LEGACY_NAMES=['時界鐘皇','Chrono Clock Emperor','零時帝輪','Zero Hour Emperor'];
 const NAME_ZH='克羅納斯';
 const NAME_EN='Cronus';
 const LABEL=`[SPECIAL] ${NAME_ZH}｜${NAME_EN}`;

 function renameText(value){
  return LEGACY_NAMES.reduce((text,name)=>text.replaceAll(name,name.includes(' ')||/^[A-Za-z]/.test(name)?NAME_EN:NAME_ZH),String(value));
 }
 function renameConfig(c){
  if(!c||(!c.timeStopEngine&&c.preset!==KEY))return;
  c.name=NAME_ZH;
  c.englishName=NAME_EN;
  c.label=LABEL;
 }

 if(metaPresets?.[KEY])renameConfig(metaPresets[KEY]);
 if(typeof cfg==='object'){
  renameConfig(cfg.p1);
  renameConfig(cfg.p2);
 }
 if(Array.isArray(tops))tops.forEach(top=>renameConfig(top?.c||top));

 const previousAddLog=addLog;
 addLog=function(message){return previousAddLog(renameText(message))};

 document.querySelectorAll('option').forEach(option=>{
  if(option.value===KEY||LEGACY_NAMES.some(name=>option.textContent.includes(name)))option.textContent=LABEL;
 });

 ['p1','p2'].forEach(id=>{
  if(cfg?.[id]?.timeStopEngine&&typeof renderPanel==='function')renderPanel(id);
  const nameNode=document.querySelector(id==='p1'?'#n1':'#n2');
  if(nameNode&&cfg?.[id]?.timeStopEngine)nameNode.textContent=NAME_ZH;
 });

 const log=document.querySelector('#log');
 if(log)log.textContent=renameText(log.textContent);
 document.documentElement.dataset.chronoDisplayName='cronus-v2';
})();
