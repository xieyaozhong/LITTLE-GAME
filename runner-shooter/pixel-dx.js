(function(){
'use strict';

var canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;

var W=360,H=640,MAX_Z=112;
var mode='menu',lastTime=performance.now(),clock=0;
var distance=0,coins=0,worldSpeed=22,wave=1,combo=0,maxCombo=0,comboTimer=0;
var shootTimer=0,spawnTimer=.7,gateTimer=7,bossTimer=23,chestTimer=12;
var dragging=false,shake=0,flash=0,bossBanner=0,waveBanner=0,hudDirty=true,muted=false;
var bullets=[],enemies=[],gates=[],chests=[],particles=[],floatTexts=[],roadTiles=[],petals=[],lanterns=[];
var player={x:0,targetX:0,hp:3,maxHp:5,damage:1,fireRate:5,bulletCount:1,shield:0,magnet:0,inv:0,recoil:0};
var audioCtx=null;

function id(n){return document.getElementById(n)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}
function rand(a,b){return a+Math.random()*(b-a)}
function ir(v){return Math.round(v)}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(ir(x),ir(y),Math.max(1,ir(w)),Math.max(1,ir(h)))}
function outline(x,y,w,h,fill,border,t){t=t||3;rect(x-t,y-t,w+t*2,h+t*2,border);rect(x,y,w,h,fill)}
function pixelText(str,x,y,size,color,align){
  ctx.save();ctx.font='900 '+size+'px "Courier New","Noto Sans TC",monospace';
  ctx.textAlign=align||'center';ctx.textBaseline='middle';
  ctx.fillStyle='#35243f';ctx.fillText(str,ir(x+2),ir(y+2));
  ctx.fillStyle=color||'#fff7df';ctx.fillText(str,ir(x),ir(y));ctx.restore();
}

function tone(freq,duration,type,volume){
  if(muted)return;
  try{
    if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
    var o=audioCtx.createOscillator(),g=audioCtx.createGain(),now=audioCtx.currentTime;
    o.type=type||'square';o.frequency.setValueAtTime(freq,now);
    g.gain.setValueAtTime(volume||.03,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);
    o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+duration);
  }catch(e){}
}
function sfx(name){
  if(name==='hit')tone(360,.025,'square',.012);
  if(name==='pop'){tone(430,.055,'square',.025);setTimeout(function(){tone(620,.065,'square',.02)},35)}
  if(name==='hurt')tone(130,.22,'sawtooth',.045);
  if(name==='upgrade'){tone(560,.07,'square',.035);setTimeout(function(){tone(840,.1,'square',.03)},70)}
  if(name==='boss')tone(90,.4,'sawtooth',.045);
  if(name==='chest'){tone(680,.07,'square',.03);setTimeout(function(){tone(930,.11,'square',.03)},65)}
}

function initDecor(){
  roadTiles=[];petals=[];lanterns=[];
  var i;
  for(i=0;i<30;i++)roadTiles.push({z:i*(MAX_Z/30),lane:i%3-1});
  for(i=0;i<28;i++)petals.push({x:rand(0,W),y:rand(80,H),vx:rand(-7,9),vy:rand(9,22),phase:rand(0,6.28),size:Math.random()<.7?2:3});
  for(i=0;i<18;i++)lanterns.push({z:6+i*6.2,side:i%2?-1:1});
}
function project(x,z){
  var d=clamp(1-z/MAX_Z,0,1),q=Math.pow(d,1.48),half=lerp(28,188,q);
  return{x:W/2+x*half,y:lerp(145,528,q),s:lerp(.17,1.08,q),d:d,half:half};
}
function palette(){
  var phase=(distance%900)/900;
  if(phase<.34)return{sky:'#79cfe9',sky2:'#d7f2ef',hill:'#5da967',hill2:'#76bd6b',ground:'#8dce73',road:'#f0ca91',shade:'#d7a771',stage:'櫻花小徑',sun:'#ffe27b'};
  if(phase<.67)return{sky:'#f59a87',sky2:'#ffd6a3',hill:'#756287',hill2:'#92749a',ground:'#8fb46c',road:'#edbd82',shade:'#cf8d68',stage:'夕燒山道',sun:'#fff0a5'};
  return{sky:'#33456f',sky2:'#7771a0',hill:'#263858',hill2:'#3c526f',ground:'#597d62',road:'#d3a87f',shade:'#a47767',stage:'月夜祭典',sun:'#fff0bd'};
}
function updateHud(){
  if(!hudDirty)return;
  var hearts='',i;
  for(i=0;i<player.maxHp;i++)hearts+=i<player.hp?'♥':'♡';
  id('coins').textContent=coins;id('distance').textContent=Math.floor(distance);
  id('stage').textContent=palette().stage;id('wave').textContent='第 '+wave+' 波';
  id('stats').textContent='豆餡 '+player.damage+'｜連發 '+player.fireRate.toFixed(1)+'｜分身 '+player.bulletCount+'｜'+hearts+(player.shield?'｜盾':'')+(player.magnet>0?'｜磁':'');
  hudDirty=false;
}

