import {compileDetailShapes} from './detail.mjs';
import {reopenFullWorkshop,exportFullWorkshop,fullWorkshopProject} from '../stage42-full-native-workshop-local/workshop.mjs';
const basePin='6adcdaaac1d3e85b0a837680e9263ca9a72909fef96f872b9d6b85beedf580a3';
const KIND='honro.stage42.native-whole-detail';
const canon=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const sha=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(q=>q.toString(16).padStart(2,'0')).join('');
const must=(b,m)=>{if(!b)throw Error(m)};
export async function verifiedWholeBase(maps,raw){
 must(typeof raw==='string'&&await sha(raw)===basePin,'Exact real saved full-width baseline differs');
 const q=reopenFullWorkshop(maps,raw);
 must(exportFullWorkshop(q.design)===raw,'Wrong canonical whole native baseline');
 return q;
}
export function buildFullDetails(maps,base,details,{complete=true}={}){
 const q=compileDetailShapes(base,details,{complete}),project=fullWorkshopProject(maps,base),stage=project.stages[0];
 const edited=structuredClone(project),s=edited.stages[0],append=[];
 for(const v of q){
  const id=(v.owner.startsWith('lower-')||v.owner==='gate-seat')?'new-stage42-joined-lower':'new-stage42-'+v.owner;
  if(v.order==='after'){
   const a=edited.library.find(x=>x.id===id);must(a,'Detail parent owner missing');
   a.vector.root.children.push(v.path);
  }else{
   const id='new-stage42-brace-'+v.path.id, a=structuredClone(edited.library[0]),e=structuredClone(s.elements[0]);
   a.id=id;a.name=v.role;a.vector.root={tag:'g',children:[v.path]};
   e.id=id+'-at';e.assetId=id;e.layer='structural-back';e.order=-1;
   edited.library.push(a);append.push(e);
  }
 }
 s.elements.unshift(...append);
 const basePathsPreserved=project.library.every((a,i)=>JSON.stringify(a.vector.root.children)===JSON.stringify(edited.library[i].vector.root.children.slice(0,a.vector.root.children.length)));
 must(basePathsPreserved&&!s.terrains.length&&JSON.stringify(stage.terrainBounds)===JSON.stringify(s.terrainBounds)&&edited.library.every(a=>!a.collision.length),'Full detail changed structural base, bounds or collision');
 return {project:edited,details:q.length};
}
export async function exportFullDetails(maps,raw,details){
 const q=await verifiedWholeBase(maps,raw);
 compileDetailShapes(q.design,details);
 const x=canon({kind:KIND,version:1,baseSha256:basePin,details});
 must(new TextEncoder().encode(x).length<=28000,'Detail receipt exceeds bounds');
 return x;
}
export async function reopenFullDetails(maps,raw,receipt){
 must(typeof receipt==='string'&&new TextEncoder().encode(receipt).length<=28000,'Invalid detail receipt bytes');
 const d=JSON.parse(receipt),b=await verifiedWholeBase(maps,raw);
 must(receipt===canon(d)&&Object.keys(d).sort().join(',')==='baseSha256,details,kind,version'&&d.kind===KIND&&d.version===1&&d.baseSha256===basePin,'Wrong scope/version/canonical full detail receipt');
 return {base:b.design,details:structuredClone(d.details),...buildFullDetails(maps,b.design,d.details)};
}
