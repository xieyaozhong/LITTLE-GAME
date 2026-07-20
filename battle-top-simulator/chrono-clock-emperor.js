/* Chrono Clock Emperor V1: telegraphed arena time stop, reposition, and balanced release strike */
(() => {
 const CHRONO_KEY='chronoClockEmperor';
 const CHRONO_CLOCK={
  label:'[SPECIAL] 時界鐘皇｜Chrono Clock Emperor',
  name:'時界鐘皇',englishName:'Chrono Clock Emperor',
  combo:'12-80 Chrono Orb',
  rank:'零時領域・時停再定位',tier:'SPECIAL',type:'balance',
  a:77,d:82,s:85,w:80,b:90,spin:'L',shape:'chronoClock',
  timeStopEngine:true,
  primary:'#72e7ff',secondary:'#7d62ff',accent:'#fff3b8',metal:'#e5f1ff'
 };
 metaPresets[CHRONO_KEY]=CHRONO_CLOCK;

 const teamOf=top=>top?.teamIndex??(top?.index?1:0);
 const combatReady=top=>!!top&&!top.out&&!top.burst&&top.energy>0;
 const visibleInTime=top=>combatReady(top)&&!top.phaseInvisible&&!top.skyJumpGhost;
 const validEnemy=(source,target)=>visibleInTime(target)&&source!==target&&teamOf(source)!==teamOf(target);

 function nearestEnemy(source,preferred){
  if(validEnemy(source,preferred))return preferred;
  let best=null,bestScore=Infinity;
  tops.forEach(target=>{
   if(!validEnemy(source,target))return;
   const d=mag(target.x-source.x,target.y-source.y);
   const threat=(target.impactBoost||0)+mag(target.vx||0,target.vy||0)*.18;
   const score=d-threat*.10;
   if(score<bestScore){best=target;bestScore=score}
  });
  return best;
 }

 function freezeDuration(target,base){
  let factor=1;
  if(target.c?.type==='defense')factor*=.88;
  else if(target.c?.type==='stamina')factor*=.94;
  if(target.twinInheritanceMode==='guardian')factor*=.76;
  if(target.morphMode==='aegis')factor*=.80;
  if(target.swordState==='guard')factor*=.72;
  if(target.c?.timeStopEngine)factor*=.58;
  return clamp(base*factor,.38,1.02);
 }

 function freezeTarget(source,target,baseDuration){
  if(!validEnemy(source,target)||target.timeFrozenBy)return false;
  target.timeFrozenBy=source;
  target.timeFrozenTimer=freezeDuration(target,baseDuration);
  target.timeFreezePulse=1;
  target.timeFreezeStored={x:target.x,y:target.y,angle:target.angle};
  target.timeFreezeLabelTimer=target.timeFrozenTimer;
  target.xDashCooldown=Math.max(target.xDashCooldown||0,target.timeFrozenTimer+.15);
  target.rimCooldown=Math.max(target.rimCooldown||0,.12);
  emit(target.x,target.y,source.c.primary,24,.66,'streak');
  wave(target.x,target.y,source.c.secondary,44);
  return true;
 }

 function releaseTarget(target,source,reason=''){
  if(!target?.timeFrozenBy||target.timeFrozenBy!==source)return;
  target.timeFrozenBy=null;
  target.timeFrozenTimer=0;
  target.timeFreezeStored=null;
  target.timeFreezePulse=1;
  target.timeResumeGrace=.18;
  target.rimCooldown=Math.max(target.rimCooldown||0,.12);
  target.xDashCooldown=Math.max(target.xDashCooldown||0,.18);
  emit(target.x,target.y,target.c.primary||'#fff',18,.48,'streak');
  wave(target.x,target.y,source?.c?.primary||'#72e7ff',32);
  if(reason)addLog(`${target.c.name} ${reason}，重新回到時間流動中。`);
 }

 function releaseAll(source){
  tops.forEach(target=>releaseTarget(target,source));
 }

 function chronoDefenseScale(victim,guardReady=false){
  let scale=1;
  if(victim?.c?.type==='defense')scale*=.82;
  else if(victim?.c?.type==='stamina')scale*=.90;
  if(victim?.twinInheritanceMode==='guardian')scale*=.78;
  if(victim?.morphMode==='aegis')scale*=.70;
  if(guardReady||victim?.swordState==='guard')scale*=.48;
  if(victim?.c?.timeStopEngine)scale*=.78;
  return clamp(scale,.38,1);
 }

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.timeStopEngine)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box chrono-ability';
  ability.innerHTML='<strong>零時領域・時間停止</strong>經過明顯蓄力後，短暫停止所有可見敵人的時間，自己則能在停止期間重新定位。時間恢復時會發動「秒針破界」追擊；相位隱形、飛行與部分防禦姿態可免疫或縮短時停。<div class="combo-tags"><span>全敵時停</span><span>蓄力可打斷</span><span>停止期再定位</span><span>恢復後追擊</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.timeFrozenBy=null;
   this.timeFrozenTimer=0;
   this.timeFreezePulse=0;
   this.timeFreezeStored=null;
   this.timeFreezeLabelTimer=0;
   this.timeResumeGrace=0;
   this.chronoState='idle';
   this.chronoCooldown=data.timeStopEngine?rnd(4.2,6.4):999;
   this.chronoTimer=0;
   this.chronoPulse=0;
   this.chronoTarget=null;
   this.chronoFrozenCount=0;
   this.chronoRecovery=0;
   this.chronoOrbitAngle=0;
   this.chronoStrikeWindow=0;
   this.chronoStrikeHit=false;
   this.chronoCastInterrupted=false;
  }
  isChronoCaster(){return !!this.c.timeStopEngine}
  beginChronoCharge(target){
   if(!this.isChronoCaster()||this.chronoState!=='idle'||!target)return false;
   this.chronoState='charge';
   this.chronoTimer=rnd(.62,.88);
   this.chronoTarget=target;
   this.chronoPulse=1;
   this.chronoCastInterrupted=false;
   this.vx*=.76;this.vy*=.76;
   emit(this.x,this.y,this.c.accent,24,.68,'streak');
   wave(this.x,this.y,this.c.primary,52);
   addLog(`${this.c.name} 展開十二時刻環，開始凝聚「零時領域」！蓄力期間可被強碰撞或魅惑打斷。`);
   return true;
  }
  activateTimeStop(){
   const baseDuration=rnd(.78,1.02);
   let count=0;
   tops.forEach(target=>{if(freezeTarget(this,target,baseDuration))count++});
   if(!count){
    this.finishChrono(.88,true);
    addLog(`${this.c.name} 的零時領域未能捕捉可見敵人，時間能量提前消散。`);
    return;
   }
   this.chronoState='stop';
   this.chronoTimer=baseDuration;
   this.chronoFrozenCount=count;
   this.chronoOrbitAngle=Math.atan2(this.y-this.chronoTarget.y,this.x-this.chronoTarget.x);
   this.omega*=.972;this.spin=this.omega;
   this.tiltVel+=.025;
   emit(this.x,this.y,this.c.primary,54,1.08,'streak');
   emit(this.x,this.y,this.c.accent,28,.82);
   wave(this.x,this.y,this.c.secondary,outerR*.72);
   shake=Math.max(shake,8);flash=Math.max(flash,.34);
   addLog(`${this.c.name} 發動「零時領域」：${count} 個敵方陀螺的時間被短暫停止！`);
  }
  finishChrono(recovery=1.0,failed=false){
   releaseAll(this);
   this.chronoState='idle';
   this.chronoTimer=0;
   this.chronoStrikeWindow=0;
   this.chronoFrozenCount=0;
   this.chronoTarget=null;
   this.chronoRecovery=Math.max(this.chronoRecovery,recovery);
   this.chronoCooldown=rnd(6.4,9.2)+recovery*.45;
   this.chronoPulse=1;
   if(failed)this.omega*=.985;
  }
  cancelChrono(reason='受到控制干擾'){
   if(this.chronoState==='idle')return;
   releaseAll(this);
   this.chronoCastInterrupted=true;
   this.finishChrono(1.15,true);
   addLog(`${this.c.name} 的時停術式${reason}而崩解，對手取得反擊空窗！`);
  }
  updateFrozen(dt){
   const source=this.timeFrozenBy;
   this.timeFreezePulse=Math.max(0,this.timeFreezePulse-dt*1.15);
   this.timeFrozenTimer-=dt;
   this.timeFreezeLabelTimer=Math.max(0,this.timeFreezeLabelTimer-dt);
   if(this.timeFreezeStored){
    this.x=this.timeFreezeStored.x;
    this.y=this.timeFreezeStored.y;
    this.angle=this.timeFreezeStored.angle;
   }
   if(!combatReady(source)||source.chronoState!=='stop'||this.timeFrozenTimer<=0){
    releaseTarget(this,source,this.timeFrozenTimer<=0?'抵抗時停並提前恢復':'因施術者失去控制');
   }
  }
  updateChronoStop(dt){
   this.chronoTimer-=dt;
   let target=this.chronoTarget;
   if(!combatReady(target)||teamOf(target)===teamOf(this))target=nearestEnemy(this,null);
   this.chronoTarget=target;
   super.update(dt,null);
   if(target){
    this.chronoOrbitAngle+=dt*2.65*(Math.sign(this.omega)||1);
    const radius=this.r+target.r+42;
    const aimX=target.x+Math.cos(this.chronoOrbitAngle)*radius;
    const aimY=target.y+Math.sin(this.chronoOrbitAngle)*radius;
    const dx=aimX-this.x,dy=aimY-this.y,d=mag(dx,dy)||1;
    const desired=205,blend=clamp(dt*5.2,0,.30);
    this.vx+=(dx/d*desired-this.vx)*blend;
    this.vy+=(dy/d*desired-this.vy)*blend;
   }
   if(this.chronoTimer<=0){
    releaseAll(this);
    if(target&&combatReady(target)){
     this.chronoState='releaseCharge';
     this.chronoTimer=.12;
     this.chronoTarget=target;
     this.vx*=.62;this.vy*=.62;
     addLog(`${this.c.name} 解除零時領域，準備以「秒針破界」切入恢復瞬間！`);
    }else this.finishChrono(.92);
   }
  }
  launchChronoStrike(target){
   if(!validEnemy(this,target)){this.finishChrono(.90);return}
   const lead=.10,aimX=target.x+(target.vx||0)*lead,aimY=target.y+(target.vy||0)*lead;
   const dx=aimX-this.x,dy=aimY-this.y,d=mag(dx,dy)||1;
   const speed=clamp(276+(100-clamp(this.energy,0,100))*.34,276,310);
   this.chronoState='releaseRush';
   this.chronoTimer=.40;
   this.chronoStrikeWindow=.40;
   this.chronoStrikeHit=false;
   this.vx=dx/d*speed;this.vy=dy/d*speed;
   this.impactBoost=Math.max(this.impactBoost||0,82);
   emit(this.x,this.y,this.c.accent,28,.76,'streak');
   wave(this.x,this.y,this.c.primary,56);
  }
  update(dt,opponent){
   this.timeFreezePulse=Math.max(0,(this.timeFreezePulse||0)-dt*1.15);
   this.timeResumeGrace=Math.max(0,(this.timeResumeGrace||0)-dt);
   if(this.timeFrozenBy){this.updateFrozen(dt);return}

   super.update(dt,opponent);
   this.chronoPulse=Math.max(0,this.chronoPulse-dt*1.35);
   this.chronoRecovery=Math.max(0,this.chronoRecovery-dt);
   this.chronoStrikeWindow=Math.max(0,this.chronoStrikeWindow-dt);
   if(!this.isChronoCaster()||this.out||this.burst)return;
   if(this.charmedBy){this.cancelChrono('受到魅惑');return}
   if(this.phaseInvisible||this.skyJumpGhost){
    if(this.chronoState!=='idle')this.cancelChrono('因自身進入不穩定時相');
    return;
   }
   if(this.chronoState==='idle'){
    this.chronoCooldown-=dt;
    if(this.chronoRecovery>0){this.vx*=Math.exp(-.24*dt);this.vy*=Math.exp(-.24*dt);return}
    const target=nearestEnemy(this,opponent);
    if(this.chronoCooldown<=0&&this.energy>28&&Math.abs(this.omega)>17&&target)this.beginChronoCharge(target);
    return;
   }
   if(this.chronoState==='charge'){
    this.chronoTimer-=dt;
    this.vx*=Math.exp(-.58*dt);this.vy*=Math.exp(-.58*dt);
    if(this.chronoTimer<=0)this.activateTimeStop();
    return;
   }
   if(this.chronoState==='stop'){this.updateChronoStop(dt);return}
   if(this.chronoState==='releaseCharge'){
    this.chronoTimer-=dt;
    if(this.chronoTimer<=0)this.launchChronoStrike(this.chronoTarget);
    return;
   }
   if(this.chronoState==='releaseRush'){
    this.chronoTimer-=dt;
    if(this.chronoTimer<=0||this.chronoStrikeWindow<=0)this.finishChrono(this.chronoStrikeHit?.70:1.02);
   }
  }
  resolveChronoStrike(victim,nx,ny,guardReady=false){
   if(!this.isChronoCaster()||this.chronoState!=='releaseRush'||this.chronoStrikeWindow<=0||this.chronoStrikeHit||!validEnemy(this,victim))return false;
   const scale=chronoDefenseScale(victim,guardReady);
   const force=68*scale;
   victim.vx+=nx*force;victim.vy+=ny*force;
   victim.omega*=clamp(1-.052*scale,.90,.98);victim.spin=victim.omega;
   victim.energy=Math.max(0,victim.energy-5.2*scale);
   victim.tiltVel+=.13*scale/Math.max(.76,victim.tip?.stability||1);
   victim.lift=clamp((victim.lift||0)+.08*scale,0,1);
   victim.burstMeter=(victim.burstMeter||0)+4.8*scale;
   victim.impactBoost=Math.max(victim.impactBoost||0,66*scale);
   this.omega*=.982;this.spin=this.omega;
   this.chronoStrikeHit=true;
   this.chronoStrikeWindow=0;
   const cx=(this.x+victim.x)/2,cy=(this.y+victim.y)/2;
   emit(cx,cy,this.c.primary,30,.82,'streak');emit(cx,cy,this.c.accent,16,.60);
   wave(cx,cy,this.c.secondary,66);shake=Math.max(shake,7);flash=Math.max(flash,.22);
   if(guardReady||victim.swordState==='guard'){
    this.vx-=nx*34;this.vy-=ny*34;this.tiltVel+=.06;
    addLog(`${victim.c.name} 以格擋抓住時間恢復點，削弱「秒針破界」並反震時界鐘皇！`);
   }else if(scale<.68){
    addLog(`${victim.c.name} 以防禦結構承受時間恢復衝擊，保留反擊能力。`);
   }else addLog(`${this.c.name} 的「秒針破界」命中時間恢復瞬間！`);
   this.finishChrono(.72);
   return true;
  }
  bladeCount(){return this.c.shape==='chronoClock'?12:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='chronoClock'){
    const profile=[1.18,.78,.88,.74,1.02,.76,1.12,.77,.90,.73,1.00,.75];
    return this.r*profile[i%profile.length];
   }
   return super.bladeRadius(i);
  }
  draw(){
   super.draw();
   if(this.out||this.burst)return;
   if(this.timeFrozenBy){
    const source=this.timeFrozenBy,pulse=.5+.5*Math.sin(time*8.8),r=this.r*(1.34+pulse*.06);
    ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';ctx.rotate(-time*.22);
    ctx.shadowBlur=18;ctx.shadowColor=source?.c?.primary||'#72e7ff';ctx.strokeStyle=alpha(source?.c?.primary||'#72e7ff',.46+pulse*.24);ctx.lineWidth=1.7;
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<12;i++){const a=i*Math.PI/6,ri=r*.82,ro=r*1.12;ctx.beginPath();ctx.moveTo(Math.cos(a)*ri,Math.sin(a)*ri);ctx.lineTo(Math.cos(a)*ro,Math.sin(a)*ro);ctx.stroke()}
    ctx.rotate(time*.22);ctx.strokeStyle=alpha(source?.c?.accent||'#fff3b8',.72);ctx.lineWidth=2.2;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-r*.62);ctx.moveTo(0,0);ctx.lineTo(r*.48,0);ctx.stroke();ctx.restore();
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${Math.max(9,this.r*.31)}px system-ui`;ctx.shadowBlur=10;ctx.shadowColor=source?.c?.primary||'#72e7ff';ctx.fillStyle=alpha(source?.c?.accent||'#fff3b8',.88);ctx.fillText('時停',this.x,this.y-this.r*1.72);ctx.restore();
   }
   if(!this.isChronoCaster()||this.chronoState==='idle')return;
   const pulse=.5+.5*Math.sin(time*(this.chronoState==='stop'?4.2:8.2));
   ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';ctx.rotate(time*(this.chronoState==='stop'?-.36:1.05));
   ctx.shadowBlur=16;ctx.shadowColor=this.c.primary;ctx.strokeStyle=alpha(this.chronoState==='charge'?this.c.accent:this.c.primary,.34+pulse*.25);ctx.lineWidth=1.5;
   const radius=this.r*(1.30+pulse*.08);
   ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();
   for(let i=0;i<12;i++){const a=i*Math.PI/6,ri=radius*.78,ro=radius*(i%3===0?1.18:1.08);ctx.beginPath();ctx.moveTo(Math.cos(a)*ri,Math.sin(a)*ri);ctx.lineTo(Math.cos(a)*ro,Math.sin(a)*ro);ctx.stroke()}
   ctx.strokeStyle=alpha(this.c.accent,.62);ctx.lineWidth=2.1;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(-time*1.8)*radius*.65,Math.sin(-time*1.8)*radius*.65);ctx.moveTo(0,0);ctx.lineTo(Math.cos(time*.62)*radius*.47,Math.sin(time*.62)*radius*.47);ctx.stroke();ctx.restore();
   ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${Math.max(8,this.r*.28)}px system-ui`;ctx.shadowBlur=9;ctx.shadowColor=this.c.primary;ctx.fillStyle=alpha(this.c.accent,.84);ctx.fillText(this.chronoState==='stop'?'零時領域':this.chronoState==='releaseRush'?'秒針破界':'時刻蓄積',this.x,this.y-this.r*1.72);ctx.restore();
  }
 };

 function interruptChronoCharge(top,closing){
  if(!top?.c?.timeStopEngine||top.chronoState!=='charge'||closing<76)return;
  top.vx*=.76;top.vy*=.76;top.tiltVel+=.052;
  top.cancelChrono('被強碰撞打斷');
  emit(top.x,top.y,top.c.accent,18,.48,'streak');wave(top.x,top.y,top.c.primary,34);
 }

 const previousCollide=collide;
 collide=function(a,b){
  if(a?.timeFrozenBy||b?.timeFrozenBy)return;
  const protectedState=a?.phaseInvisible||b?.phaseInvisible||a?.skyJumpGhost||b?.skyJumpGhost||a?.charmedBy===b||b?.charmedBy===a;
  const same=teamOf(a)===teamOf(b),dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=(a.r||0)+(b.r||0);
  let contact=false,nx=0,ny=0,closing=0;
  if(!protectedState&&!same&&d&&d<min){nx=dx/d;ny=dy/d;closing=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny);contact=closing>0}
  const guardA=!!(a?.swordState==='guard'),guardB=!!(b?.swordState==='guard');
  previousCollide(a,b);
  if(!contact)return;
  interruptChronoCharge(a,closing);interruptChronoCharge(b,closing);
  a?.resolveChronoStrike?.(b,nx,ny,guardB);
  b?.resolveChronoStrike?.(a,-nx,-ny,guardA);
 };

 const previousArena=drawArenaBase;
 drawArenaBase=function(){
  previousArena();
  const active=tops.find(top=>top?.c?.timeStopEngine&&top.chronoState==='stop'&&!top.out&&!top.burst);
  if(!active)return;
  const pulse=.5+.5*Math.sin(time*3.8),cx=W/2,cy=H/2;
  ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=alpha(active.c.secondary,.055+.025*pulse);ctx.fillRect(0,0,W,H);
  ctx.translate(cx,cy);ctx.rotate(-time*.10);ctx.strokeStyle=alpha(active.c.primary,.16+.08*pulse);ctx.lineWidth=1.5;ctx.setLineDash([5,9]);
  ctx.beginPath();ctx.arc(0,0,outerR*.90,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,ri=outerR*.78,ro=outerR*.94;ctx.beginPath();ctx.moveTo(Math.cos(a)*ri,Math.sin(a)*ri);ctx.lineTo(Math.cos(a)*ro,Math.sin(a)*ro);ctx.stroke()}
  ctx.restore();
 };

 const style=document.createElement('style');
 style.textContent='.chrono-ability{border-color:#72e7ff66;background:linear-gradient(135deg,#72e7ff14,#7d62ff18);box-shadow:inset 0 0 24px #72e7ff0d}';
 document.head.appendChild(style);
 cfg.p2={...CHRONO_CLOCK,preset:CHRONO_KEY};
 renderPanel('p1');renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='「時界鐘皇」已加入：蓄力後可短暫停止所有可見敵人的時間，重新定位後以秒針破界攻擊時間恢復瞬間。';
 document.documentElement.dataset.chronoClock='v1';
})();
