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
    if(kind==='colossus')return (top.colossusQuakeWindup||0)>0?'windup':(top.colossusQuakePulse||0)>.72?'quake':'idle';
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
  function triggerSkill(top,kind,label,{bond=false,color='',mark='',strength=1}={}){
    if(!active(top)&&!top?.splitPart)return;
    const p=profile(top,kind),fxColor=color||p.color,fxMark=mark||p.mark;
    skillBursts.push({x:top.x,y:top.y,life:1,color:fxColor,label,mark:fxMark,bond,strength,team:top.teamIndex??(top.index?1:0)});
    if(skillBursts.length>12)skillBursts.shift();
    wave(top.x,top.y,fxColor,clamp(top.r*(2.8+strength),36,96));
    emit(top.x,top.y,fxColor,reduceMotion?7:Math.round(9+strength*7),.42+strength*.14,'streak');
    shake=Math.max(shake,bond?3.4:1.5+strength*1.1);
    flash=Math.max(flash,bond?.07:.025+strength*.015);
    emitSkillEvent(top,{label,color:fxColor,mark:fxMark,bond});
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

  function drawTwinCore(x,y,r,color,mark,glow=1){
    ctx.save();ctx.translate(x,y);ctx.shadowColor=color;ctx.shadowBlur=8+glow*8;
    ctx.fillStyle=alpha(color,.14+glow*.16);ctx.strokeStyle=alpha(color,.52+glow*.26);ctx.lineWidth=1+glow*.45;
    drawStar(0,0,r,6);ctx.fill();ctx.stroke();
    ctx.fillStyle=alpha('#ffffff',.72+glow*.20);ctx.font=`1000 ${Math.max(6,r*.52)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(mark,0,.5);
    ctx.restore();
  }

  function drawTwin(top,pulse){
    const r=top.r,dir=Math.sign(top.omega||1)||1,phase=time*(.74+pulse*.12)*dir;
    const primary=top.c.primary||'#39dcff',secondary=top.c.secondary||'#9c67ff';
    const combined=!top.splitPart,guardian=top.twinInheritanceMode==='guardian',hunter=top.twinInheritanceMode==='hunter',betrayal=!!top.twinCharmBetrayal;
    const charge=combined?clamp(Math.max((top.lastEnemyImpact||0)/86,(top.burstMeter||0)/34),0,1):1;
    ctx.rotate(phase);ctx.lineCap='round';ctx.shadowBlur=10+charge*8;
    for(let lane=0;lane<2;lane++){
      ctx.save();ctx.rotate(lane?Math.PI/2:-Math.PI/8);ctx.strokeStyle=alpha(lane?secondary:primary,.18+pulse*.18+charge*.16);ctx.shadowColor=lane?secondary:primary;ctx.lineWidth=1.05+charge*.75;
      ctx.setLineDash([r*(.20+lane*.04),r*.11]);ctx.lineDashOffset=(lane?-1:1)*time*r*.42;
      ctx.beginPath();ctx.ellipse(0,0,r*(1.62+charge*.13),r*(.54+lane*.09),0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }
    if(combined){
      const separation=r*(.41+charge*.13);
      ctx.save();ctx.rotate(-phase*1.35);ctx.strokeStyle=alpha('#ffffff',.18+charge*.34);ctx.lineWidth=1+charge;ctx.beginPath();ctx.moveTo(-separation,0);ctx.lineTo(separation,0);ctx.stroke();
      drawTwinCore(-separation,0,r*.30,primary,'α',.55+charge*.45);drawTwinCore(separation,0,r*.30,secondary,'β',.55+charge*.45);ctx.restore();
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4,ready=i/8<charge;ctx.strokeStyle=alpha(i%2?secondary:primary,ready?.62:.12);ctx.lineWidth=ready?2.1:1;
        ctx.beginPath();ctx.arc(0,0,r*1.23,a+.08,a+.51);ctx.stroke();
      }
    }else{
      const isAlpha=top.splitPart==='α',coreColor=betrayal?'#ff65d2':isAlpha?primary:secondary;
      drawTwinCore(0,0,r*.39,coreColor,top.splitPart||'星',.75+pulse*.25);
      ctx.strokeStyle=alpha(coreColor,.24+pulse*.30);ctx.lineWidth=1.2;
      if(guardian){
        ctx.rotate(-phase*.82);for(let i=0;i<2;i++){polygon(6,r*(1.20+i*.20),Math.PI/6);ctx.stroke()}
      }else if(hunter){
        ctx.rotate(Math.atan2(top.vy||0,top.vx||0)-phase);for(const side of [-1,1]){ctx.save();ctx.translate(r*.26,side*r*.42);ctx.rotate(side*.18);bladeShape(r*1.34,r*.25);ctx.stroke();ctx.restore()}
      }else{
        ctx.setLineDash([2,4]);ctx.beginPath();ctx.arc(0,0,r*(1.18+pulse*.12),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      }
      if(betrayal){ctx.strokeStyle=alpha('#ff66cf',.48+pulse*.26);ctx.rotate(-time*1.7);ctx.beginPath();ctx.arc(0,0,r*1.48,-1.15,1.15);ctx.arc(r*.34,0,r*.92,1.15,-1.15,true);ctx.stroke()}
    }
  }
  function drawSky(top,pulse){
    const r=top.r,height=clamp(top.skyJumpHeight||0,0,1.75),state=top.skyJumpState||'idle';
    ctx.rotate(Math.atan2(top.vy||0,top.vx||0));ctx.strokeStyle=alpha(top.c.accent,.22+pulse*.32);ctx.lineWidth=1.15+height*.55;ctx.shadowBlur=10+height*6;ctx.shadowColor=top.c.primary;
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(-r*.25,side*r*.14);ctx.quadraticCurveTo(r*(.65+height*.18),side*r*(1.0+height*.18),r*(1.82+height*.25),side*r*.22);ctx.quadraticCurveTo(r*.72,side*r*.48,-r*.25,side*r*.14);ctx.stroke()}
    if(state!=='idle'){ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(0,0,r*(1.46+height*.22),0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}
    if(state==='air'||state==='direct'){for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-r*(1.2+i*.06),i*r*.26);ctx.lineTo(-r*(2.2+height*.45),i*r*.38);ctx.stroke()}}
  }
  function drawPhase(top,pulse){
    const r=top.r,phase=time*.72;
    ctx.rotate(-phase);ctx.strokeStyle=alpha(top.c.primary,(top.phaseInvisible?.25:.13)+pulse*.18);ctx.lineWidth=1.1;ctx.shadowBlur=12;ctx.shadowColor=top.c.primary;ctx.setLineDash([r*.32,r*.22]);
    for(let i=0;i<3;i++){ctx.lineDashOffset=phase*(i%2?-8:8);ctx.beginPath();ctx.arc(0,0,r*(1.16+i*.23),i*.5,Math.PI*1.55+i*.5);ctx.stroke()}
    ctx.setLineDash([]);
    if(top.phaseInvisible){const v=mag(top.vx||0,top.vy||0)||1,nx=-(top.vx||0)/v,ny=-(top.vy||0)/v;for(let i=1;i<=3;i++){ctx.globalAlpha=.12/i;ctx.beginPath();ctx.arc(nx*r*.52*i,ny*r*.52*i,r*(1-i*.1),0,Math.PI*2);ctx.stroke()}}
  }
  function drawCharm(top,pulse){
    const r=top.r,phase=-time*.55;
    ctx.rotate(phase);ctx.strokeStyle=alpha(top.c.primary,.18+pulse*.26);ctx.fillStyle=alpha(top.c.primary,.08+pulse*.12);ctx.lineWidth=1.15;ctx.shadowBlur=12;ctx.shadowColor=top.c.primary;
    ctx.beginPath();ctx.arc(-r*.16,0,r*1.34,-1.25,1.25);ctx.arc(r*.42,0,r*.88,1.25,-1.25,true);ctx.closePath();ctx.stroke();
    for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*Math.PI*2/3+time*.8);ctx.translate(0,-r*1.48);ctx.beginPath();ctx.moveTo(0,-r*.24);ctx.quadraticCurveTo(r*.28,0,0,r*.30);ctx.quadraticCurveTo(-r*.28,0,0,-r*.24);ctx.fill();ctx.restore()}
    if(top.charmedBy){ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(0,0,r*1.72,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}
  }
  function drawRage(top,pulse){
    const r=top.r,rage=clamp(1-(top.energy||0)/100,0,1),stage=top.rageStageSeen||0,state=top.rageSkillState||'idle';
    const hot=stage>=3?'#fff1b8':top.c.accent||'#ffd6a1',blood=top.c.primary||'#ff304c',ember=top.c.secondary||'#ff8a28';
    const aim=Math.atan2(top.vy||0,top.vx||0),spin=time*(.42+rage*.72);
    ctx.rotate(spin);ctx.lineCap='round';ctx.shadowBlur=11+rage*18;ctx.shadowColor=blood;
    for(let i=0;i<4;i++){
      ctx.save();ctx.rotate(i*Math.PI/2+(i%2?.08:-.08));ctx.translate(r*.70,0);
      ctx.strokeStyle=alpha(i%2?ember:hot,.20+rage*.34+pulse*.10);ctx.fillStyle=alpha(blood,.035+rage*.08);ctx.lineWidth=1.1+rage*1.25;
      ctx.beginPath();ctx.moveTo(-r*.12,-r*.22);ctx.lineTo(r*.28,-r*.42);ctx.lineTo(r*.72,-r*.18);ctx.lineTo(r*.52,0);ctx.lineTo(r*.74,r*.18);ctx.lineTo(r*.28,r*.42);ctx.lineTo(-r*.12,r*.22);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }
    ctx.strokeStyle=alpha(blood,.16+rage*.30);ctx.lineWidth=1+rage*1.1;ctx.setLineDash([r*.13,r*.12]);ctx.lineDashOffset=-time*r*(.28+rage*.34);ctx.beginPath();ctx.arc(0,0,r*(1.30+rage*.20),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<3;i++){
      const a=-Math.PI/2+(i-1)*.34,x=Math.cos(a)*r*1.47,y=Math.sin(a)*r*1.47,on=stage>i;
      ctx.fillStyle=alpha(on?(i===2?hot:blood):'#5f2530',on?.78:.22);ctx.shadowColor=on?blood:'#000';ctx.beginPath();ctx.arc(x,y,r*(on?.085:.06),0,Math.PI*2);ctx.fill();
    }
    ctx.rotate(-spin);
    if(state==='hunt'){
      ctx.rotate(aim);ctx.strokeStyle=alpha(hot,.28+rage*.44);ctx.lineWidth=1.1+rage;
      for(let i=0;i<3;i++){const x=r*(1.08+i*.28);ctx.beginPath();ctx.moveTo(x-r*.18,-r*.18);ctx.lineTo(x,0);ctx.lineTo(x-r*.18,r*.18);ctx.stroke()}
    }
    if(state==='smashCharge'){
      const charge=clamp(1-(top.rageSkillTimer||0)/.68,0,1);ctx.rotate(aim);ctx.strokeStyle=alpha(hot,.34+charge*.46);ctx.lineWidth=1.2+charge*1.8;
      for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,r*(1.60-i*.20-charge*.16),-.48,.48);ctx.stroke()}
      ctx.beginPath();ctx.moveTo(r*.42,0);ctx.lineTo(r*(1.45+charge*.38),0);ctx.stroke();
    }else if(state==='smashRush'){
      ctx.rotate(aim);ctx.fillStyle=alpha(blood,.10+rage*.16);ctx.strokeStyle=alpha(hot,.50+rage*.30);ctx.lineWidth=1.8+rage;
      ctx.beginPath();ctx.moveTo(r*.58,-r*.58);ctx.lineTo(r*(2.05+rage*.48),0);ctx.lineTo(r*.58,r*.58);ctx.closePath();ctx.fill();ctx.stroke();
    }else if(top.rageRecoveryTimer>0){
      ctx.strokeStyle=alpha('#ffcf9a',.20+pulse*.18);ctx.setLineDash([3,7]);ctx.beginPath();ctx.arc(0,0,r*1.18,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    }
  }
  function drawMorph(top,pulse){
    const r=top.r,mode=top.morphMode||'scan';
    ctx.strokeStyle=alpha(top.c.primary,.22+pulse*.25);ctx.fillStyle=alpha(top.c.primary,.08+pulse*.08);ctx.lineWidth=1.15;ctx.shadowBlur=11;ctx.shadowColor=top.c.primary;
    if(mode==='scan'){
      ctx.rotate(time*.75);for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,r*(1.12+i*.28),-.15,.92+i*.10);ctx.stroke()}ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r*2,0);ctx.stroke();
    }else if(mode==='swift'){
      ctx.rotate(Math.atan2(top.vy||0,top.vx||0));for(let i=0;i<3;i++){const x=-r*(.8+i*.46);ctx.beginPath();ctx.moveTo(x-r*.32,-r*.35);ctx.lineTo(x,r*.0);ctx.lineTo(x-r*.32,r*.35);ctx.stroke()}
    }else if(mode==='aegis'){
      ctx.rotate(time*.22);for(let i=0;i<2;i++){polygon(6,r*(1.28+i*.27),Math.PI/6);ctx.stroke()}
    }else if(mode==='viper'){
      ctx.rotate(Math.atan2(top.vy||0,top.vx||0));for(const side of [-1,1]){ctx.save();ctx.translate(r*.38,side*r*.48);ctx.rotate(side*.18);bladeShape(r*1.35,r*.28);ctx.stroke();ctx.restore()}
    }else if(mode==='reaper'){
      ctx.rotate(time*.48);for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(0,0,r*(1.42+i*.22),-.92+i*Math.PI,.72+i*Math.PI);ctx.stroke()}
    }
  }
  function drawTaiji(top,pulse){
    const r=top.r,yang=top.taijiMode==='yang',phase=time*(yang?.72:-.42);
    ctx.rotate(phase);ctx.strokeStyle=alpha(yang?'#ffe596':'#d8f2ff',.20+pulse*.32);ctx.fillStyle=alpha(yang?'#ffe596':'#d8f2ff',.42);ctx.lineWidth=1.2;ctx.shadowBlur=11;ctx.shadowColor=yang?'#ffd461':top.c.accent;
    ctx.beginPath();ctx.arc(0,0,r*1.48,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,-r*.37,r*.74,Math.PI/2,Math.PI*1.5);ctx.arc(0,r*.37,r*.74,-Math.PI/2,Math.PI/2);ctx.stroke();
    for(const y of [-.73,.73]){ctx.beginPath();ctx.arc(0,r*y,r*.12,0,Math.PI*2);ctx.fill()}
    const chi=clamp((top.taijiChi||0)/100,0,1);ctx.strokeStyle=alpha(top.c.accent,.15+chi*.5);ctx.lineWidth=1+chi*2;ctx.beginPath();ctx.arc(0,0,r*(1.7+chi*.12),-Math.PI/2,-Math.PI/2+Math.PI*2*chi);ctx.stroke();
  }
  function drawSword(top,pulse){
    const r=top.r,activeState=top.swordState&&top.swordState!=='idle';
    ctx.rotate(-time*.18);ctx.strokeStyle=alpha(top.c.primary,.20+pulse*.28);ctx.fillStyle=alpha(top.c.primary,.04+pulse*.08);ctx.lineWidth=1;ctx.shadowBlur=10;ctx.shadowColor=top.c.primary;
    for(let i=0;i<7;i++){ctx.save();ctx.rotate(i*Math.PI*2/7+Math.PI/2);ctx.translate(0,-r*(1.32+(activeState?.18:0)));ctx.rotate(Math.PI/2);bladeShape(r*(.72+(i===(top.swordBag?.length||0)%7&&activeState?.35:0)),r*.20);ctx.stroke();ctx.restore()}
    if(activeState){ctx.setLineDash([2,3]);ctx.beginPath();ctx.arc(0,0,r*1.72,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}
  }
  function drawChrono(top,pulse){
    const r=top.r,state=top.chronoState||'idle',stopped=state==='stop'||top.timeFrozenBy;
    ctx.rotate(stopped?0:-time*.10);ctx.strokeStyle=alpha(top.c.primary,.20+pulse*.30);ctx.lineWidth=1.05;ctx.shadowBlur=11;ctx.shadowColor=top.c.primary;ctx.beginPath();ctx.arc(0,0,r*1.55,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<12;i++){const a=i*Math.PI/6,inner=r*(i%3===0?1.22:1.34),outer=r*1.52;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke()}
    const hand=stopped?-Math.PI/2:time*3.4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(hand)*r*1.1,Math.sin(hand)*r*1.1);ctx.stroke();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(-time*.55)*r*.72,Math.sin(-time*.55)*r*.72);ctx.stroke();
    if(stopped){ctx.setLineDash([1,5]);ctx.beginPath();ctx.arc(0,0,r*1.82,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}
  }
  function drawColossus(top,pulse){
    const r=top.r,quake=clamp(Math.max(top.colossusQuakePulse||0,top.colossusPressurePulse||0),0,1);
    ctx.strokeStyle=alpha(top.c.accent,.16+quake*.32+pulse*.10);ctx.lineWidth=1.1+quake*1.8;ctx.shadowBlur=12;ctx.shadowColor=top.c.primary;
    for(let ring=0;ring<3;ring++){ctx.beginPath();ctx.ellipse(0,r*.28,r*(1.05+ring*.34+quake*.18),r*(.42+ring*.12),0,0,Math.PI*2);ctx.stroke()}
    if(quake>.18){for(let i=0;i<8;i++){const a=i*Math.PI/4+(top.colossusQuakeSeed||0),len=r*(1.3+quake*(.7+(i%3)*.25));ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.72,Math.sin(a)*r*.72);ctx.lineTo(Math.cos(a+.07)*len,Math.sin(a+.07)*len);ctx.lineTo(Math.cos(a-.05)*len*1.18,Math.sin(a-.05)*len*1.18);ctx.stroke()}}
  }
  function drawBreaker(top,pulse){
    const r=top.r,charge=clamp(top.counterCharge||0,0,1);
    ctx.rotate(Math.atan2(top.vy||0,top.vx||0));ctx.strokeStyle=alpha(top.c.primary,.18+charge*.42+pulse*.12);ctx.fillStyle=alpha(top.c.primary,.07+charge*.10);ctx.lineWidth=1.15+charge;ctx.shadowBlur=11;ctx.shadowColor=top.c.primary;
    for(const side of [-1,1]){ctx.save();ctx.translate(r*.25,side*r*.46);ctx.rotate(side*.26);bladeShape(r*(1.18+charge*.46),r*.32);ctx.fill();ctx.stroke();ctx.restore()}
    ctx.strokeStyle=alpha(top.c.accent,.18+charge*.45);ctx.beginPath();ctx.arc(0,0,r*1.46,-Math.PI/2,-Math.PI/2+Math.PI*2*charge);ctx.stroke();
  }
  function drawWood(top,pulse){
    const r=top.r;
    ctx.rotate(time*.18);ctx.strokeStyle=alpha(top.c.accent,.16+pulse*.18);ctx.lineWidth=1;ctx.shadowBlur=8;ctx.shadowColor=top.c.primary;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,r*(1.10+i*.24),r*(.78+i*.17),i*.22,0,Math.PI*2);ctx.stroke()}
    for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.78,Math.sin(a)*r*.78);ctx.quadraticCurveTo(Math.cos(a+.18)*r*1.16,Math.sin(a+.18)*r*1.16,Math.cos(a)*r*1.53,Math.sin(a)*r*1.53);ctx.stroke()}
  }

  function drawSignature(top){
    const kind=kindOf(top);if(!kind||!active(top))return;
    const pulse=.5+.5*Math.sin(time*(kind==='chrono'?3.2:5.4)+(top.fxHuePhase||top.index||0));
    ctx.save();ctx.translate(top.x,top.y);ctx.globalCompositeOperation='screen';
    if(kind==='twin')drawTwin(top,pulse);else if(kind==='sky')drawSky(top,pulse);else if(kind==='phase')drawPhase(top,pulse);else if(kind==='charm')drawCharm(top,pulse);else if(kind==='rage')drawRage(top,pulse);else if(kind==='morph')drawMorph(top,pulse);else if(kind==='taiji')drawTaiji(top,pulse);else if(kind==='sword')drawSword(top,pulse);else if(kind==='chrono')drawChrono(top,pulse);else if(kind==='colossus')drawColossus(top,pulse);else if(kind==='breaker')drawBreaker(top,pulse);else if(kind==='wooden')drawWood(top,pulse);
    ctx.restore();
  }

  function drawBond(top){
    const bond=top.relayCoreBondData;if(!bond||!active(top))return;
    const color=top.relayBondColor||bond.color||'#82e8ff',partner=metaPresets?.[bond.partnerKey]||null,partnerColor=partner?.primary||top.c.secondary||'#ffffff';
    const pulse=.5+.5*Math.sin(time*5.2+(top.index||0)),activeFx=clamp(Math.max(top.relayBondSkillPulse||0,top.relayBondLocalFx||0),0,1),r=top.r;
    ctx.save();ctx.translate(top.x,top.y);ctx.globalCompositeOperation='screen';ctx.rotate(time*(top.relayCoreBondRole==='core'?.46:-.36));ctx.lineWidth=1+activeFx*1.8;ctx.shadowBlur=10+activeFx*12;
    for(let lane=0;lane<2;lane++){
      ctx.save();ctx.rotate(lane*Math.PI/2);ctx.strokeStyle=alpha(lane?partnerColor:color,.14+activeFx*.42+pulse*.06);ctx.shadowColor=lane?partnerColor:color;ctx.beginPath();ctx.ellipse(0,0,r*(1.78+activeFx*.25),r*(.58+lane*.08),0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    for(let node=0;node<2;node++){
      const a=node*Math.PI+time*1.35,x=Math.cos(a)*r*1.65,y=Math.sin(a)*r*.58;ctx.fillStyle=node?partnerColor:color;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.arc(x,y,r*(.11+activeFx*.08),0,Math.PI*2);ctx.fill();
    }
    if(top.relayBondShieldTimer>0){ctx.strokeStyle=alpha(color,.42+activeFx*.28);for(let i=0;i<2;i++){polygon(6,r*(1.38+i*.22),Math.PI/6-time*.22);ctx.stroke()}}
    if(top.relayBondPhaseTimer>0||top.relayBondAfterimage>0){const v=mag(top.vx||0,top.vy||0)||1,nx=-(top.vx||0)/v,ny=-(top.vy||0)/v;ctx.strokeStyle=alpha(partnerColor,.28);for(let i=1;i<=3;i++){ctx.globalAlpha=.32/i;ctx.beginPath();ctx.arc(nx*r*.58*i,ny*r*.58*i,r*(1-i*.08),0,Math.PI*2);ctx.stroke()}}
    ctx.restore();
    if(activeFx>.18){ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${Math.max(8,r*.23)}px system-ui`;ctx.fillStyle=alpha('#ffffff',.44+activeFx*.46);ctx.shadowBlur=9;ctx.shadowColor=color;ctx.fillText(bond.icon||top.relayBondGlyph||'羈',top.x,top.y-r*(1.95+activeFx*.2));ctx.restore()}
  }
  function drawBondHit(top){
    const hit=clamp(Math.max(top.relayBondHitPulse||0,top.relayBondLocalHit||0),0,1);if(hit<=0)return;
    const color=top.relayBondHitColor||top.relayBondLocalHitColor||'#fff',r=top.r,progress=1-hit;
    ctx.save();ctx.translate(top.x,top.y);ctx.globalCompositeOperation='screen';ctx.strokeStyle=alpha(color,.18+hit*.55);ctx.lineWidth=1+hit*2;ctx.shadowBlur=10;ctx.shadowColor=color;
    for(let i=0;i<8;i++){const a=i*Math.PI/4+progress*.25;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.8,Math.sin(a)*r*.8);ctx.lineTo(Math.cos(a)*r*(1.25+progress*.7),Math.sin(a)*r*(1.25+progress*.7));ctx.stroke()}
    ctx.restore();
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
      const after=stateOf(this,kind);announceTransition(this,kind,before,after,counters);
      const rageStage=this.rageStageSeen||0;if(kind==='rage'&&rageStage>beforeRage)triggerSkill(this,kind,`血怒階段 ${rageStage}`,{strength:1+rageStage*.18});
      const bondPower=Math.max(this.relayBondSkillPulse||0,this.relayBondLocalFx||0),bondLatched=bondPower>.78;
      if(this.relayCoreBondData&&bondLatched&&!beforeBond){const bond=this.relayCoreBondData;triggerSkill(this,kindOf(this),`${bond.skill}・${bond.variant||'羈絆共鳴'}`,{bond:true,color:bond.color||this.relayBondColor,mark:bond.icon||'羈',strength:1.5})}
      this.skillFxKind=kind;this.skillFxState=after;this.skillFxCharmCount=this.charmCount||0;this.skillFxCounterHits=this.counterHits||0;this.skillFxRageStage=rageStage;this.skillFxBondLatched=bondLatched;
    }
    draw(){super.draw();drawSignature(this);drawBond(this);drawBondHit(this)}
  };

  const previousEffects=effects;
  effects=function(dt){
    previousEffects(dt);
    skillBursts.forEach(fx=>fx.life-=dt*(fx.bond?.95:1.35));
    for(let i=skillBursts.length-1;i>=0;i--)if(skillBursts[i].life<=0)skillBursts.splice(i,1);
  };
  function drawBurst(fx){
    const progress=1-fx.life,r=24+progress*(54+fx.strength*24),alphaPower=clamp(fx.life*1.35,0,1);
    ctx.save();ctx.translate(fx.x,fx.y);ctx.globalCompositeOperation='screen';ctx.strokeStyle=alpha(fx.color,.18+alphaPower*.46);ctx.fillStyle=alpha(fx.color,.07+alphaPower*.10);ctx.lineWidth=1+alphaPower*2;ctx.shadowBlur=12;ctx.shadowColor=fx.color;
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([3,6]);ctx.rotate(progress*(fx.team?-.8:.8));ctx.beginPath();ctx.arc(0,0,r*.72,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    const rays=fx.bond?10:7;for(let i=0;i<rays;i++){const a=i*Math.PI*2/rays;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.28,Math.sin(a)*r*.28);ctx.lineTo(Math.cos(a)*r*(.62+fx.strength*.12),Math.sin(a)*r*(.62+fx.strength*.12));ctx.stroke()}
    if(fx.bond){ctx.strokeStyle=alpha('#ffffff',alphaPower*.34);ctx.rotate(Math.PI/4);polygon(4,r*.46);ctx.stroke();ctx.rotate(Math.PI/4);polygon(4,r*.46);ctx.stroke()}
    ctx.restore();
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.globalAlpha=alphaPower;ctx.font=`900 ${Math.max(9,11+fx.strength*2)}px system-ui`;ctx.fillStyle='#ffffff';ctx.shadowBlur=9;ctx.shadowColor=fx.color;ctx.fillText(fx.label,fx.x,fx.y-r*.64-progress*12);ctx.restore();
  }
  const previousDrawScene=drawScene;
  drawScene=function(){previousDrawScene();if(skillBursts.length){ctx.save();skillBursts.forEach(drawBurst);ctx.restore()}};

  if(arena){
    const cinematic=document.createElement('div');cinematic.className='skill-cinematic';cinematic.setAttribute('aria-hidden','true');cinematic.innerHTML='<span class="skill-cinematic-mark">技</span><span class="skill-cinematic-copy"><span class="skill-cinematic-kicker">SKILL ACTIVATION</span><strong class="skill-cinematic-title">技能啟動</strong><span class="skill-cinematic-owner"></span></span>';arena.appendChild(cinematic);
    let hideTimer=0,flashTimer=0;
    window.addEventListener('arena-skill-activation',event=>{
      const d=event.detail||{};cinematic.style.setProperty('--skill-color',d.color||'#7fe7ff');cinematic.classList.toggle('bond',!!d.bond);cinematic.querySelector('.skill-cinematic-mark').textContent=d.mark||'技';cinematic.querySelector('.skill-cinematic-kicker').textContent=d.bond?'RELAY BOND RESONANCE':'SKILL ACTIVATION';cinematic.querySelector('.skill-cinematic-title').textContent=d.label||'技能啟動';cinematic.querySelector('.skill-cinematic-owner').textContent=d.owner||'';
      cinematic.classList.remove('show');requestAnimationFrame(()=>cinematic.classList.add('show'));clearTimeout(hideTimer);hideTimer=setTimeout(()=>cinematic.classList.remove('show'),d.bond?900:650);
      arena.dataset.skillFlash='1';arena.style.setProperty('--skill-flash-color',d.color||'#7fe7ff');clearTimeout(flashTimer);flashTimer=setTimeout(()=>{arena.dataset.skillFlash='0'},180);
    });
  }

  document.documentElement.dataset.skillFx='v4';
})();
