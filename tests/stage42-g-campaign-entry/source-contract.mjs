// Test-only snapshot/check. No product mutation; no rendered art or dialogue export.
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const [mode,root,baseline,out]=process.argv.slice(2),here=path.dirname(new URL(import.meta.url).pathname);
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const {makeAct5}=await import(pathToFileURL(path.join(root,'shared/act5-world.mjs')));
const p=await makeAct5(),s=p.stages.find(s=>s.metadata.stageId===42),d=s.design.act5;
const rows=[];const add=(kind,id,x,y)=>rows.push({kind,id,x,y});
for(const u of s.units)add('unit',u.id,u.x,u.y);
for(const [id,q]of Object.entries(d.sites))add('site',id,q.x,q.y);
for(const [id,q]of Object.entries(s.anchors))add('anchor',id,q.x,q.y);
for(const w of d.waves)for(const k of ['entry','fallback'])add('wave',w.id+'.'+k,w[k].x,w[k].y);
const device=s.terrains.find(t=>t.id==='a5-device-0');add('device',device.id,(device.points[2].x+device.points[3].x)/2,device.points[2].y);
assert.equal(rows.length,46);assert.equal(s.units.length,33);
const stable=structuredClone(s);delete stable.height;delete stable.terrainBounds;delete stable.playBounds;delete stable.terrains;delete stable.elements;delete stable.environment.zones.find(z=>z.id==='a5-depth').to;
stable.markers=stable.markers.filter(m=>!['a5-cross-0','a5-cross-1'].includes(m.id));stable.design.act5.links=stable.design.act5.links.filter(m=>!['a5-cross-0','a5-cross-1'].includes(m.id));
for(const u of stable.units)delete u.y;
for(const q of Object.values(stable.design.act5.sites))delete q.y;
for(const q of Object.values(stable.anchors))delete q.y;
for(const w of stable.design.act5.waves)for(const k of ['entry','fallback'])delete w[k].y;
const content=structuredClone(p.content.find(c=>c.id===42));delete content.h;
const snapshot={rows,stable:digest(stable),content:digest(content),others:digest({stages:p.stages.filter(x=>x!==s),content:p.content.filter(x=>x.id!==42),library:p.library.filter(x=>x.id!=='act5:near:42')}),device:{...device,points:device.points.map(q=>({x:Math.round((q.x-rows.at(-1).x)*1e6)/1e6,y:Math.round((q.y-rows.at(-1).y)*1e6)/1e6}))}};
if(mode==='baseline'){fs.writeFileSync(baseline,JSON.stringify(snapshot));console.log('Official baseline hashed;46 placement records captured');}
else{
 assert.equal(mode,'candidate');const b=JSON.parse(fs.readFileSync(baseline)),g=JSON.parse(fs.readFileSync(path.join(here,'g-domain.json'))),top=g.original.slice(0,-2);
 const sy=x=>{for(let i=1;i<top.length;i++){const a=top[i-1],z=top[i];if(x>=a.x&&x<=z.x&&z.x>a.x)return Math.round((a.y+(x-a.x)*(z.y-a.y)/(z.x-a.x))*100)/100;}throw Error('no G support '+x);};
 assert.equal(snapshot.stable,b.stable);assert.equal(snapshot.content,b.content);assert.equal(snapshot.others,b.others);assert.deepEqual(snapshot.device,b.device);
 const errors=rows.map((q,i)=>{const a=b.rows[i];assert.deepEqual([q.kind,q.id,q.x],[a.kind,a.id,a.x]);const lift={'a5-foe-8':56*6500/1024,'a5-foe-12':33*6500/1024}[q.id]||0,expected=sy(q.x)-lift;assert.ok(Math.abs(q.y-expected)<1e-7,q.id);return {...q,oldY:a.y,expectedY:expected};});
 assert.equal(s.terrains.length,2);assert.equal(s.terrains[0].id,'stage42-g-engineering-ground');assert.deepEqual(s.terrains[0].points,g.world);assert.deepEqual(s.terrains[0].playProjection,{bounds:g.play,start:g.original[0]});assert.deepEqual(s.playBounds,g.play);assert.deepEqual(s.terrainBounds,g.terrain);assert.equal(s.environment.zones.find(z=>z.id==='a5-depth').to,s.height);assert.equal(s.elements.length,0);assert.equal(d.links.length,0);assert.equal(s.markers.length,0);
 fs.writeFileSync(out,JSON.stringify({classification:'G source-only invariants; not runtime/play/bridge visual proof',checks:46,othersUnchanged:true,gameplayRolesUnchanged:true,placements:errors}));console.log('G 46 source contacts, exact roles and non42 invariants PASS');
}
