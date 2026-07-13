/* Traditional wooden top: anti-custom counter */
(() => {
 const WOODEN_KEY='woodenSage';
 const WOODEN_TOP={
  label:'[ANTI-CUSTOM] Traditional Wooden Top',
  name:'Traditional Wooden Top',
  combo:'Wood Core 0-70 Balance',
  rank:'自訂陀螺剋星・木紋制衡',
  tier:'COUNTER',
  type:'defense',
  a:58,d:93,s:92,w:74,b:98,
  spin:'R',shape:'wooden',counterTarget:'customTop',
  primary:'#8a5a2b',secondary:'#d5a56a',accent:'#fff0d0',metal:'#b98d58'
 };

 metaPresets[WOODEN_KEY]=WOODEN_TOP;

 function averageStats(top){
  if(!top||!top.c)return 0;
  return (top.c.a+top.c.d+top.c.s+top.c.w+top.c.b)/5;
 }
 function isWoodenCounter(top){return !!(top&&top.c&&top.c.counterTarget==='customTop')}
 function isCustomTarget(top){
  if(!top||!top.c)return false;
  const c=top.c,text=`${c.name||''} ${c.combo||''} ${c.rank||''}`;
  const customLike=c.preset==='custom'||/自訂|自由調整能力/i.test(text);
  const highCount=[c.a,c.d,c.s,c.w,c.b].filter(v=>v>=96).length;
  return customLike||highCount>=3||averageStats(top)>=92;
 }

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.woodAuraCooldown=0;
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.woodAuraCooldown=Math.max(0,this.woodAuraCooldown-dt);
   if(!isWoodenCounter(this)||!isCustomTarget(opponent)||this.out||this.burst||opponent.out||opponent.burst)return;

   const cx=W/2,cy=H/2,dx=this.x-cx,dy=this.y-cy,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d;
   const inflation=clamp((averageStats(opponent)-82)/18,0,1.4);

   // 傳統木陀螺守住中央，以穩定姿態消耗亂拉數值的暴衝自訂陀螺。
   const recenter=18+this.c.d*.12+inflation*7;
   this.vx-=nx*recenter*dt;
   this.vy-=ny*recenter*dt;
   this.tiltVel*=Math.exp(-(1.45+inflation*.25)*dt);
   this.lift*=Math.exp(-1.1*dt);
   this.energy=clamp(this.energy+dt*(.45+.35*inflation),0,100);

   if(this.woodAuraCooldown<=0&&opponent.impactBoost>18){
    opponent.impactBoost*=clamp(.76-inflation*.13,.53,.76);
    opponent.xDashCooldown=Math.max(opponent.xDashCooldown,.38+.16*inflation);
    this.woodAuraCooldown=.58;
    if(performance.now()-lastZoneLog>700){
     addLog(`${this.c.name} 展開「木紋制衡」，壓制自訂陀螺的灌水暴衝！`);
     lastZoneLog=performance.now();
    }
   }
  }
  bladeCount(){return this.c.shape==='wooden'?8:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='wooden')return this.r*(.92+.05*Math.cos(i*.8));
   return super.bladeRadius(i);
  }
  drawModel(speed){
   if(this.c.shape!=='wooden')return super.drawModel(speed);

   const r=this.r;
   const spinPower=clamp(Math.abs(this.spin)/Math.max(24,Math.abs(this.omega0||24)),0,1);
   ctx.save();
   const wob=clamp((24-this.energy)/24,0,1)*1.75;
   ctx.translate(this.x+Math.sin(this.angle*.40)*wob,this.y+Math.cos(this.angle*.36)*wob);

   // 木陀螺投影
   ctx.save();
   ctx.translate(3.2,5.2);
   ctx.scale(1,.46);
   const shadow=ctx.createRadialGradient(0,0,1,0,0,r*1.38);
   shadow.addColorStop(0,'#000c');
   shadow.addColorStop(1,'#0000');
   ctx.fillStyle=shadow;
   ctx.beginPath();
   ctx.arc(0,0,r*1.45,0,Math.PI*2);
   ctx.fill();
   ctx.restore();

   // 高速旋轉時的溫暖木色殘影
   if(spinPower>.25){
    ctx.save();
    ctx.globalCompositeOperation='screen';
    ctx.strokeStyle=alpha(this.c.secondary,.08+.09*spinPower);
    ctx.lineWidth=2+spinPower*2.5;
    for(let k=0;k<3;k++){
     ctx.beginPath();
     ctx.arc(0,0,r*(1.02+k*.11),this.angle*.7+k*.6,this.angle*.7+Math.PI*(.74+spinPower*.65)+k*.6);
     ctx.stroke();
    }
    ctx.restore();
   }

   ctx.rotate(this.angle*.92);

   // 主木盤
   const woodBase=ctx.createRadialGradient(-r*.22,-r*.26,r*.12,0,0,r*1.08);
   woodBase.addColorStop(0,'#f3d7a6');
   woodBase.addColorStop(.18,'#c58c53');
   woodBase.addColorStop(.54,'#8a5a2b');
   woodBase.addColorStop(.84,'#593617');
   woodBase.addColorStop(1,'#2b170b');
   ctx.fillStyle=woodBase;
   ctx.beginPath();
   ctx.arc(0,0,r*.98,0,Math.PI*2);
   ctx.fill();

   // 外框深木色
   ctx.strokeStyle='#3f2412';
   ctx.lineWidth=1.2;
   ctx.stroke();

   // 木紋與年輪
   ctx.save();
   ctx.beginPath();
   ctx.arc(0,0,r*.94,0,Math.PI*2);
   ctx.clip();

   for(let i=0;i<7;i++){
    const rr=r*(.18+i*.11);
    ctx.strokeStyle=i%2?alpha('#6a3f1d',.30):alpha('#e4bf87',.20);
    ctx.lineWidth=.8+i*.04;
    ctx.beginPath();
    ctx.arc(Math.sin(i*1.9)*r*.03,Math.cos(i*1.3)*r*.03,rr,0,Math.PI*2);
    ctx.stroke();
   }

   for(let i=-5;i<=5;i++){
    const y=i*r*.13;
    ctx.strokeStyle=i%2?alpha('#613716',.16):alpha('#f2d7a8',.10);
    ctx.lineWidth=1.05;
    ctx.beginPath();
    ctx.moveTo(-r*.82,y-Math.sin(i*1.8)*r*.05);
    ctx.quadraticCurveTo(-r*.18,y+r*.09*Math.sin(i*.9),r*.18,y-r*.08*Math.cos(i*1.4));
    ctx.quadraticCurveTo(r*.56,y+r*.06*Math.sin(i*1.2),r*.84,y+r*.03*Math.cos(i*2.1));
    ctx.stroke();
   }
   ctx.restore();

   // 傳統漆色飾圈
   ctx.save();
   ctx.strokeStyle='#9a1f1f';
   ctx.lineWidth=r*.08;
   ctx.beginPath();
   ctx.arc(0,0,r*.70,0,Math.PI*2);
   ctx.stroke();
   ctx.strokeStyle='#f4d2aa';
   ctx.lineWidth=r*.03;
   ctx.beginPath();
   ctx.arc(0,0,r*.58,0,Math.PI*2);
   ctx.stroke();
   ctx.strokeStyle='#20252c';
   ctx.lineWidth=r*.025;
   ctx.beginPath();
   ctx.arc(0,0,r*.49,0,Math.PI*2);
   ctx.stroke();
   ctx.restore();

   // 手工削切面的質感
   ctx.save();
   ctx.fillStyle=alpha('#f8e0ba',.16);
   for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(r*.36,-r*.07,r*.24,r*.14,r*.05);
    else ctx.rect(r*.36,-r*.07,r*.24,r*.14);
    ctx.fill();
    ctx.restore();
   }
   ctx.restore();

   // 中心木芯與木釘
   const hub=ctx.createRadialGradient(-r*.08,-r*.10,1,0,0,r*.33);
   hub.addColorStop(0,'#fff3da');
   hub.addColorStop(.25,'#d8a56b');
   hub.addColorStop(.7,'#8f5b2e');
   hub.addColorStop(1,'#4a2c16');
   ctx.fillStyle=hub;
   ctx.beginPath();
   ctx.arc(0,0,r*.30,0,Math.PI*2);
   ctx.fill();
   ctx.strokeStyle='rgba(255,255,255,.35)';
   ctx.lineWidth=1;
   ctx.stroke();

   ctx.fillStyle='#7a4d28';
   ctx.beginPath();
   ctx.arc(0,0,r*.10,0,Math.PI*2);
   ctx.fill();
   ctx.strokeStyle='#f5dfb5';
   ctx.lineWidth=.8;
   ctx.stroke();

   // 中央字樣
   ctx.fillStyle='rgba(255,248,235,.92)';
   ctx.font=`1000 ${Math.max(6,r*.18)}px system-ui`;
   ctx.textAlign='center';
   ctx.textBaseline='middle';
   ctx.fillText(initials(this.c.name),0,.4);

   // 上蠟後的反光帶
   ctx.globalCompositeOperation='screen';
   const varnish=ctx.createLinearGradient(-r,-r,r,r);
   varnish.addColorStop(0,'#ffffff00');
   varnish.addColorStop(.38,'#ffffff00');
   varnish.addColorStop(.50,'#fff6e2b8');
   varnish.addColorStop(.60,'#ffffff00');
   varnish.addColorStop(1,'#ffffff00');
   ctx.fillStyle=varnish;
   ctx.beginPath();
   ctx.arc(0,0,r*.95,0,Math.PI*2);
   ctx.fill();
   ctx.globalCompositeOperation='source-over';

   // 外圈微亮描邊
   ctx.strokeStyle=alpha('#f7e2bd',.40);
   ctx.lineWidth=1.1;
   ctx.beginPath();
   ctx.arc(0,0,r*1.01,0,Math.PI*2);
   ctx.stroke();
   ctx.restore();
  }
 };

 const previousCollide=collide;
 collide=function(a,b){
  if(a.out||b.out||a.burst||b.burst)return;
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=a.r+b.r;
  if(!d||d>=min){previousCollide(a,b);return}
  const nx=dx/d,ny=dy/d,closing=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny);
  previousCollide(a,b);
  if(closing<=0)return;

  function woodDiscipline(wood,custom,dirX,dirY){
   if(!isWoodenCounter(wood)||!isCustomTarget(custom)||custom.out||custom.burst)return;
   const force=clamp(closing/170,.55,1.45);
   const inflation=clamp((averageStats(custom)-82)/18,0,1.4);

   // 數值越誇張，反制越強；一般預設陀螺不會觸發這段效果。
   custom.omega*=1-(.045+.035*force+.055*inflation);
   custom.spin=custom.omega;
   custom.energy=Math.max(0,custom.energy-(2.5+3.5*force+5*inflation));
   custom.tiltVel+=(.18+.17*force)*(1+inflation*.5)/Math.max(.72,custom.tip.stability);
   custom.lift=clamp(custom.lift+.06+.07*force,0,1);
   custom.impactBoost*=clamp(.58-inflation*.18,.30,.58);
   custom.xDashCooldown=Math.max(custom.xDashCooldown,.42+.16*inflation);
   custom.vx+=dirX*(14+18*force);
   custom.vy+=dirY*(14+18*force);

   wood.energy=clamp(wood.energy+.8+.5*inflation,0,100);
   wood.omega*=.994;
   wood.spin=wood.omega;
   wood.tiltVel*=.82;

   const cx=(wood.x+custom.x)/2,cy=(wood.y+custom.y)/2;
   emit(cx,cy,wood.c.accent,22,.92,'streak');
   emit(cx,cy,wood.c.primary,14,.72);
   wave(cx,cy,wood.c.accent,50);
   shake=Math.max(shake,6.2);
   flash=Math.max(flash,.20);
   addLog(`${wood.c.name} 以「返璞歸真」削弱自訂陀螺的灌水數值！`);
  }

  woodDiscipline(a,b,nx,ny);
  woodDiscipline(b,a,-nx,-ny);
 };
})();
