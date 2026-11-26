// Chapter-local controls keep the campaign actor's normal equipment and loadout.
export const sodanSkills=Object.freeze({body:'O13',spirit:'O06'});
export const sodanInnerTree=Object.freeze(['O06','O07','O08','O09','O10']);

function seatedArt(scene,body,when){
 const draw=scene.unitBody;
 scene.unitBody=function(c,u,...args){
  if(u.id!==body.id||u.dead||u.portraitOnly||!when())return draw.call(this,c,u,...args);
  c.save();
  c.translate(body.x,body.y);
  c.strokeStyle='#c8d8bd';c.lineWidth=1.6;
  c.beginPath();c.ellipse(0,-2,49,10,0,0,Math.PI*2);c.stroke();
  c.beginPath();c.moveTo(-8,-20);c.bezierCurveTo(24,-71,55,-31,108,-95);c.stroke();
  c.fillStyle='#493f51';c.beginPath();c.ellipse(1,-10,28,9,0,0,Math.PI*2);c.fill();
  c.scale(1.07,.71);c.translate(-body.x,-body.y);
  try{return draw.call(this,c,u,...args);}finally{c.restore();}
 };
}

// Chapter 7 still requires Sodan to repair the bell relay herself, carry it
// west, then regroup at Damheo's ward. Keep her turn; lock only at a relay.
export function mountRetreatSodan({e,scene,body,reunionMark}){
 const flags=e.b.honroState.flags;
 const seated=()=>!body.dead&&!flags[reunionMark]&&(!flags.bridgeRetreatOpened||
  flags.relayMovedToFallback&&!flags['act6.fallbackRelaySecured']&&Math.abs(body.x-1968)<=124&&e.grounded(body));
 const stock=Object.fromEntries(['walk','jump','canDrop','impulse','integrateBody','tick'].map(k=>[k,e[k].bind(e)]));
 const sync=()=>{
  const held=seated();
  if(held){body.fixed=true;body.vx=0;body.vy=0;delete body.moveTarget;}
  else if(body.fixed===true)body.fixed=false;
  return held;
 };
 e.walk=(u,...args)=>!(u===body&&seated())&&stock.walk(u,...args);
 e.jump=(u=e.active)=>!(u===body&&seated())&&stock.jump(u);
 e.canDrop=(u=e.active)=>!(u===body&&seated())&&stock.canDrop(u);
 e.impulse=(u,...args)=>{if(u!==body||!seated())return stock.impulse(u,...args);};
 e.integrateBody=(u,...args)=>u===body&&seated()?e.grounded(u):stock.integrateBody(u,...args);
 e.tick=(...args)=>{sync();return stock.tick(...args);};
 sync();seatedArt(scene,body,seated);
 return {seated,sync};
}
export function mountSeatedSodan({C,e,scene,body}){
 const pose={x:body.x,y:body.y};
 const methods=['actors','select','walk','jump','impulse','integrateBody','fire','skillAllowed','newRound'];
 const stock=Object.fromEntries(methods.map(k=>[k,e[k].bind(e)]));
 const draw=scene.unitBody;
 let releasing=false;
 Object.assign(body,{fixed:true,acted:true,vx:0,vy:0,airborne:false,jumping:false});
 e.newRound=(...args)=>{const out=stock.newRound(...args);body.acted=true;return out;};
 e.b.queue=e.b.queue.filter(id=>id!==body.id);
 e.actors=side=>stock.actors(side).filter(u=>u!==body);
 e.select=id=>id!==body.id&&stock.select(id);
 e.walk=(u,...args)=>u!==body&&stock.walk(u,...args);
 e.jump=(u=e.active)=>u!==body&&stock.jump(u);
 e.impulse=(u,...args)=>{if(u!==body)return stock.impulse(u,...args);};
 e.integrateBody=(u,...args)=>u===body?e.grounded(u):stock.integrateBody(u,...args);
 e.skillAllowed=(skill,u=e.active)=>u!==body?stock.skillAllowed(skill,u):
  releasing&&skill?.id===sodanSkills.body&&stock.skillAllowed(skill,u);
 e.fire=(...args)=>e.active!==body&&stock.fire(...args);
 const anchored=()=>!body.dead&&body.hp>0&&body.x===pose.x&&body.y===pose.y&&e.grounded(body);
 function unavailableReason(){
  const s=C.SKILLS[sodanSkills.body];
  if(!body.loadout.includes(s.id))return '호혼령이 장착되지 않았습니다.';
  if(!anchored())return '육신이 돌단에 있을 때 부를 수 있습니다.';
  if(!e.canAct())return '동행이 움직일 수 있을 때 부를 수 있습니다.';
  if(e.cooldownLeft(body,s.id)!==0)return '호혼령이 돌아올 때까지 기다리세요.';
  return e.canAfford(s,body,.18)?'':'소단의 기력이 부족합니다.';
 }
 const available=()=>!unavailableReason();
 function release(){
  if(!available())return false;
  const b=e.b,active=b.active,acted=body.acted;
  const guards=stock.actors(0).filter(u=>u!==body&&!u.summoned);
  const nearest=guards.sort((a,c)=>Math.abs(a.x-body.x)-Math.abs(c.x-body.x))[0];
  try{
   releasing=true;b.active=body.id;body.acted=false;
   return stock.fire(sodanSkills.body,nearest?.x<body.x?194:-14,.18);
  }finally{releasing=false;b.active=active;body.acted=acted;}
 }
 seatedArt(scene,body,()=>true);
 return {anchored,unavailableReason,release};
}

