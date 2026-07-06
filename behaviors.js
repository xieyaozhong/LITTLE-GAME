const reactionLines={
  cat:{rare:'哇！貓掌抓到大獎了喵！',normal:'不錯喵，這個也很好！',retry:'還能再玩一次喵！',miss:'尾巴不要垂下來，下次一定行喵！'},
  bear:{rare:'熊熊一推就推出大獎！',normal:'穩穩拿下這一格！',retry:'再蓄一次力！',miss:'沒關係，熊熊陪你再挑戰。'},
  rabbit:{rare:'咻！大獎被我追到了！',normal:'速度剛剛好！',retry:'再跳一次！',miss:'剛剛跑過頭啦，下次更快！'},
  akira:{rare:'果然，勝負從第一手就決定了。',normal:'這是計算之內的結果。',retry:'局面還沒結束，再下一手。',miss:'失手也要記住，下一局會更準。'},
  sai:{rare:'啊！這就是神之一手的光芒！',normal:'命運落在這一格，也很美呢。',retry:'棋局尚未終結，再來一手吧！',miss:'唔……此局未成，下一手一定更精彩！'}
};

characters.akira.description='雙轉型：第一次停下後，還會再精準補轉一次。';
characters.akira.start='先看第一個落點。';
characters.sai.description='加速型：輪盤不停變快，最後像落子般瞬間停止。';
characters.sai.start='輪盤啊，不斷加速吧！';

const specialStyle=document.createElement('style');
specialStyle.textContent=`
.wheel-box.reaction-rare .pixel-helper{animation:reactionRare .55s steps(4,end) 2!important;filter:drop-shadow(0 0 12px #fff27b) drop-shadow(4px 4px 0 rgba(36,23,58,.25))}
.wheel-box.reaction-normal .pixel-helper{animation:reactionNormal .5s steps(3,end) 2!important}
.wheel-box.reaction-retry .pixel-helper{animation:reactionRetry .38s steps(3,end) 3!important}
.wheel-box.reaction-miss .pixel-helper{animation:reactionMiss .75s steps(3,end) 1!important}
.wheel-box.sai-accelerating .wheel-shell{filter:drop-shadow(0 0 8px #d8c6ff)}
.wheel-box.sai-accelerating .aura{animation:saiOverdrive .2s steps(2,end) infinite!important}
.wheel-box.sudden-stop .wheel-shell{animation:suddenStop .22s steps(3,end)}
.wheel-box.akira-second-spin .pixel-helper{filter:drop-shadow(0 0 9px #c9ffd8) drop-shadow(4px 4px 0 rgba(36,23,58,.25))}
@keyframes reactionRare{50%{transform:translateY(-18px) scale(1.08)}}
@keyframes reactionNormal{50%{transform:translateY(-6px) rotate(3deg)}}
@keyframes reactionRetry{50%{transform:translateY(-11px) rotate(-4deg)}}
@keyframes reactionMiss{45%{transform:translateY(7px) rotate(-5deg) scaleY(.94)}}
@keyframes saiOverdrive{50%{opacity:.25;transform:scale(1.25)}}
@keyframes suddenStop{0%{transform:translateX(-4%)}35%{transform:translateX(-1%)}70%{transform:translateX(-7%)}100%{transform:translateX(-4%)}}
`;
document.head.appendChild(specialStyle);

function outcomeType(winner){
  const name=winner.name.toLowerCase();
  if(/再抽|重抽|重來|try\s*again|again/.test(name))return'retry';
  if(/銘謝|謝謝|未中|沒中|落空|再接再厲|thanks|thank\s*you/.test(name))return'miss';
  const minimum=Math.min(...prizes.map(item=>item.probability));
  if(winner.probability<=Math.max(.1,minimum+1e-9))return'rare';
  return'normal';
}

function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}

function targetRotation(prize,extraLoops){
  const center=(prize.startDeg+prize.endDeg)/2;
  const target=(360-center)%360;
  const current=((rotation%360)+360)%360;
  const delta=(target-current+360)%360;
  return rotation+extraLoops*360+delta;
}

function animateWheel(to,duration,ease,options={}){
  const from=rotation;
  const tickStep=options.tickStep||12;
  const baseTone=options.baseTone||520;
  return new Promise(resolve=>{
    const started=performance.now();
    let lastTick=-1;
    function frame(now){
      const progress=Math.min((now-started)/duration,1);
      const eased=ease(progress);
      rotation=from+(to-from)*eased;
      canvas.style.transform=`rotate(${rotation}deg)`;
      const tick=Math.floor(rotation/tickStep);
      if(tick!==lastTick){
        lastTick=tick;
        const tone=options.tone?options.tone(progress):baseTone+Math.min(progress*240,240);
        beep(tone,options.beepLength||.024,options.volume||.025);
      }
      options.onProgress?.(progress);
      if(progress<1)requestAnimationFrame(frame);else{rotation=to;resolve()}
    }
    requestAnimationFrame(frame);
  });
}

