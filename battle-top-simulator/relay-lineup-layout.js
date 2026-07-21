/* Relay Lineup Layout V2: stack the second slot below the first and support double-slot exclusives */
(() => {
  const panelIds=['p1','p2'];
  const isRelayMode=()=>document.querySelector('#relayBattleMode')?.value==='relay';

  function makeHeading(order,label){
    const heading=document.createElement('div');
    heading.className='relay-stick-heading';
    heading.innerHTML=`<span class="relay-stick-order">${order}</span><span class="relay-stick-role">${label}</span>`;
    return heading;
  }

  function unwrapLead(host){
    const section=host.querySelector(':scope > .relay-lead-section');
    if(section){
      [...section.children].forEach(child=>{
        if(child.classList.contains('relay-stick-heading'))return;
        host.insertBefore(child,section);
      });
      section.remove();
    }
    const reserve=host.querySelector('.relay-reserve-box');
    if(reserve){
      reserve.classList.remove('relay-reserve-stacked');
      reserve.querySelector(':scope > .relay-stick-heading')?.remove();
      reserve.querySelector(':scope > .relay-reserve-identity')?.remove();
    }
  }

  function decorateReserve(box,team){
    const occupied=box.classList.contains('relay-double-slot-occupied');
    box.classList.add('relay-reserve-stacked');
    box.classList.toggle('relay-reserve-occupied-layout',occupied);

    let heading=box.querySelector(':scope > .relay-stick-heading');
    if(!heading){
      heading=makeHeading('第 2 棒',occupied?'已占用':'後援');
      box.prepend(heading);
    }else{
      heading.querySelector('.relay-stick-order').textContent='第 2 棒';
      heading.querySelector('.relay-stick-role').textContent=occupied?'已占用':'後援';
    }

    const select=box.querySelector('.relay-reserve-select');
    const preset=occupied?(team===0?cfg.p1:cfg.p2):(select&&typeof metaPresets==='object'?metaPresets[select.value]:null);
    let identity=box.querySelector(':scope > .relay-reserve-identity');
    if(!identity){
      identity=document.createElement('div');
      identity.className='relay-reserve-identity';
      heading.insertAdjacentElement('afterend',identity);
    }
    const typeName=preset?.type==='attack'?'攻擊型':preset?.type==='defense'?'防禦型':preset?.type==='stamina'?'耐力型':'平衡型';
    const special=preset?.tier==='SPECIAL'||String(preset?.label||'').includes('[SPECIAL]');
    identity.innerHTML=occupied
      ?`<b>${preset?.name||'雙棒限定陀螺'}</b><span>與第 1 棒共用同一顆・雙棒占用</span>`
      :`<b>${preset?.name||'後援陀螺'}</b><span>${special?'特殊':'普通'}・${typeName}</span>`;
    box.dataset.relayTeam=String(team);
  }

  function arrangePanel(id){
    const host=document.querySelector('#'+id);
    if(!host)return;
    const reserve=host.querySelector('.relay-reserve-box');
    if(!reserve)return;

    if(!isRelayMode()){
      unwrapLead(host);
      return;
    }

    let lead=host.querySelector(':scope > .relay-lead-section');
    if(!lead){
      lead=document.createElement('section');
      lead.className='relay-lead-section';
      lead.appendChild(makeHeading('第 1 棒','先鋒'));
      [...host.children].filter(child=>child!==reserve).forEach(child=>lead.appendChild(child));
      host.insertBefore(lead,reserve);
    }

    if(reserve.parentElement!==host)host.appendChild(reserve);
    decorateReserve(reserve,id==='p1'?0:1);
  }

  function arrangeAll(){panelIds.forEach(arrangePanel)}

  const previousRenderPanel=renderPanel;
  renderPanel=function(id){
    previousRenderPanel(id);
    queueMicrotask(()=>arrangePanel(id));
  };

  document.addEventListener('change',event=>{
    if(event.target.matches('#relayBattleMode,.relay-reserve-select,[data-k="preset"]'))setTimeout(arrangeAll,0);
  },true);

  const style=document.createElement('style');
  style.textContent=`
    .relay-lead-section{margin:10px 0 0;padding:12px;border:1px solid #41ccff38;border-radius:17px;background:linear-gradient(160deg,#41ccff0d,#ffffff04);box-shadow:inset 0 0 24px #41ccff08}
    .relay-stick-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 10px;padding-bottom:8px;border-bottom:1px solid #ffffff16}
    .relay-stick-order{font-size:13px;font-weight:1000;letter-spacing:.06em;color:#f7fbff}
    .relay-stick-role{padding:3px 8px;border-radius:999px;border:1px solid #ffffff1f;background:#ffffff0b;color:#9edfff;font-size:10px;font-weight:900}
    .relay-lead-section>.model-preview{margin-top:2px}
    .relay-reserve-box.relay-reserve-stacked{display:block;margin:10px 0 0!important;padding:12px!important;border:1px solid #ffb36b42!important;border-left:3px solid #ffb36b99!important;border-radius:17px!important;background:linear-gradient(160deg,#ffb36b10,#ffffff04)!important;box-shadow:inset 0 0 24px #ffb36b08!important}
    .relay-reserve-stacked>.relay-stick-heading{margin-bottom:8px}.relay-reserve-stacked .relay-stick-role{color:#ffd1a1}
    .relay-reserve-identity{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}
    .relay-reserve-identity b{font-size:13px;color:#fff}.relay-reserve-identity span{font-size:10px;color:#aab7cf;text-align:right}
    .relay-reserve-stacked>strong{display:none!important}
    .relay-reserve-box.relay-reserve-occupied-layout{border-color:#8f6dff70!important;border-left-color:#8f6dff!important;background:radial-gradient(circle at 85% 0,#ffd97812,transparent 36%),linear-gradient(160deg,#8f6dff16,#171329)!important}
    .relay-reserve-occupied-layout .relay-stick-role{color:#ffd978;border-color:#ffd9783d}
    .relay-reserve-occupied-layout .relay-reserve-identity b{color:#f4edff}
    .relay-reserve-occupied-layout .relay-double-slot-card{margin-top:4px;padding:8px;border:1px dashed #8f6dff55;border-radius:11px;background:#8f6dff09}
    @media(max-width:660px){.relay-lead-section,.relay-reserve-box.relay-reserve-stacked{padding:10px!important}.relay-reserve-identity{align-items:flex-start;flex-direction:column}.relay-reserve-identity span{text-align:left}}
  `;
  document.head.appendChild(style);

  setTimeout(arrangeAll,0);
  document.documentElement.dataset.relayLineupLayout='v2';
})();