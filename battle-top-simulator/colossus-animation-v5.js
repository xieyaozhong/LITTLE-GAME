/* Worldpress Colossus FX V5 — tectonic anchors, collapsing plates, and segmented shock fronts. */
(() => {
  const easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);

  function polygonPath(sides,r,rotation=0){
    ctx.beginPath();
    for(let i=0;i<sides;i++){
      const a=rotation+i*Math.PI*2/sides,x=Math.cos(a)*r,y=Math.sin(a)*r;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();
  }

  function segmentedPlate(sides,r,rotation,color,opacity,width){
    ctx.strokeStyle=alpha(color,opacity);ctx.lineWidth=width;
    for(let i=0;i<sides;i++){
      const a=rotation+i*Math.PI*2/sides,b=rotation+(i+1)*Math.PI*2/sides;
      const inset=.09;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a+inset)*r,Math.sin(a+inset)*r);
      ctx.lineTo(Math.cos(b-inset)*r,Math.sin(b-inset)*r);
      ctx.stroke();
    }
  }

  function drawAnchor(angle,radius,size,color,power){
    ctx.save();ctx.rotate(angle);ctx.translate(radius,0);ctx.rotate(Math.PI/2);
    ctx.fillStyle=alpha(color,.035+power*.10);ctx.strokeStyle=alpha(color,.22+power*.50);ctx.lineWidth=1.1+power*2;ctx.shadowBlur=10+power*14;ctx.shadowColor=color;
    ctx.beginPath();ctx.moveTo(-size*.46,-size*.26);ctx.lineTo(-size*.18,-size*.52);ctx.lineTo(size*.42,-size*.34);ctx.lineTo(size*.58,0);ctx.lineTo(size*.42,size*.34);ctx.lineTo(-size*.18,size*.52);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-size*.10,-size*.26);ctx.lineTo(size*.32,0);ctx.lineTo(-size*.10,size*.26);ctx.stroke();ctx.restore();
  }

  function drawFaults(top,strength,reach){
    if(strength<=0)return;
    const rotation=top.colossusQuakeSeed||0;
    ctx.save();ctx.translate(W/2,H/2);ctx.globalCompositeOperation='screen';ctx.lineCap='round';
    for(let i=0;i<10;i++){
      const a=rotation+i*Math.PI/5,start=outerR*.13,end=outerR*(.30+reach*.64);
      ctx.beginPath();ctx.moveTo(Math.cos(a)*start,Math.sin(a)*start);
      for(let p=1;p<=4;p++){
        const t=p/4,rr=start+(end-start)*t,wob=Math.sin((i+1)*(p+2)*2.17+rotation)*outerR*(.012+.012*t);
        ctx.lineTo(Math.cos(a)*rr-Math.sin(a)*wob,Math.sin(a)*rr+Math.cos(a)*wob);
      }
      ctx.strokeStyle=alpha(i%3===0?'#fff0b0':i%2?top.c.primary:top.c.accent,.08+strength*.34);ctx.lineWidth=.8+strength*2.4;ctx.shadowBlur=8+strength*15;ctx.shadowColor=i%2?top.c.primary:top.c.accent;ctx.stroke();
    }
    ctx.restore();
  }

  function drawTectonicField(top,windup,pulse,aftershock,flashPulse){
    const charging=windup>0,progress=charging?1-clamp(windup/1.06,0,1):0,impact=1-pulse;
    const cx=W/2,cy=H/2,rotation=top.colossusQuakeSeed||0;
    ctx.save();ctx.translate(cx,cy);ctx.globalCompositeOperation='screen';ctx.lineJoin='round';

    if(charging){
      const gravity=ctx.createRadialGradient(0,0,outerR*.04,0,0,outerR*1.05);
      gravity.addColorStop(0,alpha(top.c.secondary,.17+progress*.16));gravity.addColorStop(.45,alpha(top.c.primary,.035+progress*.07));gravity.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gravity;ctx.beginPath();ctx.arc(0,0,outerR*1.05,0,Math.PI*2);ctx.fill();

      for(let layer=0;layer<3;layer++){
        const phase=clamp(progress-layer*.10,0,1),radius=outerR*(.91-phase*(.20+layer*.035));
        segmentedPlate(8,radius,rotation+layer*Math.PI/8,layer===1?'#fff0b0':layer===2?top.c.primary:top.c.accent,.10+phase*.42,1.2+phase*3.2);
      }
      for(let i=0;i<4;i++)drawAnchor(rotation+i*Math.PI/2,outerR*(.78-progress*.12),outerR*.105,top.c.accent,progress);
    }

    if(pulse>0){
      for(let layer=0;layer<3;layer++){
        const local=clamp(impact-layer*.10,0,1);if(local<=0)continue;
        const radius=outerR*(.12+easeOut(local)*(.94+layer*.035));
        segmentedPlate(8,radius,rotation+layer*Math.PI/8,layer===0?'#fff8d8':layer===1?top.c.accent:top.c.primary,.11+pulse*(.50-layer*.07),1.4+pulse*(5.4-layer*.8));
      }
      for(let i=0;i<12;i++){
        const a=rotation+i*Math.PI/6,local=clamp(impact-(i%3)*.035,0,1),rr=outerR*(.18+easeOut(local)*.68),size=outerR*(.022+pulse*.018);
        ctx.save();ctx.rotate(a);ctx.translate(rr,0);ctx.rotate(a+Math.PI/4);ctx.fillStyle=alpha(i%2?top.c.primary:top.c.accent,.05+pulse*.16);ctx.strokeStyle=alpha(i%3===0?'#fff0b4':top.c.accent,.12+pulse*.34);ctx.lineWidth=1+pulse*1.8;polygonPath(4,size);ctx.fill();ctx.stroke();ctx.restore();
      }
    }

    if(aftershock>0){
      const travel=1-aftershock;
      ctx.lineCap='round';
      for(let i=0;i<4;i++){
        const radius=outerR*(.28+travel*.64+i*.012);ctx.strokeStyle=alpha(i%2?top.c.primary:'#ffe8a0',aftershock*.20);ctx.lineWidth=1+aftershock*2.2;
        ctx.beginPath();ctx.arc(0,0,radius,rotation+i*Math.PI/2+.12,rotation+i*Math.PI/2+1.08);ctx.stroke();
      }
    }
    if(flashPulse>0){
      ctx.fillStyle=alpha('#fff4c8',flashPulse*.11);polygonPath(8,outerR*(.18+(1-flashPulse)*.18),rotation);ctx.fill();
    }
    ctx.restore();
    drawFaults(top,Math.max(progress*.58,pulse),pulse>0?1:progress*.48);

    if(charging){
      ctx.save();ctx.translate(top.x,top.y);ctx.globalCompositeOperation='screen';ctx.rotate(rotation-time*.16);
      ctx.strokeStyle=alpha('#fff0b0',.22+progress*.56);ctx.lineWidth=1.2+progress*2.8;ctx.shadowBlur=14+progress*22;ctx.shadowColor=top.c.primary;
      for(let i=0;i<4;i++){
        const a=i*Math.PI/2;ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(top.r*.72,-top.r*.34);ctx.lineTo(top.r*(1.42-progress*.20),-top.r*.18);ctx.lineTo(top.r*(1.42-progress*.20),top.r*.18);ctx.lineTo(top.r*.72,top.r*.34);ctx.stroke();ctx.restore();
      }
      segmentedPlate(8,top.r*(1.28-progress*.12),0,top.c.accent,.22+progress*.48,1.2+progress*2.6);ctx.restore();
    }
  }

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    draw(){
      const isColossus=!!this.c?.juggernautEngine&&!this.out&&!this.burst;
      const windup=this.colossusQuakeWindup||0,pulse=clamp(this.colossusQuakePulse||0,0,1),aftershock=clamp(this.colossusQuakeAftershock||0,0,1),flashPulse=clamp(this.colossusQuakeFlash||0,0,1);
      const engaged=isColossus&&(windup>0||pulse>0||aftershock>0||flashPulse>0);
      if(!engaged){super.draw();return}

      const pressure=this.colossusPressurePulse||0;
      this.colossusQuakeWindup=0;this.colossusQuakePulse=0;this.colossusQuakeAftershock=0;this.colossusQuakeFlash=0;this.colossusPressurePulse=0;
      try{super.draw()}finally{
        this.colossusQuakeWindup=windup;this.colossusQuakePulse=pulse;this.colossusQuakeAftershock=aftershock;this.colossusQuakeFlash=flashPulse;this.colossusPressurePulse=pressure;
      }
      drawTectonicField(this,windup,pulse,aftershock,flashPulse);
    }
  };

  document.documentElement.dataset.colossusFx='tectonic-v5';
})();
