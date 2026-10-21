/** Bounded normal defend inputs from freshly replayed R2 ritual checkpoints.
 * No actor, HP, move, target, enemy, or damage writes. Not another full playthrough. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,source=JSON.parse(await readFile('_local/reports/stage5-refinement/ritual-checkpoints.json','utf8'));
const out='_local/reports/integration-20261021/stage5-contact';await mkdir(out,{recursive:true});const cases=[];
for(const q of source.ritual){
 let now=0;g.performance={now:()=>now};const profile=plain(q.profile);profile.honroBattle=plain(q.battle);profile.lastStage=5;
 const a=h.load(profile);a.continue();h.finish(a);const e=a.engine,b=e.b;a.scene.render=()=>{};a.prev=0;
 const initial=plain(b),fires=[],hits=[],samples=[],actions=[],contact=[];let frames=0,maxQueue=0,beastProjectileMax=0;
 const kinds=new Set(['hound','boar','stag']),beast=u=>kinds.has(u.honroVariant);
 const fire=e.fire.bind(e);e.fire=(...args)=>{const actor=e.active;const r=fire(...args);fires.push({frame:frames,round:b.round,actor:actor?.id,kind:actor?.honroVariant,skill:args[0],accepted:r});return r;};
 const hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const before=u.hp,r=hurt(u,...args);if(before>u.hp)hits.push({frame:frames,round:b.round,target:u.id,owner:args[1],loss:before-u.hp});return r;};
 function tick(){now+=1000/60;a.frame(now);frames++;assert(!a.lastError,a.lastError);maxQueue=Math.max(maxQueue,b.queue.length);assert(b.side!==1||b.queue.length<=4);
  const count=b.projectiles.filter(p=>beast(e.unit(p.owner)||{})).length;beastProjectileMax=Math.max(beastProjectileMax,count);assert.equal(count,0,'ordinary beasts never instantiate projectiles');
  for(const u of b.units)if(u.beastAction)contact.push({frame:frames,round:b.round,id:u.id,x:u.x,y:u.y,moveLeft:u.moveLeft,...plain(u.beastAction)});
  if(frames%8===0){const mage=e.unit('p-mage');samples.push({frame:frames,round:b.round,phase:b.phase,mage:{x:mage.x,y:mage.y,hp:mage.hp,shield:mage.shield},beasts:e.alive(1).filter(beast).map(u=>({id:u.id,kind:u.honroVariant,x:u.x,y:u.y,moveLeft:u.moveLeft,intent:u.intent,grounded:e.grounded(u),gap:Math.abs(u.x-mage.x)-u.r-mage.r,dy:u.y-mage.y}))});}
 }
 function ready(){for(let n=0;n<16000;n++){if(a.dialogue)g.HonroStory.finish(a);if(a.canInput()||['won','lost'].includes(b.phase))return;tick();}throw Error('bounded checkpoint input timeout');}
 ready();for(let n=0;n<6&&!['won','lost'].includes(b.phase);n++){const actor=e.active;actions.push({op:'normal-defend',round:b.round,actor:actor.id,hp:actor.hp});a.defend();ready();}
 assert(b.honroState.ritual?.active,'staying at either authored ritual station retains ritual');
 const final=plain(b);cases.push({goal:q.goal,method:'Actual production App frame, Continue, normal defend only; normal R2 checkpoint; native DOM/render/storage/clock doubles.',initial,final,actions,frames,maxQueue,beastProjectileMax,fires,hits,contact,samples});
 console.log('PASS ritual',q.goal,'round',b.round,'cap',maxQueue,'beast casts',fires.filter(v=>v.accepted&&kinds.has(v.kind)).map(v=>[v.actor,v.skill]),'damage',hits.filter(v=>v.target.startsWith('p-')));
}
await writeFile(out+'/trace.json',JSON.stringify({cases},null,2));
