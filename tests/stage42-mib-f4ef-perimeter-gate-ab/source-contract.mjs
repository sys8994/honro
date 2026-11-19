import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';import path from 'node:path';import {pathToFileURL} from 'node:url';
const [mode,root,base,out,arm='A']=process.argv.slice(2),here=import.meta.dirname;
const bytes=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const {makeAct5}=await import(pathToFileURL(path.join(root,'shared/act5-world.mjs')));
const p=await makeAct5(),stage=p.stages.find(s=>s.metadata.stageId===42);
assert.ok(stage,'Stage42 must exist in the stock generator');
const s=JSON.parse(JSON.stringify(stage)),expectedWire=structuredClone(stage);
if(mode==='baseline'){
 const sites=expectedWire.design.act5.sites;
 assert.ok(Object.hasOwn(sites,'roots'),'Known stock raw roots placeholder is absent');
 assert.equal(sites.roots,undefined,'A real roots site must never be discarded');
 delete sites.roots;
}
assert.deepEqual(s,expectedWire,'Wire normalization may remove only the known undefined Stage42 stock roots placeholder');
const d=s.design.act5,rows=[];
const row=(kind,id,p)=>rows.push({kind,id,x:p.x,y:p.y});
for(const u of s.units)row('unit',u.id,u);
for(const [id,v] of Object.entries(d.sites))row('site',id,v);
for(const [id,v] of Object.entries(s.anchors))row('anchor',id,v);
for(const w of d.waves)for(const k of ['entry','fallback'])row('wave',w.id+'.'+k,w[k]);
const dev=s.terrains.find(t=>t.id==='a5-device-0');
const mid=(dev.points[2].x+dev.points[3].x)/2,foot=dev.points[2].y;row('device',dev.id,{x:mid,y:foot});
const canonicalDevice={...dev,points:dev.points.map(q=>({x:+(q.x-mid).toFixed(6),y:+(q.y-foot).toFixed(6)}))};
assert.equal(rows.length,46);assert.equal(s.units.length,33);assert.equal(s.id,'stage-42');assert.equal(s.metadata.campaign,true);
const lookup=u=>({id:u.id,x:u.x,y:u.y,team:u.team,kind:u.kind,group:u.encounterGroup,reserve:!!u.stageOverrides?.honroAct5Reserve});
const projection=(a)=>{delete a.y;return a;};
const stable=structuredClone(s);
for(const k of ['height','terrainBounds','playBounds','terrains','elements'])delete stable[k];
delete stable.environment.zones.find(z=>z.id==='a5-depth').to;
for(const u of stable.units)projection(u);
for(const q of Object.values(stable.design.act5.sites))projection(q);
for(const q of Object.values(stable.anchors))projection(q);
for(const w of stable.design.act5.waves)for(const k of ['entry','fallback'])projection(w[k]);
const links=stable.design.act5.links,markers=stable.markers;
delete stable.design.act5.links;delete stable.markers;
const content=structuredClone(p.content.find(c=>c.id===42));delete content.h;
const packet=JSON.parse(fs.readFileSync(path.join(here,arm==='A'?'old-packet.json':'gate-packet.json')));
const other=bytes({stages:p.stages.filter(z=>z!==stage),content:p.content.filter(x=>x.id!==42),library:p.library.filter(z=>!packet.assets.some(a=>a.id===z.id))});
const exact={stable:bytes(stable),content:bytes(content),other,canonicalDevice,rows,links,markers};
if(mode==='baseline'){fs.writeFileSync(base,JSON.stringify(exact));console.log('Independent master snapshot captured');}
else{
 assert.equal(mode,'candidate');const prior=JSON.parse(fs.readFileSync(base));
 const input=JSON.parse(fs.readFileSync(path.join(here,'official-qa-stage.json'))),approved=input.stage??input;
 assert.deepEqual(s,packet.stage,'Exact combined arm mismatch');
 assert.deepEqual({...s,elements:[],terrainBounds:approved.terrainBounds},approved,'Pinned f4ef nonvisual source drift');
 assert.deepEqual(s.elements,packet.stage.elements);
 assert.deepEqual(p.library.filter(z=>packet.assets.some(a=>a.id===z.id)),packet.assets);
 for(const k of ['stable','content','other','canonicalDevice'])assert.deepEqual(exact[k],prior[k],k);
 for(let i=0;i<rows.length;i++)assert.deepEqual([rows[i].kind,rows[i].id,rows[i].x],[prior.rows[i].kind,prior.rows[i].id,prior.rows[i].x]);
 assert.deepEqual(links.map(m=>[m.id,m.label,m.x,m.to.x]),prior.links.map(m=>[m.id,m.label,m.x,m.to.x]),'Stock link identity/X changes require explicit review');
 assert.deepEqual(markers.map(m=>[m.id,m.label,m.x,m.action]),prior.markers.map(m=>[m.id,m.label,m.x,m.action]),'Native marker identity/X');
 assert.equal(s.environment.zones.find(z=>z.id==='a5-depth').to,s.height);
 assert.deepEqual(d.flow,approved.design.act5.flow);
 assert.deepEqual(s.terrains.map(x=>x.id),approved.terrains.map(x=>x.id));
 const bindings=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'))).bindings;
 assert.equal(bindings.length,46);
 const prefix={unit:'units',site:'design.act5.sites',anchor:'anchors',wave:'design.act5.waves',device:'terrains'};
 for(const q of rows){
  const chosen=bindings.find(b=>b.id===q.id&&b.x===q.x&&b.path.startsWith(prefix[q.kind]));
  assert.ok(chosen,'Missing explicit source owner '+JSON.stringify(q));
  assert.ok(Math.abs(chosen.y-q.y)<1e-7,'Candidate Y no longer matches named support '+q.id);
 }
 const context={HonroGeometry:{oneWay:t=>!!t.oneWay}};vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'shared/map/terrain-domain.js'),'utf8'),context);
 assert.deepEqual(JSON.parse(JSON.stringify(context.HonroTerrainDomain.validate(s))),[]);
 const owners=new Map(s.terrains.map(t=>[t.id,context.HonroTerrainDomain.projection(t).points]));
 for(const q of bindings){
  const ring=owners.get(q.owner);assert.ok(ring,q.owner);
  const ys=[];for(let i=0;i<ring.length;i++){
   const a=ring[i],b=ring[(i+1)%ring.length];if(b.x<=a.x||q.x<a.x-1e-7||q.x>b.x+1e-7)continue;
   ys.push(a.y+(q.x-a.x)*(b.y-a.y)/(b.x-a.x));
  }
  assert.ok(ys.some(y=>Math.abs(y-q.supportY)<1e-6),'Stock projection lost named surface '+q.path);
 }
 const report={classification:'actual generated isolated source comparison only',checks:46,othersUnchanged:true,
  exactRosterAndCampaignDesign:true,device:canonicalDevice,terrain:s.terrains.map(a=>({id:a.id,points:a.points.length})),
  units:s.units.map(lookup),placements:rows,bindings,links,markers};
 fs.writeFileSync(out,JSON.stringify(report));console.log('Exact independent 46 source placement Xs, restored Y, source logic/device and all non42 records');
}
