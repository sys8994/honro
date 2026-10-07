// Native production App/engine bot. Menu/Canvas/storage are doubles; normal
// movement, jump, skills, items, interaction and wait inputs are used. Dialogue
// pages are explicitly advanced. No combat HP, position, objective or inventory
// state is edited. Entry saves are declared fixtures, not previous-act clears.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C,load,profileThrough}=h,A=g.HonroAct3,ids=process.argv.slice(2).map(Number),rows=[];if(!ids.length)ids.push(...Array.from({length:10},(_,i)=>21+i));
const out='_local/reports/act3-normal';await mkdir(out,{recursive:true});
const sourceFiles=['shared/runtime/act3-content.js','shared/runtime/act3-objectives.js','shared/runtime/main.js','shared/runtime/progression.js','shared/engine/src/engine.ts','shared/engine/src/physics.ts','game/config/balance.json'];
const source=Object.fromEntries(await Promise.all(sourceFiles.map(async f=>[f,createHash('sha256').update(await readFile(f)).digest('hex')])));
for(const id of ids){const profile=profileThrough(id-1),st=g.HONRO_CONTENT.stages[id-1],map=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id);if(!map)throw Error('Unimplemented map '+id);
 for(const cls of profile.recruited){profile.heroes[cls].xp=g.HonroProgression.budget(id).start;C.autoTrain(profile.heroes[cls],cls);C.sanitizeLoadout(profile,cls);}
 let app=load(profile);app.launch(id);const e=app.engine,b=e.b,actions=[],dialogue=[],route=map.design.act3.requiredRoute,fingerprint=createHash('sha256').update(JSON.stringify({map,source})).digest('hex'),start=performance.now();let frames=0;
 function drain(){for(let i=0;app.dialogue&&i<150;i++){const d=app.dialogue,line=d.lines[d.index];dialogue.push({id:d.id,index:d.index,text:line?.[1]});g.HonroStory.next(app);}if(app.dialogue)throw Error('Unresolved dialogue');}
 function tick(){if(app.dialogue){drain();return;}e.tick(1/60);if(!app.dialogue)g.HonroMission.tick(app,1/60);app.startQueuedStory();frames++;}
 function waypoint(u,goal){if(Math.abs(goal.y-u.y)<160)return goal;const near=route.reduce((best,p,i)=>Math.hypot(p.x-u.x,p.y-u.y)<best.d?{i,d:Math.hypot(p.x-u.x,p.y-u.y)}:best,{i:0,d:Infinity}),end=route.reduce((best,p,i)=>Math.hypot(p.x-goal.x,p.y-goal.y)<best.d?{i,d:Math.hypot(p.x-goal.x,p.y-goal.y)}:best,{i:0,d:Infinity});return route[Math.max(0,Math.min(route.length-1,near.i+Math.sign(end.i-near.i)))]||goal;}
 function move(u,goal){let still=0;for(let n=0;n<650&&e.canAct()&&u.moveLeft>10;n++){const p=waypoint(u,goal);if(Math.abs(u.x-goal.x)<24&&Math.abs(u.y-goal.y)<150)break;const before=u.x;e.move(Math.sign(p.x-u.x),1/60);tick();if(app.dialogue)drain();if(Math.abs(u.x-before)<.1){if(++still>10&&e.grounded(u)){e.jump(u);still=0;}}else still=0;}for(let n=0;n<180&&!e.grounded(u)&&e.canAct();n++)tick();}
 drain();
 for(let count=0;count<Number(process.env.HONRO_BOT_ACTION_LIMIT||420)&&!['won','lost'].includes(b.phase);count++){
  while(!e.canAct()&&!['won','lost'].includes(b.phase)&&frames<800000){drain();tick();}drain();if(['won','lost'].includes(b.phase)||frames>=800000)break;
  const s=A.current(b);if(!s){app.checkMission(e);break;}const m=A.marker(b,s.id),eligible=e.heroesAlive().filter(u=>!u.acted),special=s.requiredClass&&eligible.find(u=>u.cls===s.requiredClass);if(special)e.select(special.id);let u=e.active;if(!u||u.side!==0)continue;
  let goal=A.interactionTarget(b,m)||m;const t=s.kind==='destroy'&&b.terrain.find(t=>t.id===s.id),carrier=s.kind==='escort'&&e.unit(s.target);
  if(carrier)goal={x:Math.min(m.x,carrier.x+480),y:carrier.y};
  const nearFoe=e.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1100||A.sameFloor(v,m,600)).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y))[0];
  if(nearFoe&&s.kind!=='destroy'&&s.kind!=='escort'&&s.kind!=='hold'&&Math.hypot(nearFoe.x-goal.x,nearFoe.y-goal.y)<550){const distance=u.cls==='knight'?120:440;goal={x:nearFoe.x+(u.x<nearFoe.x?-distance:distance),y:nearFoe.y};}
  move(u,goal);drain();if(!e.canAct())continue;
  let action=null;
  if(u.hp<u.maxHp*.28&&b.items.heal>0&&e.item('heal'))action={action:'heal'};
  else if(m.action&&A.eligibility(app,m).ok&&A.use(app,m))action={action:'interact',target:m.id};
  else if(t&&!t.broken&&(!s.requiredClass||u.cls===s.requiredClass)){
   const skill=C.SKILLS[C.baseSkill(u.cls)],direct=Math.atan2(u.y-u.h*.6-(t.y+t.h*.5),t.x+t.w/2-u.x)*180/Math.PI;let best=null;
   for(const angle of [direct,...Array.from({length:49},(_,i)=>-12+i*4)])for(const power of [.2,.35,.5,.7,.9,1]){const hit=e.predict(u,skill,angle,power,undefined,true);if(hit.terrain===t.id){best={angle,power};break;}if(best)break;}
   if(best&&e.fire(skill.id,best.angle,best.power))action={action:'fire-control',target:t.id,...best};
  }
  if(!action){const foes=e.alive(1).sort((a,c)=>Number(A.sameFloor(c,m,300))-Number(A.sameFloor(a,m,300))||Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y));for(const foe of foes.slice(0,2)){if(Math.hypot(foe.x-u.x,foe.y-u.y)>1500)continue;const skills=u.loadout.map(k=>C.SKILLS[k]).filter(s=>!s.passive&&s.damage>0&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus).sort((a,c)=>c.damage-a.damage);for(const skill of skills.slice(0,2)){let best=null;for(const aim of e.shotSeeds(u,skill,foe)){const q=C.shotViable(e,u,skill,foe,aim.angle,aim.power);if(q.ok&&q.risk<1&&q.miss<Math.max(85,skill.radius+foe.r+55)&&(!best||q.net>best.net))best={...aim,net:q.net};}if(best&&e.fire(skill.id,best.angle,best.power)){action={action:'fire',skill:skill.id,target:foe.id};break;}}if(action)break;}}
  if(!action){e.wait();action={action:'defend'};}actions.push({round:b.round,actor:u.cls,goal:s.id,x:u.x,y:u.y,...action});
  if(count%8===0){console.log('PLAY',id,b.round,s.id,actions.length,e.heroesAlive().map(v=>v.cls+':'+Math.round(v.hp/v.maxHp*100)).join('/'));await writeFile(`${out}/checkpoint-${id}.json`,JSON.stringify({id,fingerprint,b,actions,dialogue}));}
 }
 drain();const row={stage:id,phase:b.phase,round:b.round,goal:A.current(b)?.id,reason:b.winnerReason,seconds:(performance.now()-start)/1000,fingerprint,source,actions,dialogue,heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,x:u.x,y:u.y})),items:plain(b.items),scope:'Native production App/engine input bot with menu, Canvas and storage doubles. Prepared entry save. Not browser play or a human difficulty verdict.'};rows.push(row);await writeFile(`${out}/stage-${id}.json`,JSON.stringify(row,null,2));await writeFile(`${out}/checkpoint-${id}.json`,JSON.stringify({id,fingerprint,b,actions,dialogue}));console.log('RESULT',id,b.phase,b.round,row.goal,actions.length,row.reason);
}
if(rows.some(r=>r.phase!=='won'))process.exitCode=1;
