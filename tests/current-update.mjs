import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
const check=(label,fn)=>{fn();console.log('PASS',label);};

check('Stage 4 holds through eight full turns and has a middle reinforcement',()=>{
 const {app,b,e,st}=battlefield(g,4);g.HonroEncounters.configure(b);assert.equal(st.holdRounds,9);
 for(const round of [1,5,8]){b.round=round;assert.equal(g.HonroObjectives.state(b,st).complete,false);}
 b.round=9;assert.equal(g.HonroObjectives.state(b,st).complete,true);
 assert(b.honroEvents.some(ev=>ev.id==='siege-mid'&&ev.when.round===5));
 b.round=5;b.honroState.pendingEvents=['siege-mid'];app.actorBoundary=e.active.id;
 const before=b.units.length;g.HonroEncounters.flush(app);
 assert.equal(b.units.length,before+4);assert.equal(b.honroState.flags['event:siege-mid'],true);
});

check('Every current capstone and the occultist ultimate is stronger, costs mana and ignores saved cooldowns',()=>{
 const ids=['A99','A15','A08','M05','M15','M99','S02','S13','S12','O99'];
 for(const id of ids){const s=C.SKILLS[id];assert(s.damage>0&&s.cost>0,id);assert(!s.cooldown,id);}
 assert(C.SKILLS.S02.damage>=110);
 const {b,e}=battlefield(g,6),u=e.active;u.cooldowns={A99:b.round+2};assert.equal(e.cooldownLeft(u,'A99'),0);
});

check('Tall targets overlapping the sword sector are hit, while a wall still blocks the slash',()=>{
 const {b,e}=battlefield(g,6),u=e.active;
 Object.assign(u,{x:800,y:1700,h:100,angle:0});
 b.terrain=[{id:'floor',x:0,y:1700,w:3000,h:600,mat:'rock',hp:99999,maxHp:99999}];b.sceneVersion++;
 const t=C.makeUnit('archer',1,930,1700,{id:'tall-target',h:220,r:20,hp:1000,maxHp:1000});
 assert(C.meleeContains(e,u,t,C.SKILLS.S00.radius,0,C.meleeSpan(u,C.SKILLS.S00)));
 b.terrain.push({id:'barrier',x:860,y:1480,w:25,h:220,mat:'rock',hp:99999,maxHp:99999});b.sceneVersion++;
 assert(!C.meleeContains(e,u,t,C.SKILLS.S00.radius,0,C.meleeSpan(u,C.SKILLS.S00)));
});

check('Training field has exactly one durable elite',()=>{
 const st=g.HONRO_CONTENT.stages[0],p=C.defaults(),b=g.HonroWorld.build(st,p,true,'archer','A01',(stage,profile)=>C.createBattle(1,profile,'practice',{party:['archer']}));
 const enemies=b.units.filter(u=>u.side===1),elite=enemies.filter(u=>u.elite);
 assert.equal(enemies.length,12);assert.equal(elite.length,1);assert(elite[0].maxHp>=3000);
});

check('Delayed and event dialogue responds to actual goal state and party position',()=>{
 const {app,b,e}=battlefield(g,5),line=['설오','받이진을 세우면 고리쇠는 내가 쏘겠습니다.'];
 const entry={lines:g.HonroStoryContent.scene('entry-follow-5-0','', [line])};
 assert.equal(g.HonroStoryContent.resolveDeferred(app,entry).length,1);
 for(const t of b.terrain)if(t.honroSeal)t.broken=true;
 assert.equal(g.HonroStoryContent.resolveDeferred(app,entry).length,0);
 const {app:gateApp,b:gate}=battlefield(g,4),ev={id:'siege-0'},objective=gate.units.find(u=>u.id==='objective');
 for(const u of gate.units)if(u.side===0)u.x=objective.x+1000;
 assert.match(g.HonroStoryContent.eventLines(gateApp,ev)[0][1],/비었소/);
 const gateBrief={lines:g.HonroStoryContent.scene('entry-follow-4-0','',g.HonroObjectives.briefings[4])};
 assert.match(g.HonroStoryContent.resolveDeferred(gateApp,gateBrief)[0][1],/사이가 벌어졌소/);
 gate.units.find(u=>u.side===0).x=objective.x;
 assert.match(g.HonroStoryContent.eventLines(gateApp,ev)[0][1],/함께 지킵시다/);
 assert.match(g.HonroStoryContent.resolveDeferred(gateApp,gateBrief)[0][1],/함께 길을 지킵시다/);
});

check('Key terms are explained in context and the named goals carry camera focus',()=>{
 const stages=g.HONRO_CONTENT.stages;
 assert(stages[3].story.some(l=>l[1].includes('들림'))&&stages[3].story.some(l=>l[1].includes('몸을 빼앗')));
 assert(stages[4].story.some(l=>l[1].includes('고리쇠')&&l[2]?.focus==='seal'));
 assert(stages[4].story.some(l=>l[1].includes('받이진')&&l[2]?.focus==='interact'));
 for(const id of [3,4,5,6,7,8,9,10])assert(stages[id-1].story.some(l=>l[2]?.focus),String(id));
});
