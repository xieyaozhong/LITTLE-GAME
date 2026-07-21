/* Relay Battle Mode V2: 2v2 sequential launch, double-slot exclusives, one-special limit, and ordinary inheritance */
(() => {
  const SPECIAL_FLAGS=[
    'splitTop','skyPouncer','phaseCloak','charmEngine','rageEngine','adaptiveMorph',
    'omniObserver','taijiWheel','taijiMystic','sevenSword','timeStopEngine',
    'juggernautEngine','relayDoubleSlot'
  ];
  const typeLabels={attack:'猛攻傳承',defense:'城壁傳承',stamina:'旋能傳承',balance:'調律傳承'};
  const state={
    enabled:false,
    active:[0,0],
    lineups:[[],[]],
    reserveKeys:['',''],
    inheritance:[null,null],
    legStartedAt:0,
    replacing:false
  };

  const $q=selector=>document.querySelector(selector);
  const cloneConfig=(c,preset)=>({...c,preset:preset??c?.preset});
  const teamOf=top=>top?.teamIndex??(top?.index?1:0);
  const isSpecial=c=>!!c&&(c.tier==='SPECIAL'||String(c.label||'').includes('[SPECIAL]')||SPECIAL_FLAGS.some(flag=>!!c[flag]));
  const isOrdinary=c=>!!c&&!isSpecial(c);
  const isDoubleSlot=c=>!!c?.relayDoubleSlot;
  const activeTop=top=>!!top&&!top.out&&!top.burst&&!top.skyStaminaDefeated&&!top.skyEnergyDepletedLatch&&!((top.energy||0)<=0&&mag(top.vx||0,top.vy||0)<24);
  const teamMembers=team=>tops.filter(top=>teamOf(top)===team);
  const sideDefeated=team=>{const members=teamMembers(team);return members.length>0&&members.every(top=>!activeTop(top))};
  const sideScore=team=>teamMembers(team).reduce((sum,top)=>{
    const spinRatio=clamp(Math.abs(top.omega||top.spin||0)/Math.max(1,Math.abs(top.omega0||30)),0,1);
    return sum+(top.hudWeight||1)*(clamp(top.energy||0,0,100)+spinRatio*18);
  },0);
  const presetEntries=()=>Object.entries(metaPresets).filter(([key])=>key!=='custom');
  const ordinaryFallback=(avoid='')=>{
    const hit=presetEntries().find(([key,c])=>key!==avoid&&isOrdinary(c)&&!c.relayOnly&&!c.relayDoubleSlot);
    return hit?.[0]||presetEntries().find(([,c])=>!c.relayOnly&&!c.relayDoubleSlot)?.[0]||'custom';
  };
  const configFromKey=key=>cloneConfig(metaPresets[key]||metaPresets.custom,key);
  const leadConfig=team=>team===0?cfg.p1:cfg.p2;

  function inheritanceFrom(fallen){
    if(!isOrdinary(fallen))return null;
    const type=['attack','defense','stamina','balance'].includes(fallen.type)?fallen.type:'balance';
    if(type==='attack')return {type,label:typeLabels[type],detail:'攻擊 +8・發射初速 +10%'};
    if(type==='defense')return {type,label:typeLabels[type],detail:'防禦 +9・爆裂抗性 +7'};
    if(type==='stamina')return {type,label:typeLabels[type],detail:'耐力 +10・初始自轉 +8%'};
    return {type,label:typeLabels.balance,detail:'攻擊／防禦／耐力／爆裂抗性各 +4'};
  }

  function inheritedConfig(base,buff){
    const c=cloneConfig(base);
    if(!buff)return c;
    if(buff.type==='attack')c.a=clamp((c.a||0)+8,0,100);
    else if(buff.type==='defense'){
      c.d=clamp((c.d||0)+9,0,100);
      c.b=clamp((c.b||0)+7,0,100);
    }else if(buff.type==='stamina')c.s=clamp((c.s||0)+10,0,100);
    else ['a','d','s','b'].forEach(k=>c[k]=clamp((c[k]||0)+4,0,100));
    c.relayInheritance=buff.type;
    c.relayInheritanceLabel=buff.label;
    return c;
  }

  function applyInheritance(top,buff){
    if(!top||!buff)return;
    top.relayInheritance=buff.type;
    top.relayInheritancePulse=1;
    if(buff.type==='attack'){
      top.vx*=1.10;top.vy*=1.10;
      top.impactBoost=Math.max(top.impactBoost||0,36);
    }else if(buff.type==='defense'){
      top.burstMeter=(top.burstMeter||0)*.20;
      top.tiltVel=(top.tiltVel||0)*.45;
      top.lift=(top.lift||0)*.55;
    }else if(buff.type==='stamina'){
      top.omega*=1.08;top.spin=top.omega;
      top.omega0=Math.max(Math.abs(top.omega),Math.abs(top.omega0||top.omega));
    }else{
      top.omega*=1.04;top.spin=top.omega;
      top.impactBoost=Math.max(top.impactBoost||0,18);
      top.tiltVel=(top.tiltVel||0)*.72;
    }
    emit(top.x,top.y,top.c.accent||'#fff3b0',34,.92,'streak');
    wave(top.x,top.y,top.c.primary||'#74dcff',66);
  }

  function enforceSpecialLimit(team,changed='reserve'){
    if(!state.enabled)return true;
    const lead=leadConfig(team);
    if(isDoubleSlot(lead))return true;
    let reserve=configFromKey(state.reserveKeys[team]);
    if(reserve.relayDoubleSlot||reserve.relayOnly){
      const fallback=ordinaryFallback(lead.preset);
      state.reserveKeys[team]=fallback;
      reserve=configFromKey(fallback);
      if(changed==='reserve')addLog(`雙打限定陀螺只能作為占用雙棒的先鋒，後援已改為 ${reserve.name}。`);
    }
    if(!(isSpecial(lead)&&isSpecial(reserve)))return true;
    const fallback=ordinaryFallback(lead.preset);
    state.reserveKeys[team]=fallback;
    const select=$q(`#relayReserve${team}`);
    if(select)select.value=fallback;
    renderRelayStatus(`第 ${team+1} 隊已選擇特殊先鋒，後援自動改為普通陀螺。`,'warn');
    if(changed==='reserve')addLog(`雙打限制：每隊最多一顆特殊陀螺，後援已改為 ${metaPresets[fallback]?.name||fallback}。`);
    return false;
  }

  function validLineups(){
    for(let team=0;team<2;team++){
      const lead=leadConfig(team);
      if(lead?.relayOnly&&!state.enabled)return false;
      if(isDoubleSlot(lead))continue;
      const reserve=configFromKey(state.reserveKeys[team]);
      if(reserve.relayDoubleSlot||reserve.relayOnly)return false;
      if([lead,reserve].filter(isSpecial).length>1)return false;
    }
    return true;
  }

  function syncLeadOptions(id){
    const host=$q('#'+id),select=host?.querySelector('select[data-k="preset"]');
    if(!select)return;
    [...select.options].forEach(option=>{
      const c=metaPresets[option.value];
      if(!c)return;
      option.disabled=!!c.relayOnly&&!state.enabled;
      if(c.relayDoubleSlot&&!option.textContent.includes('雙棒'))option.textContent=`[雙棒限定] ${c.name||c.label}`;
    });
  }

  function optionHtml(team){
    const lead=leadConfig(team);
    return presetEntries().map(([key,c])=>{
      const relayExclusive=!!c.relayOnly||!!c.relayDoubleSlot;
      const blocked=relayExclusive||(isSpecial(lead)&&isSpecial(c));
      const mark=relayExclusive?'Ⅱ ':isSpecial(c)?'★ ':'○ ';
      return `<option value="${key}" ${key===state.reserveKeys[team]?'selected':''} ${blocked?'disabled':''}>${mark}${c.name||c.label}</option>`;
    }).join('');
  }

  function reserveSummary(team){
    const c=configFromKey(state.reserveKeys[team]);
    return `${isSpecial(c)?'特殊':'普通'}・${c.type==='attack'?'攻擊':c.type==='defense'?'防禦':c.type==='stamina'?'耐力':'平衡'}型`;
  }

  function renderReserve(team){
    const id=team===0?'p1':'p2',host=$q('#'+id);
    if(!host)return;
    let box=host.querySelector('.relay-reserve-box');
    if(!box){box=document.createElement('div');box.className='combo-box relay-reserve-box';host.appendChild(box)}
    box.style.display=state.enabled?'block':'none';
    box.classList.toggle('relay-double-slot-occupied',state.enabled&&isDoubleSlot(leadConfig(team)));
    if(!state.enabled)return;

    const lead=leadConfig(team);
    if(isDoubleSlot(lead)){
      box.innerHTML=`<strong>第 2 棒・已占用</strong><div class="relay-double-slot-card"><b>${lead.name}</b><span>單顆陀螺同時占用兩個棒次</span><small>沒有後援・沒有退場傳承・落敗即整隊落敗</small></div>`;
      return;
    }

    box.innerHTML=`<strong>後援陀螺・第 2 棒</strong><select id="relayReserve${team}" class="relay-reserve-select">${optionHtml(team)}</select><div class="relay-reserve-meta">${reserveSummary(team)}｜普通先鋒倒下後可留下傳承增益</div>`;
    const select=box.querySelector('select');
    select.disabled=!!running;
    select.onchange=()=>{
      state.reserveKeys[team]=select.value;
      enforceSpecialLimit(team,'reserve');
      renderReserve(team);
      renderRelayStatus();
    };
  }

  function renderAllReserve(){renderReserve(0);renderReserve(1)}
  function singleModeBlocked(){return [cfg.p1,cfg.p2].some(c=>c?.relayOnly)}

  function renderRelayStatus(message='',kind=''){
    const host=$q('#relayBattleStatus');if(!host)return;
    if(!state.enabled){
      const blocked=singleModeBlocked();
      host.innerHTML=blocked?'「鎮界巨神」屬於雙打限定陀螺，請切換到雙打車輪戰。':'單打模式：沿用目前 1 對 1 規則。';
      host.className=`relay-status ${blocked?'error':''}`;
      const start=$q('#start');if(start&&!running)start.disabled=blocked;
      return;
    }
    const valid=validLineups();
    const doubleTeams=[0,1].filter(team=>isDoubleSlot(leadConfig(team)));
    host.className=`relay-status ${kind||(!valid?'error':'')}`;
    if(message)host.innerHTML=message;
    else if(doubleTeams.length){
      const names=doubleTeams.map(team=>`${team===0?'藍隊':'紅隊'} ${leadConfig(team).name}`).join('、');
      host.innerHTML=`<b>雙棒占用：</b>${names} 以單顆陀螺占用第 1 棒與第 2 棒；落敗即整隊落敗。<br><span>對手仍可使用正常先鋒與後援車輪戰。</span>`;
    }else host.innerHTML='<b>車輪戰規則：</b>勝方留場，敗方換上後援。每隊最多一顆特殊陀螺。<br><span>猛攻：攻擊＋初速｜城壁：防禦＋抗爆｜旋能：耐力＋自轉｜調律：四項均衡提升</span>';
    const start=$q('#start');if(start&&!running)start.disabled=!valid;
  }

  function setSetupLocked(locked){
    const mode=$q('#relayBattleMode');if(mode)mode.disabled=!!locked;
    document.querySelectorAll('.relay-reserve-select').forEach(select=>select.disabled=!!locked);
  }

  function insertModeUI(){
    if($q('#relayBattleMode'))return;
    const btns=$q('.btns');if(!btns)return;
    const box=document.createElement('div');
    box.className='relay-mode-control';
    box.innerHTML='<label><span>對戰模式</span><select id="relayBattleMode"><option value="single">單打模式</option><option value="relay">雙打車輪戰（2 對 2）</option></select></label><div id="relayBattleStatus" class="relay-status">單打模式：沿用目前 1 對 1 規則。</div>';
    btns.insertAdjacentElement('beforebegin',box);
    $q('#relayBattleMode').onchange=e=>{
      state.enabled=e.target.value==='relay';
      if(state.enabled){enforceSpecialLimit(0,'mode');enforceSpecialLimit(1,'mode')}
      renderPanel('p1');renderPanel('p2');
      syncLeadOptions('p1');syncLeadOptions('p2');
      renderAllReserve();renderRelayStatus();
      const start=$q('#start');if(start)start.textContent=state.enabled?'開始車輪戰':'開始戰鬥';
    };
  }

  function cleanRemovedReferences(removed){
    const gone=new Set(removed);
    tops.forEach(top=>{
      if(gone.has(top.timeFrozenBy)){top.timeFrozenBy=null;top.timeFrozenTimer=0}
      if(gone.has(top.charmedBy))top.charmedBy=null;
      if(gone.has(top.chronoTarget))top.chronoTarget=null;
      if(gone.has(top.swordTarget))top.swordTarget=null;
      if(gone.has(top.skyTarget))top.skyTarget=null;
    });
  }

  function spawnRelayTop(team,buff){
    const nextIndex=state.active[team];
    const base=state.lineups[team][nextIndex];
    const data=inheritedConfig(base,buff);
    const top=new Top(team,data);
    top.teamIndex=team;top.relayOrder=nextIndex;applyInheritance(top,buff);
    tops.push(top);
    tops.sort((a,b)=>teamOf(a)-teamOf(b)||(a.relayOrder||0)-(b.relayOrder||0));
    return top;
  }

  function defeatReason(team){
    const fallen=teamMembers(team);
    if(fallen.some(top=>top.burst))return '爆裂退場';
    if(fallen.some(top=>top.out))return '極限出界';
    if(fallen.some(top=>top.skyStaminaDefeated||top.skyEnergyDepletedLatch||(top.energy||0)<=0))return '持久耗盡';
    return '動能判定';
  }

  function replaceTeam(team,reason){
    const currentIndex=state.active[team];
    if(currentIndex+1>=state.lineups[team].length)return false;
    const fallenConfig=state.lineups[team][currentIndex];
    const buff=inheritanceFrom(fallenConfig);
    const removed=teamMembers(team);
    tops=tops.filter(top=>teamOf(top)!==team);
    cleanRemovedReferences(removed);
    state.active[team]++;state.inheritance[team]=buff;
    const newcomer=spawnRelayTop(team,buff);
    const teamName=team===0?'藍隊':'紅隊';
    const inheritanceText=buff?`，繼承「${buff.label}」：${buff.detail}`:'；特殊先鋒不產生傳承增益';
    addLog(`${teamName}先鋒因「${reason}」退場，後援 ${newcomer.c.name} 發射入場${inheritanceText}！`);
    const nameNode=$q(team===0?'#n1':'#n2');if(nameNode)nameNode.textContent=`${newcomer.c.name}・第 2 棒`;
    over.classList.remove('hide');
    over.innerHTML=`<div><div class="big" style="color:${newcomer.c.primary}">${teamName} 後援發射</div><div class="small">${newcomer.c.name}${buff?'・'+buff.label:'・無傳承'}</div></div>`;
    setTimeout(()=>{if(running)over.classList.add('hide')},720);
    state.legStartedAt=time;
    return true;
  }

  function finishRelay(win,why){
    running=false;paused=false;score[win]++;
    $q('#s1').textContent=score[0];$q('#s2').textContent=score[1];
    const start=$q('#start');start.disabled=false;start.textContent='再戰一場';
    setSetupLocked(false);$q('#pause').disabled=true;
    const survivor=teamMembers(win).find(activeTop)||teamMembers(win)[0];
    const sideName=win===0?'藍隊':'紅隊';
    over.classList.remove('hide');
    over.innerHTML=`<div><div class="big" style="color:${survivor?.c?.primary||'#fff'}">${sideName} 勝利</div><div class="small">車輪戰・${why}・${time.toFixed(1)} 秒</div></div>`;
    addLog(`${sideName} 完成 2 對 2 車輪戰，以「${why}」取得勝利！`);
  }

  function finishRelayDraw(){
    running=false;paused=false;
    const start=$q('#start');start.disabled=false;start.textContent='再戰一場';
    setSetupLocked(false);$q('#pause').disabled=true;
    over.classList.remove('hide');
    over.innerHTML=`<div><div class="big">雙方同時退場</div><div class="small">車輪戰平手・${time.toFixed(1)} 秒</div></div>`;
    addLog('雙方最後一顆陀螺同時失去戰鬥能力，本場車輪戰平手。');
  }

  const previousRenderPanel=renderPanel;
  renderPanel=function(id){
    previousRenderPanel(id);
    const team=id==='p1'?0:1;
    if(state.enabled)enforceSpecialLimit(team,'lead');
    syncLeadOptions(id);renderReserve(team);renderRelayStatus();
  };

  insertModeUI();
  state.reserveKeys[0]=ordinaryFallback(cfg.p1?.preset);
  state.reserveKeys[1]=ordinaryFallback(cfg.p2?.preset);
  renderAllReserve();syncLeadOptions('p1');syncLeadOptions('p2');

  const previousStart=$q('#start').onclick;
  $q('#start').onclick=()=>{
    if(!state.enabled){
      state.lineups=[[],[]];state.active=[0,0];
      if(singleModeBlocked()){renderRelayStatus('雙打限定陀螺無法在單打模式發射。','error');return}
      return previousStart?.();
    }
    enforceSpecialLimit(0,'start');enforceSpecialLimit(1,'start');
    if(!validLineups()){renderRelayStatus('每隊最多只能選擇一顆特殊陀螺；雙棒限定陀螺只能占用整隊兩個棒次。','error');return}
    const leads=[cloneConfig(cfg.p1,cfg.p1.preset),cloneConfig(cfg.p2,cfg.p2.preset)];
    state.lineups=[
      isDoubleSlot(leads[0])?[leads[0]]:[leads[0],configFromKey(state.reserveKeys[0])],
      isDoubleSlot(leads[1])?[leads[1]]:[leads[1],configFromKey(state.reserveKeys[1])]
    ];
    state.active=[0,0];state.inheritance=[null,null];state.legStartedAt=0;state.replacing=false;
    tops=[new Top(0,state.lineups[0][0]),new Top(1,state.lineups[1][0])];
    tops[0].teamIndex=0;tops[1].teamIndex=1;tops[0].relayOrder=0;tops[1].relayOrder=0;
    time=0;accumulator=0;running=true;paused=false;particles=[];waves=[];shake=0;flash=0;
    $q('#start').disabled=true;$q('#pause').disabled=false;$q('#pause').textContent='暫停';setSetupLocked(true);
    $q('#n1').textContent=isDoubleSlot(leads[0])?`${leads[0].name}・雙棒占用`:`${leads[0].name}・第 1 棒`;
    $q('#n2').textContent=isDoubleSlot(leads[1])?`${leads[1].name}・雙棒占用`:`${leads[1].name}・第 1 棒`;
    over.classList.remove('hide');
    over.innerHTML='<div><div class="big">2 VS 2</div><div class="small">車輪戰・先鋒發射</div></div>';
    setTimeout(()=>{if(running)over.classList.add('hide')},720);
    const slotText=leads.map((c,i)=>isDoubleSlot(c)?`${i?'紅隊':'藍隊'} ${c.name} 占用雙棒`:null).filter(Boolean).join('；');
    addLog(`雙打車輪戰開始：${leads[0].name} 對決 ${leads[1].name}。${slotText||'勝方留場，敗方後援接替。'}`);
  };

  const previousReset=$q('#reset').onclick;
  $q('#reset').onclick=()=>{
    state.active=[0,0];state.lineups=[[],[]];state.inheritance=[null,null];state.legStartedAt=0;state.replacing=false;
    previousReset?.();setSetupLocked(false);renderRelayStatus();
    const start=$q('#start');if(start)start.textContent=state.enabled?'開始車輪戰':'開始戰鬥';
  };

  const previousResult=result;
  result=function(){
    if(!state.enabled||!state.lineups[0].length||!state.lineups[1].length)return previousResult();
    if(tops.length<1||state.replacing)return;
    let lost0=sideDefeated(0),lost1=sideDefeated(1),timeJudge=false;
    if(!lost0&&!lost1&&time-state.legStartedAt>80){
      timeJudge=true;
      const score0=sideScore(0),score1=sideScore(1);
      if(Math.abs(score0-score1)<.001){lost0=true;lost1=true}else if(score0<score1)lost0=true;else lost1=true;
    }
    if(!lost0&&!lost1)return;
    state.replacing=true;
    const reason0=timeJudge?'時間動能判定':defeatReason(0),reason1=timeJudge?'時間動能判定':defeatReason(1);
    const can0=lost0&&state.active[0]+1<state.lineups[0].length,can1=lost1&&state.active[1]+1<state.lineups[1].length;
    if(lost0&&lost1){
      if(can0&&can1){replaceTeam(0,reason0);replaceTeam(1,reason1);state.replacing=false;return}
      if(can0&&!can1){replaceTeam(0,reason0);finishRelay(0,reason1);state.replacing=false;return}
      if(!can0&&can1){replaceTeam(1,reason1);finishRelay(1,reason0);state.replacing=false;return}
      finishRelayDraw();state.replacing=false;return;
    }
    const loser=lost0?0:1,reason=lost0?reason0:reason1;
    if(replaceTeam(loser,reason)){state.replacing=false;return}
    finishRelay(1-loser,reason);state.replacing=false;
  };

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){super(index,data);this.relayInheritancePulse=0}
    update(dt,opponent){super.update(dt,opponent);this.relayInheritancePulse=Math.max(0,(this.relayInheritancePulse||0)-dt*.28)}
    draw(){
      super.draw();
      if(!this.relayInheritance||this.out||this.burst)return;
      const palette={attack:'#ffb36b',defense:'#8fe5ff',stamina:'#8fffc0',balance:'#d7b1ff'};
      const color=palette[this.relayInheritance]||this.c.accent,pulse=.5+.5*Math.sin(time*5.8),p=.45+.35*Math.min(1,this.relayInheritancePulse||0);
      ctx.save();ctx.translate(this.x,this.y);ctx.rotate(-time*.42);ctx.globalCompositeOperation='screen';ctx.strokeStyle=alpha(color,.18+p*.34+pulse*.10);ctx.lineWidth=1.4;ctx.shadowBlur=12;ctx.shadowColor=color;ctx.setLineDash([5,7]);ctx.beginPath();ctx.arc(0,0,this.r*(1.30+pulse*.05),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }
  };

  const style=document.createElement('style');
  style.textContent=`
    .relay-mode-control{margin:12px 0 4px;padding:12px;border:1px solid #ffffff18;border-radius:15px;background:linear-gradient(135deg,#41ccff12,#ff587912)}
    .relay-mode-control label{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px;font-weight:900;color:#eef5ff}
    .relay-mode-control select,.relay-reserve-select{min-width:190px;padding:8px 10px;border-radius:10px;border:1px solid #ffffff1f;background:#0d1527;color:#fff}
    .relay-status{margin-top:8px;color:#9fb0cf;font-size:11px;line-height:1.55}.relay-status b{color:#ffd277}.relay-status.warn{color:#ffd38b}.relay-status.error{color:#ff8fa4}
    .relay-reserve-box{border-color:#ffffff25!important;background:linear-gradient(135deg,#ffffff0d,#41ccff0b)!important}.relay-reserve-box select{width:100%;margin:5px 0}.relay-reserve-meta{font-size:10px;color:#9fb0cf;margin-top:4px}
    .relay-double-slot-occupied{border-color:#8f6dff66!important;background:linear-gradient(145deg,#8f6dff18,#171329)!important}
    .relay-double-slot-card{display:grid;gap:4px}.relay-double-slot-card b{color:#fff;font-size:14px}.relay-double-slot-card span{color:#ffd978;font-size:11px;font-weight:900}.relay-double-slot-card small{color:#aab3c7;font-size:10px;line-height:1.45}
    @media(max-width:660px){.relay-mode-control label{align-items:stretch;flex-direction:column}.relay-mode-control select,.relay-reserve-select{width:100%;min-width:0}}
  `;
  document.head.appendChild(style);
  window.__relayBattleState=state;
  window.__relayBattleAPI={isSpecial,isDoubleSlot,renderAllReserve,renderRelayStatus};
  document.documentElement.dataset.relayBattleMode='v2';
})();