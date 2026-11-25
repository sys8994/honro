// Each row identifies an exposed authored contact face and one stock combat role.
function installExteriorEncounters(app,e){
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
    {id:'bell-approach',label:'종터로 향하는 길을 지키던 혼이 모입니다.',at:[4270,2630],units:[['shade','eastArch',4475,2500],['hound','eastArch',4830,2510],['shade','eastArch',4970,2515],['stag','return',4450,3830]]},
   ]},
 };
 const plan=chapters[stage];
 if(!plan||b.mode!=='campaign'||app.engine!==e||b.honroAuthoredId!==`stage-${stage}`)return null;
 const alive=u=>u.side===1&&!u.dead&&u.hp>0&&!u.summoned&&!u.honroShotTarget&&!u.honroObjectiveTarget;
 const entryState={mode:'campaign',honroStage:50,honroMapOrigin:'campaign',honroCanonical:true};
 const campaign=G.HONRO_CONTENT.stages[49];
 const markers=plan.waves.map(wave=>({wave,next:0,warning:null}));
 const spawn=(slot,name,index)=>{
  const [kind,site,x,reference]=slot,support=plan.sites[site];
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
  Object.assign(u,{hp,maxHp:hp,combatBaseHp:hp,attack:2.7,combatBaseAttack:2.7,group:700+b.units.length,
   spawnX:x,spawnY:y,awake:false,honroSpawnSource:name,honroEncounterSupport:support});
  b.units.push(u);
  return true;
 };
 const refreshNormal=e.refreshActivation.bind(e),combatNormal=e.combatEnemies.bind(e);
 let anchor=e.active,eligible=new Set();
 function refresh(){
  refreshNormal();
  if(e.active?.side===0&&!e.active.summoned)anchor=e.active;
  const dist=u=>anchor?Math.hypot(u.x-anchor.x,(u.y-anchor.y)*.85):Infinity;
  const near=b.units.filter(alive).filter(u=>dist(u)<1250||u.aggroUntil>=b.round&&dist(u)<1600);
  near.sort((a,z)=>dist(a)-dist(z)||a.id.localeCompare(z.id));
  eligible=new Set(near.slice(0,plan.active));
  for(const u of b.units.filter(alive))u.awake=eligible.has(u);
 }
 b.honroActiveLimit=b.enemyLimit=plan.attacks;
 plan.initial.forEach((row,i)=>spawn(row,'opening',i));
 e.refreshActivation=refresh;
 e.combatEnemies=()=>combatNormal().filter(u=>eligible.has(u));
 refresh();
 let clock=0,lastX=anchor?.x,lastY=anchor?.y,lastRound=b.round;
 function tick(dt){
  if(app.done||app.dialogue||app.modal?.classList.contains('open')||b.phase!=='aim'||b.side!==0)return;
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
 return Object.freeze({tick});
}
