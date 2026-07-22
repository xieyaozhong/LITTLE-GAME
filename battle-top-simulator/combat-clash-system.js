/* Universal Skill Clash System V1: attack clashes, guard breaks, charge interruption, and temporal resistance */
(() => {
 const teamOf=top=>top?.teamIndex??(top?.index?1:0);
 const combatReady=top=>!!top&&!top.out&&!top.burst&&!top.phaseInvisible&&!top.skyJumpGhost&&top.energy>0;
 const attackStates=new Set(['flashRush','moon','pierceRush','swallowRush','shadow','drawRush']);
 const swordPower={flash:[2.15,'precision'],moon:[1.70,'flow'],pierce:[2.80,'breaker'],swallow:[1.95,'chain'],shadow:[1.78,'precision'],draw:[3.28,'heavy']};

 function snapshot(top){
  return {
   vx:top.vx||0,vy:top.vy||0,omega:top.omega||0,energy:top.energy||0,
   tiltVel:top.tiltVel||0,lift:top.lift||0,impactBoost:top.impactBoost||0,
   burstMeter:top.burstMeter||0,burst:!!top.burst
  };
 }
 function soften(top,before,retain){
  if(!top||!before)return;
  const r=clamp(retain,0,1);
  top.vx=before.vx+(top.vx-before.vx)*r;
  top.vy=before.vy+(top.vy-before.vy)*r;
  top.omega=before.omega+(top.omega-before.omega)*r;top.spin=top.omega;
  top.energy=before.energy+(top.energy-before.energy)*r;
  top.tiltVel=before.tiltVel+((top.tiltVel||0)-before.tiltVel)*r;
  top.lift=before.lift+((top.lift||0)-before.lift)*r;
  top.impactBoost=before.impactBoost+((top.impactBoost||0)-before.impactBoost)*r;
  top.burstMeter=before.burstMeter+((top.burstMeter||0)-before.burstMeter)*r;
  if(!before.burst&&top.burst&&top.burstMeter<100)top.burst=false;
 }
 function specialName(top){return top?.c?.name||'陀螺'}
 function skillProfile(top,ignoreControl=false){
  if(!combatReady(top)||(!ignoreControl&&(top.timeFrozenBy||top.charmedBy)))return null;

  if(top.swordState==='guard')return {kind:'guard',name:'鏡鋼格擋',power:3.10,style:'guard'};
  if(top.morphMode==='aegis'&&top.morphCounterReady)return {kind:'guard',name:'玄甲反擊',power:2.88,style:'guard'};
  if(top.taijiMode==='yin'&&top.c?.taijiV2)return {kind:'guard',name:'陰・化勁',power:2.45+clamp((top.taijiChi||0)/170,0,.55),style:'flow'};
  if(top.twinInheritanceMode==='guardian'&&top.twinInheritanceAwakened)return {kind:'guard',name:'恆星守核',power:2.32,style:'guard'};

  if(top.rageSkillState==='smashRush'&&(top.rageSmashHitWindow||0)>0)return {kind:'attack',name:'破滅重擊',power:3.38,style:'heavy'};
  if(top.rageSkillState==='hunt'&&mag(top.vx||0,top.vy||0)>205)return {kind:'attack',name:'血獵索敵',power:1.72,style:'pursuit'};
  if(attackStates.has(top.swordState)&&(top.swordHitWindow||0)>0){
   const [power,style]=swordPower[top.swordArt]||[1.8,'precision'];
   return {kind:'attack',name:top.swordArtName||'七式劍技',power,style};
  }
  if(top.chronoState==='releaseRush'&&(top.chronoStrikeWindow||0)>0)return {kind:'attack',name:'秒針破界',power:2.42,style:'precision'};
  if(top.c?.skyPouncer&&(top.skyDiveImpact||0)>0&&!top.skyJumpGhost){
   const grand=top.skyStrikeMode==='grand',feint=top.skyStrikeMode==='feint';
   return {kind:'attack',name:grand?'蒼穹大飛':feint?'獵鷹假升':'天墜中飛',power:grand?3.02:feint?2.38:2.55,style:'aerial'};
  }
  if(top.c?.adaptiveMorph&&(top.morphHitWindow||0)>0){
   const mode=top.morphMode;
   if(mode==='reaper')return {kind:'attack',name:'斷星重擊',power:3.08,style:'heavy'};
   if(mode==='viper')return {kind:'attack',name:'毒牙連段',power:1.92,style:'chain'};
   if(mode==='swift')return {kind:'attack',name:'疾風短衝',power:1.68,style:'precision'};
  }
  if(top.c?.taijiV2&&top.taijiMode==='yang'&&(top.taijiStrikeWindow||0)>0)return {kind:'attack',name:'陽・發勁',power:2.15+clamp((top.taijiChi||0)/120,0,.75),style:'counter'};
  if(top.twinInheritanceMode==='hunter'&&top.twinInheritanceAwakened&&(top.twinHuntCooldown||0)>.82&&mag(top.vx||0,top.vy||0)>220)return {kind:'attack',name:'彗星追核',power:2.36,style:'pursuit'};

  if(top.rageSkillState==='smashCharge')return {kind:'charge',name:'破滅重擊蓄力',power:2.45};
  if(['pierceCharge','drawCharge'].includes(top.swordState))return {kind:'charge',name:top.swordArtName||'重蓄劍式',power:top.swordState==='drawCharge'?2.75:2.30};
  if(top.chronoState==='charge')return {kind:'charge',name:'零時領域蓄力',power:2.55};
  if(top.skyJumpState==='climb')return {kind:'charge',name:'飛行爬升',power:1.85};
  if(top.c?.adaptiveMorph&&top.morphMode==='reaper'&&(top.morphCharge||0)>.42&&(top.morphHitWindow||0)<=0)return {kind:'charge',name:'斷星蓄勢',power:2.20+(top.morphCharge||0)*.55};

  const speed=mag(top.vx||0,top.vy||0);
  if((top.impactBoost||0)>92&&speed>235)return {kind:'attack',name:'極速衝撞',power:1.45+clamp(((top.impactBoost||0)-92)/110,0,.65),style:'momentum'};
  return null;
 }
 function score(top,profile,closing){
  return (profile?.power||0)+clamp(closing/260,0,.85)+clamp((top?.c?.w||75)/320,0,.34)+clamp(Math.abs(top?.omega||0)/220,0,.28);
 }
 function setClashVisual(top,text,color='#fff3b8'){
  if(!top)return;
  top.skillClashPulse=1;
  top.skillClashText=text;
  top.skillClashColor=color;
 }
 function stagger(top,duration,strength=.28){
  if(!top)return;
  top.skillClashStagger=Math.max(top.skillClashStagger||0,duration);
  top.skillClashSlow=Math.max(top.skillClashSlow||0,strength);
  top.xDashCooldown=Math.max(top.xDashCooldown||0,duration+.15);
  top.rageRecoveryTimer=Math.max(top.rageRecoveryTimer||0,duration);
  top.swordRecovery=Math.max(top.swordRecovery||0,duration);
  top.chronoRecovery=Math.max(top.chronoRecovery||0,duration);
  top.skyJumpCooldown=Math.max(top.skyJumpCooldown||0,duration+1.1);
  top.morphAttackTimer=Math.max(top.morphAttackTimer||0,duration*.75);
  top.morphCounterCooldown=Math.max(top.morphCounterCooldown||0,duration*.55);
  top.taijiDashTimer=Math.max(top.taijiDashTimer||0,duration*.65);
  top.twinHuntCooldown=Math.max(top.twinHuntCooldown||0,duration+.25);
 }
 function endAttack(top,profile,extra=.18){
  if(!top||!profile)return;
  if(top.rageSkillState==='smashRush'||top.rageSkillState==='hunt'){
   if(typeof top.finishRageSkill==='function')top.finishRageSkill(false);
   else top.rageSkillState='idle';
  }
  if(attackStates.has(top.swordState)){
   if(typeof top.finishSwordArt==='function')top.finishSwordArt(extra);
   else {top.swordState='idle';top.swordHitWindow=0}
  }
  if(top.chronoState==='releaseRush'){
   if(typeof top.finishChrono==='function')top.finishChrono(.72);
   else {top.chronoState='idle';top.chronoStrikeWindow=0}
  }
  if(top.c?.skyPouncer&&(top.skyDiveImpact||0)>0){
   top.skyDiveImpact=0;
   if(top.skyJumpState==='direct')top.skyJumpState='idle';
   top.skyDirectTimer=0;
   top.skyJumpCooldown=Math.max(top.skyJumpCooldown||0,2.2);
  }
  if(top.c?.adaptiveMorph)top.morphHitWindow=0;
  if(top.c?.taijiV2&&top.taijiMode==='yang'){
   top.taijiStrikeWindow=0;
   top.taijiChi=Math.max(0,(top.taijiChi||0)-18);
  }
  if(top.twinInheritanceMode==='hunter')top.twinHuntCooldown=Math.max(top.twinHuntCooldown||0,1.45);
  top.impactBoost=Math.max(0,(top.impactBoost||0)*.55);
 }
 function consumeGuard(top){
  if(!top)return;
  if(top.swordState==='guard'){
   if(typeof top.finishSwordArt==='function')top.finishSwordArt(.22);
   else top.swordState='idle';
  }
  if(top.morphMode==='aegis'&&top.morphCounterReady){
   top.morphCounterReady=false;
   top.morphCounterCooldown=Math.max(top.morphCounterCooldown||0,1.45);
  }
  if(top.c?.taijiV2&&top.taijiMode==='yin'&&typeof top.absorb==='function')top.absorb(12);
 }
 function breakCharge(top){
  if(!top)return;
  if(top.rageSkillState==='smashCharge'){
   if(typeof top.finishRageSkill==='function')top.finishRageSkill(false,true);
   else top.rageSkillState='idle';
  }else if(['pierceCharge','drawCharge'].includes(top.swordState)){
   if(typeof top.finishSwordArt==='function')top.finishSwordArt(.62);
   else top.swordState='idle';
  }else if(top.chronoState==='charge'){
   if(typeof top.cancelChrono==='function')top.cancelChrono('被攻擊技能破招');
   else top.chronoState='idle';
  }else if(top.skyJumpState==='climb'){
   top.skyJumpState='idle';top.skyJumpGhost=false;top.skyJumpHeight=0;
   top.skyJumpCooldown=Math.max(top.skyJumpCooldown||0,3.2);
  }else if(top.c?.adaptiveMorph&&top.morphMode==='reaper'){
   top.morphCharge=0;top.morphHitWindow=0;top.morphAttackTimer=Math.max(top.morphAttackTimer||0,1.65);
  }
 }
 function clashFx(a,b,colorA,colorB,size=74){
  const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
  emit(cx,cy,colorA||a.c?.primary||'#fff',30,.82,'streak');
  emit(cx,cy,colorB||b.c?.primary||'#fff',22,.66,'streak');
  wave(cx,cy,'#fff7d6',size);wave(cx,cy,colorA||'#72e7ff',size*.68);
  shake=Math.max(shake,8.5);flash=Math.max(flash,.28);
 }
 function logClash(a,b,text){
  if((a.skillClashLogCooldown||0)>0||(b.skillClashLogCooldown||0)>0)return;
  addLog(text);
  a.skillClashLogCooldown=b.skillClashLogCooldown=.85;
 }
 function resolveAttackClash(a,b,pa,pb,beforeA,beforeB,nx,ny,closing){
  const sa=score(a,pa,closing),sb=score(b,pb,closing),diff=sa-sb;
  if(Math.abs(diff)<.46){
   soften(a,beforeA,.38);soften(b,beforeB,.38);
   const recoil=38+closing*.11;
   a.vx-=nx*recoil;a.vy-=ny*recoil;b.vx+=nx*recoil;b.vy+=ny*recoil;
   a.omega*=.982;b.omega*=.982;a.spin=a.omega;b.spin=b.omega;
   stagger(a,.48,.36);stagger(b,.48,.36);
   setClashVisual(a,'技擊相殺');setClashVisual(b,'技擊相殺');
   logClash(a,b,`${specialName(a)} 的「${pa.name}」與 ${specialName(b)} 的「${pb.name}」正面相殺，雙方同時被震開！`);
  }else{
   const winner=diff>0?a:b,loser=diff>0?b:a,pw=diff>0?pa:pb,pl=diff>0?pb:pa;
   const winnerBefore=diff>0?beforeA:beforeB,loserBefore=diff>0?beforeB:beforeA;
   soften(winner,winnerBefore,.26);soften(loser,loserBefore,.62);
   const dir=diff>0?1:-1;
   winner.vx-=nx*dir*(20+closing*.045);winner.vy-=ny*dir*(20+closing*.045);
   loser.vx+=nx*dir*(58+closing*.10);loser.vy+=ny*dir*(58+closing*.10);
   loser.tiltVel+=(Math.sign(loser.omega)||1)*.07;
   stagger(winner,.24,.18);stagger(loser,.68,.48);
   setClashVisual(winner,'破技');setClashVisual(loser,'失衡','#ff9a73');
   logClash(a,b,`${specialName(winner)} 的「${pw.name}」在技能交鋒中壓過「${pl.name}」，取得追擊優勢！`);
  }
  endAttack(a,pa);endAttack(b,pb);clashFx(a,b,a.c?.primary,b.c?.primary,82);
 }
 function guardAdvantage(attack,guard){
  let value=attack.power-guard.power;
  if(attack.style==='breaker')value+=.58;
  else if(attack.style==='heavy')value+=.22;
  else if(attack.style==='flow')value-=.18;
  if(guard.style==='flow'&&attack.style==='heavy')value-=.22;
  return value;
 }
 function resolveAttackGuard(attacker,guard,pa,pg,beforeAttacker,beforeGuard,dirX,dirY,closing){
  const advantage=guardAdvantage(pa,pg)+clamp((score(attacker,pa,closing)-score(guard,pg,closing))*.35,-.45,.45);
  if(advantage>.58){
   soften(attacker,beforeAttacker,.34);soften(guard,beforeGuard,.66);
   attacker.vx-=dirX*(18+closing*.035);attacker.vy-=dirY*(18+closing*.035);
   guard.vx+=dirX*(38+closing*.07);guard.vy+=dirY*(38+closing*.07);
   guard.tiltVel+=.065;
   stagger(attacker,.22,.16);stagger(guard,.66,.46);
   setClashVisual(attacker,'破防');setClashVisual(guard,'架勢崩解','#ff9a73');
   logClash(attacker,guard,`${specialName(attacker)} 以「${pa.name}」突破 ${specialName(guard)} 的「${pg.name}」，但攻勢也被削去部分力量！`);
  }else if(advantage<-.48){
   soften(guard,beforeGuard,.16);soften(attacker,beforeAttacker,.88);
   attacker.vx-=dirX*(68+closing*.13);attacker.vy-=dirY*(68+closing*.13);
   guard.vx+=dirX*(14+closing*.025);guard.vy+=dirY*(14+closing*.025);
   attacker.omega*=.974;attacker.spin=attacker.omega;attacker.tiltVel+=.085;
   stagger(attacker,.76,.54);stagger(guard,.18,.12);
   setClashVisual(attacker,'被反制','#ff9a73');setClashVisual(guard,'完美格擋');
   logClash(attacker,guard,`${specialName(guard)} 的「${pg.name}」完整接住「${pa.name}」，立即反震攻擊者！`);
  }else{
   soften(guard,beforeGuard,.34);soften(attacker,beforeAttacker,.70);
   attacker.vx-=dirX*(38+closing*.075);attacker.vy-=dirY*(38+closing*.075);
   guard.vx+=dirX*(26+closing*.045);guard.vy+=dirY*(26+closing*.045);
   stagger(attacker,.44,.32);stagger(guard,.30,.22);
   setClashVisual(attacker,'攻防相抵');setClashVisual(guard,'攻防相抵');
   logClash(attacker,guard,`${specialName(attacker)} 的「${pa.name}」與 ${specialName(guard)} 的「${pg.name}」互相抵消，雙方重新拉開距離！`);
  }
  consumeGuard(guard);endAttack(attacker,pa);clashFx(attacker,guard,attacker.c?.primary,guard.c?.accent,76);
 }
 function resolveBreak(attacker,charger,pa,pc,beforeAttacker,dirX,dirY,closing){
  soften(attacker,beforeAttacker,.46);
  breakCharge(charger);endAttack(attacker,pa,.12);
  charger.vx+=dirX*(42+closing*.08);charger.vy+=dirY*(42+closing*.08);
  charger.tiltVel+=.075;charger.omega*=.984;charger.spin=charger.omega;
  stagger(attacker,.18,.12);stagger(charger,.82,.55);
  setClashVisual(attacker,'破招');setClashVisual(charger,'蓄力中斷','#ff9a73');
  logClash(attacker,charger,`${specialName(attacker)} 以「${pa.name}」切入蓄力空窗，打斷 ${specialName(charger)} 的「${pc.name}」！`);
  clashFx(attacker,charger,attacker.c?.primary,charger.c?.accent,70);
 }
 function resolveChargeCollision(a,b,pa,pb,beforeA,beforeB,nx,ny,closing){
  soften(a,beforeA,.54);soften(b,beforeB,.54);breakCharge(a);breakCharge(b);
  const recoil=34+closing*.08;
  a.vx-=nx*recoil;a.vy-=ny*recoil;b.vx+=nx*recoil;b.vy+=ny*recoil;
  stagger(a,.72,.48);stagger(b,.72,.48);
  setClashVisual(a,'蓄力潰散','#ffbf75');setClashVisual(b,'蓄力潰散','#ffbf75');
  logClash(a,b,`${specialName(a)} 與 ${specialName(b)} 的蓄力在接觸瞬間互相干擾，雙方招式同時崩解！`);
  clashFx(a,b,a.c?.accent,b.c?.accent,68);
 }

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.skillClashStagger=0;
   this.skillClashSlow=0;
   this.skillClashPulse=0;
   this.skillClashText='';
   this.skillClashColor='#fff3b8';
   this.skillClashLock=0;
   this.skillClashLogCooldown=0;
   this.skillClashWasFrozen=false;
  }
  update(dt,opponent){
   const newlyFrozen=!!this.timeFrozenBy&&!this.skillClashWasFrozen;
   if(newlyFrozen){
    const profile=skillProfile(this,true);
    if(profile?.kind==='attack'){
     const reduction=profile.power>=3?.50:.68;
     this.timeFrozenTimer*=reduction;
     this.timeFreezeLabelTimer=Math.min(this.timeFreezeLabelTimer||this.timeFrozenTimer,this.timeFrozenTimer);
     setClashVisual(this,profile.power>=3?'逆時破勢':'慣性抗時','#bff7ff');
     if((this.skillClashLogCooldown||0)<=0){
      addLog(`${specialName(this)} 在「${profile.name}」發動中保留部分攻擊慣性，縮短了時停束縛！`);
      this.skillClashLogCooldown=.9;
     }
    }
   }
   super.update(dt,opponent);
   this.skillClashWasFrozen=!!this.timeFrozenBy;
   this.skillClashPulse=Math.max(0,(this.skillClashPulse||0)-dt*1.65);
   this.skillClashLock=Math.max(0,(this.skillClashLock||0)-dt);
   this.skillClashLogCooldown=Math.max(0,(this.skillClashLogCooldown||0)-dt);
   this.skillClashStagger=Math.max(0,(this.skillClashStagger||0)-dt);
   this.skillClashSlow=Math.max(0,(this.skillClashSlow||0)-dt*.7);
   if(this.skillClashStagger>0&&!this.out&&!this.burst&&!this.timeFrozenBy){
    const drag=.32+.50*clamp(this.skillClashSlow,0,1);
    this.vx*=Math.exp(-drag*dt);this.vy*=Math.exp(-drag*dt);
    this.morphHitWindow=0;
    this.taijiStrikeWindow=0;
   }
  }
  draw(){
   super.draw();
   if((this.skillClashPulse||0)<=0||this.out||this.burst)return;
   const p=clamp(this.skillClashPulse,0,1),pulse=.5+.5*Math.sin(time*10.5);
   ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';
   ctx.strokeStyle=alpha(this.skillClashColor||'#fff3b8',.25+.40*p);ctx.lineWidth=1.5+1.4*p;ctx.shadowBlur=14;ctx.shadowColor=this.skillClashColor||'#fff3b8';
   ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(0,0,this.r*(1.28+(1-p)*.42+pulse*.04),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  }
 };

 const previousCollide=collide;
 collide=function(a,b){
  if(!a||!b||a.out||b.out||a.burst||b.burst||a.timeFrozenBy||b.timeFrozenBy)return previousCollide(a,b);
  const protectedState=a.phaseInvisible||b.phaseInvisible||a.skyJumpGhost||b.skyJumpGhost||a.charmedBy===b||b.charmedBy===a;
  const same=teamOf(a)===teamOf(b),dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=(a.r||0)+(b.r||0);
  let contact=false,nx=0,ny=0,closing=0;
  if(!protectedState&&!same&&d&&d<min){
   nx=dx/d;ny=dy/d;closing=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny);contact=closing>0;
  }
  if(!contact||a.skillClashLock>0||b.skillClashLock>0)return previousCollide(a,b);
  const pa=skillProfile(a),pb=skillProfile(b),beforeA=snapshot(a),beforeB=snapshot(b);
  previousCollide(a,b);
  if(!pa&&!pb)return;
  a.skillClashLock=b.skillClashLock=.26;

  if(pa?.kind==='attack'&&pb?.kind==='attack')return resolveAttackClash(a,b,pa,pb,beforeA,beforeB,nx,ny,closing);
  if(pa?.kind==='attack'&&pb?.kind==='guard')return resolveAttackGuard(a,b,pa,pb,beforeA,beforeB,nx,ny,closing);
  if(pb?.kind==='attack'&&pa?.kind==='guard')return resolveAttackGuard(b,a,pb,pa,beforeB,beforeA,-nx,-ny,closing);
  if(pa?.kind==='attack'&&pb?.kind==='charge')return resolveBreak(a,b,pa,pb,beforeA,nx,ny,closing);
  if(pb?.kind==='attack'&&pa?.kind==='charge')return resolveBreak(b,a,pb,pa,beforeB,-nx,-ny,closing);
  if(pa?.kind==='charge'&&pb?.kind==='charge')return resolveChargeCollision(a,b,pa,pb,beforeA,beforeB,nx,ny,closing);
 };

 const legend=document.querySelector('.legend');
 if(legend&&!legend.querySelector('[data-skill-clash]')){
  const chip=document.createElement('span');chip.className='chip';chip.dataset.skillClash='v1';chip.textContent='技能交鋒：相殺・破招・格擋・反震';legend.prepend(chip);
 }
 const style=document.createElement('style');
 style.textContent='[data-skill-clash]{border-color:#fff3b855!important;color:#fff3c9!important;background:#fff3b80d!important}';
 document.head.appendChild(style);
 const log=document.querySelector('#log');
 if(log)log.textContent='全陀螺技能交鋒系統已啟用：攻擊對撞會相殺或破技，格擋可反震，蓄力可被破招，重攻能縮短時停束縛。';
 document.documentElement.dataset.skillClashSystem='v1';
})();
