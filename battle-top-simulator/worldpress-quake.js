/* Worldpress Colossus V2: periodic arena-wide seismic skill with visible windup */
(() => {
  const KEY='worldpressColossus';
  if(metaPresets?.[KEY])metaPresets[KEY].rank='雙棒占用・巨軀鎮壓・地脈震撼';

  const active=top=>!!top&&!top.out&&!top.burst&&!top.skyStaminaDefeated&&!top.skyEnergyDepletedLatch&&(top.energy||0)>0;
  const teamOf=top=>top?.teamIndex??(top?.index?1:0);
  const airborne=top=>!!top?.skyJumpGhost||['climb','orbit','air','direct'].includes(top?.skyJumpState);

  const previousRenderPanel=renderPanel;
  renderPanel=function(id){
    previousRenderPanel(id);
    const host=document.querySelector('#'+id),c=cfg[id];
    if(!host||!c?.juggernautEngine)return;
    const ability=host.querySelector('.colossus-ability');
    if(ability)ability.innerHTML='<strong>雙棒限定・鎮界重軀</strong>超大直徑與高慣量形成近身壓迫場；並會不定期蓄積地脈，發動「鎮界震撼」震動整座場地，使地面敵人減速、失衡並流失少量體力。震動前會出現裂紋與收縮光環提示，飛行中的陀螺只受輕微亂流。<div class="combo-tags"><span>占用兩棒</span><span>重壓場</span><span>全場震動</span><span>可見前搖</span></div>';
  };

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){
      super(index,data);
      this.colossusQuakeTimer=rnd(5.8,8.8);
      this.colossusQuakeWindup=0;
      this.colossusQuakePulse=0;
      this.colossusQuakeSeed=rnd(0,Math.PI*2);
      this.colossusQuakeCount=0;
    }
    beginColossusQuake(){
      if(!this.c?.juggernautEngine||!active(this)||this.colossusQuakeWindup>0)return;
      this.colossusQuakeWindup=.82;
      this.colossusQuakeSeed=rnd(0,Math.PI*2);
      this.colossusPressurePulse=Math.max(this.colossusPressurePulse||0,.82);
      addLog(`${this.c.name} 將巨軀壓向競技盤，地脈開始共振——「鎮界震撼」即將發動！`);
    }
    triggerColossusQuake(){
      if(!this.c?.juggernautEngine||!active(this))return;
      this.colossusQuakeCount++;
      this.colossusQuakePulse=1;
      this.colossusPressurePulse=1;
      this.colossusQuakeTimer=rnd(7.2,11.4);
      this.energy=Math.max(0,(this.energy||0)-1.35);
      this.omega*=.992;this.spin=this.omega;
      this.tiltVel*=.35;

      const cx=W/2,cy=H/2;
      wave(cx,cy,this.c.accent,outerR*.62);
      wave(cx,cy,this.c.primary,outerR*.88);
      wave(cx,cy,'#fff3c4',outerR*1.08);
      for(let i=0;i<12;i++){
        const a=this.colossusQuakeSeed+i*Math.PI*2/12+rnd(-.10,.10),rr=outerR*rnd(.24,.86);
        emit(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,i%2?this.c.primary:this.c.accent,5,.55,'streak');
      }
      shake=Math.max(shake,15.5);flash=Math.max(flash,.22);

      if(Array.isArray(tops))tops.forEach(enemy=>{
        if(enemy===this||teamOf(enemy)===teamOf(this)||!active(enemy)||enemy.phaseInvisible)return;
        if(airborne(enemy)){enemy.vx*=.96;enemy.vy*=.96;return}
        const dx=enemy.x-cx,dy=enemy.y-cy,d=mag(dx,dy)||1,edge=clamp(d/Math.max(1,outerR),0,1);
        const strength=.88+.18*(1-edge),nx=dx/d,ny=dy/d;
        enemy.vx=enemy.vx*.80+nx*(18+10*strength);
        enemy.vy=enemy.vy*.80+ny*(18+10*strength);
        enemy.omega*=.974;enemy.spin=enemy.omega;
        enemy.energy=Math.max(0,(enemy.energy||0)-1.10*strength);
        enemy.tiltVel+=(Math.sign(enemy.omega)||1)*(.13+.05*strength)/Math.max(.72,enemy.tip?.stability||1);
        enemy.lift=clamp((enemy.lift||0)+.035*strength,0,1);
        enemy.burstMeter=(enemy.burstMeter||0)+.55*strength;
      });
      addLog(`${this.c.name} 發動「鎮界震撼」！競技盤整體震動，地面上的敵方陀螺受到失衡與減速！`);
    }
    update(dt,opponent){
      super.update(dt,opponent);
      this.colossusQuakePulse=Math.max(0,(this.colossusQuakePulse||0)-dt*.72);
      if(!this.c?.juggernautEngine||!active(this))return;
      if(this.colossusQuakeWindup>0){
        this.colossusQuakeWindup=Math.max(0,this.colossusQuakeWindup-dt);
        this.vx*=Math.exp(-1.8*dt);this.vy*=Math.exp(-1.8*dt);
        this.colossusPressurePulse=Math.max(this.colossusPressurePulse||0,.72);
        if(this.colossusQuakeWindup<=0)this.triggerColossusQuake();
      }else{
        this.colossusQuakeTimer-=dt;
        if(this.colossusQuakeTimer<=0&&time>2.2&&this.energy>8)this.beginColossusQuake();
      }
    }
    drawQuakeField(){
      if(!this.c?.juggernautEngine||this.out||this.burst)return;
      const charging=this.colossusQuakeWindup>0,pulse=clamp(this.colossusQuakePulse||0,0,1);
      if(!charging&&pulse<=0)return;
      const cx=W/2,cy=H/2;
      ctx.save();ctx.translate(cx,cy);ctx.globalCompositeOperation='screen';
      if(charging){
        const progress=1-clamp(this.colossusQuakeWindup/.82,0,1),ringR=outerR*(.92-progress*.54);
        ctx.strokeStyle=alpha(this.c.accent,.24+progress*.34);ctx.lineWidth=2+progress*3;ctx.shadowBlur=18;ctx.shadowColor=this.c.primary;
        ctx.setLineDash([10,7]);ctx.beginPath();ctx.arc(0,0,ringR,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        for(let i=0;i<10;i++){
          const a=this.colossusQuakeSeed+i*Math.PI*2/10;ctx.beginPath();ctx.moveTo(Math.cos(a)*outerR*.82,Math.sin(a)*outerR*.82);
          for(let s=1;s<=4;s++){
            const rr=outerR*(.82-s*.13),wob=Math.sin((i+1)*(s+2)*1.73)*outerR*.018;
            ctx.lineTo(Math.cos(a)*rr-Math.sin(a)*wob,Math.sin(a)*rr+Math.cos(a)*wob);
          }
          ctx.strokeStyle=alpha(i%2?this.c.primary:this.c.accent,.10+progress*.22);ctx.lineWidth=1.2+progress*1.2;ctx.stroke();
        }
      }
      if(pulse>0){
        const expand=1-pulse;
        for(let k=0;k<3;k++){
          const rr=outerR*clamp(expand*1.18-k*.12,0,1.05);
          ctx.strokeStyle=alpha(k===1?this.c.primary:this.c.accent,.10+pulse*.34);ctx.lineWidth=1.5+pulse*3.5;
          ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.stroke();
        }
        for(let i=0;i<14;i++){
          const a=this.colossusQuakeSeed+i*Math.PI*2/14;ctx.beginPath();ctx.moveTo(Math.cos(a)*outerR*.16,Math.sin(a)*outerR*.16);
          for(let s=1;s<=5;s++){
            const rr=outerR*(.16+s*.14),wob=Math.sin((i+2)*(s+1)*1.31)*outerR*.022;
            ctx.lineTo(Math.cos(a)*rr-Math.sin(a)*wob,Math.sin(a)*rr+Math.cos(a)*wob);
          }
          ctx.strokeStyle=alpha(i%3?this.c.primary:this.c.accent,.06+pulse*.24);ctx.lineWidth=1+pulse*2;ctx.stroke();
        }
      }
      ctx.restore();
    }
    draw(){
      this.drawQuakeField();
      super.draw();
      if(!this.c?.juggernautEngine||this.out||this.burst||this.colossusQuakeWindup<=0)return;
      const q=1-clamp(this.colossusQuakeWindup/.82,0,1);
      ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';ctx.strokeStyle=alpha('#fff1b0',.30+q*.42);ctx.lineWidth=2+q*2.5;ctx.shadowBlur=18;ctx.shadowColor=this.c.primary;
      for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,this.r*(1.55+i*.24-q*.16),0,Math.PI*2);ctx.stroke()}
      ctx.font=`1000 ${Math.max(10,this.r*.34)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff7dc';ctx.fillText('震',0,0);ctx.restore();
    }
  };

  document.documentElement.dataset.worldpressQuake='v1';
})();
