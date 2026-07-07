collide=function(a,b){
 if(a.out||b.out||a.burst||b.burst)return;const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=a.r+b.r;if(!d||d>=min)return;
 const nx=dx/d,ny=dy/d,overlap=min-d,totalInv=a.invMass+b.invMass;a.x-=nx*overlap*a.invMass/totalInv;a.y-=ny*overlap*a.invMass/totalInv;b.x+=nx*overlap*b.invMass/totalInv;b.y+=ny*overlap*b.invMass/totalInv;
 const rax=nx*a.r,ray=ny*a.r,rbx=-nx*b.r,rby=-ny*b.r,vax=a.vx-a.omega*ray,vay=a.vy+a.omega*rax,vbx=b.vx-b.omega*rby,vby=b.vy+b.omega*rbx,rvx=vbx-vax,rvy=vby-vay,vn=rvx*nx+rvy*ny;if(vn>=0)return;
 const impact=-vn,e=clamp(.60-impact*.00075+(a.c.d+b.c.d)*.00035,.30,.61),jn=-(1+e)*vn/totalInv,tx=-ny,ty=nx,vt=rvx*tx+rvy*ty,raT=cross2(rax,ray,tx,ty),rbT=cross2(rbx,rby,tx,ty),den=totalInv+raT*raT*a.invInertia+rbT*rbT*b.invInertia;
 let jt=-vt/den;const mu=clamp(.12+(a.tip.mu+b.tip.mu)*.22+(a.c.a+b.c.a)*.00055,.14,.38);jt=clamp(jt,-mu*jn,mu*jn);
 const ix=nx*jn+tx*jt,iy=ny*jn+ty*jt;a.vx-=ix*a.invMass;a.vy-=iy*a.invMass;b.vx+=ix*b.invMass;b.vy+=iy*b.invMass;a.omega+=cross2(rax,ray,-ix,-iy)*a.invInertia;b.omega+=cross2(rbx,rby,ix,iy)*b.invInertia;
 const reduced=1/totalInv,shock=.5*reduced*impact*impact+Math.abs(jt*vt)*.5,align=.64+.36*Math.abs(Math.sin(a.angle*a.bladeCount()-b.angle*b.bladeCount())),loss=clamp(impact*.00024,0,.065);
 a.omega*=1-loss*(1.08-b.c.d/260);b.omega*=1-loss*(1.08-a.c.d/260);a.spin=a.omega;b.spin=b.omega;a.impactBoost=Math.max(a.impactBoost,impact*.46*b.c.a/100);b.impactBoost=Math.max(b.impactBoost,impact*.46*a.c.a/100);
 const lift=clamp(impact/430,0,.72);a.lift=clamp(a.lift+lift*(.42+b.c.a/220),0,1);b.lift=clamp(b.lift+lift*(.42+a.c.a/220),0,1);a.tiltVel+=(rnd(-1,1)*.22+impact*.0015)/a.tip.stability;b.tiltVel+=(rnd(-1,1)*.22+impact*.0015)/b.tip.stability;
 a.burstMeter+=shock*align*(112-a.c.b)/56000;b.burstMeter+=shock*align*(112-b.c.b)/56000;
 const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;emit(cx,cy,'#fff7d6',Math.min(38,10+impact/6),clamp(.55+impact/260,.6,1.35));emit(cx,cy,'#ffb74d',Math.min(20,5+impact/11),.72,'streak');wave(cx,cy,'#fff',clamp(24+impact*.16,24,62));shake=Math.max(shake,clamp(impact*.035,2,13));flash=Math.max(flash,clamp(impact/600,.06,.48));
 [a,b].forEach(t=>{if(t.burstMeter>=100){t.burst=true;emit(t.x,t.y,t.c.primary,90,1.85);emit(t.x,t.y,t.c.accent,45,1.3,'streak');shake=18;flash=1;addLog(`${t.c.name} 的棘輪承受累積衝擊後爆裂！`)}});
};

const visualArena=drawArenaBase;
drawArenaBase=function(){visualArena();const cx=W/2,cy=H/2,r=outerR*.845;ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle='#ffe29a66';ctx.lineWidth=3;ctx.shadowBlur=10;ctx.shadowColor='#ffcc6677';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<42;i++){const a=i*Math.PI*2/42,r1=r-4,r2=r+4;ctx.strokeStyle=i%2?'#fff1bd66':'#ffbd5a55';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);ctx.stroke()}ctx.restore()};

loop=function(ts){const frame=Math.min((ts-last)/1000||0,.05);last=ts;if(running&&!paused){accumulator+=frame;let n=0;while(accumulator>=PHYS_DT&&n<7&&running){time+=PHYS_DT;tops[0].update(PHYS_DT,tops[1]);tops[1].update(PHYS_DT,tops[0]);collide(tops[0],tops[1]);effects(PHYS_DT);result();accumulator-=PHYS_DT;n++}if(n===7)accumulator=0;bars()}else{effects(frame);accumulator=0}drawScene();requestAnimationFrame(loop)};

$('#start').onclick=()=>{tops=[new Top(0,cfg.p1),new Top(1,cfg.p2)];time=0;accumulator=0;running=true;paused=false;particles=[];waves=[];shake=0;flash=0;$('#start').disabled=true;$('#pause').disabled=false;$('#pause').textContent='暫停';$('#n1').textContent=cfg.p1.name;$('#n2').textContent=cfg.p2.name;over.classList.remove('hide');over.innerHTML='<div><div class="big">3・2・1</div><div class="small">LET IT RIP!</div></div>';setTimeout(()=>over.classList.add('hide'),650);addLog(`${cfg.p1.name}（${launchPointLabel(tops[0].launchPoint)}）對決 ${cfg.p2.name}（${launchPointLabel(tops[1].launchPoint)}）！角動量與接觸摩擦開始計算。`)};
$('#pause').onclick=()=>{if(!running)return;paused=!paused;accumulator=0;$('#pause').textContent=paused?'繼續':'暫停'};
$('#reset').onclick=()=>{running=false;paused=false;accumulator=0;tops=[];particles=[];waves=[];shake=0;flash=0;score=[0,0];$('#s1').textContent=$('#s2').textContent='0';$('#start').disabled=false;$('#start').textContent='開始戰鬥';$('#pause').disabled=true;$('#e1').style.width=$('#e2').style.width='100%';over.classList.remove('hide');over.innerHTML='<div><div class="big">READY</div><div class="small">選好陀螺後開始戰鬥</div></div>';addLog('模擬器已重置。物理狀態、角速度、傾斜、發射點與碰撞累積已清除。')};