function resetGame(){
  distance=0;coins=0;worldSpeed=22;wave=1;combo=0;maxCombo=0;comboTimer=0;
  shootTimer=0;spawnTimer=.7;gateTimer=6.5;bossTimer=22;chestTimer=12;
  shake=0;flash=0;bossBanner=0;waveBanner=1.4;
  bullets=[];enemies=[];gates=[];chests=[];particles=[];floatTexts=[];
  player.x=0;player.targetX=0;player.hp=3;player.damage=1;player.fireRate=5;player.bulletCount=1;player.shield=0;player.magnet=0;player.inv=0;player.recoil=0;
  initDecor();hudDirty=true;updateHud();
}
function startGame(){
  resetGame();mode='playing';
  id('startScreen').classList.add('hide');id('gameOverScreen').classList.add('hide');
  tone(520,.07,'square',.035);setTimeout(function(){tone(780,.1,'square',.03)},65);
}
function endGame(title){
  mode='gameover';id('resultTitle').textContent=title||'大福扁掉了';
  id('finalDistance').textContent=Math.floor(distance);id('finalCoins').textContent=coins;id('finalCombo').textContent=maxCombo;
  id('gameOverScreen').classList.remove('hide');sfx('hurt');
}
function addText(str,x,y,color,size){floatTexts.push({str:str,x:x,y:y,color:color||'#fff7df',size:size||17,life:.8})}
function burst(x,y,color,count,power,shape){
  count=count||16;power=power||110;
  if(particles.length>230)particles.splice(0,particles.length-180);
  for(var i=0;i<count;i++){
    var a=rand(0,Math.PI*2),v=rand(20,power);
    particles.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,size:ir(rand(2,6)),life:rand(.25,.72),color:color,shape:shape||'square'});
  }
}

