/* Sky Pouncer: irregular boundary leap and aerial dive attacker */
(() => {
 const SKY_KEY='skyPouncer';
 const SKY_POUNCER={
  label:'[SPECIAL] 天墜獵鷹｜Sky Pouncer',
  name:'天墜獵鷹',englishName:'Sky Pouncer',
  combo:'4-70 Jump Talon',
  rank:'不定期攀升外圈・高空俯衝攻擊',tier:'SPECIAL',type:'attack',
  a:94,d:70,s:76,w:78,b:88,spin:'R',shape:'skyPouncer',
  skyPouncer:true,
  primary:'#36d8ff',secondary:'#ff9f43',accent:'#fff2a6',metal:'#dcecff'
 };
 metaPresets[SKY_KEY]=SKY_POUNCER;

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.skyPouncer)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box sky-pouncer-ability';
  ability.innerHTML='<strong>邊界躍襲機構</strong>會在不固定時間攀上外圈邊界，短暫離地後預判敵方位置俯衝。落地命中會額外削減角速度、提高傾斜並造成擊飛。<div class="combo-tags"><span>隨機週期</span><span>邊界起跳</span><span>俯衝重擊</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 function isActive(top){return !!top&&!top.out&&!top.burst&&top.energy>0}
 function teamOf(top){return top?.teamIndex??(top?.index?1:0)}
 function sameTeam(a,b){return teamOf(a)===teamOf(b)}
 function scheduleNextJump(top){
  const fatigue=clamp((55-top.energy)/55,0,1);
  top.skyJumpCooldown=rnd(2.7,5.9)+fatigue*1.4;
 }
 function clampInsideArena(point,radius=innerR*.78){
  const cx=W/2,cy=H/2,dx=point.x-cx,dy=point.y-cy,d=mag(dx,dy)||1;
  if(d<=radius)return point;
  return {x:cx+dx/d*radius,y:cy+dy/d*radius};
 }

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.skyJumpState='idle';
   this.skyJumpCooldown=data.skyPouncer?rnd(2.2,4.6):999;
   this.skyClimbTimer=0;
   this.skyAirElapsed=0;
   this.skyAirDuration=.72;
   this.skyJumpHeight=0;
   this.skyJumpGhost=false;
   this.skyStart=null;
   this.skyControl=null;
   this.skyTarget=null;
   this.skyDiveImpact=0;
   this.skyStrikeLock=0;
   this.skyJumpCount=0;
  }
  isSkyPouncer(){return !!this.c.skyPouncer}
  beginSkyClimb(opponent){
   if(!this.isSkyPouncer()||!isActive(opponent)||this.skyJumpState!=='idle')return;
   this.skyJumpState='climb';
   this.skyClimbTimer=rnd(.62,1.02);
   this.rimCooldown=Math.max(this.rimCooldown,.32);
   this.xDashCooldown=Math.max(this.xDashCooldown,.30);
   emit(this.x,this.y,this.c.primary,16,.68,'streak');
   wave(this.x,this.y,this.c.accent,30);
   if(performance.now()-lastZoneLog>650){
    addLog(`${this.c.name} 改變路線，開始攀上外圈邊界！`);
    lastZoneLog=performance.now();
   }
  }
  updateSkyClimb(dt,opponent){
   this.skyClimbTimer-=dt;
   const cx=W/2,cy=H/2,dx=this.x-cx,dy=this.y-cy,d=mag(dx,dy)||1;
   const nx=dx/d,ny=dy/d,sign=Math.sign(this.omega)||1,tx=-ny*sign,ty=nx*sign;
   const outward=138+this.c.a*.68;
   this.vx+=(nx*outward+tx*38)*dt;
   this.vy+=(ny*outward+ty*38)*dt;
   this.rimCooldown=Math.max(this.rimCooldown,.20);
   this.xDashCooldown=Math.max(this.xDashCooldown,.20);
   this.lift=clamp(this.lift+.40*dt,0,.20);
   const railR=outerR*.755;
   if(d>railR){
    this.x=cx+nx*railR;
    this.y=cy+ny*railR;
   }
   if(d>=outerR*.70||this.skyClimbTimer<=0)this.launchSkyDive(opponent);
  }
  launchSkyDive(opponent){
   if(this.skyJumpState!=='climb')return;
   const predicted=isActive(opponent)?{
    x:opponent.x+opponent.vx*rnd(.18,.32),
    y:opponent.y+opponent.vy*rnd(.18,.32)
   }:{x:W/2,y:H/2};
   const target=clampInsideArena(predicted,innerR*.74);
   const sx=this.x,sy=this.y,dx=target.x-sx,dy=target.y-sy,d=mag(dx,dy)||1;
   const side=(this.index?1:-1)*(Math.random()<.5?-1:1);
   this.skyStart={x:sx,y:sy};
   this.skyTarget=target;
   this.skyControl={x:(sx+target.x)/2-dy/d*outerR*.12*side,y:(sy+target.y)/2+dx/d*outerR*.12*side};
   this.skyAirElapsed=0;
   this.skyAirDuration=rnd(.62,.82);
   this.skyJumpState='air';
   this.skyJumpGhost=true;
   this.skyJumpHeight=0;
   this.zone='inner';
   this.vx=0;this.vy=0;
   this.omega*=.965;this.spin=this.omega;
   emit(this.x,this.y,this.c.accent,26,.86,'streak');
   wave(this.x,this.y,this.c.primary,46);
   shake=Math.max(shake,4.2);
   addLog(`${this.c.name} 從邊界起跳，鎖定敵方位置發動「天墜俯衝」！`);
  }
  updateSkyAir(dt,opponent){
   if(this.out||this.burst)return;
   this.skyAirElapsed+=dt;
   const p=clamp(this.skyAirElapsed/this.skyAirDuration,0,1),q=1-p;
   this.x=q*q*this.skyStart.x+2*q*p*this.skyControl.x+p*p*this.skyTarget.x;
   this.y=q*q*this.skyStart.y+2*q*p*this.skyControl.y+p*p*this.skyTarget.y;
   this.skyJumpHeight=Math.sin(Math.PI*p);
   this.angle+=this.omega*dt*(1+this.skyJumpHeight*.70);
   this.omega*=Math.exp(-.045*dt);this.spin=this.omega;
   this.energy=Math.max(0,this.energy-dt*(1.05+this.skyJumpHeight*.75));
   this.trail.push({x:this.x,y:this.y,l:1});
   if(this.trail.length>36)this.trail.shift();
   this.trail.forEach(point=>point.l-=dt*2.0);
   this.trail=this.trail.filter(point=>point.l>0);
   if(Math.random()<dt*15)emit(this.x,this.y,this.c.primary,1,.34,'streak');
   if(p>=1)this.landSkyDive(opponent);
  }
  landSkyDive(opponent){
   this.skyJumpState='idle';
   this.skyJumpGhost=false;
   this.skyJumpHeight=0;
   this.skyJumpCount++;
   scheduleNextJump(this);
   const target=isActive(opponent)?opponent:{x:W/2,y:H/2,vx:0,vy:0};
   const dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1;
   this.vx=dx/d*(145+this.c.a*.55);
   this.vy=dy/d*(145+this.c.a*.55);
   this.lift=.10;
   this.tiltVel+=.10;
   this.rimCooldown=.18;
   this.xDashCooldown=.32;
   this.skyDiveImpact=.48;
   emit(this.x,this.y,this.c.accent,42,1.08,'streak');
   emit(this.x,this.y,this.c.primary,30,.92);
   wave(this.x,this.y,this.c.accent,76);
   shake=Math.max(shake,9);flash=Math.max(flash,.30);
   if(isActive(opponent)&&mag(opponent.x-this.x,opponent.y-this.y)<=this.r+opponent.r+26){
    applySkyStrike(this,opponent);
   }else{
    addLog(`${this.c.name} 從上方落入戰圈，準備以落地速度追擊！`);
   }
  }
  update(dt,opponent){
   if(!this.isSkyPouncer())return super.update(dt,opponent);
   this.skyStrikeLock=Math.max(0,this.skyStrikeLock-dt);
   this.skyDiveImpact=Math.max(0,this.skyDiveImpact-dt);
   if(this.skyJumpState==='air'){
    this.updateSkyAir(dt,opponent);
    return;
   }
   if(this.skyJumpState==='climb'){
    this.rimCooldown=Math.max(this.rimCooldown,.22);
    this.xDashCooldown=Math.max(this.xDashCooldown,.22);
   }
   super.update(dt,opponent);
   if(this.out||this.burst)return;
   if(this.skyJumpState==='climb'){
    this.updateSkyClimb(dt,opponent);
    return;
   }
   const spinReady=Math.abs(this.omega)>18,energyReady=this.energy>28;
   if(isActive(opponent)&&spinReady&&energyReady){
    this.skyJumpCooldown-=dt;
    if(this.skyJumpCooldown<=0)this.beginSkyClimb(opponent);
   }
  }
  bladeCount(){return this.c.shape==='skyPouncer'?3:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='skyPouncer'){
    const profile=[1.22,.76,.92,.70];
    return this.r*profile[i%profile.length];
   }
   return super.bladeRadius(i);
  }
  drawModel(speed){
   if(!this.isSkyPouncer())return super.drawModel(speed);
   const originalY=this.y,originalR=this.r,h=this.skyJumpHeight||0;
   if(h>0){
    ctx.save();
    ctx.translate(this.x,originalY+5+h*14);
    ctx.scale(1,.42);
    const shadow=ctx.createRadialGradient(0,0,1,0,0,originalR*(1.25-h*.35));
    shadow.addColorStop(0,`rgba(0,0,0,${.52-h*.20})`);
    shadow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=shadow;
    ctx.beginPath();ctx.arc(0,0,originalR*1.35,0,Math.PI*2);ctx.fill();
    ctx.restore();
    this.y=originalY-h*24;
    this.r=originalR*(1+h*.16);
   }
   super.drawModel(speed);
   this.y=originalY;this.r=originalR;
   ctx.save();
   ctx.translate(this.x,originalY-h*24);
   ctx.rotate(this.angle*.72);
   ctx.globalCompositeOperation='screen';
   ctx.strokeStyle=alpha(this.c.accent,.75);
   ctx.lineWidth=Math.max(1.1,originalR*.065);
   ctx.shadowBlur=12;ctx.shadowColor=this.c.primary;
   ctx.beginPath();
   ctx.moveTo(-originalR*.72,originalR*.10);
   ctx.lineTo(0,-originalR*.42);
   ctx.lineTo(originalR*.72,originalR*.10);
   ctx.stroke();
   if(h>0){
    ctx.strokeStyle=alpha(this.c.primary,.30+h*.35);
    ctx.beginPath();ctx.arc(0,0,originalR*(1.05+h*.28),0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();
  }
 };

 function applySkyStrike(attacker,victim){
  if(!attacker?.c?.skyPouncer||attacker.skyDiveImpact<=0||attacker.skyStrikeLock>0||!isActive(victim)||sameTeam(attacker,victim))return false;
  const dx=victim.x-attacker.x,dy=victim.y-attacker.y,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d;
  const spinRatio=clamp(Math.abs(attacker.omega)/Math.max(1,attacker.omega0||40),.35,1.15);
  const force=78+attacker.c.a*.62+spinRatio*42;
  victim.vx+=nx*force;victim.vy+=ny*force;
  victim.omega*=.87;victim.spin=victim.omega;
  victim.energy=Math.max(0,victim.energy-(6+spinRatio*5));
  victim.tiltVel+=(.28+.17*spinRatio)/Math.max(.70,victim.tip?.stability||1);
  victim.lift=clamp((victim.lift||0)+.18+.10*spinRatio,0,1);
  victim.impactBoost=Math.max(victim.impactBoost||0,86+spinRatio*34);
  victim.burstMeter=(victim.burstMeter||0)+7+spinRatio*5;
  attacker.omega*=.955;attacker.spin=attacker.omega;
  attacker.energy=Math.max(0,attacker.energy-3.5);
  attacker.skyDiveImpact=0;attacker.skyStrikeLock=.55;
  const cx=(attacker.x+victim.x)/2,cy=(attacker.y+victim.y)/2;
  emit(cx,cy,attacker.c.accent,48,1.22,'streak');
  emit(cx,cy,'#ffffff',26,.90);
  wave(cx,cy,attacker.c.primary,84);
  shake=Math.max(shake,13);flash=Math.max(flash,.52);
  addLog(`${attacker.c.name} 的天墜俯衝命中！落差動能削減對手角速度並造成強力擊飛！`);
  return true;
 }

 const previousCollide=collide;
 collide=function(a,b){
  if(a?.skyJumpGhost||b?.skyJumpGhost)return;
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=a.r+b.r;
  let contact=false;
  if(d&&d<min){
   const nx=dx/d,ny=dy/d;
   contact=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny)>0;
  }
  previousCollide(a,b);
  if(!contact||sameTeam(a,b))return;
  if(a.skyDiveImpact>0)applySkyStrike(a,b);
  if(b.skyDiveImpact>0)applySkyStrike(b,a);
 };

 const style=document.createElement('style');
 style.textContent='.sky-pouncer-ability{border-color:#36d8ff55;background:linear-gradient(135deg,#36d8ff13,#ff9f4314)}';
 document.head.appendChild(style);

 cfg.p2={...SKY_POUNCER,preset:SKY_KEY};
 renderPanel('p1');renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;
 document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='「天墜獵鷹」已加入：它會不定期攀上外圈邊界，從上方俯衝回戰圈並以落差動能發動重擊。';
})();