/* Arena FX V3 — visual-only enhancement layer. Existing physics and abilities stay intact. */
(() => {
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fxBursts=[];
  let ambientSeed=0;

  function safeColor(top,fallback='#7fe9ff'){
    return top?.c?.primary||fallback;
  }

  function pushImpact(x,y,power,colorA,colorB){
    const strength=clamp(power/170,.25,1.35);
    fxBursts.push({x,y,life:1,power:strength,colorA,colorB,rotation:rnd(0,Math.PI*2)});
    wave(x,y,'#ffffff',clamp(30+power*.20,34,88));
    emit(x,y,'#ffffff',Math.round(clamp(power/5,12,42)),clamp(.55+power/260,.58,1.25),'streak');
    emit(x,y,colorA,Math.round(clamp(power/8,7,24)),clamp(.45+power/340,.48,.95));
    window.dispatchEvent(new CustomEvent('arenaimpact',{detail:{power,x,y}}));
  }

  const previousArena=drawArenaBase;
  drawArenaBase=function(){
    previousArena();
    const cx=W/2,cy=H/2,phase=(time||performance.now()/1000);
    ctx.save();
    ctx.translate(cx,cy);

    /* Living rail segments */
    ctx.globalCompositeOperation='screen';
    for(let i=0;i<36;i++){
      const a=i*Math.PI*2/36+phase*.055;
      const active=(i+Math.floor(phase*8))%9===0;
      const r=outerR*.846;
      ctx.strokeStyle=active?'rgba(180,247,255,.68)':'rgba(90,199,255,.12)';
      ctx.lineWidth=active?2.2:.8;
      ctx.shadowBlur=active?13:0;
      ctx.shadowColor='#5de5ff';
      ctx.beginPath();
      ctx.arc(0,0,r,a,a+.055);
      ctx.stroke();
    }

    /* Counter-rotating arena energy tracks */
    for(let ring=0;ring<3;ring++){
      const radius=innerR*(.26+ring*.19);
      const dir=ring%2?-1:1;
      const start=phase*(.10+ring*.025)*dir+ring;
      ctx.strokeStyle=ring===1?'rgba(151,113,255,.085)':'rgba(84,225,255,.075)';
      ctx.lineWidth=1;
      ctx.setLineDash([2+ring*2,12+ring*5]);
      ctx.lineDashOffset=phase*10*dir;
      ctx.beginPath();ctx.arc(0,0,radius,start,start+Math.PI*1.7);ctx.stroke();
    }
    ctx.setLineDash([]);

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
    ambientSeed++;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<(reduceMotion?12:24);i++){
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
      if(this.out||this.burst)return;
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

      const sign=Math.sign(this.omega??this.spin??1)||1;
      ctx.rotate((time||0)*(3.6+intensity*5)*sign);
      ctx.strokeStyle=alpha(safeColor(this),.18+.28*intensity);
      ctx.lineWidth=1.1+intensity*1.9;
      ctx.shadowBlur=8+intensity*12;ctx.shadowColor=safeColor(this);
      for(let i=0;i<3;i++){
        const a=i*Math.PI*2/3;
        ctx.beginPath();
        ctx.arc(0,0,this.r*(1.18+i*.12+lift*.12),a,a+.56+intensity*.6);
        ctx.stroke();
      }
      ctx.restore();
    }
    drawSpeedCrown(speed){
      if(this.out||this.burst)return;
      const spin=Math.abs(this.omega??this.spin??0);
      const intensity=clamp((spin-8)/46,0,1);
      if(intensity<=.04)return;
      const sign=Math.sign(this.omega??this.spin??1)||1;
      ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';
      ctx.rotate((this.angle||0)*.3);
      ctx.strokeStyle=alpha(this.c.accent||'#ffffff',.24+.34*intensity);
      ctx.lineWidth=.65+intensity*.8;
      ctx.shadowBlur=6+8*intensity;ctx.shadowColor=this.c.accent||'#fff';
      const spokes=reduceMotion?4:7;
      for(let i=0;i<spokes;i++){
        const a=i*Math.PI*2/spokes+(time||0)*sign*.4;
        const inner=this.r*(.76+(i%2)*.06),outer=this.r*(1.02+intensity*.25+(i%3)*.035);
        ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a+sign*.11)*outer,Math.sin(a+sign*.11)*outer);ctx.stroke();
      }
      if(speed>125&&!reduceMotion){
        const velocityAngle=Math.atan2(this.vy||0,this.vx||0);
        ctx.rotate(velocityAngle-(this.angle||0)*.3);
        const trailLength=clamp(speed*.10,10,32);
        const beam=ctx.createLinearGradient(-trailLength,0,0,0);
        beam.addColorStop(0,alpha(safeColor(this),0));beam.addColorStop(1,alpha(this.c.accent||'#fff',.45));
        ctx.strokeStyle=beam;ctx.lineWidth=1.2;
        for(let k=-1;k<=1;k++){
          ctx.beginPath();ctx.moveTo(-trailLength,k*3.2);ctx.lineTo(-this.r*.65,k*2.2);ctx.stroke();
        }
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
    let power=0;
    if(d>0&&d<touch&&!a.out&&!b.out&&!a.burst&&!b.burst){
      const nx=dx/d,ny=dy/d;
      power=Math.max(0,-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny));
    }
    previousCollide(a,b);
    if(power>24&&(a.fxImpactCooldown||0)<=0&&(b.fxImpactCooldown||0)<=0){
      a.fxImpactCooldown=b.fxImpactCooldown=clamp(.18-power*.00025,.08,.17);
      pushImpact((a.x+b.x)/2,(a.y+b.y)/2,power,safeColor(a),safeColor(b,'#ff6b8e'));
    }
  };

  const previousEffects=effects;
  effects=function(dt){
    previousEffects(dt);
    fxBursts.forEach(f=>f.life-=dt*(1.75+f.power*.35));
    for(let i=fxBursts.length-1;i>=0;i--)if(fxBursts[i].life<=0)fxBursts.splice(i,1);
  };

  function drawImpactBurst(f){
    const p=1-f.life,reach=22+f.power*44;
    ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.rotation+p*.5);ctx.globalCompositeOperation='screen';
    const glow=ctx.createRadialGradient(0,0,0,0,0,reach*.76);
    glow.addColorStop(0,`rgba(255,255,255,${f.life*.72})`);
    glow.addColorStop(.14,alpha(f.colorA,f.life*.46));
    glow.addColorStop(.45,alpha(f.colorB,f.life*.20));
    glow.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,reach*.76,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=12;ctx.shadowColor='#fff';
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4+(i%2)*.14;
      const len=reach*(.46+(i%3)*.18)*p;
      ctx.strokeStyle=i%2?alpha(f.colorA,f.life*.72):alpha(f.colorB,f.life*.72);
      ctx.lineWidth=i%3===0?1.7:.8;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*7,Math.sin(a)*7);ctx.lineTo(Math.cos(a)*len,Math.sin(a)*len);ctx.stroke();
    }
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

  document.documentElement.dataset.arenaFx='v3';
})();