function lockGame(){
  spinning=true;
  settingsPanel.open=false;
  spinBtn.disabled=updateBtn.disabled=true;
  characterGrid.querySelectorAll('button').forEach(button=>button.disabled=true);
  wheelBox.classList.add('is-spinning');
}

function unlockGame(){
  spinning=false;
  spinBtn.disabled=updateBtn.disabled=false;
  characterGrid.querySelectorAll('button').forEach(button=>button.disabled=false);
  wheelBox.classList.remove('is-spinning','sai-accelerating','akira-second-spin');
}

function showReaction(characterKey,winner){
  const type=outcomeType(winner);
  const line=reactionLines[characterKey][type];
  helperBubble.textContent=line;
  wheelBox.classList.remove('reaction-rare','reaction-normal','reaction-retry','reaction-miss');
  wheelBox.classList.add(`reaction-${type}`);
  setTimeout(()=>wheelBox.classList.remove(`reaction-${type}`),1900);
  screen.innerHTML=`恭喜抽中！<strong>${esc(winner.name)}</strong><small>${characters[characterKey].name}・${line}</small>`;
  const finishTones={cat:[784,988],bear:[523,659],rabbit:[988,1174],akira:[659,880],sai:[880,1320]}[characterKey];
  beep(finishTones[0],.12,.06);
  setTimeout(()=>beep(finishTones[1],.16,.06),120);
  if(type==='rare'||type==='retry')celebrate();
}

async function normalCharacterSpin(characterKey,winner){
  const role=characters[characterKey];
  const loops=role.minSpins+Math.floor(Math.random()*(role.maxSpins-role.minSpins+1));
  await wait(role.windup);
  await animateWheel(targetRotation(winner,loops),role.duration,role.ease,{tickStep:role.tickStep,baseTone:role.baseTone,volume:characterKey==='bear'?.035:.025});
}

async function akiraDoubleSpin(winner,winnerIndex){
  const available=prizes.length-1;
  const offset=1+Math.floor(Math.random()*Math.max(1,available));
  const decoyIndex=(winnerIndex+offset)%prizes.length;
  const decoy=prizes[decoyIndex===winnerIndex?(winnerIndex+1)%prizes.length:decoyIndex];
  helperBubble.textContent='先確認第一個落點。';
  screen.innerHTML='塔矢亮正在計算第一手…';
  await wait(500);
  await animateWheel(targetRotation(decoy,3+Math.floor(Math.random()*2)),3000,p=>1-Math.pow(1-p,4),{tickStep:14,baseTone:590});
  wheelBox.classList.remove('is-spinning');
  helperBubble.textContent='……還沒結束。';
  screen.innerHTML=`第一次停在「${esc(decoy.name)}」<br><strong>再轉一次</strong>`;
  beep(440,.11,.045);
  await wait(850);
  wheelBox.classList.add('is-spinning','akira-second-spin');
  helperBubble.textContent='這才是最後一手。';
  await animateWheel(targetRotation(winner,1+Math.floor(Math.random()*2)),2200,p=>1-Math.pow(1-p,4.5),{tickStep:11,baseTone:660,volume:.03});
}

async function saiAcceleratingSpin(winner){
  helperBubble.textContent='更快……還要更快！';
  screen.innerHTML='佐為正在喚起棋靈之力…<br><strong>速度持續上升</strong>';
  wheelBox.classList.add('sai-accelerating');
  await wait(420);
  let announced=false;
  const loops=11+Math.floor(Math.random()*4);
  await animateWheel(targetRotation(winner,loops),4300,p=>Math.pow(p,2.65),{
    tickStep:8,
    baseTone:620,
    beepLength:.018,
    volume:.02,
    tone:p=>620+Math.floor(1250*Math.pow(p,2)),
    onProgress:p=>{
      if(p>.62&&!announced){announced=true;helperBubble.textContent='不要停——！';screen.innerHTML='輪盤仍在加速！<br><strong>最後一手即將落下</strong>'}
    }
  });
  wheelBox.classList.remove('sai-accelerating');
  wheelBox.classList.add('sudden-stop');
  beep(150,.16,.08);
  setTimeout(()=>wheelBox.classList.remove('sudden-stop'),260);
}

spin=async function(){
  if(spinning||prizes.length<2)return;
  const characterKey=currentCharacter;
  const role=characters[characterKey];
  const winnerIndex=choose();
  const winner=prizes[winnerIndex];
  lockGame();
  helperBubble.textContent=role.start;
  screen.innerHTML=`${role.name} 正在轉動…<br>GOOD LUCK!`;
  try{
    if(characterKey==='akira')await akiraDoubleSpin(winner,winnerIndex);
    else if(characterKey==='sai')await saiAcceleratingSpin(winner);
    else await normalCharacterSpin(characterKey,winner);
    unlockGame();
    showReaction(characterKey,winner);
  }catch(error){
    console.error(error);
    unlockGame();
    helperBubble.textContent='剛剛失手了，再試一次！';
    screen.textContent='轉盤發生錯誤，請重新抽獎';
  }
};
spinBtn.onclick=spin;