/* T1 presets + launch point selector */
const T1_PRESETS={
 phoenixT1:{label:'[T1] Phoenix Wing',name:'Phoenix Wing',combo:'1-60 Rush',rank:'T1・中堅攻擊型',tier:'T1',type:'attack',a:88,d:78,s:79,w:89,b:80,spin:'R',shape:'phoenix',primary:'#d92542',secondary:'#f5b63f',accent:'#fff1cd',metal:'#dce4ec'},
 tyrannoT1:{label:'[T1] Tyranno Beat',name:'Tyranno Beat',combo:'1-70 Kick',rank:'T1・重型平衡攻擊',tier:'T1',type:'balance',a:86,d:82,s:82,w:91,b:82,spin:'R',shape:'tyranno',primary:'#d34b24',secondary:'#7133aa',accent:'#ffe3bd',metal:'#d4dde6'},
 knightT1:{label:'[T1.5] Knight Mail',name:'Knight Mail',combo:'7-70 Point',rank:'T1.5・防守反擊型',tier:'T1.5',type:'defense',a:64,d:93,s:87,w:92,b:89,spin:'R',shape:'mail',primary:'#68768a',secondary:'#36b9ca',accent:'#f3fbff',metal:'#edf2f6'},
 whaleT1:{label:'[T1.5] Whale Wave',name:'Whale Wave',combo:'4-60 Low Rush',rank:'T1.5・高風險重擊型',tier:'T1.5',type:'attack',a:91,d:68,s:72,w:90,b:68,spin:'R',shape:'whale',primary:'#168ba6',secondary:'#3c4bc7',accent:'#dbfbff',metal:'#cedbe4'},
 golemT1:{label:'[T1.5] Golem Rock',name:'Golem Rock',combo:'5-60 Point',rank:'T1.5・重量防守型',tier:'T1.5',type:'defense',a:74,d:90,s:80,w:96,b:84,spin:'R',shape:'golem',primary:'#75604e',secondary:'#d38435',accent:'#fff0cf',metal:'#c9c4bd'}
};
Object.assign(metaPresets,T1_PRESETS);

const LAUNCH_POINTS={
 standard:{label:'標準位置',description:'中圈、朝中心發射'},
 center:{label:'中央穩定',description:'靠近中央，碰撞較早'},
 outer:{label:'外圈攻擊',description:'外側起跑，保留較大迴旋空間'},
 rail:{label:'X 線附近',description:'從外層齒軌附近起跑'},
 upper:{label:'上側斜角',description:'從上半區斜向中心'},
 lower:{label:'下側斜角',description:'從下半區斜向中心'},
 random:{label:'隨機發射點',description:'每局隨機選擇一個位置'}
};
const launchSelections={p1:'standard',p2:'standard'};
function launchPointLabel(key){return LAUNCH_POINTS[key]?.label||LAUNCH_POINTS.standard.label}

const baseRenderPanel=renderPanel;
renderPanel=function(id){
 const saved=launchSelections[id]||'standard';
 baseRenderPanel(id);
 cfg[id].launchPoint=saved;
 const host=document.querySelector('#'+id),combo=host.querySelector('.combo-box');
 if(cfg[id].tier){const tags=combo?.querySelector('.combo-tags');if(tags){const badge=document.createElement('span');badge.textContent=cfg[id].tier;badge.style.color='#ffd277';badge.style.borderColor='#ffd27755';tags.prepend(badge)}}
 const row=document.createElement('div');row.className='row launch-point-row';
 row.innerHTML=`<label>發射點 <span class="v">${LAUNCH_POINTS[saved].description}</span></label><select data-launch-point>${Object.entries(LAUNCH_POINTS).map(([key,item])=>`<option value="${key}" ${saved===key?'selected':''}>${item.label}</option>`).join('')}</select>`;
 const select=row.querySelector('select');
 select.onchange=()=>{launchSelections[id]=select.value;cfg[id].launchPoint=select.value;row.querySelector('.v').textContent=LAUNCH_POINTS[select.value].description};
 if(combo)combo.insertAdjacentElement('afterend',row);else host.appendChild(row);
};
renderPanel('p1');renderPanel('p2');

const RigidTop=Top;
function resolvedLaunchPoint(key){
 if(key!=='random')return key;
 const choices=['center','standard','outer','rail','upper','lower'];
 return choices[Math.floor(Math.random()*choices.length)];
}
function launchState(index,key,data){
 const point=resolvedLaunchPoint(key),cx=W/2,cy=H/2,spinSign=data.spin==='L'?-1:1;
 let radius=innerR*.40,posAngle=index?0:Math.PI,speedFactor=1,angleBias=spinSign*.08,zone='inner',tiltFactor=1;
 if(point==='center'){radius=innerR*.17;speedFactor=.80;angleBias=spinSign*.04;tiltFactor=.72}
 else if(point==='outer'){radius=innerR*.68;speedFactor=1.08;angleBias=spinSign*.20;tiltFactor=1.08}
 else if(point==='rail'){radius=outerR*.82;speedFactor=.96;zone='outer';angleBias=spinSign*Math.PI/2;tiltFactor=1.18}
 else if(point==='upper'){radius=innerR*.54;posAngle=index?-.48:Math.PI+.48;speedFactor=1.02;angleBias=spinSign*.13;tiltFactor=1.03}
 else if(point==='lower'){radius=innerR*.54;posAngle=index?.48:Math.PI-.48;speedFactor=1.02;angleBias=-spinSign*.13;tiltFactor=1.03}
 const inward=posAngle+Math.PI;
 const velocityAngle=point==='rail'?posAngle+angleBias:inward+angleBias;
 const baseSpeed=data.type==='attack'?156:data.type==='balance'?132:data.type==='defense'?101:86;
 return {point,x:cx+Math.cos(posAngle)*radius,y:cy+Math.sin(posAngle)*radius,vx:Math.cos(velocityAngle)*baseSpeed*speedFactor,vy:Math.sin(velocityAngle)*baseSpeed*speedFactor,zone,tiltFactor};
}

Top=class Top extends RigidTop{
 constructor(index,data){
  const id=index?'p2':'p1';
  super(index,{...data,launchPoint:launchSelections[id]});
  const state=launchState(index,launchSelections[id],data);
  this.launchPoint=state.point;this.x=state.x;this.y=state.y;this.vx=state.vx;this.vy=state.vy;this.zone=state.zone;
  this.tilt=clamp(this.baseTilt*state.tiltFactor,.018,.28);this.precession=Math.atan2(this.y-H/2,this.x-W/2)+(data.spin==='L'?-1:1)*Math.PI/2;
  if(state.zone==='outer'){this.lift=.06;this.rimCooldown=.24;this.xDashCooldown=.18}
 }
 bladeCount(){const map={phoenix:3,tyranno:3,mail:6,whale:3,golem:6};return map[this.c.shape]||super.bladeCount()}
 bladeRadius(i){
  const r=super.bladeRadius(i);
  if(this.c.shape==='phoenix')return r*(i%3===0?1.12:.88);
  if(this.c.shape==='tyranno')return r*(i%2?1.08:.91);
  if(this.c.shape==='mail')return r*(.95+.05*Math.cos(i*2.4));
  if(this.c.shape==='whale')return r*(i%3===0?1.14:.84);
  if(this.c.shape==='golem')return r*(i%2?1.02:.94);
  return r;
 }
};
