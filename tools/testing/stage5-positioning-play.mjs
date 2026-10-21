/** One ordinary campaign run, checkpointed after the first finite entry. */
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const out='_local/reports/stage5-positioning',entryOnly=process.argv.includes('--entry-only'),resume=process.argv.includes('--continue');await mkdir(out,{recursive:true});
const h=await appHarness(),{g,C}=h;vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
let p=JSON.parse(await readFile('game/docs/stage-review/stage05-diagnosis/evidence/entry-profile.json','utf8')).profile,training=[];
function train(cls,id){if(p.heroes[cls].ranks[id])return;const t=C.TALENT_MAP[id];if(t.prereq)train(cls,t.prereq);if(!C.train(p.heroes[cls],id))throw Error(C.trainReason(p.heroes[cls],id));training.push({cls,id});}
for(const id of ['M03','M11'])train('mage',id);for(const id of ['A14','A02'])train('archer',id);p.loadouts.mage=['M01','M03','M11'];p.loadouts.archer=['A01','A14','A02'];
const prior=resume?JSON.parse(await readFile(out+'/play-checkpoint.json','utf8')):null;if(prior)p=prior.profile;
let now=prior?.now||0,frame=prior?.frame||0;g.performance={now:()=>now};let a=h.load(p);resume?a.continue():a.launch(5);let e=a.engine,b=e.b;a.scene.render=()=>{};a.prev=now;
const records=prior?.records||[],hits=prior?.hits||[],fires=prior?.fires||[],births=prior?.births||[],notices=prior?.notices||[],snapshots=prior?.snapshots||[],known=new Set(b.units.map(u=>u.id));
const pos=u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,maxMove:u.maxMove,support:e.contactSurface(u.x,u.y-5,u.y+5)?.t.id});
const record=(op,extra={})=>records.push({op,frame,round:b.round,...plain(extra)});
const hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const hp=u.hp,r=hurt(u,...args);if(hp>u.hp)hits.push({frame,round:b.round,target:u.id,owner:args[1],loss:hp-u.hp});return r;};
const fire=e.fire.bind(e);e.fire=(...args)=>{const actor=e.active.id,r=fire(...args);fires.push({frame,round:b.round,actor,args,accepted:r});return r;};const event=a.event.bind(a);a.event=(text,...args)=>{notices.push({frame,round:b.round,text});return event(text,...args);};
const terminal=()=>['won','lost'].includes(b.phase)||a.done;
function tick(){now+=1000/60;a.frame(now);frame++;if(a.lastError)throw Error(a.lastError);for(const u of b.units)if(!known.has(u.id)){known.add(u.id);births.push({frame,round:b.round,id:u.id,source:u.honroSpawnSource,x:u.x,y:u.y,hp:u.hp,elite:u.elite});}if(b.side===1&&b.queue.length>4)throw Error('Enemy queue exceeds4');}
function settle(){for(let n=0;n<20000&&!terminal();n++){if(a.dialogue)g.HonroStory.finish(a);tick();if(a.canInput())return true;if(entryOnly&&births.filter(v=>v.source==='lower-beasts').length===6)return false;}return !terminal()&&a.canInput();}
function move(x){const u=e.active,from=pos(u);let stuck=0;for(let n=0;n<1800&&a.canInput()&&u.moveLeft>2&&Math.abs(u.x-x)>5;n++){const old=u.x;a.keys.add(x>u.x?'ArrowRight':'ArrowLeft');tick();a.keys.clear();stuck=Math.abs(old-u.x)<.02?stuck+1:0;if(stuck>30)break;}for(let n=0;n<600&&a.canInput()&&!e.grounded(u);n++)tick();record('move',{from,to:pos(u),goal:x});}
function choose(u){
 const goal=e.unit('cliff-cleat');if(u.cls==='archer'&&b.honroState.ritual?.active&&!goal.dead&&u.x>1900){const s=C.SKILLS.A01,seeds=[...e.shotSeeds(u,s,goal),...Array.from({length:43},(_,i)=>[.4,.6,.8,1].map(power=>({angle:i*2,power}))).flat()];for(const aim of seeds){const r=e.predict(u,s,aim.angle,aim.power,undefined,false);if(r.unit===goal.id||r.terrain===goal.id)return{id:s.id,target:goal.id,...aim};}}
 let best=null;const targets=e.alive(1).filter(t=>Math.hypot(t.x-u.x,(t.y-u.y)*.8)<1300).sort((v,w)=>Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y)).slice(0,4);
 for(const id of u.loadout){const skill=C.SKILLS[id];if(e.cooldownLeft(u,id)||e.manaCost(skill,u,.5)>u.focus)continue;for(const target of targets){const right=target.x>=u.x,angles=[-40,-10,15,40,65,85];const seeds=[...e.shotSeeds(u,skill,target),...angles.flatMap(v=>[.3,.6,1].map(power=>({angle:right?v:180-v,power})))];for(const aim of seeds){const v=C.shotViable(e,u,skill,target,aim.angle,aim.power);if(v.ok&&v.risk<1&&v.enemyDamage>0&&(!best||v.net>best.net))best={id,target:target.id,...aim,net:v.net};}if(best&&best.net>90)break;}}
 return best;
}
function shoot(u,q){const face=Math.cos(q.angle*Math.PI/180)>=0?1:-1;if(face!==u.facing){a.stick.x=face*.02;tick();a.stick.x=0;}a.adjustAngle(u,(face>0?q.angle:180-q.angle)-a.displayAngle(u));if(Math.abs(u.angle-q.angle)>.1)return false;a.selected=q.id;if(!a.beginCharge())return false;const until=now+e.chargeDuration(u,C.SKILLS[q.id])*q.power*1000;while(now<until&&!terminal())tick();a.releaseCharge();record('charge-fire',{actor:u.id,position:pos(u),...q});return true;}
for(let action=0;action<64&&!terminal();action++){
 if(!settle())break;const u=e.active;record('input',{position:pos(u),ritual:b.honroState.ritual||null});console.log('TURN',b.round,u.cls,Math.round(u.x),Math.round(u.y),u.hp,'enemies',e.alive(1).length);
 if(!snapshots.some(s=>s.round===b.round)){snapshots.push({round:b.round,battle:plain(b)});await writeFile(out+'/play-progress.json',JSON.stringify({round:b.round,heroes:e.heroesAlive().map(pos),births,records:records.slice(-6)}));}
 if(u.cls==='archer'){
  if(b.round===1&&u.x<650){move(580);if(a.canInput()){record('jump',{position:pos(u),accepted:e.jump(u),cost:e.jumpCost(u)});move(740);}move(1100);}
  else if(u.y>2900){if(e.grounded(u)&&e.jump(u))record('return-jump',{position:pos(u)});move(2375);}
  else if(u.x<2360)move(b.round===2?2060:2375);
 }else if(!b.honroState.ritual?.active||Math.abs(u.x-1490)>12)move(1490);
 if(!a.canInput())continue;
 if(u.cls==='mage'&&!b.honroState.ritual?.active){const m=b.honroMarkers.find(m=>m.action==='ritual');if(g.HonroInteractions.eligibility(a,m).ok){record('ritual',{position:pos(u)});g.HonroInteractions.use(a,m);continue;}}
 if(entryOnly){a.defend();record('defend',{actor:u.id});continue;}
 if(u.hp<u.maxHp*.43&&b.items.heal){record('item',{actor:u.id,kind:'heal',before:u.hp});e.item('heal');continue;}
 const choice=choose(u);if(choice&&shoot(u,choice))continue;record('defend',{actor:u.id});a.defend();
}
if(entryOnly&&!terminal()){a.export();await writeFile(out+'/play-checkpoint.json',JSON.stringify({profile:await h.exported(),now,frame,records,hits,fires,births,notices,snapshots,training}));}
if(terminal()&&b.phase==='won'){for(let n=0;n<60;n++){if(a.dialogue)g.HonroStory.finish(a);tick();if(a.profile.cleared[5])break;}}
const result={scope:'One native production App input run from normal legal level4 reward-ledger profile; DOM/render/clock/storage doubles. No HP/position/movement/army/target injection. Resumed from its own actual checkpoint when requested.',entryOnly,resumed:resume,training:prior?.training||training,records,hits,fires,births,notices,snapshots,final:plain(b),profile:plain(a.profile),frame,completed:b.phase==='won',reason:entryOnly?'Finite-entry observation checkpoint':'Terminal or action budget'};
await writeFile(out+(entryOnly?'/entry-run.json':'/fullplay.json'),JSON.stringify(result,null,2));console.log('RESULT',JSON.stringify({round:b.round,phase:b.phase,heroes:e.heroesAlive().map(pos),births,completed:result.completed}));
