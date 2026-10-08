// Production hurt/retry/save paths with explicit hit inputs, not normal-play evidence.
import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,P=g.HonroStakeCrossing,plain=x=>JSON.parse(JSON.stringify(x));
for(const id of [25,27]){
 const p=C.defaults();p.recruited=['archer','mage'];for(const hero of Object.values(p.heroes))hero.xp=C.xpAtLevel(16);
 const b=g.HonroWorld.build(g.HONRO_CONTENT.stages[id-1],p,false,'archer','A01');g.HonroStageRules.sanitizeStageBattle(b);
 const e=new C.Engine(b,()=>{},true),app={engine:e,profile:p};e.checkEnd=()=>false;P.attach(app,e);P.initialize(b);
 const foeId=b.units.find(u=>u.side===1).id,ownerId=b.units.find(u=>u.side===0).id;
 const foe=()=>e.b.units.find(u=>u.id===foeId),xp=()=>Object.fromEntries(Object.entries(e.b.heroes).map(([cls,h])=>[cls,h.xp]));
 const hit=()=>e.hurt(foe(),foe().maxHp*.2,ownerId,false);
 hit();hit();const earned=xp(),high=foe().xpGranted;assert(high>0);
 for(let retry=0;retry<3;retry++){
  assert(P.retry(app,'XP regression'));
  assert.equal(foe().xpGranted,high,'Retry keeps reward high-water');
  hit();assert.equal(foe().xpGranted,high,'First repeated hit never lowers granted XP');assert.deepEqual(xp(),earned);
  hit();assert.equal(foe().xpGranted,high);assert.deepEqual(xp(),earned,'Repeated damage earns no duplicate shared XP');
 }
 hit();assert(foe().xpGranted>high,'Fresh damage beyond the previous high-water still earns XP');
 const increment=foe().xpGranted-high;for(const cls of p.recruited)assert.equal(xp()[cls]-earned[cls],increment,'Shared XP receives only the newly earned difference');
 const saved=plain(e.b);e.b=plain(saved);P.retry(app,'Saved high-water');hit();hit();assert.deepEqual(xp(),Object.fromEntries(Object.entries(saved.heroes).map(([cls,h])=>[cls,h.xp])),'Serialized high-water survives another retry');
 console.log('PASS',id,'actual hurt → checkpoint retry ×3 → fresh damage → serialized retry XP ledger');
}
