/* Bloodrage Berserker V3 add-on: predictive target acquisition and pursuit lock */
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
  let best=null,bestScore=Infinity;
  tops.forEach(target=>{
   if(!validEnemy(source,target))return;
   const dx=target.x-source.x,dy=target.y-source.y,d=mag(dx,dy);
   const vulnerable=clamp(100-(target.energy||0),0,100);
   const speed=mag(target.vx||0,target.vy||0);
   let score=d-vulnerable*.28+speed*.035;
   if(target===preferred)score-=28;
   if(target===current)score-=72;
   if(score<bestScore){best=target;bestScore=score}
  });
  return best;
 }

 function enhancePanel(id){
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.rageEngine)return;
  const ability=host.querySelector('.rage-ability');
  if(!ability)return;
  ability.innerHTML='<strong>超限血怒・獵殺索敵</strong>能量越低，實戰攻擊、追擊加速度與最高移動速度越高；同時會掃描敵方、預判移動位置並持續修正衝刺方向。鎖定穩定後可發動短距離獵殺加速，但過度狂化仍會加快耗轉與失控傾斜。<div class="combo-tags"><span>主動索敵</span><span>移動預判</span><span>鎖定衝刺</span><span>攻擊突破100</span></div>';
 }
 const previousRenderPanel=renderPanel;
 renderPanel=function(id){previousRenderPanel(id);enhancePanel(id)};

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.rageTarget=null;
   this.rageTargetLock=0;
   this.rageScanCooldown=0;
   this.rageLeadPoint=null;
   this.rageLockPulse=0;
   this.rageLockCharge=0;
   this.rageRushCooldown=0;
   this.rageTargetDistance=Infinity;
   this.rageHuntLogCooldown=0;
  }
  acquireRageTarget(preferred,force=false){
   if(!isRager(this))return null;
   if(!force&&validEnemy(this,this.rageTarget)&&this.rageTargetLock>0)return this.rageTarget;
   const previous=this.rageTarget;
   this.rageTarget=chooseTarget(this,preferred,previous);
   if(this.rageTarget){
    const rage=rageOf(this);
    this.rageTargetLock=1.05+rage*1.75;
    this.rageLockPulse=1;
    if(this.rageTarget!==previous&&this.rageHuntLogCooldown<=0){
     addLog(`${this.c.name} 啟動「血獵索敵」，鎖定 ${this.rageTarget.c?.name||'敵方陀螺'}！`);
     this.rageHuntLogCooldown=2.4;
    }
   }else{
    this.rageTargetLock=0;
    this.rageLeadPoint=null;
   }
   return this.rageTarget;
  }
  updateRageTargeting(dt,preferred){
   if(!isRager(this)||this.out||this.burst||this.phaseInvisible||this.skyJumpGhost||this.charmedBy)return;
   this.rageScanCooldown-=dt;
   this.rageTargetLock=Math.max(0,this.rageTargetLock-dt);
   this.rageLockPulse=Math.max(0,this.rageLockPulse-dt*1.8);
   this.rageRushCooldown=Math.max(0,this.rageRushCooldown-dt);
   this.rageHuntLogCooldown=Math.max(0,this.rageHuntLogCooldown-dt);

   if(!validEnemy(this,this.rageTarget))this.acquireRageTarget(preferred,true);
   else if(this.rageScanCooldown<=0){
    this.rageScanCooldown=rnd(.14,.26);
    this.acquireRageTarget(preferred,this.rageTargetLock<=0);
   }
   const target=this.rageTarget;
   if(!validEnemy(this,target))return;

   const rage=rageOf(this),stage=stageOf(this),attack=attackOf(this);
   const dx0=target.x-this.x,dy0=target.y-this.y,d0=mag(dx0,dy0)||1;
   const relativeSpeed=Math.max(105,mag((this.vx||0)-(target.vx||0),(this.vy||0)-(target.vy||0))+72);
   const leadTime=clamp(d0/relativeSpeed*.34,.055,.40)*(.72+rage*.48);
   const aim=clampAimPoint({
    x:target.x+(target.vx||0)*leadTime,
    y:target.y+(target.vy||0)*leadTime
   });
   this.rageLeadPoint=aim;

   let ax=aim.x-this.x,ay=aim.y-this.y,ad=mag(ax,ay)||1;
   let nx=ax/ad,ny=ay/ad;
   const cx=W/2,cy=H/2,cdx=this.x-cx,cdy=this.y-cy,centreDistance=mag(cdx,cdy)||1;
   const edge=clamp((centreDistance-innerR*.76)/Math.max(1,outerR-innerR*.76),0,1);
   if(edge>0){
    const inwardX=-cdx/centreDistance,inwardY=-cdy/centreDistance;
    const inwardMix=edge*(.24+rage*.18);
    nx=nx*(1-inwardMix)+inwardX*inwardMix;
    ny=ny*(1-inwardMix)+inwardY*inwardMix;
    const nd=mag(nx,ny)||1;nx/=nd;ny/=nd;
   }

   const hunt=.22+rage*.78;
   const desiredSpeed=clamp(168+attack*.54+rage*62,170,348);
   const closeRange=d0<((this.r||0)+(target.r||0))*3.1;
   const turnRate=(2.15+rage*4.9+stage*.62)*(closeRange?1.18:1);
   const blend=clamp(dt*turnRate*hunt,0,.34);
   const desiredX=nx*desiredSpeed,desiredY=ny*desiredSpeed;
   this.vx+=(desiredX-this.vx)*blend;
   this.vy+=(desiredY-this.vy)*blend;

   const speed=mag(this.vx,this.vy)||1;
   const alignment=(this.vx/speed)*nx+(this.vy/speed)*ny;
   const lockRange=d0>this.r+target.r+30&&d0<innerR*1.35;
   if(alignment>.78&&lockRange)this.rageLockCharge+=dt*(.72+rage*1.18);
   else this.rageLockCharge=Math.max(0,this.rageLockCharge-dt*1.65);

   if(this.rageLockCharge>=.42&&this.rageRushCooldown<=0){
    const impulse=18+rage*42+stage*5;
    this.vx+=nx*impulse;
    this.vy+=ny*impulse;
    this.rageLockCharge=0;
    this.rageRushCooldown=clamp(1.65-rage*.48,1.02,1.65);
    this.rageLockPulse=1;
    emit(this.x,this.y,this.c.primary,10+stage*4,.38+rage*.30,'streak');
    wave(this.x,this.y,this.c.secondary,28+rage*24);
    if(stage>=2&&this.rageHuntLogCooldown<=0){
     addLog(`${this.c.name} 完成索敵預判，發動「血獵衝刺」！`);
     this.rageHuntLogCooldown=1.8;
    }
   }

   if(d0>this.rageTargetDistance+24&&this.rageTargetLock<.28){
    this.rageScanCooldown=0;
    this.rageTargetLock=0;
   }
   this.rageTargetDistance=d0;
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.updateRageTargeting(dt,opponent);
  }
  draw(){
   super.draw();
   const target=this.rageTarget;
   if(!isRager(this)||!validEnemy(this,target)||!this.rageLeadPoint||this.out||this.burst)return;
   const rage=rageOf(this),pulse=.5+.5*Math.sin(time*7.5),lock=clamp(.24+rage*.50+this.rageLockPulse*.26,.18,.92);
   const tx=target.x,ty=target.y,rr=(target.r||this.r)*(1.35+pulse*.10);
   ctx.save();
   ctx.globalCompositeOperation='screen';
   ctx.strokeStyle=alpha(this.c.primary,lock*.24);
   ctx.lineWidth=1;
   ctx.setLineDash([4,7]);
   ctx.beginPath();ctx.moveTo(this.x,this.y);ctx.lineTo(this.rageLeadPoint.x,this.rageLeadPoint.y);ctx.stroke();
   ctx.setLineDash([]);
   ctx.translate(tx,ty);ctx.rotate(-time*(1.4+rage*1.8));
   ctx.strokeStyle=alpha(this.c.accent,lock);
   ctx.lineWidth=1.2+rage*1.2;
   ctx.shadowBlur=10+rage*12;ctx.shadowColor=this.c.primary;
   for(let i=0;i<4;i++){
    const a=i*Math.PI/2;
    ctx.beginPath();ctx.arc(0,0,rr,a+.12,a+Math.PI/2-.12);ctx.stroke();
   }
   ctx.beginPath();ctx.moveTo(-rr*.28,0);ctx.lineTo(rr*.28,0);ctx.moveTo(0,-rr*.28);ctx.lineTo(0,rr*.28);ctx.stroke();
   ctx.restore();
  }
 };

 enhancePanel('p1');enhancePanel('p2');
 const log=document.querySelector('#log');
 if(log)log.textContent='「血怒狂戰士」已獲得血獵索敵：會主動掃描敵方、預判移動軌跡、持續修正追擊方向，鎖定穩定後可發動血獵衝刺。';
 document.documentElement.dataset.rageTargeting='predictive-v1';
})();