function spawnEnemy(boss){
  if(boss){
    var hp=Math.floor(64+distance*.19+wave*10);
    enemies.push({x:0,z:MAX_Z+5,hp:hp,maxHp:hp,size:1.58,type:'boss',reward:28+wave*2,w:0,hit:0});
    bossBanner=2;sfx('boss');return;
  }
  var lanes=[-.66,0,.66],count=Math.random()<Math.min(.3+wave*.025,.52)?2:1,used={},types=['anko','matcha','strawberry','sesame'];
  for(var i=0;i<count;i++){
    var lane;do{lane=lanes[Math.floor(Math.random()*lanes.length)]}while(used[lane]);used[lane]=1;
    var hp=Math.max(3,Math.floor(5+distance*.039+wave*1.35+rand(0,8)));
    enemies.push({x:lane,z:MAX_Z+i*4,hp:hp,maxHp:hp,size:rand(.72,.9),type:types[Math.floor(Math.random()*types.length)],reward:Math.ceil(hp/4),w:rand(0,6.28),hit:0});
  }
}
function spawnGate(){
  var pairs=[
    [['+1 分身','bullet',1,'#6ccce8','分'],['+1 豆餡','damage',1,'#f5a653','豆']],
    [['+35% 連發','rate',.35,'#75d1a1','速'],['+1 愛心','hp',1,'#ff8fa8','福']],
    [['+2 豆餡','damage',2,'#ef8a55','強'],['護盾','shield',1,'#b798e6','盾']],
    [['豆磁鐵','magnet',8,'#70c9e8','磁'],['+50% 連發','rate',.5,'#75d1a1','速']]
  ];
  var pair=pairs[Math.floor(Math.random()*pairs.length)];
  gates.push({z:MAX_Z,left:pair[0],right:pair[1],used:false});
}
function spawnChest(){
  var lanes=[-.62,0,.62],x=lanes[Math.floor(Math.random()*3)],hp=6+wave*2;
  chests.push({x:x,z:MAX_Z,hp:hp,maxHp:hp,opened:false,hit:0});
}
function shoot(){
  for(var i=0;i<player.bulletCount;i++)bullets.push({x:player.x+(i-(player.bulletCount-1)/2)*.16,z:3,speed:74,alive:true,damage:player.damage});
  player.recoil=.12;
}
function applyUpgrade(o){
  if(o[1]==='bullet')player.bulletCount=Math.min(5,player.bulletCount+o[2]);
  if(o[1]==='damage')player.damage+=o[2];
  if(o[1]==='rate')player.fireRate=Math.min(13,player.fireRate*(1+o[2]));
  if(o[1]==='hp')player.hp=Math.min(player.maxHp,player.hp+o[2]);
  if(o[1]==='shield')player.shield=1;
  if(o[1]==='magnet')player.magnet=Math.max(player.magnet,o[2]);
  flash=.18;shake=5;addText(o[0],W/2,286,o[3],23);burst(W/2,328,o[3],34,155,'spark');sfx('upgrade');hudDirty=true;
}
function openChest(c){
  if(c.opened)return;c.opened=true;
  var rewards=[['+5 紅豆','coins',5],['+1 豆餡','damage',1],['+20% 連發','rate',.2],['回復愛心','hp',1],['護盾','shield',1]],r=rewards[Math.floor(Math.random()*rewards.length)];
  if(r[1]==='coins')coins+=r[2];if(r[1]==='damage')player.damage+=r[2];if(r[1]==='rate')player.fireRate=Math.min(13,player.fireRate*(1+r[2]));
  if(r[1]==='hp')player.hp=Math.min(player.maxHp,player.hp+r[2]);if(r[1]==='shield')player.shield=1;
  var p=project(c.x,c.z);addText(r[0],p.x,p.y-35,'#ffd66b',20);burst(p.x,p.y,'#ffd66b',36,175,'spark');sfx('chest');hudDirty=true;
}
function hurtPlayer(){
  if(player.inv>0)return;
  var p=project(player.x,0);
  if(player.shield){
    player.shield=0;player.inv=.8;addText('護盾破裂!',p.x,452,'#c8a8ff',19);burst(p.x,505,'#c8a8ff',30,160,'spark');
  }else{
    player.hp--;player.inv=1.15;addText('-1 愛心',p.x,452,'#ff718f',20);burst(p.x,505,'#ff718f',28,160,'heart');
    if(player.hp<=0){hudDirty=true;updateHud();endGame('大福扁掉了');return}
  }
  combo=0;shake=12;flash=.24;sfx('hurt');hudDirty=true;
}

