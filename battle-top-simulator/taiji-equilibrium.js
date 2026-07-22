/* Taiji Equilibrium: Yin absorption and Yang release */
(() => {
 const TAIJI_KEY='taijiEquilibrium';
 const TAIJI={
  label:'[SPECIAL] 太極玄輪｜Taiji Equilibrium',
  name:'太極玄輪',englishName:'Taiji Equilibrium',
  combo:'2-80 Infinity Balance',
  rank:'陰陽轉換・以柔克剛・借力打力',tier:'SPECIAL',type:'balance',
  a:78,d:88,s:88,w:84,b:93,spin:'R',shape:'taijiEquilibrium',
  taijiCore:true,
  primary:'#f5f7fb',secondary:'#11151d',accent:'#68e4c1',metal:'#cfd8e2'
 };
 metaPresets[TAIJI_KEY]=TAIJI;

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.taijiCore)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box taiji-ability';
  ability.innerHTML='<strong>陰陽流轉機構</strong>陰態會化解部分碰撞、吸收對手衝擊並累積「勁」；勁力充足後自動轉為陽態，以弧形突進把吸收的力量一次釋放。陽勁耗盡後重新回到陰態。<div class="combo-tags"><span>陰・化勁</span><span>陽・發勁</span><span>借力反擊</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 function teamOf(top){return top?.teamIndex??(top?.index?1:0)}
 function validEnemy(source,target){
  return !!target&&source!==target&&teamOf(source)!==teamOf(target)&&!target.out&&!target.burst&&!target.phaseInvisible&&!target.skyJumpGhost&&target.energy>0;
 }
 function nearestEnemy(source,preferred){
  if(validEnemy(source,preferred))return preferred;
  let best=null,bestDistance=Infinity;
  tops.forEach(target=>{
   if(!validEnemy(source,target))return;
   const distance=mag(target.x-source.x,target.y-source.y);
   if(distance<bestDistance){best=target;bestDistance=distance}
  });
  return best;
 }
 function snap(top){
  return {vx:top.vx,vy:top.vy,omega:top.omega,spin:top.spin,tiltVel:top.tiltVel||0,lift:top.lift||0,impactBoost:top.impactBoost||0,burstMeter:top.burstMeter||0,energy:top.energy||0};
 }
 function softenTo(top,before,retain=.62){
  if(!top||top.out||top.burst)return;
  top.vx=before.vx+(top.vx-before.vx)*retain;
  top.vy=before.vy+(top.vy-before.vy)*retain;
  top.omega=before.omega+(top.omega-before.omega)*retain;top.spin=top.omega;
  top.tiltVel=before.tiltVel+((top.tiltVel||0)-before.tiltVel)*retain;
  top.lift=before.lift+((top.lift||0)-before.lift)*retain;
  top.impactBoost=before.impactBoost+((top.impactBoost||0)-before.impactBoost)*retain;
  top.burstMeter=before.burstMeter+((top.burstMeter||0)-before.burstMeter)*retain;
 }

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.taijiMode=data.taijiCore?'yin':null;
   this.taijiChi=0;
   this.taijiModeTimer=0;
   this.taijiDashTimer=.75;
   this.taijiStrikeWindow=0;
   this.taijiPulse=0;
   this.taijiTransformPulse=0;
   this.taijiImpactPulse=0;
   this.taijiLastOpponent=null;
  }
  isTaiji(){return !!this.c.taijiCore}
  switchTaiji(mode,reason=''){
   if(!this.isTaiji()||this.taijiMode===mode)return;
   this.taijiMode=mode;
   this.taijiTransformPulse=1;
   this.taijiStrikeWindow=0;
   if(mode==='yang'){
    this.taijiModeTimer=rnd(2.6,3.5);
    this.taijiDashTimer=rnd(.28,.52);
    emit(this.x,this.y,'#f7fbff',28,.72,'streak');
    emit(this.x,this.y,'#68e4c1',22,.62,'streak');
    wave(this.x,this.y,'#f5f7fb',62);wave(this.x,this.y,'#68e4c1',42);
    addLog(`${this.c.name} 由陰轉陽：累積的化勁開始轉為主動發勁！`);
   }else{
    this.taijiModeTimer=0;
    this.taijiDashTimer=.75;
    emit(this.x,this.y,'#18202b',22,.58,'streak');
    wave(this.x,this.y,'#68e4c1',48);
    if(reason)addLog(`${this.c.name} ${reason}，由陽歸陰並重新進入化勁循環。`);
   }
   shake=Math.max(shake,3.8);flash=Math.max(flash,.08);
  }
  absorbImpact(amount,opponent){
   if(!this.isTaiji()||this.taijiMode!=='yin'||this.out||this.burst)return;
   const gain=clamp(amount,3,28);
   this.taijiChi=clamp(this.taijiChi+gain,0,100);
   this.taijiImpactPulse=1;
   this.taijiLastOpponent=opponent||this.taijiLastOpponent;
   if(this.taijiChi>=52)this.switchTaiji('yang');
  }
  dashYang(target){
   if(!validEnemy(this,target))return false;
   const dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1;
   const nx=dx/d,ny=dy/d,sign=Math.sign(this.omega)||1,tx=-ny*sign,ty=nx*sign;
   const power=42+this.taijiChi*.48;
   const curve=18+this.taijiChi*.12;
   this.vx+=nx*power+tx*curve;
   this.vy+=ny*power+ty*curve;
   this.taijiStrikeWindow=.34;
   this.impactBoost=Math.max(this.impactBoost||0,34+this.taijiChi*.38);
   this.taijiImpactPulse=1;
   emit(this.x,this.y,'#f7fbff',16,.48,'streak');
   wave(this.x,this.y,'#68e4c1',34);
   return true;
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.taijiPulse+=dt*(this.taijiMode==='yang'?5.2:2.6);
   this.taijiTransformPulse=Math.max(0,this.taijiTransformPulse-dt*1.6);
   this.taijiImpactPulse=Math.max(0,this.taijiImpactPulse-dt*2.3);
   this.taijiStrikeWindow=Math.max(0,this.taijiStrikeWindow-dt);
   if(!this.isTaiji()||this.out||this.burst)return;
   const target=nearestEnemy(this,opponent);
   if(target)this.taijiLastOpponent=target;
   if(this.phaseInvisible||this.skyJumpGhost||this.charmedBy)return;

   if(this.taijiMode==='yin'){
    this.taijiChi=Math.max(0,this.taijiChi-dt*.65);
    this.vx*=Math.exp(-.016*dt);this.vy*=Math.exp(-.016*dt);
    if(target){
     const dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1;
     const sign=Math.sign(this.omega)||1,tx=-dy/d*sign,ty=dx/d*sign;
     this.vx+=tx*7.5*dt;this.vy+=ty*7.5*dt;
    }
   }else if(this.taijiMode==='yang'){
    this.taijiModeTimer-=dt;
    this.taijiDashTimer-=dt;
    this.taijiChi=Math.max(0,this.taijiChi-dt*3.8);
    this.omega*=Math.exp(-.010*dt);this.spin=this.omega;
    if(this.taijiDashTimer<=0&&target){
     this.dashYang(target);
     this.taijiDashTimer=rnd(.82,1.18);
    }
    if(this.taijiModeTimer<=0||this.taijiChi<=7)this.switchTaiji('yin','陽勁釋放完畢');
   }
  }
  bladeCount(){return this.c.shape==='taijiEquilibrium'?2:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='taijiEquilibrium')return this.r*(i%2?1.03:1.18);
   return super.bladeRadius(i);
  }
  draw(){
   if(!this.c.taijiCore)return super.draw();
   const original={primary:this.c.primary,secondary:this.c.secondary,accent:this.c.accent};
   if(this.taijiMode==='yin'){
    this.c.primary='#dfe6ee';this.c.secondary='#10151d';this.c.accent='#68e4c1';
   }else{
    this.c.primary='#ffffff';this.c.secondary='#2a3442';this.c.accent='#ffd978';
   }
   super.draw();
   this.c.primary=original.primary;this.c.secondary=original.secondary;this.c.accent=original.accent;
   if(this.out||this.burst)return;

   const pulse=.5+.5*Math.sin(this.taijiPulse),yang=this.taijiMode==='yang';
   ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle*.55);
   ctx.globalCompositeOperation='screen';
   ctx.shadowBlur=10+this.taijiChi*.08;ctx.shadowColor=yang?'#ffd978':'#68e4c1';

   const rr=this.r*.48;
   ctx.fillStyle=alpha('#f7fbff',.82);ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=alpha('#0a0e14',.90);ctx.beginPath();ctx.arc(0,0,rr,-Math.PI/2,Math.PI/2);ctx.lineTo(0,-rr);ctx.closePath();ctx.fill();
   ctx.fillStyle=alpha('#0a0e14',.92);ctx.beginPath();ctx.arc(0,-rr*.5,rr*.5,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=alpha('#f7fbff',.92);ctx.beginPath();ctx.arc(0,rr*.5,rr*.5,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#f7fbff';ctx.beginPath();ctx.arc(0,-rr*.5,rr*.115,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#0a0e14';ctx.beginPath();ctx.arc(0,rr*.5,rr*.115,0,Math.PI*2);ctx.fill();

   ctx.strokeStyle=alpha(yang?'#ffd978':'#68e4c1',.16+.32*(this.taijiChi/100)+.14*pulse);
   ctx.lineWidth=1.4+this.taijiChi*.012;
   ctx.setLineDash([this.r*.13,this.r*.10]);
   ctx.beginPath();ctx.arc(0,0,this.r*(1.17+.10*pulse),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);

   if(this.taijiTransformPulse>0||this.taijiImpactPulse>0){
    const p=Math.max(this.taijiTransformPulse,this.taijiImpactPulse);
    ctx.strokeStyle=alpha(yang?'#fff3bf':'#dffdf4',.52*p);ctx.lineWidth=2.2;
    ctx.beginPath();ctx.arc(0,0,this.r*(1.24+(1-p)*.64),0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();

  }
 };

 const previousCollide=collide;
 collide=function(a,b){
  const protectedState=a?.phaseInvisible||b?.phaseInvisible||a?.skyJumpGhost||b?.skyJumpGhost||a?.charmedBy===b||b?.charmedBy===a;
  const same=teamOf(a)===teamOf(b);
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=(a.r||0)+(b.r||0);
  let contact=false,nx=0,ny=0,impact=0;
  if(!protectedState&&!same&&d&&d<min){
   nx=dx/d;ny=dy/d;
   const vn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
   impact=Math.max(0,-vn);contact=impact>0;
  }
  const beforeA=snap(a),beforeB=snap(b);
  previousCollide(a,b);
  if(!contact)return;

  function applyTaiji(top,other,before,dirX,dirY){
   if(!top?.c?.taijiCore||top.out||top.burst||top.phaseInvisible||top.skyJumpGhost||top.charmedBy)return;
   if(top.taijiMode==='yin'){
    const burstGain=Math.max(0,(top.burstMeter||0)-before.burstMeter);
    softenTo(top,before,.61);
    const sign=Math.sign(top.omega)||1,tx=-dirY*sign,ty=dirX*sign;
    const redirect=clamp(7+impact*.055,7,24);
    other.vx+=tx*redirect;other.vy+=ty*redirect;
    top.absorbImpact(5+impact*.095+burstGain*.9,other);
    emit(top.x,top.y,'#68e4c1',8+Math.round(impact*.035),.42,'streak');
    wave(top.x,top.y,'#dffdf4',30+Math.min(24,impact*.08));
   }else if(top.taijiMode==='yang'&&top.taijiStrikeWindow>0){
    const chi=top.taijiChi;
    const force=32+chi*.76;
    other.vx+=dirX*force;other.vy+=dirY*force;
    other.omega*=1-(.035+chi*.00072);other.spin=other.omega;
    other.tiltVel+=(.07+chi*.0015)/Math.max(.76,other.tip?.stability||1);
    other.lift=clamp((other.lift||0)+.045+chi*.00075,0,1);
    other.impactBoost=Math.max(other.impactBoost||0,force*.72);
    other.burstMeter=(other.burstMeter||0)+2.0+chi*.055;
    top.taijiChi=Math.max(0,chi-Math.max(25,chi*.58));
    top.taijiStrikeWindow=0;top.taijiImpactPulse=1;
    top.omega*=.993;top.spin=top.omega;
    const cx=(top.x+other.x)/2,cy=(top.y+other.y)/2;
    emit(cx,cy,'#fff4c7',22+Math.round(chi*.16),.70,'streak');
    emit(cx,cy,'#68e4c1',12,.52);
    wave(cx,cy,'#ffffff',50+chi*.30);shake=Math.max(shake,5+chi*.045);flash=Math.max(flash,.08+chi*.0011);
    addLog(`${top.c.name} 發動「陽勁」：把吸收的衝擊借力返還！`);
    if(top.taijiChi<=7)top.switchTaiji('yin','完成借力反擊');
   }
  }
  applyTaiji(a,b,beforeA,nx,ny);
  applyTaiji(b,a,beforeB,-nx,-ny);
 };

 const style=document.createElement('style');
 style.textContent='.taiji-ability{border-color:#68e4c15c;background:linear-gradient(135deg,#f5f7fb10,#11151d28 52%,#68e4c116);box-shadow:inset 0 0 24px #68e4c10c}';
 document.head.appendChild(style);

 cfg.p2={...TAIJI,preset:TAIJI_KEY};
 renderPanel('p1');renderPanel('p2');
 const n1=document.querySelector('#n1'),n2=document.querySelector('#n2');
 if(n1)n1.textContent=cfg.p1.name;
 if(n2)n2.textContent=cfg.p2.name;
})();
