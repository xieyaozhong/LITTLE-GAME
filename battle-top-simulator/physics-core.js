/* Rigid-body physics V3 */
let accumulator=0;
document.querySelector('.sub').textContent='以固定時間步進模擬角動量、傾斜進動、底尖摩擦、旋轉交換、X Dash 與低轉速失穩；模型與光影仍由程式即時繪製。';
document.querySelector('.meta-badge').textContent='RIGID-BODY PHYSICS V3';
document.querySelector('#log').textContent='系統已就緒。物理引擎以 120 Hz 固定步進計算陀螺運動。';
document.querySelector('.legend').innerHTML='<span class="chip gravity">中央低點</span><span class="chip inner">主戰碗面</span><span class="chip outer">外層高坡</span>角速度降低後會增加進動與搖擺；碰撞同時計算線動量、自轉與傾斜。';
document.querySelector('.note').textContent='這是即時遊戲用的近似剛體模型；包含真實物理趨勢，但不是工程級三維有限元素模擬。';

const PHYS_DT=1/120,PHYS={bowlG:165,spinBase:.18,airDrag:.00012,stopOmega:3.8,innerBarrierSpeed:135,outerBarrierSpeed:185,liftEnergy:6800};
const TIP_PROFILES={
 lowrush:{label:'Low Rush',mu:.38,rolling:.052,drive:1.28,stability:.70,rail:1.35,bounce:.52},
 rush:{label:'Rush',mu:.34,rolling:.046,drive:1.16,stability:.78,rail:1.25,bounce:.54},
 hexa:{label:'Hexa',mu:.22,rolling:.026,drive:.34,stability:1.38,rail:.56,bounce:.61},
 kick:{label:'Kick',mu:.29,rolling:.043,drive:.92,stability:.82,rail:1.08,bounce:.55},
 elevate:{label:'Elevate',mu:.15,rolling:.024,drive:.47,stability:.98,rail:.74,bounce:.58},
 freeball:{label:'Free Ball',mu:.085,rolling:.014,drive:.18,stability:1.20,rail:.34,bounce:.63},
 level:{label:'Level',mu:.17,rolling:.027,drive:.56,stability:1.02,rail:.78,bounce:.58},
 attack:{label:'Flat',mu:.32,rolling:.046,drive:1.05,stability:.78,rail:1.10,bounce:.54},
 defense:{label:'Point',mu:.20,rolling:.025,drive:.30,stability:1.28,rail:.52,bounce:.62},
 stamina:{label:'Ball',mu:.10,rolling:.016,drive:.20,stability:1.18,rail:.38,bounce:.63},
 balance:{label:'Taper',mu:.18,rolling:.029,drive:.58,stability:1,rail:.76,bounce:.58}
};
function tipProfile(c){const s=(c.combo||'').toLowerCase().replace(/[\s-]/g,'');if(s.includes('lowrush'))return TIP_PROFILES.lowrush;if(s.includes('freeball'))return TIP_PROFILES.freeball;if(s.includes('rush'))return TIP_PROFILES.rush;if(s.includes('hexa'))return TIP_PROFILES.hexa;if(s.includes('kick'))return TIP_PROFILES.kick;if(s.includes('elevate'))return TIP_PROFILES.elevate;if(s.includes('level'))return TIP_PROFILES.level;return TIP_PROFILES[c.type]||TIP_PROFILES.balance}
const cross2=(ax,ay,bx,by)=>ax*by-ay*bx,VisualTop=Top;

