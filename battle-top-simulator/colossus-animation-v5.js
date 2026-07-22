/* Worldpress Colossus Physics FX V9: restrained leap, swept fronts, and counter-clockwise suction. */
(() => {
  const TAU=Math.PI*2;
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01=value=>clamp(Number(value)||0,0,1);

  function seeded(seed,index){
    const value=Math.sin(seed*12.9898+index*78.233)*43758.5453;
    return value-Math.floor(value);
  }

  function skillState(top){
    return String(top.colossusSkillState||'idle');
  }

  function anchorOf(top){
    const x=Number(top.quakeAnchorX??top.colossusLeapAnchorX??top.colossusJumpAnchorX);
    const y=Number(top.quakeAnchorY??top.colossusLeapAnchorY??top.colossusJumpAnchorY);
    return {x:Number.isFinite(x)?x:top.x,y:Number.isFinite(y)?y:top.y};
  }

  function bodyLift(top){
    return clamp01(top.colossusJumpHeight)*top.r;
  }

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

  function drawCompressionShadow(top,state,lift){
    if(state!=='quakeCrouch'&&state!=='quakeLeap')return;
    const anchor=anchorOf(top),crouch=state==='quakeCrouch'?clamp01(1-(Number(top.colossusQuakeWindup)||0)/.22):0;
    const airborne=state==='quakeLeap'?clamp01((Number(top.colossusJumpHeight)||0)/.74):0;
    const width=top.r*(1.02+crouch*.26-airborne*.23),height=top.r*(.25-crouch*.08-airborne*.07);
    ctx.save();
    try{
      ctx.translate(anchor.x,anchor.y+top.r*.18);
      ctx.globalCompositeOperation='source-over';
      const shade=ctx.createRadialGradient(0,0,0,0,0,width);
      shade.addColorStop(0,`rgba(8,7,12,${.25+crouch*.12-airborne*.09})`);
      shade.addColorStop(.58,`rgba(11,8,18,${.13+crouch*.08-airborne*.05})`);
      shade.addColorStop(1,'rgba(8,6,12,0)');
      ctx.fillStyle=shade;ctx.beginPath();ctx.ellipse(0,0,width,Math.max(2,height),0,0,TAU);ctx.fill();
    }finally{ctx.restore()}
  }

  function activeFronts(top){
    if(!Array.isArray(top.colossusShockwaves))return [];
    return top.colossusShockwaves.filter(front=>front&&front.age>=0&&(Number(front.radius)||0)>0).slice(0,3);
  }

  function drawShockFronts(top){
    const fronts=activeFronts(top);
    if(!fronts.length)return;
    ctx.save();
    try{
      ctx.globalCompositeOperation='screen';ctx.lineCap='round';
      for(const front of fronts){
        const radius=Math.max(0,Number(front.radius)||0),pulse=clamp01(front.pulse),index=clamp(Number(front.index)||0,0,2);
        const x=Number.isFinite(Number(front.x))?Number(front.x):top.x,y=Number.isFinite(Number(front.y))?Number(front.y):top.y;
        ctx.strokeStyle=alpha(index===2?'#fff0b2':index===1?top.c.accent:top.c.primary,.10+pulse*(.22+index*.035));
        ctx.lineWidth=1.5+index*.55+pulse*1.55;
        ctx.beginPath();ctx.arc(x,y,radius,0,TAU);ctx.stroke();
      }
    }finally{ctx.restore()}
  }

  function drawLandingMaterial(top,state){
    if(state!=='quakeWaves')return;
    const flash=clamp01(top.colossusQuakeFlash),pulse=clamp01(top.colossusQuakePulse);
    if(flash<=0&&pulse<=0)return;
    const x=Number.isFinite(Number(top.colossusWaveOriginX))?Number(top.colossusWaveOriginX):top.x;
    const y=Number.isFinite(Number(top.colossusWaveOriginY))?Number(top.colossusWaveOriginY):top.y;
    const seed=Number(top.colossusQuakeSeed)||0,material=Math.max(flash,pulse*.38);
    ctx.save();
    try{
      ctx.translate(x,y);ctx.globalCompositeOperation='screen';
      const bloomRadius=top.r*(1.08+(1-flash)*.65),bloom=ctx.createRadialGradient(0,0,top.r*.08,0,0,bloomRadius);
      bloom.addColorStop(0,alpha('#fff4c9',.08+material*.20));
      bloom.addColorStop(.38,alpha(top.c.accent,.04+material*.11));
      bloom.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=bloom;ctx.beginPath();ctx.arc(0,0,bloomRadius,0,TAU);ctx.fill();
      for(let i=0;i<(reduceMotion?0:3);i++){
        const angle=seed+i*TAU/3+(seeded(seed,i)-.5)*.38;
        const distance=top.r*(.72+(1-flash)*(.58+.20*seeded(seed,i+4)));
        const size=top.r*(.13+.055*seeded(seed,i+8))*material;
        ctx.save();
        try{
          ctx.translate(Math.cos(angle)*distance,Math.sin(angle)*distance);ctx.rotate(angle+(1-flash)*(i%2?-.55:.55));
          ctx.fillStyle=alpha(i===1?top.c.primary:top.c.accent,.06+material*.22);
          ctx.beginPath();ctx.moveTo(-size,-size*.36);ctx.lineTo(size*.62,-size*.54);ctx.lineTo(size,size*.18);ctx.lineTo(-size*.45,size*.52);ctx.closePath();ctx.fill();
        }finally{ctx.restore()}
      }
    }finally{ctx.restore()}
  }

  function spiralBand(top,radius,phase,offset,strength){
    const left=[],right=[],samples=13;
    let endAngle=phase+offset;
    for(let i=0;i<samples;i++){
      const t=i/(samples-1),angle=phase+offset-t*1.52,radial=radius*(.84-t*.57);
      const x=Math.cos(angle)*radial,y=Math.sin(angle)*radial;
      const dr=-radius*.57,dAngle=-1.52;
      const dx=Math.cos(angle)*dr-Math.sin(angle)*radial*dAngle;
      const dy=Math.sin(angle)*dr+Math.cos(angle)*radial*dAngle;
      const length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,width=top.r*(.19+.10*strength)*(1-t*.28);
      left.push([x+nx*width,y+ny*width]);right.push([x-nx*width,y-ny*width]);
      endAngle=angle;
    }
    const end=left.length-1,centerX=(left[end][0]+right[end][0])*.5,centerY=(left[end][1]+right[end][1])*.5;
    const tangentX=Math.sin(endAngle),tangentY=-Math.cos(endAngle),tip=top.r*(.43+.13*strength);
    ctx.beginPath();ctx.moveTo(left[0][0],left[0][1]);
    for(let i=1;i<left.length;i++)ctx.lineTo(left[i][0],left[i][1]);
    ctx.lineTo(centerX+tangentX*tip,centerY+tangentY*tip);
    for(let i=right.length-1;i>=0;i--)ctx.lineTo(right[i][0],right[i][1]);
    ctx.closePath();ctx.fill();
  }

  function drawVortex(top,state){
    if(!['vortexWindup','vortexActive','vortexRecovery'].includes(state))return;
    const strength=clamp01(Math.max(Number(top.colossusVortexStrength)||0,Number(top.colossusVortexPulse)||0));
    if(strength<=.01)return;
    const radius=Math.max(top.r*2.4,Number(top.colossusVortexRadius)||top.r*4.8),phase=Number(top.colossusVortexPhase)||0;
    ctx.save();
    try{
      ctx.translate(top.x,top.y);ctx.globalCompositeOperation='source-over';
      const pressure=ctx.createRadialGradient(0,0,top.r*.15,0,0,radius);
      pressure.addColorStop(0,`rgba(23,13,38,${.18*strength})`);
      pressure.addColorStop(.34,`rgba(36,21,58,${.10*strength})`);
      pressure.addColorStop(1,'rgba(18,10,30,0)');
      ctx.fillStyle=pressure;ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.fill();
      ctx.globalCompositeOperation='screen';
      ctx.fillStyle=alpha(top.c.primary,.035+strength*.11);spiralBand(top,radius,phase,0,strength);
      if(!reduceMotion){
        ctx.fillStyle=alpha(top.c.accent,.028+strength*.095);spiralBand(top,radius,phase,Math.PI,strength);
        const dustAngle=phase+.72,dustRadius=radius*(.48+.12*Math.sin(phase*.7));
        ctx.fillStyle=alpha('#efe8ff',.035+strength*.14);ctx.beginPath();
        ctx.ellipse(Math.cos(dustAngle)*dustRadius,Math.sin(dustAngle)*dustRadius,top.r*(.10+.07*strength),top.r*.055,dustAngle-.75,0,TAU);ctx.fill();
      }
    }finally{ctx.restore()}
  }

  function drawBodyCue(top,state,lift){
    const crouch=state==='quakeCrouch'?clamp01(1-(Number(top.colossusQuakeWindup)||0)/.22):0;
    const leap=state==='quakeLeap'?clamp01((Number(top.colossusJumpHeight)||0)/.74):0;
    const landing=state==='quakeWaves'?Math.max(clamp01(top.colossusQuakeFlash),clamp01(top.colossusQuakePulse)*.35):0;
    const vortex=['vortexWindup','vortexActive','vortexRecovery'].includes(state)?clamp01(Math.max(Number(top.colossusVortexStrength)||0,Number(top.colossusVortexPulse)||0)):0;
    if(reduceMotion&&vortex)return;
    const force=Math.max(crouch,leap,landing,vortex);if(force<=.01)return;
    ctx.save();
    try{
      ctx.translate(top.x,top.y-lift);ctx.globalCompositeOperation='screen';
      const cue=ctx.createRadialGradient(0,0,top.r*.04,0,0,top.r*(.76+.12*force));
      cue.addColorStop(0,alpha('#fff7d7',.035+force*.12));cue.addColorStop(.52,alpha(vortex?top.c.primary:top.c.accent,.025+force*.075));cue.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=cue;ctx.beginPath();ctx.ellipse(0,0,top.r*(.76+.12*force),top.r*(.30+.04*force),0,0,TAU);ctx.fill();
    }finally{ctx.restore()}
  }

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    drawModel(speed){
      const isColossus=!!this.c?.juggernautEngine&&!this.out&&!this.burst,lift=isColossus?bodyLift(this):0;
      if(lift<=0)return super.drawModel(speed);
      const scale=1+clamp01((Number(this.colossusJumpHeight)||0)/.74)*.02;
      const previousLiftFlag=this.colossusSelfModelLift;this.colossusSelfModelLift=true;
      try{drawRaisedModel(this,lift,scale,()=>super.drawModel(speed))}finally{this.colossusSelfModelLift=previousLiftFlag}
    }
    draw(){
      const isColossus=!!this.c?.juggernautEngine&&!this.out&&!this.burst;
      if(!isColossus){super.draw();return}
      const state=skillState(this),lift=bodyLift(this);
      const engaged=state!=='idle'&&(state!=='quakeRecovery'||lift>0);
      if(!engaged){super.draw();return}

      drawCompressionShadow(this,state,lift);
      drawShockFronts(this);
      drawLandingMaterial(this,state);
      drawVortex(this,state);

      super.draw();

      drawBodyCue(this,state,lift);
    }
  };

  document.documentElement.dataset.colossusFx='physics-v9';
})();
