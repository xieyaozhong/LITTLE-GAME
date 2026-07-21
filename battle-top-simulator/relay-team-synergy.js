/* Relay Core Bond V2: simple special-core team builder and skill-driven bonds */
(() => {
  const state=window.__relayBattleState;
  if(!state)return;

  const $q=selector=>document.querySelector(selector);
  const SPECIAL_KEYS=[
    'enchantressSiren','skyPouncer','bloodrageBerserker','twinNova','chronoClockEmperor',
    'taijiMysticWheel','sevenfoldSwordSovereign','omniObserver','mirageChameleon','worldpressColossus'
  ];
  const SPECIAL_FLAGS=[
    'splitTop','skyPouncer','phaseCloak','charmAura','charmEngine','rageEngine','adaptiveMorph',
    'taijiV2','taijiWheel','taijiMystic','sevenSword','timeStopEngine','juggernautEngine','relayDoubleSlot'
  ];
  const isSpecial=c=>!!c&&(c.tier==='SPECIAL'||String(c.label||'').includes('[SPECIAL]')||SPECIAL_FLAGS.some(flag=>!!c[flag]));
  const isOrdinary=c=>!!c&&!isSpecial(c)&&!c.relayOnly&&!c.relayDoubleSlot;
  const teamOf=top=>top?.teamIndex??(top?.index?1:0);
  const activeTop=top=>!!top&&!top.out&&!top.burst&&!top.skyStaminaDefeated&&!top.skyEnergyDepletedLatch&&(top.energy||0)>0;
  const typeName=c=>c?.type==='attack'?'攻擊型':c?.type==='defense'?'防禦型':c?.type==='stamina'?'耐力型':'平衡型';
  const nextDelay=range=>rnd(range[0],range[1]);
  const nearestEnemy=source=>{
    let best=null,bestD=Infinity;
    (Array.isArray(tops)?tops:[]).forEach(target=>{
      if(target===source||teamOf(target)===teamOf(source)||!activeTop(target)||target.phaseInvisible)return;
      const d=mag((target.x||0)-(source.x||0),(target.y||0)-(source.y||0));
      if(d<bestD){best=target;bestD=d}
    });
    return best;
  };

  const CORE_DEFS={
    enchantressSiren:{
      name:'魅月海妖',skill:'月潮魅歌',icon:'潮',color:'#ff72cf',interval:[5.2,7.2],
      partners:['shark','whaleT1'],
      detail:'週期性召喚月潮牽引敵人並打亂軌跡；鯊魚強化追獵，鯨浪強化潮波範圍。',
      stats:{s:3,b:2}
    },
    skyPouncer:{
      name:'天墜獵鷹',skill:'風翼交接',icon:'翼',color:'#61e2ff',interval:[4.4,6.1],
      partners:['aero','phoenixT1'],
      detail:'累積風翼後發動高速突進與短暫離地；核心在場時會加快下一次飛行準備。',
      stats:{a:3,s:2}
    },
    bloodrageBerserker:{
      name:'血怒狂戰士',skill:'血脈共振',icon:'怒',color:'#ff664b',interval:[3.8,5.3],
      partners:['dran','tyrannoT1','rodBreaker'],
      detail:'能量降低時逐步提高追擊與衝擊，並不定期爆發血怒衝鋒；不同搭檔改變破壞方式。',
      stats:{a:4,w:2}
    },
    twinNova:{
      name:'雙生星核',skill:'星核護航',icon:'星',color:'#8e7bff',interval:[5.7,7.5],
      partners:['cobalt','meteor'],
      detail:'週期性生成星核護盾，降低爆裂與傾斜並回收少量自轉；龍騎搭檔會追加旋向脈衝。',
      stats:{d:3,b:3}
    },
    chronoClockEmperor:{
      name:'時界鐘皇',skill:'秒針回響',icon:'時',color:'#79e8ff',interval:[6.4,8.4],
      partners:['wizard','silver'],
      detail:'週期性展開短暫時場，減慢敵人並延後 X Dash；自身同時回收少量角速度。',
      stats:{s:3,d:2}
    },
    taijiMysticWheel:{
      name:'太極玄輪',skill:'陰陽輪轉',icon:'極',color:'#83f0c9',interval:[4.1,5.4],
      partners:['knightT1','golemT1','woodenSage'],
      detail:'陰態提供化勁護盾，陽態發動借力突進；重裝搭檔偏陰，木陀螺搭檔提高穩定。',
      stats:{d:3,s:3}
    },
    sevenfoldSwordSovereign:{
      name:'七曜劍皇',skill:'劍印接力',icon:'劍',color:'#9bdcff',interval:[4.8,6.4],
      partners:['rodBreaker','knightT1','dran'],
      detail:'週期性在最近敵人身上斬出劍印，造成推移、失衡與少量耗轉；搭檔決定斬擊節奏。',
      stats:{a:3,b:2}
    },
    omniObserver:{
      name:'萬相觀測者',skill:'戰型同步',icon:'觀',color:'#b18cff',interval:[4.0,5.4],
      partners:['custom'],
      detail:'分析當前敵人的類型，自動切換疾風、玄甲、毒牙或斷星支援，普通搭檔也能使用。',
      stats:{a:2,d:2,s:2,b:2}
    },
    mirageChameleon:{
      name:'幻霧變色龍',skill:'幻霧接替',icon:'幻',color:'#75f6df',interval:[5.4,7.0],
      partners:['aero','silver','woodenSage'],
      detail:'普通搭檔會短暫進入相位霧化，避開碰撞後留下加速殘像；核心則獲得幻霧脈衝。',
      stats:{d:2,s:3}
    },
    worldpressColossus:{
      name:'鎮界巨神',skill:'鎮界震撼',icon:'震',color:'#a68cff',interval:[99,99],partners:[],doubleSlot:true,
      detail:'單顆占用兩棒，無普通搭檔。以巨軀重壓、地表崩裂、全場震動與彈起效果獨立作戰。',
      stats:{}
    }
  };

  const VARIANTS={
    enchantressSiren:{shark:'獵潮月牙',whaleT1:'鯨浪回歌'},
    skyPouncer:{aero:'天馬風廊',phoenixT1:'鳳翼焚風'},
    bloodrageBerserker:{dran:'龍擊血路',tyrannoT1:'暴龍重怒',rodBreaker:'破杖獠怒'},
    twinNova:{cobalt:'蒼鈷雙星',meteor:'流星雙核'},
    chronoClockEmperor:{wizard:'魔杖時環',silver:'銀月停刻'},
    taijiMysticWheel:{knightT1:'玄甲陰城',golemT1:'厚土化勁',woodenSage:'古木定軸'},
    sevenfoldSwordSovereign:{rodBreaker:'破式劍牙',knightT1:'守式劍鎧',dran:'龍閃劍步'},
    omniObserver:{custom:'自訂萬相'},
    mirageChameleon:{aero:'空影疾行',silver:'銀霧潛行',woodenSage:'古霧無形'}
  };

  const ordinaryKeys=()=>Object.entries(metaPresets).filter(([,c])=>isOrdinary(c)).map(([key])=>key);
  const availableCores=()=>SPECIAL_KEYS.filter(key=>metaPresets[key]&&CORE_DEFS[key]);
  function ensureCoverage(){
    const covered=new Set(Object.values(CORE_DEFS).flatMap(def=>def.partners||[]));
    ordinaryKeys().forEach(key=>{
      if(covered.has(key))return;
      const c=metaPresets[key];
      const fallback=c.type==='attack'?'bloodrageBerserker':c.type==='defense'?'taijiMysticWheel':c.type==='stamina'?'chronoClockEmperor':'omniObserver';
      if(CORE_DEFS[fallback]&&!CORE_DEFS[fallback].partners.includes(key))CORE_DEFS[fallback].partners.push(key);
      covered.add(key);
    });
  }
  ensureCoverage();

  const builders=[{core:'',partner:'',order:'core'},{core:'',partner:'',order:'core'}];
  const activeBonds=[null,null];
  let applying=false;

  const compatiblePartners=coreKey=>(CORE_DEFS[coreKey]?.partners||[]).filter(key=>metaPresets[key]&&isOrdinary(metaPresets[key]));
  const coreForOrdinary=ordinaryKey=>availableCores().find(core=>compatiblePartners(core).includes(ordinaryKey))||availableCores().find(key=>!CORE_DEFS[key].doubleSlot)||availableCores()[0];
  const configKey=c=>c?.preset&&metaPresets[c.preset]?c.preset:Object.entries(metaPresets).find(([,preset])=>preset===c)?.[0]||'';

  function inferBuilder(team){
    const lead=team===0?cfg.p1:cfg.p2;
    const leadKey=configKey(lead);
    const reserveKey=state.reserveKeys?.[team]||'';
    const leadSpecial=isSpecial(lead),reserve=metaPresets[reserveKey],reserveSpecial=isSpecial(reserve);
    let core='',partner='',order='core';
    if(leadSpecial&&CORE_DEFS[leadKey]){core=leadKey;order='core';if(isOrdinary(reserve))partner=reserveKey}
    else if(reserveSpecial&&CORE_DEFS[reserveKey]){core=reserveKey;order='partner';if(isOrdinary(lead))partner=leadKey}
    else if(isOrdinary(lead)){partner=leadKey;core=coreForOrdinary(partner);order='partner'}
    else if(isOrdinary(reserve)){partner=reserveKey;core=coreForOrdinary(partner)}
    if(!core||!CORE_DEFS[core])core=availableCores().find(key=>!CORE_DEFS[key].doubleSlot)||availableCores()[0];
    const def=CORE_DEFS[core];
    if(def?.doubleSlot){partner='';order='core'}
    else if(!compatiblePartners(core).includes(partner))partner=compatiblePartners(core)[0]||ordinaryKeys()[0]||'';
    builders[team]={core,partner,order};
  }

  function lineupKeys(team){
    const b=builders[team],def=CORE_DEFS[b.core];
    if(def?.doubleSlot)return {lead:b.core,reserve:''};
    return b.order==='partner'?{lead:b.partner,reserve:b.core}:{lead:b.core,reserve:b.partner};
  }

  function applyBuilder(team,render=true){
    const b=builders[team],def=CORE_DEFS[b.core];
    if(!b.core||!def)return;
    if(def.doubleSlot){b.partner='';b.order='core'}
    else if(!compatiblePartners(b.core).includes(b.partner))b.partner=compatiblePartners(b.core)[0]||'';
    const keys=lineupKeys(team),id=team===0?'p1':'p2';
    if(!keys.lead||!metaPresets[keys.lead])return;
    const launchPoint=cfg[id]?.launchPoint;
    cfg[id]={...metaPresets[keys.lead],preset:keys.lead};
    if(launchPoint)cfg[id].launchPoint=launchPoint;
    if(keys.reserve)state.reserveKeys[team]=keys.reserve;
    applying=true;
    if(render)renderPanel(id);
    applying=false;
    window.__relayBattleAPI?.renderAllReserve?.();
    window.__relayBattleAPI?.renderRelayStatus?.();
    queueMicrotask(()=>renderBuilder(team));
  }

  function optionHtml(keys,selected,prefix=''){
    return keys.map(key=>{
      const c=metaPresets[key];
      return `<option value="${key}" ${key===selected?'selected':''}>${prefix}${c?.name||key}｜${typeName(c)}</option>`;
    }).join('');
  }

  function slotCard(label,key,role){
    const c=metaPresets[key];
    if(!c)return `<div class="relay-core-slot empty"><span>${label}</span><b>已占用</b><small>此核心單顆占用兩個棒次</small></div>`;
    return `<div class="relay-core-slot ${role}"><span>${label}</span><b>${c.name}</b><small>${role==='special'?'特殊核心':'普通搭檔'}・${typeName(c)}</small></div>`;
  }

  function renderBuilder(team){
    const host=$q(team===0?'#p1':'#p2');if(!host)return;
    const relay=$q('#relayBattleMode')?.value==='relay';
    host.classList.toggle('relay-simple-mode',relay);
    let box=host.querySelector(':scope > .relay-core-builder');
    if(!relay){if(box)box.style.display='none';return}
    if(!builders[team].core)inferBuilder(team);
    const b=builders[team],def=CORE_DEFS[b.core],partners=compatiblePartners(b.core),keys=lineupKeys(team);
    if(!box){box=document.createElement('section');box.className='relay-core-builder';host.prepend(box)}
    box.style.display='block';box.style.setProperty('--bond-color',def.color);
    const variant=VARIANTS[b.core]?.[b.partner]||`${metaPresets[b.partner]?.name||''}共鳴`;
    box.innerHTML=`
      <div class="relay-builder-title"><div><span>雙打隊伍</span><strong>特殊核心羈絆</strong></div><i>${def.icon}</i></div>
      <label class="relay-builder-field"><span>特殊核心</span><select data-relay-core>${optionHtml(availableCores(),b.core,'★ ')}</select></label>
      <label class="relay-builder-field"><span>普通搭檔</span><select data-relay-partner ${def.doubleSlot?'disabled':''}>${def.doubleSlot?'<option>雙棒已占用</option>':optionHtml(partners,b.partner,'○ ')}</select></label>
      <div class="relay-order-switch ${def.doubleSlot?'disabled':''}">
        <button type="button" data-order="core" class="${b.order==='core'?'active':''}" ${def.doubleSlot?'disabled':''}>特殊先發</button>
        <button type="button" data-order="partner" class="${b.order==='partner'?'active':''}" ${def.doubleSlot?'disabled':''}>普通先發</button>
      </div>
      <div class="relay-lineup-preview">
        ${slotCard('第 1 棒',keys.lead,isSpecial(metaPresets[keys.lead])?'special':'ordinary')}
        ${slotCard('第 2 棒',keys.reserve,isSpecial(metaPresets[keys.reserve])?'special':'ordinary')}
      </div>
      <div class="relay-bond-skill">
        <div class="relay-bond-icon">${def.icon}</div><div><strong>${def.skill}・${variant}</strong><p>${def.detail}</p></div>
      </div>`;

    box.querySelector('[data-relay-core]').onchange=e=>{
      b.core=e.target.value;
      const nextDef=CORE_DEFS[b.core];
      if(nextDef.doubleSlot){b.partner='';b.order='core'}
      else if(!compatiblePartners(b.core).includes(b.partner))b.partner=compatiblePartners(b.core)[0]||'';
      applyBuilder(team,true);
    };
    const partnerSelect=box.querySelector('[data-relay-partner]');
    if(partnerSelect&&!def.doubleSlot)partnerSelect.onchange=e=>{b.partner=e.target.value;applyBuilder(team,true)};
    box.querySelectorAll('[data-order]').forEach(button=>button.onclick=()=>{b.order=button.dataset.order;applyBuilder(team,true)});
  }
  function renderAllBuilders(){renderBuilder(0);renderBuilder(1)}

  const previousRenderPanel=renderPanel;
  renderPanel=function(id){
    previousRenderPanel(id);
    if(!applying)queueMicrotask(()=>renderBuilder(id==='p1'?0:1));
  };

  document.addEventListener('change',event=>{
    if(event.target.matches('#relayBattleMode')){
      setTimeout(()=>{
        if(event.target.value==='relay'){
          inferBuilder(0);inferBuilder(1);applyBuilder(0,true);applyBuilder(1,true);
        }else renderAllBuilders();
      },0);
    }
  },true);

  function bondForTeam(team){
    const b=builders[team],def=CORE_DEFS[b.core];
    if(!b?.core||!def||def.doubleSlot)return null;
    return {...def,key:b.core,coreKey:b.core,partnerKey:b.partner,variant:VARIANTS[b.core]?.[b.partner]||'共鳴'};
  }
  function boostedData(data,bond,role){
    const c={...data};
    if(!bond)return c;
    Object.entries(bond.stats||{}).forEach(([key,value])=>c[key]=clamp((c[key]||0)+value,0,100));
    c.relayCoreBond=bond.key;c.relayCoreBondRole=role;c.relayCoreBondName=bond.skill;
    return c;
  }

  function hitPulse(target,color,glyph){
    if(!target)return;
    target.relayBondHitPulse=1;target.relayBondHitColor=color;target.relayBondHitGlyph=glyph;
  }
  function skillPulse(source,bond){
    source.relayBondSkillPulse=1;source.relayBondGlyph=bond.icon;
    emit(source.x,source.y,bond.color,18,.58,'streak');wave(source.x,source.y,bond.color,44);
  }

  function triggerBondSkill(source,bond){
    if(!source||!bond||!activeTop(source))return;
    const target=nearestEnemy(source),partner=bond.partnerKey;
    skillPulse(source,bond);
    source.relayBondTimer=nextDelay(bond.interval);

    if(bond.key==='enchantressSiren'){
      if(target){
        const dx=source.x-target.x,dy=source.y-target.y,d=mag(dx,dy)||1,pull=partner==='whaleT1'?35:28;
        target.vx=target.vx*.82+dx/d*pull;target.vy=target.vy*.82+dy/d*pull;
        target.tiltVel+=(Math.sign(target.omega)||1)*(partner==='shark'?.12:.09);
        target.energy=Math.max(0,(target.energy||0)-.42);hitPulse(target,bond.color,'潮');
        wave(target.x,target.y,'#ffb5e8',partner==='whaleT1'?58:44);
        if(partner==='shark'){source.vx*=1.10;source.vy*=1.10;source.impactBoost=Math.max(source.impactBoost||0,24)}
      }
    }else if(bond.key==='skyPouncer'){
      if(source.c?.skyPouncer)source.skyJumpCooldown=Math.max(0,(source.skyJumpCooldown||0)-1.15);
      if(target){
        const dx=target.x-source.x,dy=target.y-source.y,d=mag(dx,dy)||1,boost=partner==='phoenixT1'?58:50;
        source.vx=source.vx*.72+dx/d*boost;source.vy=source.vy*.72+dy/d*boost;
        source.lift=clamp((source.lift||0)+.08,0,.30);source.impactBoost=Math.max(source.impactBoost||0,partner==='phoenixT1'?32:24);
      }
    }else if(bond.key==='bloodrageBerserker'){
      if(target){
        const dx=target.x-source.x,dy=target.y-source.y,d=mag(dx,dy)||1;
        const missing=clamp(1-(source.energy||100)/100,0,1),boost=42+missing*42+(partner==='tyrannoT1'?10:0);
        source.vx+=dx/d*boost;source.vy+=dy/d*boost;source.impactBoost=Math.max(source.impactBoost||0,28+missing*34);
        if(partner==='rodBreaker'){target.omega*=.987;target.spin=target.omega}
        hitPulse(target,bond.color,'怒');
      }
    }else if(bond.key==='twinNova'){
      source.relayBondShieldTimer=Math.max(source.relayBondShieldTimer||0,1.55);
      source.omega*=1.018;source.spin=source.omega;
      if(partner==='cobalt'&&target){target.omega*=.991;target.spin=target.omega;source.omega*=1.006;source.spin=source.omega}
      if(partner==='meteor'){source.vx*=1.07;source.vy*=1.07}
    }else if(bond.key==='chronoClockEmperor'){
      source.omega*=partner==='wizard'?1.024:1.016;source.spin=source.omega;
      source.relayBondShieldTimer=Math.max(source.relayBondShieldTimer||0,partner==='silver'?.75:.48);
      (Array.isArray(tops)?tops:[]).forEach(enemy=>{
        if(teamOf(enemy)===teamOf(source)||!activeTop(enemy)||enemy.phaseInvisible)return;
        enemy.vx*=.86;enemy.vy*=.86;enemy.xDashCooldown=Math.max(enemy.xDashCooldown||0,.55);hitPulse(enemy,bond.color,'時');
      });
    }else if(bond.key==='taijiMysticWheel'){
      source.relayBondTaijiYang=!source.relayBondTaijiYang;
      if(!source.relayBondTaijiYang){
        source.relayBondShieldTimer=Math.max(source.relayBondShieldTimer||0,partner==='knightT1'?1.85:1.45);
        source.tiltVel*=partner==='woodenSage'?.28:.48;source.burstMeter=(source.burstMeter||0)*.72;
      }else if(target){
        const dx=target.x-source.x,dy=target.y-source.y,d=mag(dx,dy)||1,boost=partner==='golemT1'?46:54;
        source.vx+=dx/d*boost;source.vy+=dy/d*boost;source.impactBoost=Math.max(source.impactBoost||0,26);hitPulse(target,bond.color,'陽');
      }
    }else if(bond.key==='sevenfoldSwordSovereign'){
      if(target){
        const dx=target.x-source.x,dy=target.y-source.y,d=mag(dx,dy)||1,push=partner==='rodBreaker'?44:partner==='dran'?38:30;
        target.vx+=dx/d*push;target.vy+=dy/d*push;target.tiltVel+=(Math.sign(target.omega)||1)*(partner==='knightT1'?.08:.13);
        target.energy=Math.max(0,(target.energy||0)-(partner==='rodBreaker'?.62:.38));target.burstMeter=(target.burstMeter||0)+.34;hitPulse(target,bond.color,'劍');
        wave((source.x+target.x)/2,(source.y+target.y)/2,'#e7f5ff',50);
      }
    }else if(bond.key==='omniObserver'){
      if(target){
        const type=target.c?.type||'balance';source.relayBondAdaptation=type;
        if(type==='attack'){source.relayBondShieldTimer=Math.max(source.relayBondShieldTimer||0,1.5);source.burstMeter=(source.burstMeter||0)*.68}
        else if(type==='defense'){source.impactBoost=Math.max(source.impactBoost||0,34);source.vx*=1.08;source.vy*=1.08}
        else if(type==='stamina'){source.omega*=1.026;source.spin=source.omega;target.omega*=.992;target.spin=target.omega}
        else{const dx=target.x-source.x,dy=target.y-source.y,d=mag(dx,dy)||1;source.vx+=dx/d*46;source.vy+=dy/d*46}
        hitPulse(target,bond.color,'觀');
      }
    }else if(bond.key==='mirageChameleon'){
      if(source.relayCoreBondRole==='partner'){
        source.relayBondPhaseTimer=partner==='silver'?.58:.42;
        source.relayBondPhaseOwned=true;
      }else{
        source.vx*=1.08;source.vy*=1.08;source.relayBondAfterimage=1;
      }
    }
    addLog(`${source.c.name} 觸發特殊核心羈絆「${bond.skill}・${bond.variant}」！`);
  }

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){
      const team=index?1:0,bond=activeBonds[team],preset=data?.preset||'';
      const role=bond?(preset===bond.coreKey?'core':'partner'):'';
      super(index,boostedData(data,bond,role));
      this.relayCoreBond=bond?.key||'';this.relayCoreBondRole=role;this.relayCoreBondData=bond||null;
      this.relayBondColor=bond?.color||'';this.relayBondGlyph=bond?.icon||'';
      this.relayBondTimer=bond?nextDelay([2.4,3.8]):99;this.relayBondSkillPulse=bond?1:0;this.relayBondHitPulse=0;
      this.relayBondShieldTimer=0;this.relayBondPhaseTimer=0;this.relayBondPhaseOwned=false;this.relayBondAfterimage=0;
    }
    update(dt,opponent){
      const beforeBurst=this.burstMeter||0,beforeTilt=this.tiltVel||0;
      if(this.relayBondPhaseTimer>0&&this.relayCoreBondRole==='partner')this.phaseInvisible=true;
      super.update(dt,opponent);
      this.relayBondSkillPulse=Math.max(0,(this.relayBondSkillPulse||0)-dt*.72);
      this.relayBondHitPulse=Math.max(0,(this.relayBondHitPulse||0)-dt*1.8);
      this.relayBondAfterimage=Math.max(0,(this.relayBondAfterimage||0)-dt*1.6);
      this.relayBondShieldTimer=Math.max(0,(this.relayBondShieldTimer||0)-dt);
      if(this.relayBondPhaseTimer>0){
        this.relayBondPhaseTimer=Math.max(0,this.relayBondPhaseTimer-dt);
        if(this.relayBondPhaseTimer<=0&&this.relayBondPhaseOwned){this.phaseInvisible=false;this.relayBondPhaseOwned=false;this.vx*=1.12;this.vy*=1.12;wave(this.x,this.y,this.relayBondColor,38)}
      }
      if(this.relayBondShieldTimer>0){
        if((this.burstMeter||0)>beforeBurst)this.burstMeter=beforeBurst+((this.burstMeter||0)-beforeBurst)*.55;
        this.tiltVel=beforeTilt+((this.tiltVel||0)-beforeTilt)*.58;
      }
      const bond=this.relayCoreBondData;
      if(!bond||!activeTop(this)||this.splitPart)return;
      if(bond.key==='bloodrageBerserker'){
        const rage=clamp(1-(this.energy||100)/100,0,1);
        if(rage>.18){this.impactBoost=Math.max(this.impactBoost||0,10+rage*25);this.tiltVel+=(Math.sin(time*7+this.index)*.0025)*rage}
      }
      this.relayBondTimer-=dt;
      if(this.relayBondTimer<=0)triggerBondSkill(this,bond);
    }
    drawBondEffects(){
      const skill=clamp(this.relayBondSkillPulse||0,0,1),hit=clamp(this.relayBondHitPulse||0,0,1);
      if(!this.relayCoreBond&&!hit)return;
      const color=this.relayBondColor||this.relayBondHitColor||'#fff';
      ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';
      if(this.relayCoreBond){
        const pulse=.5+.5*Math.sin(time*4.8);
        ctx.strokeStyle=alpha(color,.13+pulse*.08+skill*.34);ctx.lineWidth=1.2+skill*2.4;ctx.shadowBlur=10+skill*18;ctx.shadowColor=color;
        ctx.setLineDash([5,7]);ctx.beginPath();ctx.arc(0,0,this.r*(1.38+pulse*.04+skill*.18),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        if(skill>0){ctx.font=`1000 ${Math.max(9,this.r*.30)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=alpha('#fff',.38+skill*.54);ctx.fillText(this.relayBondGlyph||'技',0,-this.r*1.62)}
      }
      if(hit>0){
        ctx.strokeStyle=alpha(this.relayBondHitColor||color,hit*.52);ctx.lineWidth=1+hit*2.8;
        for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(0,0,this.r*(1.05+(1-hit)*(.45+i*.22)),0,Math.PI*2);ctx.stroke()}
      }
      if(this.relayBondAfterimage>0){
        const p=this.relayBondAfterimage;ctx.strokeStyle=alpha(color,p*.34);ctx.lineWidth=1.2;
        for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(-this.vx*.012*i,-this.vy*.012*i,this.r*(1+i*.06),0,Math.PI*2);ctx.stroke()}
      }
      ctx.restore();
    }
    draw(){super.draw();this.drawBondEffects()}
  };

  const start=$q('#start'),previousStart=start?.onclick;
  if(start)start.onclick=()=>{
    if($q('#relayBattleMode')?.value==='relay'){
      activeBonds[0]=bondForTeam(0);activeBonds[1]=bondForTeam(1);
    }else activeBonds[0]=activeBonds[1]=null;
    const result=previousStart?.();
    if(running){
      const names=activeBonds.map((bond,team)=>bond?`${team===0?'藍隊':'紅隊'}「${bond.skill}・${bond.variant}」`:null).filter(Boolean);
      if(names.length)addLog(`特殊核心羈絆啟動：${names.join('、')}！`);
    }
    return result;
  };

  const style=document.createElement('style');
  style.textContent=`
    .relay-simple-mode>.relay-lead-section,.relay-simple-mode>.relay-reserve-box,.relay-simple-mode>.relay-synergy-card{display:none!important}
    .relay-core-builder{--bond-color:#70dcff;margin:8px 0 0;padding:12px;border:1px solid color-mix(in srgb,var(--bond-color) 45%,transparent);border-radius:18px;background:radial-gradient(circle at 100% 0,color-mix(in srgb,var(--bond-color) 13%,transparent),transparent 38%),linear-gradient(155deg,#101a2b,#090f1d);box-shadow:inset 0 0 28px color-mix(in srgb,var(--bond-color) 7%,transparent)}
    .relay-builder-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px}.relay-builder-title span{display:block;color:#93a5c4;font-size:10px}.relay-builder-title strong{display:block;color:#fff;font-size:15px;margin-top:1px}.relay-builder-title i{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;border:1px solid color-mix(in srgb,var(--bond-color) 55%,transparent);background:color-mix(in srgb,var(--bond-color) 15%,#0d1424);color:#fff;font-style:normal;font-weight:1000;box-shadow:0 0 18px color-mix(in srgb,var(--bond-color) 22%,transparent)}
    .relay-builder-field{display:block;margin:8px 0}.relay-builder-field>span{display:block;margin:0 0 5px;color:#c7d1e4;font-size:11px;font-weight:900}.relay-builder-field select{width:100%;padding:9px 10px;border-radius:11px;border:1px solid #ffffff1b;background:#0c1425;color:#fff}.relay-builder-field select:focus{border-color:var(--bond-color);box-shadow:0 0 0 3px color-mix(in srgb,var(--bond-color) 13%,transparent)}
    .relay-order-switch{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:9px 0}.relay-order-switch button{padding:8px;border-radius:10px;border:1px solid #ffffff15;background:#ffffff08;color:#9facbf;font-size:10px}.relay-order-switch button.active{border-color:color-mix(in srgb,var(--bond-color) 52%,transparent);background:color-mix(in srgb,var(--bond-color) 15%,#101827);color:#fff;box-shadow:inset 0 0 14px color-mix(in srgb,var(--bond-color) 9%,transparent)}.relay-order-switch.disabled{opacity:.55}
    .relay-lineup-preview{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:9px 0}.relay-core-slot{min-width:0;padding:9px;border:1px solid #ffffff14;border-radius:12px;background:#ffffff06}.relay-core-slot span{display:block;color:#8fa0bd;font-size:9px}.relay-core-slot b{display:block;overflow:hidden;margin:3px 0 2px;color:#fff;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.relay-core-slot small{display:block;color:#9facbf;font-size:9px}.relay-core-slot.special{border-color:color-mix(in srgb,var(--bond-color) 48%,transparent);background:color-mix(in srgb,var(--bond-color) 10%,#0d1423)}.relay-core-slot.empty{border-style:dashed}
    .relay-bond-skill{display:flex;gap:9px;align-items:flex-start;padding:9px;border:1px solid color-mix(in srgb,var(--bond-color) 35%,transparent);border-radius:13px;background:linear-gradient(135deg,color-mix(in srgb,var(--bond-color) 10%,transparent),#ffffff03)}.relay-bond-icon{display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px;border-radius:9px;background:color-mix(in srgb,var(--bond-color) 18%,#101727);color:#fff;font-size:12px;font-weight:1000}.relay-bond-skill strong{display:block;color:#fff;font-size:11px}.relay-bond-skill p{margin:3px 0 0;color:#9facbf;font-size:9.5px;line-height:1.45}
    @media(max-width:660px){.relay-core-builder{padding:10px}.relay-lineup-preview{grid-template-columns:1fr}.relay-order-switch button{padding:9px}}
  `;
  document.head.appendChild(style);

  inferBuilder(0);inferBuilder(1);
  if($q('#relayBattleMode')?.value==='relay'){applyBuilder(0,true);applyBuilder(1,true)}else renderAllBuilders();
  window.__relayTeamSynergy={definitions:CORE_DEFS,builders,active:activeBonds,bondForTeam,ordinaryKeys};
  document.documentElement.dataset.relayTeamSynergy='v2';
})();
