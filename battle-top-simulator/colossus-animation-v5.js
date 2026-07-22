/* Worldpress Colossus Physics FX V8 — restrained, mass-driven ground response. */
(() => {
  const TAU=Math.PI*2;
  const easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);

  function massScale(top){
    const physical=Number(top.mass);
    if(Number.isFinite(physical)&&physical>0)return clamp(Math.sqrt(physical/1.9),.82,1.42);
    return clamp(.76+(Number(top.c?.w)||80)/250,.86,1.34);
  }

  function seeded(seed,index){
    return Math.sin(seed*1.731+index*12.9898)*.5+.5;
  }

  function anchorBlock(angle,radius,size,color,opacity){
    ctx.save();
    try{
      ctx.rotate(angle);ctx.translate(radius,0);
      ctx.fillStyle=alpha(color,opacity);
      ctx.beginPath();
      ctx.moveTo(-size*.58,-size*.30);
      ctx.lineTo(size*.24,-size*.42);
      ctx.lineTo(size*.55,-size*.20);
      ctx.lineTo(size*.55,size*.20);
      ctx.lineTo(size*.24,size*.42);
      ctx.lineTo(-size*.58,size*.30);
      ctx.closePath();ctx.fill();
    }finally{ctx.restore()}
  }

  function compressionEllipse(top,progress,pulse,flashPulse,scale){
    const force=Math.max(progress,pulse*.72,flashPulse),base=outerR*(.14+progress*.07+pulse*.035)*scale;
    if(force<=0)return;
    const glow=ctx.createRadialGradient(0,0,top.r*.18,0,0,base);
    glow.addColorStop(0,alpha('#fff3c4',.035+flashPulse*.15+force*.035));
    glow.addColorStop(.34,alpha(top.c.accent,.06+force*.10));
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;
    ctx.beginPath();ctx.ellipse(0,top.r*.20,base,base*(.28-progress*.055),0,0,TAU);ctx.fill();
  }

  function impactFront(top,pulse,seed,scale){
    if(pulse<=0)return;
    const travel=1-pulse,reach=outerR*(.10+easeOut(travel)*.72)*scale;
    ctx.strokeStyle=alpha('#fff0b0',pulse*(.18+.18*scale));
    ctx.lineWidth=1.4+pulse*2.4*scale;ctx.lineCap='round';
    ctx.beginPath();ctx.ellipse(0,0,reach,reach*(.56+.04*scale),seed*.11,0,TAU);ctx.stroke();
  }

  function impactDebris(top,pulse,seed,scale){
    if(pulse<=0)return;
    const travel=1-pulse;
    for(let i=0;i<5;i++){
      const drift=(seeded(seed,i)-.5)*.22,a=seed+i*TAU/5+drift;
      const delay=i*.018,local=clamp(travel-delay,0,1),radius=outerR*(.10+easeOut(local)*(.47+.08*seeded(seed,i+7)))*scale;
      const size=outerR*(.015+.008*seeded(seed,i+13))*scale*(.72+pulse*.28);
      ctx.save();
      try{
        ctx.rotate(a);ctx.translate(radius,0);ctx.rotate(a*.37+local*1.4*(i%2?1:-1));
        ctx.fillStyle=alpha(i%2?top.c.primary:top.c.accent,pulse*(.13+.16*scale));
        ctx.beginPath();ctx.moveTo(-size*.72,-size*.36);ctx.lineTo(size*.54,-size*.50);ctx.lineTo(size*.82,size*.18);ctx.lineTo(-size*.35,size*.56);ctx.closePath();ctx.fill();
      }finally{ctx.restore()}
    }
  }

  function impactCracks(top,pulse,seed,scale){
    if(pulse<=0)return;
    const travel=1-pulse,start=top.r*.82,end=outerR*(.13+easeOut(travel)*.25)*scale;
    ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=1.6+pulse*2.6*scale;
    for(let i=0;i<3;i++){
      const a=seed+i*TAU/3+(seeded(seed,i+21)-.5)*.26;
      const bend=(seeded(seed,i+27)-.5)*outerR*.032;
      const mid=start+(end-start)*.54;
      ctx.strokeStyle=alpha(i===0?'#fff1bd':i===1?top.c.accent:top.c.primary,pulse*(.14+.14*scale));
      ctx.beginPath();ctx.moveTo(Math.cos(a)*start,Math.sin(a)*start);
      ctx.lineTo(Math.cos(a)*mid-Math.sin(a)*bend,Math.sin(a)*mid+Math.cos(a)*bend);
      ctx.lineTo(Math.cos(a)*end+Math.sin(a)*bend*.35,Math.sin(a)*end-Math.cos(a)*bend*.35);ctx.stroke();
    }
  }

  function aftershockFront(top,aftershock,seed,scale){
    if(aftershock<=0)return;
    const travel=1-aftershock,reach=outerR*(.22+easeOut(travel)*.64)*scale;
    ctx.strokeStyle=alpha(top.c.primary,aftershock*.13);ctx.lineWidth=1+aftershock*1.4*scale;
    ctx.beginPath();ctx.ellipse(0,0,reach,reach*.58,seed*.11,0,TAU);ctx.stroke();
  }

  function drawGround(top,windup,pulse,aftershock,flashPulse){
    const charging=windup>0,progress=charging?1-clamp(windup/1.06,0,1):0,scale=massScale(top),seed=Number(top.colossusQuakeSeed)||0;
    ctx.save();
    try{
      ctx.translate(top.x,top.y);ctx.globalCompositeOperation='screen';
      compressionEllipse(top,progress,pulse,flashPulse,scale);
      if(charging){
        const radius=outerR*(.38-progress*.15)*scale,size=outerR*(.055+progress*.012)*scale;
        for(let i=0;i<4;i++)anchorBlock(seed+i*Math.PI/2,radius,size,i%2?top.c.primary:top.c.accent,.10+progress*.25);
      }
      impactFront(top,pulse,seed,scale);
      impactDebris(top,pulse,seed,scale);
      impactCracks(top,pulse,seed,scale);
      aftershockFront(top,aftershock,seed,scale);
    }finally{ctx.restore()}
  }

  function drawBodyCue(top,windup,pulse,flashPulse){
    const charging=windup>0,progress=charging?1-clamp(windup/1.06,0,1):0,force=Math.max(progress,pulse*.68,flashPulse*.8);
    if(force<=0)return;
    const scale=massScale(top),seed=Number(top.colossusQuakeSeed)||0,r=top.r;
    ctx.save();
    try{
      ctx.translate(top.x,top.y);ctx.globalCompositeOperation='screen';
      ctx.fillStyle=alpha(top.c.secondary,.06+force*.13);
      ctx.beginPath();ctx.ellipse(0,r*.42,r*(1.20+.18*scale),r*(.22+.035*scale),0,0,TAU);ctx.fill();
      const radius=r*(1.13-force*.12),size=r*(.31+.035*scale);
      for(let i=0;i<4;i++)anchorBlock(seed+i*Math.PI/2,radius,size,i%2?top.c.primary:'#fff0b0',.12+force*.34);
    }finally{ctx.restore()}
  }

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    draw(){
      const isColossus=!!this.c?.juggernautEngine&&!this.out&&!this.burst;
      const windup=Math.max(0,Number(this.colossusQuakeWindup)||0);
      const pulse=clamp(Number(this.colossusQuakePulse)||0,0,1);
      const aftershock=clamp(Number(this.colossusQuakeAftershock)||0,0,1);
      const flashPulse=clamp(Number(this.colossusQuakeFlash)||0,0,1);
      const engaged=isColossus&&(windup>0||pulse>0||aftershock>0||flashPulse>0);
      if(!engaged){super.draw();return}

      const pressure=this.colossusPressurePulse||0;
      this.colossusQuakeWindup=0;this.colossusQuakePulse=0;this.colossusQuakeAftershock=0;this.colossusQuakeFlash=0;this.colossusPressurePulse=0;
      try{
        drawGround(this,windup,pulse,aftershock,flashPulse);
        super.draw();
        drawBodyCue(this,windup,pulse,flashPulse);
      }finally{
        this.colossusQuakeWindup=windup;this.colossusQuakePulse=pulse;this.colossusQuakeAftershock=aftershock;this.colossusQuakeFlash=flashPulse;this.colossusPressurePulse=pressure;
      }
    }
  };

  document.documentElement.dataset.colossusFx='physics-v8';
})();