const spiritChapters=[53,54,56];
export function validSodanThread(record,body,through){
 if(!record||record.version!==1||!body||record.body!==body.id||body.cls!=='occultist'||!Array.isArray(record.casts))return false;
 let earlier=0;
 return record.casts.every(c=>{
  if(!spiritChapters.includes(c.stage)||c.stage<=earlier||c.stage>through||!sodanInnerTree.includes(c.skill)||
     !Number.isSafeInteger(c.shot)||c.shot<1||!Number.isFinite(c.cost)||c.cost<0||c.cost>body.maxFocus)return false;
  earlier=c.stage;
  return true;
 });
}
const threadCost=(record,after)=>record.casts.reduce((n,c)=>n+(c.stage>after?c.cost:0),0);
export function debitSodanThread(body,record,through,after){
 if(!record)return true;
 if(!validSodanThread(record,body,through))return false;
 const cost=threadCost(record,after);
 if(cost>body.focus)return false;
 body.focus-=cost;
 return true;
}
export function mountSodanSpirit({C,e,scene,hero,body,previous,stage,isWall=()=>false,preferredTarget=()=>null}){
 const record=previous?structuredClone(previous):{version:1,body:body.id,casts:[]};
 if(!validSodanThread(record,body,stage-1))throw Error('Unverified Sodan thread carry');
 const after=stage===56?54:0;
 const byId=e.unit.bind(e),fire=e.fire.bind(e),draw=scene.unitBody;
 const skills=sodanInnerTree.filter(id=>C.SKILLS[id]?.cls==='occultist'&&!C.SKILLS[id].passive&&body.ranks[id]>0);
 const powers=[.42,.61,.29,.78];
 const spirit={...structuredClone(body),loadout:skills.slice(),ranks:Object.fromEntries(skills.map(id=>[id,body.ranks[id]])),equipmentIds:[],gearBonuses:{},gearStats:undefined,
  equipmentState:{version:1},fixed:true,acted:false,airborne:false,jumping:false,vx:0,vy:0};
 e.unit=id=>id===spirit.id?spirit:byId(id);
 // These two authored enemies must stay hostile to drive their chapter
 // objective. An intervening collision must not charm them either.
 const plotEnemy=u=>u.id==='mumyeongsa-b-wall-guard'||stage===56&&u.id==='draft-pressure-3';
 if(typeof e.captureEnemy==='function'){
  const capture=e.captureEnemy.bind(e);
  e.captureEnemy=(u,owner,...args)=>owner===spirit&&plotEnemy(u)?false:capture(u,owner,...args);
 }
 function position(){
  const wall=isWall(hero);
  spirit.x=hero.x-(wall?105:75*(hero.facing||1));
  spirit.y=hero.y-(wall?54:24);
  return wall;
 }
 const legalTarget=(u,id)=>u.side===1&&!u.dead&&u.hp>0&&
  Math.hypot(u.x-hero.x,u.y-hero.y)<940&&(id!=='O09'||(
    !u.honroObjectiveTarget&&!u.eaterCapturedBy&&!u.summoned&&!u.boss&&!u.honroMidboss&&!u.honroAct2Boss&&!u.elite&&!u.enthrall&&
    !plotEnemy(u)));
 function unavailableReason(id=skills[0]){
  if(!skills.includes(id)||body.hp<=0||body.dead)return '소단의 혼이 주박 기예를 쓸 수 없습니다.';
  const skill=C.SKILLS[id];
  if(record.casts.some(c=>c.stage===stage))return '이 장의 혼령 지원을 이미 썼습니다.';
  if(funds()<Math.min(...powers.map(power=>e.manaCost(skill,spirit,power))))return '소단의 기력이 부족합니다.';
  if(e.active!==hero||!e.canAct()||!e.grounded(hero)||e.b.projectiles.length)return '담허가 발을 붙이고 행동할 때 쓸 수 있습니다.';
  return e.b.units.some(u=>legalTarget(u,id))?'':id==='O09'?'혼을 붙잡을 수 있는 적에게 가까이 가세요.':'적에게 혼줄이 닿는 곳에서 쓸 수 있습니다.';
 }
 const funds=()=>body.focus-threadCost(record,after);
 function target(skill){
  const foes=e.b.units.filter(u=>legalTarget(u,skill.id)),direct=new Set(foes.map(u=>u.id));
  const preferred=preferredTarget(),prefers=direct.has(preferred);
  const area=skill.id==='O08'||skill.id==='O10',radius=area?e.effective(skill,spirit).radius:0;
  const allies=area?e.b.units.filter(u=>u.side===0&&!u.dead&&!u.enthrall):[];
  // Match the native curse's blast origin and body-midpoint rule. A terrain
  // impact can apply an area curse, but a miss or a blast on Damheo is not help.
  const inBlast=(hit,u)=>Math.hypot(u.x-hit.x,u.y-u.h*.5-hit.y)<radius+u.r;
  let other=null;
  for(const power of powers){
   if(!e.canAfford(skill,spirit,power))continue;
   for(let angle=-80;angle<=260;angle+=5){
    const hit=e.predict(spirit,skill,angle,power,undefined,true);
    if(area){
     if(!Number.isFinite(hit.x)||!Number.isFinite(hit.y)||(!hit.terrain&&!direct.has(hit.unit))||
        allies.some(u=>inBlast(hit,u)))continue;
     const affected=foes.filter(u=>inBlast(hit,u));
     if(!affected.length)continue;
     if(!prefers||affected.some(u=>u.id===preferred))return {angle,power};
    }else{
     if(!direct.has(hit.unit))continue;
     if(!prefers||hit.unit===preferred)return {angle,power};
    }
    other??={angle,power};
   }
  }
  return other;
 }
 function cast(id=skills[0]){
  if(unavailableReason(id))return false;
  const skill=C.SKILLS[id];
  position();
  spirit.focus=funds();
  const aim=target(skill);
  if(!aim)return false;
  const b=e.b,before=spirit.focus,active=b.active;
  try{
   b.units.push(spirit);b.active=spirit.id;
   if(!fire(skill.id,aim.angle,aim.power,true))return false;
   record.casts.push({stage,skill:skill.id,shot:b.shot,cost:before-spirit.focus});
   return true;
  }finally{b.active=active;b.units.splice(b.units.indexOf(spirit),1);}
 }
 scene.unitBody=function(c,u,...args){
  const output=draw.call(this,c,u,...args);
  if(u!==hero||u.dead||u.portraitOnly)return output;
  const wall=position(),root={x:hero.x-(wall?hero.h*.5:0),y:hero.y-(wall?0:hero.h*.5)};
  c.save();
  c.strokeStyle='#adccc4';c.globalAlpha=.74;c.lineWidth=1.8;
  c.beginPath();c.moveTo(root.x,root.y);
  c.quadraticCurveTo((root.x+spirit.x)/2,root.y+25,spirit.x,spirit.y-41);c.stroke();
  c.globalAlpha=.49;
  try{draw.call(this,c,spirit,0);}finally{c.restore();}
  return output;
 };
 function storySpeaker(){
  if(hero.dead||hero.hp<=0||body.dead||body.hp<=0)return null;
  position();return spirit;
 }
 return {skills:()=>skills.slice(),used:()=>record.casts.some(c=>c.stage===stage),unavailableReason,cast,storySpeaker,record:()=>structuredClone(record)};
}
