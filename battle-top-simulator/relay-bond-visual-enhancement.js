/* Relay Bond Visual Enhancement V1: cinematic announcements and distinct arena effects */
(() => {
  const api=window.__relayTeamSynergy;
  if(!api)return;

  let announceToken=0;
  const active=top=>!!top&&!top.out&&!top.burst&&!top.skyStaminaDefeated&&!top.skyEnergyDepletedLatch&&(top.energy||0)>0;
  const teamOf=top=>top?.teamIndex??(top?.index?1:0);
  const nearestEnemy=source=>{
    let best=null,bestD=Infinity;
    (Array.isArray(tops)?tops:[]).forEach(target=>{
      if(target===source||teamOf(target)===teamOf(source)||!active(target)||target.phaseInvisible)return;
      const d=mag(target.x-source.x,target.y-source.y);
      if(d<bestD){best=target;bestD=d}
    });
    return best;
  };

  function ensureAnnouncer(){
    const arena=document.querySelector('.arena');
    if(!arena)return null;
    let node=arena.querySelector('.relay-bond-announcer');
    if(!node){
      node=document.createElement('div');
      node.className='relay-bond-announcer';
      node.innerHTML='<div class="relay-bond-announcer-icon"></div><div><small>特殊核心羈絆</small><strong></strong><span></span></div>';
      arena.appendChild(node);
    }
    return node;
  }

  function announce(source,bond){
    const node=ensureAnnouncer();
    if(!node||!bond)return;
    const token=++announceToken;
    node.style.setProperty('--announce-color',bond.color||'#8fe8ff');
    node.querySelector('.relay-bond-announcer-icon').textContent=bond.icon||'技';
    node.querySelector('strong').textContent=bond.skill||'羈絆技能';
    node.querySelector('span').textContent=`${bond.variant||'核心共鳴'}｜${source.c?.name||'陀螺'}`;
    node.classList.remove('show');
    void node.offsetWidth;
    node.classList.add('show');
    setTimeout(()=>{if(token===announceToken)node.classList.remove('show')},1450);
  }

  function activateCinematic(source,bond){
    const target=nearestEnemy(source);
    source.relayBondCinema=1;
    source.relayBondCinemaKey=bond.key;
    source.relayBondCinemaColor=bond.color||'#8fe8ff';
    source.relayBondCinemaGlyph=bond.icon||'技';
    source.relayBondCinemaTargetX=target?.x??W/2;
    source.relayBondCinemaTargetY=target?.y??H/2;
    announce(source,bond);

    const intensity=bond.key==='bloodrageBerserker'?9:bond.key==='sevenfoldSwordSovereign'?7:5.5;
    shake=Math.max(shake,intensity);
    flash=Math.max(flash,bond.key==='chronoClockEmperor'?.24:.15);
    wave(source.x,source.y,bond.color||'#fff',72);
    emit(source.x,source.y,bond.color||'#fff',34,.92,'streak');

    if(target){
      target.relayBondEnhancedHit=1;
      target.relayBondEnhancedHitColor=bond.color||'#fff';
      target.relayBondEnhancedHitGlyph=bond.icon||'印';
    }
  }

  function drawArenaScene(top){
    const p=clamp(top.relayBondCinema||0,0,1);
    if(p<=0)return;
    const key=top.relayBondCinemaKey,color=top.relayBondCinemaColor||'#fff';
    const progress=1-p,cx=W/2,cy=H/2;

    ctx.save();
    ctx.translate(cx,cy);
    ctx.globalCompositeOperation='screen';

    const wash=ctx.createRadialGradient(0,0,outerR*.08,0,0,outerR*1.02);
    wash.addColorStop(0,alpha(color,.07+p*.12));
    wash.addColorStop(.62,alpha(color,.035+p*.07));
    wash.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=wash;
    ctx.beginPath();ctx.arc(0,0,outerR*1.02,0,Math.PI*2);ctx.fill();

    ctx.shadowColor=color;
    ctx.shadowBlur=18+p*18;

    if(key==='enchantressSiren'){
      ctx.rotate(-time*.34);
      ctx.strokeStyle=alpha(color,.22+p*.48);ctx.lineWidth=2+p*3.6;
      for(let i=0;i<5;i++){
        const r=outerR*(.14+i*.135+progress*.10);
        ctx.beginPath();ctx.arc(0,0,r,-.75+i*.40,2.35+i*.40);ctx.stroke();
      }
      ctx.fillStyle=alpha('#fff2fc',p*.32);
      ctx.beginPath();ctx.arc(-outerR*.13,-outerR*.17,outerR*.13,.5,Math.PI*1.79);ctx.fill();
    }else if(key==='skyPouncer'){
      const tx=top.relayBondCinemaTargetX-cx,ty=top.relayBondCinemaTargetY-cy;
      ctx.rotate(Math.atan2(ty,tx));
      ctx.strokeStyle=alpha('#dcfbff',.20+p*.50);ctx.lineWidth=2+p*4;
      for(let i=-4;i<=4;i++){
        ctx.beginPath();ctx.moveTo(-outerR*.82,i*12);ctx.quadraticCurveTo(0,i*6,outerR*.88,i*2);ctx.stroke();
      }
      for(let side=-1;side<=1;side+=2){
        ctx.beginPath();ctx.moveTo(-outerR*.04,side*8);ctx.lineTo(outerR*.26,side*58);ctx.lineTo(outerR*.10,side*11);ctx.stroke();
      }
    }else if(key==='bloodrageBerserker'){
      ctx.rotate(time*.20);
      ctx.strokeStyle=alpha('#ff704d',.20+p*.55);ctx.lineWidth=2+p*4.6;ctx.shadowColor='#ff2e1b';
      for(let i=0;i<18;i++){
        const a=i*Math.PI/9,r1=outerR*(.10+progress*.07),r2=outerR*(.42+(i%3)*.075);
        ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a+.07*Math.sin(i))*r2,Math.sin(a+.07*Math.sin(i))*r2);ctx.stroke();
      }
    }else if(key==='twinNova'){
      ctx.rotate(time*.30);
      ctx.strokeStyle=alpha(color,.20+p*.48);ctx.lineWidth=2+p*3.5;
      for(let i=0;i<2;i++){
        ctx.save();ctx.rotate(i*Math.PI);ctx.beginPath();ctx.ellipse(0,0,outerR*(.36+i*.08),outerR*.14,0,0,Math.PI*2);ctx.stroke();ctx.restore();
      }
      const r=outerR*.24;
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3;
        ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a+Math.PI/3)*r,Math.sin(a+Math.PI/3)*r);ctx.stroke();
      }
    }else if(key==='chronoClockEmperor'){
      ctx.rotate(-time*.075);
      ctx.strokeStyle=alpha(color,.22+p*.50);ctx.lineWidth=2+p*3.5;
      ctx.beginPath();ctx.arc(0,0,outerR*.70,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6;
        ctx.beginPath();ctx.moveTo(Math.cos(a)*outerR*.57,Math.sin(a)*outerR*.57);ctx.lineTo(Math.cos(a)*outerR*.70,Math.sin(a)*outerR*.70);ctx.stroke();
      }
      ctx.lineWidth=4+p*2;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(time*2.6)*outerR*.46,Math.sin(time*2.6)*outerR*.46);ctx.stroke();
      ctx.lineWidth=2.5+p;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(-time*.40)*outerR*.30,Math.sin(-time*.40)*outerR*.30);ctx.stroke();
    }else if(key==='taijiMysticWheel'){
      const yang=!!top.relayBondTaijiYang;
      ctx.rotate(time*(yang?.22:-.17));
      ctx.strokeStyle=alpha(yang?'#fff0a6':'#dce8ff',.22+p*.48);ctx.lineWidth=2+p*3.4;
      ctx.beginPath();ctx.arc(0,0,outerR*.50,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.arc(0,-outerR*.125,outerR*.25,Math.PI/2,Math.PI*1.5);ctx.arc(0,outerR*.125,outerR*.25,-Math.PI/2,Math.PI/2);ctx.stroke();
      ctx.fillStyle=alpha(yang?'#fff5c5':'#202943',.14+p*.22);
      ctx.beginPath();ctx.arc(0,-outerR*.24,outerR*.058,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(0,outerR*.24,outerR*.058,0,Math.PI*2);ctx.fill();
    }else if(key==='sevenfoldSwordSovereign'){
      ctx.strokeStyle=alpha('#eefaff',.22+p*.56);ctx.lineWidth=2+p*4.8;ctx.shadowColor=color;
      for(let i=-1;i<=1;i++){
        ctx.save();ctx.rotate(-.66+i*.62);ctx.beginPath();ctx.moveTo(-outerR*.64,-18*i);ctx.lineTo(outerR*.72,18*i);ctx.stroke();ctx.restore();
      }
      ctx.font=`1000 ${outerR*.25}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=alpha(color,.10+p*.26);ctx.fillText('劍',0,0);
    }else if(key==='omniObserver'){
      ctx.rotate(time*.13);
      ctx.strokeStyle=alpha(color,.20+p*.48);ctx.lineWidth=1.5+p*3.4;
      for(let r=1;r<=3;r++){ctx.beginPath();ctx.arc(0,0,outerR*(.18+r*.14),0,Math.PI*2);ctx.stroke()}
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*outerR*.11,Math.sin(a)*outerR*.11);ctx.lineTo(Math.cos(a)*outerR*.67,Math.sin(a)*outerR*.67);ctx.stroke();
      }
      ctx.strokeRect(-outerR*.32,-outerR*.32,outerR*.64,outerR*.64);
    }else if(key==='mirageChameleon'){
      ctx.strokeStyle=alpha(color,.16+p*.38);ctx.lineWidth=1.5+p*2.8;
      for(let i=0;i<13;i++){
        const a=i*2.399+time*.20,r=outerR*(.09+i*.052);
        ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,outerR*(.055+(i%3)*.02),0,Math.PI*2);ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawTopEnhancement(top){
    const p=clamp(top.relayBondCinema||0,0,1);
    const hit=clamp(top.relayBondEnhancedHit||0,0,1);
    if(p<=0&&hit<=0)return;
    const color=top.relayBondCinemaColor||top.relayBondEnhancedHitColor||'#fff';

    ctx.save();ctx.translate(top.x,top.y);ctx.globalCompositeOperation='screen';ctx.shadowColor=color;ctx.shadowBlur=18;
    if(p>0){
      ctx.strokeStyle=alpha(color,.28+p*.58);ctx.lineWidth=1.8+p*4;
      for(let i=0;i<4;i++){
        ctx.beginPath();ctx.arc(0,0,top.r*(1.10+(1-p)*(.34+i*.24)),0,Math.PI*2);ctx.stroke();
      }
      ctx.font=`1000 ${Math.max(13,top.r*.40)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=alpha('#fff',.58+p*.42);
      ctx.fillText(top.relayBondCinemaGlyph||'技',0,-top.r*1.75);
    }
    if(hit>0){
      ctx.strokeStyle=alpha(top.relayBondEnhancedHitColor||color,hit*.82);ctx.lineWidth=2+hit*4;
      for(let i=0;i<3;i++){
        ctx.beginPath();ctx.arc(0,0,top.r*(1.02+(1-hit)*(.52+i*.28)),0,Math.PI*2);ctx.stroke();
      }
      ctx.font=`1000 ${Math.max(12,top.r*.36)}px system-ui`;ctx.fillStyle=alpha('#fff',hit*.88);
      ctx.fillText(top.relayBondEnhancedHitGlyph||'印',0,0);
    }
    ctx.restore();
  }

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){
      super(index,data);
      this.relayBondCinema=0;
      this.relayBondEnhancedHit=0;
      this.relayBondCinemaKey='';
      this.relayBondCinemaColor='';
      this.relayBondCinemaGlyph='';
      this.relayBondCinemaTargetX=this.x;
      this.relayBondCinemaTargetY=this.y;
    }
    update(dt,opponent){
      const previousSkill=this.relayBondSkillPulse||0;
      const previousHit=this.relayBondHitPulse||0;
      super.update(dt,opponent);

      const currentSkill=this.relayBondSkillPulse||0;
      const currentHit=this.relayBondHitPulse||0;
      if(this.relayCoreBondData&&currentSkill>.92&&previousSkill<.78)activateCinematic(this,this.relayCoreBondData);
      if(currentHit>.92&&previousHit<.75){
        this.relayBondEnhancedHit=1;
        this.relayBondEnhancedHitColor=this.relayBondHitColor||this.relayBondColor||'#fff';
        this.relayBondEnhancedHitGlyph=this.relayBondHitGlyph||'印';
      }
      this.relayBondCinema=Math.max(0,(this.relayBondCinema||0)-dt*.68);
      this.relayBondEnhancedHit=Math.max(0,(this.relayBondEnhancedHit||0)-dt*1.18);
    }
    draw(){
      drawArenaScene(this);
      super.draw();
      drawTopEnhancement(this);
    }
  };

  const style=document.createElement('style');
  style.textContent=`
    .relay-bond-announcer{--announce-color:#8fe8ff;position:absolute;z-index:8;left:50%;top:11%;display:flex;align-items:center;gap:11px;min-width:min(80%,370px);padding:12px 16px;border:1px solid color-mix(in srgb,var(--announce-color) 68%,transparent);border-radius:17px;background:linear-gradient(135deg,color-mix(in srgb,var(--announce-color) 27%,#07101f),#050914ed);box-shadow:0 16px 44px #000c,0 0 34px color-mix(in srgb,var(--announce-color) 30%,transparent),inset 0 0 26px color-mix(in srgb,var(--announce-color) 10%,transparent);opacity:0;pointer-events:none;transform:translate(-50%,-22px) scale(.82);filter:blur(6px)}
    .relay-bond-announcer.show{animation:relayBondAnnounceV2 1.45s cubic-bezier(.18,.8,.2,1)}
    .relay-bond-announcer-icon{display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;border-radius:50%;border:1px solid #ffffff90;background:radial-gradient(circle at 35% 28%,#fff,color-mix(in srgb,var(--announce-color) 76%,#172036) 42%,#080d18 75%);color:#fff;font-size:18px;font-weight:1000;text-shadow:0 2px 8px #000;box-shadow:0 0 25px color-mix(in srgb,var(--announce-color) 60%,transparent)}
    .relay-bond-announcer small{display:block;color:#cbd6e9;font-size:9px;letter-spacing:.14em}.relay-bond-announcer strong{display:block;margin:1px 0;color:#fff;font-size:18px;letter-spacing:.06em;text-shadow:0 0 14px var(--announce-color)}.relay-bond-announcer span{display:block;color:color-mix(in srgb,var(--announce-color) 58%,white);font-size:10px;font-weight:900}
    @keyframes relayBondAnnounceV2{0%{opacity:0;transform:translate(-50%,-25px) scale(.72);filter:blur(8px)}13%{opacity:1;transform:translate(-50%,0) scale(1.06);filter:blur(0)}68%{opacity:1;transform:translate(-50%,0) scale(1);filter:blur(0)}100%{opacity:0;transform:translate(-50%,12px) scale(.94);filter:blur(3px)}}
    @media(max-width:660px){.relay-bond-announcer{top:7%;min-width:90%;padding:10px 12px}.relay-bond-announcer-icon{width:38px;height:38px;flex-basis:38px}.relay-bond-announcer strong{font-size:15px}}
  `;
  document.head.appendChild(style);
  document.documentElement.dataset.relayBondVisualEnhancement='v1';
})();
