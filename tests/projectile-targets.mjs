// Objective-target audit and actual top-hit arrows; not normal campaign clears.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
for(let id=1;id<=30;id++){
 const {b}=battlefield(g,id),steps=g.HONRO_CONTENT.stages[id-1].steps||[],destroyIds=steps.filter(s=>s.kind==='destroy').map(s=>s.id),targets=b.terrain.filter(t=>t.honroSeal||t.device||destroyIds.includes(t.id));
 for(const target of targets){
  const special=id===8&&['bier-knot-0','bier-knot-1'].includes(target.id);
  assert.equal(!!target.oneWay,special,`${id}/${target.id}: unexpected one-way objective target`);
  const top=C.topAt(target,target.x+target.w/2),covers=b.terrain.filter(t=>t!==target&&!t.broken&&!t.oneWay&&C.terrainContains(t,target.x+target.w/2,top-.1)).map(t=>t.id);
  rows.push({stage:id,id:target.id,oneWay:!!target.oneWay,covers,role:destroyIds.includes(target.id)?steps.find(s=>s.id===target.id).label:id===5?'절벽 틈의 고리쇠':id===8?'상여 결박':'파괴 장치'});
 }
}
assert.equal(rows.length,18,'All 30 chapter target inventory stays explicit');
assert.deepEqual(rows.filter(t=>t.oneWay).map(t=>t.id),['bier-knot-0','bier-knot-1']);
assert(rows.find(t=>t.id==='cliff-cleat').covers.includes('waterfall-roof'),'The ring top is buried in real cave rock; it must stay solid');
const before=JSON.parse(await readFile('tests/fixtures/projectile-target-solids.json','utf8')),current=g.HONRO_PROJECT.stages[4].terrains.find(t=>t.id==='cliff-cleat');
assert.deepEqual(JSON.parse(JSON.stringify({...current,oneWay:true})),before.target,'Exactly one canonical flag changed, with all art/shape/HP preserved');
const shots=[];
for(const id of ['bier-knot-0','bier-knot-1']){
 const {b,e}=battlefield(g,8),u=e.heroesAlive().find(u=>u.cls==='archer'),target=b.terrain.find(t=>t.id===id),x=target.x-240,support=e.surface(x,target.y,target.y+600);
 assert(support);Object.assign(u,{x,y:support.y,focus:10000,maxFocus:10000,acted:false,cooldowns:{}});b.units=[u];b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;assert(e.grounded(u));
 const proxy={...u,id:'top-aim-proxy',side:1,x:target.x+target.w/2,y:target.y,h:0,r:8},skill=C.SKILLS.A01;
 let aim=null;for(const seed of e.shotSeeds(u,skill,proxy))if(e.predict(u,skill,seed.angle,seed.power,undefined,false,true).terrain===id){aim=seed;break;}
 if(!aim)for(const power of [.2,.35,.5,.65,.8,1]){for(let angle=20;angle<=85;angle++)if(e.predict(u,skill,angle,power,undefined,false,true).terrain===id){aim={angle,power};break;}if(aim)break;}
 assert(aim,id+' must be reachable from ordinary ground under the new shared policy');
 const hp=target.hp,hits=[],impact=e.impact.bind(e);e.impact=(p,h)=>{hits.push({id:h.terrain?.id,normal:h.n});impact(p,h);};assert(e.fire('A01',aim.angle,aim.power));
 for(let i=0;i<1800&&b.projectiles.length;i++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
 assert(target.hp<hp);assert.equal(hits[0].id,id);assert(hits[0].normal.y<0);shots.push({stage:8,id,from:{x:u.x,y:u.y},aim,damage:hp-target.hp,hit:hits[0]});
}
await mkdir('_local/reports/projectile-platforms',{recursive:true});await writeFile('_local/reports/projectile-platforms/objective-targets.json',JSON.stringify({scope:'All thirty chapters, 18 explicit destruction devices. Stage 5 live ritual/shot/Continue is checked by waterfall-destruction; Act 2 and Act 3 actual target flights by their existing spatial/production-shot tests. Stage 8 one-way targets retain reachable upper surfaces.',rows,shots},null,2)+'\n');
console.log(`PASS 30-chapter / ${rows.length}-target collision-role audit and two live upper-face knot hits`);
