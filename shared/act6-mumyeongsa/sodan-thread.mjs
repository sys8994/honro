// Chapter-local controls keep the campaign actor's normal equipment and loadout.
export const sodanSkills=Object.freeze({body:'O13',spirit:'O06'});
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
 function available(){
  const s=C.SKILLS[sodanSkills.body];
  return anchored()&&e.canAct()&&body.loadout.includes(s.id)&&e.cooldownLeft(body,s.id)===0&&e.canAfford(s,body,.18);
 }
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
 scene.unitBody=function(c,u,...args){
  if(u.id!==body.id||u.dead||u.portraitOnly)return draw.call(this,c,u,...args);
  c.save();
  c.translate(body.x,body.y);
  c.strokeStyle='#c8d8bd';c.lineWidth=1.6;
  c.beginPath();c.ellipse(0,-2,49,10,0,0,Math.PI*2);c.stroke();
  c.beginPath();c.moveTo(-8,-20);c.bezierCurveTo(24,-71,55,-31,108,-95);c.stroke();
  c.fillStyle='#493f51';c.beginPath();c.ellipse(1,-10,28,9,0,0,Math.PI*2);c.fill();
  c.scale(1.07,.71);c.translate(-body.x,-body.y);
  try{return draw.call(this,c,u,...args);}finally{c.restore();}
 };
 return {anchored,available,release};
}

const spiritChapters=[53,54,56];
export function validSodanThread(record,body,through){
 if(!record||record.version!==1||!body||record.body!==body.id||body.cls!=='occultist'||!Array.isArray(record.casts))return false;
 let earlier=0;
 return record.casts.every(c=>{
  if(!spiritChapters.includes(c.stage)||c.stage<=earlier||c.stage>through||c.skill!==sodanSkills.spirit||
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
 const skill=C.SKILLS[sodanSkills.spirit],rank=body.ranks[skill.id]??0;
 const powers=[.42,.61,.29,.78];
 const spirit={...structuredClone(body),loadout:[skill.id],ranks:{[skill.id]:rank},equipmentIds:[],gearBonuses:{},gearStats:undefined,
  equipmentState:{version:1},fixed:true,acted:false,airborne:false,jumping:false,vx:0,vy:0};
 e.unit=id=>id===spirit.id?spirit:byId(id);
 function position(){
  const wall=isWall(hero);
  spirit.x=hero.x-(wall?105:75*(hero.facing||1));
  spirit.y=hero.y-(wall?54:24);
  return wall;
 }
 function canCast(){
  return rank>0&&body.hp>0&&!body.dead&&e.active===hero&&e.canAct()&&e.grounded(hero)&&
    !e.b.projectiles.length&&!record.casts.some(c=>c.stage===stage)&&
    funds()>=Math.min(...powers.map(power=>e.manaCost(skill,spirit,power)))&&
    e.b.units.some(u=>u.side===1&&!u.dead&&Math.hypot(u.x-hero.x,u.y-hero.y)<940);
 }
 const funds=()=>body.focus-threadCost(record,after);
 function target(){
  const foes=new Set(e.b.units.filter(u=>u.side===1&&u.hp>0&&!u.dead).map(u=>u.id));
  const preferred=preferredTarget();
  let other=null;
  for(const power of powers){
   if(!e.canAfford(skill,spirit,power))continue;
   for(let angle=-80;angle<=260;angle+=5){
    const hits=e.predict(spirit,skill,angle,power,undefined,true);
    if(!foes.has(hits.unit))continue;
    if(!foes.has(preferred)||hits.unit===preferred)return {angle,power};
    other??={angle,power};
   }
  }
  return other;
 }
 function cast(){
  if(!canCast())return false;
  position();
  spirit.focus=funds();
  const aim=target();
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
 return {canCast,cast,record:()=>structuredClone(record)};
}
