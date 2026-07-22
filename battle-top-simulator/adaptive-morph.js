/* Omni Observer: opponent analysis, four-form transformation, distinct attack rhythms */
(() => {
 const MORPH_KEY='omniObserver';
 const OMNI_OBSERVER={
  label:'[SPECIAL] 萬相觀測者｜Omni Observer',
  name:'萬相觀測者',englishName:'Omni Observer',
  combo:'4-80 Adaptive Axis',
  rank:'觀察對手・四形態自動變形',tier:'SPECIAL',type:'balance',
  a:76,d:80,s:84,w:82,b:91,spin:'R',shape:'omniObserver',
  adaptiveMorph:true,
  primary:'#52d9ff',secondary:'#8a66ff',accent:'#effcff',metal:'#d7e4ec'
 };
 const FORMS={
  swift:{name:'疾風獵形',short:'疾風',rhythm:'高頻短衝',primary:'#4de7ff',secondary:'#147dff',accent:'#f0ffff'},
  aegis:{name:'玄甲反擊形',short:'玄甲',rhythm:'蓄勢反擊',primary:'#ffd15c',secondary:'#ff7a24',accent:'#fff8cf'},
  viper:{name:'毒牙連段形',short:'毒牙',rhythm:'三段連擊',primary:'#78ff9b',secondary:'#17b87d',accent:'#effff3'},
  reaper:{name:'斷星重擊形',short:'斷星',rhythm:'長蓄單擊',primary:'#d85cff',secondary:'#ff386d',accent:'#fff0ff'}
 };
 metaPresets[MORPH_KEY]=OMNI_OBSERVER;

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.adaptiveMorph)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box adaptive-morph-ability';
  ability.innerHTML='<strong>萬相觀測變形機構</strong>先分析對手的移動速度、攻擊壓力、防禦結構、耐力與剩餘能量，再自動切換四種形態。<div class="morph-form-grid"><span>疾風｜高頻短衝</span><span>玄甲｜蓄勢反擊</span><span>毒牙｜三段連擊</span><span>斷星｜長蓄重擊</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 function teamOf(top){return top?.teamIndex??(top?.index?1:0)}
 function active(top){return !!top&&!top.out&&!top.burst&&!top.phaseInvisible&&!top.skyJumpGhost&&top.energy>0}
 function enemyOf(source,target){return active(target)&&source!==target&&teamOf(source)!==teamOf(target)}
 function nearestEnemy(source,preferred){
  if(enemyOf(source,preferred))return preferred;
  let best=null,bestDistance=Infinity;
  tops.forEach(target=>{
   if(!enemyOf(source,target))return;
   const distance=mag(target.x-source.x,target.y-source.y);
   if(distance<bestDistance){best=target;bestDistance=distance}
  });
  return best;
 }
 function formColor(top,key='primary'){
  const form=FORMS[top?.morphMode];
  return form?.[key]||top?.c?.[key]||'#ffffff';
 }
 function attackValue(top){return Math.max(top?.rageAttackValue||0,top?.c?.a||0)}

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.morphMode=data.adaptiveMorph?'scan':null;
   this.morphObserveTimer=data.adaptiveMorph?rnd(.95,1.35):999;
   this.morphRecheckTimer=data.adaptiveMorph?rnd(3.8,5.3):999;
   this.morphAttackTimer=.55;
   this.morphAttackCycle=1;
   this.morphHitWindow=0;
   this.morphComboLeft=0;
   this.morphComboTimer=0;
   this.morphCounterReady=false;
   this.morphCounterCooldown=.8;
   this.morphCharge=0;
   this.morphPulse=0;
   this.morphTransformPulse=0;
   this.morphStrikeFlash=0;
   this.morphObservedTarget=null;
   this.morphObservation={speed:0,samples:0};
  }
  isAdaptive(){return !!this.c.adaptiveMorph}
  observeOpponent(dt,target){
   if(!enemyOf(this,target))return;
   const speed=mag(target.vx,target.vy);
   const k=1-Math.exp(-dt*2.7);
   this.morphObservation.speed+=((speed||0)-this.morphObservation.speed)*k;
   this.morphObservation.samples++;
   this.morphObservedTarget=target;
  }
  chooseForm(target){
   if(!enemyOf(this,target))return this.morphMode==='scan'?'swift':this.morphMode;
   const c=target.c||{},speed=Math.max(this.morphObservation.speed,mag(target.vx,target.vy));
   const attack=attackValue(target),energy=clamp(target.energy??100,0,100);
   const scores={
    swift:clamp(speed/175,0,1.6)*1.35+(c.type==='attack'?.62:0)+(c.skyPouncer?.38:0),
    aegis:clamp((attack-60)/60,0,1.7)*1.18+clamp(((c.w||70)-68)/38,0,1.3)*.82+(c.rageEngine?1.05:0)+(c.skyPouncer?.34:0),
    viper:clamp(((c.d||70)-65)/38,0,1.35)*1.0+clamp(((c.b||70)-68)/34,0,1.35)*.88+((c.type==='defense'||c.type==='stamina')?.48:0),
    reaper:clamp((58-energy)/48,0,1.45)*1.45+clamp(((c.s||70)-73)/32,0,1.15)*.72+(c.phaseCloak?.48:0)+(c.charmAura?.28:0)
   };
   return Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
  }
  transformTo(mode){
   if(!FORMS[mode]||mode===this.morphMode)return;
   this.morphMode=mode;
   this.morphTransformPulse=1;
   this.morphHitWindow=0;
   this.morphComboLeft=0;
   this.morphComboTimer=0;
   this.morphCounterReady=false;
   this.morphCounterCooldown=.65;
   this.scheduleRhythm(true);
   const form=FORMS[mode];
   emit(this.x,this.y,form.primary,34,.82,'streak');
   emit(this.x,this.y,form.accent,18,.58);
   wave(this.x,this.y,form.secondary,62);
   wave(this.x,this.y,form.primary,42);
   shake=Math.max(shake,4.6);flash=Math.max(flash,.13);
   addLog(`${this.c.name} 完成觀測，變形成「${form.name}」並啟用${form.rhythm}節奏！`);
  }
  scheduleRhythm(first=false){
   if(this.morphMode==='swift')this.morphAttackTimer=first?.22:rnd(.58,.88);
   else if(this.morphMode==='aegis')this.morphCounterCooldown=first?.55:rnd(1.55,2.05);
   else if(this.morphMode==='viper')this.morphAttackTimer=first?.58:rnd(2.15,2.75);
   else if(this.morphMode==='reaper'){
    this.morphAttackCycle=first?rnd(2.25,2.75):rnd(2.75,3.45);
    this.morphAttackTimer=this.morphAttackCycle;
    this.morphCharge=0;
   }
  }
  dashAt(target,power,tangent=0,window=.24){
   if(!enemyOf(this,target))return false;
   const dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1;
   const nx=dx/d,ny=dy/d,sign=Math.sign(this.omega)||1,tx=-ny*sign,ty=nx*sign;
   this.vx+=nx*power+tx*tangent;
   this.vy+=ny*power+ty*tangent;
   this.morphHitWindow=Math.max(this.morphHitWindow,window);
   this.impactBoost=Math.max(this.impactBoost||0,power*.28);
   this.morphStrikeFlash=1;
   emit(this.x,this.y,formColor(this),12,.42,'streak');
   return true;
  }
  runRhythm(dt,target){
   if(!enemyOf(this,target))return;
   if(this.morphMode==='swift'){
    this.morphAttackTimer-=dt;
    if(this.morphAttackTimer<=0){
     this.dashAt(target,48+rnd(0,12),(Math.random()<.5?-1:1)*18,.24);
     wave(this.x,this.y,FORMS.swift.primary,30);
     this.scheduleRhythm();
    }
   }else if(this.morphMode==='aegis'){
    this.morphCounterCooldown-=dt;
    if(this.morphCounterCooldown<=0&&!this.morphCounterReady){
     this.morphCounterReady=true;
     wave(this.x,this.y,FORMS.aegis.primary,36);
     addLog(`${this.c.name} 的玄甲結構完成蓄勢，等待接觸後反震！`);
    }
    if(this.morphCounterReady){
     this.vx*=Math.exp(-.08*dt);this.vy*=Math.exp(-.08*dt);
    }
   }else if(this.morphMode==='viper'){
    if(this.morphComboLeft>0){
     this.morphComboTimer-=dt;
     if(this.morphComboTimer<=0){
      const side=(this.morphComboLeft%2?1:-1)*22;
      this.dashAt(target,38+this.morphComboLeft*3,side,.18);
      this.morphComboLeft--;
      this.morphComboTimer=.19;
      wave(this.x,this.y,FORMS.viper.primary,24);
      if(this.morphComboLeft===0)this.scheduleRhythm();
     }
    }else{
     this.morphAttackTimer-=dt;
     if(this.morphAttackTimer<=0){
      this.morphComboLeft=3;this.morphComboTimer=0;
      addLog(`${this.c.name} 啟動毒牙三段節奏：連續改變切入角度！`);
     }
    }
   }else if(this.morphMode==='reaper'){
    this.morphAttackTimer-=dt;
    this.morphCharge=clamp(1-this.morphAttackTimer/Math.max(.1,this.morphAttackCycle),0,1);
    if(this.morphAttackTimer<=0){
     if(this.dashAt(target,126,0,.48)){
      this.omega*=.974;this.spin=this.omega;
      this.lift=clamp((this.lift||0)+.09,0,1);
      wave(this.x,this.y,FORMS.reaper.secondary,76);
      emit(this.x,this.y,FORMS.reaper.accent,26,.78,'streak');
      shake=Math.max(shake,6.4);
      addLog(`${this.c.name} 釋放斷星蓄力，以單次重擊節奏貫穿戰圈！`);
     }
     this.scheduleRhythm();
    }
   }
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.morphPulse+=dt*(this.morphMode==='scan'?2.2:4.0);
   this.morphTransformPulse=Math.max(0,this.morphTransformPulse-dt*1.5);
   this.morphStrikeFlash=Math.max(0,this.morphStrikeFlash-dt*2.4);
   this.morphHitWindow=Math.max(0,this.morphHitWindow-dt);
   if(!this.isAdaptive()||this.out||this.burst)return;
   const target=nearestEnemy(this,opponent);
   this.observeOpponent(dt,target);
   const disabled=this.phaseInvisible||this.skyJumpGhost||this.charmedBy;
   if(disabled)return;

   if(this.morphMode==='scan'){
    this.morphObserveTimer-=dt;
    if(this.morphObserveTimer<=0&&target){
     this.transformTo(this.chooseForm(target));
     this.morphRecheckTimer=rnd(3.8,5.3);
    }
    return;
   }

   this.morphRecheckTimer-=dt;
   if(this.morphRecheckTimer<=0&&target){
    const next=this.chooseForm(target);
    if(next!==this.morphMode)this.transformTo(next);
    this.morphRecheckTimer=rnd(3.8,5.3);
   }
   this.runRhythm(dt,target);
  }
  bladeCount(){
   if(!this.c.adaptiveMorph)return super.bladeCount();
   return this.morphMode==='swift'?3:this.morphMode==='aegis'?8:this.morphMode==='viper'?5:this.morphMode==='reaper'?4:6;
  }
  bladeRadius(i){
   if(!this.c.adaptiveMorph)return super.bladeRadius(i);
   const profiles={
    scan:[.96,.82,1.02,.84,.94,.80],
    swift:[1.24,.70,.88,.66],
    aegis:[.96,.88,.94,.86],
    viper:[1.12,.70,.98,.74,.88],
    reaper:[1.22,.68,1.08,.72]
   };
   const profile=profiles[this.morphMode]||profiles.scan;
   return this.r*profile[i%profile.length];
  }
  draw(){
   if(!this.c.adaptiveMorph)return super.draw();
   const form=FORMS[this.morphMode];
   const original={primary:this.c.primary,secondary:this.c.secondary,accent:this.c.accent};
   if(form){this.c.primary=form.primary;this.c.secondary=form.secondary;this.c.accent=form.accent}
   super.draw();
   this.c.primary=original.primary;this.c.secondary=original.secondary;this.c.accent=original.accent;
   if(this.out||this.burst)return;

   const primary=form?.primary||original.primary,secondary=form?.secondary||original.secondary,accent=form?.accent||original.accent;
   const pulse=.5+.5*Math.sin(this.morphPulse);
   ctx.save();ctx.globalCompositeOperation='screen';

   if(this.morphMode==='scan'){
    ctx.strokeStyle=alpha(primary,.22+.16*pulse);ctx.lineWidth=1.3;ctx.setLineDash([4,5]);
    ctx.beginPath();ctx.arc(this.x,this.y,this.r*(1.18+.12*pulse),0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(this.x,this.y,this.r*(1.48-.08*pulse),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    const target=this.morphObservedTarget;
    if(enemyOf(this,target)){
     ctx.strokeStyle=alpha(primary,.12+.08*pulse);ctx.lineWidth=1;
     ctx.beginPath();ctx.moveTo(this.x,this.y);ctx.lineTo(target.x,target.y);ctx.stroke();
    }
   }else if(this.morphMode==='swift'){
    const speed=mag(this.vx,this.vy)||1,nx=this.vx/speed,ny=this.vy/speed;
    for(let i=0;i<3;i++){
     ctx.strokeStyle=alpha(i%2?accent:primary,.12+.12*pulse);ctx.lineWidth=1.4+i*.5;
     ctx.beginPath();ctx.moveTo(this.x-nx*this.r*(1.0+i*.35),this.y-ny*this.r*(1.0+i*.35));
     ctx.lineTo(this.x-nx*this.r*(1.7+i*.55),this.y-ny*this.r*(1.7+i*.55));ctx.stroke();
    }
   }else if(this.morphMode==='aegis'){
    ctx.translate(this.x,this.y);ctx.rotate(time*.45);
    ctx.strokeStyle=alpha(primary,this.morphCounterReady?.48:.18+.12*pulse);ctx.lineWidth=this.morphCounterReady?2.4:1.4;
    for(let i=0;i<6;i++){
     const a=i*Math.PI/3,r=this.r*1.32;
     ctx.beginPath();ctx.moveTo(Math.cos(a-.32)*r,Math.sin(a-.32)*r);ctx.lineTo(Math.cos(a+.32)*r,Math.sin(a+.32)*r);ctx.stroke();
    }
   }else if(this.morphMode==='viper'){
    ctx.translate(this.x,this.y);ctx.rotate(-time*1.4);
    for(let i=0;i<3;i++){
     const a=i*Math.PI*2/3+time*1.9,rr=this.r*(1.13+.08*Math.sin(this.morphPulse+i));
     ctx.fillStyle=alpha(i%2?accent:primary,.30+.18*pulse);
     ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,2.3,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle=alpha(primary,.18+.12*pulse);ctx.lineWidth=1.4;
    ctx.beginPath();ctx.arc(0,0,this.r*1.24,time,time+Math.PI*.92);ctx.stroke();
   }else if(this.morphMode==='reaper'){
    ctx.translate(this.x,this.y);ctx.rotate(time*.32);
    ctx.strokeStyle=alpha(secondary,.16+.34*this.morphCharge);ctx.lineWidth=1.5+2*this.morphCharge;
    ctx.beginPath();ctx.arc(0,0,this.r*(1.16+.34*this.morphCharge),-.8,Math.PI*1.55);ctx.stroke();
    ctx.strokeStyle=alpha(accent,.12+.26*this.morphCharge);ctx.beginPath();
    ctx.moveTo(-this.r*1.18,0);ctx.lineTo(this.r*1.18,0);ctx.moveTo(0,-this.r*1.18);ctx.lineTo(0,this.r*1.18);ctx.stroke();
   }
   ctx.restore();

   if(this.morphTransformPulse>0||this.morphStrikeFlash>0){
    const power=Math.max(this.morphTransformPulse,this.morphStrikeFlash);
    ctx.save();ctx.globalCompositeOperation='screen';ctx.strokeStyle=alpha(accent,.48*power);ctx.lineWidth=2.2;
    ctx.beginPath();ctx.arc(this.x,this.y,this.r*(1.18+(1-power)*.82),0,Math.PI*2);ctx.stroke();ctx.restore();
   }
  }
 };

 const previousCollide=collide;
 collide=function(a,b){
  const protectedState=a?.phaseInvisible||b?.phaseInvisible||a?.skyJumpGhost||b?.skyJumpGhost||a?.charmedBy===b||b?.charmedBy===a;
  const same=teamOf(a)===teamOf(b);
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=(a.r||0)+(b.r||0);
  let contact=false,nx=0,ny=0;
  if(!protectedState&&!same&&d&&d<min){
   nx=dx/d;ny=dy/d;
   contact=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny)>0;
  }
  previousCollide(a,b);
  if(!contact)return;

  function applyFormHit(attacker,victim,dirX,dirY){
   if(!attacker?.c?.adaptiveMorph||attacker.out||attacker.burst||attacker.phaseInvisible||attacker.skyJumpGhost||attacker.charmedBy)return;
   if(victim.out||victim.burst)return;
   const mode=attacker.morphMode;
   if(mode==='aegis'&&attacker.morphCounterReady){
    const force=94;
    victim.vx+=dirX*force;victim.vy+=dirY*force;
    victim.omega*=.91;victim.spin=victim.omega;
    victim.tiltVel+=.18/Math.max(.76,victim.tip?.stability||1);
    victim.lift=clamp((victim.lift||0)+.10,0,1);
    victim.burstMeter=(victim.burstMeter||0)+4.2;
    attacker.morphCounterReady=false;attacker.morphCounterCooldown=rnd(1.55,2.05);attacker.morphStrikeFlash=1;
    wave((attacker.x+victim.x)/2,(attacker.y+victim.y)/2,FORMS.aegis.primary,62);shake=Math.max(shake,6.2);
    addLog(`${attacker.c.name} 的玄甲反擊命中：吸收接觸後立即反震！`);
    return;
   }
   if(attacker.morphHitWindow<=0)return;
   let force=0,spinLoss=0,burst=0,lift=0;
   if(mode==='swift'){force=30;spinLoss=.025;burst=1.2;lift=.035}
   else if(mode==='viper'){force=34;spinLoss=.032;burst=1.9;lift=.045}
   else if(mode==='reaper'){force=104;spinLoss=.13;burst=8.2;lift=.16}
   else return;
   victim.vx+=dirX*force;victim.vy+=dirY*force;
   victim.omega*=1-spinLoss;victim.spin=victim.omega;
   victim.tiltVel+=(mode==='reaper'?.25:.075)/Math.max(.74,victim.tip?.stability||1);
   victim.lift=clamp((victim.lift||0)+lift,0,1);
   victim.impactBoost=Math.max(victim.impactBoost||0,force*.62);
   victim.burstMeter=(victim.burstMeter||0)+burst;
   attacker.morphHitWindow=0;attacker.morphStrikeFlash=1;
   const cx=(attacker.x+victim.x)/2,cy=(attacker.y+victim.y)/2,color=FORMS[mode].primary;
   emit(cx,cy,color,mode==='reaper'?34:16,mode==='reaper'?.92:.50,'streak');
   wave(cx,cy,FORMS[mode].secondary,mode==='reaper'?78:38);shake=Math.max(shake,mode==='reaper'?9:4.2);
  }
  applyFormHit(a,b,nx,ny);
  applyFormHit(b,a,-nx,-ny);
 };

 const style=document.createElement('style');
 style.textContent='.adaptive-morph-ability{border-color:#52d9ff62;background:linear-gradient(135deg,#52d9ff13,#8a66ff18);box-shadow:inset 0 0 25px #52d9ff0d}.morph-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:8px}.morph-form-grid span{padding:4px 6px;border-radius:8px;background:#ffffff09;border:1px solid #ffffff10;color:#cdd9ef;font-size:10px}';
 document.head.appendChild(style);

 cfg.p2={...OMNI_OBSERVER,preset:MORPH_KEY};
 renderPanel('p1');renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;
 document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='「萬相觀測者」已加入：它會先分析對手，再在疾風、玄甲、毒牙與斷星四形態間自動變形，使用不同攻擊節奏。';
})();
