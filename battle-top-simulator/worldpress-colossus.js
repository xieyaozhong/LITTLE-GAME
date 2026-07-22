/* Relay-exclusive double-slot top: one colossal top occupies both relay positions */
(() => {
  const KEY='worldpressColossus';
  const COLOSSUS={
    label:'[RELAY EXCLUSIVE] 鎮界巨神｜Worldpress Colossus',
    name:'鎮界巨神',englishName:'Worldpress Colossus',
    combo:'2-Slot 0-90 Dominion Disk',
    rank:'雙棒占用・重心鎮場・天墜三震',
    tier:'SPECIAL',type:'defense',
    a:88,d:96,s:82,w:100,b:98,spin:'R',shape:'worldpressColossus',
    relayOnly:true,relayDoubleSlot:true,juggernautEngine:true,
    primary:'#8f6dff',secondary:'#252142',accent:'#ffd978',metal:'#d9d6e8'
  };
  metaPresets[KEY]=COLOSSUS;

  const active=top=>!!top&&!top.out&&!top.burst&&!top.skyStaminaDefeated&&!top.skyEnergyDepletedLatch&&(top.energy||0)>0;
  const teamOf=top=>top?.teamIndex??(top?.index?1:0);
  const rebuildBody=top=>{
    if(!top?.c?.juggernautEngine)return;
    top.r*=1.52;
    if(Number.isFinite(top.mass)){
      top.mass*=1.72;
      top.invMass=1/top.mass;
      top.inertia=top.mass*top.r*top.r*.62;
      top.invInertia=1/top.inertia;
    }
    top.baseTilt=Math.min(top.baseTilt||.08,.055);
    top.tilt=Math.min(top.tilt||.08,.075);
  };

  const previousRenderPanel=renderPanel;
  renderPanel=function(id){
    previousRenderPanel(id);
    const host=document.querySelector('#'+id),c=cfg[id];
    if(!host||!c?.juggernautEngine)return;
    const combo=host.querySelector('.combo-box');
    const ability=document.createElement('div');
    ability.className='combo-box colossus-ability';
    ability.innerHTML='<strong>雙棒限定・鎮界重軀</strong>超大直徑與高慣量讓巨神更容易守住競技盤中央。它會原地躍起，以落點為中心依序釋放三道震波；也可能張開逆時針氣旋，依對手轉速與技能姿態改變牽引力。<div class="combo-tags"><span>重心回中</span><span>原地躍震</span><span>三連波前</span><span>逆潮氣旋</span></div>';
    if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
  };

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){
      super(index,data);
      this.colossusPressurePulse=0;
      this.colossusImpactLock=0;
      rebuildBody(this);
    }
    bladeCount(){
      if(this.c.shape==='worldpressColossus')return 8;
      return super.bladeCount();
    }
    bladeRadius(i){
      if(this.c.shape==='worldpressColossus'){
        const profile=[1.16,.92,1.08,.84,1.13,.90,1.05,.86];
        return this.r*profile[i%profile.length];
      }
      return super.bladeRadius(i);
    }
    update(dt,opponent){
      super.update(dt,opponent);
      this.colossusPressurePulse=Math.max(0,(this.colossusPressurePulse||0)-dt*.75);
      this.colossusImpactLock=Math.max(0,(this.colossusImpactLock||0)-dt);
      if(!this.c?.juggernautEngine||!active(this))return;

      const heavy=clamp(((this.mass||1.45)-1.45)/1.55,0,1);
      this.vx*=Math.exp(-(.12+.10*heavy)*dt);
      this.vy*=Math.exp(-(.12+.10*heavy)*dt);
      this.energy=Math.max(0,(this.energy||0)-dt*.20);
      this.tiltVel*=Math.exp(-.28*dt);

      const cx=W/2,cy=H/2,cdx=cx-this.x,cdy=cy-this.y,centerD=mag(cdx,cdy)||1;
      const dead=this.r*.65;
      if(centerD>dead){
        const inwardX=cdx/centerD,inwardY=cdy/centerD,q=clamp((centerD-dead)/Math.max(1,innerR-dead),0,1);
        const accel=(6+34*q*q)*(.78+.22*heavy)*(this.colossusVortexActive?1.16:1);
        const outwardSpeed=Math.max(0,-(this.vx*inwardX+this.vy*inwardY));
        const reject=outwardSpeed*(1-Math.exp(-(.38+.28*heavy)*dt));
        this.vx+=inwardX*(accel*dt+reject);
        this.vy+=inwardY*(accel*dt+reject);
      }
    }
    draw(){
      if(this.c?.juggernautEngine&&!this.out&&!this.burst&&(this.colossusSkillState||'idle')==='idle'){
        const p=Math.max(.18,this.colossusPressurePulse||0);
        ctx.save();
        ctx.translate(this.x,this.y);
        ctx.globalCompositeOperation='screen';
        const aura=ctx.createRadialGradient(0,0,this.r*.65,0,0,this.r*(3.1+p*.8));
        aura.addColorStop(0,alpha(this.c.primary,.10+p*.12));
        aura.addColorStop(.45,alpha(this.c.secondary,.08+p*.08));
        aura.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=aura;
        ctx.beginPath();ctx.arc(0,0,this.r*(3.1+p*.8),0,Math.PI*2);ctx.fill();
        ctx.restore();
      }
      super.draw();
      if(!this.c?.juggernautEngine||this.out||this.burst)return;
      const jump=clamp(Number(this.colossusJumpHeight)||0,0,.74),lift=jump*this.r,scale=1+jump/.74*.02;
      ctx.save();
      ctx.translate(this.x,this.y-lift);ctx.scale(scale,scale);
      ctx.rotate((this.angle||0)*-.055);
      ctx.globalCompositeOperation='screen';
      ctx.fillStyle=alpha(this.c.accent,.48);ctx.shadowBlur=8;ctx.shadowColor=this.c.accent;
      for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.translate(this.r*.67,0);ctx.fillRect(-this.r*.13,-this.r*.045,this.r*.26,this.r*.09);ctx.restore()}
      ctx.restore();
    }
  };

  function applyCrush(attacker,victim,nx,ny,closing){
    if(!attacker?.c?.juggernautEngine||!active(attacker)||!active(victim)||attacker.colossusImpactLock>0)return;
    const weightRatio=clamp((attacker.mass||2)/Math.max(.5,victim.mass||1),1,2.5);
    const force=(26+closing*.12)*weightRatio;
    victim.vx+=nx*force;
    victim.vy+=ny*force;
    victim.energy=Math.max(0,(victim.energy||0)-(1.2+closing*.006)*weightRatio);
    victim.omega*=clamp(.975-weightRatio*.012,.94,.965);victim.spin=victim.omega;
    victim.tiltVel+=(.075+closing*.00035)*weightRatio/Math.max(.72,victim.tip?.stability||1);
    victim.lift=clamp((victim.lift||0)+.045*weightRatio,0,1);
    victim.burstMeter=(victim.burstMeter||0)+1.2*weightRatio;
    attacker.vx*=.91;attacker.vy*=.91;
    attacker.colossusImpactLock=.18;
    attacker.colossusPressurePulse=1;
    shake=Math.max(shake,9.5);flash=Math.max(flash,.26);
  }

  const previousCollide=collide;
  collide=function(a,b){
    const same=teamOf(a)===teamOf(b);
    const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=(a.r||0)+(b.r||0);
    let contact=false,nx=0,ny=0,closing=0;
    if(!same&&d&&d<min&&!a?.phaseInvisible&&!b?.phaseInvisible&&!a?.skyJumpGhost&&!b?.skyJumpGhost){
      nx=dx/d;ny=dy/d;
      closing=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny);
      contact=closing>0;
    }
    previousCollide(a,b);
    if(!contact)return;
    applyCrush(a,b,nx,ny,closing);
    applyCrush(b,a,-nx,-ny,closing);
  };

  const style=document.createElement('style');
  style.textContent=`
    .colossus-ability{border-color:#8f6dff66!important;background:radial-gradient(circle at 80% 0,#ffd97817,transparent 35%),linear-gradient(145deg,#8f6dff18,#171329)!important;box-shadow:inset 0 0 30px #8f6dff12!important}
    option[value="${KEY}"]{font-weight:900}
  `;
  document.head.appendChild(style);
  document.documentElement.dataset.worldpressColossus='v2';
})();
