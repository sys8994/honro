import {verifyWestFaces,westRoles} from './multi.mjs';
const UPPER='new-stage42-upper-west-palisade',EAST='new-stage42-upper-route';
const ROOT='stage-42-whole-native-blockout',KIND='honro.stage42.native-upper-west-multiface';
const PINS=Object.freeze(['a9f3200d572681ad29a0e80449f916f49565faf90d9bd8506e6d274d7eaf37e5','3d742fd6c0eee6d72225c8da52d75bac185e0cad18702de4c42d1c2bebdc8ead','7bccd505aa75875344914567f689d56a4f29f21de49ca1f98549dcca4ff6a103']);
const stable=o=>JSON.stringify(o,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const h=async x=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)))].map(a=>a.toString(16).padStart(2,'0')).join('');
const must=(b,m)=>{if(!b)throw Error(m)};
export async function westParents(maps,b,d,g,pinnedGateParents,gateOpen){
 must([b,d,g].every(x=>typeof x==='string')&&stable(await Promise.all([b,d,g].map(h)))===stable(PINS),'Wrong verified three Slate visual receipts');
 const q=await pinnedGateParents(maps,b,d),opened=gateOpen(q,g);
 must(opened.records.length===27&&opened.project.activeStageId===ROOT&&opened.project.stages.length===1&&opened.project.library.length===15,'Wrong immutable Slate native baseline');
 return {base:q.base,project:opened.project};
}
export function westProject(q,records){
 const out=verifyWestFaces(q.base,records),project=structuredClone(q.project),s=project.stages[0];
 const deck=project.library.find(a=>a.id===EAST),spot=s.elements.find(a=>a.assetId===EAST);
 must(deck&&spot&&!project.library.some(a=>a.id===UPPER)&&!s.terrains.length&&project.library.every(a=>!a.collision.length),'Wrong west fascia logical owner state');
 const a=structuredClone(deck),p=structuredClone(spot);
 a.id=UPPER;a.name='Native west upper support';a.params={nativeAuthoring:'west-upper-authored-support'};a.visual=[];
 a.vector.root={tag:'g',children:out.paths};a.vector.clips={};a.collision=[];
 p.id=UPPER+'-at';p.assetId=UPPER;p.layer='structural-back';p.opacity=1;p.order=spot.order-.125;
 project.library.push(a);s.elements.push(p);
 must(stable(project.library.slice(0,-1))===stable(q.project.library)&&stable(s.elements.slice(0,-1))===stable(q.project.stages[0].elements)&&!s.terrains.length&&stable(s.terrainBounds)===stable(q.project.stages[0].terrainBounds),'Unrelated owner or frame changed');
 return {project,metrics:out.metrics};
}
export function westSave(q,records){
 verifyWestFaces(q.base,records);
 const raw=stable({kind:KIND,version:2,baseSha256:PINS[0],detailSha256:PINS[1],gateSha256:PINS[2],records});
 must(raw.length<=6300,'West draft size exceeded');
 return raw;
}
export function westOpen(q,raw){
 must(typeof raw==='string'&&raw.length<=6300,'Wrong scoped West draft');
 const r=JSON.parse(raw);
 must(raw===stable(r)&&Object.keys(r).sort().join() ==='baseSha256,detailSha256,gateSha256,kind,records,version'&&r.kind===KIND&&r.version===2&&
  stable([r.baseSha256,r.detailSha256,r.gateSha256])===stable(PINS),'West draft source pin mismatch or noncanonical');
 return {...westProject(q,r.records),records:structuredClone(r.records)};
}
