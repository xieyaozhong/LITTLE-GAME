/* Worldpress Colossus V4: cinematic seismic charge, arena rupture, aftershocks, and visible enemy bounce */
(() => {
  const KEY='worldpressColossus';
  const QUAKE_WINDUP=1.06;
  if(metaPresets?.[KEY])metaPresets[KEY].rank='雙棒占用・巨軀鎮壓・鎮界震撼';

  const active=top=>!!top&&!top.out&&!top.burst&&!top.skyStaminaDefeated&&!top.skyEnergyDepletedLatch&&(top.energy||0)>0;
  const teamOf=top=>top?.teamIndex??(top?.index?1:0);
  const airborne=top=>!!top?.skyJumpGhost||['climb','orbit','air','direct'].includes(top?.skyJumpState);
  const easeOutCubic=t=>1-Math.pow(1-clamp(t,0,1),3);

  const previousRenderPanel=renderPanel;
  renderPanel=function(id){
    previousRenderPanel(id);
    const host=document.querySelector('#'+id),c=cfg[id];
    if(!host||!c?.juggernautEngine)return;
    const ability=host.querySelector('.colossus-ability');
    if(ability)ability.innerHTML='<strong>雙棒限定・鎮界重軀</strong>巨神會放下四座鎮界錨，將八角地殼板逐層壓向核心；落震時地殼板分段外翻、菱形岩塊向外推移並留下十道主裂隙，最後由四段弧形餘震收束。動畫更有重量感，也更容易辨認蓄力與衝擊時機。<div class="combo-tags"><span>四座鎮界錨</span><span>八角地殼板</span><span>分段外翻</span><span>弧形餘震</span></div>';
  };

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){
      super(index,data);
      this.colossusQuakeTimer=rnd(5.8,8.8);
      this.colossusQuakeWindup=0;
      this.colossusQuakePulse=0;
      this.colossusQuakeAftershock=0;
      this.colossusQuakeFlash=0;
      this.colossusQuakeSeed=rnd(0,Math.PI*2);
      this.colossusQuakeCount=0;
      this.colossusQuakeHop=0;
      this.colossusQuakeHopVelocity=0;
      this.colossusQuakeLandingPulse=0;
    }
    beginColossusQuake(){
      if(!this.c?.juggernautEngine||!active(this)||this.colossusQuakeWindup>0)return;
      this.colossusQuakeWindup=QUAKE_WINDUP;
      this.colossusQuakeSeed=rnd(0,Math.PI*2);
      this.colossusPressurePulse=Math.max(this.colossusPressurePulse||0,.92);
      wave(this.x,this.y,this.c.primary,this.r*2.4);
      addLog(`${this.c.name} 沉下巨軀鎖住競技盤，地脈刻印開始收縮——「鎮界震撼」蓄能中！`);
    }
    triggerColossusQuake(){
      if(!this.c?.juggernautEngine||!active(this))return;
      this.colossusQuakeCount++;
      this.colossusQuakePulse=1;
      this.colossusQuakeAftershock=1;
      this.colossusQuakeFlash=1;
      this.colossusPressurePulse=1;
      this.colossusQuakeTimer=rnd(7.2,11.4);
      this.energy=Math.max(0,(this.energy||0)-1.35);
      this.omega*=.992;this.spin=this.omega;
      this.tiltVel*=.30;

      const cx=W/2,cy=H/2;
      wave(cx,cy,'#fff8d8',outerR*.35);
      wave(cx,cy,this.c.accent,outerR*.67);
      wave(cx,cy,this.c.primary,outerR*.91);
      wave(cx,cy,'#fff3c4',outerR*1.14);
      for(let i=0;i<22;i++){
        const a=this.colossusQuakeSeed+i*Math.PI*2/22+rnd(-.12,.12),rr=outerR*rnd(.12,.92);
        const color=i%4===0?'#fff8dc':i%2?this.c.primary:this.c.accent;
        emit(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,color,rnd(4,8),rnd(.48,.82),'streak');
      }
      for(let i=0;i<8;i++){
        const a=this.colossusQuakeSeed+i*Math.PI/4;
        const rr=outerR*rnd(.18,.46);
        emit(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,'#d9c6ff',10,.72);
      }
      shake=Math.max(shake,23);flash=Math.max(flash,.48);

      if(Array.isArray(tops))tops.forEach(enemy=>{
        if(enemy===this||teamOf(enemy)===teamOf(this)||!active(enemy)||enemy.phaseInvisible)return;
        if(airborne(enemy)){
          enemy.vx*=.95;enemy.vy*=.95;
          enemy.colossusAirTurbulence=Math.max(enemy.colossusAirTurbulence||0,.42);
          return;
        }
        const dx=enemy.x-cx,dy=enemy.y-cy,d=mag(dx,dy)||1,edge=clamp(d/Math.max(1,outerR),0,1);
        const strength=.90+.20*(1-edge),nx=dx/d,ny=dy/d;
        enemy.vx=enemy.vx*.78+nx*(21+11*strength);
        enemy.vy=enemy.vy*.78+ny*(21+11*strength);
        enemy.omega*=.972;enemy.spin=enemy.omega;
        enemy.energy=Math.max(0,(enemy.energy||0)-1.12*strength);
        enemy.tiltVel+=(Math.sign(enemy.omega)||1)*(.15+.055*strength)/Math.max(.72,enemy.tip?.stability||1);
        enemy.lift=clamp(Math.max(enemy.lift||0,.065)+.09*strength,0,.32);
        enemy.colossusQuakeHop=Math.max(enemy.colossusQuakeHop||0,.022);
        enemy.colossusQuakeHopVelocity=Math.max(enemy.colossusQuakeHopVelocity||0,1.92+.27*strength);
        enemy.colossusQuakeLandingPulse=0;
        enemy.colossusQuakeHitPulse=1;
        enemy.burstMeter=(enemy.burstMeter||0)+.58*strength;
        emit(enemy.x,enemy.y,'#fff4c4',12,.50,'streak');
        wave(enemy.x,enemy.y,this.c.accent,30);
      });
      addLog(`${this.c.name} 發動「鎮界震撼」！地表崩裂、四重震波擴散，地面上的敵方陀螺被震起並陷入餘震！`);
    }
    updateQuakeHop(dt){
      this.colossusQuakeLandingPulse=Math.max(0,(this.colossusQuakeLandingPulse||0)-dt*2.45);
      this.colossusQuakeHitPulse=Math.max(0,(this.colossusQuakeHitPulse||0)-dt*3.2);
      this.colossusAirTurbulence=Math.max(0,(this.colossusAirTurbulence||0)-dt*1.8);
      if((this.colossusQuakeHop||0)<=0&&(this.colossusQuakeHopVelocity||0)<=0)return;
      this.colossusQuakeHopVelocity-=7.8*dt;
      this.colossusQuakeHop=Math.max(0,(this.colossusQuakeHop||0)+this.colossusQuakeHopVelocity*dt);
      if(this.colossusQuakeHop<=0&&this.colossusQuakeHopVelocity<0){
        this.colossusQuakeHop=0;
        this.colossusQuakeHopVelocity=0;
        this.colossusQuakeLandingPulse=1;
        if(!this.out&&!this.burst){
          wave(this.x,this.y,'#ffe3a0',34);
          wave(this.x,this.y,'#b89cff',22);
          emit(this.x,this.y,'#fff1c9',11,.46);
          this.tiltVel+=(Math.sign(this.omega)||1)*.030/Math.max(.72,this.tip?.stability||1);
          shake=Math.max(shake,3.2);
        }
      }
    }
    update(dt,opponent){
      super.update(dt,opponent);
      this.updateQuakeHop(dt);
      this.colossusQuakePulse=Math.max(0,(this.colossusQuakePulse||0)-dt*.62);
      this.colossusQuakeAftershock=Math.max(0,(this.colossusQuakeAftershock||0)-dt*.92);
      this.colossusQuakeFlash=Math.max(0,(this.colossusQuakeFlash||0)-dt*3.8);
      if(!this.c?.juggernautEngine||!active(this))return;
      if(this.colossusQuakeWindup>0){
        this.colossusQuakeWindup=Math.max(0,this.colossusQuakeWindup-dt);
        const progress=1-clamp(this.colossusQuakeWindup/QUAKE_WINDUP,0,1);
        this.vx*=Math.exp(-(1.9+progress*1.8)*dt);
        this.vy*=Math.exp(-(1.9+progress*1.8)*dt);
        this.tiltVel*=Math.exp(-1.5*dt);
        this.colossusPressurePulse=Math.max(this.colossusPressurePulse||0,.78+progress*.20);
        shake=Math.max(shake,.8+progress*3.8+Math.sin(time*38)*progress*.65);
        if(progress>.72)flash=Math.max(flash,(progress-.72)*.18);
        if(this.colossusQuakeWindup<=0)this.triggerColossusQuake();
      }else{
        this.colossusQuakeTimer-=dt;
        if(this.colossusQuakeTimer<=0&&time>2.2&&this.energy>8)this.beginColossusQuake();
      }
    }
    drawFloorCracks(progress,pulse){
      const cx=W/2,cy=H/2;
      const strength=Math.max(progress*.78,pulse);
      if(strength<=0)return;
      ctx.save();ctx.translate(cx,cy);ctx.globalCompositeOperation='screen';
      for(let i=0;i<16;i++){
        const a=this.colossusQuakeSeed+i*Math.PI*2/16;
        const start=outerR*(progress>0?.18+.20*(1-progress):.10);
        const reach=outerR*(progress>0?.34+.48*progress:.82);
        ctx.beginPath();ctx.moveTo(Math.cos(a)*start,Math.sin(a)*start);
        for(let s=1;s<=6;s++){
          const t=s/6,rr=start+(reach-start)*t;
          const wob=Math.sin((i+2)*(s+1)*1.47+this.colossusQuakeSeed)*outerR*(.010+.018*t);
          ctx.lineTo(Math.cos(a)*rr-Math.sin(a)*wob,Math.sin(a)*rr+Math.cos(a)*wob);
          if(s===3&&strength>.45){
            const branch=a+(i%2?1:-1)*(.24+.08*Math.sin(i));
            ctx.moveTo(Math.cos(a)*rr-Math.sin(a)*wob,Math.sin(a)*rr+Math.cos(a)*wob);
            ctx.lineTo(Math.cos(branch)*(rr+outerR*.10),Math.sin(branch)*(rr+outerR*.10));
            ctx.moveTo(Math.cos(a)*rr-Math.sin(a)*wob,Math.sin(a)*rr+Math.cos(a)*wob);
          }
        }
        ctx.strokeStyle=alpha(i%3===0?'#fff0b4':i%2?this.c.primary:this.c.accent,.07+strength*.30);
        ctx.lineWidth=.8+strength*2.2;ctx.shadowBlur=8+strength*14;ctx.shadowColor=i%2?this.c.primary:this.c.accent;ctx.stroke();
      }
      ctx.restore();
    }
    drawQuakeField(){
      if(!this.c?.juggernautEngine||this.out||this.burst)return;
      const charging=this.colossusQuakeWindup>0;
      const progress=charging?1-clamp(this.colossusQuakeWindup/QUAKE_WINDUP,0,1):0;
      const pulse=clamp(this.colossusQuakePulse||0,0,1);
      const aftershock=clamp(this.colossusQuakeAftershock||0,0,1);
      const flashPulse=clamp(this.colossusQuakeFlash||0,0,1);
      if(!charging&&pulse<=0&&aftershock<=0)return;
      const cx=W/2,cy=H/2;

      ctx.save();ctx.translate(cx,cy);ctx.globalCompositeOperation='screen';
      if(charging){
        const dark=ctx.createRadialGradient(0,0,outerR*.08,0,0,outerR*1.12);
        dark.addColorStop(0,alpha(this.c.primary,.06+progress*.12));
        dark.addColorStop(.55,alpha(this.c.secondary,.04+progress*.10));
        dark.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=dark;ctx.beginPath();ctx.arc(0,0,outerR*1.12,0,Math.PI*2);ctx.fill();

        for(let k=0;k<3;k++){
          const phase=(progress+k*.18)%1;
          const ringR=outerR*(.98-phase*.67);
          ctx.strokeStyle=alpha(k===1?'#fff0b4':k===2?this.c.primary:this.c.accent,.12+progress*.34);
          ctx.lineWidth=1.5+progress*3.8;ctx.shadowBlur=12+progress*22;ctx.shadowColor=k===2?this.c.primary:this.c.accent;
          ctx.setLineDash([12-progress*4,8]);ctx.beginPath();ctx.arc(0,0,ringR,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        }

        const sigilR=outerR*(.23+.07*Math.sin(time*7));
        ctx.save();ctx.rotate(-time*(.28+progress*.42));
        ctx.strokeStyle=alpha('#fff3bd',.10+progress*.42);ctx.lineWidth=1.2+progress*2.2;ctx.shadowBlur=18;ctx.shadowColor=this.c.primary;
        for(let i=0;i<8;i++){
          const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*sigilR*.48,Math.sin(a)*sigilR*.48);ctx.lineTo(Math.cos(a)*sigilR,Math.sin(a)*sigilR);ctx.stroke();
        }
        ctx.beginPath();ctx.arc(0,0,sigilR*.72,0,Math.PI*2);ctx.stroke();ctx.restore();
      }
      if(pulse>0||aftershock>0){
        const impact=1-pulse;
        for(let k=0;k<4;k++){
          const delayed=clamp(impact-k*.085,0,1);
          const rr=outerR*easeOutCubic(delayed)*1.12;
          ctx.strokeStyle=alpha(k===0?'#fff8dc':k===1?this.c.accent:this.c.primary,.08+pulse*(.42-k*.055));
          ctx.lineWidth=1.5+pulse*(6-k*.65);ctx.shadowBlur=10+pulse*24;ctx.shadowColor=k===1?this.c.accent:this.c.primary;
          ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.stroke();
        }
        const afterProgress=1-aftershock;
        for(let k=0;k<2;k++){
          const local=clamp(afterProgress-k*.23,0,1);
          if(local<=0)continue;
          ctx.strokeStyle=alpha(k?'#cbb8ff':'#ffe9aa',aftershock*.20);
          ctx.lineWidth=1+aftershock*2.4;ctx.setLineDash([6,10]);
          ctx.beginPath();ctx.arc(0,0,outerR*(.18+local*.88),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        }
      }
      if(flashPulse>0){
        const glow=ctx.createRadialGradient(0,0,0,0,0,outerR*.72);
        glow.addColorStop(0,alpha('#ffffff',flashPulse*.42));
        glow.addColorStop(.22,alpha('#fff0b6',flashPulse*.24));
        glow.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,outerR*.72,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();

      this.drawFloorCracks(progress,pulse);
    }
    drawQuakeHopShadow(){
      const hop=clamp(this.colossusQuakeHop||0,0,.42),landing=clamp(this.colossusQuakeLandingPulse||0,0,1),hit=clamp(this.colossusQuakeHitPulse||0,0,1);
      if(hop<=0&&landing<=0&&hit<=0)return;
      ctx.save();ctx.translate(this.x,this.y);
      ctx.globalCompositeOperation='source-over';
      ctx.fillStyle=`rgba(0,0,0,${.14+hop*.48})`;
      ctx.beginPath();ctx.ellipse(0,this.r*.19,this.r*(.72-hop*.46),this.r*(.24-hop*.08),0,0,Math.PI*2);ctx.fill();
      ctx.globalCompositeOperation='screen';
      if(hit>0){
        ctx.strokeStyle=alpha('#fff4bd',hit*.52);ctx.lineWidth=1+hit*3;
        ctx.beginPath();ctx.ellipse(0,this.r*.16,this.r*(.42+(1-hit)*.48),this.r*(.15+(1-hit)*.16),0,0,Math.PI*2);ctx.stroke();
      }
      if(landing>0){
        for(let k=0;k<2;k++){
          ctx.strokeStyle=alpha(k?'#bca1ff':'#ffe6a6',landing*(.40-k*.09));ctx.lineWidth=1+landing*(2.6-k*.4);
          ctx.beginPath();ctx.ellipse(0,this.r*.16,this.r*(.72+(1-landing)*(.48+k*.22)),this.r*(.24+(1-landing)*(.13+k*.05)),0,0,Math.PI*2);ctx.stroke();
        }
      }
      ctx.restore();
    }
    draw(){
      this.drawQuakeField();
      const hop=clamp(this.colossusQuakeHop||0,0,.42);
      this.drawQuakeHopShadow();
      if(hop>0){
        const height=hop*this.r*1.72;
        const scale=1+hop*.10;
        ctx.save();ctx.translate(this.x,this.y-height);ctx.scale(scale,scale);ctx.translate(-this.x,-this.y);super.draw();ctx.restore();
      }else super.draw();

      if(this.colossusAirTurbulence>0&&!this.out&&!this.burst){
        const p=clamp(this.colossusAirTurbulence,0,1);
        ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';ctx.strokeStyle=alpha('#d8efff',p*.32);ctx.lineWidth=1.2;
        for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,this.r*(1.15+i*.20),-.6+i*.7,1.1+i*.7);ctx.stroke()}ctx.restore();
      }

      if(!this.c?.juggernautEngine||this.out||this.burst||this.colossusQuakeWindup<=0)return;
      const q=1-clamp(this.colossusQuakeWindup/QUAKE_WINDUP,0,1);
      const compress=Math.sin(q*Math.PI)*this.r*.16;
      ctx.save();ctx.translate(this.x,this.y+compress);ctx.globalCompositeOperation='screen';
      const core=ctx.createRadialGradient(0,0,this.r*.18,0,0,this.r*2.1);
      core.addColorStop(0,alpha('#fff7d0',.20+q*.34));core.addColorStop(.32,alpha(this.c.accent,.10+q*.24));core.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,this.r*2.1,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=alpha('#fff1b0',.34+q*.52);ctx.lineWidth=2+q*3.6;ctx.shadowBlur=20+q*18;ctx.shadowColor=this.c.primary;
      for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(0,0,this.r*(1.35+i*.25-q*.22),0,Math.PI*2);ctx.stroke()}
      ctx.font=`1000 ${Math.max(12,this.r*(.38+q*.06))}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff9df';ctx.shadowBlur=18;ctx.fillText(q>.72?'震':'鎮',0,0);
      ctx.restore();
    }
  };

  document.documentElement.dataset.worldpressQuake='v3';
})();
