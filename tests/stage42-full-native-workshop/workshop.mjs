import {compileFullShape,FRAME} from './model.mjs';
const kind='honro.stage42.full-native-blank',id='stage-42-whole-native-blockout';
const canon=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
function environment(maps){
 const s=maps.emptyStage(id,'5막 2장 전체 신규 지형 작업본',FRAME.width,FRAME.height);
 Object.assign(s,{id,terrainDomainVersion:1,playBounds:{left:0,top:0,right:FRAME.width,bottom:FRAME.height},
  terrainBounds:{left:FRAME.left,top:FRAME.top,right:FRAME.right,bottom:FRAME.bottom},
  terrains:[],elements:[],units:[],events:[],markers:[],metadata:{sandbox:true,authoringMode:'blank-native-full-width'}});
 return {stages:[s],library:[],activeStageId:id};
}
export function fullBlankProject(maps){const p=maps.normalize(environment(maps));p.library=[];return p;}
export function fullWorkshopProject(maps,design){
 const draft=compileFullShape(design),p=environment(maps),stage=p.stages[0],d=stage.terrainBounds;
 const asset=(role,n)=>{
  const id='new-stage42-'+role.owner,x=d.left,y=d.top,w=d.right-x,h=d.bottom-y;
  const a={id,name:role.owner,category:'prop',anchor:{x:0,y:0},collision:[],sockets:[],visual:[],bounds:{x,y,w,h},
   params:{nativeAuthoring:'whole-contiguous-visual'},vector:{version:1,viewBox:[x,y,w,h],root:{tag:'g',children:role.vectors??[role.vector]},clips:{}}};
  stage.elements.push({id:id+'-at',assetId:id,x:0,y:0,scale:1,rotation:0,opacity:1,order:n,layer:role.layer,depthLayer:'L1',visualRole:'scenery'});
  return a;
 };
 const fused={owner:'joined-lower',layer:'structural-back',vectors:[draft.seamUnderpaint,...draft.roles.filter(x=>x.owner.startsWith('lower-')).map(x=>x.vector)]};
 const roles=[...draft.roles.filter(x=>x.owner.startsWith('back-')||x.owner.startsWith('margin-')||x.owner.startsWith('bearing-')),fused,...draft.roles.filter(x=>x.owner==='upper-route')];
 p.library=roles.map(asset);
 const allowed=new Set(p.library.map(a=>a.id)),out=maps.normalize(p);
 out.library=out.library.filter(a=>allowed.has(a.id));
 if(out.library.length!==allowed.size||out.stages[0].terrains.length||out.library.some(a=>a.collision.length)||JSON.stringify(out.stages[0].terrainBounds)!==JSON.stringify(stage.terrainBounds))throw Error('New native project budget/bounds or collision changed');
 return out;
}
export function exportFullWorkshop(design){compileFullShape(design);const raw=canon({kind,version:1,target:id,design});if(raw.length>26000)throw Error('Editable scene scope too large');return raw;}
export function reopenFullWorkshop(maps,raw){
 if(typeof raw!=='string'||raw.length>26000)throw Error('Wrong compact stage document');
 const q=JSON.parse(raw);if(raw!==canon(q)||Object.keys(q).sort().join(',')!=='design,kind,target,version'||q.kind!==kind||q.version!==1||q.target!==id)throw Error('Unknown blank authoring document');
 return {project:fullWorkshopProject(maps,q.design),design:q.design};
}
