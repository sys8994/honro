import {reopenFullDetails} from './pack-detail.mjs';
import {gateCompile} from './gate.mjs';
const basePin='6adcdaaac1d3e85b0a837680e9263ca9a72909fef96f872b9d6b85beedf580a3';
const detailPin='f88f26fd857fddd55f700de35f761185b1864c0499cb97effba1b1223d15387e';
const KIND='honro.stage42.native-gate';
const ID='stage42-native-gate-open-prop';
const canon=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const sha=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(q=>q.toString(16).padStart(2,'0')).join('');
const need=(x,msg)=>{if(!x)throw Error(msg)};
export async function pinnedGateParents(maps,b,d){
 need(typeof b==='string'&&typeof d==='string'&&await sha(b)===basePin&&await sha(d)===detailPin,'Exact full width and detail drafts required');
 return reopenFullDetails(maps,b,d);
}
export function gateProject(q,records){
 const paths=gateCompile(q.base,q.details,records),project=structuredClone(q.project),s=project.stages[0];
 need(project.stages.length===1&&s.terrains.length===0&&project.library.every(a=>a.collision.length===0)&&!project.library.some(a=>a.id===ID),'Wrong original visual-only scene');
 const li=project.library.find(a=>a.id==='new-stage42-joined-lower'),index=s.elements.findIndex(e=>e.assetId===li?.id);
 need(index>=0,'Native lower parent placement missing');
 const a=structuredClone(li),p=structuredClone(s.elements[index]);a.id=ID;a.name='native open gate';a.vector.root={tag:'g',children:paths};a.params={nativeAuthoring:'separate-open-gate'};
 p.id=ID+'-at';p.assetId=ID;p.order-=0.5;project.library.push(a);s.elements.splice(index,0,p);
 need(JSON.stringify(project.library.slice(0,-1))===JSON.stringify(q.project.library)&&JSON.stringify(s.elements.filter(e=>e.assetId!==ID))===JSON.stringify(q.project.stages[0].elements),'Gate changed untargeted original native owners');
 return project;
}
export function gateSave(q,records){
 gateCompile(q.base,q.details,records);
 return canon({kind:KIND,version:1,baseSha256:basePin,detailsSha256:detailPin,records});
}
export function gateOpen(q,raw){
 need(typeof raw==='string'&&raw.length<=4800,'Wrong bounded Gate draft');
 const v=JSON.parse(raw);
 need(v&&v.kind===KIND&&v.version===1&&v.baseSha256===basePin&&v.detailsSha256===detailPin&&Object.keys(v).sort().join()==='baseSha256,detailsSha256,kind,records,version'&&raw===canon(v),'Wrong canonical Gate scope or parent');
 return {records:structuredClone(v.records),project:gateProject(q,v.records)};
}
