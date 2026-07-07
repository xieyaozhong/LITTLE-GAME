((G)=>{
  const {ctx}=G;

  G.update=dt=>{
    const s=G.s;
    for(const p of G.pins)p.flash=Math.max(0,p.flash-dt);
    for(const b of G.bumpers)b.flash=Math.max(0,b.flash-dt);

    for(const ball of s.ballsLive){
      if(!ball.alive)continue;

      ball.trail.push({x:ball.x,y:ball.y,life:ball.super?18:12});
      if(ball.trail.length>(ball.super?16:10))ball.trail.shift();
      for(const t of ball.trail)t.life-=dt;

      G.applyBallForces?.(ball,dt);
      ball.vy+=G.gravity*(ball.gravityMul||1)*dt;
      ball.vx*=Math.pow(G.friction,dt);
      ball.vy*=Math.pow(G.friction,dt);
      ball.x+=ball.vx*dt;
      ball.y+=ball.vy*dt;

      if(ball.x+ball.r>680){ball.x=680-ball.r;ball.vx*=-ball.bounce}
      if(ball.x-ball.r<38){ball.x=38+ball.r;ball.vx*=-ball.bounce}
      if(ball.y-ball.r<68){ball.y=68+ball.r;ball.vy*=-ball.bounce}
      if(ball.y<145&&ball.x>590)ball.vx-=.28*dt;

      for(const pin of G.pins){
        if(G.shouldHitPin?.(ball,pin)===false)continue;
        if(!G.collide(ball,pin))continue;
        pin.flash=5;
        s.score+=ball.pinScore||1;
        G.setHigh(false);
        s.hud=true;
        G.onPinHit?.(pin,ball);
        if(Math.random()<(G.compact?.08:.15)){
          G.particles(pin.x,pin.y,ball.core||G.p.white,G.compact?2:3);
        }
      }

      for(const bumper of G.bumpers){
        if(!G.collide(ball,bumper,2))continue;

        const now=performance.now();
        if(ball.lastBumper===bumper&&now-(ball.lastBumperAt||0)<180)continue;
        ball.lastBumper=bumper;
        ball.lastBumperAt=now;
        bumper.flash=8;

        G.award(
          bumper.value*(ball.bumperMult||1),
          bumper.x,
          bumper.y-30,
          bumper.color
        );
        G.energy(ball.energyPerBumper||1,'撞擊彩色轉盤');
        G.onBumperHit?.(bumper,ball);
        G.particles(bumper.x,bumper.y,ball.core||bumper.color,G.compact?7:10);
        s.shake=ball.type==='heavy'?7:4;

        const dx=ball.x-bumper.x;
        const dy=ball.y-bumper.y;
        const d=Math.max(1,Math.hypot(dx,dy));
        const kick=ball.kick||1;
        ball.vx+=dx/d*2.2*kick;
        ball.vy+=dy/d*2.2*kick;
      }

      if(ball.y>822||ball.y>G.H+50)G.finish(ball);
    }

    s.ballsLive=s.ballsLive.filter(b=>b.alive||b.y<G.H+80);

    for(const p of s.particles){
      p.x+=p.vx*dt;
      p.y+=p.vy*dt;
      p.vy+=.06*dt;
      p.life-=dt;
    }
    s.particles=s.particles.filter(p=>p.life>0);

    for(const t of s.texts){
      t.y-=.7*dt;
      t.life-=dt;
    }
    s.texts=s.texts.filter(t=>t.life>0);

    s.shake*=G.reduced?.45:.88;
    G.playTick?.();

    const effect=Math.max(0,Math.ceil((s.feverUntil-performance.now())/1000));
    if(effect!==s.lastEffect){s.lastEffect=effect;s.hud=true}
    if(s.hud)G.updateHud();

    if(s.auto&&performance.now()-s.lastAuto>650){
      s.lastAuto=performance.now();
      G.launch();
      if(s.balls<=0&&s.superShots<=0)G.toggleAuto(false);
    }
  };

  G.rect=(x,y,w,h,fill,stroke=null,line=1)=>{
    ctx.fillStyle=fill;
    ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
    if(stroke){
      ctx.strokeStyle=stroke;
      ctx.lineWidth=line;
      ctx.strokeRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
    }
  };

  G.text=(text,x,y,size,color,align='center')=>{
    ctx.save();
    ctx.font=`bold ${size}px "Courier New",monospace`;
    ctx.textAlign=align;
    ctx.textBaseline='middle';
    ctx.fillStyle=G.p.shadow;
    ctx.fillText(text,x+3,y+3);
    ctx.fillStyle=color;
    ctx.fillText(text,x,y);
    ctx.restore();
  };

  G.drawBoard=()=>{
    const p=G.p;
    G.rect(0,0,G.W,G.H,p.bg);

    for(let i=0;i<55;i++){
      const x=i*137%G.W,y=i*83%G.H,z=i%4===0?4:2;
      G.rect(x,y,z,z,i%3===0?p.cyan:'#343a78');
    }

    ctx.strokeStyle=p.rail;
    ctx.lineWidth=24;
    ctx.beginPath();
    ctx.moveTo(35,820);
    ctx.lineTo(35,105);
    ctx.quadraticCurveTo(35,52,90,52);
    ctx.lineTo(615,52);
    ctx.quadraticCurveTo(680,52,680,120);
    ctx.lineTo(680,820);
    ctx.stroke();

    ctx.strokeStyle=p.white;
    ctx.lineWidth=4;
    ctx.stroke();

    ctx.strokeStyle=p.cyan;
    ctx.lineWidth=5;
    ctx.beginPath();
    ctx.moveTo(615,810);
    ctx.lineTo(615,155);
    ctx.quadraticCurveTo(615,90,560,80);
    ctx.stroke();

    G.text('▲',654,740,22,p.yellow);
    G.text('POWER',654,775,13,p.cyan);

    for(const pin of G.pins){
      const color=pin.flash>0?p.yellow:p.white;
      G.rect(pin.x-6,pin.y-6,12,12,p.shadow);
      G.rect(pin.x-4,pin.y-4,8,8,color);
    }

    for(const b of G.bumpers){
      if(b.hot){
        const pulse=4+Math.sin(performance.now()/120)*3;
        ctx.save();
        ctx.strokeStyle=p.pink;
        ctx.lineWidth=5;
        ctx.globalAlpha=.8;
        ctx.beginPath();
        ctx.arc(b.x,b.y,b.r+12+pulse,0,Math.PI*2);
        ctx.stroke();
        ctx.restore();
        G.text('HOT',b.x,b.y-b.r-22,11,p.pink);
      }

      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+6,0,Math.PI*2);
      ctx.fillStyle=p.shadow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
      ctx.fillStyle=b.flash>0?p.white:b.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r-8,0,Math.PI*2);
      ctx.fillStyle=p.bg;
      ctx.fill();
      G.text(b.label,b.x,b.y,15,b.color);
    }

    for(let i=0;i<7;i++){
      const x=46+i*84;
      ctx.strokeStyle=p.white;
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.moveTo(x,790);
      ctx.lineTo(x,910);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(634,790);
    ctx.lineTo(634,910);
    ctx.stroke();

    for(const slot of G.slots){
      G.rect(slot.x,slot.y,slot.w,slot.h,'#121041',slot.color,4);
      G.text(slot.label,slot.x+slot.w/2,slot.y+36,slot.label==='JACKPOT'?12:18,slot.color);
    }

    const title=G.isOverdrive?.()
      ?'⚡ OVERDRIVE x2 ⚡'
      :G.isFever()
        ?'★ FEVER ZONE ★'
        :'LUCKY PIXEL ZONE';
    G.text(title,G.W/2,110,23,G.isOverdrive?.()||G.isFever()?p.pink:p.yellow);
  };

  G.drawBalls=()=>{
    for(const ball of G.s.ballsLive){
      if(!ball.alive)continue;
      const alpha=ball.type==='ghost'?.62:1;

      for(let i=0;i<ball.trail.length;i++){
        const t=ball.trail[i];
        if(t.life<=0)continue;
        const a=(i+1)/ball.trail.length*.42*alpha;
        ctx.fillStyle=`rgba(${ball.trailColor||'78,233,255'},${a})`;
        const size=ball.type==='speed'?6:8;
        ctx.fillRect(t.x-size/2,t.y-size/2,size,size);
      }

      ctx.save();
      ctx.globalAlpha=alpha;
      const r=ball.r||9;
      G.rect(ball.x-r-2,ball.y-r-2,(r+2)*2,(r+2)*2,G.p.shadow);
      G.rect(ball.x-r,ball.y-r,r*2,r*2,ball.color||G.p.white);
      G.rect(ball.x-5,ball.y-5,10,10,ball.core||G.p.cyan);
      G.rect(ball.x-5,ball.y-5,4,4,'#fff');

      if(ball.type==='heavy'){
        G.rect(ball.x-r+3,ball.y+r-6,r*2-6,3,'#8a3f29');
      }else if(ball.type==='bomb'){
        G.rect(ball.x-2,ball.y-r-5,4,6,G.p.yellow);
        G.rect(ball.x-r+3,ball.y-2,r*2-6,4,G.p.red);
      }else if(ball.type==='magnet'){
        ctx.strokeStyle=G.p.green;
        ctx.lineWidth=2;
        ctx.strokeRect(ball.x-r-4,ball.y-r-4,(r+4)*2,(r+4)*2);
      }else if(ball.type==='lucky'){
        G.rect(ball.x-2,ball.y-r-4,4,4,G.p.yellow);
        G.rect(ball.x-r-4,ball.y-2,4,4,G.p.yellow);
        G.rect(ball.x+r,ball.y-2,4,4,G.p.yellow);
      }else if(ball.type==='thunder'){
        G.rect(ball.x+r,ball.y-r,4,7,G.p.yellow);
        G.rect(ball.x-r-4,ball.y+2,4,7,G.p.pink);
      }
      ctx.restore();
    }
  };

  G.drawFx=()=>{
    for(const p of G.s.particles){
      ctx.globalAlpha=Math.max(0,p.life/40);
      G.rect(p.x,p.y,p.size,p.size,p.color);
    }
    ctx.globalAlpha=1;
    for(const t of G.s.texts){
      ctx.globalAlpha=Math.min(1,t.life/20);
      G.text(t.text,t.x,t.y,18,t.color);
    }
    ctx.globalAlpha=1;
  };

  let last=performance.now();
  G.loop=now=>{
    const dt=Math.min(2,(now-last)/16.6667);
    last=now;
    G.update(dt);

    ctx.save();
    if(G.s.shake>0&&!G.reduced){
      ctx.translate((Math.random()-.5)*G.s.shake,(Math.random()-.5)*G.s.shake);
    }
    G.drawBoard();
    G.drawBalls();
    G.drawFx();
    ctx.restore();
    requestAnimationFrame(G.loop);
  };

  G.pointerPower=e=>{
    const r=G.canvas.getBoundingClientRect();
    const y=(e.clientY-r.top)/r.height;
    G.s.power=Math.max(.2,Math.min(1,1-y));
    G.updateHud();
  };

  G.toggleAuto=force=>{
    const s=G.s;
    s.auto=typeof force==='boolean'?force:!s.auto;
    G.ui.auto.innerHTML=`<span class="button-icon">∞</span>自動：${s.auto?'開':'關'}`;
    G.ui.auto.classList.toggle('auto-on',s.auto);
    G.ui.auto.setAttribute('aria-pressed',String(s.auto));
    if(s.auto&&(s.balls>0||s.superShots>0))G.haptic(10);
  };

  G.bind=()=>{
    const s=G.s,u=G.ui;
    G.canvas.addEventListener('pointerdown',e=>{
      s.pointer=true;s.pointerY=e.clientY;s.moved=false;
      G.canvas.setPointerCapture?.(e.pointerId);
    });
    G.canvas.addEventListener('pointermove',e=>{
      if(!s.pointer)return;
      if(Math.abs(e.clientY-s.pointerY)>8)s.moved=true;
      if(s.moved)G.pointerPower(e);
    });
    G.canvas.addEventListener('pointerup',e=>{
      if(!s.pointer)return;
      s.pointer=false;
      G.canvas.releasePointerCapture?.(e.pointerId);
      if(!s.moved)G.launch();
    });
    G.canvas.addEventListener('pointercancel',()=>s.pointer=false);
    u.powerSlider.addEventListener('input',()=>{
      s.power=Number(u.powerSlider.value)/100;
      G.updateHud();
    });
    u.launch.addEventListener('click',G.launch);
    u.auto.addEventListener('click',()=>G.toggleAuto());
    u.reset.addEventListener('click',G.reset);
    u.slotSpin.addEventListener('click',G.spinSlot);

    addEventListener('keydown',e=>{
      if(e.code==='Space'){e.preventDefault();G.launch()}
      if(e.key==='ArrowUp'){s.power=Math.min(1,s.power+.05);G.updateHud()}
      if(e.key==='ArrowDown'){s.power=Math.max(.2,s.power-.05);G.updateHud()}
      if(e.key.toLowerCase()==='s')G.spinSlot();
    });

    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)last=performance.now();
    });
  };

  G.start=()=>{
    G.buildBoard();
    G.ui.slotReels.forEach((r,i)=>G.setSlotReel(r,['7','★','◆'][i]));
    G.bind();
    G.updateHud();
    requestAnimationFrame(G.loop);
  };

  G.start();
})(window.PG);
