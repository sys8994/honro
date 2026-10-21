/** Continue exact ordinary-input checkpoints; actual ritual shots and enemy response. */
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const h=await appHarness(),{g,C}=h,source=JSON.parse(await readFile('_local/reports/stage5-positioning/probes.json','utf8')),base=JSON.parse(await readFile('game/docs/stage-review/stage05-diagnosis/evidence/entry-profile.json','utf8')).profile;
const cases=[];let now=0;g.performance={now:()=>now};
for(const q of source.ritual){const p=plain(base);for(const id of ['M03','M11']){if(!C.train(p.heroes.mage,id))throw Error(C.trainReason(p.heroes.mage,id));}p.loadouts.mage=['M01','M03','M11'];p.honroBattle=plain(q.battle);p.lastStage=5;let a=h.load(p);a.continue();const e=a.engine,b=e.b;a.scene.render=()=>{};now=0;a.prev=0;let frame=0,damage=[],impacts=[],fires=[];
 const hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const hp=u.hp,r=hurt(u,...args);if(hp>u.hp)damage.push({frame,round:b.round,target:u.id,owner:args[1],loss:hp-u.hp});return r;};const impact=e.impact.bind(e);e.impact=(p,v)=>{impacts.push({frame,owner:p.owner,skill:p.skill,unit:v.unit?.id,terrain:v.terrain?.id,bounces:p.bounces,x:v.x,y:v.y});return impact(p,v);};const fire=e.fire.bind(e);e.fire=(...args)=>{let id=e.active.id,r=fire(...args);fires.push({frame,round:b.round,id,args,accepted:r});return r;};
 function tick(){now+=1000/60;a.frame(now);frame++;if(a.lastError)throw Error(a.lastError);}
 function settle(){for(let n=0;n<20000;n++){if(a.dialogue)g.HonroStory.finish(a);tick();if(a.canInput()||['won','lost'].includes(b.phase))return;}throw Error('input timeout');}
 settle();a.selectHero('p-mage');const u=e.active,position={x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft},holding=plain(b.honroState.ritual),incoming=[];
 for(const id of ['foe-4','foe-5']){const v=e.unit(id),skill=C.SKILLS[v.loadout[0]];for(const angle of (v.x>u.x?[160,170,180,190,200]:[-20,-10,0,10,20]))for(const power of [.3,.6,1]){const r=e.predict(v,skill,angle,power,undefined,false);incoming.push({id,skill:skill.id,angle,power,unit:r.unit,terrain:r.terrain,x:r.x,y:r.y});}}
 const id=q.goal===1490?'M11':'M03',skill=C.SKILLS[id];let aim=null;
 const seeds=q.goal===1490?[-40,-20,0,20,40,60].flatMap(angle=>[.3,.6,1].map(power=>({angle,power}))):e.shotSeeds(u,skill,e.unit('foe-5'));
 for(const seed of seeds){const r=e.predict(u,skill,seed.angle,seed.power,undefined,false);if(r.unit?.startsWith('foe')&&(q.goal!==1490||r.contacts?.length)){aim={...seed,prediction:{unit:r.unit,terrain:r.terrain,contacts:r.contacts,x:r.x,y:r.y}};break;}}
 const accepted=aim&&e.fire(id,aim.angle,aim.power);if(accepted)settle();if(a.canInput()&&b.round===2){a.defend();settle();}
 const row={goal:q.goal,position,holding,incoming,skill:id,aim,accepted,damage,impacts,fires,final:plain(b),ritualAfter:plain(b.honroState.ritual),frame};cases.push(row);console.log(JSON.stringify({goal:q.goal,position,aim,accepted,impacts:impacts.filter(v=>v.owner==='p-mage'),damage,ritual:row.ritualAfter}));
}
await writeFile('_local/reports/stage5-positioning/ritual-actions.json',JSON.stringify({scope:'Native production App and Engine input, unchanged normal R2 checkpoints; no HP/pose/target/army injection. Incoming grids are predictions, outgoing and enemy response use actual projectiles.',cases},null,2));
