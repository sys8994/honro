import {reopenFullDetails} from './pack-detail.mjs';
import {composeRouteCompile} from './gate.mjs';
const basePin='a9f3200d572681ad29a0e80449f916f49565faf90d9bd8506e6d274d7eaf37e5';
const detailPin='6e8844f010bde9906b93b5f4bc30b25700dba297ec03891e43cb05c62f027ade';
const KIND='honro.stage42.native-composed-gate-route';
const ID='stage42-native-gate-open-prop';
const canon=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const sha=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(q=>q.toString(16).padStart(2,'0')).join('');
const need=(x,msg)=>{if(!x)throw Error(msg)};
export async function pinnedGateParents(maps,b,d){
 need(typeof b==='string'&&typeof d==='string'&&await sha(b)===basePin&&await sha(d)===detailPin,'Exact full width and detail drafts required');
 return reopenFullDetails(maps,b,d);
}
export function gateProject(q,records){
 const paths=composeRouteCompile(q.base,q.details,records),project=structuredClone(q.project),s=project.stages[0];
 need(project.stages.length===1&&s.terrains.length===0&&project.library.every(a=>a.collision.length===0)&&!project.library.some(a=>a.id===ID),'Wrong original visual-only scene');
 const li=project.library.find(a=>a.id==='new-stage42-joined-lower'),index=s.elements.findIndex(e=>e.assetId===li?.id);
 need(index>=0,'Native lower parent placement missing');
 const ids=[ID,'new-stage42-upper-deck-taper','new-stage42-reversible-palisade-ladder'];
 const deck=s.elements.find(a=>a.assetId==='new-stage42-upper-route');
 need(deck&&!q.project.library.some(a=>ids.includes(a.id)),'Native deck placement or immutable parents missing');
 for(const [i,slice] of [paths.slice(0,11),paths.slice(11,12),paths.slice(12)].entries()){
  const a=structuredClone(li),p=structuredClone(s.elements.find(x=>x.assetId===li.id));
  a.id=ids[i];a.name=ids[i];a.vector.root={tag:'g',children:slice};a.params={nativeAuthoring:ids[i]};
  p.id=ids[i]+'-at';p.assetId=ids[i];p.order=i===0?p.order-.5:i===1?Math.min(p.order,deck.order)-.25:Math.min(p.order,deck.order)-.75;
  project.library.push(a);s.elements.push(p);
 }
 need(JSON.stringify(project.library.slice(0,-3))===JSON.stringify(q.project.library)&&JSON.stringify(s.elements.filter(e=>!ids.includes(e.assetId)))===JSON.stringify(q.project.stages[0].elements),'Composition changed untargeted native owners');
 return project;
}
export function gateSave(q,records){
 composeRouteCompile(q.base,q.details,records);
 return canon({kind:KIND,version:1,baseSha256:basePin,detailsSha256:detailPin,records});
}
export function gateOpen(q,raw){
 need(typeof raw==='string'&&raw.length<=8500,'Wrong bounded Gate draft');
 const v=JSON.parse(raw);
 need(v&&v.kind===KIND&&v.version===1&&v.baseSha256===basePin&&v.detailsSha256===detailPin&&Object.keys(v).sort().join()==='baseSha256,detailsSha256,kind,records,version'&&raw===canon(v),'Wrong canonical Gate scope or parent');
 return {records:structuredClone(v.records),project:gateProject(q,v.records)};
}
