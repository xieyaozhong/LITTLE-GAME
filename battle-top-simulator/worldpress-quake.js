/* Worldpress Colossus V5: in-place leap, three swept shock fronts, and probabilistic counter-clockwise vortex. */
(() => {
  const KEY='worldpressColossus';
  const CROUCH_TIME=.22,JUMP_SPEED=4.4,JUMP_GRAVITY=13.2;
  const WAVE_DELAYS=[0,.17,.34],WAVE_STRENGTH=[.58,.74,.92],WAVE_SPEED=390;
  const VORTEX_CHANCE=.34,VORTEX_WINDUP=.42,VORTEX_DURATION=2.25,VORTEX_RECOVERY=.50;
  if(metaPresets?.[KEY])metaPresets[KEY].rank='雙棒占用・重心鎮場・天墜三震・逆潮氣旋';

  const active=top=>!!top&&!top.out&&!top.burst&&!top.skyStaminaDefeated&&!top.skyEnergyDepletedLatch&&(top.energy||0)>0;
  const teamOf=top=>top?.teamIndex??(top?.index?1:0);
  const airborne=top=>!!top?.skyJumpGhost||!!top?.colossusJumpGhost||['climb','orbit','air','direct'].includes(top?.skyJumpState);
  const easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);

  function drawRaisedModel(top,lift,scale,render){
    const originalY=top.y,originalR=top.r,originalFill=ctx.fill,hadOwnFill=Object.prototype.hasOwnProperty.call(ctx,'fill');
    let skippedShadow=false,patchedFill=false;
    try{ctx.fill=function(...args){if(!skippedShadow){skippedShadow=true;return}return originalFill.apply(ctx,args)};patchedFill=true}catch{}
    top.y=originalY-lift;top.r=originalR*scale;
    try{render()}finally{
      top.y=originalY;top.r=originalR;
      if(patchedFill){if(hadOwnFill)ctx.fill=originalFill;else delete ctx.fill}
    }
  }

  function vortexSkillFactor(top){
    if(!top||top.phaseInvisible||airborne(top))return 0;
    if(top.charmedBy||top.timeFrozenBy)return 1.12;
    const sword=String(top.swordState||'').toLowerCase(),rage=String(top.rageSkillState||'').toLowerCase(),chrono=String(top.chronoState||'').toLowerCase();
    if(sword.includes('guard')||top.swordArt==='guard'||top.morphMode==='aegis'||top.morphCounterReady||top.taijiMode==='yin'||top.twinInheritanceMode==='guardian'||(top.relayBondShieldTimer||0)>0)return .55;
    if(rage.includes('charge')||sword.includes('windup')||chrono.includes('charge')||(top.morphMode==='reaper'&&(top.morphCharge||0)>.05))return .70;
    if(rage.includes('rush')||(top.rageSmashHitWindow||0)>0||sword.includes('rush')||(top.swordHitWindow||0)>0||chrono.includes('rush')||top.skyJumpState==='direct'||['swift','viper','reaper'].includes(top.morphMode)&&(top.morphHitWindow||0)>0||(top.taijiStrikeWindow||0)>0)return .78;
    if((top.relayBondSkillPulse||0)>.2)return .88;
    return 1;
  }

  const previousRenderPanel=renderPanel;
  renderPanel=function(id){
    previousRenderPanel(id);
    const host=document.querySelector('#'+id),c=cfg[id];
    if(!host||!c?.juggernautEngine)return;
    const ability=host.querySelector('.colossus-ability');
    if(ability)ability.innerHTML='<strong>雙棒限定・天墜三震</strong>巨神先壓低重心並原地躍起，落地後從實際落點依序展開三道震波；每道波前抵達時才會讓敵方陀螺輕微向外彈跳。冷卻期間另有機率發動「逆潮氣旋」，讓陀螺沿逆時針渦流靠近巨神；低轉速與失控姿態會受到更強牽引。<div class="combo-tags"><span>原地起跳</span><span>三連波前</span><span>輕量外彈</span><span>轉速抗性</span></div>';
  };

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){
      super(index,data);
      this.colossusSkillState='idle';
      this.colossusSkillTimer=0;
      this.colossusQuakeTimer=rnd(4.8,7.2);
      this.colossusQuakeWindup=0;
      this.colossusQuakePulse=0;
      this.colossusQuakeAftershock=0;
      this.colossusQuakeFlash=0;
      this.colossusQuakeSeed=rnd(0,Math.PI*2);
      this.colossusQuakeCount=0;
      this.colossusJumpHeight=0;
      this.quakeVerticalVelocity=0;
      this.quakeAnchorX=this.x;
      this.quakeAnchorY=this.y;
      this.colossusJumpGhost=false;
      this.colossusShockwaves=[];
      this.colossusShockSerial=0;
      this.colossusWaveOriginX=this.x;
      this.colossusWaveOriginY=this.y;
      this.colossusQuakeHop=0;
      this.colossusBounceVelocity=0;
      this.colossusQuakeLandingPulse=0;
      this.colossusQuakeHitPulse=0;
      this.colossusVortexTimer=rnd(3.6,6.8);
      this.colossusVortexCooldown=0;
      this.colossusVortexStateTimer=0;
      this.colossusVortexActive=false;
      this.colossusVortexPulse=0;
      this.colossusVortexStrength=0;
      this.colossusVortexPhase=rnd(0,Math.PI*2);
      this.colossusVortexRadius=0;
      this.colossusVortexPullPulse=0;
      this.colossusVortexForceX=0;
      this.colossusVortexForceY=0;
    }
    lockToJumpAnchor(dt,rate=12){
      const blend=clamp(dt*rate,0,1);
      this.x+=(this.quakeAnchorX-this.x)*blend;
      this.y+=(this.quakeAnchorY-this.y)*blend;
      this.vx*=Math.exp(-rate*.68*dt);
      this.vy*=Math.exp(-rate*.68*dt);
    }
    beginColossusQuake(){
      if(!this.c?.juggernautEngine||!active(this)||this.colossusSkillState!=='idle')return false;
      this.colossusSkillState='quakeCrouch';
      this.colossusSkillTimer=CROUCH_TIME;
      this.colossusQuakeWindup=CROUCH_TIME;
      this.quakeAnchorX=this.x;
      this.quakeAnchorY=this.y;
      this.colossusQuakeSeed=rnd(0,Math.PI*2);
      this.colossusShockwaves=[];
      this.colossusPressurePulse=Math.max(this.colossusPressurePulse||0,.68);
      return true;
    }
    launchColossusQuake(){
      this.colossusSkillState='quakeLeap';
      this.colossusSkillTimer=0;
      this.colossusQuakeWindup=0;
      this.colossusJumpHeight=.001;
      this.quakeVerticalVelocity=JUMP_SPEED;
      this.colossusJumpGhost=true;
      this.skyJumpGhost=true;
      this.lift=Math.max(this.lift||0,.18);
    }
    triggerColossusQuake(){
      if(!this.c?.juggernautEngine||!active(this))return false;
      this.colossusJumpHeight=0;
      this.quakeVerticalVelocity=0;
      this.colossusJumpGhost=false;
      this.skyJumpGhost=false;
      this.colossusSkillState='quakeWaves';
      this.colossusWaveOriginX=this.x;
      this.colossusWaveOriginY=this.y;
      this.colossusShockSerial++;
      this.colossusQuakeCount++;
      const originDistance=mag(this.x-W/2,this.y-H/2),targetRadius=Array.isArray(tops)?Math.max(0,...tops.map(top=>Number(top?.r)||0)):0;
      const startRadius=this.r*.72,maxRadius=outerR+originDistance+targetRadius+this.r;
      this.colossusShockwaves=WAVE_DELAYS.map((delay,index)=>({index,age:-delay,radius:0,previousRadius:0,startRadius,maxRadius,strength:WAVE_STRENGTH[index],hits:new WeakSet(),started:false,serial:this.colossusShockSerial,x:this.x,y:this.y}));
      this.colossusQuakePulse=1;
      this.colossusQuakeAftershock=1;
      this.colossusQuakeFlash=1;
      this.colossusPressurePulse=1;
      this.colossusQuakeTimer=rnd(6.8,9.8);
      this.energy=Math.max(0,(this.energy||0)-1.1);
      this.omega*=.994;this.spin=this.omega;
      this.tiltVel*=.34;
      shake=Math.max(shake,8.5);flash=Math.max(flash,.18);
      window.dispatchEvent?.(new CustomEvent('arena-colossus-landing',{detail:{x:this.x,y:this.y,serial:this.colossusShockSerial,waves:3}}));
      return true;
    }
    beginColossusVortex(){
      if(!this.c?.juggernautEngine||!active(this)||this.colossusSkillState!=='idle')return false;
      this.colossusSkillState='vortexWindup';
      this.colossusVortexStateTimer=VORTEX_WINDUP;
      this.colossusVortexTimer=rnd(6.4,9.2);
      this.colossusVortexCooldown=rnd(10.5,14.5);
      this.colossusVortexPulse=.08;
      this.colossusVortexStrength=0;
      this.colossusVortexPhase=rnd(0,Math.PI*2);
      return true;
    }
    triggerColossusVortex(){
      if(!this.c?.juggernautEngine||!active(this)||!['idle','vortexWindup'].includes(this.colossusSkillState))return false;
      this.colossusSkillState='vortexActive';
      this.colossusVortexStateTimer=VORTEX_DURATION;
      this.colossusVortexActive=true;
      this.colossusVortexPulse=0;
      this.colossusVortexStrength=0;
      this.colossusVortexTimer=rnd(6.4,9.2);
      this.colossusVortexCooldown=Math.max(this.colossusVortexCooldown||0,rnd(10.5,14.5));
      this.colossusVortexRadius=Math.min(outerR*.86,innerR+this.r*1.2);
      window.dispatchEvent?.(new CustomEvent('arena-colossus-vortex',{detail:{x:this.x,y:this.y,radius:this.colossusVortexRadius,direction:'counter-clockwise'}}));
      return true;
    }
    finishColossusVortex(){
      this.colossusVortexActive=false;
      this.colossusVortexStrength=0;
      this.colossusSkillState='vortexRecovery';
      this.colossusVortexStateTimer=VORTEX_RECOVERY;
    }
    cancelColossusSkills(){
      this.colossusSkillState='idle';
      this.colossusSkillTimer=0;
      this.colossusQuakeWindup=0;
      this.colossusJumpHeight=0;
      this.quakeVerticalVelocity=0;
      this.colossusJumpGhost=false;
      this.skyJumpGhost=false;
      this.colossusShockwaves=[];
      this.colossusVortexActive=false;
      this.colossusVortexStrength=0;
      this.colossusVortexPulse=0;
    }
    updateQuakeHop(dt){
      this.colossusQuakeLandingPulse=Math.max(0,(this.colossusQuakeLandingPulse||0)-dt*2.8);
      this.colossusQuakeHitPulse=Math.max(0,(this.colossusQuakeHitPulse||0)-dt*3.5);
      this.colossusVortexPullPulse=Math.max(0,(this.colossusVortexPullPulse||0)-dt*2.4);
      if((this.colossusQuakeHop||0)<=0&&(this.colossusBounceVelocity||0)<=0)return;
      this.colossusBounceVelocity-=7.8*dt;
      this.colossusQuakeHop=Math.max(0,(this.colossusQuakeHop||0)+this.colossusBounceVelocity*dt);
      if(this.colossusQuakeHop<=0&&this.colossusBounceVelocity<0){
        this.colossusQuakeHop=0;
        this.colossusBounceVelocity=0;
        this.colossusQuakeLandingPulse=1;
        if(!this.out&&!this.burst){
          this.tiltVel=clamp((this.tiltVel||0)+(Math.sign(this.omega)||1)*.018/Math.max(.72,this.tip?.stability||1),-.45,.45);
          shake=Math.max(shake,1.5);
        }
      }
    }
    applyShockwaveHit(enemy,wave){
      const dx=enemy.x-wave.x,dy=enemy.y-wave.y,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d;
      const spinN=clamp(Math.abs(enemy.omega||0)/Math.max(38,Math.abs(enemy.omega0||0)),0,1.25),gyro=1.12-(spinN/1.25)*.34;
      const massFactor=clamp(Math.sqrt(1.45/Math.max(.35,enemy.mass||1)),.72,1.18),baseKick=[7.5,9,10.5][wave.index]||8;
      const kick=clamp(baseKick*gyro*massFactor,5,13),outward=Math.max(0,enemy.vx*nx+enemy.vy*ny),allowed=Math.max(0,82-outward),applied=Math.min(kick,allowed);
      enemy.vx+=nx*applied;enemy.vy+=ny*applied;
      const hop=[.72,.80,.88][wave.index]||.76;
      enemy.colossusBounceVelocity=Math.max(enemy.colossusBounceVelocity||0,hop*clamp(gyro,.82,1.08));
      enemy.colossusQuakeHop=Math.max(enemy.colossusQuakeHop||0,.006);
      enemy.colossusQuakeLandingPulse=0;
      enemy.colossusQuakeHitPulse=1;
      enemy.colossusQuakeHitIndex=wave.index;
      enemy.lift=clamp(Math.max(enemy.lift||0,.025+wave.index*.012),0,.18);
      const stability=Math.max(.72,enemy.tip?.stability||1),tilt=[.012,.016,.020][wave.index]/stability;
      enemy.tiltVel=clamp((enemy.tiltVel||0)+(Math.sign(enemy.omega)||1)*tilt,-.45,.45);
      enemy.omega*=1-(.0035+wave.index*.0012);enemy.spin=enemy.omega;
      enemy.energy=Math.max(0,(enemy.energy||0)-(.12+wave.index*.05));
      enemy.burstMeter=(enemy.burstMeter||0)+.10+wave.index*.025;
      window.dispatchEvent?.(new CustomEvent('arena-colossus-wave-hit',{detail:{x:enemy.x,y:enemy.y,wave:wave.index+1,strength:wave.strength,sourceX:wave.x,sourceY:wave.y}}));
    }
    updateShockwaves(dt){
      if(!Array.isArray(this.colossusShockwaves)||!this.colossusShockwaves.length)return;
      let activeWaves=0,maxPulse=0;
      for(const wave of this.colossusShockwaves){
        wave.age+=dt;
        if(wave.age<0)continue;
        const duration=(wave.maxRadius-wave.startRadius)/WAVE_SPEED,progress=clamp(wave.age/Math.max(.01,duration),0,1);
        wave.previousRadius=wave.radius||0;
        wave.radius=wave.startRadius+(wave.maxRadius-wave.startRadius)*easeOut(progress);
        wave.pulse=1-progress;maxPulse=Math.max(maxPulse,wave.pulse);
        if(progress<1)activeWaves++;
        if(!wave.started){
          wave.started=true;
          shake=Math.max(shake,4.2+wave.index*1.1);flash=Math.max(flash,.045+wave.index*.018);
          window.dispatchEvent?.(new CustomEvent('arena-colossus-wave',{detail:{x:wave.x,y:wave.y,wave:wave.index+1,radius:wave.radius,strength:wave.strength,serial:wave.serial}}));
        }
        if(!Array.isArray(tops))continue;
        for(const enemy of [...tops]){
          if(enemy===this||teamOf(enemy)===teamOf(this)||!active(enemy)||enemy.phaseInvisible||wave.hits.has(enemy))continue;
          if(airborne(enemy)){enemy.colossusAirTurbulence=Math.max(enemy.colossusAirTurbulence||0,.10);continue}
          const d=mag(enemy.x-wave.x,enemy.y-wave.y),margin=Math.max(2,enemy.r||0);
          const crossed=wave.previousRadius<=d+margin&&wave.radius>=d-margin;
          if(!crossed)continue;
          wave.hits.add(enemy);this.applyShockwaveHit(enemy,wave);
        }
      }
      this.colossusQuakePulse=maxPulse;
      if(activeWaves===0&&this.colossusShockwaves.every(wave=>wave.age>=0)){
        this.colossusShockwaves=[];
        this.colossusSkillState='quakeRecovery';
        this.colossusSkillTimer=.42;
        this.colossusQuakeAftershock=1;
      }
    }
    applyVortex(dt){
      if(!Array.isArray(tops)||this.colossusVortexStrength<=0)return;
      const range=this.colossusVortexRadius||Math.min(outerR*.86,innerR+this.r*1.2);
      for(const enemy of [...tops]){
        if(enemy===this||teamOf(enemy)===teamOf(this)||!active(enemy))continue;
        const skillFactor=vortexSkillFactor(enemy);if(skillFactor<=0)continue;
        const dx=enemy.x-this.x,dy=enemy.y-this.y,d=mag(dx,dy);if(!Number.isFinite(d)||d<1||d>=range)continue;
        const outX=dx/d,outY=dy/d,inX=-outX,inY=-outY,ccwX=outY,ccwY=-outX;
        const q=clamp(1-d/range,0,1),falloff=q*(.45+.55*q),centerFade=clamp((d-this.r-(enemy.r||0))/Math.max(1,this.r),0,1);
        if(falloff<=0||centerFade<=0)continue;
        const spinN=clamp(Math.abs(enemy.omega||0)/Math.max(38,Math.abs(enemy.omega0||0)),0,1.25),spinRatio=spinN/1.25;
        const radialSpin=1.18-.46*spinRatio,tangentSpin=.82+.26*spinRatio,massFactor=clamp(Math.sqrt(1.45/Math.max(.35,enemy.mass||1)),.72,1.18);
        const base=clamp(96*falloff*centerFade*massFactor*this.colossusVortexStrength*skillFactor,0,88),radial=Math.min(72,base*.82*radialSpin),tangent=Math.min(46,base*.48*tangentSpin);
        const ax=inX*radial+ccwX*tangent,ay=inY*radial+ccwY*tangent;
        enemy.vx+=ax*dt;enemy.vy+=ay*dt;
        const inwardSpeed=enemy.vx*inX+enemy.vy*inY;if(inwardSpeed>92){enemy.vx-=inX*(inwardSpeed-92);enemy.vy-=inY*(inwardSpeed-92)}
        const ccwSpeed=enemy.vx*ccwX+enemy.vy*ccwY;if(ccwSpeed>76){enemy.vx-=ccwX*(ccwSpeed-76);enemy.vy-=ccwY*(ccwSpeed-76)}
        const speed=mag(enemy.vx,enemy.vy),maxSpeed=230+(enemy.c?.a||70)*.95+(enemy.impactBoost||0);if(speed>maxSpeed){enemy.vx=enemy.vx/speed*maxSpeed;enemy.vy=enemy.vy/speed*maxSpeed}
        enemy.colossusVortexPullPulse=Math.max(enemy.colossusVortexPullPulse||0,this.colossusVortexStrength*falloff);
        enemy.colossusVortexForceX=ax;enemy.colossusVortexForceY=ay;enemy.colossusVortexSkillFactor=skillFactor;enemy.colossusVortexSpinFactor=radialSpin;
      }
    }
    updateColossusSkill(dt){
      const state=this.colossusSkillState;
      if(state==='quakeCrouch'){
        this.colossusSkillTimer=Math.max(0,this.colossusSkillTimer-dt);
        this.colossusQuakeWindup=this.colossusSkillTimer;
        this.lockToJumpAnchor(dt,14);
        const progress=1-this.colossusSkillTimer/CROUCH_TIME;
        this.colossusPressurePulse=Math.max(this.colossusPressurePulse||0,.48+progress*.35);
        if(this.colossusSkillTimer<=0)this.launchColossusQuake();
      }else if(state==='quakeLeap'){
        this.lockToJumpAnchor(dt,12);
        this.quakeVerticalVelocity-=JUMP_GRAVITY*dt;
        this.colossusJumpHeight=Math.max(0,this.colossusJumpHeight+this.quakeVerticalVelocity*dt);
        this.lift=Math.max(this.lift||0,clamp(this.colossusJumpHeight*.28,0,.30));
        if(this.colossusJumpHeight<=0&&this.quakeVerticalVelocity<0)this.triggerColossusQuake();
      }else if(state==='quakeWaves')this.updateShockwaves(dt);
      else if(state==='quakeRecovery'){
        this.colossusSkillTimer=Math.max(0,this.colossusSkillTimer-dt);
        if(this.colossusSkillTimer<=0)this.colossusSkillState='idle';
      }else if(state==='vortexWindup'){
        this.colossusVortexStateTimer=Math.max(0,this.colossusVortexStateTimer-dt);
        this.colossusVortexPulse=clamp(1-this.colossusVortexStateTimer/VORTEX_WINDUP,0,1)*.28;
        this.colossusVortexPhase-=dt*.7;
        if(this.colossusVortexStateTimer<=0)this.triggerColossusVortex();
      }else if(state==='vortexActive'){
        const elapsed=VORTEX_DURATION-this.colossusVortexStateTimer,envelope=Math.min(1,elapsed/.22,this.colossusVortexStateTimer/.30);
        this.colossusVortexStrength=clamp(envelope,0,1);
        this.colossusVortexPulse=this.colossusVortexStrength;
        this.colossusVortexPhase-=dt*(1.15+.52*this.colossusVortexStrength);
        this.colossusPressurePulse=Math.max(this.colossusPressurePulse||0,this.colossusVortexStrength*.72);
        this.applyVortex(dt);
        this.colossusVortexStateTimer=Math.max(0,this.colossusVortexStateTimer-dt);
        this.energy=Math.max(0,(this.energy||0)-dt*.16*this.colossusVortexStrength);
        if(this.colossusVortexStateTimer<=0)this.finishColossusVortex();
      }else if(state==='vortexRecovery'){
        this.colossusVortexStateTimer=Math.max(0,this.colossusVortexStateTimer-dt);
        this.colossusVortexPulse=.20*clamp(this.colossusVortexStateTimer/VORTEX_RECOVERY,0,1);
        this.colossusVortexPhase-=dt*.48;
        if(this.colossusVortexStateTimer<=0){this.colossusVortexPulse=0;this.colossusSkillState='idle'}
      }
    }
    updateScheduler(dt){
      this.colossusVortexCooldown=Math.max(0,(this.colossusVortexCooldown||0)-dt);
      if(this.colossusSkillState!=='idle'||time<=2.2)return;
      this.colossusQuakeTimer-=dt;
      this.colossusVortexTimer-=dt;
      if(this.colossusVortexTimer<=0&&this.colossusVortexCooldown<=0){
        if(rnd(0,1)<VORTEX_CHANCE){this.beginColossusVortex();return}
        this.colossusVortexTimer=rnd(1.4,2.2);
      }
      if(this.colossusQuakeTimer<=0)this.beginColossusQuake();
    }
    update(dt,opponent){
      super.update(dt,opponent);
      this.updateQuakeHop(dt);
      this.colossusQuakePulse=Math.max(0,(this.colossusQuakePulse||0)-dt*.18);
      this.colossusQuakeAftershock=Math.max(0,(this.colossusQuakeAftershock||0)-dt*1.4);
      this.colossusQuakeFlash=Math.max(0,(this.colossusQuakeFlash||0)-dt*5.2);
      this.colossusAirTurbulence=Math.max(0,(this.colossusAirTurbulence||0)-dt*2.2);
      if(!this.c?.juggernautEngine)return;
      if(!active(this)){this.cancelColossusSkills();return}
      this.updateColossusSkill(dt);
      this.updateScheduler(dt);
    }
    drawQuakeHopShadow(){
      const hop=clamp(this.colossusQuakeHop||0,0,.42),landing=clamp(this.colossusQuakeLandingPulse||0,0,1),hit=clamp(this.colossusQuakeHitPulse||0,0,1);
      if(hop<=0&&landing<=0&&hit<=0)return;
      ctx.save();ctx.translate(this.x,this.y);
      ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(0,0,0,${.12+hop*.42})`;ctx.beginPath();ctx.ellipse(0,this.r*.19,this.r*(.74-hop*.72),this.r*(.24-hop*.11),0,0,Math.PI*2);ctx.fill();
      if(hit>0||landing>0){const pulse=Math.max(hit,landing);ctx.globalCompositeOperation='screen';ctx.strokeStyle=alpha(hit>landing?'#fff2b0':'#bca1ff',pulse*.28);ctx.lineWidth=.8+pulse*1.4;ctx.beginPath();ctx.ellipse(0,this.r*.16,this.r*(.46+(1-pulse)*.38),this.r*(.16+(1-pulse)*.11),0,0,Math.PI*2);ctx.stroke()}
      ctx.restore();
    }
    drawVortexInfluence(){
      const pulse=clamp(this.colossusVortexPullPulse||0,0,1),fx=Number(this.colossusVortexForceX)||0,fy=Number(this.colossusVortexForceY)||0;if(pulse<=.02||(!fx&&!fy)||this.out||this.burst)return;
      ctx.save();ctx.translate(this.x,this.y);ctx.rotate(Math.atan2(fy,fx));ctx.globalCompositeOperation='screen';
      ctx.fillStyle=alpha('#c9b7ff',.08+pulse*.18);ctx.beginPath();ctx.moveTo(this.r*.92,0);ctx.lineTo(-this.r*.30,-this.r*.18);ctx.lineTo(-this.r*.12,0);ctx.lineTo(-this.r*.30,this.r*.18);ctx.closePath();ctx.fill();
      ctx.fillStyle=alpha('#ffffff',pulse*.26);ctx.beginPath();ctx.arc(this.r*.68,0,this.r*.045,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    drawModel(speed){
      const hop=clamp(this.colossusQuakeHop||0,0,.42);
      if(hop<=0||this.colossusSelfModelLift)return super.drawModel(speed);
      drawRaisedModel(this,hop*this.r*2.6,1+hop*.045,()=>super.drawModel(speed));
    }
    draw(){
      this.drawQuakeHopShadow();
      super.draw();
      this.drawVortexInfluence();
    }
  };

  document.documentElement.dataset.worldpressQuake='triple-v5';
})();
