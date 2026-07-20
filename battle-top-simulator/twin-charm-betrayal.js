/* Twin Nova charm betrayal V1: one split core defects to the Siren's side and attacks its twin */
(() => {
 const isTwinUnit=top=>!!top&&(top.splitPart==='α'||top.splitPart==='β')&&(top.c?.shape==='twinNova'||top.c?.shape==='twinNovaChild');
 const teamOf=top=>top?.teamIndex??(top?.index?1:0);
 const combatReady=top=>!!top&&!top.out&&!top.burst&&!top.phaseInvisible&&!top.skyJumpGhost&&top.energy>0;
 const nativeTeamOf=top=>top?.twinNativeTeam??teamOf(top);

 function twinPartner(top){
  if(!isTwinUnit(top))return null;
  const opposite=top.splitPart==='α'?'β':'α';
  let best=null,bestDelta=Infinity;
  tops.forEach(other=>{
   if(other===top||!isTwinUnit(other)||other.splitPart!==opposite||nativeTeamOf(other)!==nativeTeamOf(top))return;
   const delta=Math.abs((other.splitBornAt??-99)-(top.splitBornAt??-99));
   if(delta<bestDelta){best=other;bestDelta=delta}
  });
  return bestDelta<=.35?best:null;
 }

 function formerAllyTarget(top,preferred){
  const partner=twinPartner(top);
  if(combatReady(partner))return partner;
  if(combatReady(preferred)&&nativeTeamOf(preferred)===nativeTeamOf(top)&&teamOf(preferred)!==teamOf(top))return preferred;
  let best=null,bestScore=Infinity;
  tops.forEach(target=>{
   if(target===top||!combatReady(target)||nativeTeamOf(target)!==nativeTeamOf(top)||teamOf(target)===teamOf(top))return;
   const distance=mag(target.x-top.x,target.y-top.y);
   const score=distance-(100-clamp(target.energy||0,0,100))*.18;
   if(score<bestScore){best=target;bestScore=score}
  });
  return best;
 }

 function enhancePanel(id){
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.splitTop)return;
  const ability=host.querySelector('.split-ability');
  if(!ability)return;
  ability.innerHTML='<strong>雙生繼承・月蝕叛核</strong>分裂後若其中一顆星核遭到魅惑，被選中的 α 或 β 會暫時背叛原隊並加入魅月海妖陣營，主動攻擊另一顆星核。魅惑解除後才會恢復原本陣營。<div class="combo-tags"><span>魅惑叛變</span><span>攻擊同胞</span><span>陣營轉換</span><span>解除後歸隊</span></div>';
 }
 const previousRenderPanel=renderPanel;
 renderPanel=function(id){previousRenderPanel(id);enhancePanel(id)};

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.twinNativeTeam=this.teamIndex??(index?1:0);
   this.twinCharmBetrayal=false;
   this.twinCharmSource=null;
   this.twinBetrayalTimer=0;
   this.twinBetrayalPulse=0;
   this.twinBetrayalTarget=null;
   this.twinBetrayalRushCooldown=0;
  }
  beginTwinBetrayal(source){
   if(!isTwinUnit(this)||this.twinCharmBetrayal||!combatReady(source))return false;
   const partner=twinPartner(this);
   if(!partner)return false;
   this.twinNativeTeam=nativeTeamOf(this);
   this.twinCharmBetrayal=true;
   this.twinCharmSource=source;
   this.twinBetrayalTimer=Math.max(this.charmTimer||0,rnd(1.85,2.45));
   this.charmTimer=this.twinBetrayalTimer;
   this.teamIndex=teamOf(source);
   this.twinBetrayalPulse=1;
   this.twinBetrayalRushCooldown=.18;
   this.twinBetrayalTarget=partner;
   this.impactBoost=Math.max(this.impactBoost||0,72);
   this.xDashCooldown=Math.max(this.xDashCooldown||0,.26);
   emit(this.x,this.y,source.c?.primary||'#ff68c8',44,.98,'streak');
   emit(this.x,this.y,this.c.accent||'#fff',24,.72);
   wave(this.x,this.y,source.c?.secondary||'#744cff',78);
   wave(this.x,this.y,this.c.primary||'#3bd5ff',54);
   shake=Math.max(shake,7.5);flash=Math.max(flash,.28);
   addLog(`${source.c.name} 的月歌侵入雙生連結！${this.c.name}・${this.splitPart} 發生「月蝕叛核」，轉而攻擊自己的雙生星核！`);
   return true;
  }
  endTwinBetrayal(reason='魅惑解除'){
   if(!this.twinCharmBetrayal)return;
   const source=this.twinCharmSource;
   this.teamIndex=this.twinNativeTeam;
   this.twinCharmBetrayal=false;
   this.twinCharmSource=null;
   this.twinBetrayalTimer=0;
   this.twinBetrayalTarget=null;
   this.charmedBy=null;
   this.charmTimer=0;
   this.charmGrace=.32;
   this.charmReleasePulse=1;
   this.twinBetrayalPulse=1;
   this.rimCooldown=Math.max(this.rimCooldown||0,.16);
   this.xDashCooldown=Math.max(this.xDashCooldown||0,.24);
   emit(this.x,this.y,this.c.primary||'#3bd5ff',30,.74,'streak');
   emit(this.x,this.y,source?.c?.accent||'#fff0fb',16,.48);
   wave(this.x,this.y,this.c.accent||'#fff0a8',52);
   addLog(`${this.c.name}・${this.splitPart} ${reason}，解除「月蝕叛核」並回歸雙生星核陣營。`);
  }
  updateTwinBetrayal(dt,opponent){
   const source=this.twinCharmSource;
   this.twinBetrayalTimer-=dt;
   this.charmTimer=this.twinBetrayalTimer;
   this.twinBetrayalRushCooldown=Math.max(0,this.twinBetrayalRushCooldown-dt);
   this.twinBetrayalPulse=Math.max(0,this.twinBetrayalPulse-dt*1.35);
   if(!combatReady(source)||this.twinBetrayalTimer<=0){
    this.endTwinBetrayal(!combatReady(source)?'因魅惑者失去戰鬥能力而清醒':'從月歌控制中清醒');
    super.update(dt,opponent);
    return;
   }

   const target=formerAllyTarget(this,opponent);
   this.twinBetrayalTarget=target;
   const savedCharm=this.charmedBy;
   this.charmedBy=null;
   super.update(dt,target);
   this.charmedBy=savedCharm||source;
   if(this.out||this.burst)return;
   if(!combatReady(target))return;

   const dx0=target.x-this.x,dy0=target.y-this.y,d0=mag(dx0,dy0)||1;
   const lead=clamp(d0/250,.06,.26);
   const aimX=target.x+(target.vx||0)*lead,aimY=target.y+(target.vy||0)*lead;
   let dx=aimX-this.x,dy=aimY-this.y,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d;
   const cx=W/2,cy=H/2,cdx=this.x-cx,cdy=this.y-cy,edgeDistance=mag(cdx,cdy)||1;
   const edge=clamp((edgeDistance-innerR*.78)/Math.max(1,outerR-innerR*.78),0,1);
   if(edge>0){
    const inwardX=-cdx/edgeDistance,inwardY=-cdy/edgeDistance,mix=edge*.30;
    nx=nx*(1-mix)+inwardX*mix;ny=ny*(1-mix)+inwardY*mix;
    const nd=mag(nx,ny)||1;nx/=nd;ny/=nd;
   }
   const desiredSpeed=clamp(224+(100-clamp(this.energy,0,100))*.42,224,286);
   const blend=clamp(dt*5.1,0,.30);
   this.vx+=(nx*desiredSpeed-this.vx)*blend;
   this.vy+=(ny*desiredSpeed-this.vy)*blend;
   const speed=mag(this.vx,this.vy)||1,alignment=(this.vx/speed)*nx+(this.vy/speed)*ny;
   if(alignment>.80&&d0>this.r+target.r+22&&d0<innerR*1.35&&this.twinBetrayalRushCooldown<=0){
    this.vx+=nx*46;this.vy+=ny*46;
    this.twinBetrayalRushCooldown=.82;
    this.impactBoost=Math.max(this.impactBoost||0,92);
    this.twinBetrayalPulse=1;
    emit(this.x,this.y,source.c?.primary||'#ff68c8',12,.42,'streak');
   }
  }
  update(dt,opponent){
   this.twinBetrayalPulse=Math.max(0,(this.twinBetrayalPulse||0)-dt*1.35);
   if(isTwinUnit(this)&&this.charmedBy&&!this.twinCharmBetrayal)this.beginTwinBetrayal(this.charmedBy);
   if(this.twinCharmBetrayal){
    this.updateTwinBetrayal(dt,opponent);
    return;
   }
   super.update(dt,opponent);
  }
  draw(){
   super.draw();
   if(!this.twinCharmBetrayal||this.out||this.burst)return;
   const source=this.twinCharmSource,pulse=.5+.5*Math.sin(time*8.4),r=this.r*(1.32+pulse*.08);
   ctx.save();ctx.translate(this.x,this.y);ctx.rotate(-time*1.9);
   ctx.globalCompositeOperation='screen';ctx.shadowBlur=16;ctx.shadowColor=source?.c?.primary||'#ff68c8';
   ctx.strokeStyle=alpha(source?.c?.primary||'#ff68c8',.48+pulse*.24);ctx.lineWidth=1.7;
   ctx.setLineDash([this.r*.15,this.r*.12]);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
   ctx.strokeStyle=alpha(this.c.primary||'#3bd5ff',.30+pulse*.18);ctx.lineWidth=1.2;
   ctx.beginPath();ctx.moveTo(-r*.52,-r*.52);ctx.lineTo(r*.52,r*.52);ctx.moveTo(r*.52,-r*.52);ctx.lineTo(-r*.52,r*.52);ctx.stroke();
   ctx.restore();
   ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${Math.max(9,this.r*.31)}px system-ui`;
   ctx.shadowBlur=10;ctx.shadowColor=source?.c?.primary||'#ff68c8';ctx.fillStyle=alpha(source?.c?.accent||'#fff0fb',.86);
   ctx.fillText('月蝕叛核',this.x,this.y-this.r*1.72);ctx.restore();
  }
 };

 enhancePanel('p1');enhancePanel('p2');
 const log=document.querySelector('#log');
 if(log)log.textContent='「雙生星核」新增月蝕叛核：分裂後若其中一核遭魅惑，該核心會暫時加入魅月海妖陣營並攻擊自己的雙生同伴。';
 document.documentElement.dataset.twinCharmBetrayal='v1';
})();
