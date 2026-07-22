/* Arena FX V3 — visual-only enhancement layer. Existing physics and abilities stay intact. */
(() => {
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fxBursts=[];
  const compact=typeof innerWidth==='number'&&innerWidth<700;
  const particleBudget=reduceMotion?12:(compact?36:64),impactBudget=reduceMotion?2:(compact?4:6);
  const baseEmit=emit,baseWave=wave;
  emit=function(px,py,color,count=18,power=1,kind='spark'){
    baseEmit(px,py,color,Math.min(count,reduceMotion?18:40),power,kind);
    if(particles.length>particleBudget)particles.splice(0,particles.length-particleBudget);
  };
  wave=function(px,py,color,max=42){
    baseWave(px,py,color,max);
    if(waves.length>8)waves.splice(0,waves.length-8);
  };

  function safeColor(top,fallback='#7fe9ff'){
    return top?.c?.primary||fallback;
  }
  function hasSignatureFx(top){
    const c=top?.c||{};
    return !!(c.splitTop||top?.splitPart||c.skyPouncer||c.phaseCloak||c.charmAura||c.charmEngine||c.rageEngine||c.adaptiveMorph||c.taijiV2||c.taijiWheel||c.taijiMystic||c.sevenSword||c.timeStopEngine||c.juggernautEngine||c.relayDoubleSlot||c.counterTarget==='wizardRod'||c.counterTarget==='customTop'||c.shape==='wooden');
  }

  function pushImpact(sample,colorA,colorB){
    const strength=clamp(sample.power/170,.25,1.35),detail={...sample,severity:clamp(sample.power/190,0,1)};
    fxBursts.push({...detail,life:1,power:strength,colorA,colorB});
    if(fxBursts.length>impactBudget)fxBursts.shift();
    window.dispatchEvent(new CustomEvent('arena-physics-impact',{detail}));
    window.dispatchEvent(new CustomEvent('arenaimpact',{detail:{power:sample.power,x:sample.x,y:sample.y,angle:sample.angle,shear:sample.shear}}));
  }

  const previousArena=drawArenaBase;
  drawArenaBase=function(){
    previousArena();
    const cx=W/2,cy=H/2,phase=(time||performance.now()/1000);
    ctx.save();
    ctx.translate(cx,cy);

    /* Restrained rail markers: filled blocks read as arena structure, not effect rays. */
    ctx.globalCompositeOperation='screen';
    for(let i=0;i<12;i++){
      const a=i*Math.PI*2/12+phase*.018;
      const active=(i+Math.floor(phase*3))%6===0;
      const r=outerR*.846;
      ctx.save();ctx.rotate(a);ctx.translate(r,0);ctx.rotate(Math.PI/2);ctx.fillStyle=active?'rgba(180,247,255,.48)':'rgba(90,199,255,.09)';ctx.fillRect(-outerR*.012,-1,outerR*.024,2);ctx.restore();
    }

    /* Scanning beam */
    if(!reduceMotion){
      ctx.rotate(phase*.12);
      const scan=ctx.createLinearGradient(0,0,outerR*.92,0);
      scan.addColorStop(0,'rgba(107,246,210,.08)');
      scan.addColorStop(.72,'rgba(78,214,255,.035)');
      scan.addColorStop(1,'rgba(78,214,255,0)');
      ctx.fillStyle=scan;
      ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,outerR*.92,-.022,.022);ctx.closePath();ctx.fill();
    }
    ctx.restore();

    /* Ambient light motes — deterministic positions, animated opacity */
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<(reduceMotion?7:14);i++){
      const a=i*2.399963+phase*(.006+(i%4)*.002);
      const r=outerR*(.15+((i*37)%79)/100);
      const twinkle=.20+.18*Math.sin(phase*(1.2+i%5*.17)+i);
      ctx.fillStyle=i%3===0?`rgba(115,237,255,${twinkle})`:`rgba(189,205,255,${twinkle*.45})`;
      ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,.45+(i%3)*.23,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  };

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){
      super(index,data);
      this.fxHuePhase=rnd(0,Math.PI*2);
      this.fxImpactCooldown=0;
    }
    update(dt,opponent){
      super.update(dt,opponent);
      this.fxImpactCooldown=Math.max(0,(this.fxImpactCooldown||0)-dt);
    }
    drawAura(speed){
      if(this.out||this.burst||hasSignatureFx(this))return;
      const spin=Math.abs(this.omega??this.spin??0);
      const intensity=clamp(spin/55,.18,1);
      const lift=clamp(this.lift||0,0,1);
      const pulse=.5+.5*Math.sin((time||0)*7+this.fxHuePhase);
      ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';

      const halo=ctx.createRadialGradient(0,0,this.r*.25,0,0,this.r*(2.45+lift*.7));
      halo.addColorStop(0,alpha(this.c.accent||'#fff',.12*intensity));
      halo.addColorStop(.34,alpha(safeColor(this),(.13+.07*pulse)*intensity));
      halo.addColorStop(1,alpha(safeColor(this),0));
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,this.r*(2.5+lift*.7),0,Math.PI*2);ctx.fill();

      ctx.rotate(this.angle||0);
      ctx.strokeStyle=alpha(safeColor(this),.15+.22*intensity);
      ctx.lineWidth=.8+intensity*1.2;
      ctx.shadowBlur=4+intensity*6;ctx.shadowColor=safeColor(this);
      for(let i=0;i<2;i++){
        const a=i*Math.PI+this.fxHuePhase*.2;
        ctx.beginPath();
        ctx.arc(0,0,this.r*(1.18+i*.10+lift*.12),a,a+.44+intensity*.42);
        ctx.stroke();
      }
      ctx.restore();
    }
    drawSpeedCrown(speed){
      if(this.out||this.burst||hasSignatureFx(this))return;
      const spin=Math.abs(this.omega??this.spin??0);
      const intensity=clamp((spin-8)/46,0,1);
      if(intensity<=.04)return;
      const sign=Math.sign(this.omega??this.spin??1)||1;
      ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';
      ctx.rotate(this.angle||0);ctx.shadowBlur=4+6*intensity;ctx.shadowColor=this.c.accent||'#fff';
      const spokes=reduceMotion?2:4;
      for(let i=0;i<spokes;i++){
        const a=i*Math.PI*2/spokes;
        const inner=this.r*(.76+(i%2)*.06),outer=this.r*(1.02+intensity*.25+(i%3)*.035);
        ctx.save();ctx.rotate(sign*a);ctx.fillStyle=alpha(this.c.accent||'#ffffff',.12+.24*intensity);ctx.beginPath();ctx.moveTo(inner,-this.r*.035);ctx.lineTo(outer,sign*this.r*.08);ctx.lineTo(inner,this.r*.035);ctx.closePath();ctx.fill();ctx.restore();
      }
      if(speed>125&&!reduceMotion){
        const velocityAngle=Math.atan2(this.vy||0,this.vx||0);
        ctx.rotate(velocityAngle-(this.angle||0));
        const trailLength=clamp(speed*.10,10,32);
        const beam=ctx.createLinearGradient(-trailLength,0,-this.r*.55,0);
        beam.addColorStop(0,alpha(safeColor(this),0));beam.addColorStop(1,alpha(this.c.accent||'#fff',.32));
        ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(-this.r*.55,-2.2);ctx.lineTo(-trailLength,0);ctx.lineTo(-this.r*.55,2.2);ctx.closePath();ctx.fill();
      }
      ctx.restore();
    }
    draw(){
      if(this.out||this.burst)return super.draw();
      const speed=mag(this.vx||0,this.vy||0);
      this.drawAura(speed);
      super.draw();
      this.drawSpeedCrown(speed);
    }
  };

  const previousCollide=collide;
  collide=function(a,b){
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),touch=(a.r||0)+(b.r||0)+1.5;
    let sample=null;
    if(d>0&&d<touch&&!a.out&&!b.out&&!a.burst&&!b.burst&&!a.colossusJumpGhost&&!b.colossusJumpGhost){
      const nx=dx/d,ny=dy/d,tx=-ny,ty=nx,rvx=b.vx-a.vx,rvy=b.vy-a.vy;
      const closingN=Math.max(0,-(rvx*nx+rvy*ny)),tangent=rvx*tx+rvy*ty,spinA=(a.omega??a.spin??0)*(a.r||0),spinB=(b.omega??b.spin??0)*(b.r||0);
      const wa=Math.max(1,a.c?.w||70),wb=Math.max(1,b.c?.w||70),reducedMass=wa*wb/(wa+wb);
      sample={x:a.x+nx*(a.r||0),y:a.y+ny*(a.r||0),nx,ny,tx,ty,angle:Math.atan2(ny,nx),closingN,slipT:tangent-spinA-spinB,shear:tangent-(spinA+spinB)*.16,reducedMass,massScale:clamp(.78+reducedMass/155,.82,1.34),preAVx:a.vx,preAVy:a.vy,preBVx:b.vx,preBVy:b.vy,wa,wb};
    }
    previousCollide(a,b);
    if(sample){
      const dAVx=a.vx-sample.preAVx,dAVy=a.vy-sample.preAVy,dBVx=b.vx-sample.preBVx,dBVy=b.vy-sample.preBVy;
      const impulseX=.5*(sample.wb*dBVx-sample.wa*dAVx),impulseY=.5*(sample.wb*dBVy-sample.wa*dAVy);
      sample.jn=Math.abs(impulseX*sample.nx+impulseY*sample.ny);sample.jt=impulseX*sample.tx+impulseY*sample.ty;sample.energyN=.5*sample.reducedMass*sample.closingN*sample.closingN;sample.power=sample.closingN*(.84+.16*sample.massScale)+Math.min(34,Math.sqrt(sample.jn)*.48);
      delete sample.preAVx;delete sample.preAVy;delete sample.preBVx;delete sample.preBVy;delete sample.wa;delete sample.wb;
    }
    if(sample?.power>24&&(a.fxImpactCooldown||0)<=0&&(b.fxImpactCooldown||0)<=0){
      a.fxImpactCooldown=b.fxImpactCooldown=clamp(.18-sample.power*.00025,.08,.17);
      pushImpact(sample,safeColor(a),safeColor(b,'#ff6b8e'));
    }
  };

  const previousEffects=effects;
  effects=function(dt){
    previousEffects(dt);
    fxBursts.forEach(f=>f.life-=dt*(1.72+f.power*.24-clamp((f.massScale-1)*.28,-.08,.08)));
    for(let i=fxBursts.length-1;i>=0;i--)if(fxBursts[i].life<=0)fxBursts.splice(i,1);
  };

  function drawImpactBurst(f){
    const p=1-f.life,travel=1-Math.pow(1-p,3),reach=(18+f.power*38)*(f.massScale||1),shear=clamp((f.shear||0)/260,-1,1);
    ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.angle||0);ctx.globalCompositeOperation='screen';
    const glow=ctx.createRadialGradient(0,0,0,0,0,reach*.48);
    glow.addColorStop(0,`rgba(255,255,255,${f.life*.58})`);
    glow.addColorStop(.20,alpha(f.colorA,f.life*.32));
    glow.addColorStop(.56,alpha(f.colorB,f.life*.12));
    glow.addColorStop(1,'rgba(255,255,255,0)');
    ctx.save();ctx.scale(.42,1);ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,reach*.48,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.strokeStyle=alpha('#ffffff',f.life*.28);ctx.lineWidth=.8+f.power*1.1;ctx.shadowBlur=8;ctx.shadowColor='#fff';
    ctx.beginPath();ctx.ellipse(0,0,reach*travel,reach*(.46+.08*(f.massScale||1))*travel,0,0,Math.PI*2);ctx.stroke();
    for(const side of [-1,1]){
      ctx.fillStyle=alpha(side<0?f.colorA:f.colorB,f.life*.38);ctx.beginPath();ctx.moveTo(side*5,-4);ctx.lineTo(side*reach*(.32+.16*p),0);ctx.lineTo(side*5,4);ctx.closePath();ctx.fill();
    }
    if(Math.abs(shear)>.12){ctx.fillStyle=alpha(shear>0?f.colorA:f.colorB,f.life*.44);for(const side of [-1,1]){const y=side*reach*(.18+.22*p)*Math.sign(shear);ctx.save();ctx.translate(side*reach*.08,y);ctx.rotate(shear*.45);ctx.fillRect(-3,-1,6+reach*.08*p,2);ctx.restore()}}
    ctx.restore();
  }

  const previousDrawScene=drawScene;
  drawScene=function(){
    previousDrawScene();
    if(!fxBursts.length)return;
    ctx.save();
    fxBursts.forEach(drawImpactBurst);
    ctx.restore();
  };

  document.documentElement.dataset.arenaFx='physics-v8';
})();
