((G)=>{
  const status=document.getElementById('nextBallStatus');

  G.ballTypes={
    normal:{label:'標準',icon:'●',r:9,speed:1,gravity:1,bounce:.72,pinScore:1,bumperMult:1,kick:1,energy:1,color:'#fff6d6',core:'#4ee9ff',trail:'78,233,255'},
    heavy:{label:'重力',icon:'⬢',r:12,speed:.88,gravity:1.28,bounce:.5,pinScore:1,bumperMult:2,kick:.82,energy:1,color:'#ffd0aa',core:'#ff7a45',trail:'255,122,69'},
    speed:{label:'疾速',icon:'➤',r:7,speed:1.3,gravity:.88,bounce:.82,pinScore:3,bumperMult:1,kick:1.25,energy:1,color:'#d8fbff',core:'#4ee9ff',trail:'78,233,255'},
    lucky:{label:'幸運',icon:'★',r:9,speed:1,gravity:1,bounce:.75,pinScore:1,bumperMult:1,kick:1,energy:2,color:'#fff1a6',core:'#ffd84d',trail:'255,216,77'},
    bomb:{label:'爆裂',icon:'✹',r:10,speed:.95,gravity:1.05,bounce:.66,pinScore:1,bumperMult:1,kick:1.1,energy:1,color:'#ffd0d3',core:'#ff5a5f',trail:'255,90,95'},
    ghost:{label:'幽靈',icon:'◇',r:8,speed:1.05,gravity:.9,bounce:.78,pinScore:1,bumperMult:1,kick:1,energy:1,color:'#eee8ff',core:'#a996ff',trail:'169,150,255'},
    magnet:{label:'磁力',icon:'⊕',r:9,speed:1,gravity:1,bounce:.74,pinScore:1,bumperMult:1,kick:1.05,energy:1,color:'#d9ffe9',core:'#56e39f',trail:'86,227,159'},
    thunder:{label:'雷霆',icon:'⚡',r:11,speed:1.25,gravity:.95,bounce:.85,pinScore:3,bumperMult:2,kick:1.55,energy:2,color:'#fff39a',core:'#ff4f9a',trail:'255,79,154'}
  };

  const queue=[];
  const specialTypes=['heavy','speed','lucky','bomb','ghost','magnet'];
  let missStreak=0;
  let totalBumperHits=0;
  let lastLevel=G.play?.level||1;
  const rewardedMissions=new WeakSet();

  const cfg=type=>G.ballTypes[type]||G.ballTypes.normal;
  const randomSpecial=()=>specialTypes[Math.floor(G.rand()*specialTypes.length)];

  function updateStatus(){
    if(!status)return;
    const type=G.s.superShots>0?'thunder':queue[0]||'normal';
    const ball=cfg(type);
    const extra=G.s.superShots>0?` ×${G.s.superShots}`:queue.length>1?` ＋${queue.length-1}`:'';
    status.textContent=`NEXT ${ball.icon} ${ball.label}彈珠${extra}`;
    status.classList.toggle('special',type!=='normal');
    status.classList.toggle('thunder',type==='thunder');
  }

  G.queueSpecialBall=(type,count=1,reason='特殊條件達成')=>{
    if(!specialTypes.includes(type)||count<=0)return;
    for(let i=0;i<count&&queue.length<8;i++)queue.push(type);
    const ball=cfg(type);
    G.ui.marquee.textContent=`${reason}：下一發變成 ${ball.icon} ${ball.label}彈珠！`;
    G.ui.slotStatus.textContent=`SPECIAL BALL READY：${ball.label}`;
    G.haptic([12,18,28]);
    updateStatus();
  };

  const baseUpdateHud=G.updateHud;
  G.updateHud=()=>{baseUpdateHud();updateStatus()};

  const baseCollide=G.collide;
  G.collide=(ball,obj,extra=0)=>{
    const old=G.bounce;
    G.bounce=Number.isFinite(ball?.bounce)?ball.bounce:old;
    const hit=baseCollide(ball,obj,extra);
    G.bounce=old;
    return hit;
  };

  G.shouldHitPin=(ball,pin)=>{
    if(ball.type!=='ghost')return true;
    const value=(Math.floor(pin.x)*31+Math.floor(pin.y)*17+(ball.phaseSeed||0))%100;
    return value>=72;
  };

  G.applyBallForces=(ball,dt)=>{
    if(ball.type!=='magnet')return;
    let target=null,best=190;
    for(const bumper of G.bumpers){
      const dx=bumper.x-ball.x,dy=bumper.y-ball.y,d=Math.hypot(dx,dy);
      if(d<best){best=d;target=bumper}
    }
    if(!target||best<1)return;
    const force=(1-best/190)*.065*dt;
    ball.vx+=(target.x-ball.x)/best*force;
    ball.vy+=(target.y-ball.y)/best*force;
  };

  G.onPinHit=(pin,ball)=>{
    ball.pinHits=(ball.pinHits||0)+1;
    if(ball.pinHits===12)G.queueSpecialBall('speed',1,'單顆彈珠撞擊 12 根釘子');
  };

  const baseBumperHit=G.onBumperHit;
  G.onBumperHit=(bumper,ball)=>{
    const hotBefore=G.play?.hotHits||0;
    baseBumperHit?.(bumper,ball);

    ball.bumperHits=(ball.bumperHits||0)+1;
    totalBumperHits++;

    if(ball.bumperHits===3){
      G.queueSpecialBall('bomb',1,'單顆彈珠撞擊 3 個彩色轉盤');
    }

    const hotAfter=G.play?.hotHits||0;
    if(hotBefore<2&&hotAfter>=2){
      G.queueSpecialBall('magnet',1,'HOT 目標達到 2/3');
    }

    if(totalBumperHits%10===0){
      G.queueSpecialBall(randomSpecial(),1,'累積撞擊 10 次彩色轉盤');
    }

    if(ball.type==='bomb'&&!ball.exploded){
      ball.exploded=true;
      G.directScore(500+(G.play?.level||1)*60,'✹ 爆裂 +BONUS',G.p.red);
      G.energy(2,'爆裂彈珠');
      G.particles(bumper.x,bumper.y,G.p.red,G.compact?34:60);
      G.s.shake=18;
      G.haptic([35,20,80]);
    }
  };

  const baseFinish=G.finish;
  G.finish=ball=>{
    const landedSlot=G.slots.find(slot=>ball.x>=slot.x&&ball.x<slot.x+slot.w&&ball.y>slot.y-5);
    const oldCombo=G.s.combo;
    baseFinish(ball);

    if(ball.type==='ghost'&&!landedSlot){
      G.s.combo=oldCombo;
      G.ui.marquee.textContent=`◇ 幽靈彈珠落空，COMBO x${oldCombo} 保留`;
    }

    if(ball.type==='lucky'&&landedSlot){
      G.energy(1,'幸運彈珠加成');
      if(G.rand()<.28){
        G.s.balls++;
        G.ui.marquee.textContent='★ 幸運彈珠觸發：額外補回 1 顆球！';
      }
    }

    if(landedSlot){
      missStreak=0;
      if(landedSlot.value>=250)G.queueSpecialBall('heavy',1,'進入高分槽');
      if(oldCombo<4&&G.s.combo>=4)G.queueSpecialBall('lucky',1,'COMBO 達到 x4');
    }else{
      missStreak++;
      if(missStreak>=2){
        missStreak=0;
        G.queueSpecialBall('ghost',1,'連續兩顆彈珠落空');
      }
    }

    G.updateHud();
  };

  G.launch=()=>{
    const s=G.s;
    const free=s.superShots>0;
    const type=free?'thunder':queue.shift()||'normal';

    if(!free&&s.balls<=0){
      G.ui.marquee.textContent=s.ballsLive.length?'等待最後的彈珠落下！':'彈珠用完了，按重新開始！';
      updateStatus();
      return;
    }

    const ballCfg=cfg(type);
    if(free)s.superShots--;
    else s.balls--;

    const speed=ballCfg.speed||1;
    const ball={
      type,
      label:ballCfg.label,
      x:655,
      y:790,
      vx:(-.65-Math.random()*.28)*speed,
      vy:(-11.5-s.power*9)*speed,
      r:ballCfg.r,
      gravityMul:ballCfg.gravity,
      bounce:ballCfg.bounce,
      pinScore:ballCfg.pinScore,
      bumperMult:ballCfg.bumperMult,
      kick:ballCfg.kick,
      energyPerBumper:ballCfg.energy,
      color:ballCfg.color,
      core:ballCfg.core,
      trailColor:ballCfg.trail,
      alive:true,
      trail:[],
      super:type==='thunder',
      exploded:false,
      pinHits:0,
      bumperHits:0,
      phaseSeed:Math.floor(G.rand()*9999)
    };

    s.ballsLive.push(ball);
    G.particles(655,790,ballCfg.core,type==='thunder'?14:(G.compact?6:10));
    G.haptic(type==='thunder'?[12,20,22]:7);
    G.ui.marquee.textContent=`${ballCfg.icon} ${ballCfg.label}彈珠發射！`;
    G.updateHud();
  };

  const basePlayTick=G.playTick;
  G.playTick=()=>{
    basePlayTick?.();

    const level=G.play?.level||1;
    if(level>lastLevel){
      for(let i=lastLevel;i<level;i++)G.queueSpecialBall(randomSpecial(),1,`LEVEL ${i+1} 獎勵`);
      lastLevel=level;
    }

    const mission=G.play?.mission;
    if(mission?.completed&&!rewardedMissions.has(mission)){
      rewardedMissions.add(mission);
      G.queueSpecialBall(randomSpecial(),1,'完成任務');
    }
  };

  const baseApplySlot=G.applySlot;
  G.applySlot=result=>{
    baseApplySlot(result);
    const triple=result[0]===result[1]&&result[1]===result[2];
    if(!triple)return;

    const rewards={
      '7':['lucky',2],
      '★':['lucky',2],
      '♛':['ghost',2],
      '⚡':['speed',3],
      '♥':['magnet',2],
      '◆':['heavy',2],
      '●':['bomb',2]
    };
    const reward=rewards[result[0]];
    if(reward)G.queueSpecialBall(reward[0],reward[1],'老虎機三連線');
  };

  const baseReset=G.reset;
  G.reset=()=>{
    baseReset();
    queue.length=0;
    missStreak=0;
    totalBumperHits=0;
    lastLevel=1;
    updateStatus();
  };

  G.getBallQueue=()=>[...queue];
  updateStatus();
})(window.PG);
