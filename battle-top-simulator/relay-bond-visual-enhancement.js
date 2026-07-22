/* Relay Bond Visual Enhancement V2: restrained top-origin skill effects */
(() => {
  const api=window.__relayTeamSynergy;
  if(!api)return;

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

  function activateEffect(source,bond){
    const target=nearestEnemy(source);
    source.relayBondLocalFx=1;
    source.relayBondLocalKey=bond.key;
    source.relayBondLocalColor=bond.color||'#8fe8ff';
    source.relayBondLocalName=bond.skill||'';
    source.relayBondLocalTarget=target||null;
    source.relayBondLocalTargetX=target?.x??source.x;
    source.relayBondLocalTargetY=target?.y??source.y;

    const strong=bond.key==='bloodrageBerserker'||bond.key==='sevenfoldSwordSovereign';
    shake=Math.max(shake,strong?3.2:1.4);
    flash=Math.max(flash,strong?.055:.025);
    wave(source.x,source.y,bond.color||'#fff',source.r*2.4);
    emit(source.x,source.y,bond.color||'#fff',strong?16:10,.52,'streak');

    if(target){
      target.relayBondLocalHit=1;
      target.relayBondLocalHitColor=bond.color||'#fff';
    }
  }

  function directionToTarget(top){
    const tx=top.relayBondLocalTarget?.x??top.relayBondLocalTargetX??top.x;
    const ty=top.relayBondLocalTarget?.y??top.relayBondLocalTargetY??top.y;
    const dx=tx-top.x,dy=ty-top.y,d=mag(dx,dy)||1;
    return {dx,dy,d,nx:dx/d,ny:dy/d,angle:Math.atan2(dy,dx)};
  }

  function drawSourceEffect(top){
    const p=clamp(top.relayBondLocalFx||0,0,1);
    if(p<=0)return;
    const key=top.relayBondLocalKey,color=top.relayBondLocalColor||'#fff';
    const progress=1-p,dir=directionToTarget(top),r=top.r;

    ctx.save();
    ctx.translate(top.x,top.y);
    ctx.globalCompositeOperation='screen';
    ctx.shadowColor=color;ctx.shadowBlur=10+p*8;
    ctx.strokeStyle=alpha(color,.18+p*.46);
    ctx.fillStyle=alpha(color,.08+p*.16);
    ctx.lineWidth=1.2+p*2.2;

    if(key==='enchantressSiren'){
      ctx.rotate(-time*.9);
      for(let i=0;i<3;i++){
        const rr=r*(1.25+i*.42+progress*.28);
        ctx.beginPath();ctx.arc(0,0,rr,-.85+i*.55,1.75+i*.55);ctx.stroke();
      }
      ctx.rotate(time*.9+dir.angle);
      ctx.beginPath();ctx.moveTo(r*.7,0);ctx.quadraticCurveTo(Math.min(dir.d*.45,r*4),-r*.7,Math.min(dir.d*.72,r*7),0);ctx.stroke();
    }else if(key==='skyPouncer'){
      ctx.rotate(dir.angle);
      for(const side of [-1,1]){
        ctx.beginPath();ctx.moveTo(-r*.18,side*r*.12);ctx.quadraticCurveTo(r*.85,side*r*1.0,r*1.8,side*r*.32);ctx.stroke();
      }
      for(let i=-1;i<=1;i++){
        ctx.globalAlpha=.45+p*.45;ctx.beginPath();ctx.moveTo(r*.55,i*r*.18);ctx.lineTo(Math.min(dir.d*.76,r*7),i*r*.08);ctx.stroke();
      }
    }else if(key==='bloodrageBerserker'){
      ctx.rotate(time*.7);
      for(let i=0;i<10;i++){
        const a=i*Math.PI/5;
        ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.9,Math.sin(a)*r*.9);ctx.lineTo(Math.cos(a)*r*(1.65+p*.65),Math.sin(a)*r*(1.65+p*.65));ctx.stroke();
      }
      ctx.beginPath();ctx.arc(0,0,r*(1.2+progress*.75),0,Math.PI*2);ctx.stroke();
    }else if(key==='twinNova'){
      ctx.rotate(time*.6);
      for(let i=0;i<2;i++){
        ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.ellipse(0,0,r*(1.55+i*.18),r*(.52+i*.07),0,0,Math.PI*2);ctx.stroke();ctx.restore();
      }
      ctx.beginPath();
      for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6,x=Math.cos(a)*r*.9,y=Math.sin(a)*r*.9;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}
      ctx.closePath();ctx.stroke();
    }else if(key==='chronoClockEmperor'){
      ctx.beginPath();ctx.arc(0,0,r*1.65,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*1.34,Math.sin(a)*r*1.34);ctx.lineTo(Math.cos(a)*r*1.62,Math.sin(a)*r*1.62);ctx.stroke();
      }
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(time*3.8)*r*1.15,Math.sin(time*3.8)*r*1.15);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(-time*.8)*r*.75,Math.sin(-time*.8)*r*.75);ctx.stroke();
    }else if(key==='taijiMysticWheel'){
      const yang=!!top.relayBondTaijiYang;
      ctx.rotate(time*(yang?.55:-.42));
      ctx.strokeStyle=alpha(yang?'#fff0ad':'#dce9ff',.2+p*.5);
      ctx.beginPath();ctx.arc(0,0,r*1.6,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.arc(0,-r*.4,r*.8,Math.PI/2,Math.PI*1.5);ctx.arc(0,r*.4,r*.8,-Math.PI/2,Math.PI/2);ctx.stroke();
      ctx.beginPath();ctx.arc(0,-r*.78,r*.13,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(0,r*.78,r*.13,0,Math.PI*2);ctx.fill();
    }else if(key==='sevenfoldSwordSovereign'){
      ctx.rotate(dir.angle);
      for(let i=-1;i<=1;i++){
        ctx.save();ctx.translate(0,i*r*.32);ctx.rotate(i*.10);
        ctx.beginPath();ctx.moveTo(-r*.7,0);ctx.lineTo(Math.min(dir.d*.75,r*7),0);ctx.stroke();ctx.restore();
      }
    }else if(key==='omniObserver'){
      ctx.rotate(time*.35);
      for(let i=1;i<=2;i++){ctx.beginPath();ctx.arc(0,0,r*(1.05+i*.42),0,Math.PI*2);ctx.stroke()}
      for(let i=0;i<4;i++){
        const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.72,Math.sin(a)*r*.72);ctx.lineTo(Math.cos(a)*r*1.9,Math.sin(a)*r*1.9);ctx.stroke();
      }
      ctx.rotate(-time*.35+dir.angle);ctx.globalAlpha=.35+p*.45;ctx.beginPath();ctx.moveTo(r*1.15,0);ctx.lineTo(Math.min(dir.d*.62,r*5),0);ctx.stroke();
    }else if(key==='mirageChameleon'){
      const vx=top.vx||0,vy=top.vy||0,v=mag(vx,vy)||1,nx=-vx/v,ny=-vy/v;
      for(let i=1;i<=4;i++){
        ctx.globalAlpha=(.13+p*.24)*(1-i*.14);
        ctx.beginPath();ctx.arc(nx*r*.55*i,ny*r*.55*i,r*(1-i*.07),0,Math.PI*2);ctx.stroke();
      }
      ctx.globalAlpha=.22+p*.30;ctx.beginPath();ctx.arc(0,0,r*(1.25+progress*.5),0,Math.PI*2);ctx.stroke();
    }

    ctx.restore();
  }

  function drawHitEffect(top){
    const hit=clamp(top.relayBondLocalHit||0,0,1);
    if(hit<=0)return;
    const color=top.relayBondLocalHitColor||'#fff',progress=1-hit;
    ctx.save();ctx.translate(top.x,top.y);ctx.globalCompositeOperation='screen';ctx.shadowColor=color;ctx.shadowBlur=8;
    ctx.strokeStyle=alpha(color,.18+hit*.45);ctx.lineWidth=1+hit*2;
    for(let i=0;i<2;i++){
      ctx.beginPath();ctx.arc(0,0,top.r*(1.05+progress*(.45+i*.28)),0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){
      super(index,data);
      this.relayBondLocalFx=0;
      this.relayBondLocalHit=0;
      this.relayBondLocalKey='';
      this.relayBondLocalColor='';
      this.relayBondLocalName='';
      this.relayBondLocalTarget=null;
      this.relayBondLocalTargetX=this.x;
      this.relayBondLocalTargetY=this.y;
    }
    update(dt,opponent){
      const previousSkill=this.relayBondSkillPulse||0;
      const previousHit=this.relayBondHitPulse||0;
      super.update(dt,opponent);
      const currentSkill=this.relayBondSkillPulse||0;
      const currentHit=this.relayBondHitPulse||0;
      if(this.relayCoreBondData&&currentSkill>.92&&previousSkill<.78)activateEffect(this,this.relayCoreBondData);
      if(currentHit>.92&&previousHit<.75){
        this.relayBondLocalHit=1;
        this.relayBondLocalHitColor=this.relayBondHitColor||this.relayBondColor||'#fff';
      }
      this.relayBondLocalFx=Math.max(0,(this.relayBondLocalFx||0)-dt*1.12);
      this.relayBondLocalHit=Math.max(0,(this.relayBondLocalHit||0)-dt*1.55);
      if(this.relayBondLocalTarget&&!active(this.relayBondLocalTarget))this.relayBondLocalTarget=null;
    }
    draw(){
      super.draw();
      drawSourceEffect(this);
      drawHitEffect(this);
    }
  };

  document.querySelectorAll('.relay-bond-announcer').forEach(node=>node.remove());
  document.documentElement.dataset.relayBondVisualEnhancement='v2';
})();
