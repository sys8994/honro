/** Isolated projectile/route probes. These are not normal combat completion. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {isolatedHero,traverse} from './act1-spatial-test-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,out={scope:'Isolated real Engine trajectories and ordinary-body probes; no normal play claim',shots:[],routes:[]};
const fresh=()=>{const q=battlefield(g,5);q.b.units=q.b.units.filter(u=>u.side===0);q.e.checkEnd=()=>false;return q;};
function shot(skill,angle,power,open){const{b,e,events}=fresh(),u=e.heroesAlive().find(u=>u.cls==='archer'),t=b.terrain.find(t=>t.id==='cliff-cleat'),veil=b.terrain.find(t=>t.id==='waterfall-veil');Object.assign(u,b.honroMapAnchors.shotGap,{vx:0,vy:0});b.active=u.id;u.loadout=[skill];u.ranks[skill]=1;u.focus=u.maxFocus=999;veil.broken=open;b.sceneVersion++;const prediction=e.predict(u,C.SKILLS[skill],angle,power,undefined,false,false),before=t.hp;assert(e.fire(skill,angle,power));for(let i=0;i<3000&&b.projectiles.length;i++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);return{skill,angle,power,open,predicted:prediction.terrain,damage:before-t.hp,waterSplash:events.some(v=>v.color==='#c8e1d9'||v.color==='#9fcbd0'),remaining:b.projectiles.length,events};}
for(const [a,p]of [[10,.8],[35,.5]]){const closed=shot('A01',a,p,false),opened=shot('A01',a,p,true);assert.equal(closed.predicted,'waterfall-veil');assert.equal(closed.damage,0);assert(opened.damage>0,JSON.stringify(opened));assert.equal(opened.predicted,'cliff-cleat');assert(closed.waterSplash,'Live water impact emits visible splash');assert.equal(closed.remaining,0);out.shots.push({...closed,events:undefined},{...opened,events:undefined});}
{
 const{b,e}=fresh(),t=b.terrain.find(t=>t.id==='cliff-cleat'),u=e.heroesAlive()[0],hp=t.hp;e.blast(2800,2330,900,100,u.id);assert.equal(t.hp,hp,'Closed waterfall occludes blast pressure');e.blast(3260,2310,100,50,u.id);assert(t.hp<hp,'An exposed burst inside the cave is not arbitrarily immune');out.blast={outsideBlocked:true,insideDamage:hp-t.hp};
}
{
 const{b,e}=fresh(),t=b.terrain.find(t=>t.id==='cliff-cleat');let direct=0;for(const x of [1800,2200,2400,2700])for(const angle of [0,10,20,35,50,65,80])for(const power of [.4,.6,.8,1]){const u=e.heroesAlive()[0];u.x=x;u.y=C.topAt(b.terrain.find(t=>t.id=== (x<2600?'archer-step':'waterfall-high-rib')),x);if(!Number.isFinite(u.y))continue;const hit=e.predict(u,C.SKILLS.A01,angle,power,undefined,false,true);if(hit.terrain===t.id)direct++;}assert.equal(direct,0,'No direct outside line enters the closed cave');out.closedAimSweep={trials:448,targetHits:direct};
}
for(const cls of ['archer','mage','knight','occultist']){const q=isolatedHero(g,5,cls),a=q.b.honroMapAnchors,route=[a.receiver,{x:1800,y:2861.1111111111113},{x:2100,y:2636.1111111111113},a.shotGap,{x:2700,y:2475.8823529411766},a.shotGap,a.receiver];const r=traverse(g,q.b,q.e,q.u,route);out.routes.push({cls,...r});console.log(cls,r.passed,r.failed);}
await mkdir('_local/reports/stage5-waterfall',{recursive:true});await writeFile('_local/reports/stage5-waterfall/physics-probes.json',JSON.stringify(out,null,2));assert(out.routes.every(r=>r.passed),'All four body routes must pass');console.log(JSON.stringify(out,null,2));
