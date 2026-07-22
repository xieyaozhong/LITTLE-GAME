/* Twin Nova inheritance V2: stable awakening with speed caps, edge recovery, and hit throttling. */
(() => {
 const isTwinUnit=top=>!!top&&(top.splitPart==='α'||top.splitPart==='β')&&(top.c?.shape==='twinNova'||top.c?.shape==='twinNovaChild');
 const teamOf=top=>top?.teamIndex??(top?.index?1:0);
 const combatAlive=top=>!!top&&!top.out&&!top.burst&&!((top.energy||0)<=0&&mag(top.vx||0,top.vy||0)<24);
 const validEnemy=(source,target)=>!!target&&source!==target&&teamOf(source)!==teamOf(target)&&combatAlive(target)&&!target.phaseInvisible&&!target.skyJumpGhost;

 function twinPartner(top){
  if(!isTwinUnit(top))return null;
  const opposite=top.splitPart==='α'?'β':'α';
  let best=null,bestDelta=Infinity;
  tops.forEach(other=>{
   if(other===top||!isTwinUnit(other)||other.splitPart!==opposite||teamOf(other)!==teamOf(top))return;
   const delta=Math.abs((other.splitBornAt??-99)-(top.splitBornAt??-99));
   if(delta<bestDelta){best=other;bestDelta=delta}
  });
  return bestDelta<=.35?best:null;
 }
 function nearestEnemy(source){
  let best=null,bestScore=Infinity;
  tops.forEach(target=>{
   if(!validEnemy(source,target))return;
   const d=mag(target.x-source.x,target.y-source.y);
   const weak=clamp(100-(target.energy||0),0,100);
   const score=d-weak*.16;
   if(score<bestScore){best=target;bestScore=score}
  });
  return best;
 }
 function restoreSpinLoss(top,before,fraction,capRatio=1.30){
  const after=top.omega||0,absBefore=Math.abs(before||0),absAfter=Math.abs(after);
  if(absAfter>=absBefore)return;
  const sign=Math.sign(after)||Math.sign(before)||1;
  const cap=Math.max(absBefore,Math.abs(top.omega0||absBefore||1)*capRatio);
  top.omega=sign*Math.min(cap,absAfter+(absBefore-absAfter)*fraction);
  top.spin=top.omega;
 }
 function clampVelocity(top,maxSpeed){
  const speed=mag(top.vx||0,top.vy||0);
  if(speed<=maxSpeed||speed<=0)return speed;
  top.vx=top.vx/speed*maxSpeed;
  top.vy=top.vy/speed*maxSpeed;
  return maxSpeed;
 }
 function awakenTwin(survivor,fallen){
  if(!isTwinUnit(survivor)||survivor.twinInheritanceAwakened||!combatAlive(survivor))return;
  const alphaSurvives=survivor.splitPart==='α';
  survivor.twinInheritanceAwakened=true;
  survivor.twinInheritanceMode=alphaSurvives?'guardian':'hunter';
  survivor.twinFallenPart=fallen?.splitPart||'?';
  survivor.twinInheritancePulse=1;
  survivor.twinInheritanceTimer=0;
  survivor.twinHuntCooldown=alphaSurvives ? .72 : 1.10;
  survivor.twinHuntCharge=0;
  survivor.twinAwakeningStabilize=.82;
  survivor.twinHunterHitCooldown=.26;
  survivor.hudWeight=1;

  if(alphaSurvives){
   survivor.energy=clamp((survivor.energy||0)+26,0,100);
   survivor.omega*=1.10;survivor.spin=survivor.omega;
   survivor.burstMeter=(survivor.burstMeter||0)*.34;
   survivor.tilt=clamp((survivor.tilt||0)*.58,0,.50);
   survivor.tiltVel=(survivor.tiltVel||0)*.40;
   survivor.lift=clamp((survivor.lift||0)*.45,0,1);
   survivor.impactBoost=Math.max(survivor.impactBoost||0,36);
   clampVelocity(survivor,188);
  }else{
   survivor.energy=clamp((survivor.energy||0)+18,0,100);
   survivor.omega*=1.14;survivor.spin=survivor.omega;
   survivor.burstMeter=(survivor.burstMeter||0)*.50;
   survivor.tiltVel+=(Math.sign(survivor.omega)||1)*.022;
   survivor.impactBoost=Math.max(survivor.impactBoost||0,68);
   clampVelocity(survivor,224);
  }

  emit(survivor.x,survivor.y,alphaSurvives?survivor.c.primary:survivor.c.secondary,56,1.25,'streak');
  emit(survivor.x,survivor.y,survivor.c.accent,34,1.02);
  wave(survivor.x,survivor.y,alphaSurvives?'#8fe8ff':'#d89cff',104);
  wave(survivor.x,survivor.y,survivor.c.accent,72);
  shake=Math.max(shake,12);flash=Math.max(flash,.48);
  addLog(alphaSurvives
   ?`${survivor.c.name} 的 β 星核先行停止！α 吸收雙生餘能，覺醒「恆星守核」：防禦、續航與抗擊飛大幅提升！`
   :`${survivor.c.name} 的 α 主核先行停止！β 繼承戰鬥意志，覺醒「彗星獵核」：索敵、追擊與爆發攻擊大幅提升！`);
 }

 function enhancePanel(id){
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.splitTop)return;
  const ability=host.querySelector('.split-ability');
  if(!ability)return;
  ability.innerHTML='<strong>雙生繼承機構・穩定版</strong>任一星核停止後，存活者會先進入短暫穩定窗再覺醒。α 恆星守核維持防禦與續航；β 彗星獵核保留索敵爆發，但加入速度上限、場邊回正與連續撞擊冷卻，避免覺醒後失控暴走。<div class="combo-tags"><span>覺醒穩定窗</span><span>α・恆星守核</span><span>β・彗星獵核</span><span>防暴走</span></div>';
 }
 const previousRenderPanel=renderPanel;
 renderPanel=function(id){previousRenderPanel(id);enhancePanel(id)};

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.twinBondEstablished=false;
   this.twinInheritanceAwakened=false;
   this.twinInheritanceMode='';
   this.twinFallenPart='';
   this.twinInheritancePulse=0;
   this.twinInheritanceTimer=0;
   this.twinHuntCooldown=0;
   this.twinHuntCharge=0;
   this.twinHuntTarget=null;
   this.twinAwakeningStabilize=0;
   this.twinHunterHitCooldown=0;
  }
  update(dt,opponent){
   const beforeEnergy=this.energy||0,beforeOmega=this.omega||0;
   super.update(dt,opponent);
   this.twinInheritancePulse=Math.max(0,(this.twinInheritancePulse||0)-dt*1.25);
   this.twinAwakeningStabilize=Math.max(0,(this.twinAwakeningStabilize||0)-dt);
   this.twinHunterHitCooldown=Math.max(0,(this.twinHunterHitCooldown||0)-dt);
   if(!isTwinUnit(this))return;

   const partner=twinPartner(this);
   if(partner&&combatAlive(this)&&combatAlive(partner))this.twinBondEstablished=true;
   if(this.twinBondEstablished&&!this.twinInheritanceAwakened&&partner&&!combatAlive(partner)&&combatAlive(this))awakenTwin(this,partner);
   if(!this.twinInheritanceAwakened||!combatAlive(this))return;

   this.twinInheritanceTimer+=dt;
   const cx=W/2,cy=H/2,centreDx=cx-this.x,centreDy=cy-this.y,centreDistance=mag(centreDx,centreDy)||1;
   const edge=clamp((centreDistance-innerR*.72)/Math.max(1,outerR-innerR*.72),0,1);
   if(this.twinAwakeningStabilize>0){
    const stabilize=this.twinAwakeningStabilize/.82;
    this.vx*=Math.exp(-(.42+.38*stabilize)*dt);
    this.vy*=Math.exp(-(.42+.38*stabilize)*dt);
    this.vx+=centreDx/centreDistance*(12+edge*38)*dt;
    this.vy+=centreDy/centreDistance*(12+edge*38)*dt;
    clampVelocity(this,this.twinInheritanceMode==='guardian'?188:224);
   }
   if(this.twinInheritanceMode==='guardian'){
    if(this.energy<beforeEnergy)this.energy=clamp(this.energy+(beforeEnergy-this.energy)*.32,0,100);
    restoreSpinLoss(this,beforeOmega,.24,1.24);
    this.energy=clamp(this.energy+dt*.42,0,100);
    this.tiltVel*=Math.exp(-1.65*dt);
    this.tilt=clamp(this.tilt-dt*.018,0,.48);
    this.lift=clamp((this.lift||0)-dt*.12,0,1);
    this.vx+=centreDx/centreDistance*(18+edge*34)*dt;
    this.vy+=centreDy/centreDistance*(18+edge*34)*dt;
    clampVelocity(this,208-edge*18);
   }else if(this.twinInheritanceMode==='hunter'){
    this.twinHuntCooldown=Math.max(0,this.twinHuntCooldown-dt);
    const target=validEnemy(this,opponent)?opponent:nearestEnemy(this);
    this.twinHuntTarget=target;
    if(target){
     const dx0=target.x-this.x,dy0=target.y-this.y,d0=mag(dx0,dy0)||1;
     const lead=clamp(d0/260,.06,.30);
     const aimX=target.x+(target.vx||0)*lead,aimY=target.y+(target.vy||0)*lead;
     let dx=aimX-this.x,dy=aimY-this.y,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d;
     if(edge>0){
      const inwardX=centreDx/centreDistance,inwardY=centreDy/centreDistance,mix=edge*(.46+.22*edge);
      nx=nx*(1-mix)+inwardX*mix;ny=ny*(1-mix)+inwardY*mix;
      const nd=mag(nx,ny)||1;nx/=nd;ny/=nd;
     }
     const desiredSpeed=clamp(220+(100-clamp(this.energy,0,100))*.55,220,278)-edge*34;
     const blend=clamp(dt*3.8,0,.22);
     this.vx+=(nx*desiredSpeed-this.vx)*blend;
     this.vy+=(ny*desiredSpeed-this.vy)*blend;
     const speed=mag(this.vx,this.vy)||1;
     const alignment=(this.vx/speed)*nx+(this.vy/speed)*ny;
     if(alignment>.80&&d0>this.r+target.r+24&&d0<innerR*1.45)this.twinHuntCharge+=dt;
     else this.twinHuntCharge=Math.max(0,this.twinHuntCharge-dt*1.7);
     if(this.twinHuntCharge>=.42&&this.twinHuntCooldown<=0&&this.twinAwakeningStabilize<=0){
      this.vx+=nx*42;this.vy+=ny*42;
      this.twinHuntCharge=0;this.twinHuntCooldown=1.42;
      this.impactBoost=Math.max(this.impactBoost||0,84);
      emit(this.x,this.y,this.c.secondary,18,.52,'streak');
      wave(this.x,this.y,this.c.accent,44);
      addLog(`${this.c.name}・β 完成雙生繼承索敵，發動「彗星追核」！`);
     }
    }
    this.energy=Math.max(0,this.energy-dt*.28);
    clampVelocity(this,286-edge*42);
   }
  }
  draw(){
   super.draw();
   if(!this.twinInheritanceAwakened||!combatAlive(this))return;
   const guardian=this.twinInheritanceMode==='guardian';
   const pulse=.5+.5*Math.sin(time*(guardian?4.2:7.4));
   ctx.save();ctx.translate(this.x,this.y);ctx.rotate(time*(guardian?-.65:1.35));
   ctx.globalCompositeOperation='screen';
   ctx.shadowBlur=14+(this.twinInheritancePulse||0)*18;
   ctx.shadowColor=guardian?this.c.primary:this.c.secondary;
   ctx.strokeStyle=alpha(guardian?'#9defff':'#d9a1ff',.34+pulse*.24+(this.twinInheritancePulse||0)*.25);
   ctx.lineWidth=1.5+(guardian?1.2:1.8)*pulse;
   if(guardian){
    for(let i=0;i<3;i++){
     ctx.beginPath();ctx.arc(0,0,this.r*(1.18+i*.16+pulse*.035),i*.55,Math.PI*1.45+i*.55);ctx.stroke();
    }
   }else{
    ctx.setLineDash([this.r*.18,this.r*.12]);
    ctx.beginPath();ctx.arc(0,0,this.r*(1.22+pulse*.10),0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);
    for(let i=0;i<4;i++){
     const a=i*Math.PI/2;
     ctx.beginPath();ctx.moveTo(Math.cos(a)*this.r*1.08,Math.sin(a)*this.r*1.08);ctx.lineTo(Math.cos(a)*this.r*1.48,Math.sin(a)*this.r*1.48);ctx.stroke();
    }
   }
   ctx.restore();
  }
 };

 const previousCollide=collide;
 collide=function(a,b){
  const same=teamOf(a)===teamOf(b);
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=(a.r||0)+(b.r||0);
  let contact=false,nx=0,ny=0;
  if(!same&&d&&d<min&&!a?.phaseInvisible&&!b?.phaseInvisible&&!a?.skyJumpGhost&&!b?.skyJumpGhost){
   nx=dx/d;ny=dy/d;
   contact=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny)>0;
  }
  const beforeA={vx:a.vx,vy:a.vy,energy:a.energy,omega:a.omega,burst:a.burstMeter||0};
  const beforeB={vx:b.vx,vy:b.vy,energy:b.energy,omega:b.omega,burst:b.burstMeter||0};
  previousCollide(a,b);
  if(!contact||same)return;

  function guardianReduce(victim,before){
   if(victim?.twinInheritanceMode!=='guardian'||!victim.twinInheritanceAwakened)return;
   victim.vx=before.vx+(victim.vx-before.vx)*.68;
   victim.vy=before.vy+(victim.vy-before.vy)*.68;
   if(victim.energy<before.energy)victim.energy+= (before.energy-victim.energy)*.34;
   restoreSpinLoss(victim,before.omega,.28,1.24);
   const burstGain=(victim.burstMeter||0)-before.burst;
   if(burstGain>0)victim.burstMeter-=burstGain*.38;
   victim.tiltVel*=.82;victim.lift*=.78;
   clampVelocity(victim,208);
  }
  function hunterHit(attacker,victim,dirX,dirY){
   if(attacker?.twinInheritanceMode!=='hunter'||!attacker.twinInheritanceAwakened||attacker.twinHunterHitCooldown>0||!combatAlive(attacker)||!combatAlive(victim))return;
   const speed=mag(attacker.vx,attacker.vy);
   const power=clamp(.72+speed/360,.85,1.55);
   const force=42+power*38;
   victim.vx+=dirX*force;victim.vy+=dirY*force;
   victim.omega*=clamp(.94-power*.035,.875,.91);victim.spin=victim.omega;
   victim.energy=Math.max(0,victim.energy-(3.8+power*2.8));
   victim.burstMeter=(victim.burstMeter||0)+4.5+power*3.2;
   victim.tiltVel+=(.10+power*.075)/Math.max(.75,victim.tip?.stability||1);
   attacker.omega*=.972;attacker.spin=attacker.omega;
   attacker.twinHunterHitCooldown=.24;
   clampVelocity(attacker,286);
   emit((attacker.x+victim.x)/2,(attacker.y+victim.y)/2,attacker.c.secondary,24,.72,'streak');
   wave((attacker.x+victim.x)/2,(attacker.y+victim.y)/2,attacker.c.accent,56);
   shake=Math.max(shake,7.5);flash=Math.max(flash,.18);
  }
  guardianReduce(a,beforeA);guardianReduce(b,beforeB);
  hunterHit(a,b,nx,ny);hunterHit(b,a,-nx,-ny);
 };

 enhancePanel('p1');enhancePanel('p2');
 const log=document.querySelector('#log');
 if(log)log.textContent='「雙生星核」已獲得死亡繼承：β 先停止時 α 覺醒恆星守核；α 先停止時 β 覺醒彗星獵核。';
 document.documentElement.dataset.twinInheritance='stable-v2';
})();
