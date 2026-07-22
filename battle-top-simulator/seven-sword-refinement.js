/* Sevenfold Sword Refinement V1: readable windups, softer damage, higher endurance, and layered sword effects */
(() => {
 const KEY='sevenfoldSwordSovereign';
 const ART_META={
  flash:{windup:[.30,.38],speed:265,window:.36,lead:.10,color:'#bff7ff',glyph:'閃'},
  moon:{windup:[.34,.44],duration:[.82,1.02],color:'#9bbcff',glyph:'月'},
  pierce:{windup:[.56,.72],speed:292,window:.43,lead:.14,color:'#ffe49a',glyph:'破'},
  swallow:{windup:[.30,.39],speed:242,secondSpeed:255,window:.32,lead:.09,color:'#d7b4ff',glyph:'燕'},
  shadow:{windup:[.38,.50],duration:[1.22,1.52],color:'#87e7ff',glyph:'影'},
  draw:{windup:[.76,.96],speed:312,window:.46,lead:.16,color:'#fff4c6',glyph:'斷'},
  guard:{windup:[.28,.36],duration:[.88,1.18],color:'#e7f7ff',glyph:'御'}
 };
 const ATTACK_STATES=new Set(['flashRush','moon','pierceRush','swallowRush','shadow','drawRush']);
 const artMeta=art=>ART_META[art]||ART_META.flash;
 const sample=range=>rnd(range[0],range[1]);
 const teamOf=top=>top?.teamIndex??(top?.index?1:0);
 const validEnemy=(source,target)=>!!target&&source!==target&&teamOf(source)!==teamOf(target)&&!target.out&&!target.burst&&!target.phaseInvisible&&!target.skyJumpGhost&&(target.energy||0)>0;
 const absRestore=(top,before,fraction)=>{
  const after=Math.abs(top.omega||0),start=Math.abs(before||0);
  if(after>=start)return;
  const sign=Math.sign(top.omega)||Math.sign(before)||1;
  top.omega=sign*(after+(start-after)*fraction);top.spin=top.omega;
 };
 const snapshot=top=>({
  vx:top.vx||0,vy:top.vy||0,omega:top.omega||0,energy:top.energy||0,
  tiltVel:top.tiltVel||0,lift:top.lift||0,impactBoost:top.impactBoost||0,
  burstMeter:top.burstMeter||0,burst:!!top.burst
 });
 const softenBonus=(top,before,retain)=>{
  if(!top||!before)return;
  top.vx=before.vx+(top.vx-before.vx)*retain;
  top.vy=before.vy+(top.vy-before.vy)*retain;
  top.omega=before.omega+(top.omega-before.omega)*retain;top.spin=top.omega;
  top.energy=before.energy+(top.energy-before.energy)*retain;
  top.tiltVel=before.tiltVel+((top.tiltVel||0)-before.tiltVel)*retain;
  top.lift=before.lift+((top.lift||0)-before.lift)*retain;
  top.impactBoost=before.impactBoost+((top.impactBoost||0)-before.impactBoost)*retain;
  top.burstMeter=before.burstMeter+((top.burstMeter||0)-before.burstMeter)*retain;
  if(!before.burst&&top.burst&&top.burstMeter<100)top.burst=false;
 };
 function tuneConfig(c){
  if(!c||(!c.sevenSword&&c.preset!==KEY))return;
  c.a=78;c.d=82;c.s=90;c.w=80;c.b=91;
  c.rank='七式劍譜・蓄勢連環・持久劍心';
 }
 if(metaPresets?.[KEY])tuneConfig(metaPresets[KEY]);
 if(typeof cfg==='object'){tuneConfig(cfg.p1);tuneConfig(cfg.p2)}

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.sevenSword)return;
  const box=host.querySelector('.seven-sword-ability');
  if(box)box.innerHTML='<strong>七式劍譜・蓄勢劍心</strong>七種劍技現在都有清楚前搖與劍陣預告，威力與突進速度略降，但耐力、穩定性及爆裂抗性提高。出劍時會形成鎖定線、劍氣殘影與分層斬擊光效；前搖仍可被強碰撞打斷。<div class="combo-tags"><span>可見前搖</span><span>持久劍心</span><span>劍氣殘影</span><span>蓄勢可破</span></div>';
 };

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.swordPendingArt='';
   this.swordWindupDuration=0;
   this.swordWindupProgress=0;
   this.swordFxTrail=[];
   this.swordFxBursts=[];
   this.swordFxAngle=0;
   this.swordRefined=!!data.sevenSword;
  }
  beginSwordArt(target){
   if(!this.isSwordUser?.()||!validEnemy(this,target))return false;
   const art=this.chooseSwordArt(target),meta=artMeta(art);
   const named={flash:'一式・霜華一閃',moon:'二式・流月旋斬',pierce:'三式・破陣突刺',swallow:'四式・燕返雙斬',shadow:'五式・追影劍步',draw:'六式・斷空拔刀',guard:'七式・鏡鋼格擋'};
   this.swordArt=art;this.swordArtName=named[art]||art;this.swordPendingArt=art;this.swordTarget=target;
   this.swordState='windup';this.swordWindupDuration=sample(meta.windup);this.swordTimer=this.swordWindupDuration;this.swordWindupProgress=0;
   this.swordLeadPoint={x:target.x,y:target.y};this.swordHitWindow=0;this.swordHitCharges=0;this.swordContactCooldown=0;this.swordComboLeft=0;
   this.swordPulse=1;this.swordGuardPulse=0;this.swordGuardCountered=false;this.swordFxAngle=Math.atan2(target.y-this.y,target.x-this.x);
   this.vx*=art==='draw'?.68:art==='pierce'?.76:art==='guard'?.80:.86;
   this.vy*=art==='draw'?.68:art==='pierce'?.76:art==='guard'?.80:.86;
   emit(this.x,this.y,meta.color,22,.72,'streak');emit(this.x,this.y,this.c.primary,12,.52);wave(this.x,this.y,this.c.secondary,44);
   addLog(`${this.c.name} 收束轉軸，為「${this.swordArtName}」展開蓄勢劍陣！`);
   return true;
  }
  activateRefinedArt(target){
   const art=this.swordPendingArt||this.swordArt,meta=artMeta(art);
   this.swordPendingArt='';this.swordWindupProgress=1;this.swordPulse=1;
   if(!validEnemy(this,target)){this.finishSwordArt(.22);return}
   if(art==='flash')this.launchSwordDash(target,'flashRush',meta.speed,meta.window,meta.lead);
   else if(art==='moon'){
    this.swordState='moon';this.swordTimer=sample(meta.duration);this.swordHitCharges=1;this.swordHitWindow=this.swordTimer;
   }else if(art==='pierce')this.launchSwordDash(target,'pierceRush',meta.speed,meta.window,meta.lead);
   else if(art==='swallow'){
    this.swordComboLeft=2;this.launchSwordDash(target,'swallowRush',meta.speed,meta.window,meta.lead);
   }else if(art==='shadow'){
    this.swordState='shadow';this.swordTimer=sample(meta.duration);this.swordHitCharges=2;this.swordHitWindow=this.swordTimer;this.swordContactCooldown=.20;
   }else if(art==='draw')this.launchSwordDash(target,'drawRush',meta.speed,meta.window,meta.lead);
   else{
    this.swordState='guard';this.swordTimer=sample(meta.duration);this.swordHitCharges=0;this.swordGuardPulse=1;this.vx*=.82;this.vy*=.82;
   }
   emit(this.x,this.y,meta.color,30,1.0,'streak');emit(this.x,this.y,this.c.accent,18,.72);wave(this.x,this.y,meta.color,58);wave(this.x,this.y,this.c.primary,38);
   shake=Math.max(shake,art==='draw'?5.8:3.4);flash=Math.max(flash,art==='draw'?.18:.08);
  }
  updateMoon(dt,target){
   this.swordTimer-=dt;this.swordHitWindow=Math.max(0,this.swordHitWindow-dt);
   if(!target||this.swordTimer<=0){this.finishSwordArt();return}
   const dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d,sign=Math.sign(this.omega)||1,tx=-ny*sign,ty=nx*sign;
   const desired=204,radial=clamp((d-(this.r+target.r+36))*1.08,-50,62);
   this.vx+=(nx*radial+tx*desired-this.vx)*clamp(dt*4.15,0,.23);
   this.vy+=(ny*radial+ty*desired-this.vy)*clamp(dt*4.15,0,.23);
   this.swordLeadPoint={x:target.x,y:target.y};
  }
  updateShadow(dt,target){
   this.swordTimer-=dt;this.swordHitWindow=Math.max(0,this.swordHitWindow-dt);this.swordContactCooldown=Math.max(0,this.swordContactCooldown-dt);
   if(!target||this.swordTimer<=0){this.finishSwordArt();return}
   const d0=mag(target.x-this.x,target.y-this.y)||1,lead=clamp(d0/300,.07,.22);
   const aim={x:target.x+(target.vx||0)*lead,y:target.y+(target.vy||0)*lead},dx=aim.x-this.x,dy=aim.y-this.y,d=mag(dx,dy)||1;
   const desired=226,blend=clamp(dt*4.75,0,.27);
   this.vx+=(dx/d*desired-this.vx)*blend;this.vy+=(dy/d*desired-this.vy)*blend;this.swordLeadPoint=aim;
  }
  update(dt,opponent){
   const beforeOmega=this.omega||0,beforeEnergy=this.energy||0;
   super.update(dt,opponent);
   this.swordFxTrail.forEach(p=>p.life-=dt*2.25);this.swordFxTrail=this.swordFxTrail.filter(p=>p.life>0);
   this.swordFxBursts.forEach(p=>p.life-=dt*1.55);this.swordFxBursts=this.swordFxBursts.filter(p=>p.life>0);
   if(!this.isSwordUser?.()||this.out||this.burst)return;

   const active=ATTACK_STATES.has(this.swordState),resting=this.swordState==='idle'||this.swordRecovery>0;
   absRestore(this,beforeOmega,resting?.17:active?.075:.11);
   if(this.energy<beforeEnergy)this.energy=clamp(this.energy+(beforeEnergy-this.energy)*(resting?.13:.06),0,100);
   if(resting){this.tiltVel*=Math.exp(-.22*dt);this.tilt=clamp(this.tilt-dt*.006,0,.92)}

   if(this.swordState==='windup'){
    const target=validEnemy(this,this.swordTarget)?this.swordTarget:opponent;
    this.swordTimer-=dt;this.swordWindupProgress=clamp(1-this.swordTimer/Math.max(.01,this.swordWindupDuration),0,1);
    if(target){
     this.swordTarget=target;this.swordLeadPoint={x:target.x+(target.vx||0)*.08,y:target.y+(target.vy||0)*.08};
     this.swordFxAngle=Math.atan2(this.swordLeadPoint.y-this.y,this.swordLeadPoint.x-this.x);
    }
    const slow=this.swordArt==='draw'?.86:this.swordArt==='pierce'?.91:.95;this.vx*=Math.pow(slow,dt*60);this.vy*=Math.pow(slow,dt*60);
    if(Math.random()<dt*(12+this.swordWindupProgress*22))emit(this.x+Math.cos(this.swordFxAngle+Math.PI/2)*rnd(-this.r,this.r),this.y+Math.sin(this.swordFxAngle+Math.PI/2)*rnd(-this.r,this.r),artMeta(this.swordArt).color,1,.40,'streak');
    if(this.swordTimer<=0)this.activateRefinedArt(target);
   }
   if(active&&mag(this.vx||0,this.vy||0)>135){
    this.swordFxTrail.push({x:this.x,y:this.y,life:1,color:artMeta(this.swordArt).color});
    if(this.swordFxTrail.length>18)this.swordFxTrail.shift();
   }
  }
  resolveSwordHit(victim,nx,ny){
   const beforeVictim=snapshot(victim),beforeOmega=this.omega||0,art=this.swordArt;
   const hit=super.resolveSwordHit(victim,nx,ny);
   if(!hit)return false;
   const retain=art==='draw'?.78:art==='pierce'?.81:art==='flash'?.84:.86;
   softenBonus(victim,beforeVictim,retain);
   absRestore(this,beforeOmega,.58);
   this.swordFxBursts.push({x:(this.x+victim.x)/2,y:(this.y+victim.y)/2,life:1,color:artMeta(art).color,angle:Math.atan2(ny,nx),heavy:art==='draw'||art==='pierce'});
   const cx=(this.x+victim.x)/2,cy=(this.y+victim.y)/2,color=artMeta(art).color;
   emit(cx,cy,color,art==='draw'?34:24,.84,'streak');emit(cx,cy,'#ffffff',art==='draw'?18:10,.55,'streak');
   wave(cx,cy,color,art==='draw'?78:56);wave(cx,cy,this.c.accent,art==='draw'?52:36);
   return true;
  }
  draw(){
   super.draw();
   if(!this.isSwordUser?.()||this.out||this.burst)return;
   if(this.swordFxTrail.length>1){
    ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
    for(let i=1;i<this.swordFxTrail.length;i++){
     const a=this.swordFxTrail[i-1],b=this.swordFxTrail[i],life=Math.min(a.life,b.life);
     ctx.strokeStyle=alpha(b.color,.05+.28*life);ctx.lineWidth=1+this.r*.12*life;ctx.shadowBlur=9;ctx.shadowColor=b.color;
     ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    ctx.restore();
   }
   this.swordFxBursts.forEach(b=>{
    const p=clamp(b.life,0,1),r=this.r*(1.1+(1-p)*(b.heavy?1.8:1.2));
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ctx.globalCompositeOperation='screen';ctx.strokeStyle=alpha(b.color,.56*p);ctx.lineWidth=(b.heavy?3:2)*p;ctx.shadowBlur=14;ctx.shadowColor=b.color;
    ctx.beginPath();ctx.arc(0,0,r,-1.10,1.10);ctx.stroke();ctx.rotate(Math.PI);ctx.strokeStyle=alpha('#ffffff',.32*p);ctx.beginPath();ctx.arc(0,0,r*.72,-.88,.88);ctx.stroke();ctx.restore();
   });
   if(this.swordState!=='windup')return;
   const p=this.swordWindupProgress||0,meta=artMeta(this.swordArt),pulse=.5+.5*Math.sin(time*10.5);
   ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';ctx.rotate(time*(.32+p*.48));ctx.shadowBlur=18;ctx.shadowColor=meta.color;
   ctx.strokeStyle=alpha(meta.color,.24+.42*p);ctx.lineWidth=1.3+1.8*p;ctx.setLineDash([4+5*p,7]);
   ctx.beginPath();ctx.arc(0,0,this.r*(1.24+p*.36),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
   for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7,inner=this.r*(1.02+.12*p),outer=this.r*(1.42+.38*p+pulse*.04);
    ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a+.09)*outer,Math.sin(a+.09)*outer);ctx.stroke();
   }
   ctx.rotate(-time*(.32+p*.48));ctx.fillStyle=alpha(meta.color,.48+p*.24);ctx.beginPath();ctx.arc(0,0,this.r*(.075+p*.025),0,Math.PI*2);ctx.fill();ctx.restore();
   if(this.swordLeadPoint){
    ctx.save();ctx.globalCompositeOperation='screen';ctx.strokeStyle=alpha(meta.color,.16+.36*p);ctx.lineWidth=1.2+1.2*p;ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(this.x,this.y);ctx.lineTo(this.swordLeadPoint.x,this.swordLeadPoint.y);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(this.swordLeadPoint.x,this.swordLeadPoint.y,8+12*p,0,Math.PI*2);ctx.stroke();ctx.restore();
   }
  }
 };

 const previousCollide=collide;
 collide=function(a,b){
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=(a.r||0)+(b.r||0),same=teamOf(a)===teamOf(b);
  let contact=false,closing=0;
  if(!same&&d&&d<min&&!a?.phaseInvisible&&!b?.phaseInvisible&&!a?.skyJumpGhost&&!b?.skyJumpGhost){
   const nx=dx/d,ny=dy/d;closing=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny);contact=closing>0;
  }
  previousCollide(a,b);
  if(!contact)return;
  [a,b].forEach(top=>{
   if(!top?.c?.sevenSword||top.swordState!=='windup'||closing<68)return;
   const art=top.swordArt,heavy=art==='draw'||art==='pierce';
   top.swordPendingArt='';top.vx*=.78;top.vy*=.78;top.tiltVel+=.05;
   if(typeof top.finishSwordArt==='function')top.finishSwordArt(heavy?.62:.42);else top.swordState='idle';
   emit(top.x,top.y,artMeta(art).color,18,.52,'streak');wave(top.x,top.y,top.c.primary,36);
   addLog(`${top.c.name} 的「${top.swordArtName}」在前搖劍陣中遭到強碰撞，蓄勢被打斷！`);
  });
 };

 const style=document.createElement('style');
 style.textContent='.seven-sword-ability{border-color:#9de8ff88!important;background:radial-gradient(circle at 80% 15%,#fff2ae16,transparent 34%),linear-gradient(135deg,#6fd8ff18,#8b63ff1f)!important;box-shadow:inset 0 0 28px #6fd8ff12,0 0 16px #8b63ff0a!important}';
 document.head.appendChild(style);
 ['p1','p2'].forEach(id=>{if(cfg?.[id]?.sevenSword)renderPanel(id)});
 const log=document.querySelector('#log');if(log)log.textContent='七曜劍皇完成劍技精修：全招式加入前搖劍陣與劍氣殘影，威力略降，耐力、穩定與爆裂抗性提升。';
 document.documentElement.dataset.sevenSwordRefinement='v1';
})();
