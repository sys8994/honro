import {compileStructure} from './structure.mjs';
const type='honro.stage42.blank-structure-witness';
const canon=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export function buildWorkshopStructure(maps,design){
 const q=compileStructure(design),id='stage-42-structure-witness',width=6500,height=2861;
 const stage=maps.emptyStage(id,'5막 2장 구조 작도 시험',width,height);
 Object.assign(stage,{id,width,height,terrains:[],units:[],events:[],markers:[],elements:[],metadata:{sandbox:true,authoringMode:'blank-native-structure'}});
 const library=q.layerOrder.map(({owner,vector,layer})=>{
  const id='stage42-native-'+owner,a={id,name:owner,category:'prop',visual:[],collision:[],sockets:[],anchor:{x:0,y:0},
   bounds:{x:-2200,y:-2300,w:10900,h:7500},params:{nativeAuthoring:'closed structural shape'},
   vector:{version:1,viewBox:[-2200,-2300,10900,7500],root:{tag:'g',children:[vector]},clips:{}}};
  stage.elements.push({id:id+'-placement',assetId:id,x:0,y:0,scale:1,rotation:0,opacity:1,layer,depthLayer:'L1',visualRole:'scenery'});
  return a;
 });
 const p=maps.normalize({stages:[stage],library,activeStageId:id}),owners=new Set(library.map(a=>a.id));
 p.library=p.library.filter(a=>owners.has(a.id));
 if(p.stages.length!==1||p.library.length!==5||p.stages[0].terrains.length||p.library.some(a=>a.collision.length))throw Error('Native structural compile changed isolation');
 return {project:p,diagnostic:q.diagnostic};
}
export function exportStructure(design){
 compileStructure(design);
 const raw=canon({type,version:1,design});
 if(new TextEncoder().encode(raw).length>13000)throw Error('Structure proof record too large');
 return raw;
}
export function reopenStructure(maps,raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>13000)throw Error('Structure record outside bounds');
 const d=JSON.parse(raw);
 if(raw!==canon(d)||Object.keys(d).sort().join(',')!=='design,type,version'||d.type!==type||d.version!==1)throw Error('Unsupported structure proof record');
 return buildWorkshopStructure(maps,d.design);
}
