/* Twin Nova: automatic separable two-top battle system */
(() => {
 const TWIN_KEY='twinNova';
 const TWIN_NOVA={
  label:'[SPECIAL] 雙生星核｜Twin Nova',
  name:'雙生星核',englishName:'Twin Nova',
  combo:'2-Core 5-70 Split Point',
  rank:'雙軌星核・裂變繼承',tier:'SPECIAL',type:'balance',
  a:82,d:83,s:84,w:82,b:94,spin:'R',shape:'twinNova',
  splitTop:true,splitChildName:'星核 β',
  primary:'#35ddff',secondary:'#9b6cff',accent:'#fff3ad',metal:'#dcecff'
 };
 metaPresets[TWIN_KEY]=TWIN_NOVA;

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.splitTop)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box split-ability';
  ability.innerHTML='<strong>雙生分離機構</strong>承受強碰撞後，主體會自動釋放第二顆陀螺。兩顆各自保有角速度、碰撞體與勝負資格；同隊必須全部停止才算落敗。<div class="combo-tags"><span>自動碰撞觸發</span><span>2-IN-1</span><span>角動量分配</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 function rebuildRigidBody(top,mass,radius){
  top.mass=Math.max(.22,mass);
  top.invMass=1/top.mass;
  top.r=Math.max(8,radius);
  top.inertia=top.mass*top.r*top.r*.52;
  top.invInertia=1/top.inertia;
 }

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.teamIndex=index?1:0;
   this.hudWeight=1;
   this.hasSplit=false;
   this.splitPart=data.splitPart||'';
   this.splitCooldown=.55;
   this.lastEnemyImpact=0;
   this.splitBornAt=-99;
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.splitCooldown=Math.max(0,this.splitCooldown-dt);
   this.lastEnemyImpact*=Math.exp(-7.5*dt);
  }
  bladeCount(){
   if(this.c.shape==='twinNova')return this.splitPart?5:10;
   if(this.c.shape==='twinNovaChild')return 4;
   return super.bladeCount();
  }
  bladeRadius(i){
   if(this.c.shape==='twinNova'){
    const profile=this.splitPart?[1.08,.82,.94,.76]:[1.11,.83,.98,.79,.91];
    return this.r*profile[i%profile.length];
   }
   if(this.c.shape==='twinNovaChild'){
    const profile=[1.09,.78,.96,.82];
    return this.r*profile[i%profile.length];
   }
   return super.bladeRadius(i);
  }
  drawModel(speed){
   super.drawModel(speed);
   if(this.c.shape!=='twinNova'&&this.c.shape!=='twinNovaChild')return;
   const combined=this.c.shape==='twinNova'&&!this.splitPart;
   const mark=combined?'∞':(this.splitPart||'β');
   ctx.save();
   ctx.translate(this.x,this.y);
   ctx.rotate(this.angle*.58);
   ctx.globalCompositeOperation='screen';
   ctx.shadowBlur=12;
   ctx.shadowColor=this.c.accent;
   ctx.strokeStyle=alpha(this.c.accent,combined?.86:.70);
   ctx.lineWidth=Math.max(1.2,this.r*.075);
   if(combined)ctx.setLineDash([this.r*.20,this.r*.12]);
   ctx.beginPath();
   ctx.arc(0,0,this.r*(combined?.70:.62),0,Math.PI*2);
   ctx.stroke();
   ctx.setLineDash([]);
   if(combined){
    ctx.strokeStyle=alpha(this.c.secondary,.82);
    ctx.lineWidth=Math.max(1,this.r*.055);
    ctx.beginPath();
    ctx.arc(0,0,this.r*.46,0,Math.PI*2);
    ctx.stroke();
    ctx.beginPath();ctx.moveTo(-this.r*.62,0);ctx.quadraticCurveTo(0,-this.r*.28,this.r*.62,0);ctx.stroke();
    ctx.strokeStyle=alpha(this.c.primary,.78);ctx.beginPath();ctx.moveTo(-this.r*.62,0);ctx.quadraticCurveTo(0,this.r*.28,this.r*.62,0);ctx.stroke();
   }
   ctx.globalCompositeOperation='source-over';
   ctx.fillStyle='#fff';
   ctx.font=`1000 ${Math.max(7,this.r*.42)}px system-ui`;
   ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillText(mark,0,.5);
   ctx.restore();
  }
 };

 function active(top){return !!top&&!top.out&&!top.burst&&!(top.energy<=0&&mag(top.vx,top.vy)<24)}
 function teamOf(top){return top.teamIndex??(top.index?1:0)}
 function teamTops(team){return tops.filter(t=>teamOf(t)===team)}
 function nearestEnemy(top){
  let best=null,bestD=Infinity;
  tops.forEach(other=>{
   if(other===top||teamOf(other)===teamOf(top)||!active(other))return;
   const d=mag(other.x-top.x,other.y-top.y);
   if(d<bestD){best=other;bestD=d}
  });
  return best;
 }

 function separateFriends(a,b){
  if(a.out||b.out||a.burst||b.burst)return;
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy)||.001,min=a.r+b.r+2;
  if(d>=min)return;
  const nx=dx/d,ny=dy/d,push=(min-d)*.52;
  a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;
  a.vx-=nx*5;a.vy-=ny*5;b.vx+=nx*5;b.vy+=ny*5;
 }

 const previousCollide=collide;
 collide=function(a,b){
  if(teamOf(a)===teamOf(b)){separateFriends(a,b);return}
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=a.r+b.r;
  let closing=0,contact=false;
  if(d&&d<min){
   const nx=dx/d,ny=dy/d;
   closing=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny);
   contact=closing>0;
  }
  previousCollide(a,b);
  if(contact){
   a.lastEnemyImpact=Math.max(a.lastEnemyImpact,closing);
   b.lastEnemyImpact=Math.max(b.lastEnemyImpact,closing);
  }
 };

 function performSplit(parent){
  if(!parent?.c?.splitTop||parent.hasSplit||parent.out||parent.burst)return false;
  parent.hasSplit=true;
  parent.splitPart='α';
  parent.splitBornAt=time;
  parent.hudWeight=.58;
  parent.burstMeter*=.32;

  const oldR=parent.r,oldMass=parent.mass,oldOmega=parent.omega,oldEnergy=parent.energy;
  const speed=mag(parent.vx,parent.vy)||1;
  let nx=-parent.vy/speed,ny=parent.vx/speed;
  if((parent.index?1:-1)*Math.sin(parent.angle)<0){nx=-nx;ny=-ny}
  const gap=oldR*.72;

  rebuildRigidBody(parent,oldMass*.56,oldR*.87);
  parent.x+=nx*gap*.48;parent.y+=ny*gap*.48;
  parent.vx+=nx*42;parent.vy+=ny*42;
  parent.omega=oldOmega*.90;parent.spin=parent.omega;
  parent.energy=clamp(oldEnergy*.72,18,76);
  parent.tiltVel+=.075;
  parent.lift=clamp(parent.lift+.07,0,1);

  const childData={
   ...parent.c,
   name:parent.c.splitChildName||'星核 β',englishName:'Twin Nova Beta',
   combo:'Split Core・Free Point',rank:'雙生子機・高速干擾',tier:'SPLIT',
   type:'attack',a:76,d:72,s:70,w:55,b:92,
   shape:'twinNovaChild',splitTop:false,splitPart:'β',
   primary:parent.c.secondary,secondary:parent.c.primary,accent:'#fff6be',metal:'#dcecff'
  };
  const child=new Top(parent.index,childData);
  child.teamIndex=parent.teamIndex;
  child.splitPart='β';
  child.hasSplit=true;
  child.hudWeight=.42;
  child.splitBornAt=time;
  child.splitCooldown=.60;
  rebuildRigidBody(child,oldMass*.44,oldR*.73);
  child.x=parent.x-nx*gap*1.25;child.y=parent.y-ny*gap*1.25;
  child.vx=parent.vx-nx*105+Math.cos(parent.angle)*18;
  child.vy=parent.vy-ny*105+Math.sin(parent.angle)*18;
  child.omega=oldOmega*.82;child.spin=child.omega;child.omega0=Math.max(1,Math.abs(child.omega));
  child.energy=clamp(oldEnergy*.58,16,64);
  child.tilt=clamp(parent.tilt*.88,.025,.42);
  child.tiltVel=-parent.tiltVel*.35;
  child.zone=parent.zone;
  child.rimCooldown=.28;
  child.xDashCooldown=.42;
  child.burstMeter=0;
  tops.push(child);

  emit(parent.x,parent.y,parent.c.primary,42,1.05,'streak');
  emit(child.x,child.y,child.c.primary,34,.92);
  wave((parent.x+child.x)/2,(parent.y+child.y)/2,parent.c.accent,72);
  shake=Math.max(shake,9.5);flash=Math.max(flash,.38);
  addLog(`${parent.c.name} 承受強碰撞後自動觸發雙生分離：α 主體與 β 子陀螺開始協同戰鬥！`);
  return true;
 }

 function tryAutoSplit(top){
  if(!top?.c?.splitTop||top.hasSplit||top.splitCooldown>0||time<.75)return;
  if(top.lastEnemyImpact>=86||top.burstMeter>=34)performSplit(top);
 }

 function sideEnergy(team){
  const members=teamTops(team);
  if(!members.length)return 0;
  return clamp(members.reduce((sum,t)=>sum+(t.hudWeight||1)*clamp(t.energy,0,100),0),0,100);
 }
 bars=function(){
  if(!tops.length)return;
  document.querySelector('#e1').style.width=sideEnergy(0)+'%';
  document.querySelector('#e2').style.width=sideEnergy(1)+'%';
 };

 function sideDefeated(team){const members=teamTops(team);return members.length>0&&members.every(t=>!active(t))}
 function sideJudgeScore(team){
  return teamTops(team).reduce((sum,t)=>{
   const spinRatio=clamp(Math.abs(t.omega||t.spin||0)/Math.max(1,Math.abs(t.omega0||30)),0,1);
   return sum+(t.hudWeight||1)*(clamp(t.energy,0,100)+spinRatio*18);
  },0);
 }
 function finishBattle(win,why){
  running=false;paused=false;score[win]++;
  document.querySelector('#s1').textContent=score[0];document.querySelector('#s2').textContent=score[1];
  document.querySelector('#start').disabled=false;document.querySelector('#start').textContent='再戰一場';
  document.querySelector('#pause').disabled=true;
  const lead=teamTops(win).find(active)||teamTops(win)[0];
  const sideName=win===0?cfg.p1.name:cfg.p2.name;
  over.classList.remove('hide');
  over.innerHTML=`<div><div class="big" style="color:${lead?.c?.primary||'#fff'}">${sideName} 勝利</div><div class="small">${why}・${time.toFixed(1)} 秒</div></div>`;
  addLog(`${sideName} 以「${why}」取得勝利！`);
 }
 result=function(){
  if(tops.length<2)return;
  const lost0=sideDefeated(0),lost1=sideDefeated(1);
  if(lost0&&lost1){
   const win=sideJudgeScore(0)>=sideJudgeScore(1)?0:1;
   finishBattle(win,'最後動能判定');return;
  }
  if(lost0||lost1){
   const loser=lost0?0:1,fallen=teamTops(loser);
   let why='團隊持久勝利';
   if(fallen.some(t=>t.burst))why='團隊爆裂勝利';
   else if(fallen.some(t=>t.out))why='團隊極限出界勝利';
   finishBattle(1-loser,why);return;
  }
  if(time>80){
   const win=sideJudgeScore(0)>=sideJudgeScore(1)?0:1;
   finishBattle(win,'時間動能判定');
  }
 };

 loop=function(ts){
  const frame=Math.min((ts-last)/1000||0,.05);last=ts;
  if(running&&!paused){
   accumulator+=frame;let n=0;
   while(accumulator>=PHYS_DT&&n<7&&running){
    time+=PHYS_DT;
    const frameTops=[...tops];
    frameTops.forEach(t=>t.update(PHYS_DT,nearestEnemy(t)));
    for(let i=0;i<tops.length;i++)for(let j=i+1;j<tops.length;j++)collide(tops[i],tops[j]);
    [...tops].forEach(tryAutoSplit);
    effects(PHYS_DT);result();
    accumulator-=PHYS_DT;n++;
   }
   if(n===7)accumulator=0;
   bars();
  }else{effects(frame);accumulator=0}
  drawScene();requestAnimationFrame(loop);
 };

 const style=document.createElement('style');
 style.textContent='.split-ability{border-color:#8d5cff55;background:linear-gradient(135deg,#3bd5ff12,#8d5cff18)}';
 document.head.appendChild(style);

 document.querySelector('#start').onclick=()=>{
  tops=[new Top(0,cfg.p1),new Top(1,cfg.p2)];time=0;accumulator=0;running=true;paused=false;
  particles=[];waves=[];shake=0;flash=0;
  document.querySelector('#start').disabled=true;document.querySelector('#pause').disabled=false;document.querySelector('#pause').textContent='暫停';
  document.querySelector('#n1').textContent=cfg.p1.name;document.querySelector('#n2').textContent=cfg.p2.name;
  over.classList.remove('hide');over.innerHTML='<div><div class="big">3・2・1</div><div class="small">LET IT RIP!</div></div>';
  setTimeout(()=>over.classList.add('hide'),650);
  addLog(`${cfg.p1.name}（${launchPointLabel(tops[0].launchPoint)}）對決 ${cfg.p2.name}（${launchPointLabel(tops[1].launchPoint)}）！${cfg.p1.splitTop||cfg.p2.splitTop?'自動雙生分離機構已待命。':'角動量與接觸摩擦開始計算。'}`);
 };

 cfg.p1={...TWIN_NOVA,preset:TWIN_KEY};
 renderPanel('p1');renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;
 document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='「雙生星核」已加入：強碰撞時會自動分裂成 α 主體與 β 子陀螺，兩者都會獨立旋轉、碰撞並參與勝負判定。';
})();
