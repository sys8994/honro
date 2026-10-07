// Native production App/engine bot. Menu/Canvas/storage are doubles; normal
// movement, jump, skills, interaction and the App defense action are used.
// Engine-only item commands are never used: HONRO has no visible supply UI. Dialogue
// pages are explicitly advanced. No combat HP, position, objective or inventory
// state is edited. Only the initial chapter-24 entry is a prepared fixture.
// Chapters25–27 retain real preceding outcome resources; no per-stage reload.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C,load,profileThrough}=h,A=g.HonroAct3,S=g.HonroSplitCampaign,ids=[24,25,26,27],rows=[];
const out=process.env.HONRO_SPLIT_REPORT||'_local/reports/act3-split-normal';await mkdir(out,{recursive:true});
const sourceFiles=['shared/build.mjs','game/config/balance.json','tests/act3-split-normal.mjs','shared/data/campaign.json','tests/app-regression-helpers.mjs'];
for(const dir of ['shared/runtime','shared/engine/src','shared/map'])for(const file of await readdir(dir))if(/\.(js|ts)$/.test(file))sourceFiles.push(dir+'/'+file);sourceFiles.sort();
const source=Object.fromEntries(await Promise.all(sourceFiles.map(async f=>[f,createHash('sha256').update(await readFile(f)).digest('hex')])));
// Exactly one prepared entry, before chapter 24. Later chapters must be
// reached through the ordinary App result-continue control in this same App.
const profile=profileThrough(23);for(const cls of profile.recruited){profile.heroes[cls].xp=g.HonroProgression.budget(24).start;C.autoTrain(profile.heroes[cls],cls);C.sanitizeLoadout(profile,cls);}
const guardThreshold=Math.max(0,Math.min(.5,Number(process.env.HONRO_BOT_GUARD_THRESHOLD||0)));
let app=load(profile);app.launch(24);
const initialProfile=plain(profile);await writeFile(`${out}/entry-profile.json`,JSON.stringify(initialProfile));
const entryHistory=[];
for(const id of ids){if(app.stageId!==id)throw Error('Continuous stage transition did not reach '+id);
 const st=g.HONRO_CONTENT.stages[id-1],map=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id),e=app.engine,b=e.b,actions=[],dialogue=[],route=map.design.act3.requiredRoute,fingerprint=createHash('sha256').update(JSON.stringify({map,source})).digest('hex'),start=performance.now();let frames=0;
 const entry={stage:id,mode:b.honroSplit?.mode,session:b.session,heroes:b.units.filter(S.hero).map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,maxFocus:u.maxFocus,x:u.x,y:u.y,dead:u.dead})),items:plain(b.items),xp:plain(b.heroes),split:plain(b.honroSplit)};entryHistory.push(entry);
 if(entry.mode!=='continuous')throw Error('Lost continuous provenance at '+id);
 if(id===27&&(!S.allPresent(b)||!b.honroSplit.spawnReady))throw Error('Missing four-hero authored split spawn');
 function drain(){let presentationNow=performance.now();for(let i=0;app.dialogue&&i<800;i++){const d=app.dialogue,line=d.lines[d.index],staging=d.staging;dialogue.push({id:d.id,storyId:line?.[2]?.storyId,index:d.index,speaker:line?.[0],text:line?.[1],displayed:!staging||staging.complete,staging:staging?{id:staging.id,cursor:staging.cursor,complete:staging.complete}:null,round:b.round,enemyEnds:b.teamEnds[1],reunionDone:!!A.memory(b).done['party-reunion'],allPresent:S.allPresent(b),focus:plain(app.scene?.goalFocus||null),positions:b.units.filter(S.hero).map(u=>({cls:u.cls,x:u.x,y:u.y}))});if(staging&&!staging.complete){presentationNow+=60;g.HonroStory.tick(app,presentationNow);}else g.HonroStory.next(app);}if(app.dialogue)throw Error('Unresolved dialogue');}
 function tick(){if(app.dialogue){drain();return;}e.tick(1/60);if(!app.dialogue)g.HonroMission.tick(app,1/60);app.startQueuedStory();frames++;}
 function waypoint(u,goal){if(Math.abs(goal.y-u.y)<160)return goal;const near=route.reduce((best,p,i)=>Math.hypot(p.x-u.x,p.y-u.y)<best.d?{i,d:Math.hypot(p.x-u.x,p.y-u.y)}:best,{i:0,d:Infinity}),end=route.reduce((best,p,i)=>Math.hypot(p.x-goal.x,p.y-goal.y)<best.d?{i,d:Math.hypot(p.x-goal.x,p.y-goal.y)}:best,{i:0,d:Infinity});return route[Math.max(0,Math.min(route.length-1,near.i+Math.sign(end.i-near.i)))]||goal;}
 function move(u,goal){let still=0;for(let n=0;n<650&&e.canAct()&&u.moveLeft>10;n++){const p=waypoint(u,goal);if(Math.abs(u.x-goal.x)<24&&Math.abs(u.y-goal.y)<150)break;const before=u.x;e.move(Math.sign(p.x-u.x),1/60);tick();if(app.dialogue)drain();if(Math.abs(u.x-before)<.1){if(++still>10&&e.grounded(u)){e.jump(u);still=0;}}else still=0;}for(let n=0;n<180&&!e.grounded(u)&&e.canAct();n++)tick();}
 drain();
 for(let count=0;count<Number(process.env.HONRO_BOT_ACTION_LIMIT||420)&&!['won','lost'].includes(b.phase);count++){
  while(!e.canAct()&&!['won','lost'].includes(b.phase)&&frames<800000){drain();tick();}drain();if(['won','lost'].includes(b.phase)||frames>=800000)break;
  if(g.HonroStory.turnPaused(app))await new Promise(resolve=>setTimeout(resolve,Math.max(1,Math.ceil(app.turnNotice.pauseUntil-performance.now()))));
  const ready=A.readySteps(b);if(!ready.length){app.checkMission(e);break;}
  const eligible=e.heroesAlive().filter(u=>!u.acted),required=ready.filter(s=>s.requiredClass).flatMap(s=>eligible.filter(u=>u.cls===s.requiredClass).map(u=>({u,s,d:Math.hypot(u.x-A.marker(b,s.id).x,u.y-A.marker(b,s.id).y)}))).sort((a,c)=>a.d-c.d);
  if(required[0])e.select(required[0].u.id);let u=e.active;if(!u||u.side!==0)continue;
  let s=ready.find(s=>s.requiredClass===u.cls)||ready.slice().sort((a,c)=>Math.hypot(u.x-A.marker(b,a.id).x,u.y-A.marker(b,a.id).y)-Math.hypot(u.x-A.marker(b,c.id).x,u.y-A.marker(b,c.id).y))[0];const m=A.marker(b,s.id);

  let goal=A.interactionTarget(b,m)||m;const t=s.kind==='destroy'&&b.terrain.find(t=>t.id===s.id),carrier=s.kind==='escort'&&e.unit(s.target);
  if(carrier)goal={x:Math.min(m.x,carrier.x+480),y:carrier.y};
  const nearFoe=e.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1100||A.sameFloor(v,m,600)).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y))[0];
  if(nearFoe&&s.kind!=='destroy'&&s.kind!=='escort'&&s.kind!=='hold'&&Math.hypot(nearFoe.x-goal.x,nearFoe.y-goal.y)<550){const distance=u.cls==='knight'?120:440;goal={x:nearFoe.x+(u.x<nearFoe.x?-distance:distance),y:nearFoe.y};}
  move(u,goal);drain();if(!e.canAct())continue;
  let action=null;
  if(guardThreshold&&u.hp<u.maxHp*guardThreshold){if(!app.canInput())throw Error('Low-HP defense unavailable');app.defend();action={action:'defend-low',guardThreshold};}
  else if(m.action&&A.eligibility(app,m).ok&&A.use(app,m))action={action:'interact',target:m.id};
  else if(t&&!t.broken&&(!s.requiredClass||u.cls===s.requiredClass)){
   const skill=C.SKILLS[C.baseSkill(u.cls)],direct=Math.atan2(u.y-u.h*.6-(t.y+t.h*.5),t.x+t.w/2-u.x)*180/Math.PI;let best=null;
   for(const angle of [direct,...Array.from({length:49},(_,i)=>-12+i*4)])for(const power of [.2,.35,.5,.7,.9,1]){const hit=e.predict(u,skill,angle,power,undefined,true);if(hit.terrain===t.id){best={angle,power};break;}if(best)break;}
   if(best&&e.fire(skill.id,best.angle,best.power))action={action:'fire-control',target:t.id,...best};
  }
  if(!action){const foes=e.alive(1).sort((a,c)=>Number(A.sameFloor(c,m,300))-Number(A.sameFloor(a,m,300))||Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y));for(const foe of foes.slice(0,2)){if(Math.hypot(foe.x-u.x,foe.y-u.y)>1500)continue;const skills=u.loadout.map(k=>C.SKILLS[k]).filter(s=>!s.passive&&s.damage>0&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus).sort((a,c)=>c.damage-a.damage);for(const skill of skills.slice(0,2)){let best=null;for(const aim of e.shotSeeds(u,skill,foe)){const q=C.shotViable(e,u,skill,foe,aim.angle,aim.power);if(q.ok&&q.risk<1&&q.miss<Math.max(85,skill.radius+foe.r+55)&&(!best||q.net>best.net))best={...aim,net:q.net};}if(best&&e.fire(skill.id,best.angle,best.power)){action={action:'fire',skill:skill.id,target:foe.id};break;}}if(action)break;}}
  if(!action){if(!app.canInput())throw Error('Defense input unavailable at '+id+':'+b.round);app.defend();action={action:'defend'};}actions.push({round:b.round,actor:u.cls,goal:s.id,x:u.x,y:u.y,...action,heroes:b.units.filter(S.hero).map(v=>({cls:v.cls,hp:v.hp,mp:v.focus,dead:v.dead})),items:plain(b.items),enemyCount:e.alive(1).length,objective:A.state(b).summary});
  if(count%8===0){console.log('PLAY',id,b.round,s.id,actions.length,e.heroesAlive().map(v=>v.cls+':'+Math.round(v.hp/v.maxHp*100)).join('/'));await writeFile(`${out}/checkpoint-${id}.json`,JSON.stringify({id,fingerprint,b,profile:app.profile,entryHistory,actions,dialogue}));}
 }
 if(b.phase==='won'){app.outcome();drain();}else drain();
 const row={guardThreshold,consumableInputMode:'disabled: current HONRO UI has no consumable action',stage:id,phase:b.phase,round:b.round,goal:A.current(b)?.id,reason:b.winnerReason,seconds:(performance.now()-start)/1000,simulationSeconds:frames/60,fingerprint,source,entry,actions,dialogue,staging:plain(b.honroStaging||null),heroes:b.units.filter(S.hero).map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,maxFocus:u.maxFocus,x:u.x,y:u.y,dead:u.dead})),items:plain(b.items),xp:plain(b.heroes),split:plain(b.honroSplit),scope:'Continuous 24→27 native production App/engine input bot. One chapter-24 prepared entry only; later entries use result-continue. Menu, Canvas and storage doubles. No combat HP/position/objective/inventory edits. Not browser play or a human difficulty verdict.'};rows.push(row);
 await writeFile(`${out}/stage-${id}.json`,JSON.stringify(row,null,2));await writeFile(`${out}/checkpoint-${id}.json`,JSON.stringify({id,fingerprint,b,profile:app.profile,entryHistory,actions,dialogue}));await writeFile(`${out}/summary.json`,JSON.stringify({source,rows,entryHistory},null,2));console.log('RESULT',id,b.phase,b.round,row.goal,actions.length,row.reason);
 if(b.phase!=='won')break;
 if(id<27)h.click('result-continue');
}
if(rows.length!==4||rows.some(r=>r.phase!=='won'))process.exitCode=1;
