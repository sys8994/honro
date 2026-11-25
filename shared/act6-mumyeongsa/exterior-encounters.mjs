// Each row identifies an exposed authored contact face and one stock combat role.
function installExteriorEncounters(app,e,paused=()=>false,admit=()=>true){
 const b=e.b,stage=b.honroStage;
 const chapters={
  51:{active:8,attacks:5,sites:{
   lower:'mountain-main',ledge:'terrace-continuous'},
   initial:[['hound','lower',874,4655],['shade','lower',1330,4405],['stag','ledge',1740,4000],['shade','ledge',3210,3280]],
   waves:[
    {id:'lower-turn',label:'아랫길에서 추격해 옵니다.',at:[1050,4500],units:[['hound','lower',1575,4388],['hound','lower',1715,4340],['shade','ledge',1890,3960]]},
    {id:'split-ledge',label:'중턱 반대편에서 지키던 혼이 움직입니다.',at:[2850,3780],units:[['stag','lower',3885,3310],['hound','lower',3748,3405],['shade','ledge',3655,3130]]},
    {id:'crest',label:'전망대 방어선에 새 혼들이 모입니다.',at:[5140,2400],units:[['shade','ledge',5515,2090],['hound','lower',5578,2470],['stag','ledge',6060,1660]]},
   ]},
  52:{active:9,attacks:6,sites:{
   descent:'west-watch-and-descent',westArch:'broken-arch-west',eastArch:'broken-arch-east',return:'east-return-buttress',lowBridge:'return-lower-crossing'},
   initial:[['hound','descent',1725,1770],['shade','descent',1890,1980],['hound','westArch',2500,2475],
    ['shade','eastArch',3990,2290],['stag','eastArch',4650,2489],['shade','lowBridge',3090,4560]],
   waves:[
    {id:'cliff-watch',label:'암벽 아래 초병이 올라옵니다.',at:[1820,1850],units:[['hound','descent',2080,2180],['shade','westArch',2365,2455],['hound','westArch',2690,2470]]},
    {id:'broken-arch',label:'끊어진 석교 양쪽에서 응전합니다.',at:[2890,2370],units:[['stag','westArch',3000,2340],['shade','eastArch',3880,2280],['hound','eastArch',4145,2380]]},
    {id:'bell-approach',label:'낮은 종터 앞과 퇴로를 지키던 혼이 모입니다.',at:[4300,3890],units:[['shade','return',4480,3807],['hound','return',4620,3685],['shade','return',4710,3605],['stag','lowBridge',3740,4330]]},
   ]},
  53:{active:6,attacks:4,sites:{floor:'south',library:'library-balcony',beam:'sanctuary-beam'},
   initial:[['hound','floor',740,2390],['shade','library',1320,1910],['stag','floor',1985,1590]],
   waves:[
    {id:'gate-timber',label:'산문 뒤에서 바닥을 긁는 소리가 납니다.',at:[670,2390],units:[['hound','floor',970,2200],['shade','floor',1140,2075],['shade','library',1005,2040]]},
    {id:'archive-balcony',label:'서고 양편에서 혼이 움직입니다.',at:[1320,1960],units:[['hound','floor',1480,1880],['shade','floor',1620,1845],['hound','beam',1700,1650]]},
    {id:'lost-sanctuary',label:'파손 난간 앞에서 마지막 그림자가 갈라집니다.',at:[2020,1480],units:[['shade','beam',2090,1420],['hound','floor',2200,1375],['stag','floor',2380,1205]]},
   ]},
  54:{active:6,attacks:4,sites:{floor:'foothill',first:'gallery-outer-balcony',second:'gallery-observation-beam'},
   initial:[['hound','floor',680,2610],['shade','first',817,2484],['hound','floor',1060,2535],['shade','second',1280,2385]],
   waves:[
    {id:'pillar-base',label:'돌기둥 양쪽에서 적이 내려옵니다.',at:[665,2640],units:[['shade','first',730,2477],['hound','floor',900,2595]]},
    {id:'observatory-beam',label:'관측 회랑의 들보 위가 흔들립니다.',at:[1100,2500],units:[['hound','second',1170,2390],['shade','floor',1330,2505]]},
    {id:'return-corner',label:'되돌아가는 돌턱에 뒤처진 혼이 모입니다.',at:[1400,2460],units:[['hound','floor',1510,2400],['shade','floor',1645,2370]]},
   ]},
  55:{active:10,attacks:7,priority:'draft-pressure-0',sites:{west:'west-ring-descent',court:'arrival-core-terrace',low:'west-lower-branch'},
   initial:[['hound','west',640,840],['shade','west',920,1000],['shade','court',1470,1325],['stag','court',2465,1630]],
   waves:[
    {id:'west-bank',label:'서쪽 돌벽 너머에서 수의귀들이 내려옵니다.',at:[850,930],units:[['shade','west',460,740],['hound','west',545,780],['hound','west',1070,1075],['shade','west',1170,1125]]},
    {id:'bell-descent',label:'종터로 내려가는 돌턱 양옆에서 기척이 납니다.',at:[1520,1320],units:[['hound','west',775,915],['hound','court',1765,1420],['shade','court',1890,1455],['stag','court',2235,1560]]},
    {id:'outer-ward',label:'돌단을 바라보는 낮은 암반에서 적이 밀려옵니다.',at:[2040,1490],units:[['shade','low',794,2497],['hound','court',1520,1340],['shade','court',2010,1490],['hound','court',2340,1595]]},
    {id:'thread-pressure',label:'혼줄을 지키는 돌단 앞에 마지막 압박이 몰립니다.',at:[2500,1640],units:[['shade','court',1805,1429],['hound','court',1960,1476],['stag','court',2280,1575],['shade','court',2790,1731]]},
   ]},
  56:{active:7,attacks:5,sites:{veranda:'A-upper-veranda',ascent:'B-01-center-stone-ascent',descent:'B-02-center-lower-short-climb',
    lower:'B-central-lower-floor',return:'E-joined-ordinary-floor'},
   initial:[['shade','veranda',1512,1136],['hound','veranda',2545,1136]],
   waves:[
    {id:'upper-veranda',label:'윗난간 사이에서 수의귀가 다가옵니다.',at:[1590,1136],units:[['shade','veranda',1850,1136],['hound','veranda',2050,1136],['shade','veranda',2390,1136]]},
    {id:'deep-drop',label:'두 번째 진목 아래로 다시 적이 모입니다.',at:[3420,2300],units:[['hound','ascent',3120,2460],['shade','descent',3790,3360],['stag','descent',3970,3220]]},
    {id:'reverse-bank',label:'가름진 아래의 낮은 받침이 흔들립니다.',at:[4930,4000],units:[['hound','return',4480,4050],['shade','return',4810,4050],['hound','return',5340,3970],['shade','return',5560,3860]]},
   ]},
  57:{active:9,attacks:6,sites:{west:'local-lower-07-west',east:'local-lower-07-east'},
   initial:[['hound','west',2220,3240],['hound','west',2770,3305],['shade','west',3170,3330],['stag','west',3920,3250],['shade','east',6700,2840,true]],
   waves:[
    {id:'folding-ridge',label:'부서진 난간 아래에서 추격대가 다가옵니다.',at:[3010,3290],units:[['shade','west',2645,3285],['hound','west',2870,3295],['hound','west',3480,3320],['shade','west',3720,3250]]},
    {id:'relay-cutoff',label:'보호 받침을 향한 길 양편에서 적이 올라옵니다.',at:[4200,3100],units:[['shade','west',3880,3260],['hound','west',4120,3120],['shade','west',4510,3130],['stag','west',4800,3020]]},
    {id:'occluded-bank',label:'동쪽 바위와 서쪽 암반 뒤에 마지막 감시대가 섭니다.',at:[5300,3010],units:[['shade','west',4940,3120,true],['shade','west',5070,3080,true],['shade','east',6810,2890,true],['shade','east',6970,3010,true]]},
   ]},
  58:{active:9,attacks:6,priority:'a6-c08-boss',sites:{hull:'local-lower-08-body',entryDeck:'m58-west-stone-step',gallery:'m58-rising-gallery'},
   initial:[['hound','hull',3220,3330],['shade','entryDeck',3580,3072],['stag','hull',3910,3362],['shade','hull',4625,3150]],
   waves:[
    {id:'entrance-columns',label:'첫 기둥의 술식 뒤에서 잔향이 올라옵니다.',at:[3470,3250],units:[['shade','hull',3340,3260],['hound','hull',3475,3230],['shade','gallery',3730,3070]]},
    {id:'apse-lower',label:'상층 마루와 낮은 기둥 양편에서 짐승 혼이 나타납니다.',at:[4220,3210],units:[['hound','gallery',3880,3070],['shade','hull',4110,3280],['stag','hull',4500,3185]]},
    {id:'folded-rear',label:'대도사 뒤 석단이 흔들리며 혼이 밀려옵니다.',at:[4920,3090],units:[['hound','hull',4770,3180],['shade','hull',5150,2940],['stag','hull',5660,2925]]},
   ]},
 };
 const plan=chapters[stage];
 if(!plan||b.mode!=='campaign'||app.engine!==e||b.honroAuthoredId!==`stage-${stage}`)return null;
 const alive=u=>u.side===1&&!u.dead&&u.hp>0&&!u.summoned&&!u.honroShotTarget&&!u.honroObjectiveTarget;
 const entryState={mode:'campaign',honroStage:50,honroMapOrigin:'campaign',honroCanonical:true};
 const campaign=G.HONRO_CONTENT.stages[49];
 const markers=plan.waves.map(wave=>({wave,next:0,warning:null}));
 const issued=new WeakSet();
 const spawn=(slot,name,index)=>{
  const [kind,site,x,reference,fixed=false]=slot,support=plan.sites[site];
  const host=b.terrain.find(t=>t.id===support&&x>=t.x&&x<=t.x+t.w);
  if(!host)return false;
  const y=C.topAt(host,x,reference),face=e.contactSurface(x,y-3,y+4);
  if(!face||face.t.id!==support||Math.abs(face.y-y)>.25||y<0||y>b.height)return false;
  const id=`a6-${stage}-${name}-${index+1}`;
  const u=G.HonroUnits.create({id,kind,team:'enemy',behavior:'aggressive',x,y,facing:-1},entryState,app.profile,campaign);
  if(!u?.loadout?.length||u.flying||!C.validTerrainContactPose(b.terrain,u))return false;
  const occupied=b.units.some(v=>v.hp>0&&!v.dead&&Math.abs(v.x-x)<v.r+u.r+8&&v.y-v.h<y&&y-u.h<v.y);
  if(occupied)return false;
  const hp=({hound:655,shade:595,stag:755})[kind];
  Object.assign(u,{hp,maxHp:hp,combatBaseHp:hp,attack:2.7,combatBaseAttack:2.7,group:700+b.units.length,fixed,
   spawnX:x,spawnY:y,awake:false,honroSpawnSource:name,honroEncounterSupport:support});
  if(!admit(u))return false;
  issued.add(u);
  b.units.push(u);
  return true;
 };
 const refreshNormal=e.refreshActivation.bind(e),combatNormal=e.combatEnemies.bind(e),switchNormal=e.switchTeam.bind(e);
 let anchor=e.active,eligible=new Set();
 function refresh(){
  refreshNormal();
  if(e.active?.side===0&&!e.active.summoned)anchor=e.active;
  const dist=u=>anchor?Math.hypot(u.x-anchor.x,(u.y-anchor.y)*.85):Infinity;
  const priority=e.unit(plan.priority),localBoss=priority&&e.heroesAlive().some(u=>Math.hypot(u.x-priority.x,(u.y-priority.y)*.8)<1250);
  const near=paused()?[]:b.units.filter(alive).filter(u=>u===priority&&localBoss||dist(u)<1250||u.aggroUntil>=b.round&&dist(u)<1600);
  near.sort((a,z)=>Number(z===priority)-Number(a===priority)||dist(a)-dist(z)||a.id.localeCompare(z.id));
  eligible=new Set(near.slice(0,plan.active));
  for(const u of b.units.filter(alive))u.awake=eligible.has(u);
 }
 b.honroActiveLimit=b.enemyLimit=plan.attacks;
 plan.initial.forEach((row,i)=>spawn(row,'opening',i));
 e.refreshActivation=refresh;
 e.combatEnemies=()=>paused()?[]:combatNormal().filter(u=>eligible.has(u));
 if(plan.priority)e.switchTeam=(...args)=>{
  const from=b.side,out=switchNormal(...args),u=e.unit(plan.priority);
  if(from!==0||b.side!==1||b.phase!=='enemy'||!eligible.has(u)||u.stunnedRound===b.round||u.stun>0)return out;
  b.queue=[u.id,...b.queue.filter(id=>id!==u.id)].slice(0,b.enemyLimit);
  for(const foe of e.actors(1))foe.acted=!b.queue.includes(foe.id);
  b.active=u.id;e.emit('change');return out;
 };
 refresh();
 let clock=0,lastX=anchor?.x,lastY=anchor?.y,lastRound=b.round;
 function tick(dt){
  if(paused()||app.done||app.dialogue||app.modal?.classList.contains('open')||b.phase!=='aim'||b.side!==0)return;
  const u=e.active;
  if(!u||u.side!==0||u.summoned||u.dead)return;
  clock+=dt;
  if(Math.abs(u.x-lastX)>48||Math.abs(u.y-lastY)>48||b.round!==lastRound||u!==anchor){
   refresh();lastX=u.x;lastY=u.y;lastRound=b.round;
  }
  if(b.projectiles.length||e.settleBusy()||!e.grounded(u))return;
  for(const marker of markers){
   const {wave}=marker;
   if(marker.next===wave.units.length)continue;
   const [x,y]=wave.at;
   if(Math.abs(u.x-x)>525||Math.abs(u.y-y)>550)continue;
   if(marker.warning===null){marker.warning=clock;app.notify(wave.label);continue;}
   if(clock-marker.warning<.85||eligible.size>=plan.active)continue;
   if(spawn(wave.units[marker.next],wave.id,marker.next)){
    marker.next++;refresh();
   }
  }
 }
 return Object.freeze({tick,owns:u=>issued.has(u)});
}
