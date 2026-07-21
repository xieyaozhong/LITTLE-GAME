/* Relay-exclusive double-slot top: one colossal top occupies both relay positions */
(() => {
  const KEY='worldpressColossus';
  const COLOSSUS={
    label:'[RELAY EXCLUSIVE] 鎮界巨神｜Worldpress Colossus',
    name:'鎮界巨神',englishName:'Worldpress Colossus',
    combo:'2-Slot 0-90 Dominion Disk',
    rank:'雙棒占用・巨軀鎮壓・無後援',
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
    ability.innerHTML='<strong>雙棒限定・鎮界重軀</strong>只可在雙打車輪戰作為先鋒選擇，單顆直接占用第 1 棒與第 2 棒。超大直徑與高慣量形成近身壓迫場，碰撞時以重量壓制、推退並破壞穩定；代價是沒有後援、沒有傳承，且機動與自然續航較低。<div class="combo-tags"><span>占用兩棒</span><span>超大體型</span><span>重壓場</span><span>無後援</span></div>';
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

      this.vx*=Math.exp(-.055*dt);
      this.vy*=Math.exp(-.055*dt);
      this.energy=Math.max(0,(this.energy||0)-dt*.20);
      this.tiltVel*=Math.exp(-.28*dt);

      const cx=W/2,cy=H/2,cdx=cx-this.x,cdy=cy-this.y,centerD=mag(cdx,cdy)||1;
      if(centerD>innerR*.48){
        this.vx+=cdx/centerD*13*dt;
        this.vy+=cdy/centerD*13*dt;
      }

      const range=this.r*6.2;
      if(Array.isArray(tops))tops.forEach(enemy=>{
        if(enemy===this||teamOf(enemy)===teamOf(this)||!active(enemy)||enemy.phaseInvisible||enemy.skyJumpGhost)return;
        const dx=enemy.x-this.x,dy=enemy.y-this.y,d=mag(dx,dy)||1;
        if(d>=range)return;
        const pressure=Math.pow(1-d/range,1.35);
        const damping=Math.exp(-.34*pressure*dt);
        enemy.vx*=damping;enemy.vy*=damping;
        enemy.tiltVel+=(Math.sign(enemy.omega)||1)*.065*pressure*dt/Math.max(.72,enemy.tip?.stability||1);
        enemy.energy=Math.max(0,(enemy.energy||0)-.16*pressure*dt);
        this.colossusPressurePulse=Math.max(this.colossusPressurePulse,pressure*.7);
      });
    }
    draw(){
      if(this.c?.juggernautEngine&&!this.out&&!this.burst){
        const pulse=.5+.5*Math.sin(time*3.8),p=Math.max(.18,this.colossusPressurePulse||0);
        ctx.save();
        ctx.translate(this.x,this.y);
        ctx.globalCompositeOperation='screen';
        const aura=ctx.createRadialGradient(0,0,this.r*.65,0,0,this.r*(3.1+p*.8));
        aura.addColorStop(0,alpha(this.c.primary,.10+p*.12));
        aura.addColorStop(.45,alpha(this.c.secondary,.08+p*.08));
        aura.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=aura;
        ctx.beginPath();ctx.arc(0,0,this.r*(3.1+p*.8),0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=alpha(this.c.accent,.20+pulse*.12+p*.18);
        ctx.lineWidth=1.5+p*2;
        ctx.shadowBlur=18;ctx.shadowColor=this.c.primary;
        ctx.beginPath();ctx.arc(0,0,this.r*(1.38+pulse*.045),0,Math.PI*2);ctx.stroke();
        ctx.restore();
      }
      super.draw();
      if(!this.c?.juggernautEngine||this.out||this.burst)return;
      ctx.save();
      ctx.translate(this.x,this.y);
      ctx.rotate(-time*.22);
      ctx.globalCompositeOperation='screen';
      ctx.strokeStyle=alpha(this.c.accent,.66);
      ctx.lineWidth=Math.max(1.4,this.r*.065);
      ctx.setLineDash([this.r*.22,this.r*.11]);
      ctx.beginPath();ctx.arc(0,0,this.r*.74,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);
      ctx.font=`1000 ${Math.max(9,this.r*.34)}px system-ui`;
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='#fff7dc';ctx.shadowBlur=12;ctx.shadowColor=this.c.accent;
      ctx.fillText('Ⅱ',0,0);
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
    const x=(attacker.x+victim.x)/2,y=(attacker.y+victim.y)/2;
    emit(x,y,attacker.c.accent,34,1.0,'streak');
    wave(x,y,attacker.c.primary,78);
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
  document.documentElement.dataset.worldpressColossus='v1';
})();