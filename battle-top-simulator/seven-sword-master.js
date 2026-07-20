/* Sevenfold Sword Sovereign V1: seven non-repeating sword arts with active guard and counterplay */
(() => {
 const SWORD_KEY='sevenfoldSwordSovereign';
 const SEVENFOLD_SWORD={
  label:'[SPECIAL] 七曜劍皇｜Sevenfold Sword Sovereign',
  name:'七曜劍皇',englishName:'Sevenfold Sword Sovereign',
  combo:'7-70 Saber Point',
  rank:'七式劍譜・格擋反擊',tier:'SPECIAL',type:'balance',
  a:82,d:79,s:83,w:78,b:88,spin:'R',shape:'sevenfoldSword',
  sevenSword:true,
  primary:'#6fd8ff',secondary:'#8b63ff',accent:'#fff2ae',metal:'#e7f2ff'
 };
 const ARTS=[
  {id:'flash',name:'一式・霜華一閃'},
  {id:'moon',name:'二式・流月旋斬'},
  {id:'pierce',name:'三式・破陣突刺'},
  {id:'swallow',name:'四式・燕返雙斬'},
  {id:'shadow',name:'五式・追影劍步'},
  {id:'draw',name:'六式・斷空拔刀'},
  {id:'guard',name:'七式・鏡鋼格擋'}
 ];
 metaPresets[SWORD_KEY]=SEVENFOLD_SWORD;

 const teamOf=top=>top?.teamIndex??(top?.index?1:0);
 const combatReady=top=>!!top&&!top.out&&!top.burst&&!top.phaseInvisible&&!top.skyJumpGhost&&top.energy>0;
 const validEnemy=(source,target)=>combatReady(target)&&source!==target&&teamOf(source)!==teamOf(target)&&target.charmedBy!==source;
 const shuffled=items=>{
  const out=[...items];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  return out;
 };
 function nearestEnemy(source,preferred){
  if(validEnemy(source,preferred))return preferred;
  let best=null,bestScore=Infinity;
  tops.forEach(target=>{
   if(!validEnemy(source,target))return;
   const d=mag(target.x-source.x,target.y-source.y);
   const score=d-(100-clamp(target.energy||0,0,100))*.12;
   if(score<bestScore){best=target;bestScore=score}
  });
  return best;
 }
 function aimPoint(source,target,lead=.10,radius=outerR*.80){
  const point={x:target.x+(target.vx||0)*lead,y:target.y+(target.vy||0)*lead};
  const cx=W/2,cy=H/2,dx=point.x-cx,dy=point.y-cy,d=mag(dx,dy)||1;
  if(d<=radius)return point;
  return {x:cx+dx/d*radius,y:cy+dy/d*radius};
 }
 function snapshot(top){
  return {vx:top.vx,vy:top.vy,omega:top.omega,energy:top.energy,tiltVel:top.tiltVel,lift:top.lift||0,impactBoost:top.impactBoost||0,burstMeter:top.burstMeter||0};
 }
 function softenFrom(top,before,factor){
  if(!top||!before)return;
  top.vx=before.vx+(top.vx-before.vx)*factor;
  top.vy=before.vy+(top.vy-before.vy)*factor;
  top.omega=before.omega+(top.omega-before.omega)*factor;top.spin=top.omega;
  top.energy=before.energy+(top.energy-before.energy)*factor;
  top.tiltVel=before.tiltVel+(top.tiltVel-before.tiltVel)*factor;
  top.lift=before.lift+(top.lift-before.lift)*factor;
  top.impactBoost=before.impactBoost+(top.impactBoost-before.impactBoost)*factor;
  top.burstMeter=before.burstMeter+(top.burstMeter-before.burstMeter)*factor;
 }
 function defenseScale(victim){
  let scale=clamp(1-(Math.max(0,(victim?.c?.d||70)-70))*.0042,.72,1);
  if(victim?.c?.type==='defense')scale*=.88;
  if(victim?.twinInheritanceMode==='guardian')scale*=.82;
  if(victim?.morphMode==='aegis')scale*=.78;
  return clamp(scale,.55,1);
 }

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.sevenSword)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box seven-sword-ability';
  ability.innerHTML='<strong>七式劍譜機構</strong>七種劍技採不重複輪替，完整使用一輪後重新洗牌。包含高速一閃、弧線旋斬、破甲突刺、雙段燕返、預判追影、重蓄拔刀與鏡鋼格擋；格擋成功會削弱所有碰撞效果並立即反震。<div class="combo-tags"><span>七技輪替</span><span>預判斬擊</span><span>格擋反擊</span><span>招式空窗</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.swordBag=data.sevenSword?shuffled(ARTS.map(a=>a.id)):[];
   this.swordState='idle';
   this.swordArt='';
   this.swordArtName='';
   this.swordTimer=0;
   this.swordCooldown=data.sevenSword?rnd(1.5,2.5):999;
   this.swordRecovery=0;
   this.swordTarget=null;
   this.swordLeadPoint=null;
   this.swordHitWindow=0;
   this.swordHitCharges=0;
   this.swordContactCooldown=0;
   this.swordComboLeft=0;
   this.swordPulse=0;
   this.swordGuardPulse=0;
   this.swordGuardCountered=false;
  }
  isSwordUser(){return !!this.c.sevenSword}
  refillSwordBag(){if(!this.swordBag.length)this.swordBag=shuffled(ARTS.map(a=>a.id))}
  chooseSwordArt(target){
   this.refillSwordBag();
   const incoming=target?mag(target.vx||0,target.vy||0)+(target.impactBoost||0)*.35:0;
   const guardIndex=this.swordBag.indexOf('guard');
   let index=0;
   if(guardIndex>=0&&incoming>245&&Math.random()<.72)index=guardIndex;
   else index=Math.floor(Math.random()*this.swordBag.length);
   return this.swordBag.splice(index,1)[0];
  }
  beginSwordArt(target){
   if(!target)return false;
   const art=this.chooseSwordArt(target),meta=ARTS.find(a=>a.id===art);
   this.swordArt=art;this.swordArtName=meta?.name||art;this.swordTarget=target;
   this.swordLeadPoint=null;this.swordHitWindow=0;this.swordHitCharges=0;this.swordContactCooldown=0;this.swordComboLeft=0;this.swordPulse=1;this.swordGuardCountered=false;
   if(art==='flash'){
    this.swordState='flashCharge';this.swordTimer=rnd(.16,.25);this.vx*=.92;this.vy*=.92;
   }else if(art==='moon'){
    this.swordState='moon';this.swordTimer=rnd(.72,.94);this.swordHitCharges=1;this.swordHitWindow=this.swordTimer;
   }else if(art==='pierce'){
    this.swordState='pierceCharge';this.swordTimer=rnd(.42,.62);this.vx*=.78;this.vy*=.78;
   }else if(art==='swallow'){
    this.swordState='swallowCharge';this.swordTimer=.18;this.swordComboLeft=2;this.vx*=.88;this.vy*=.88;
   }else if(art==='shadow'){
    this.swordState='shadow';this.swordTimer=rnd(1.15,1.48);this.swordHitCharges=2;this.swordHitWindow=this.swordTimer;this.swordContactCooldown=.18;
   }else if(art==='draw'){
    this.swordState='drawCharge';this.swordTimer=rnd(.58,.82);this.vx*=.70;this.vy*=.70;
   }else{
    this.swordState='guard';this.swordTimer=rnd(.78,1.08);this.swordHitCharges=0;this.swordGuardPulse=1;this.vx*=.76;this.vy*=.76;
   }
   emit(this.x,this.y,this.c.primary,18,.56,'streak');wave(this.x,this.y,this.c.secondary,38);
   addLog(`${this.c.name} 展開「${this.swordArtName}」！`);
   return true;
  }
  finishSwordArt(extraRecovery=0){
   const base=this.swordArt==='guard'?.26:this.swordArt==='draw'?.72:this.swordArt==='pierce'?.52:.34;
   this.swordState='idle';this.swordTimer=0;this.swordHitWindow=0;this.swordHitCharges=0;this.swordContactCooldown=0;this.swordComboLeft=0;this.swordTarget=null;this.swordLeadPoint=null;
   this.swordRecovery=Math.max(this.swordRecovery,base+extraRecovery);
   this.swordCooldown=rnd(1.35,2.35)+this.swordRecovery*.35;
  }
  cancelSwordArt(){
   if(this.swordState==='idle')return;
   this.finishSwordArt(.45);
   addLog(`${this.c.name} 的劍式受到控制干擾而中止。`);
  }
  launchSwordDash(target,state,speed,window,lead){
   const aim=aimPoint(this,target,lead,innerR*.98),dx=aim.x-this.x,dy=aim.y-this.y,d=mag(dx,dy)||1;
   this.swordState=state;this.swordTimer=window;this.swordHitWindow=window;this.swordLeadPoint=aim;
   this.vx=dx/d*speed;this.vy=dy/d*speed;
   this.impactBoost=Math.max(this.impactBoost||0,speed*.25);
   emit(this.x,this.y,this.c.accent,22,.70,'streak');wave(this.x,this.y,this.c.primary,48);
  }
  updateMoon(dt,target){
   this.swordTimer-=dt;this.swordHitWindow=Math.max(0,this.swordHitWindow-dt);
   if(!target||this.swordTimer<=0){this.finishSwordArt();return}
   const dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d,sign=Math.sign(this.omega)||1,tx=-ny*sign,ty=nx*sign;
   const desired=220,radial=clamp((d-(this.r+target.r+34))*1.2,-55,70);
   this.vx+=(nx*radial+tx*desired-this.vx)*clamp(dt*4.4,0,.25);
   this.vy+=(ny*radial+ty*desired-this.vy)*clamp(dt*4.4,0,.25);
   this.swordLeadPoint={x:target.x,y:target.y};
  }
  updateShadow(dt,target){
   this.swordTimer-=dt;this.swordHitWindow=Math.max(0,this.swordHitWindow-dt);this.swordContactCooldown=Math.max(0,this.swordContactCooldown-dt);
   if(!target||this.swordTimer<=0){this.finishSwordArt();return}
   const d0=mag(target.x-this.x,target.y-this.y)||1,aim=aimPoint(this,target,clamp(d0/280,.07,.24)),dx=aim.x-this.x,dy=aim.y-this.y,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d;
   const desired=245,blend=clamp(dt*5.1,0,.29);
   this.vx+=(nx*desired-this.vx)*blend;this.vy+=(ny*desired-this.vy)*blend;this.swordLeadPoint=aim;
  }
  updateGuard(dt){
   this.swordTimer-=dt;this.swordGuardPulse=Math.max(0,this.swordGuardPulse-dt*1.4);
   this.vx*=Math.exp(-.38*dt);this.vy*=Math.exp(-.38*dt);this.tiltVel*=Math.exp(-1.15*dt);
   if(this.swordTimer<=0)this.finishSwordArt();
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.swordPulse=Math.max(0,this.swordPulse-dt*1.6);this.swordGuardPulse=Math.max(0,this.swordGuardPulse-dt*1.4);this.swordContactCooldown=Math.max(0,this.swordContactCooldown-dt);this.swordRecovery=Math.max(0,this.swordRecovery-dt);
   if(!this.isSwordUser()||this.out||this.burst)return;
   if(this.charmedBy){this.cancelSwordArt();return}
   if(this.phaseInvisible||this.skyJumpGhost)return;
   const target=nearestEnemy(this,opponent);this.swordTarget=validEnemy(this,this.swordTarget)?this.swordTarget:target;
   if(this.swordState==='idle'){
    if(this.swordRecovery>0){this.vx*=Math.exp(-.20*dt);this.vy*=Math.exp(-.20*dt);return}
    this.swordCooldown-=dt;
    if(this.swordCooldown<=0&&target)this.beginSwordArt(target);
    return;
   }
   const t=validEnemy(this,this.swordTarget)?this.swordTarget:target;this.swordTarget=t;
   if(this.swordState==='flashCharge'){
    this.swordTimer-=dt;if(!t){this.finishSwordArt();return}this.swordLeadPoint={x:t.x,y:t.y};if(this.swordTimer<=0)this.launchSwordDash(t,'flashRush',285,.34,.09);
   }else if(this.swordState==='flashRush'){
    this.swordTimer-=dt;this.swordHitWindow=Math.max(0,this.swordHitWindow-dt);if(this.swordTimer<=0)this.finishSwordArt(.16);
   }else if(this.swordState==='moon')this.updateMoon(dt,t);
   else if(this.swordState==='pierceCharge'){
    this.swordTimer-=dt;if(!t){this.finishSwordArt();return}this.swordLeadPoint={x:t.x,y:t.y};this.vx*=Math.exp(-.32*dt);this.vy*=Math.exp(-.32*dt);if(this.swordTimer<=0)this.launchSwordDash(t,'pierceRush',318,.42,.13);
   }else if(this.swordState==='pierceRush'){
    this.swordTimer-=dt;this.swordHitWindow=Math.max(0,this.swordHitWindow-dt);if(this.swordTimer<=0)this.finishSwordArt(.28);
   }else if(this.swordState==='swallowCharge'){
    this.swordTimer-=dt;if(!t){this.finishSwordArt();return}if(this.swordTimer<=0)this.launchSwordDash(t,'swallowRush',260,.30,.08);
   }else if(this.swordState==='swallowRush'){
    this.swordTimer-=dt;this.swordHitWindow=Math.max(0,this.swordHitWindow-dt);
    if(this.swordTimer<=0){this.swordComboLeft--;if(this.swordComboLeft>0){this.swordState='swallowTurn';this.swordTimer=.18;this.vx*=-.36;this.vy*=-.36}else this.finishSwordArt(.22)}
   }else if(this.swordState==='swallowTurn'){
    this.swordTimer-=dt;if(!t){this.finishSwordArt();return}if(this.swordTimer<=0)this.launchSwordDash(t,'swallowRush',278,.32,.12);
   }else if(this.swordState==='shadow')this.updateShadow(dt,t);
   else if(this.swordState==='drawCharge'){
    this.swordTimer-=dt;if(!t){this.finishSwordArt();return}this.swordLeadPoint={x:t.x,y:t.y};this.vx*=Math.exp(-.55*dt);this.vy*=Math.exp(-.55*dt);if(this.swordTimer<=0)this.launchSwordDash(t,'drawRush',340,.44,.15);
   }else if(this.swordState==='drawRush'){
    this.swordTimer-=dt;this.swordHitWindow=Math.max(0,this.swordHitWindow-dt);if(this.swordTimer<=0)this.finishSwordArt(.42);
   }else if(this.swordState==='guard')this.updateGuard(dt);
  }
  swordAttackActive(){return ['flashRush','moon','pierceRush','swallowRush','shadow','drawRush'].includes(this.swordState)&&this.swordHitWindow>0&&this.swordContactCooldown<=0}
  resolveSwordHit(victim,nx,ny){
   if(!this.swordAttackActive()||!validEnemy(this,victim))return false;
   const scale=defenseScale(victim),art=this.swordArt;
   let force=58,energy=3.5,spinLoss=.040,tilt=.10,lift=.06,burst=3.6,recovery=.18;
   if(art==='flash'){force=76;energy=4.2;spinLoss=.045;tilt=.12;lift=.08;burst=4.1}
   else if(art==='moon'){force=54;energy=3.0;spinLoss=.035;tilt=.15;lift=.12;burst=3.4}
   else if(art==='pierce'){force=62;energy=5.6;spinLoss=.085;tilt=.11;lift=.05;burst=6.0;recovery=.30}
   else if(art==='swallow'){force=55;energy=3.2;spinLoss=.040;tilt=.10;lift=.06;burst=3.2}
   else if(art==='shadow'){force=46;energy=2.7;spinLoss=.032;tilt=.08;lift=.05;burst=2.8}
   else if(art==='draw'){force=98;energy=7.0;spinLoss=.070;tilt=.20;lift=.15;burst=7.8;recovery=.46}
   victim.vx+=nx*force*scale;victim.vy+=ny*force*scale;
   victim.energy=Math.max(0,victim.energy-energy*scale);
   victim.omega*=clamp(1-spinLoss*scale,.82,.98);victim.spin=victim.omega;
   victim.tiltVel+=tilt*scale/Math.max(.76,victim.tip?.stability||1);
   victim.lift=clamp((victim.lift||0)+lift*scale,0,1);
   victim.burstMeter=(victim.burstMeter||0)+burst*scale;
   victim.impactBoost=Math.max(victim.impactBoost||0,force*.72*scale);
   this.omega*=art==='draw'?.974:art==='pierce'?.984:.991;this.spin=this.omega;
   this.swordContactCooldown=art==='shadow'?.30:.18;
   if(art==='shadow')this.swordHitCharges--;
   else if(art==='moon')this.swordHitCharges=0;
   else if(art==='swallow')this.swordHitWindow=0;
   else this.swordHitWindow=0;
   this.swordPulse=1;
   const cx=(this.x+victim.x)/2,cy=(this.y+victim.y)/2;
   emit(cx,cy,this.c.accent,18+(art==='draw'?14:0),.65,'streak');wave(cx,cy,this.c.primary,44+(art==='draw'?24:0));shake=Math.max(shake,art==='draw'?8:4.5);
   addLog(`${this.c.name} 的「${this.swordArtName}」命中！`);
   if(art==='flash'||art==='pierce'||art==='draw')this.finishSwordArt(recovery);
   else if(art==='moon'&&this.swordHitCharges<=0)this.finishSwordArt(.12);
   else if(art==='shadow'&&this.swordHitCharges<=0)this.finishSwordArt(.20);
   return true;
  }
  bladeCount(){return this.c.shape==='sevenfoldSword'?7:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='sevenfoldSword'){
    const profile=[1.22,.78,1.06,.72,.98,.75,.90];return this.r*profile[i%profile.length];
   }
   return super.bladeRadius(i);
  }
  draw(){
   super.draw();
   if(!this.isSwordUser()||this.out||this.burst)return;
   const active=this.swordState!=='idle',pulse=.5+.5*Math.sin(time*(this.swordState==='guard'?5.2:8.4));
   ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';ctx.rotate(time*(this.swordState==='guard'?-.72:1.25));
   ctx.shadowBlur=12+(active?8:0);ctx.shadowColor=this.swordState==='guard'?this.c.accent:this.c.primary;
   ctx.strokeStyle=alpha(this.swordState==='guard'?this.c.accent:this.c.primary,active?.42+pulse*.18:.12);ctx.lineWidth=1.3+(active?1.0:0);
   const count=this.swordState==='guard'?4:7;
   for(let i=0;i<count;i++){
    const a=i*Math.PI*2/count,inner=this.r*(1.02+(this.swordState==='guard'?.12:0)),outer=this.r*(1.46+pulse*.08);
    ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a+.10)*outer,Math.sin(a+.10)*outer);ctx.stroke();
   }
   if(this.swordState==='guard'){
    ctx.strokeStyle=alpha(this.c.accent,.40+pulse*.30);ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,this.r*(1.25+pulse*.04),0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();
   if(active){
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${Math.max(8,this.r*.28)}px system-ui`;ctx.shadowBlur=9;ctx.shadowColor=this.c.primary;ctx.fillStyle=alpha(this.c.accent,.82);ctx.fillText(this.swordArtName,this.x,this.y-this.r*1.72);ctx.restore();
   }
  }
 };

 function interruptSwordCharge(top,closing){
  if(!top?.c?.sevenSword||!['pierceCharge','drawCharge'].includes(top.swordState)||closing<82)return;
  top.vx*=.76;top.vy*=.76;top.tiltVel+=.055;top.finishSwordArt(.55);
  emit(top.x,top.y,top.c.accent,16,.46,'streak');wave(top.x,top.y,top.c.primary,32);
  addLog(`${top.c.name} 的重蓄劍式被強碰撞打斷！`);
 }
 const previousCollide=collide;
 collide=function(a,b){
  const protectedState=a?.phaseInvisible||b?.phaseInvisible||a?.skyJumpGhost||b?.skyJumpGhost||a?.charmedBy===b||b?.charmedBy===a;
  const same=teamOf(a)===teamOf(b),dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=(a.r||0)+(b.r||0);
  let contact=false,nx=0,ny=0,closing=0;
  if(!protectedState&&!same&&d&&d<min){nx=dx/d;ny=dy/d;closing=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny);contact=closing>0}
  const guardA=contact&&a?.c?.sevenSword&&a.swordState==='guard';
  const guardB=contact&&b?.c?.sevenSword&&b.swordState==='guard';
  const beforeA=guardA?snapshot(a):null,beforeB=guardB?snapshot(b):null;
  previousCollide(a,b);
  if(!contact)return;
  interruptSwordCharge(a,closing);interruptSwordCharge(b,closing);
  if(a?.c?.sevenSword)a.resolveSwordHit?.(b,nx,ny);
  if(b?.c?.sevenSword)b.resolveSwordHit?.(a,-nx,-ny);
  if(guardA){
   softenFrom(a,beforeA,.34);
   a.vx-=nx*(20+closing*.16);a.vy-=ny*(20+closing*.16);b.vx+=nx*(32+closing*.20);b.vy+=ny*(32+closing*.20);
   b.omega*=.972;b.spin=b.omega;b.tiltVel+=.075;a.swordGuardPulse=1;
   emit(a.x,a.y,a.c.accent,24,.58,'streak');wave(a.x,a.y,a.c.primary,48);shake=Math.max(shake,5.5);
   if(!a.swordGuardCountered){a.swordGuardCountered=true;addLog(`${a.c.name} 以「鏡鋼格擋」化解衝擊並反震對手！`)}
   a.finishSwordArt(.18);
  }
  if(guardB){
   softenFrom(b,beforeB,.34);
   b.vx+=nx*(20+closing*.16);b.vy+=ny*(20+closing*.16);a.vx-=nx*(32+closing*.20);a.vy-=ny*(32+closing*.20);
   a.omega*=.972;a.spin=a.omega;a.tiltVel+=.075;b.swordGuardPulse=1;
   emit(b.x,b.y,b.c.accent,24,.58,'streak');wave(b.x,b.y,b.c.primary,48);shake=Math.max(shake,5.5);
   if(!b.swordGuardCountered){b.swordGuardCountered=true;addLog(`${b.c.name} 以「鏡鋼格擋」化解衝擊並反震對手！`)}
   b.finishSwordArt(.18);
  }
 };

 const style=document.createElement('style');
 style.textContent='.seven-sword-ability{border-color:#6fd8ff66;background:linear-gradient(135deg,#6fd8ff15,#8b63ff18);box-shadow:inset 0 0 24px #6fd8ff0e}';
 document.head.appendChild(style);
 cfg.p2={...SEVENFOLD_SWORD,preset:SWORD_KEY};
 renderPanel('p1');renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='「七曜劍皇」已加入：七種劍技採不重複輪替，包含可削弱完整碰撞效果並反震對手的鏡鋼格擋。';
 document.documentElement.dataset.sevenSword='v1';
})();
