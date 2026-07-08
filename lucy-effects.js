(()=>{
  const phases=['lucy-scanning','lucy-locking','lucy-confirmed'];

  function normalizeIndex(value,length){
    return((value%length)+length)%length;
  }

  function prizeCenter(prize){
    return(prize.startDeg+prize.endDeg)/2;
  }

  function setLucyTarget(prize){
    wheelBox.style.setProperty('--lucy-angle',`${prizeCenter(prize)}deg`);
  }

  function setLucyPhase(phase,charge=0){
    wheelBox.classList.remove(...phases);
    if(phase)wheelBox.classList.add(`lucy-${phase}`);
    wheelBox.style.setProperty('--charge',String(charge));
  }

  drawLucyLockOverlay=function(prize,intensity=1,mode='scan'){
    draw();

    const size=canvas.width;
    const center=size/2;
    const outerRadius=center-30;
    const innerRadius=Math.max(58,outerRadius*.22);
    const start=-Math.PI/2+prize.startDeg*Math.PI/180;
    const end=-Math.PI/2+prize.endDeg*Math.PI/180;
    const middle=(start+end)/2;
    const isLock=mode==='lock'||mode==='confirmed';
    const cyan=`rgba(130,243,209,${.1+.2*intensity})`;
    const blue=`rgba(120,135,255,${.08+.16*intensity})`;
    const yellow=`rgba(255,230,92,${.58+.4*intensity})`;

    ctx.save();
    ctx.translate(center,center);

    const fill=ctx.createRadialGradient(0,0,innerRadius,0,0,outerRadius);
    fill.addColorStop(0,'rgba(16,23,45,0)');
    fill.addColorStop(.18,isLock?blue:'rgba(120,135,255,.04)');
    fill.addColorStop(.72,cyan);
    fill.addColorStop(1,isLock?'rgba(255,230,92,.18)':'rgba(130,243,209,.04)');

    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,outerRadius,start,end);
    ctx.closePath();
    ctx.fillStyle=fill;
    ctx.shadowColor=isLock?'#ffe65c':'#82f3d1';
    ctx.shadowBlur=(isLock?22:10)+24*intensity;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0,0,outerRadius-7,start,end);
    ctx.lineWidth=isLock?8:4;
    ctx.lineCap='round';
    ctx.strokeStyle=isLock?yellow:`rgba(130,243,209,${.4+.4*intensity})`;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0,0,innerRadius,start,end);
    ctx.lineWidth=isLock?4:2;
    ctx.strokeStyle=isLock
      ?`rgba(120,135,255,${.55+.35*intensity})`
      :`rgba(120,135,255,${.28+.25*intensity})`;
    ctx.stroke();

    if(isLock){
      for(const angle of[start,end]){
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle)*innerRadius,Math.sin(angle)*innerRadius);
        ctx.lineTo(Math.cos(angle)*(outerRadius-10),Math.sin(angle)*(outerRadius-10));
        ctx.lineWidth=3;
        ctx.strokeStyle=`rgba(255,230,92,${.52+.4*intensity})`;
        ctx.stroke();
      }
    }

    ctx.beginPath();
    ctx.arc(
      Math.cos(middle)*(outerRadius-10),
      Math.sin(middle)*(outerRadius-10),
      isLock?9:6,
      0,
      Math.PI*2
    );
    ctx.fillStyle=isLock?'#ffe65c':'#82f3d1';
    ctx.shadowBlur=isLock?24:14;
    ctx.fill();

    ctx.restore();
  };

  clearLucyLockOverlay=function(){
    draw();
  };

  const baseLockGame=lockGame;
  lockGame=function(){
    baseLockGame();
    wheelBox.classList.remove('lucy-confirmed');
    wheelBox.style.removeProperty('--lucy-angle');
    if(currentCharacter==='lucy')clearLucyLockOverlay();
  };

  const baseSelectCharacter=selectCharacter;
  selectCharacter=function(key,...args){
    if(key!=='lucy'){
      setLucyPhase(null,0);
      clearLucyLockOverlay();
    }
    return baseSelectCharacter(key,...args);
  };

  showReaction=function(characterKey,winner){
    const type=outcomeType(winner);
    const lines=reactionLines[characterKey]||reactionLines.cat;
    const line=lines[type];

    helperBubble.textContent=line;
    setAction(characterKey==='lucy'?'LOCK CONFIRMED':reactionCaptions[type]);
    wheelBox.classList.remove(
      'reaction-rare',
      'reaction-normal',
      'reaction-retry',
      'reaction-miss'
    );
    wheelBox.classList.add(`reaction-${type}`);

    setTimeout(()=>{
      wheelBox.classList.remove(`reaction-${type}`);
      if(characterKey==='lucy'){
        setLucyPhase(null,0);
        clearLucyLockOverlay();
      }
    },1900);

    screen.innerHTML=
      `恭喜抽中！<strong>${esc(winner.name)}</strong>`+
      `<small>${characters[characterKey].name}・${line}</small>`;

    const finishTones={
      cat:[784,988],
      bear:[523,659],
      rabbit:[988,1174],
      akira:[659,880],
      sai:[880,1320],
      lucy:[1080,1560]
    }[characterKey]||[784,988];

    beep(finishTones[0],.1,.05);
    setTimeout(()=>beep(finishTones[1],.14,.05),120);

    if(characterKey!=='lucy'&&(type==='rare'||type==='retry'))celebrate();
  };

  lucyNetrunnerSpin=async function(winner,winnerIndex){
    const prizeCount=prizes.length;
    const scanSteps=Math.max(24,prizeCount*3);
    let scanIndex=normalizeIndex(winnerIndex-scanSteps,prizeCount);
    let messagePhase=-1;

    helperBubble.textContent='掃描序列啟動。';
    screen.innerHTML='露西正在分析輪盤…<br><strong>NEURAL SCAN</strong>';
    setAction('NEON SCAN 0%');
    setLucyPhase('scanning',.08);

    for(let step=0;step<scanSteps;step++){
      const progress=(step+1)/scanSteps;
      const eased=progress*progress;
      scanIndex=(scanIndex+1)%prizeCount;
      const candidate=prizes[scanIndex];

      setLucyTarget(candidate);
      drawLucyLockOverlay(candidate,.28+.42*progress,'scan');
      wheelBox.style.setProperty('--charge',(.08+.66*progress).toFixed(3));

      const percent=Math.min(74,Math.round(progress*74));
      setAction(`NEON SCAN ${percent}%`);

      const nextMessage=progress<.38?0:progress<.72?1:2;
      if(nextMessage!==messagePhase){
        messagePhase=nextMessage;
        if(nextMessage===0){
          helperBubble.textContent='讀取獎格訊號。';
          screen.innerHTML='掃描中…<br><strong>建立資料索引</strong>';
        }else if(nextMessage===1){
          helperBubble.textContent='正在排除不穩定節點。';
          screen.innerHTML='訊號比對中…<br><strong>縮小目標範圍</strong>';
        }else{
          helperBubble.textContent='鎖定候選訊號。';
          screen.innerHTML='同步完成…<br><strong>準備鎖定</strong>';
        }
      }

      beep(690+Math.round(progress*470),.014,.014+.006*progress);
      await wait(45+Math.round(145*Math.pow(eased,1.35)));
    }

    setLucyTarget(winner);
    setLucyPhase('locking',.78);
    drawLucyLockOverlay(winner,.55,'lock');
    helperBubble.textContent='目標訊號確認。';
    screen.innerHTML=`目標已標記<br><strong>${esc(winner.name)}</strong>`;
    setAction('TARGET LOCK 78%');
    beep(1120,.07,.04);
    await wait(150);

    const pulses=[.68,.86,1];
    for(let index=0;index<pulses.length;index++){
      const intensity=pulses[index];
      drawLucyLockOverlay(winner,intensity,'lock');
      wheelBox.style.setProperty('--charge',(.78+.11*index).toFixed(3));
      setAction(`TARGET LOCK ${Math.min(100,84+index*8)}%`);
      beep(1210+index*170,.065,.04);
      await wait(150+index*35);
    }

    setLucyPhase('confirmed',1);
    drawLucyLockOverlay(winner,1,'confirmed');
    helperBubble.textContent='鎖定完成，結果已寫入。';
    screen.innerHTML=`鎖定成功！<br><strong>${esc(winner.name)}</strong>`;
    setAction('LOCK CONFIRMED');
    beep(1510,.09,.052);
    setTimeout(()=>beep(1780,.13,.048),105);

    await wait(520);
  };
})();
