/* Sky Pouncer Endurance V1: reduced flight drain, landing recovery, and reserve takeoff */
(() => {
  const KEY='skyPouncer';
  const FLIGHT_STATES=new Set(['climb','orbit','air','direct']);

  function tuneConfig(c){
    if(!c||(!c.skyPouncer&&c.preset!==KEY))return;
    c.s=88;
    c.d=Math.max(c.d||0,72);
    c.b=Math.max(c.b||0,90);
    c.rank='三段飛行戰術・高續航翼核';
    c.skyEnduranceCore=true;
  }
  if(metaPresets?.[KEY])tuneConfig(metaPresets[KEY]);
  if(typeof cfg==='object'){tuneConfig(cfg.p1);tuneConfig(cfg.p2)}
  if(Array.isArray(tops))tops.forEach(top=>tuneConfig(top?.c||top));

  const teamOf=top=>top?.teamIndex??(top?.index?1:0);
  const activeEnemy=(source,preferred)=>{
    const valid=target=>!!target&&target!==source&&teamOf(target)!==teamOf(source)&&!target.out&&!target.burst&&!target.phaseInvisible&&!target.skyJumpGhost&&(target.energy||0)>0;
    if(valid(preferred))return preferred;
    let best=null,bestD=Infinity;
    if(Array.isArray(tops))tops.forEach(target=>{
      if(!valid(target))return;
      const d=mag(target.x-source.x,target.y-source.y);
      if(d<bestD){best=target;bestD=d}
    });
    return best;
  };
  const restoreExpectedSpin=(top,before,rate,dt,fraction)=>{
    const start=Math.abs(before||0);
    if(!start)return;
    const expected=start*Math.exp(-rate*dt);
    const refund=Math.max(0,start-expected)*fraction;
    const current=Math.abs(top.omega||0);
    const sign=Math.sign(top.omega)||Math.sign(before)||1;
    const cap=Math.max(start,Math.abs(top.omega0||start)*1.12);
    top.omega=sign*Math.min(cap,current+refund);
    top.spin=top.omega;
  };

  const previousRenderPanel=renderPanel;
  renderPanel=function(id){
    previousRenderPanel(id);
    const host=document.querySelector('#'+id),c=cfg[id];
    if(!host||!c?.skyPouncer)return;
    const box=host.querySelector('.sky-pouncer-ability');
    if(box)box.innerHTML='<strong>飛鷹三式・高續航翼核</strong>提升耐力並降低盤旋與空中飛行的能量、角速度消耗；每次安全落地可回收少量飛行能量，低能量時仍可動用一次較低門檻的預備升空。<div class="combo-tags"><span>耐力提升</span><span>飛行耗能降低</span><span>落地回收</span><span>預備升空</span></div>';
  };

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){
      super(index,data);
      this.skyEndurancePulse=0;
      this.skyReserveFlightCount=0;
      this.skyLastRecoveryCount=this.skyJumpCount||0;
    }
    updateSkyOrbit(dt,opponent){
      if(!this.c?.skyPouncer)return super.updateSkyOrbit(dt,opponent);
      const beforeOmega=this.omega||0;
      super.updateSkyOrbit(dt,opponent);
      this.energy=clamp((this.energy||0)+dt*1.45*.46,0,100);
      restoreExpectedSpin(this,beforeOmega,.055,dt,.52);
    }
    updateSkyAir(dt,opponent){
      if(!this.c?.skyPouncer)return super.updateSkyAir(dt,opponent);
      const beforeOmega=this.omega||0;
      const height=this.skyJumpHeight||0;
      const mode=this.skyStrikeMode;
      super.updateSkyAir(dt,opponent);
      const airCost=mode==='grand'?1.85:1.05;
      this.energy=clamp((this.energy||0)+dt*(airCost+height*.75)*.43,0,100);
      restoreExpectedSpin(this,beforeOmega,mode==='grand'?.060:.045,dt,.50);
    }
    launchSkyDirectAttack(opponent){
      if(!this.c?.skyPouncer)return super.launchSkyDirectAttack(opponent);
      const beforeEnergy=this.energy||0;
      super.launchSkyDirectAttack(opponent);
      const spent=Math.max(0,beforeEnergy-(this.energy||0));
      if(spent>0)this.energy=clamp(this.energy+spent*.40,0,100);
    }
    landSkyDive(opponent){
      if(!this.c?.skyPouncer)return super.landSkyDive(opponent);
      const mode=this.skyStrikeMode;
      const beforeCount=this.skyJumpCount||0;
      super.landSkyDive(opponent);
      if((this.skyJumpCount||0)>beforeCount){
        const recovery=mode==='grand'?1.65:1.35;
        this.energy=clamp((this.energy||0)+recovery,0,100);
        this.skyJumpCooldown=Math.max(1.85,(this.skyJumpCooldown||0)-.70);
        this.skyEndurancePulse=1;
        emit(this.x,this.y,this.c.primary,16,.52,'streak');
        wave(this.x,this.y,this.c.accent,38);
      }
    }
    updateSkyDirect(dt,opponent){
      if(!this.c?.skyPouncer)return super.updateSkyDirect(dt,opponent);
      const beforeCount=this.skyJumpCount||0;
      super.updateSkyDirect(dt,opponent);
      if((this.skyJumpCount||0)>beforeCount){
        this.energy=clamp((this.energy||0)+.85,0,100);
        this.skyJumpCooldown=Math.max(1.75,(this.skyJumpCooldown||0)-.55);
        this.skyEndurancePulse=1;
      }
    }
    update(dt,opponent){
      const beforeState=this.skyJumpState;
      super.update(dt,opponent);
      this.skyEndurancePulse=Math.max(0,(this.skyEndurancePulse||0)-dt*1.35);
      if(!this.c?.skyPouncer||this.out||this.burst)return;

      if(this.skyJumpState==='idle'&&!FLIGHT_STATES.has(beforeState)){
        this.energy=clamp((this.energy||0)+dt*.16,0,100);
        this.tiltVel*=Math.exp(-.18*dt);
      }

      if(this.skyJumpState==='idle'&&(this.energy||0)>22&&(this.energy||0)<=28&&Math.abs(this.omega||0)>16){
        const target=activeEnemy(this,opponent);
        if(target){
          this.skyJumpCooldown-=dt;
          if(this.skyJumpCooldown<=0){
            this.beginSkyClimb(target);
            this.skyReserveFlightCount=(this.skyReserveFlightCount||0)+1;
            this.skyEndurancePulse=1;
            addLog(`${this.c.name} 啟動高續航翼核，以預備能量再次升空！`);
          }
        }
      }
    }
    draw(){
      super.draw();
      if(!this.c?.skyPouncer||this.out||this.burst||(this.skyEndurancePulse||0)<=0)return;
      const p=clamp(this.skyEndurancePulse,0,1),pulse=.5+.5*Math.sin(time*8.4);
      ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';ctx.rotate(-time*.65);
      ctx.strokeStyle=alpha(this.c.primary,.22+.42*p);ctx.lineWidth=1.3+1.6*p;ctx.shadowBlur=14;ctx.shadowColor=this.c.primary;
      for(let i=0;i<3;i++){
        const a=i*Math.PI*2/3,r=this.r*(1.25+.18*(1-p)+pulse*.04);
        ctx.beginPath();ctx.arc(Math.cos(a)*r*.18,Math.sin(a)*r*.18,r,a-.42,a+.42);ctx.stroke();
      }
      ctx.restore();
    }
  };

  const style=document.createElement('style');
  style.textContent='.sky-pouncer-ability{border-color:#54e7ff77!important;background:radial-gradient(circle at 80% 15%,#fff2a614,transparent 35%),linear-gradient(135deg,#36d8ff18,#ff9f4314)!important;box-shadow:inset 0 0 25px #36d8ff10!important}';
  document.head.appendChild(style);
  ['p1','p2'].forEach(id=>{if(cfg?.[id]?.skyPouncer)renderPanel(id)});
  const log=document.querySelector('#log');
  if(log)log.textContent='天墜獵鷹完成續航強化：耐力提升、空中耗能與耗轉下降，落地可回收能量並在低能量時啟動預備升空。';
  document.documentElement.dataset.skyPouncerEndurance='v1';
})();