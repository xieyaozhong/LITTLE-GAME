/* Mirage Chameleon: irregular phase-cloak evasion + Sky Pouncer balance patch */
(() => {
 const PHASE_KEY='mirageChameleon';
 const MIRAGE_CHAMELEON={
  label:'[SPECIAL] 幻霧變色龍｜Mirage Chameleon',
  name:'幻霧變色龍',englishName:'Mirage Chameleon',
  combo:'5-80 Phase Orb',
  rank:'不定期相位隱形・無碰撞迴避',tier:'SPECIAL',type:'balance',
  a:70,d:84,s:86,w:77,b:91,spin:'L',shape:'mirageChameleon',
  phaseCloak:true,
  primary:'#7df9e7',secondary:'#7658ff',accent:'#f4ffff',metal:'#cfd8e8'
 };

 // 稍微弱化天墜獵鷹：降低基本數值，並延長每次躍襲之間的空窗。
 const FALCON_BALANCE={a:88,d:68,s:72,w:76,b:86};
 if(metaPresets.skyPouncer)Object.assign(metaPresets.skyPouncer,FALCON_BALANCE);
 if(cfg.p2?.preset==='skyPouncer')Object.assign(cfg.p2,FALCON_BALANCE);
 metaPresets[PHASE_KEY]=MIRAGE_CHAMELEON;

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.phaseCloak)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box phase-cloak-ability';
  ability.innerHTML='<strong>幻霧相位機構</strong>會在不固定時間進入短暫隱形。隱形期間無法被鎖定或受到碰撞與特殊攻擊，但自身也不能攻擊，並會消耗少量角速度。<div class="combo-tags"><span>隨機隱形</span><span>無敵迴避</span><span>不可攻擊</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 function teamOf(top){return top?.teamIndex??(top?.index?1:0)}
 function validTarget(top){return !!top&&!top.out&&!top.burst&&!top.phaseInvisible&&top.energy>0}
 function nearestVisibleEnemy(source){
  let best=null,bestDistance=Infinity;
  tops.forEach(other=>{
   if(other===source||teamOf(other)===teamOf(source)||!validTarget(other))return;
   const distance=mag(other.x-source.x,other.y-source.y);
   if(distance<bestDistance){best=other;bestDistance=distance}
  });
  return best;
 }
 function schedulePhase(top,first=false){
  const fatigue=clamp((48-top.energy)/48,0,1);
  top.phaseCooldown=(first?rnd(2.5,5.2):rnd(3.7,7.2))+fatigue*1.25;
 }
 function softenSkyVictim(victim,before,factor=.78){
  if(!victim||!before)return;
  victim.vx=before.vx+(victim.vx-before.vx)*factor;
  victim.vy=before.vy+(victim.vy-before.vy)*factor;
  victim.omega=before.omega+(victim.omega-before.omega)*factor;
  victim.spin=victim.omega;
  victim.energy=before.energy+(victim.energy-before.energy)*factor;
  victim.tiltVel=before.tiltVel+(victim.tiltVel-before.tiltVel)*factor;
  victim.lift=before.lift+(victim.lift-before.lift)*factor;
  victim.impactBoost=before.impactBoost+(victim.impactBoost-before.impactBoost)*factor;
  victim.burstMeter=before.burstMeter+(victim.burstMeter-before.burstMeter)*factor;
 }
 function snapshot(top){
  if(!top)return null;
  return {vx:top.vx,vy:top.vy,omega:top.omega,energy:top.energy,tiltVel:top.tiltVel,lift:top.lift||0,impactBoost:top.impactBoost||0,burstMeter:top.burstMeter||0};
 }

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.phaseInvisible=false;
   this.phaseTimer=0;
   this.phaseCooldown=999;
   this.phasePulse=0;
   this.phaseCount=0;
   this.balanceSeenJumpCount=this.skyJumpCount||0;
   if(data.phaseCloak)schedulePhase(this,true);
   if(data.skyPouncer)this.skyJumpCooldown+=.65;
  }
  beginPhase(){
   if(!this.c.phaseCloak||this.phaseInvisible||this.out||this.burst)return;
   this.phaseInvisible=true;
   this.phaseTimer=rnd(.82,1.38);
   this.phasePulse=1;
   this.phaseCount++;
   this.trail=[];
   this.omega*=.985;this.spin=this.omega;
   emit(this.x,this.y,this.c.primary,22,.62,'streak');
   wave(this.x,this.y,this.c.accent,42);
   addLog(`${this.c.name} 啟動「幻霧相位」，暫時從碰撞層消失！`);
  }
  endPhase(){
   if(!this.phaseInvisible)return;
   this.phaseInvisible=false;
   this.phaseTimer=0;
   schedulePhase(this,false);
   this.rimCooldown=Math.max(this.rimCooldown,.14);
   this.xDashCooldown=Math.max(this.xDashCooldown,.20);
   emit(this.x,this.y,this.c.secondary,18,.55,'streak');
   wave(this.x,this.y,this.c.primary,34);
   addLog(`${this.c.name} 解除隱形，重新進入實體碰撞狀態。`);
  }
  update(dt,opponent){
   const target=opponent?.phaseInvisible?nearestVisibleEnemy(this):opponent;
   const directSkyTarget=this.c.skyPouncer&&validTarget(target)?target:null;
   const targetBefore=directSkyTarget?snapshot(directSkyTarget):null;
   const jumpBefore=this.skyJumpCount||0;

   super.update(dt,target?.phaseInvisible?null:target);

   // 若落地時直接觸發獵鷹傷害，回復約 22% 的衝擊效果。
   if(this.c.skyPouncer&&(this.skyJumpCount||0)>jumpBefore&&this.skyDiveImpact===0&&directSkyTarget){
    softenSkyVictim(directSkyTarget,targetBefore,.78);
   }
   if(this.c.skyPouncer&&(this.skyJumpCount||0)>this.balanceSeenJumpCount){
    this.balanceSeenJumpCount=this.skyJumpCount||0;
    this.skyJumpCooldown+=.75;
   }

   if(!this.c.phaseCloak||this.out||this.burst)return;
   this.phasePulse+=dt*(this.phaseInvisible?7:2.2);
   if(this.phaseInvisible){
    this.phaseTimer-=dt;
    this.omega*=Math.exp(-.032*dt);this.spin=this.omega;
    this.trail=[];
    if(this.phaseTimer<=0||Math.abs(this.omega)<10||this.energy<15)this.endPhase();
    return;
   }
   if(this.energy>24&&Math.abs(this.omega)>15){
    this.phaseCooldown-=dt;
    if(this.phaseCooldown<=0)this.beginPhase();
   }
  }
  bladeCount(){return this.c.shape==='mirageChameleon'?6:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='mirageChameleon'){
    const profile=[1.05,.78,.94,.82,.99,.75];
    return this.r*profile[i%profile.length];
   }
   return super.bladeRadius(i);
  }
  draw(){
   if(this.out||this.burst)return;
   if(!this.c.phaseCloak||!this.phaseInvisible)return super.draw();

   // 隱形時只保留非常淡的空氣折射，讓玩家知道它仍在場上。
   const flicker=.055+.035*(.5+.5*Math.sin(this.phasePulse*2.1));
   ctx.save();
   ctx.translate(this.x,this.y);
   ctx.rotate(this.angle*.35);
   ctx.globalCompositeOperation='screen';
   ctx.globalAlpha=flicker;
   ctx.strokeStyle=this.c.accent;
   ctx.shadowBlur=16;ctx.shadowColor=this.c.primary;
   ctx.lineWidth=1.2;
   ctx.setLineDash([this.r*.22,this.r*.18]);
   ctx.beginPath();ctx.arc(0,0,this.r*.92,0,Math.PI*2);ctx.stroke();
   ctx.setLineDash([]);
   ctx.strokeStyle=this.c.primary;
   ctx.beginPath();ctx.arc(0,0,this.r*.53,0,Math.PI*2);ctx.stroke();
   ctx.restore();
  }
 };

 // 在獵鷹俯衝或一般碰撞之前攔截相位狀態；隱形雙方都不產生攻擊判定。
 const previousCollide=collide;
 collide=function(a,b){
  if(a?.phaseInvisible||b?.phaseInvisible)return;
  const aDive=!!(a?.c?.skyPouncer&&a.skyDiveImpact>0);
  const bDive=!!(b?.c?.skyPouncer&&b.skyDiveImpact>0);
  const beforeA=bDive?snapshot(a):null;
  const beforeB=aDive?snapshot(b):null;
  previousCollide(a,b);
  if(aDive&&a.skyDiveImpact===0&&beforeB)softenSkyVictim(b,beforeB,.78);
  if(bDive&&b.skyDiveImpact===0&&beforeA)softenSkyVictim(a,beforeA,.78);
 };

 const style=document.createElement('style');
 style.textContent='.phase-cloak-ability{border-color:#7df9e755;background:linear-gradient(135deg,#7df9e712,#7658ff18)}';
 document.head.appendChild(style);

 // 新陀螺預設放在紅方，獵鷹仍保留在選單中。
 cfg.p2={...MIRAGE_CHAMELEON,preset:PHASE_KEY};
 renderPanel('p1');renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;
 document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='「幻霧變色龍」已加入：它會不定期進入相位隱形，期間無法被鎖定或攻擊；天墜獵鷹的俯衝頻率與衝擊力也已稍微下修。';
})();