/* Skill FX V4 — signature motifs, activation bursts, and relay-bond resonance. */
(() => {
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skillBursts=[];
  const arena=document.querySelector('.arena');

  const PROFILES={
    twin:{label:'雙生星核',mark:'星',color:'#9d83ff'},
    sky:{label:'天墜獵鷹',mark:'翼',color:'#61e5ff'},
    phase:{label:'幻霧變色龍',mark:'幻',color:'#72f6df'},
    charm:{label:'魅月海妖',mark:'潮',color:'#ff72d0'},
    rage:{label:'血怒狂戰士',mark:'怒',color:'#ff5c48'},
    morph:{label:'萬相觀測者',mark:'觀',color:'#ac88ff'},
    taiji:{label:'太極玄輪',mark:'極',color:'#71eac4'},
    sword:{label:'七曜劍皇',mark:'劍',color:'#9be4ff'},
    chrono:{label:'時界鐘皇',mark:'時',color:'#79e8ff'},
    colossus:{label:'鎮界巨神',mark:'震',color:'#a98bff'},
    breaker:{label:'弒杖獠牙',mark:'破',color:'#ff4967'},
    wooden:{label:'傳統木陀螺',mark:'木',color:'#e1af72'}
  };
  const MORPH_NAMES={scan:'萬相掃描',swift:'疾風獵形',aegis:'玄甲反擊形',viper:'毒牙連段形',reaper:'斷星重擊形'};
  const SKY_NAMES={climb:'風翼攀升',orbit:'高空盤旋',air:'天墜俯衝',direct:'假起飛突擊'};
  const RAGE_NAMES={hunt:'血路追獵',smashCharge:'重怒蓄勢',smashRush:'血怒重砸'};
  const CHRONO_NAMES={charge:'零時蓄積',stop:'零時領域',releaseCharge:'秒針回歸',releaseRush:'秒針破界'};

  function active(top){return !!top&&!top.out&&!top.burst&&!top.skyStaminaDefeated&&!top.skyEnergyDepletedLatch&&(top.energy||0)>0}
  function kindOf(top){
    const c=top?.c||{};
    if(c.splitTop||top?.splitPart==='α'||top?.splitPart==='β'||c.shape==='twinNova'||c.shape==='twinNovaChild')return 'twin';
    if(c.skyPouncer)return 'sky';
    if(c.phaseCloak)return 'phase';
    if(c.charmAura||c.charmEngine)return 'charm';
    if(c.rageEngine)return 'rage';
    if(c.adaptiveMorph)return 'morph';
    if(c.taijiV2||c.taijiWheel||c.taijiMystic)return 'taiji';
    if(c.sevenSword)return 'sword';
    if(c.timeStopEngine)return 'chrono';
    if(c.juggernautEngine||c.relayDoubleSlot)return 'colossus';
    if(c.counterTarget==='wizardRod')return 'breaker';
    if(c.counterTarget==='customTop'||c.shape==='wooden')return 'wooden';
    return '';
  }
  function profile(top,kind=kindOf(top)){
    const base=PROFILES[kind]||{label:top?.c?.name||'技能',mark:'技',color:top?.c?.primary||'#8fe8ff'};
    return {...base,color:top?.c?.primary||base.color};
  }
  function stateOf(top,kind=kindOf(top)){
    if(!top||!kind)return 'idle';
    if(kind==='twin'){
      if(top.twinCharmBetrayal)return `betrayal:${top.splitPart||'core'}`;
      if(top.twinInheritanceMode)return `inheritance:${top.twinInheritanceMode}`;
      return top.splitPart?`fragment:${top.splitPart}`:top.hasSplit?'split':'idle';
    }
    if(kind==='sky')return top.skyJumpState||'idle';
    if(kind==='phase')return top.phaseInvisible?'phase':'idle';
    if(kind==='charm')return top.charmedBy?'controlled':(top.charmCount||0)>0?`cast:${top.charmCount}`:'idle';
    if(kind==='rage')return top.rageSkillState&&top.rageSkillState!=='idle'?top.rageSkillState:'idle';
    if(kind==='morph')return top.morphMode||'idle';
    if(kind==='taiji')return top.taijiMode||'idle';
    if(kind==='sword')return top.swordState&&top.swordState!=='idle'?`${top.swordArt||'art'}:${top.swordState}`:'idle';
    if(kind==='chrono')return top.timeFrozenBy?'frozen':top.chronoState||'idle';
    if(kind==='colossus'){
      const state=top.colossusSkillState||'idle';
      if(state!=='idle')return state;
      if((top.colossusQuakeWindup||0)>0)return 'quakeCrouch';
      if((top.colossusQuakePulse||0)>.03)return 'quakeWaves';
      if(top.colossusVortexActive||(top.colossusVortexPulse||0)>.03)return 'vortexActive';
      return 'idle';
    }
    if(kind==='breaker')return `hits:${top.counterHits||0}`;
    if(kind==='wooden')return (top.woodAuraCooldown||0)>.42?'aura':'idle';
    return 'idle';
  }
  function skillLabel(top,kind,state){
    if(kind==='twin'){
      if(state==='inheritance:guardian')return 'α・恆星守核';
      if(state==='inheritance:hunter')return 'β・彗星獵核';
      if(state.startsWith('betrayal'))return '月蝕叛核';
      return state.startsWith('fragment')?'星核裂變':'一體雙生';
    }
    if(kind==='sky')return SKY_NAMES[state]||'風翼迴旋';
    if(kind==='phase')return state==='phase'?'幻霧相位':'幻霧回歸';
    if(kind==='charm')return state==='controlled'?'魅惑封印':'月歌魅惑';
    if(kind==='rage')return RAGE_NAMES[state]||`血怒階段 ${top.rageStageSeen||1}`;
    if(kind==='morph')return MORPH_NAMES[state]||'萬相變形';
    if(kind==='taiji')return state==='yang'?'陽・借力發勁':'陰・化勁納氣';
    if(kind==='sword')return top.swordArtName||'七式劍譜';
    if(kind==='chrono')return state==='frozen'?'時間凍結':CHRONO_NAMES[state]||'時刻重整';
    if(kind==='colossus')return state==='windup'?'鎮界蓄震':'鎮界震撼';
    if(kind==='breaker')return '破杖獠擊';
    if(kind==='wooden')return '古木定軸';
    return profile(top,kind).label;
  }

  function emitSkillEvent(top,detail){
    window.dispatchEvent(new CustomEvent('arena-skill-activation',{detail:{...detail,owner:top?.c?.name||'陀螺'}}));
  }
  function motionOf(top){
    const vx=Number(top?.vx)||0,vy=Number(top?.vy)||0,speed=mag(vx,vy),spin=Number(top?.omega??top?.spin)||0;
    return {vx,vy,speed,angle:speed>1?Math.atan2(vy,vx):(Number(top?.angle)||0),spin,dir:Math.sign(spin)||1,spinPower:clamp(Math.abs(spin)/48,0,1),mass:clamp((top?.c?.w||70)/100,.42,1.2),energy:clamp(Number(top?.energy)||0,0,100),lift:clamp(Number(top?.lift??top?.skyJumpHeight)||0,0,1.75)};
  }
  function triggerSkill(top,kind,label,{bond=false,color='',mark='',strength=1}={}){
    if(!active(top)&&!top?.splitPart)return;
    const p=profile(top,kind),fxColor=color||p.color,fxMark=mark||p.mark,motion=motionOf(top);
    const team=top.teamIndex??(top.index?1:0),state=stateOf(top,kind);
    const physics={kind,state,phase:'release',x:top.x,y:top.y,vx:motion.vx,vy:motion.vy,speed:motion.speed,angle:motion.angle,omega:motion.spin,spinSign:motion.dir,mass:motion.mass,energy:motion.energy,lift:motion.lift,strength,bond};
    if(kind==='colossus'){
      window.dispatchEvent(new CustomEvent('arena-skill-physics',{detail:{...physics,owner:top?.c?.name||'top'}}));
      return;
    }
    skillBursts.push({
      x:top.x,y:top.y,life:1,color:fxColor,secondary:top?.c?.accent||top?.c?.secondary||'#ffffff',
      label,mark:fxMark,kind,state,bond,strength,team,angle:motion.angle,radius:top.r||18,
      vx:motion.vx,vy:motion.vy,speed:motion.speed,spinSign:motion.dir,spinRate:motion.spinPower,mass:motion.mass,
      seed:((top.index||0)+1)*1.731+time*.37
    });
    if(skillBursts.length>6)skillBursts.shift();
    const forceful=kind==='rage'||kind==='breaker'||kind==='wooden'||kind==='sky';
    const cameraImpulse=(forceful ? .85 : .12)*strength*motion.mass*(.55+clamp(motion.speed/260,0,.75));
    shake=Math.max(shake,bond?1.6:cameraImpulse);
    flash=Math.max(flash,bond ? .035 : forceful ? .018 : .008);
    emitSkillEvent(top,{label,color:fxColor,mark:fxMark,bond,kind,angle:motion.angle});
    window.dispatchEvent(new CustomEvent('arena-skill-physics',{detail:{...physics,owner:top?.c?.name||'top'}}));
  }

  function drawStar(x,y,r,points=4){
    ctx.beginPath();
    for(let i=0;i<points*2;i++){
      const a=-Math.PI/2+i*Math.PI/points,rr=i%2?r:r*.34;
      const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;
      i?ctx.lineTo(px,py):ctx.moveTo(px,py);
    }
    ctx.closePath();
  }
  function polygon(sides,r,rotation=0){
    ctx.beginPath();
    for(let i=0;i<sides;i++){
      const a=rotation+i*Math.PI*2/sides,x=Math.cos(a)*r,y=Math.sin(a)*r;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();
  }
  function bladeShape(length,width){
    ctx.beginPath();ctx.moveTo(0,-width*.32);ctx.lineTo(length*.74,-width*.5);ctx.lineTo(length,0);ctx.lineTo(length*.74,width*.5);ctx.lineTo(0,width*.32);ctx.closePath();
  }

  function fillGlow(color,r,opacity=.2){
    const glow=ctx.createRadialGradient(0,0,0,0,0,r);glow.addColorStop(0,alpha('#ffffff',opacity*.65));glow.addColorStop(.25,alpha(color,opacity));glow.addColorStop(1,alpha(color,0));
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
  }
  function drawCoreNode(x,y,r,color,power=1){
    ctx.save();ctx.translate(x,y);ctx.shadowColor=color;ctx.shadowBlur=6+power*8;ctx.fillStyle=alpha(color,.24+power*.28);drawStar(0,0,r,6);ctx.fill();ctx.fillStyle=alpha('#ffffff',.36+power*.42);ctx.beginPath();ctx.arc(0,0,r*.18,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawCrescent(r,color,opacity=1){
    ctx.fillStyle=alpha(color,.12+opacity*.32);ctx.beginPath();ctx.arc(-r*.10,0,r,-1.22,1.22);ctx.arc(r*.26,0,r*.72,1.22,-1.22,true);ctx.closePath();ctx.fill();
  }
  function drawWake(length,width,color,opacity){
    ctx.fillStyle=alpha(color,opacity);ctx.beginPath();ctx.moveTo(-length*.18,-width*.46);ctx.lineTo(-length,0);ctx.lineTo(-length*.18,width*.46);ctx.closePath();ctx.fill();
  }
  function drawWing(length,width,side,color,opacity){
    ctx.fillStyle=alpha(color,opacity);ctx.beginPath();ctx.moveTo(-length*.12,side*width*.08);ctx.quadraticCurveTo(length*.30,side*width,length,side*width*.20);ctx.quadraticCurveTo(length*.35,side*width*.42,-length*.12,side*width*.08);ctx.closePath();ctx.fill();
  }

  function drawTwin(top,pulse){
    const r=top.r,m=motionOf(top),primary=top.c.primary||'#39dcff',secondary=top.c.secondary||'#9c67ff';
    const combined=!top.splitPart,guardian=top.twinInheritanceMode==='guardian',hunter=top.twinInheritanceMode==='hunter',betrayal=!!top.twinCharmBetrayal;
    const charge=combined?clamp(Math.max((top.lastEnemyImpact||0)/86,(top.burstMeter||0)/34),0,1):1,phase=(top.angle||0)*.18*m.dir;
    ctx.rotate(phase);fillGlow(primary,r*(1.15+charge*.18),.07+charge*.05);
    if(combined){
      const separation=r*(.38+charge*.16);ctx.strokeStyle=alpha('#ffffff',.16+charge*.30);ctx.lineWidth=.8+charge*.8;ctx.beginPath();ctx.moveTo(-separation,0);ctx.lineTo(separation,0);ctx.stroke();
      drawCoreNode(-separation,0,r*.28,primary,.55+charge*.35);drawCoreNode(separation,0,r*.28,secondary,.55+charge*.35);
      if(charge>.36){ctx.strokeStyle=alpha(secondary,.12+charge*.24);ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,r*(1.10+charge*.16),r*.42,0,0,Math.PI*2);ctx.stroke()}
    }else{
      const coreColor=betrayal?'#ff65d2':top.splitPart==='α'?primary:secondary;drawCoreNode(0,0,r*.38,coreColor,.8);
      if(guardian){ctx.fillStyle=alpha(coreColor,.10+pulse*.10);polygon(6,r*1.36,Math.PI/6-phase*.2);ctx.fill();ctx.strokeStyle=alpha(coreColor,.28+pulse*.24);ctx.lineWidth=1.2;ctx.stroke()}
      if(hunter){ctx.save();ctx.rotate(m.angle-phase);ctx.fillStyle=alpha(coreColor,.24+pulse*.24);bladeShape(r*1.62,r*.34);ctx.fill();ctx.restore()}
      if(betrayal){ctx.save();ctx.rotate(-phase*1.8);drawCrescent(r*1.24,'#ff66cf',.88);ctx.fillStyle=alpha('#ffffff',.36);ctx.fillRect(-r*.08,-r*1.12,r*.16,r*.42);ctx.restore()}
    }
  }
  function drawSky(top,pulse){
    const r=top.r,m=motionOf(top),height=clamp(top.skyJumpHeight||0,0,1.75),state=top.skyJumpState||'idle',lift=clamp(height/1.35,0,1);
    ctx.rotate(m.angle);fillGlow(top.c.primary,r*(1.12+lift*.22),.06+lift*.09);drawWing(r*(1.45+lift*.35),r*(.78+lift*.18),-1,top.c.accent,.16+pulse*.18+lift*.18);drawWing(r*(1.45+lift*.35),r*(.78+lift*.18),1,top.c.accent,.16+pulse*.18+lift*.18);
    if(state!=='idle'||m.speed>150)drawWake(r*(1.35+lift*.68),r*(.44+lift*.12),top.c.primary,.10+lift*.18);
    if(state==='direct'){ctx.fillStyle=alpha('#ffffff',.34);ctx.beginPath();ctx.moveTo(r*.42,-r*.18);ctx.lineTo(r*1.55,0);ctx.lineTo(r*.42,r*.18);ctx.closePath();ctx.fill()}
  }
  function drawPhase(top,pulse){
    const r=top.r,m=motionOf(top),phaseActive=!!top.phaseInvisible,count=phaseActive?2:1;ctx.rotate(m.angle);
    for(let i=count;i>=1;i--){ctx.save();ctx.translate(-r*.46*i,0);ctx.globalAlpha=(phaseActive ? .34 : .18)/i;drawCrescent(r*(1.05-i*.08),top.c.primary,.72);ctx.restore()}
    ctx.fillStyle=alpha(top.c.accent,.20+pulse*.18);for(let i=0;i<(phaseActive?3:1);i++){ctx.beginPath();ctx.arc(-r*(.72+i*.30),r*(i-1)*.16,r*(.055+i*.012),0,Math.PI*2);ctx.fill()}
  }
  function drawCharm(top,pulse){
    const r=top.r,phase=(top.angle||0)*-.12,orbit=Number(top.charmOrbitPhase??top.angle)||0;ctx.rotate(phase);fillGlow(top.c.primary,r*1.25,.07+pulse*.04);drawCrescent(r*1.16,top.c.primary,.84);
    for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*Math.PI*2/3+orbit*.10);ctx.translate(0,-r*1.26);ctx.fillStyle=alpha(top.c.accent,.18+pulse*.24);ctx.beginPath();ctx.moveTo(0,-r*.17);ctx.quadraticCurveTo(r*.20,0,0,r*.24);ctx.quadraticCurveTo(-r*.20,0,0,-r*.17);ctx.fill();ctx.restore()}
  }
  function drawRage(top,pulse){
    const r=top.r,m=motionOf(top),rage=clamp(1-(top.energy||0)/100,0,1),stage=top.rageStageSeen||0,state=top.rageSkillState||'idle';
    const hot=stage>=3?'#fff1b8':top.c.accent||'#ffd6a1',blood=top.c.primary||'#ff304c',ember=top.c.secondary||'#ff8a28';ctx.rotate((top.angle||0)*.12);fillGlow(blood,r*(1.16+rage*.28),.07+rage*.10);
    for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.translate(r*.60,0);ctx.fillStyle=alpha(i<Math.max(1,stage)?hot:i%2?ember:blood,.12+rage*.28+(i<stage ? .18 : 0));ctx.beginPath();ctx.moveTo(-r*.12,-r*.20);ctx.lineTo(r*.66,-r*.30);ctx.lineTo(r*.46,0);ctx.lineTo(r*.66,r*.30);ctx.lineTo(-r*.12,r*.20);ctx.closePath();ctx.fill();ctx.restore()}
    ctx.rotate(m.angle-(top.angle||0)*.12);
    if(state==='hunt'){for(const side of [-1,1]){ctx.fillStyle=alpha(hot,.24+rage*.26);ctx.beginPath();ctx.moveTo(r*.88,side*r*.30);ctx.lineTo(r*1.42,side*r*.14);ctx.lineTo(r*.94,side*r*.02);ctx.closePath();ctx.fill()}}
    if(state==='smashCharge'){const charge=clamp(1-(top.rageSkillTimer||0)/.68,0,1);ctx.fillStyle=alpha(hot,.18+charge*.42);ctx.beginPath();ctx.ellipse(r*(.92-charge*.16),0,r*(.48-charge*.18),r*(.34+charge*.06),0,0,Math.PI*2);ctx.fill()}
    if(state==='smashRush'){ctx.fillStyle=alpha(blood,.18+rage*.22);ctx.beginPath();ctx.moveTo(r*.48,-r*.54);ctx.lineTo(r*(2.0+rage*.42),0);ctx.lineTo(r*.48,r*.54);ctx.closePath();ctx.fill()}
  }
  function drawMorph(top,pulse){
    const r=top.r,m=motionOf(top),mode=top.morphMode||'scan';ctx.rotate(m.angle);ctx.shadowBlur=8;ctx.shadowColor=top.c.primary;
    if(mode==='scan'){ctx.fillStyle=alpha(top.c.primary,.10+pulse*.12);ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r*1.58,-.42,.42);ctx.closePath();ctx.fill();ctx.fillStyle=alpha(top.c.accent,.42);for(const y of [-1,1]){ctx.beginPath();ctx.arc(r*1.05,y*r*.22,r*.06,0,Math.PI*2);ctx.fill()}}
    else if(mode==='swift'){for(let i=0;i<3;i++){ctx.save();ctx.translate(-r*(.62+i*.30),0);drawWake(r*(.62+i*.08),r*.36,top.c.primary,.12+pulse*.12);ctx.restore()}}
    else if(mode==='aegis'){ctx.fillStyle=alpha(top.c.primary,.14+pulse*.12);polygon(6,r*1.42,Math.PI/6-m.angle);ctx.fill();ctx.strokeStyle=alpha(top.c.accent,.28+pulse*.22);ctx.lineWidth=1.2;ctx.stroke()}
    else if(mode==='viper'){for(const side of [-1,1]){ctx.save();ctx.translate(r*.30,side*r*.42);ctx.rotate(side*.16);ctx.fillStyle=alpha(top.c.primary,.20+pulse*.18);bladeShape(r*1.34,r*.30);ctx.fill();ctx.restore()}}
    else {ctx.save();ctx.rotate((top.angle||0)*.12*m.dir-m.angle);drawCrescent(r*1.40,top.c.primary,.82);ctx.restore()}
  }
  function drawTaiji(top,pulse){
    const r=top.r,yang=top.taijiMode==='yang',chi=clamp((top.taijiChi||0)/100,0,1),light=yang?'#ffe596':'#d8f2ff',dark=yang?top.c.primary:top.c.secondary;ctx.rotate((top.angle||0)*(yang ? .10 : -.07));fillGlow(light,r*(1.18+chi*.14),.06+chi*.08);
    ctx.fillStyle=alpha(light,.18+pulse*.16);ctx.beginPath();ctx.arc(0,0,r*1.20,-Math.PI/2,Math.PI/2);ctx.lineTo(0,0);ctx.closePath();ctx.fill();ctx.fillStyle=alpha(dark,.16+pulse*.12);ctx.beginPath();ctx.arc(0,0,r*1.20,Math.PI/2,Math.PI*1.5);ctx.lineTo(0,0);ctx.closePath();ctx.fill();
    for(const side of [-1,1]){ctx.fillStyle=alpha(side>0?light:dark,.48);ctx.beginPath();ctx.arc(0,side*r*.55,r*(.12+chi*.03),0,Math.PI*2);ctx.fill()}
    if(chi>.10){ctx.strokeStyle=alpha(top.c.accent,.12+chi*.34);ctx.lineWidth=1+chi;ctx.beginPath();ctx.arc(0,0,r*(1.34+chi*.15),-Math.PI/2,-Math.PI/2+Math.PI*2*chi);ctx.stroke()}
  }
  function drawSword(top,pulse){
    const r=top.r,activeState=top.swordState&&top.swordState!=='idle',selected=(top.swordBag?.length||0)%7;ctx.rotate((top.angle||0)*-.08);
    for(let i=0;i<7;i++){const selectedBlade=i===selected,active=selectedBlade&&activeState;ctx.save();ctx.rotate(i*Math.PI*2/7+Math.PI/2);ctx.translate(0,-r*(1.16+(active ? .18 : 0)));ctx.rotate(Math.PI/2);ctx.fillStyle=alpha(active?top.c.accent:top.c.primary,active ? .48 : selectedBlade ? .24 : .13+pulse*.04);if(selectedBlade){bladeShape(r*(active ? .96 : .68),r*(active ? .22 : .14));ctx.fill()}else ctx.fillRect(-r*.10,-r*.035,r*.20,r*.07);ctx.restore()}
  }
  function drawChrono(top,pulse){
    const r=top.r,state=top.chronoState||'idle',stopped=state==='stop'||top.timeFrozenBy,hand=stopped?-Math.PI/2:time*2.6;ctx.rotate(stopped?0:(top.angle||0)*-.035);fillGlow(top.c.primary,r*1.42,.07+pulse*.04);
    ctx.fillStyle=alpha(top.c.primary,.10+pulse*.08);ctx.beginPath();ctx.arc(0,0,r*1.36,0,Math.PI*2);ctx.fill();ctx.fillStyle=alpha(top.c.accent,.30+pulse*.18);
    for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.fillRect(-r*.055,-r*1.43,r*.11,r*.32);ctx.restore()}
    ctx.save();ctx.rotate(hand);ctx.beginPath();ctx.moveTo(-r*.06,r*.08);ctx.lineTo(0,-r*1.02);ctx.lineTo(r*.06,r*.08);ctx.closePath();ctx.fill();ctx.restore();ctx.save();ctx.rotate(stopped?0:-time*.48);ctx.fillRect(-r*.045,-r*.68,r*.09,r*.72);ctx.restore();
  }
  function drawBreaker(top,pulse){
    const r=top.r,m=motionOf(top),charge=clamp(top.counterCharge||0,0,1);ctx.rotate(m.angle);fillGlow(top.c.primary,r*(1.08+charge*.18),.06+charge*.08);
    for(const side of [-1,1]){ctx.save();ctx.translate(r*(.20+charge*.10),side*r*(.38+charge*.08));ctx.rotate(side*.22);ctx.fillStyle=alpha(top.c.primary,.20+charge*.30+pulse*.08);bladeShape(r*(1.12+charge*.48),r*.30);ctx.fill();ctx.restore()}
  }
  function drawWood(top,pulse){
    const r=top.r,m=motionOf(top);ctx.rotate((top.angle||0)*.05*m.dir);fillGlow(top.c.primary,r*1.18,.045+pulse*.025);ctx.strokeStyle=alpha(top.c.accent,.16+pulse*.15);ctx.lineWidth=1;
    for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(0,0,r*(1.04+i*.24),r*(.72+i*.15),i*.18,0,Math.PI*2);ctx.stroke()}
    ctx.fillStyle=alpha(top.c.accent,.22);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;ctx.beginPath();ctx.arc(Math.cos(a)*r*1.02,Math.sin(a)*r*.72,r*.06,0,Math.PI*2);ctx.fill()}
  }

  function drawSignature(top){
    const kind=kindOf(top);if(!kind||kind==='colossus'||!active(top))return;
    const pulse=.5+.5*Math.sin(time*(kind==='chrono'?2.4:4.2)+(top.fxHuePhase||top.index||0)),state=stateOf(top,kind),idle=state==='idle'||state==='hits:0';
    ctx.save();ctx.translate(top.x,top.y);ctx.globalCompositeOperation='screen';ctx.globalAlpha=idle?(reduceMotion ? .24 : .32):.92;
    if(kind==='twin')drawTwin(top,pulse);else if(kind==='sky')drawSky(top,pulse);else if(kind==='phase')drawPhase(top,pulse);else if(kind==='charm')drawCharm(top,pulse);else if(kind==='rage')drawRage(top,pulse);else if(kind==='morph')drawMorph(top,pulse);else if(kind==='taiji')drawTaiji(top,pulse);else if(kind==='sword')drawSword(top,pulse);else if(kind==='chrono')drawChrono(top,pulse);else if(kind==='breaker')drawBreaker(top,pulse);else if(kind==='wooden')drawWood(top,pulse);
    ctx.restore();
  }

  function drawBond(top){
    const bond=top.relayCoreBondData;if(!bond||!active(top))return;
    const activeFx=clamp(Math.max(top.relayBondSkillPulse||0,top.relayBondLocalFx||0),0,1);if(activeFx<=.03&&!(top.relayBondShieldTimer>0)&&!(top.relayBondPhaseTimer>0)&&!(top.relayBondAfterimage>0))return;
    const color=top.relayBondColor||bond.color||'#82e8ff',partner=metaPresets?.[bond.partnerKey]||null,partnerColor=partner?.primary||top.c.secondary||'#ffffff',r=top.r,m=motionOf(top);
    const target=top.relayBondLocalTarget||null,dx=Number(target?.x??top.relayBondLocalTargetX)-top.x,dy=Number(target?.y??top.relayBondLocalTargetY)-top.y,hasTarget=Number.isFinite(dx)&&Number.isFinite(dy)&&mag(dx,dy)>1,angle=hasTarget?Math.atan2(dy,dx):m.angle;
    ctx.save();ctx.translate(top.x,top.y);ctx.rotate(angle);ctx.globalCompositeOperation='screen';ctx.shadowBlur=8+activeFx*8;
    const tether=ctx.createLinearGradient(-r,0,r,0);tether.addColorStop(0,alpha(color,.12+activeFx*.34));tether.addColorStop(1,alpha(partnerColor,.12+activeFx*.34));ctx.strokeStyle=tether;ctx.lineWidth=1+activeFx*1.3;ctx.beginPath();ctx.moveTo(-r*.64,0);ctx.quadraticCurveTo(0,-r*(.18+activeFx*.12),r*.64,0);ctx.stroke();
    for(const side of [-1,1]){ctx.fillStyle=side<0?alpha(color,.30+activeFx*.30):alpha(partnerColor,.30+activeFx*.30);ctx.beginPath();ctx.arc(side*r*.66,0,r*(.09+activeFx*.04),0,Math.PI*2);ctx.fill()}
    if(top.relayBondShieldTimer>0){ctx.fillStyle=alpha(color,.10+activeFx*.18);polygon(6,r*1.36,Math.PI/6-angle);ctx.fill()}
    if(top.relayBondPhaseTimer>0||top.relayBondAfterimage>0)drawWake(r*(1.18+activeFx*.28),r*.38,partnerColor,.12+activeFx*.18);
    ctx.restore();
  }
  function drawBondHit(top){
    const hit=clamp(Math.max(top.relayBondHitPulse||0,top.relayBondLocalHit||0),0,1);if(hit<=0)return;const color=top.relayBondHitColor||top.relayBondLocalHitColor||'#fff',r=top.r,m=motionOf(top),progress=1-hit;
    ctx.save();ctx.translate(top.x,top.y);ctx.rotate(m.angle);ctx.globalCompositeOperation='screen';fillGlow(color,r*(.68+progress*.42),.10+hit*.14);ctx.strokeStyle=alpha(color,hit*.30);ctx.lineWidth=1+hit;ctx.beginPath();ctx.ellipse(0,0,r*(.70+progress*.52),r*(.30+progress*.18),0,0,Math.PI*2);ctx.stroke();
    for(const side of [-1,1]){ctx.fillStyle=alpha(color,hit*.32);ctx.beginPath();ctx.moveTo(side*r*.34,-r*.08);ctx.lineTo(side*r*(.90+progress*.38),0);ctx.lineTo(side*r*.34,r*.08);ctx.closePath();ctx.fill()}ctx.restore();
  }

  function announceTransition(top,kind,before,after,beforeCounters){
    if(!kind||before===after)return;
    let should=after!=='idle';
    if(kind==='charm')should=(top.charmCount||0)>beforeCounters.charmCount||after==='controlled';
    if(kind==='breaker')should=(top.counterHits||0)>beforeCounters.counterHits;
    if(kind==='wooden')should=after==='aura'&&before!=='aura';
    if(kind==='rage'&&after==='idle')should=false;
    if(kind==='chrono'&&after==='idle')should=false;
    if(kind==='twin'&&after==='idle')should=false;
    if(kind==='colossus')should=before==='idle'&&['quakeCrouch','quakeWaves','vortexWindup','vortexActive'].includes(after);
    if(should)triggerSkill(top,kind,skillLabel(top,kind,after),{strength:kind==='colossus'?1.65:kind==='rage'?1.3:1});
  }

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){
      super(index,data);
      this.skillFxKind=kindOf(this);
      this.skillFxState=stateOf(this,this.skillFxKind);
      this.skillFxCharmCount=this.charmCount||0;
      this.skillFxCounterHits=this.counterHits||0;
      this.skillFxRageStage=this.rageStageSeen||0;
      this.skillFxBondLatched=false;
      if(this.splitPart)setTimeout(()=>triggerSkill(this,'twin','雙星分體',{strength:.8}),0);
    }
    update(dt,opponent){
      const kind=this.skillFxKind||kindOf(this),before=this.skillFxState||stateOf(this,kind),counters={charmCount:this.skillFxCharmCount||0,counterHits:this.skillFxCounterHits||0};
      const beforeRage=this.skillFxRageStage||0,beforeBond=this.skillFxBondLatched;
      super.update(dt,opponent);
      const after=stateOf(this,kind),rageStage=this.rageStageSeen||0,rageAdvanced=kind==='rage'&&rageStage>beforeRage;
      if(!rageAdvanced)announceTransition(this,kind,before,after,counters);
      if(rageAdvanced)triggerSkill(this,kind,`血怒階段 ${rageStage}`,{strength:1+rageStage*.18});
      const bondPower=Math.max(this.relayBondSkillPulse||0,this.relayBondLocalFx||0),bondLatched=bondPower>.78;
      if(this.relayCoreBondData&&bondLatched&&!beforeBond){const bond=this.relayCoreBondData;triggerSkill(this,kindOf(this),`${bond.skill}・${bond.variant||'羈絆共鳴'}`,{bond:true,color:bond.color||this.relayBondColor,mark:bond.icon||'羈',strength:1.5})}
      this.skillFxKind=kind;this.skillFxState=after;this.skillFxCharmCount=this.charmCount||0;this.skillFxCounterHits=this.counterHits||0;this.skillFxRageStage=rageStage;this.skillFxBondLatched=bondLatched;
    }
    draw(){super.draw();drawSignature(this);drawBond(this);drawBondHit(this)}
  };

  const previousEffects=effects;
  effects=function(dt){
    previousEffects(dt);
    skillBursts.forEach(fx=>fx.life-=dt*(fx.bond ? .95 : 1.35));
    for(let i=skillBursts.length-1;i>=0;i--)if(skillBursts[i].life<=0)skillBursts.splice(i,1);
  };
  function burstNode(x,y,r,color,power){
    ctx.fillStyle=alpha(color,.18+power*.42);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=alpha('#ffffff',power*.44);ctx.beginPath();ctx.arc(x-r*.12,y-r*.12,r*.24,0,Math.PI*2);ctx.fill();
  }
  function burstPetal(x,y,r,color,power){
    ctx.save();ctx.translate(x,y);ctx.fillStyle=alpha(color,.12+power*.30);ctx.beginPath();ctx.moveTo(0,-r*.7);ctx.quadraticCurveTo(r*.7,0,0,r);ctx.quadraticCurveTo(-r*.7,0,0,-r*.7);ctx.fill();ctx.restore();
  }
  function burstMotif(fx,r,power,progress){
    const kind=fx.kind||'phase',accent=fx.secondary||'#ffffff',spin=(fx.spinSign||1)*(fx.spinRate||0);
    if(kind==='twin'){
      const spread=r*(.18+.20*progress);ctx.strokeStyle=alpha(accent,.16+power*.42);ctx.lineWidth=.8+power*1.2;ctx.beginPath();ctx.moveTo(-spread,0);ctx.quadraticCurveTo(0,-r*.10*spin,spread,0);ctx.stroke();burstNode(-spread,0,r*.075,fx.color,power);burstNode(spread,0,r*.075,accent,power);
    }else if(kind==='sky'){
      drawWing(r*.72,r*.42,-1,accent,.12+power*.34);drawWing(r*.72,r*.42,1,accent,.12+power*.34);drawWake(r*.68,r*.22,fx.color,.10+power*.22);
    }else if(kind==='phase'){
      for(let i=2;i>=1;i--){ctx.save();ctx.translate(-r*(.14+i*.16),0);ctx.globalAlpha=power/(i*.8);drawCrescent(r*(.25+i*.04),fx.color,.72);ctx.restore()}
    }else if(kind==='charm'){
      drawCrescent(r*.46,fx.color,.86);for(let i=0;i<3;i++){const a=i*Math.PI*2/3-spin*progress*.45;burstPetal(Math.cos(a)*r*.42,Math.sin(a)*r*.42,r*.13,accent,power)}
    }else if(kind==='rage'){
      ctx.fillStyle=alpha(fx.color,.14+power*.36);ctx.beginPath();ctx.moveTo(-r*.12,-r*.24);ctx.lineTo(r*.76,0);ctx.lineTo(-r*.12,r*.24);ctx.closePath();ctx.fill();for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2+spin*progress*.22);ctx.translate(r*.25,0);ctx.fillStyle=alpha(i%2?accent:fx.color,.10+power*.28);bladeShape(r*.34,r*.11);ctx.fill();ctx.restore()}
    }else if(kind==='morph'){
      const mode=String(fx.state||'scan').split(':')[0];
      if(mode==='swift')drawWake(r*.82,r*.27,fx.color,.14+power*.32);
      else if(mode==='aegis'){ctx.fillStyle=alpha(fx.color,.12+power*.28);polygon(6,r*.46,Math.PI/6);ctx.fill()}
      else if(mode==='viper'){for(const side of [-1,1]){ctx.save();ctx.translate(r*.02,side*r*.16);ctx.rotate(side*.18);ctx.fillStyle=alpha(fx.color,.13+power*.32);bladeShape(r*.58,r*.12);ctx.fill();ctx.restore()}}
      else if(mode==='reaper')drawCrescent(r*.50,fx.color,.88);
      else {ctx.fillStyle=alpha(fx.color,.10+power*.25);ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r*.58,-.34,.34);ctx.closePath();ctx.fill()}
    }else if(kind==='taiji'){
      ctx.fillStyle=alpha(accent,.13+power*.30);ctx.beginPath();ctx.arc(0,0,r*.42,-Math.PI/2,Math.PI/2);ctx.lineTo(0,0);ctx.fill();ctx.fillStyle=alpha(fx.color,.13+power*.30);ctx.beginPath();ctx.arc(0,0,r*.42,Math.PI/2,Math.PI*1.5);ctx.lineTo(0,0);ctx.fill();burstNode(0,-r*.20,r*.035,fx.color,power);burstNode(0,r*.20,r*.035,accent,power);
    }else if(kind==='sword'){
      const selected=Math.min(6,Math.floor(progress*7));for(let i=0;i<7;i++){ctx.save();ctx.rotate(i*Math.PI*2/7);ctx.translate(0,-r*.36);ctx.rotate(Math.PI/2);ctx.fillStyle=alpha(i===selected?accent:fx.color,i===selected ? .20+power*.36 : .08+power*.13);if(i===selected){bladeShape(r*.34,r*.085);ctx.fill()}else ctx.fillRect(-r*.07,-r*.018,r*.14,r*.036);ctx.restore()}
    }else if(kind==='chrono'){
      ctx.fillStyle=alpha(fx.color,.08+power*.25);ctx.beginPath();ctx.arc(0,0,r*.44,0,Math.PI*2);ctx.fill();ctx.fillStyle=alpha(accent,.14+power*.34);for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.fillRect(-r*.025,-r*.48,r*.05,r*.12);ctx.restore()}ctx.save();ctx.rotate(-Math.PI/2+spin*progress*.5);ctx.beginPath();ctx.moveTo(-r*.025,r*.04);ctx.lineTo(0,-r*.30);ctx.lineTo(r*.025,r*.04);ctx.fill();ctx.restore();ctx.fillRect(-r*.018,-r*.19,r*.036,r*.21);
    }else if(kind==='breaker'){
      for(const side of [-1,1]){ctx.save();ctx.translate(0,side*r*.14);ctx.rotate(side*.18);ctx.fillStyle=alpha(fx.color,.14+power*.36);bladeShape(r*.62,r*.13);ctx.fill();ctx.restore()}
    }else{
      ctx.fillStyle=alpha('#8d5b37',.10+power*.24);ctx.beginPath();ctx.ellipse(0,0,r*.46,r*.31,spin*progress*.18,0,Math.PI*2);ctx.fill();ctx.strokeStyle=alpha(accent,.10+power*.22);ctx.lineWidth=.7+power*.7;for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(0,0,r*(.25+i*.11),r*(.14+i*.07),i*.18,0,Math.PI*2);ctx.stroke()}
    }
  }
  function drawBurst(fx){
    const progress=clamp(1-fx.life,0,1),attack=clamp(progress/.10,0,1),decay=clamp((1-progress)/.72,0,1),power=attack*decay,travel=1-Math.pow(1-progress,3);
    const massScale=.82+(fx.mass||.7)*.26,speedScale=1+clamp((fx.speed||0)/300,0,1)*.22,r=(fx.radius*.82+14+(12+fx.strength*12)*travel)*massScale*speedScale;
    const inertia=reduceMotion ? .045 : .12;ctx.save();ctx.translate(fx.x+(fx.vx||0)*inertia*travel,fx.y+(fx.vy||0)*inertia*travel);ctx.globalCompositeOperation='screen';
    const bloom=ctx.createRadialGradient(0,0,0,0,0,r*.54);bloom.addColorStop(0,alpha('#ffffff',power*.11));bloom.addColorStop(.24,alpha(fx.secondary,power*.10));bloom.addColorStop(.62,alpha(fx.color,power*.06));bloom.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=bloom;ctx.beginPath();ctx.arc(0,0,r*.54,0,Math.PI*2);ctx.fill();
    ctx.shadowColor=fx.color;ctx.shadowBlur=4+power*8;ctx.lineCap='round';ctx.save();ctx.rotate(fx.angle||0);
    if((fx.speed||0)>70)drawWake(r*(.42+clamp(fx.speed/360,0,.52)),r*.19,fx.color,.07+power*.18);
    const forceful=fx.kind==='rage'||fx.kind==='breaker'||fx.kind==='wooden'||fx.kind==='sky';
    if(forceful){ctx.strokeStyle=alpha(fx.secondary,power*.22);ctx.lineWidth=.8+power*1.1;ctx.beginPath();ctx.ellipse(0,0,r*(.38+.50*travel),r*(.14+.19*travel),0,0,Math.PI*2);ctx.stroke()}
    const chips=reduceMotion?1:3;ctx.fillStyle=alpha(fx.secondary,power*.30);for(let i=0;i<chips;i++){const side=i-(chips-1)/2;ctx.save();ctx.translate(-r*(.18+.22*travel+i*.07),side*r*(.08+.08*travel));ctx.rotate((fx.spinSign||1)*(side*.22+progress*.28));ctx.fillRect(-r*.045,-r*.018,r*.09,r*.036);ctx.restore()}
    burstMotif(fx,r,power,progress);
    if(fx.bond){ctx.strokeStyle=alpha('#ffffff',power*.28);ctx.lineWidth=.8+power;ctx.beginPath();ctx.moveTo(-r*.28,0);ctx.quadraticCurveTo(0,-r*.10*(fx.spinSign||1),r*.28,0);ctx.stroke();burstNode(-r*.29,0,r*.035,fx.color,power);burstNode(r*.29,0,r*.035,fx.secondary,power)}
    ctx.restore();ctx.restore();
  }
  const previousDrawScene=drawScene;
  drawScene=function(){previousDrawScene();if(skillBursts.length){ctx.save();skillBursts.forEach(drawBurst);ctx.restore()}};

  if(arena){
    let flashTimer=0;
    window.addEventListener('arena-skill-activation',event=>{
      const d=event.detail||{};arena.dataset.skillFlash='0';arena.dataset.skillBond=d.bond?'1':'0';arena.style.setProperty('--skill-flash-color',d.color||'#7fe7ff');
      requestAnimationFrame(()=>{arena.dataset.skillFlash='1'});clearTimeout(flashTimer);flashTimer=setTimeout(()=>{arena.dataset.skillFlash='0';arena.dataset.skillBond='0'},210);
    });
  }

  document.documentElement.dataset.skillFx='physics-v8';
})();
