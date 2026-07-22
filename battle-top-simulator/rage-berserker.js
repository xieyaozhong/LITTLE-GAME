/* Bloodrage Berserker V2: uncapped rage attack and intensified berserk effects */
(() => {
 const RAGE_KEY='bloodrageBerserker';
 const BLOODRAGE_BERSERKER={
  label:'[SPECIAL] 血怒狂戰士｜Bloodrage Berserker',
  name:'血怒狂戰士',englishName:'Bloodrage Berserker',
  combo:'4-Axe 3-60 Rage Rush',
  rank:'暗鋼戰斧・三段血怒',tier:'SPECIAL',type:'attack',
  a:84,d:66,s:74,w:86,b:84,spin:'R',shape:'bloodrageBerserker',
  rageEngine:true,
  primary:'#ff304c',secondary:'#ff8a28',accent:'#fff1be',metal:'#343946'
 };
 metaPresets[RAGE_KEY]=BLOODRAGE_BERSERKER;

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.rageEngine)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box rage-ability';
  ability.innerHTML='<strong>超限血怒機構</strong>能量越低，實戰攻擊、追擊加速度與最高移動速度越高。狂暴增益不受面板攻擊上限 100 限制，瀕危時可突破至約 178；代價是角速度消耗與失控傾斜同步提高。<div class="combo-tags"><span>攻擊突破100</span><span>低血超加速</span><span>高耗轉失控</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 function teamOf(top){return top?.teamIndex??(top?.index?1:0)}
 function rageRatio(top){
  if(!top?.c?.rageEngine)return 0;
  const missing=clamp(1-clamp(top.energy,0,100)/100,0,1);
  return Math.pow(missing,1.12);
 }
 function rageStage(top){
  const energy=clamp(top?.energy??100,0,100);
  return energy<=20?3:energy<=40?2:energy<=65?1:0;
 }
 function effectiveAttack(top){
  const base=clamp(top?.c?.a??0,0,100),rage=rageRatio(top);
  const uncappedBonus=rage*(72+22*rage);
  return clamp(base+uncappedBonus,base,200);
 }
 function validEnemy(source,target){
  return !!target&&source!==target&&teamOf(source)!==teamOf(target)&&!target.out&&!target.burst&&!target.phaseInvisible&&!target.skyJumpGhost&&target.energy>0;
 }
 function nearestEnemy(source,preferred){
  if(validEnemy(source,preferred))return preferred;
  let best=null,bestDistance=Infinity;
  tops.forEach(target=>{
   if(!validEnemy(source,target))return;
   const distance=mag(target.x-source.x,target.y-source.y);
   if(distance<bestDistance){best=target;bestDistance=distance}
  });
  return best;
 }

 function drawRageLightning(top,rage,stage){
  if(stage<2)return;
  const bolts=stage===3?5:3;
  ctx.save();ctx.translate(top.x,top.y);ctx.rotate(time*(1.7+rage));
  ctx.globalCompositeOperation='screen';ctx.shadowBlur=12+stage*3;ctx.shadowColor=top.c.accent;
  for(let i=0;i<bolts;i++){
   const a=i*Math.PI*2/bolts+Math.sin(time*5+i)*.16;
   const r1=top.r*(.72+.08*Math.sin(time*7+i));
   const r2=top.r*(1.42+rage*.34+.10*Math.cos(time*6+i));
   const mid=(r1+r2)*.5;
   ctx.strokeStyle=alpha(i%2?top.c.accent:top.c.secondary,.16+rage*.28);
   ctx.lineWidth=.8+rage*1.1;
   ctx.beginPath();
   ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);
   ctx.lineTo(Math.cos(a+.12)*mid,Math.sin(a+.12)*mid);
   ctx.lineTo(Math.cos(a-.07)*r2,Math.sin(a-.07)*r2);
   ctx.stroke();
  }
  ctx.restore();
 }

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.ragePulse=0;
   this.rageStageSeen=0;
   this.rageImpactFlash=0;
   this.rageFxTimer=.25;
   this.rageAttackValue=data.a||0;
   this.rageOvercapPulse=0;
  }
  update(dt,opponent){
   const isRager=!!this.c.rageEngine;
   const disabled=this.out||this.burst||this.phaseInvisible||this.skyJumpGhost||this.charmedBy;
   const rage=isRager&&!disabled?rageRatio(this):0;
   const baseAttack=this.c.a;
   const combatAttack=isRager&&!disabled?effectiveAttack(this):baseAttack;

   // Temporarily expose the uncapped value to the inherited physics engine so movement
   // and attack behaviour genuinely use values above the normal 100-point UI ceiling.
   if(isRager&&!disabled)this.c.a=combatAttack;
   try{super.update(dt,opponent)}finally{this.c.a=baseAttack}

   this.ragePulse+=dt*(2.4+rage*6.4);
   this.rageImpactFlash=Math.max(0,this.rageImpactFlash-dt*2.6);
   this.rageOvercapPulse=Math.max(0,this.rageOvercapPulse-dt*1.7);
   this.rageAttackValue=combatAttack;
   if(!isRager||disabled)return;

   const stage=rageStage(this);
   if(stage>this.rageStageSeen){
    this.rageStageSeen=stage;
    const stageName=stage===1?'血怒甦醒':stage===2?'狂戰沸騰':'瀕危暴走';
    emit(this.x,this.y,this.c.primary,24+stage*12,.68+stage*.16,'streak');
    emit(this.x,this.y,this.c.accent,10+stage*6,.46+stage*.10);
    wave(this.x,this.y,this.c.secondary,42+stage*18);
    wave(this.x,this.y,this.c.primary,30+stage*14);
    shake=Math.max(shake,3.5+stage*2.2);flash=Math.max(flash,.08+stage*.08);
    addLog(`${this.c.name} 進入「${stageName}」：實戰攻擊提升至 ${Math.round(combatAttack)}，已突破常規上限！`);
   }

   if(combatAttack>100&&this.rageAttackValue>=100)this.rageOvercapPulse=Math.max(this.rageOvercapPulse,.34);
   if(rage<=.02)return;
   const target=nearestEnemy(this,opponent);
   if(target){
    const dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1;
    const nx=dx/d,ny=dy/d,sign=Math.sign(this.omega)||1,tx=-ny*sign,ty=nx*sign;
    const overcap=Math.max(0,combatAttack-100);
    const chase=26+rage*(40+combatAttack*.22)+overcap*.10;
    const weave=11+rage*28;
    this.vx+=(nx*chase+tx*weave)*dt;
    this.vy+=(ny*chase+ty*weave)*dt;
   }

   const speed=mag(this.vx,this.vy);
   if(speed>12){
    const acceleration=1+dt*(.05+rage*.34+Math.max(0,combatAttack-100)*.0012);
    this.vx*=acceleration;this.vy*=acceleration;
   }
   const maxSpeed=230+combatAttack*1.02+(this.impactBoost||0)+rage*58;
   const boostedSpeed=mag(this.vx,this.vy);
   if(boostedSpeed>maxSpeed){this.vx=this.vx/boostedSpeed*maxSpeed;this.vy=this.vy/boostedSpeed*maxSpeed}

   // Stronger uncapped rage has a real cost: faster spin loss and growing instability.
   const overcap=Math.max(0,combatAttack-100);
   const extraDrain=(.010+rage*.024+rage*rage*.022+overcap*.00016)*dt;
   this.omega*=Math.exp(-extraDrain);this.spin=this.omega;
   this.tiltVel+=rage*rage*.0065*dt*(1+overcap/80);

   this.rageFxTimer-=dt;
   if(stage>=2&&this.rageFxTimer<=0){
    this.rageFxTimer=stage===3?rnd(.30,.48):rnd(.58,.82);
    wave(this.x,this.y,Math.random()<.5?this.c.primary:this.c.secondary,28+stage*12+rage*18);
    emit(this.x,this.y,Math.random()<.55?this.c.primary:this.c.accent,stage+1,.20+rage*.20,'streak');
   }
   if(Math.random()<dt*(3+rage*14))emit(this.x,this.y,Math.random()<.58?this.c.primary:this.c.secondary,1,.24+rage*.28,'streak');
  }
  bladeCount(){return this.c.shape==='bloodrageBerserker'?4:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='bloodrageBerserker'){
    const profile=[1.24,.69,1.08,.73];
    return this.r*profile[i%profile.length];
   }
   return super.bladeRadius(i);
  }
  draw(){
   super.draw();
   if(!this.c.rageEngine||this.out||this.burst)return;
   const rage=rageRatio(this),stage=rageStage(this),attack=effectiveAttack(this);
   if(rage<=.015)return;
   const pulse=.5+.5*Math.sin(this.ragePulse),speed=mag(this.vx,this.vy);

   // Velocity afterimages make the speed escalation readable.
   if(speed>120){
    const d=speed||1,nx=this.vx/d,ny=this.vy/d;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=1;i<=3;i++){
     ctx.strokeStyle=alpha(i%2?this.c.primary:this.c.secondary,(.055+rage*.09)*(1-i*.18));
     ctx.lineWidth=this.r*(.42-i*.07);
     ctx.lineCap='round';ctx.beginPath();
     ctx.moveTo(this.x-nx*this.r*(.7+i*.42),this.y-ny*this.r*(.7+i*.42));
     ctx.lineTo(this.x-nx*this.r*(1.1+i*.82+rage*.55),this.y-ny*this.r*(1.1+i*.82+rage*.55));ctx.stroke();
    }
    ctx.restore();
   }

   ctx.save();ctx.translate(this.x,this.y);ctx.rotate(-time*(1.25+rage*3.0));
   ctx.globalCompositeOperation='screen';ctx.shadowBlur=12+rage*24;ctx.shadowColor=this.c.primary;

   const rings=stage===3?4:stage===2?3:2;
   for(let ring=0;ring<rings;ring++){
    const ringPulse=.5+.5*Math.sin(this.ragePulse+ring*1.2);
    ctx.strokeStyle=alpha(ring%2?this.c.secondary:this.c.primary,.08+rage*(.25+ring*.045)+ringPulse*.06);
    ctx.lineWidth=1.1+rage*(1.5+ring*.34);
    ctx.setLineDash([this.r*(.10+ring*.025),this.r*(.16+ring*.018)]);
    ctx.beginPath();ctx.arc(0,0,this.r*(1.08+ring*.18+rage*.17+ringPulse*.035),0,Math.PI*2);ctx.stroke();
   }
   ctx.setLineDash([]);

   const flames=5+stage*3;
   for(let i=0;i<flames;i++){
    const a=i*Math.PI*2/flames+time*(1.25+rage*2.15);
    const flicker=.5+.5*Math.sin(this.ragePulse*1.4+i*2.1);
    const inner=this.r*(.88+rage*.10),outer=this.r*(1.20+rage*(.40+.12*flicker));
    ctx.strokeStyle=alpha(i%3===0?this.c.accent:(i%2?this.c.secondary:this.c.primary),.10+rage*(.34+.13*flicker));
    ctx.lineWidth=1.0+rage*(1.6+flicker*.8);
    ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);
    ctx.quadraticCurveTo(Math.cos(a+.13)*outer*.84,Math.sin(a+.13)*outer*.84,Math.cos(a+.29)*outer,Math.sin(a+.29)*outer);ctx.stroke();
   }

   // White-hot core at maximum rage.
   if(stage===3){
    const core=ctx.createRadialGradient(0,0,1,0,0,this.r*.95);
    core.addColorStop(0,alpha(this.c.accent,.18+.16*pulse));
    core.addColorStop(.45,alpha(this.c.secondary,.08+.10*pulse));
    core.addColorStop(1,'rgba(255,30,10,0)');
    ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,this.r*.98,0,Math.PI*2);ctx.fill();
   }

   if(this.rageImpactFlash>0||this.rageOvercapPulse>0){
    const flashPower=Math.max(this.rageImpactFlash,this.rageOvercapPulse);
    ctx.strokeStyle=alpha(this.c.accent,.58*flashPower);ctx.lineWidth=2.6;
    ctx.beginPath();ctx.arc(0,0,this.r*(1.20+(1-flashPower)*.82),0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();

   drawRageLightning(this,rage,stage);

   // Show the real uncapped combat attack above the top.
   if(attack>100){
    ctx.save();ctx.globalCompositeOperation='screen';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=`900 ${Math.max(9,this.r*.34)}px system-ui`;
    ctx.shadowBlur=10;ctx.shadowColor=this.c.primary;ctx.fillStyle=alpha(this.c.accent,.72+.20*pulse);
    ctx.fillText(`ATK ${Math.round(attack)}`,this.x,this.y-this.r*(1.72+stage*.05));ctx.restore();
   }
  }
 };

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

  function applyRageHit(attacker,victim,dirX,dirY){
   if(!attacker?.c?.rageEngine||attacker.out||attacker.burst||attacker.phaseInvisible||attacker.skyJumpGhost||attacker.charmedBy)return;
   const rage=rageRatio(attacker),attack=effectiveAttack(attacker);
   if(rage<=.03||victim.out||victim.burst)return;
   const overcap=Math.max(0,attack-100);
   const force=rage*(30+attack*.54)+overcap*.17;
   victim.vx+=dirX*force;victim.vy+=dirY*force;
   victim.omega*=1-rage*(.060+overcap*.00022);victim.spin=victim.omega;
   victim.tiltVel+=(.052+rage*.145+overcap*.0008)/Math.max(.76,victim.tip?.stability||1);
   victim.lift=clamp((victim.lift||0)+rage*(.068+overcap*.00035),0,1);
   victim.impactBoost=Math.max(victim.impactBoost||0,32+rage*54+overcap*.22);
   victim.burstMeter=(victim.burstMeter||0)+rage*(4.4+overcap*.025);
   attacker.omega*=1-rage*(.0048+overcap*.000018);attacker.spin=attacker.omega;
   attacker.rageImpactFlash=1;attacker.rageOvercapPulse=attack>100?1:attacker.rageOvercapPulse;
   if(rage>.42){
    const cx=(attacker.x+victim.x)/2,cy=(attacker.y+victim.y)/2;
    emit(cx,cy,attacker.c.primary,16+Math.round(rage*24),.55+rage*.55,'streak');
    emit(cx,cy,attacker.c.accent,6+Math.round(overcap*.08),.42+rage*.30);
    wave(cx,cy,attacker.c.secondary,38+rage*36+overcap*.16);
    shake=Math.max(shake,4+rage*6+overcap*.018);flash=Math.max(flash,.05+rage*.12);
   }
  }

  applyRageHit(a,b,nx,ny);
  applyRageHit(b,a,-nx,-ny);
 };

 const style=document.createElement('style');
 style.textContent='.rage-ability{border-color:#e9363670;background:linear-gradient(135deg,#e936361b,#ff8a2418);box-shadow:inset 0 0 28px #e9363614,0 0 18px #e9363608}';
 document.head.appendChild(style);

 cfg.p2={...BLOODRAGE_BERSERKER,preset:RAGE_KEY};
 renderPanel('p1');renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;
 document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='「血怒狂戰士」已超限強化：低能量時實戰攻擊可突破 100，並伴隨多層血焰、雷弧、速度殘影與即時 ATK 顯示。';
})();