function update(dt){
  clock+=dt;
  var i,j;
  for(i=0;i<petals.length;i++){var pet=petals[i];pet.x+=pet.vx*dt;pet.y+=pet.vy*dt;pet.phase+=dt*4;if(pet.y>H+8){pet.y=-8;pet.x=rand(0,W)}if(pet.x<0)pet.x=W;if(pet.x>W)pet.x=0}
  if(mode!=='playing')return;

  distance+=worldSpeed*dt*.72;worldSpeed=Math.min(38,22+distance*.012+wave*.34);
  var nextWave=1+Math.floor(distance/180);if(nextWave!==wave){wave=nextWave;waveBanner=1.6;spawnTimer=.22;hudDirty=true}
  player.inv=Math.max(0,player.inv-dt);player.magnet=Math.max(0,player.magnet-dt);player.recoil=Math.max(0,player.recoil-dt);
  player.x+=(player.targetX-player.x)*Math.min(1,dt*13);player.x=clamp(player.x,-.88,.88);
  comboTimer-=dt;if(comboTimer<=0)combo=0;bossBanner=Math.max(0,bossBanner-dt);waveBanner=Math.max(0,waveBanner-dt);

  shootTimer-=dt;if(shootTimer<=0){shoot();shootTimer=1/player.fireRate}
  spawnTimer-=dt;if(spawnTimer<=0){spawnEnemy(false);spawnTimer=Math.max(.58,1.62-distance*.0012-wave*.035)*rand(.82,1.2)}
  gateTimer-=dt;if(gateTimer<=0){spawnGate();gateTimer=10+rand(0,5)}
  bossTimer-=dt;if(bossTimer<=0){spawnEnemy(true);bossTimer=Math.max(23,31-wave*.7)+rand(0,7)}
  chestTimer-=dt;if(chestTimer<=0){spawnChest();chestTimer=14+rand(0,9)}

  for(i=0;i<roadTiles.length;i++){roadTiles[i].z-=worldSpeed*dt;if(roadTiles[i].z<0)roadTiles[i].z+=MAX_Z}
  for(i=0;i<lanterns.length;i++){lanterns[i].z-=worldSpeed*dt;if(lanterns[i].z<0)lanterns[i].z+=MAX_Z}
  for(i=0;i<bullets.length;i++){bullets[i].z+=bullets[i].speed*dt;if(bullets[i].z>MAX_Z+15)bullets[i].alive=false}
  for(i=0;i<enemies.length;i++){enemies[i].z-=worldSpeed*dt;enemies[i].w+=dt*2.5;enemies[i].hit=Math.max(0,enemies[i].hit-dt)}
  for(i=0;i<gates.length;i++)gates[i].z-=worldSpeed*dt;
  for(i=0;i<chests.length;i++){chests[i].z-=worldSpeed*dt;chests[i].hit=Math.max(0,chests[i].hit-dt)}

  for(i=0;i<bullets.length;i++){
    var b=bullets[i];if(!b.alive)continue;var hitSomething=false;
    for(j=0;j<enemies.length;j++){
      var e=enemies[j],hitWidth=e.type==='boss'?.58:.35*e.size;
      if(Math.abs(b.z-e.z)<3.7&&Math.abs(b.x-e.x)<hitWidth){
        b.alive=false;e.hp-=b.damage;e.hit=.08;var hp=project(e.x,e.z);
        burst(hp.x,hp.y-10,'#ffd45e',5,65,'spark');addText('-'+b.damage,hp.x,hp.y-25,'#fff7df',14);sfx('hit');hitSomething=true;break;
      }
    }
    if(hitSomething)continue;
    for(j=0;j<chests.length;j++){
      var c=chests[j];
      if(!c.opened&&Math.abs(b.z-c.z)<3.7&&Math.abs(b.x-c.x)<.35){
        b.alive=false;c.hp-=b.damage;c.hit=.08;if(c.hp<=0)openChest(c);sfx('hit');break;
      }
    }
  }

  for(i=enemies.length-1;i>=0;i--){
    var enemy=enemies[i];
    if(enemy.hp<=0){
      var ep=project(enemy.x,enemy.z);combo++;maxCombo=Math.max(maxCombo,combo);comboTimer=2.2;
      var reward=enemy.reward+Math.floor(combo/5);coins+=reward;
      addText('+'+reward+(combo>=5?' 連擊!':''),ep.x,ep.y-30,'#ffd66b',enemy.type==='boss'?26:17);
      burst(ep.x,ep.y,enemy.type==='boss'?'#93d87d':'#ff91ad',enemy.type==='boss'?56:25,enemy.type==='boss'?230:135,enemy.type==='boss'?'leaf':'bean');
      shake=enemy.type==='boss'?13:4;sfx('pop');enemies.splice(i,1);hudDirty=true;continue;
    }
    if(enemy.z<=1.4){var wide=enemy.type==='boss'?.64:.4*enemy.size;if(Math.abs(enemy.x-player.x)<wide)hurtPlayer();enemies.splice(i,1)}
  }

  for(i=chests.length-1;i>=0;i--){
    var chest=chests[i];
    if(chest.opened){chests.splice(i,1);continue}
    if(chest.z<=1.4){if(Math.abs(chest.x-player.x)<.38)openChest(chest);chests.splice(i,1)}
  }
  for(i=gates.length-1;i>=0;i--){
    var g=gates[i];if(g.z<=2&&!g.used){g.used=true;applyUpgrade(player.x<0?g.left:g.right)}
    if(g.z<-5)gates.splice(i,1);
  }

  bullets=bullets.filter(function(v){return v.alive});if(bullets.length>90)bullets.splice(0,bullets.length-90);
  for(i=particles.length-1;i>=0;i--){var q=particles[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.96;q.vy*=.96;q.life-=dt;if(q.life<=0)particles.splice(i,1)}
  for(i=floatTexts.length-1;i>=0;i--){floatTexts[i].y-=39*dt;floatTexts[i].life-=dt;if(floatTexts[i].life<=0)floatTexts.splice(i,1)}
  shake*=.82;flash=Math.max(0,flash-dt);hudDirty=true;
}

function drawSky(){
  var p=palette(),g=ctx.createLinearGradient(0,0,0,170);g.addColorStop(0,p.sky);g.addColorStop(1,p.sky2);ctx.fillStyle=g;ctx.fillRect(0,0,W,170);
  rect(286,48,32,32,p.sun);rect(294,42,18,44,p.sun);rect(280,56,44,16,p.sun);
  rect(0,118,W,50,p.hill);
  for(var i=0;i<13;i++){var x=i*31-16,y=115-(i%3)*8;rect(x,y,42,30,p.hill2);rect(x+8,y-10,24,18,p.hill2)}
  rect(0,145,W,H-145,p.ground);
  for(i=0;i<12;i++){rect(i*34-10,140-(i%2)*7,20,15,'#4f9b5a');rect(i*34-4,130-(i%2)*7,8,18,'#4f9b5a')}
}
function drawRoad(){
  var p=palette();ctx.fillStyle=p.shade;ctx.beginPath();ctx.moveTo(145,145);ctx.lineTo(354,640);ctx.lineTo(6,640);ctx.lineTo(215,145);ctx.closePath();ctx.fill();
  ctx.fillStyle=p.road;ctx.beginPath();ctx.moveTo(153,145);ctx.lineTo(330,640);ctx.lineTo(30,640);ctx.lineTo(207,145);ctx.closePath();ctx.fill();
  for(var i=0;i<roadTiles.length;i++){var t=roadTiles[i],pr=project(t.lane*.48,t.z),s=Math.max(2,12*pr.s),c=(Math.floor((t.z+distance)/7)+t.lane)%2===0?'#fff0c3':'#e5b276';rect(pr.x-s/2,pr.y-s/2,s,s,c)}
}
function drawLanterns(){
  for(var i=0;i<lanterns.length;i++){
    var l=lanterns[i],p=project(l.side*.94,l.z);if(!p.d)continue;var u=Math.max(1,ir(3*p.s));
    rect(p.x-u,p.y-17*u,2*u,17*u,'#5a3b46');rect(p.x-4*u,p.y-16*u,8*u,2*u,'#5a3b46');
    rect(p.x-3*u,p.y-14*u,6*u,7*u,'#35243f');rect(p.x-2*u,p.y-13*u,4*u,5*u,'#ff8b72');rect(p.x-u,p.y-12*u,2*u,3*u,'#ffd66b');
  }
}
function drawPetals(){for(var i=0;i<petals.length;i++){var p=petals[i],tw=Math.sin(p.phase)>0?p.size:1;rect(p.x,p.y,tw,p.size,'#ffc0cf')}}

function drawDaifuku(x,y,s){
  s=Math.max(.35,s);var u=Math.max(1,ir(4*s)),squash=1+Math.sin(clock*10)*.035,recoil=player.recoil>0?2*u:0;
  ctx.save();ctx.translate(ir(x),ir(y+Math.sin(clock*10)*1.5));ctx.scale(1/squash,squash);
  rect(-8*u,5*u,16*u,3*u,'#0005');rect(-7*u,-3*u,14*u,9*u,'#35243f');rect(-6*u,-4*u,12*u,9*u,'#fff7df');rect(-5*u,-5*u,10*u,2*u,'#fff7df');rect(-6*u,-1*u,12*u,3*u,'#fffdf5');
  rect(-5*u,-5*u,10*u,u,'#ef6175');rect(-6*u,-7*u,2*u,3*u,'#ef6175');rect(4*u,-7*u,2*u,3*u,'#ef6175');
  rect(-3*u,-u,u,2*u,'#35243f');rect(2*u,-u,u,2*u,'#35243f');rect(-u,u,2*u,u,'#8d4d58');rect(-5*u,u,2*u,u,'#ff9eb3');rect(3*u,u,2*u,u,'#ff9eb3');
  rect(-2*u,-9*u-recoil,4*u,5*u,'#35243f');rect(-u,-11*u-recoil,2*u,3*u,'#ffd45e');rect(-u,-8*u-recoil,2*u,u,'#70c9e8');ctx.restore();
}
function enemyColor(type){if(type==='matcha')return'#9dcc78';if(type==='strawberry')return'#ff9db3';if(type==='sesame')return'#8c7b8e';return'#d78b67'}
function drawEnemy(e){
  var p=project(e.x+Math.sin(e.w)*.012,e.z);if(!p.d)return;if(e.type==='boss'){drawBoss(e,p);return}
  var u=Math.max(1,ir(4*e.size*p.s)),body=e.hit>0?'#fff7df':enemyColor(e.type);
  ctx.save();ctx.translate(ir(p.x),ir(p.y-8*p.s+Math.sin(e.w*2)*u*.25));
  rect(-7*u,-5*u,14*u,11*u,'#35243f');rect(-6*u,-6*u,12*u,11*u,body);rect(-4*u,-7*u,8*u,2*u,body);
  rect(-4*u,-2*u,2*u,u,'#35243f');rect(2*u,-2*u,2*u,u,'#35243f');rect(-3*u,u,6*u,u,'#35243f');rect(-u,2*u,2*u,u,'#35243f');
  if(e.type==='strawberry'){rect(-2*u,-9*u,4*u,3*u,'#67a85f');rect(0,-10*u,2*u,2*u,'#67a85f')}
  if(e.type==='sesame'){rect(-5*u,-4*u,u,u,'#d9cad8');rect(3*u,2*u,u,u,'#d9cad8')}ctx.restore();
  pixelText(String(Math.max(0,Math.ceil(e.hp))),p.x,p.y-43*p.s,Math.max(10,ir(19*p.s)),'#fff7df');
}
function drawBoss(e,p){
  var u=Math.max(1,ir(5*e.size*p.s)),body=e.hit>0?'#fff7df':'#9dcc78';
  ctx.save();ctx.translate(ir(p.x),ir(p.y-18*p.s+Math.sin(e.w)*u*.15));
  rect(-9*u,-7*u,18*u,14*u,'#35243f');rect(-8*u,-8*u,16*u,14*u,body);rect(-6*u,-9*u,12*u,2*u,body);
  rect(-5*u,-2*u,2*u,2*u,'#35243f');rect(3*u,-2*u,2*u,2*u,'#35243f');rect(-3*u,2*u,6*u,2*u,'#35243f');
  rect(-7*u,-12*u,14*u,3*u,'#ffd45e');rect(-7*u,-14*u,3*u,3*u,'#ffd45e');rect(-u,-15*u,3*u,4*u,'#ffd45e');rect(5*u,-14*u,3*u,3*u,'#ffd45e');
  rect(-8*u,-11*u,16*u,2*u,'#ef6175');rect(-9*u,-13*u,3*u,3*u,'#ef6175');rect(6*u,-13*u,3*u,3*u,'#ef6175');ctx.restore();
  var w=110*p.s;outline(p.x-w/2,p.y-84*p.s,w,8*p.s,'#4c3547','#35243f',2);rect(p.x-w/2+2,p.y-84*p.s+2,(w-4)*(e.hp/e.maxHp),Math.max(2,8*p.s-4),'#82dc83');
  pixelText('抹茶大福王 '+Math.max(0,Math.ceil(e.hp)),p.x,p.y-63*p.s,Math.max(10,ir(17*p.s)),'#fff7df');
}
function drawBullet(b){var p=project(b.x,b.z);if(!p.d)return;var s=Math.max(2,ir(6*p.s));rect(p.x-s/2,p.y+s*.8,s*.55,s*.55,'#efb25d');rect(p.x-s/2,p.y-s/2,s,s,'#35243f');rect(p.x-s/2+1,p.y-s/2+1,Math.max(1,s-2),Math.max(1,s-2),'#ad4d4e')}
function drawChest(c){
  var p=project(c.x,c.z);if(!p.d)return;var u=Math.max(1,ir(4*p.s)),body=c.hit>0?'#fff7df':'#c57b3a';
  ctx.save();ctx.translate(ir(p.x),ir(p.y));rect(-8*u,-6*u,16*u,12*u,'#35243f');rect(-7*u,-5*u,14*u,10*u,body);rect(-7*u,-2*u,14*u,2*u,'#ffd66b');rect(-u,-3*u,2*u,5*u,'#fff0a8');ctx.restore();
  pixelText(String(Math.max(0,Math.ceil(c.hp))),p.x,p.y-34*p.s,Math.max(10,ir(17*p.s)),'#fff7df');
}
function drawGate(g){
  var p=project(0,g.z);if(!p.d)return;var total=p.half*1.76,gap=4*p.s,h=108*p.s,y=p.y-h,half=total/2-gap;
  gateSide(W/2-total/2,y,half,h,g.left,p.s);gateSide(W/2+gap,y,half,h,g.right,p.s);
}
function gateSide(x,y,w,h,o,s){
  var t=Math.max(2,ir(3*s)),post=Math.max(4,ir(8*s));outline(x,y,w,h,'#fff7df','#35243f',t);
  rect(x,y,post,h,o[3]);rect(x+w-post,y,post,h,o[3]);rect(x,y,w,post,o[3]);
  pixelText(o[4],x+w/2,y+h*.32,Math.max(9,ir(25*s)),o[3]);pixelText(o[0],x+w/2,y+h*.68,Math.max(7,ir(13*s)),o[3]);
}
function drawParticles(){
  for(var i=0;i<particles.length;i++){
    var p=particles[i];ctx.globalAlpha=clamp(p.life*2,0,1);
    if(p.shape==='heart'){rect(p.x-2,p.y,2,2,p.color);rect(p.x+1,p.y,2,2,p.color);rect(p.x-1,p.y+2,3,2,p.color)}
    else if(p.shape==='leaf')rect(p.x,p.y,p.size,Math.max(2,p.size/2),p.color);
    else rect(p.x,p.y,p.size,p.size,p.color);
  }ctx.globalAlpha=1;
}
function drawTexts(){for(var i=0;i<floatTexts.length;i++){var t=floatTexts[i];ctx.globalAlpha=clamp(t.life*1.7,0,1);pixelText(t.str,t.x,t.y,t.size,t.color)}ctx.globalAlpha=1}

function draw(){
  ctx.save();if(shake>.3)ctx.translate(ir((Math.random()-.5)*shake),ir((Math.random()-.5)*shake));
  drawSky();drawRoad();drawLanterns();
  var all=[],i;
  for(i=0;i<gates.length;i++)all.push({z:gates[i].z,k:0,v:gates[i]});
  for(i=0;i<enemies.length;i++)all.push({z:enemies[i].z,k:1,v:enemies[i]});
  for(i=0;i<chests.length;i++)all.push({z:chests[i].z,k:2,v:chests[i]});
  for(i=0;i<bullets.length;i++)all.push({z:bullets[i].z,k:3,v:bullets[i]});
  all.sort(function(a,b){return b.z-a.z});
  for(i=0;i<all.length;i++){if(all[i].k===0)drawGate(all[i].v);else if(all[i].k===1)drawEnemy(all[i].v);else if(all[i].k===2)drawChest(all[i].v);else drawBullet(all[i].v)}
  var pp=project(player.x,0);
  if(!(player.inv>0&&Math.floor(player.inv*14)%2===0))drawDaifuku(pp.x,526,1);
  if(player.shield){ctx.strokeStyle='#c8a8ff';ctx.lineWidth=4;ctx.strokeRect(ir(pp.x-38),475,76,75);rect(pp.x-35,478,4,4,'#fff7df');rect(pp.x+31,542,4,4,'#fff7df')}
  drawParticles();drawTexts();drawPetals();
  if(combo>=3)pixelText('COMBO x'+combo,W/2,104,18,'#ffd66b');
  if(player.magnet>0)pixelText('豆磁力 '+Math.ceil(player.magnet),W/2,128,12,'#70c9e8');
  if(waveBanner>0){ctx.globalAlpha=clamp(waveBanner,0,1);outline(80,250,200,64,'#fff7df','#35243f',5);pixelText('第 '+wave+' 波',180,282,28,'#ef6175');ctx.globalAlpha=1}
  if(bossBanner>0){ctx.globalAlpha=clamp(bossBanner,0,1);outline(48,235,264,82,'#35243f','#fff7df',5);pixelText('抹茶大福王 登場!',180,276,22,'#ffd66b');ctx.globalAlpha=1}
  if(mode==='menu')drawDaifuku(W/2,535,1.15);
  if(flash>0){ctx.globalAlpha=flash;rect(0,0,W,H,'#fff');ctx.globalAlpha=1}ctx.restore();updateHud();
}

function frame(now){var dt=Math.min((now-lastTime)/1000,.034);lastTime=now;update(dt);draw();requestAnimationFrame(frame)}
function pointerToTarget(clientX){var r=canvas.getBoundingClientRect(),nx=(clientX-r.left)/r.width;player.targetX=clamp((nx-.5)*2,-.88,.88)}
canvas.addEventListener('pointerdown',function(e){dragging=true;if(canvas.setPointerCapture)canvas.setPointerCapture(e.pointerId);pointerToTarget(e.clientX)});
canvas.addEventListener('pointermove',function(e){if(dragging)pointerToTarget(e.clientX)});
canvas.addEventListener('pointerup',function(){dragging=false});canvas.addEventListener('pointercancel',function(){dragging=false});
window.addEventListener('keydown',function(e){if(e.code==='ArrowLeft'||e.code==='KeyA')player.targetX-=.18;if(e.code==='ArrowRight'||e.code==='KeyD')player.targetX+=.18;player.targetX=clamp(player.targetX,-.88,.88)});
document.addEventListener('visibilitychange',function(){lastTime=performance.now()});
id('startBtn').addEventListener('click',startGame);id('restartBtn').addEventListener('click',startGame);
id('muteBtn').addEventListener('click',function(){muted=!muted;this.textContent=muted?'×':'♪';if(!muted)tone(620,.08,'square',.04)});

initDecor();hudDirty=true;updateHud();requestAnimationFrame(frame);
})();