Top=class Top extends VisualTop{
 constructor(index,data){
  super(index,data);this.mass=.72+data.w*.0095;this.invMass=1/this.mass;this.inertia=this.mass*this.r*this.r*.52;this.invInertia=1/this.inertia;this.tip=tipProfile(data);
  this.x=W/2+(index?1:-1)*innerR*.40;this.y=H/2+rnd(-innerR*.05,innerR*.05);this.zone='inner';this.rimCooldown=0;this.xDashCooldown=0;this.burstMeter=0;this.impactBoost=0;this.lift=0;
  const sign=data.spin==='L'?-1:1,typeSpin=data.type==='stamina'?7:data.type==='defense'?4:data.type==='attack'?-3:2;
  this.omega0=clamp(35+data.s*.22+typeSpin,38,66);this.omega=sign*this.omega0;this.spin=this.omega;
  this.baseTilt=data.type==='attack'?rnd(.10,.15):data.type==='stamina'?rnd(.035,.065):data.type==='defense'?rnd(.045,.08):rnd(.065,.11);
  this.tilt=this.baseTilt;this.tiltVel=0;this.precession=rnd(0,Math.PI*2);this.nutationPhase=rnd(0,Math.PI*2);this.energy=100;
  const a=index?Math.PI+rnd(-.20,.20):rnd(-.20,.20),v=data.type==='attack'?rnd(142,170):data.type==='balance'?rnd(118,145):data.type==='defense'?rnd(88,112):rnd(72,98);
  this.vx=Math.cos(a)*v;this.vy=Math.sin(a)*v;
 }
 applyBowlForces(dt){
  const cx=W/2,cy=H/2,dx=this.x-cx,dy=this.y-cy,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d;
  let slope;if(d<=innerR){const q=clamp(d/innerR,0,1);slope=.06*q+.46*q*q*q}else{const q=clamp((d-innerR)/(outerR-innerR),0,1);slope=.42+.62*q*q}
  const contact=1-clamp(this.lift,0,.78),a=PHYS.bowlG*slope*contact;this.vx-=nx*a*dt;this.vy-=ny*a*dt;
 }
 applyContactPhysics(dt){
  const w=Math.abs(this.omega),sign=Math.sign(this.omega)||1,low=clamp(1-w/this.omega0,0,1),stability=this.tip.stability*(.88+this.c.d/520);
  this.precession+=sign*(.72+3.15*low*low)*(1+this.tilt*.9)/stability*dt;this.nutationPhase+=(5.2+10.5*low)*dt;
  const target=this.baseTilt+Math.pow(low,1.55)*(.48/stability)+this.lift*.09,spring=17*stability,damping=5.5*Math.sqrt(stability),nut=Math.sin(this.nutationPhase)*(.018+.055*low);
  this.tiltVel+=((target-this.tilt)*spring-this.tiltVel*damping+nut)*dt;this.tilt=clamp(this.tilt+this.tiltVel*dt,.018,.92);
  const driveAngle=this.precession+sign*Math.PI/2,contact=1-clamp(this.lift,0,.82),drive=this.tip.drive*w*(.06+this.tilt)*3.05*contact;
  this.vx+=Math.cos(driveAngle)*drive*dt;this.vy+=Math.sin(driveAngle)*drive*dt;
  const drag=Math.exp(-(.018+this.tip.mu*(.21+this.tilt*.92)+(this.zone==='outer'?.09:0))*contact*dt);this.vx*=drag;this.vy*=drag;
  const speed=mag(this.vx,this.vy),rimRub=Math.pow(Math.max(0,this.tilt-.29),2)*19;
  let loss=PHYS.spinBase+this.tip.rolling*(7+speed*.012)+PHYS.airDrag*w*w+rimRub;loss*=.72+.28*contact;
  this.omega-=sign*Math.min(w,loss*dt);this.spin=this.omega;
  this.burstMeter=Math.max(0,this.burstMeter-dt*.38);this.lift=Math.max(0,this.lift-dt*(1.65+this.lift*.8));this.impactBoost=Math.max(0,this.impactBoost-dt*70);this.xDashCooldown=Math.max(0,this.xDashCooldown-dt);this.rimCooldown=Math.max(0,this.rimCooldown-dt);
  const rot=clamp(w/this.omega0,0,1),upright=clamp(1-this.tilt/.82,0,1);this.energy=w<PHYS.stopOmega?0:clamp(rot*84+upright*16,0,100);
  if(this.energy<=0){this.tilt=clamp(this.tilt+dt*.75,0,.98);this.vx*=Math.exp(-2.4*dt);this.vy*=Math.exp(-2.4*dt)}
 }
 tryXDash(){
  if(this.xDashCooldown>0||this.out||this.burst||this.tip.rail<.42)return;
  const cx=W/2,cy=H/2,dx=this.x-cx,dy=this.y-cy,d=mag(dx,dy)||1,railR=outerR*.845,band=8+this.r*.25;
  if(Math.abs(d-railR)>band||Math.abs(this.omega)<19)return;
  const nx=dx/d,ny=dy/d,sign=Math.sign(this.omega)||1,tx=-ny*sign,ty=nx*sign,along=this.vx*tx+this.vy*ty;if(along<-38)return;
  const boost=clamp(this.tip.rail*(Math.abs(this.omega)*1.28+Math.max(0,along)*.25),42,142);
  this.vx+=tx*boost-nx*boost*.16;this.vy+=ty*boost-ny*boost*.16;this.omega*=.855;this.spin=this.omega;this.tiltVel+=.20+.18*this.tip.rail;this.lift=clamp(this.lift+.15+.09*this.tip.rail,0,1);this.xDashCooldown=1.05;
  emit(this.x,this.y,this.c.primary,24,.92,'streak');wave(this.x,this.y,this.c.accent,44);shake=Math.max(shake,5.5);
  if(performance.now()-lastZoneLog>650){addLog(`${this.c.name} 的軸尖咬合 Xtreme Line，將部分自轉轉換成 X Dash！`);lastZoneLog=performance.now()}
 }
 update(dt,opponent){
  if(this.out||this.burst)return;this.applyBowlForces(dt);this.applyContactPhysics(dt);this.tryXDash();
  const speed=mag(this.vx,this.vy),max=230+this.c.a*.95+this.impactBoost;if(speed>max){this.vx=this.vx/speed*max;this.vy=this.vy/speed*max}
  this.x+=this.vx*dt;this.y+=this.vy*dt;this.handleRims();this.angle+=this.omega*dt;
  this.trail.push({x:this.x,y:this.y,l:1});if(this.trail.length>(this.c.type==='attack'?31:25))this.trail.shift();this.trail.forEach(p=>p.l-=dt*(this.c.type==='stamina'?1.45:2.15));this.trail=this.trail.filter(p=>p.l>0);
 }
 handleRims(){
  const cx=W/2,cy=H/2,dx=this.x-cx,dy=this.y-cy,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d,radial=this.vx*nx+this.vy*ny;
  if(this.zone==='inner'&&d>innerR-this.r*.88&&this.rimCooldown<=0){
   const outward=Math.max(0,radial),kinetic=.5*this.mass*outward*outward+this.lift*PHYS.liftEnergy+this.impactBoost*55,barrier=.5*this.mass*PHYS.innerBarrierSpeed**2;
   if(kinetic>barrier){this.zone='outer';this.rimCooldown=.18;this.x=cx+nx*(innerR+this.r*.18);this.y=cy+ny*(innerR+this.r*.18);this.vx*=.93;this.vy*=.93;this.omega*=.985;this.spin=this.omega;this.lift=clamp(this.lift+.12,0,1);wave(this.x,this.y,'#ffd166',38);emit(this.x,this.y,'#ffd166',16,.72)}
   else{this.x=cx+nx*(innerR-this.r*.72);this.y=cy+ny*(innerR-this.r*.72);const e=clamp(this.tip.bounce+.08*this.c.d/100,.48,.72),nr=-Math.max(42,outward*e),tx=this.vx-radial*nx,ty=this.vy-radial*ny;this.vx=tx*.91+nr*nx;this.vy=ty*.91+nr*ny;this.omega*=.982;this.spin=this.omega;this.tiltVel+=outward*.0015;this.rimCooldown=.085;wave(this.x,this.y,'#8fd8ff',30)}
  }
  if(this.zone==='outer'){
   if(d<innerR-this.r*.36&&radial<0){this.zone='inner';this.rimCooldown=.14;wave(this.x,this.y,'#8fffc6',28)}
   if(d>outerR-this.r*.92&&this.rimCooldown<=0){
    const outward=Math.max(0,radial),kinetic=.5*this.mass*outward*outward+this.lift*PHYS.liftEnergy+this.impactBoost*70,ang=Math.atan2(dy,dx),opening=Math.abs(Math.sin(ang))<.22,escape=PHYS.outerBarrierSpeed*(opening?.72:1),barrier=.5*this.mass*escape**2;
    if(kinetic>barrier){this.out=true;emit(this.x,this.y,this.c.primary,76,1.55);emit(this.x,this.y,this.c.accent,34,1.1,'streak');wave(this.x,this.y,this.c.primary,72);shake=Math.max(shake,16);flash=.85;addLog(`${this.c.name} 的動能與離地量足以${opening?'穿過外層缺口':'越過外牆'}，正式出局！`)}
    else{this.x=cx+nx*(outerR-this.r*.78);this.y=cy+ny*(outerR-this.r*.78);const e=clamp(.58+this.tip.bounce*.12,.58,.70),nr=-Math.max(64,outward*e),tx=this.vx-radial*nx,ty=this.vy-radial*ny;this.vx=tx*.88+nr*nx;this.vy=ty*.88+nr*ny;this.omega*=.972;this.spin=this.omega;this.tiltVel+=outward*.0021;this.lift*=.55;this.rimCooldown=.11;wave(this.x,this.y,'#ffd38b',38);emit(this.x,this.y,'#ffd38b',14,.58)}
   }
  }
 }
};
