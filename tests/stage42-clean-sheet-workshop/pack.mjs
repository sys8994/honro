import {createBlankWorkshopStage,IDS} from './blank.mjs';
import {compileNativeDraft} from './partition.mjs';
const kind='honro.workshop.blank-stage42',version=2;
const canon=input=>JSON.stringify(input,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const sha=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canon(v))))).map(q=>q.toString(16).padStart(2,'0')).join('');
const keys=(o,ks)=>o&&Object.keys(o).length===ks.length&&ks.every(k=>Object.hasOwn(o,k));
const check=d=>{
 if(!keys(d,['version','outline','seams','dummies','facets','contacts'])||d.version!==2||!Array.isArray(d.outline)||!Array.isArray(d.seams)||!d.seams.every(s=>keys(s,['a','b','knots']))||!Array.isArray(d.dummies)||!Array.isArray(d.facets)||!Array.isArray(d.contacts))throw Error('Unsupported blank terrain structure');
 return compileNativeDraft(d);
};
const emptyEnv=(base,maps)=>{
 const s=maps.emptyStage(base.stage.id,base.stage.name,base.stage.width,base.stage.height);
 return {stages:[{...s,...structuredClone(base.stage)}],library:[],activeStageId:base.stage.id};
};
export function blankProject(maps,base) {const p=maps.normalize(emptyEnv(base,maps));p.library=[];return p;}
export function composeBlankProject(maps,base,design,{guides=false}={}){
 const v=check(design),env=emptyEnv(base,maps),[stage]=env.stages;
 const [x,y,w,h]=v.bounds;
 env.library=[{id:IDS.art,name:'신규 암체',category:'prop',visual:[],collision:[],sockets:[],anchor:{x:0,y:0},
  bounds:{x,y,w,h},reference:{bounds:{x,y,w,h},foot:{x:0,y:0},heightM:h/60,scaleRange:[1,1],backgroundRange:[1,1]},
  params:{semanticLayer:'BODY',workflow:'blank-native'},vector:{version:1,viewBox:[x,y,w,h],root:v.root,clips:{}}}];
 stage.elements=[{id:IDS.placement,assetId:IDS.art,x:0,y:0,scale:1,rotation:0,opacity:1,depthLayer:'L1',layer:'structural-back',visualRole:'scenery'}];
 // Experimental guide preview only: never inject collision into native paint layer.
 if(guides)throw Error('Collision guides are read-only overlays, never active geometry');
 const p=maps.normalize(env);p.library=p.library.filter(a=>a.id===IDS.art);if(p.library.length!==1)throw Error('Native authoring owner not preserved');return p;
}
export async function exportBlankDraft(base,design){
 check(design);
 const raw=canon({kind,version,target:IDS.draft,sourceGuideSha256:await sha(base.baseline),design});
 if(new TextEncoder().encode(raw).length>12000)throw Error('Terrain draft exceeds budget');
 return raw;
}
export async function reopenBlankDraft(maps,source,raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>12000)throw Error('Invalid blank stage file');
 const rec=JSON.parse(raw);
 if(!keys(rec,['kind','version','target','sourceGuideSha256','design'])||rec.kind!==kind||rec.version!==version||rec.target!==IDS.draft||raw!==canon(rec))throw Error('Wrong canonical blank draft type');
 const base=createBlankWorkshopStage(source);
 if(await sha(base.baseline)!==rec.sourceGuideSha256)throw Error('Collision/coordinate guide changed');
 const next=composeBlankProject(maps,base,rec.design);
 return {base,design:structuredClone(rec.design),next};
}
