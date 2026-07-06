((G)=>{
  const ui={
    panel:document.querySelector('.progress-panel'),
    level:document.getElementById('playerLevel'),
    xpFill:document.getElementById('xpFill'),
    xpText:document.getElementById('xpText'),
    missionText:document.getElementById('missionText'),
    missionProgress:document.getElementById('missionProgress'),
    hotText:document.getElementById('hotTargetText'),
    hotProgress:document.getElementById('hotProgress')
  };

  const P=G.play={
    level:1,
    xp:0,
    xpNeed:1500,
    mission:null,
    lastMission:'',
    missionTimer:null,
    lastTrackedScore:0,
    hotIndex:0,
    hotHits:0,
    hotNeed:3,
    overdriveUntil:0,
    lastSecond:-1
  };

  const missionFactories={
    bumper:level=>({type:'bumper',label:'撞擊彩色轉盤',target:8+level*2,progress:0}),
    slot:level=>({type:'slot',label:'彈珠進入得分槽',target:2+Math.floor(level/2),progress:0}),
    hot:level=>({type:'hot',label:'命中 HOT 目標',target:2+Math.min(3,Math.floor(level/2)),progress:0}),
    spin:level=>({type:'spin',label:'啟動老虎機',target:1+Math.floor(level/3),progress:0}),
    score:level=>({type:'score',label:'本回合獲得分數',target:1200+level*600,progress:0})
  };

  G.isOverdrive=()=>performance.now()<P.overdriveUntil;

  const baseEffectLabel=G.effectLabel;
  G.effectLabel=()=>{
    const over=Math.max(0,Math.ceil((P.overdriveUntil-performance.now())/1000));
    const fever=G.isFever();
    if(over&&fever)return `X6 ${Math.min(over,Math.max(0,Math.ceil((G.s.feverUntil-performance.now())/1000)))}s`;
    if(over)return `OVERDRIVE ${over}s`;
    return baseEffectLabel();
  };

  function flashClass(name){
    ui.panel.classList.remove(name);
    void ui.panel.offsetWidth;
    ui.panel.classList.add(name);
    setTimeout(()=>ui.panel.classList.remove(name),2200);
  }

  function nextXpNeed(){return 1200+P.level*600}

  function updatePlayUI(){
    if(!ui.level)return;
    ui.level.textContent=P.level;
    ui.xpFill.style.width=`${Math.min(100,P.xp/P.xpNeed*100)}%`;
    ui.xpText.textContent=`${Math.floor(P.xp)}/${P.xpNeed}`;
    if(P.mission){
      ui.missionText.textContent=P.mission.completed?'任務完成！領取獎勵':P.mission.label;
      ui.missionProgress.textContent=`${Math.min(P.mission.progress,P.mission.target)}/${P.mission.target}`;
    }
    const hot=G.bumpers[P.hotIndex];
    ui.hotText.textContent=G.isOverdrive()?'OVERDRIVE：得分 x2':hot?`HOT：${hot.label} 分轉盤`:'HOT 目標準備中';
    ui.hotProgress.textContent=G.isOverdrive()?`${Math.ceil((P.overdriveUntil-performance.now())/1000)}s`:`${P.hotHits}/${P.hotNeed}`;
    ui.panel.querySelector('.hot-line')?.classList.toggle('active',G.isOverdrive()||P.hotHits>0);
  }

  const baseUpdateHud=G.updateHud;
  G.updateHud=()=>{baseUpdateHud();updatePlayUI()};

  function pickMission(){
    const keys=Object.keys(missionFactories).filter(k=>k!==P.lastMission);
    const type=keys[Math.floor(G.rand()*keys.length)];
    P.lastMission=type;
    P.mission=missionFactories[type](P.level);
    updatePlayUI();
  }

  function completeMission(){
    if(!P.mission||P.mission.completed)return;
    P.mission.completed=true;
    const ballReward=2+Math.ceil(P.level/3);
    const scoreReward=300*P.level;
    G.s.balls+=ballReward;
    G.s.score+=scoreReward;
    G.s.superShots+=1;
    G.energy(2,'任務獎勵');
    G.ui.marquee.textContent=`任務完成！+${scoreReward} 分、+${ballReward} 球、+1 超級彈珠`;
    G.haptic([25,25,70]);
    flashClass('complete');
    clearTimeout(P.missionTimer);
    P.missionTimer=setTimeout(pickMission,1300);
    G.updateHud();
  }

  G.playEvent=(type,amount=1)=>{
    if(!P.mission||P.mission.completed||P.mission.type!==type)return;
    P.mission.progress+=amount;
    if(P.mission.progress>=P.mission.target)completeMission();
    else updatePlayUI();
  };

  function levelUp(){
    P.level++;
    P.xpNeed=nextXpNeed();
    G.s.balls+=2;
    G.s.superShots+=1;
    G.energy(1,'升級獎勵');
    G.ui.marquee.textContent=`LEVEL ${P.level}！+2 球、+1 超級彈珠`;
    flashClass('level-up');
    G.haptic([35,25,75]);
  }

  function addXp(amount){
    if(amount<=0)return;
    P.xp+=amount;
    while(P.xp>=P.xpNeed){
      P.xp-=P.xpNeed;
      levelUp();
    }
    updatePlayUI();
  }

  G.trackScore=()=>{
    const now=G.s.score;
    if(now<P.lastTrackedScore){P.lastTrackedScore=now;return}
    const delta=now-P.lastTrackedScore;
    if(delta>0){
      P.lastTrackedScore=now;
      addXp(delta);
      G.playEvent('score',delta);
    }
  };

  function pickHotTarget(){
    if(!G.bumpers.length)return;
    G.bumpers.forEach(b=>b.hot=false);
    let next=Math.floor(G.rand()*G.bumpers.length);
    if(G.bumpers.length>1&&next===P.hotIndex)next=(next+1)%G.bumpers.length;
    P.hotIndex=next;
    P.hotHits=0;
    G.bumpers[next].hot=true;
    updatePlayUI();
  }

  G.onBumperHit=(bumper,ball)=>{
    G.playEvent('bumper',1);
    if(!bumper.hot)return;
    P.hotHits++;
    G.playEvent('hot',1);
    G.award(120+P.level*30,bumper.x,bumper.y-45,G.p.pink);
    G.energy(1,'HOT 目標');
    if(P.hotHits>=P.hotNeed){
      P.overdriveUntil=performance.now()+10000;
      G.s.superShots++;
      G.ui.marquee.textContent='HOT TARGET 完成！10 秒 OVERDRIVE 得分 x2！';
      G.ui.slotStatus.textContent='OVERDRIVE 啟動，獲得 1 發超級彈珠';
      G.particles(bumper.x,bumper.y,G.p.pink,G.compact?22:36);
      G.haptic([35,25,90]);
      pickHotTarget();
    }
    G.updateHud();
  };

  G.playTick=()=>{
    G.trackScore();
    const second=Math.max(0,Math.ceil((P.overdriveUntil-performance.now())/1000));
    if(second!==P.lastSecond){
      P.lastSecond=second;
      G.s.hud=true;
      updatePlayUI();
    }
  };

  const baseAward=G.award;
  G.award=(points,x,y,color)=>baseAward(points*(G.isOverdrive()?2:1),x,y,color);

  const baseBuild=G.buildBoard;
  G.buildBoard=()=>{baseBuild();pickHotTarget()};

  const baseFinish=G.finish;
  G.finish=ball=>{
    const landed=G.slots.some(s=>ball.x>=s.x&&ball.x<s.x+s.w&&ball.y>s.y-5);
    baseFinish(ball);
    if(landed)G.playEvent('slot',1);
  };

  if(!G.symbols.includes('●'))G.symbols.push('●');

  G.chooseSlot=()=>{
    const r=G.rand();
    if(r<.010)return['7','7','7'];
    if(r<.045)return['★','★','★'];
    if(r<.085)return['♛','♛','♛'];
    if(r<.135)return['⚡','⚡','⚡'];
    if(r<.200)return['♥','♥','♥'];
    if(r<.270)return['◆','◆','◆'];
    if(r<.335)return['●','●','●'];
    if(r<.620){
      const pair=G.randomSymbol(),odd=G.randomSymbol(pair),out=[pair,pair,odd];
      out.sort(()=>G.rand()-.5);
      return out;
    }
    const out=[];
    while(out.length<3){const x=G.randomSymbol();if(!out.includes(x))out.push(x)}
    return out;
  };

  const baseApplySlot=G.applySlot;
  G.applySlot=result=>{
    const triple=result[0]===result[1]&&result[1]===result[2];
    if(triple&&result[0]==='●'){
      G.s.superShots+=5;
      G.ui.slotStatus.textContent='MULTIBALL！連續發射 5 顆免費超級彈珠';
      G.ui.marquee.textContent='● MULTIBALL START！';
      G.slotFlash('win');
      G.haptic([20,15,20,15,80]);
      G.updateHud();
      for(let i=0;i<5;i++)setTimeout(()=>G.launch(),250+i*180);
    }else baseApplySlot(result);
    G.playEvent('spin',1);
  };

  const baseReset=G.reset;
  G.reset=()=>{
    baseReset();
    clearTimeout(P.missionTimer);
    P.level=1;
    P.xp=0;
    P.xpNeed=1500;
    P.lastTrackedScore=0;
    P.overdriveUntil=0;
    P.hotHits=0;
    P.lastSecond=-1;
    pickHotTarget();
    pickMission();
    G.updateHud();
  };

  pickMission();
  updatePlayUI();
})(window.PG);
