/* Bloodrage Berserker V4 add-on: health-weighted intermittent smash or hunt skills */
(() => {
 const isRager=top=>!!top?.c?.rageEngine;
 const teamOf=top=>top?.teamIndex??(top?.index?1:0);
 const rageOf=top=>{
  if(!isRager(top))return 0;
  const missing=clamp(1-clamp(top.energy,0,100)/100,0,1);
  return Math.pow(missing,1.12);
 };
 const stageOf=top=>{
  const energy=clamp(top?.energy??100,0,100);
  return energy<=20?3:energy<=40?2:energy<=65?1:0;
 };
 const attackOf=top=>{
  const base=clamp(top?.c?.a??0,0,100),rage=rageOf(top);
  return clamp(base+rage*(72+22*rage),base,200);
 };
 const validEnemy=(source,target)=>!!target&&source!==target&&teamOf(source)!==teamOf(target)&&!target.out&&!target.burst&&!target.phaseInvisible&&!target.skyJumpGhost&&target.energy>0;

 function clampAimPoint(point,radius=outerR*.78){
  const cx=W/2,cy=H/2,dx=point.x-cx,dy=point.y-cy,d=mag(dx,dy)||1;
  if(d<=radius)return point;
  return {x:cx+dx/d*radius,y:cy+dy/d*radius};
 }

 function chooseTarget(source,preferred,current){
  if(validEnemy(source,current))return current;
  let best=null,bestScore=Infinity;
  tops.forEach(target=>{
   if(!validEnemy(source,target))return;
   const d=mag(target.x-source.x,target.y-source.y);
   const vulnerable=clamp(100-(target.energy||0),0,100);
   const speed=mag(target.vx||0,target.vy||0);
   let score=d-vulnerable*.24+speed*.03;
   if(target===preferred)score-=34;
   if(score<bestScore){best=target;bestScore=score}
  });
  return best;
 }

 function inheritedTarget(source,preferred){
  if(validEnemy(source,preferred))return preferred;
  let best=null,bestDistance=Infinity;
  tops.forEach(target=>{
   if(!validEnemy(source,target))return;
   const distance=mag(target.x-source.x,target.y-source.y);
   if(distance<bestDistance){best=target;bestDistance=distance}
  });
  return best;
 }

 function nextSkillDelay(top){
  const rage=rageOf(top);
  return clamp(rnd(3.7,6.4)-rage*1.65,2.05,6.4);
 }

 function huntChance(top){
  const hp=clamp(top.energy,0,100);
  let chance=hp>70?.72:hp>45?.58:hp>25?.42:.25;
  if(top.rageLastSkill==='hunt')chance-=.10;
  if(top.rageLastSkill==='smash')chance+=.08;
  return clamp(chance,.16,.82);
 }

 function neutralizeInheritedChase(top,dt,preferred){
  const rage=rageOf(top);
  if(rage<=.02)return;
  const target=inheritedTarget(top,preferred);
  if(!target)return;
  const dx=target.x-top.x,dy=target.y-top.y,d=mag(dx,dy)||1;
  const nx=dx/d,ny=dy/d,sign=Math.sign(top.omega)||1,tx=-ny*sign,ty=nx*sign;
  const attack=attackOf(top),overcap=Math.max(0,attack-100);
  const chase=26+rage*(40+attack*.22)+overcap*.10;
  const weave=11+rage*28;
  const acceleration=1+dt*(.05+rage*.34+overcap*.0012);
  top.vx-=(nx*chase+tx*weave)*dt*acceleration;
  top.vy-=(ny*chase+ty*weave)*dt*acceleration;
 }

 function enhancePanel(id){
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.rageEngine)return;
  const ability=host.querySelector('.rage-ability');
  if(!ability)return;
  ability.innerHTML='<strong>血怒雙技・不定期爆發</strong>狂戰士平時不會持續施放索敵，而會依目前能量不定期選擇技能。能量較高時偏向「血獵索敵」；血量越低，越容易改用威力隨血怒提升的「破滅重擊」。<div class="combo-tags"><span>不定期施放</span><span>高血偏索敵</span><span>低血偏重擊</span><span>威力隨血量變化</span></div>';
 }
 const previousRenderPanel=renderPanel;
 renderPanel=function(id){previousRenderPanel(id);enhancePanel(id)};

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.rageSkillState='idle';
   this.rageSkillCooldown=data.rageEngine?rnd(2.4,4.5):999;
   this.rageSkillTimer=0;
   this.rageSkillPulse=0;
   this.rageSkillTarget=null;
   this.rageLeadPoint=null;
   this.rageLastSkill='';
   this.rageHuntBurstCooldown=0;
   this.rageSmashPower=1;
   this.rageSmashHitWindow=0;
   this.rageSmashHit=false;
  }
  selectRageSkill(preferred){
   const target=chooseTarget(this,preferred,null);
   if(!target)return false;
   this.rageSkillTarget=target;
   if(Math.random()<huntChance(this))this.beginRageHunt(target);
   else this.beginRageSmash(target);
   return true;
  }
  beginRageHunt(target){
   const rage=rageOf(this),stage=stageOf(this);
   this.rageSkillState='hunt';
   this.rageSkillTimer=rnd(1.65,2.15)+rage*.95;
   this.rageHuntBurstCooldown=.18;
   this.rageSkillPulse=1;
   this.rageLastSkill='hunt';
   this.rageSkillTarget=target;
   emit(this.x,this.y,this.c.primary,18+stage*5,.56+rage*.26,'streak');
   wave(this.x,this.y,this.c.secondary,42+rage*28);
   addLog(`${this.c.name} 根據剩餘能量啟動「血獵索敵」：短時間預判敵方軌跡並持續追殺！`);
  }
  beginRageSmash(target){
   const rage=rageOf(this),stage=stageOf(this);
   this.rageSkillState='smashCharge';
   this.rageSkillTimer=clamp(rnd(.34,.48)-rage*.08,.25,.48);
   this.rageSmashPower=1+rage*.82+stage*.10;
   this.rageSmashHitWindow=0;
   this.rageSmashHit=false;
   this.rageSkillPulse=1;
   this.rageLastSkill='smash';
   this.rageSkillTarget=target;
   this.vx*=.88;this.vy*=.88;
   emit(this.x,this.y,this.c.accent,18+stage*6,.48+rage*.24);
   wave(this.x,this.y,this.c.primary,46+rage*34);
   addLog(`${this.c.name} 壓縮血怒，準備發動「破滅重擊」！剩餘能量越低，命中威力越高！`);
  }
  finishRageSkill(missed=false){
   if(missed&&this.rageSkillState==='smashRush')addLog(`${this.c.name} 的「破滅重擊」掠過戰圈，重新等待下一次血怒爆發。`);
   this.rageSkillState='idle';
   this.rageSkillTimer=0;
   this.rageSmashHitWindow=0;
   this.rageSkillTarget=null;
   this.rageLeadPoint=null;
   this.rageSkillCooldown=nextSkillDelay(this);
  }
  updateRageHunt(dt,preferred){
   this.rageSkillTimer-=dt;
   this.rageHuntBurstCooldown=Math.max(0,this.rageHuntBurstCooldown-dt);
   let target=chooseTarget(this,preferred,this.rageSkillTarget);
   this.rageSkillTarget=target;
   if(!target||this.rageSkillTimer<=0){this.finishRageSkill(false);return}
   const rage=rageOf(this),stage=stageOf(this),attack=attackOf(this);
   const dx0=target.x-this.x,dy0=target.y-this.y,d0=mag(dx0,dy0)||1;
   const relativeSpeed=Math.max(105,mag((this.vx||0)-(target.vx||0),(this.vy||0)-(target.vy||0))+72);
   const leadTime=clamp(d0/relativeSpeed*.38,.06,.42)*(.75+rage*.52);
   const aim=clampAimPoint({x:target.x+(target.vx||0)*leadTime,y:target.y+(target.vy||0)*leadTime});
   this.rageLeadPoint=aim;
   let ax=aim.x-this.x,ay=aim.y-this.y,ad=mag(ax,ay)||1,nx=ax/ad,ny=ay/ad;
   const cx=W/2,cy=H/2,cdx=this.x-cx,cdy=this.y-cy,centreDistance=mag(cdx,cdy)||1;
   const edge=clamp((centreDistance-innerR*.76)/Math.max(1,outerR-innerR*.76),0,1);
   if(edge>0){
    const inwardX=-cdx/centreDistance,inwardY=-cdy/centreDistance,inwardMix=edge*(.24+rage*.20);
    nx=nx*(1-inwardMix)+inwardX*inwardMix;
    ny=ny*(1-inwardMix)+inwardY*inwardMix;
    const nd=mag(nx,ny)||1;nx/=nd;ny/=nd;
   }
   const desiredSpeed=clamp(188+attack*.48+rage*72,190,360);
   const turnRate=3.25+rage*5.4+stage*.68;
   const blend=clamp(dt*turnRate,0,.36);
   this.vx+=(nx*desiredSpeed-this.vx)*blend;
   this.vy+=(ny*desiredSpeed-this.vy)*blend;
   const speed=mag(this.vx,this.vy)||1,alignment=(this.vx/speed)*nx+(this.vy/speed)*ny;
   if(alignment>.80&&d0>this.r+target.r+26&&d0<innerR*1.45&&this.rageHuntBurstCooldown<=0){
    const impulse=22+rage*48+stage*6;
    this.vx+=nx*impulse;this.vy+=ny*impulse;
    this.rageHuntBurstCooldown=clamp(.76-rage*.18,.48,.76);
    this.rageSkillPulse=1;
    emit(this.x,this.y,this.c.primary,8+stage*3,.34+rage*.24,'streak');
   }
  }
  updateRageSmashCharge(dt,preferred){
   neutralizeInheritedChase(this,dt,preferred);
   this.rageSkillTimer-=dt;
   const target=chooseTarget(this,preferred,this.rageSkillTarget);
   this.rageSkillTarget=target;
   if(!target){this.finishRageSkill(false);return}
   const rage=rageOf(this),dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1;
   const desiredX=dx/d*(80+rage*40),desiredY=dy/d*(80+rage*40),blend=clamp(dt*3.1,0,.15);
   this.vx+=(desiredX-this.vx)*blend;
   this.vy+=(desiredY-this.vy)*blend;
   this.rageLeadPoint={x:target.x,y:target.y};
   if(this.rageSkillTimer<=0)this.launchRageSmash(target);
  }
  launchRageSmash(target){
   const rage=rageOf(this),stage=stageOf(this),attack=attackOf(this);
   const lead=clamp(.07+rage*.12,.07,.20);
   const aim=clampAimPoint({x:target.x+(target.vx||0)*lead,y:target.y+(target.vy||0)*lead},innerR*.92);
   const dx=aim.x-this.x,dy=aim.y-this.y,d=mag(dx,dy)||1;
   const speed=clamp(225+attack*.72+rage*72,245,410);
   this.rageSkillState='smashRush';
   this.rageSkillTimer=.52+rage*.18;
   this.rageSmashHitWindow=this.rageSkillTimer;
   this.rageLeadPoint=aim;
   this.vx=dx/d*speed;this.vy=dy/d*speed;
   this.impactBoost=Math.max(this.impactBoost||0,105+rage*80);
   this.energy=Math.max(0,this.energy-(1.8+rage*2.4));
   this.omega*=1-rage*.012;this.spin=this.omega;
   emit(this.x,this.y,this.c.secondary,28+stage*7,.82+rage*.32,'streak');
   wave(this.x,this.y,this.c.accent,62+rage*42);
   shake=Math.max(shake,6+rage*4);
  }
  updateRageSmashRush(dt){
   this.rageSkillTimer-=dt;
   this.rageSmashHitWindow=Math.max(0,this.rageSmashHitWindow-dt);
   this.rageSkillPulse=1;
   if(Math.random()<dt*(18+rageOf(this)*18))emit(this.x,this.y,this.c.secondary,1,.36+rageOf(this)*.22,'streak');
   if(this.rageSkillTimer<=0||this.rageSmashHitWindow<=0)this.finishRageSkill(!this.rageSmashHit);
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.rageSkillPulse=Math.max(0,this.rageSkillPulse-dt*1.8);
   if(!isRager(this)||this.out||this.burst||this.phaseInvisible||this.skyJumpGhost||this.charmedBy)return;
   if(this.rageSkillState==='idle'){
    neutralizeInheritedChase(this,dt,opponent);
    this.rageSkillCooldown-=dt;
    const ready=this.energy>10&&Math.abs(this.omega)>12&&chooseTarget(this,opponent,null);
    if(this.rageSkillCooldown<=0&&ready&&!this.selectRageSkill(opponent))this.rageSkillCooldown=.8;
    return;
   }
   if(this.rageSkillState==='hunt'){this.updateRageHunt(dt,opponent);return}
   if(this.rageSkillState==='smashCharge'){this.updateRageSmashCharge(dt,opponent);return}
   if(this.rageSkillState==='smashRush'){this.updateRageSmashRush(dt);return}
  }
  draw(){
   super.draw();
   if(!isRager(this)||this.out||this.burst||this.rageSkillState==='idle')return;
   const rage=rageOf(this),pulse=.5+.5*Math.sin(time*(this.rageSkillState==='hunt'?7.8:10.5));
   const target=this.rageSkillTarget;
   ctx.save();ctx.globalCompositeOperation='screen';
   if(this.rageSkillState==='hunt'&&validEnemy(this,target)&&this.rageLeadPoint){
    const rr=(target.r||this.r)*(1.30+pulse*.12);
    ctx.strokeStyle=alpha(this.c.primary,.34+rage*.38);ctx.lineWidth=1;ctx.setLineDash([4,7]);
    ctx.beginPath();ctx.moveTo(this.x,this.y);ctx.lineTo(this.rageLeadPoint.x,this.rageLeadPoint.y);ctx.stroke();ctx.setLineDash([]);
    ctx.translate(target.x,target.y);ctx.rotate(-time*(1.6+rage*2));ctx.strokeStyle=alpha(this.c.accent,.58+rage*.34);ctx.lineWidth=1.3+rage*1.2;ctx.shadowBlur=12+rage*12;ctx.shadowColor=this.c.primary;
    for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.arc(0,0,rr,a+.12,a+Math.PI/2-.12);ctx.stroke()}
   }else if(this.rageSkillState==='smashCharge'){
    ctx.translate(this.x,this.y);ctx.rotate(time*(2.4+rage*2.2));ctx.shadowBlur=18+rage*18;ctx.shadowColor=this.c.secondary;
    for(let i=0;i<3;i++){
     ctx.strokeStyle=alpha(i===2?this.c.accent:this.c.secondary,.30+rage*.28+pulse*.16);ctx.lineWidth=1.5+i*.5;
     ctx.beginPath();ctx.arc(0,0,this.r*(1.20+i*.20-pulse*.05),i*.7,Math.PI*1.55+i*.7);ctx.stroke();
    }
   }else if(this.rageSkillState==='smashRush'){
    const speed=mag(this.vx,this.vy)||1,nx=this.vx/speed,ny=this.vy/speed;
    ctx.strokeStyle=alpha(this.c.accent,.62+rage*.28);ctx.lineWidth=this.r*.42;ctx.lineCap='round';ctx.shadowBlur=18;ctx.shadowColor=this.c.primary;
    ctx.beginPath();ctx.moveTo(this.x-nx*this.r*.4,this.y-ny*this.r*.4);ctx.lineTo(this.x-nx*this.r*(2.4+rage),this.y-ny*this.r*(2.4+rage));ctx.stroke();
   }
   ctx.restore();
  }
 };

 function applyRageSmash(attacker,victim,dirX,dirY){
  if(!isRager(attacker)||attacker.rageSkillState!=='smashRush'||attacker.rageSmashHitWindow<=0||attacker.rageSmashHit||!validEnemy(attacker,victim))return false;
  const rage=rageOf(attacker),attack=attackOf(attacker),stage=stageOf(attacker),power=clamp(attacker.rageSmashPower||1,1,2.25);
  const force=(92+attack*.82+rage*94)*power;
  victim.vx+=dirX*force;victim.vy+=dirY*force;
  victim.omega*=clamp(.90-rage*.10-(power-1)*.04,.72,.90);victim.spin=victim.omega;
  victim.energy=Math.max(0,victim.energy-(7+attack*.035+rage*8)*power);
  victim.tiltVel+=(.20+rage*.30)*power/Math.max(.72,victim.tip?.stability||1);
  victim.lift=clamp((victim.lift||0)+(.14+rage*.22)*power,0,1);
  victim.impactBoost=Math.max(victim.impactBoost||0,110+rage*95+(power-1)*48);
  victim.burstMeter=(victim.burstMeter||0)+(8+rage*10)*power;
  attacker.omega*=1-(.012+rage*.018)*power;attacker.spin=attacker.omega;
  attacker.energy=Math.max(0,attacker.energy-(2.5+rage*2.8));
  attacker.rageSmashHit=true;attacker.rageSmashHitWindow=0;attacker.rageImpactFlash=1;attacker.rageOvercapPulse=1;
  const cx=(attacker.x+victim.x)/2,cy=(attacker.y+victim.y)/2;
  emit(cx,cy,attacker.c.primary,42+stage*10,1.02+rage*.42,'streak');
  emit(cx,cy,attacker.c.accent,22+stage*6,.84+rage*.30);
  wave(cx,cy,attacker.c.secondary,92+rage*64);
  shake=Math.max(shake,12+rage*8);flash=Math.max(flash,.42+rage*.25);
  addLog(`${attacker.c.name} 的「破滅重擊」命中！血量越低，爆發出的擊飛、耗轉與爆裂傷害越強！`);
  attacker.finishRageSkill(false);
  return true;
 }

 const previousCollide=collide;
 collide=function(a,b){
  const protectedState=a?.phaseInvisible||b?.phaseInvisible||a?.skyJumpGhost||b?.skyJumpGhost||a?.charmedBy===b||b?.charmedBy===a;
  const same=teamOf(a)===teamOf(b);
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=(a.r||0)+(b.r||0);
  let contact=false,nx=0,ny=0;
  if(!protectedState&&!same&&d&&d<min){
   nx=dx/d;ny=dy/d;
   contact=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny)>0;
  }
  previousCollide(a,b);
  if(!contact)return;
  applyRageSmash(a,b,nx,ny);
  applyRageSmash(b,a,-nx,-ny);
 };

 enhancePanel('p1');enhancePanel('p2');
 const log=document.querySelector('#log');
 if(log)log.textContent='「血怒狂戰士」已改為不定期雙技：能量較高時偏向血獵索敵，血量越低則越容易施放威力更強的破滅重擊。';
 document.documentElement.dataset.rageTargeting='intermittent-dual-skill-v2';
})();
