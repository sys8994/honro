import {stage18Events,verify18Author} from './stage18-native.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const digest=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const json=(root,p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const masks=new Set([8,10,12,17,18,20,21,25,26,28,39,41,42,44,50]);
const changed=new Set((process.env.HONRO_INTENDED??'').split(',').filter(Boolean).map(Number));
for (const n of changed) assert(masks.has(n), 'Declared write outside P1-2: '+n);
function summarize(root){
 const manifest=json(root,'web/manifest.json'), project=json(root,manifest.project), rows={};
 assert.equal(project.stages.length,50);
 for(let i=1;i<=50;i++){
  const file=project.stages[i-1], st=json(root,file);
  assert.equal(st.metadata.stageId,i);
  const terrainFields=['width','height','terrainDomainVersion','playBounds','terrainBounds','terrains','materials','elements','environment','anchors','layers','markers'];
  const events18=i===18&&st.events.some(v=>v.id==='18.rescue-response')?stage18Events(st.events):null;
  const lock={terrain:digest(terrainFields.map(k=>st[k])),friendly:digest(st.units.filter(u=>u.team!=='enemy'&&u.side!==1)),events:digest(events18?.normalized??st.events),objectives:digest(st.objectives)};
  const foes=st.units.filter(u=>u.team==='enemy'||u.side===1);
  let act5=st.design?.act5??null;
  let ids=foes.map(u=>u.id).sort();
  const refs=act5?{required:act5.required,waves:(act5.waves??[]).map(w=>({key:w.key,when:w.when,id:w.id,units:w.units})),sites:act5.sites,exitParty:act5.exitParty,flow:act5.flow}:null;
  rows[i]={file,whole:digest(st),lock,events18,ids,foes:digest(foes),refs:digest(refs)};
 }
 return {rows,project:manifest.project,entry:manifest.gameEntry};
}
if(process.argv[2]==='capture'){
 const s=summarize(process.argv[3]);fs.writeFileSync(process.argv[4],JSON.stringify(s,null,2));
}else{
 const a=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),b=summarize(process.argv[3]??'.');
 for(let i=1;i<=50;i++){
  if(!masks.has(i)){assert.equal(b.rows[i].whole,a.rows[i].whole,'Unowned active authored stage drift '+i); continue;}
  assert.deepEqual(b.rows[i].lock,a.rows[i].lock,'Protected art/collision/allies/objects or goals drift '+i);
  assert.deepEqual(b.rows[i].ids,a.rows[i].ids,'Stable hostile/objective identity drift '+i);
  assert.equal(b.rows[i].refs,a.rows[i].refs,'Act5 required IDs/phase/site/flow changed '+i);
  if(i===18&&changed.has(i)&&(a.rows[i].events18||b.rows[i].events18)){assert(a.rows[i].events18&&b.rows[i].events18,'Stage18 raw event provider switched');verify18Author(a.rows[i].events18,b.rows[i].events18);}
  if(!changed.has(i))assert.equal(b.rows[i].whole,a.rows[i].whole,'Review-only stage unexpectedly changed '+i);
 }
 console.log('PASS 50 stage bindings and scoped raw authored parity; art/collision/friendly/objective/mandatory wave identities preserved');
 console.log(b.project,b.entry);
}
