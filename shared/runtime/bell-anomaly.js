(function(G){'use strict';
const C=G.HONRO_CORE,A=G.HonroAct2,clone=x=>JSON.parse(JSON.stringify(x));
// This small west-lip pocket is below the fixed-link firing lanes. No body field.
const REGION=Object.freeze({x:5100,y:5600,rx:550,ry:500});
const active=b=>!!b&&b.honroStage===18&&!b.honroCustom&&b.honroBellAnomalyRevision===1&&!['won','lost'].includes(b.phase);
const memory=b=>(b.honroState??={}).bellAnomaly??=( {version:1,status:'READY',count:0} );
const blocked=value=>{const b=value?.engine?.b||value;return active(b)&&b.honroState?.bellAnomaly?.status==='FLIGHT';};
const zone=b=>active(b)?REGION:null;
const depth=p=>1-((p.x-REGION.x)/REGION.rx)**2-((p.y-REGION.y)/REGION.ry)**2;
const bodies=new Set(['leap','slam','spin','dash','quake','guard','lift','recall','charge','vault','cataclysmCharge']);
function force(b,p){if(!active(b)||p.body||bodies.has(p.mode)||C.SKILLS[p.skill]?.martial||/^stake/.test(p.mode||''))return null;const t=Math.max(0,depth(p));return t?{x:150*t*t,y:-170*t*t}:null;}
function author(project){const s=project.stages?.find(s=>s.metadata?.stageId===18);if(s?.initialState?.honroBellRevision===1)s.initialState.honroBellAnomalyRevision=1;return project;}
const lines=[['설오','맞았어야 할 자리에 닿지 않았습니다.'],['휘겸','종에 부딪힌 것도 아니오.'],['담허','바람에 쓸린 궤적이 아니야. 떨어지는 자리부터 어긋났네.'],['소단','저쪽으로 옮겨 간 혼도 보이지 않아요.'],['설오','그럼 어디로 간 겁니까?'],['담허','……지금은 모르겠네. 우선 저 종부터 안전하게 내려야 해.']];
// Cast-time state only: no map/terrain copy, no change to in-progress objectives.
// All actors are included because arrow-turn passives prune per-target history.
const savedKeys=['units','active','side','phase','controlMode','round','teamEnds','queue','turnAge','resolveAge','nextId','shot','shotDamage','shots','hits','kills','items','events','rng','lastShots','reviewDamage','reviewFocus','reviewLeft','cast','volley','fields','projectiles','zones','stakes','honroGrowth'];
function capture(b){const values={},absent=[];for(const key of savedKeys)if(b[key]===undefined)absent.push(key);else values[key]=clone(b[key]);return{values,absent};}
function restore(b,snapshot){if(!snapshot?.values)return false;for(const key of snapshot.absent||[])delete b[key];for(const [key,value]of Object.entries(snapshot.values)){
 if(key==='units'){const byId=new Map(b.units.map(u=>[u.id,u]));b.units=value.map(saved=>{const u=byId.get(saved.id)||{};for(const k of Object.keys(u))if(!(k in saved))delete u[k];return Object.assign(u,clone(saved));});}
 else b[key]=clone(value);
 }return true;}
function protectedTargets(b){const records=G.HonroQuestTargets?.records(b)||b.terrain||[];return [...b.units.filter(u=>u.honroObjectiveTarget&&!u.dead).map(u=>({id:u.id,x:u.x-u.r,y:u.y-u.h,w:u.r*2,h:u.h})),...records.filter(t=>!t.broken&&(t.honroQuestTarget||t.honroBellRelease||t.honroSeal||t.id==='upper-chain')).map(t=>({id:t.id,x:t.x,y:t.y,w:t.w,h:t.h}))];}
function nearTarget(p,targets,pad=100){return targets.some(t=>p.x>=t.x-pad&&p.x<=t.x+t.w+pad&&p.y>=t.y-pad&&p.y<=t.y+t.h+pad);}
function eligible(e,id,angle,power,ai){const b=e.b,u=e.active;if(!active(b)||memory(b).status!=='READY'||ai||id!=='A01'||!u||u.side!==0||u.summoned||u.enthrall||u.dead||!e.canAct()||!e.grounded(u)||b.projectiles.length||b.volley||b.summonTurn)return false;
 // Inspect the full intended shot, including the downstream hostile objective.
 // A free observation must never eat a required fixed-link shot or an ally.
 const plan=e.predict(u,C.SKILLS[id],angle,power),targets=protectedTargets(b),points=[...plan.points,{x:plan.x,y:plan.y}];
 if(targets.some(t=>t.id===plan.unit||t.id===plan.terrain)||points.some(p=>nearTarget(p,targets)))return false;
 if(plan.unit){const t=e.unit(plan.unit);if(!t||t.side!==1||t.honroProtected||t.boss||t.honroAct2Boss)return false;}
 const entering=points.findIndex(p=>depth(p)>.22);return entering>=1&&entering<points.length-1;
}
function complete(app,seen=true){const e=app.engine,b=e.b,m=memory(b),snapshot=m.snapshot;if(m.status!=='FLIGHT'||!restore(b,snapshot))return false;
 const at=m.point;delete m.snapshot;delete m.projectile;delete m.elapsed;delete m.point;m.status=seen?'RESOLVED':'READY';m.count=seen?1:0;app.dirty=true;app.acc=0;
 if(seen){m.at=at;m.round=b.round;m.actor=b.active;app.cancelInput?.();
  if(app.profile&&!app.training){(app.profile.honroStoryEvents??={})['act2-bell-anomaly-v1']=true;b.honroBellWitness=true;app.persist?.();}
  const script=lines.map(([who,text])=>[who,text.replace('우선 저 종부터 안전하게 내려야 해.',b.honroState?.bellDescent?.status==='settled'?'우선 남은 혼부터 살펴야 해.':'우선 저 종부터 안전하게 내려야 해.'),{storyId:'bell-anomaly-18',source:'bell-anomaly',storyTitle:'묵종 곁의 빈자리'}]);
  if(G.HonroStory?.start&&app.root)G.HonroStory.start(app,script,{title:'묵종 곁의 빈자리',bellAnomaly:true});else app.sayLines?.(script);
 }
 e.emit('change');e.emit('save');return true;
}
function recover(app){const b=app.engine.b,m=memory(b);if(m.status!=='FLIGHT')return false;
 // A reload during flight returns to the exact pre-shot action; no black frame,
 // resource loss or false story completion. The next eligible shot can show it.
 if(!restore(b,m.snapshot)){b.projectiles=b.projectiles.filter(p=>p.id!==m.projectile);b.phase='aim';b.resolveAge=0;}
 delete m.snapshot;delete m.projectile;delete m.elapsed;delete m.point;m.status='READY';m.count=0;app.dirty=true;return true;
}
function attach(app,e){if(!active(e.b)||e.honroBellAnomalyAttached)return;e.honroBellAnomalyAttached=true;recover(app);memory(e.b);
 const fire=e.fire.bind(e),tick=e.tick.bind(e),can=e.canAct.bind(e);
 e.canAct=()=>!blocked(e.b)&&can();
 e.fire=function(id,angle,power,ai=false){if(blocked(e.b))return false;if(!eligible(e,id,angle,power,ai))return fire(id,angle,power,ai);
  const b=e.b,snapshot=capture(b),emit=e.emit;e.emit=function(type,...args){if(type!=='save')return emit.call(e,type,...args);};let fired;
  try{fired=fire(id,angle,power,ai);}finally{e.emit=emit;}
  if(!fired)return false;const p=b.projectiles.find(p=>p.owner===b.active&&p.shot===b.shot&&!p.child&&!p.autonomous&&!p.secondary);
  if(!p){restore(b,snapshot);return false;}
  // The base arrow is real. Automatic repeat/echo descendants never disappear:
  // the observation action is fully refunded, before any descendant is emitted.
  b.projectiles=[p];delete b.volley;const m=memory(b);Object.assign(m,{status:'FLIGHT',projectile:p.id,snapshot,elapsed:0});e.emit('save');return true;
 };
 e.tick=function(dt){if(!blocked(e.b))return tick(dt);const b=e.b,m=memory(b),p=b.projectiles.find(p=>p.id===m.projectile);m.elapsed+=Math.max(0,dt);
  if(!p||m.elapsed>8){complete(app,false);return;}
  const motion=e.advanceProjectile(p,dt);
  if(depth(motion)>.22){Object.assign(p,motion);m.point={x:p.x,y:p.y};complete(app,true);return;}
  // Production swept collision/flight is retained. World/status/AI timers stay
  // frozen, and preflight ensured no collision before this narrow pocket.
  e.stepProjectile(p,dt);if(!b.projectiles.includes(p))complete(app,false);
 };
}
const attachAct2=A.attach;A.attach=function(app,e){const out=attachAct2(app,e);attach(app,e);return out;};
G.HonroBellAnomaly={REGION,author,active,memory,zone,force,blocked,eligible,protectedTargets,attach,recover,capture,restore,lines};
})(globalThis);
