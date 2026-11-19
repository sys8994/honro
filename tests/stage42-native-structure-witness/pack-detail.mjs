import {compileDetailShapes} from './detail.mjs';
import {buildWorkshopStructure,exportStructure} from '../stage42-native-structure-local/workshop.mjs';
const type='honro.stage42.structure-details-v1',pin='bc6fc37239d6ec62d380588418727098f3066429478e794742225f75f350ec21';
const canon=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(n=>n.toString(16).padStart(2,'0')).join('');
const need=(v,e)=>{if(!v)throw Error(e)};
export async function verifyStructureBaseline(raw){
 need(typeof raw==='string'&&await hash(raw)===pin,'Wrong actual V4 baseline draft digest');
 const d=JSON.parse(raw);
 need(exportStructure(d.design)===raw,'Wrong exact V4 semantic structure');
 return d.design;
}
export function buildDetails(maps,base,details,{complete=true}={}){
 const patches=compileDetailShapes(base,details,{complete}),p=buildWorkshopStructure(maps,base).project;
 const s=p.stages[0],precedence=[];
 for(const x of patches){
  if(x.order==='inside-parent'){
   const owner=p.library.find(a=>a.id==='stage42-native-'+x.owner);
   need(owner,'Detail parent placement missing');
   owner.vector.root.children.push(x.path);
  }else{
   need(x.owner==='cross-structure'&&x.layer==='structural-back','Unanchored separate badge prohibited');
   const a=structuredClone(p.library[0]),e=structuredClone(s.elements[0]);
   a.id='stage42-native-structural-brace-'+x.path.id;a.name='structural-brace';a.vector.root={tag:'g',children:[x.path]};
   e.id=a.id+'-placement';e.assetId=a.id;e.layer=x.layer;
   p.library.push(a);precedence.push(e);
  }
 }
 s.elements.unshift(...precedence);
 need(s.terrains.length===0&&p.library.every(a=>a.collision.length===0&&!a.id.includes('act5:near')),'Shape is not solely visual');
 return p;
}
export async function exportDetailWitness(baseRaw,details){
 const base=await verifyStructureBaseline(baseRaw);
 compileDetailShapes(base,details);
 const raw=canon({type,version:1,baseDraftSha256:pin,details});
 need(new TextEncoder().encode(raw).length<=12000,'Oversized editable detail receipt');
 return raw;
}
export async function reopenDetailWitness(maps,baseRaw,receipt){
 need(typeof receipt==='string'&&new TextEncoder().encode(receipt).length<=12000,'Oversized editable detail receipt');
 const base=await verifyStructureBaseline(baseRaw),r=JSON.parse(receipt);
 need(Object.keys(r).sort().join(',')==='baseDraftSha256,details,type,version'&&r.type===type&&r.version===1&&r.baseDraftSha256===pin&&canon(r)===receipt,'Unrecognized witness batch');
 return {details:r.details,project:buildDetails(maps,base,r.details)};
}
