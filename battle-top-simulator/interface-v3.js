/* Interface V3 — responsive shell, readable copy, telemetry, and shortcuts. */
(() => {
  const q=s=>document.querySelector(s);
  const root=document.documentElement;
  const suspicious=/[�]|(?:銝|嚗|蝟|頧|蝛|撠|璅|閬|敹|暺|隞)/;

  function activeTop(team){
    if(!Array.isArray(tops))return null;
    return tops.find(top=>(top.teamIndex??(top.index?1:0))===team&&!top.out&&!top.burst)||tops.find(top=>(top.teamIndex??(top.index?1:0))===team)||null;
  }

  function sanitizeBattleCopy(text){
    const value=String(text||'');
    if(!suspicious.test(value))return value;
    if(/Xtreme|X Dash/i.test(value)){
      const dashTop=activeTop(0)?.xDashCooldown>activeTop(1)?.xDashCooldown?activeTop(0):activeTop(1);
      return `${dashTop?.c?.name||'陀螺'} 沿 Xtreme Line 爆發 X Dash！`;
    }
    const burstTop=tops?.find?.(top=>top.burst);
    if(burstTop)return `${burstTop.c.name} 承受重擊後爆裂，勝負即將揭曉！`;
    const outTop=tops?.find?.(top=>top.out);
    if(outTop)return `${outTop.c.name} 突破外牆，極限出界！`;
    return '高速碰撞觸發衝擊火花，戰局正在改變。';
  }

  const originalAddLog=addLog;
  addLog=function(text){originalAddLog(sanitizeBattleCopy(text))};

  q('h1').textContent='旋刃競技場';
  q('.sub').textContent='配置你的戰鬥陀螺，在高擬真重力碗面中觀察發射路線、旋轉姿態、碰撞火花與極限出界。';
  q('.meta-badge').textContent='120 HZ · TWIN × RAGE V5';
  q('.legend').innerHTML='<span class="chip gravity">重力核心</span><span class="chip inner">主戰碗面</span><span class="chip outer">Xtreme Line</span>速度、傾角與刃片接觸會共同改變碰撞結果。';
  q('.note').textContent='陀螺、競技盤、光影與粒子皆由 Canvas 即時繪製。';
  q('#log').textContent='競技場已就緒。選擇雙方陀螺與發射位置，然後開始戰鬥。';
  q('#log').setAttribute('role','log');
  q('#log').setAttribute('aria-live','polite');
  q('#cv').setAttribute('role','img');
  q('#cv').setAttribute('aria-label','即時陀螺對戰競技盤');

  const arena=q('.arena');
  arena.insertAdjacentHTML('beforeend',`
    <div class="battle-telemetry" aria-hidden="true">
      <div class="telemetry-side blue"><span class="telemetry-label">BLUE · SPIN</span><strong id="telemetryBlue" class="telemetry-value">— RPM</strong></div>
      <div class="telemetry-center"><div id="telemetryClock" class="telemetry-clock">0.0 S</div><div id="telemetryState" class="telemetry-state">STANDBY</div></div>
      <div class="telemetry-side red"><span class="telemetry-label">RED · SPIN</span><strong id="telemetryRed" class="telemetry-value">— RPM</strong></div>
    </div>
    <div id="impactCallout" class="impact-callout" aria-hidden="true">IMPACT</div>
  `);

  const btns=q('.btns');
  const full=document.createElement('button');
  full.type='button';full.className='utility-button';full.id='fullscreen';full.textContent='⛶';full.title='切換全螢幕';full.setAttribute('aria-label','切換全螢幕');
  btns.appendChild(full);
  full.addEventListener('click',async()=>{
    try{
      if(document.fullscreenElement)await document.exitFullscreen();
      else await q('.center').requestFullscreen();
    }catch{addLog('目前的瀏覽器不支援全螢幕模式。')}
  });

  const footer=document.createElement('footer');
  footer.className='app-footer';
  footer.innerHTML='<div><strong>ARENA LAB</strong> · 即時剛體物理與 Canvas 光影</div><div class="shortcut-list"><span><kbd>Space</kbd>開始／暫停</span><span><kbd>R</kbd>重置</span><span><kbd>F</kbd>全螢幕</span></div>';
  q('.app').appendChild(footer);

  document.querySelectorAll('.side').forEach((side,index)=>{
    const heading=side.querySelector('h2');
    const toggle=document.createElement('span');toggle.className='side-toggle';toggle.textContent='展開／收合';heading.appendChild(toggle);
    heading.tabIndex=0;heading.setAttribute('role','button');heading.setAttribute('aria-expanded','true');
    const flip=()=>{if(innerWidth>600)return;side.classList.toggle('is-collapsed');heading.setAttribute('aria-expanded',String(!side.classList.contains('is-collapsed')))};
    heading.addEventListener('click',flip);
    heading.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();flip()}});
  });

  function syncButtonCopy(){
    const relay=window.__relayBattleState?.enabled;
    const start=q('#start'),pauseButton=q('#pause'),resetButton=q('#reset');
    resetButton.textContent='重置';resetButton.setAttribute('aria-label','重置整場對戰');
    if(running){start.textContent='對戰進行中';start.setAttribute('aria-label','對戰進行中')}
    else{
      const played=(Number(q('#s1')?.textContent)||0)+(Number(q('#s2')?.textContent)||0)>0;
      start.textContent=played?'再戰一場':relay?'開始車輪戰':'開始戰鬥';
      start.setAttribute('aria-label',start.textContent);
    }
    pauseButton.textContent=paused?'繼續':'暫停';pauseButton.setAttribute('aria-label',pauseButton.textContent+'對戰');
    root.dataset.battleState=paused?'paused':running?'live':'ready';
  }

  function rpm(top){
    if(!top||top.out||top.burst)return '— RPM';
    return `${Math.round(Math.abs(top.omega??top.spin??0)*9.549)} RPM`;
  }
  function updateTelemetry(){
    q('#telemetryBlue').textContent=rpm(activeTop(0));
    q('#telemetryRed').textContent=rpm(activeTop(1));
    q('#telemetryClock').textContent=`${(time||0).toFixed(1)} S`;
    q('#telemetryState').textContent=paused?'PAUSED':running?'BATTLE LIVE':'STANDBY';
    syncButtonCopy();
  }

  const baseBars=bars;
  bars=function(){baseBars();updateTelemetry()};
  setInterval(updateTelemetry,240);
  updateTelemetry();

  let calloutTimer=0;
  window.addEventListener('arenaimpact',event=>{
    const power=event.detail?.power||0,el=q('#impactCallout');
    if(power<36||!el)return;
    el.textContent=power>185?'CRITICAL':power>105?'HEAVY HIT':'IMPACT';
    el.classList.remove('show');
    requestAnimationFrame(()=>el.classList.add('show'));
    clearTimeout(calloutTimer);calloutTimer=setTimeout(()=>el.classList.remove('show'),power>150?420:280);
  });

  const logObserver=new MutationObserver(()=>{
    const el=q('#log'),clean=sanitizeBattleCopy(el.textContent);
    if(clean!==el.textContent)el.textContent=clean;
  });
  logObserver.observe(q('#log'),{childList:true,characterData:true,subtree:true});

  document.addEventListener('keydown',event=>{
    const tag=event.target?.tagName;
    if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA'||event.metaKey||event.ctrlKey||event.altKey)return;
    if(event.code==='Space'){
      event.preventDefault();
      if(running)q('#pause').click();else if(!q('#start').disabled)q('#start').click();
    }else if(event.key.toLowerCase()==='r')q('#reset').click();
    else if(event.key.toLowerCase()==='f')full.click();
  });

  ['#start','#pause','#reset'].forEach(selector=>q(selector).addEventListener('click',()=>setTimeout(updateTelemetry,0)));
  root.dataset.interface='v3';
})();
