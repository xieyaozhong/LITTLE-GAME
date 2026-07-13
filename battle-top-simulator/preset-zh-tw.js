/* Traditional Chinese preset names */
(() => {
 const ZH_NAMES={
  custom:{name:'自訂陀螺',label:'自訂陀螺'},
  shark:{name:'鯊魚鱗',label:'鯊魚鱗｜Shark Scale'},
  wizard:{name:'神杖',label:'神杖｜Wizard Rod'},
  aero:{name:'藍空力',label:'藍空力｜Aero Pegasus'},
  dran:{name:'龍擊',label:'龍擊｜Dran Strike'},
  cobalt:{name:'蒼鈷龍騎',label:'蒼鈷龍騎｜Cobalt Dragoon'},
  silver:{name:'銀狼',label:'銀狼｜Silver Wolf'},
  meteor:{name:'流星龍騎',label:'流星龍騎｜Meteor Dragoon'},
  phoenixT1:{name:'鳳凰翼',label:'[T1] 鳳凰翼｜Phoenix Wing'},
  tyrannoT1:{name:'暴龍擊',label:'[T1] 暴龍擊｜Tyranno Beat'},
  knightT1:{name:'騎士鎧甲',label:'[T1.5] 騎士鎧甲｜Knight Mail'},
  whaleT1:{name:'鯨浪',label:'[T1.5] 鯨浪｜Whale Wave'},
  golemT1:{name:'魔像岩',label:'[T1.5] 魔像岩｜Golem Rock'},
  rodBreaker:{name:'弒杖獠牙',label:'[神杖剋星] 弒杖獠牙｜Rod Breaker'},
  woodenSage:{name:'傳統木陀螺',label:'[自訂剋星] 傳統木陀螺｜Traditional Wooden Top'}
 };

 Object.entries(ZH_NAMES).forEach(([key,zh])=>{
  if(!metaPresets[key])return;
  metaPresets[key].englishName=metaPresets[key].englishName||metaPresets[key].name;
  metaPresets[key].name=zh.name;
  metaPresets[key].label=zh.label;
 });

 ['p1','p2'].forEach(id=>{
  const preset=cfg[id]?.preset;
  if(preset&&metaPresets[preset]){
   const launchPoint=cfg[id].launchPoint;
   cfg[id]={...metaPresets[preset],preset};
   if(launchPoint)cfg[id].launchPoint=launchPoint;
  }
  renderPanel(id);
 });

 document.querySelector('#n1').textContent=cfg.p1.name;
 document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='陀螺選項已更新為中文名稱；新增「傳統木陀螺」，專門制衡高數值自訂陀螺。';
})();
