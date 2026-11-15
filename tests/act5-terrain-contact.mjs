import assert from 'node:assert/strict';
import {terrain} from '../shared/data/act5/terrain.mjs';
import {makeAct5} from '../shared/act5-world.mjs';
const {stages}=await makeAct5();
const lower=terrain[0].lines.find(([id])=>id==='lower-road')[1];
function yAt(points,x){for(let i=1;i<points.length;i++){const[a,b]=[points[i-1],points[i]];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}}
// The lower camp tent's roof (326) is decorative. Its walkable stone
// terrace is 359 on the 1024-wide source, not the upper tent silhouette.
for(const x of [152,180,220,240,279]) assert.equal(yAt(lower,x),359);
assert.equal(yAt(lower,695),378);
assert.equal(yAt(lower,755),327);
assert.equal(yAt(lower,799),327);
assert.equal(yAt(lower,857),279);
assert.equal(stages.length,10);
for(const s of stages){
 const controls=s.terrains.filter(t=>t.control).map(t=>t.control.map(p=>[p.x,p.y]));
 const onSurface=p=>controls.some(c=>{const y=yAt(c,p.x);return Number.isFinite(y)&&Math.abs(y-p.y)<.02;});
 assert(onSurface(s.anchors.spawn),`${s.id} spawn`);
 assert(onSurface(s.anchors.exit),`${s.id} exit`);
 for(const m of s.markers)assert(onSurface(m),`${s.id} marker ${m.id}`);
 for(const l of s.design.act5.links)assert(onSurface(l.to),`${s.id} crossing target`);
}
console.log('PASS: Act 5 camp stone contact and 10-stage spawn/exit/interaction/link registration');
