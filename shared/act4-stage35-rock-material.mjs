/** Stage 35 only. Author the approved cool rock palette on the exact native
 * paint surfaces, after the unchanged optimizer and southeast continuity pass.
 * Symbols carrying bridge timber, bamboo and other scenery are never walked. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const bodyPaint=Object.freeze({
 '#a28266':['#506a76',2], '#7b8184':['#6e8588',3], '#777d80':['#637980',3],
 '#937b63':['#587681',3], '#8a7256':['#496774',4], '#786e44':['#455f6a',4],
 '#614e3b':['#364e5d',4], '#74703a':['#496569',7], '#444a4b':['#3b505a',7],
 '#544636':['#324959',7], '#483c30':['#293f54',6],
});
const wallPaint=Object.freeze({'#9b9783':['#8c9ca6',1],'#8e8e69':['#7b8e9b',1],'#7c825a':['#667e8d',1],'#596354':['#506570',1]});
const bedPaint=Object.freeze({'#666659':['#506477',1],'#55594c':['#415567',1],'#494f46':['#314655',1],'#39443f':['#253747',1]});
const specs=Object.freeze({
 'act4-handoff:35:body':         ['approved35-body','mid','body',0,0,'0c7ac182e5d3bad555506a3ae474ab5ea890178aa3f32209a463fbf14216a97f','efcce1f6a991d2636a9f47be2c6e4f4210b18256ea9e159041fa9c479d1f4c21','966640:fa95a84f'],
 'act4-handoff:35:walls':        ['act4-handoff:35:walls','structural-back','structure',0,0,'6dd29af9a8b88d2f61087366b99ce45afc91bc4e8d04cbbc8b9b5bbc812b6b05','29ef5fe9f671ffcbd31dd9df3dd2ff7955066beee5555f0a88b71c0b3bdc23cf','158123:5541b75d'],
 'act4-handoff:35:bedrock':      ['act4-handoff:35:bedrock','structural-back','structure',0,0,'80a1c053b3c35c3cd9be2452d8c37c274a6a4d5426af23cb58daa52d3a2b8076','eb851c4299aa9aa194efdcd492e91d0731459650a6a5bc72ffa60fb534df3929','449277:7ffe61b2'],
 'approved35:near-geology':      ['approved35-near-geology','structural-back','structure',-700,1450,'4eafcdba80200814f574b46dda4bc01d47d40c422eaa815c146717b88ed10845','3c298274ff8594d51f2a7d7c13430e56fb8880b033798919ac9f969e3bcf7392','298307:55096145'],
});
const nearId='approved35:near-geology';
const previousStock=Object.freeze({
 'act4-handoff:35:body':'1632032:a8ce2166',
 'act4-handoff:35:walls':'172309:211be1d1',
 'act4-handoff:35:bedrock':'522832:2374b2d',
});
const sha=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
function signature(asset){
 const s=JSON.stringify(asset);let h=2166136261;
 for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);
 return s.length+':'+(h>>>0).toString(16);
}
function child(node,...indices){return indices.reduce((parent,i)=>parent.children[i],node);}
function paint(nodes,count,colors,label){
 assert.equal(nodes.length,count,'Stage35 rock '+label+' expected native path count');
 const sizes=Object.fromEntries(Object.keys(colors).map(k=>[k,0]));
 for(const n of nodes){
  assert(n.tag==='path','Stage35 rock '+label+' expected native paths');
  if(!Object.hasOwn(colors,n.fill))continue;
  const old=n.fill;sizes[old]++;n.fill=colors[old][0];
 }
 for(const [k,[,count]] of Object.entries(colors))assert.equal(sizes[k],count,'Stage35 rock '+label+' expected paint count for '+k);
}
function recolor(asset){
 const next=structuredClone(asset),v=next.vector,r=v.root;
 switch(asset.id){
  case 'act4-handoff:35:body':
   paint(child(r,0,0,0).children,54,bodyPaint,'BODY planes');
   paint([child(r,1,0,0,0)],1,{'#9b886e':['#718991',1]},'BODY tread trace');break;
  case 'act4-handoff:35:walls':
   paint(child(v.symbols['asset-wall'],0,0).children,8,wallPaint,'standing masonry');break;
  case 'act4-handoff:35:bedrock':
   paint(child(r,0,0).children,4,bedPaint,'rear masked bedrock');break;
  case nearId:
   paint([child(r,0,0,11)],1,{'#3b4c10':['#34495d',1]},'near geological accent');break;
  default: throw Error('Unowned Stage35 material');
 }
 return next;
}

export function applyStage35RockMaterial(project,previousAct4Signatures){
 const stages=project.stages.filter(s=>s.id==='stage-35'||s.metadata?.stageId===35),s=stages[0];
 assert(stages.length===1&&s.id==='stage-35'&&s.metadata.stageId===35&&s.metadata.campaign===true&&
  s.metadata.act4Stage===35&&s.width===4608&&s.height===3072,'Stage35 rock material: canonical stage');
 const bridge={...previousAct4Signatures},nextAssets=new Map();
 for(const [id,[name,layer,role,x,y,before,after,legacy]] of Object.entries(specs)){
  const refs=project.stages.flatMap(st=>st.elements.filter(e=>e.assetId===id).map(e=>[st,e]));
  const [st,e]=refs[0]??[], a=project.library.filter(t=>t.id===id),asset=a[0];
  assert(refs.length===1&&st===s&&e.id===name&&e.layer===layer&&e.nativeArtLayer===role&&e.depthLayer==='L1'&&
   e.x===x&&e.y===y&&e.scale===1&&e.rotation===0&&(e.opacity??1)===1,'Stage35 rock material: wrong owner placement '+id);
  assert(a.length===1&&asset.collision?.length===0&&!asset.interactionType&&sha(asset)===before&&signature(asset)===legacy,
   'Stage35 rock material: exact optimized input changed '+id);
  const painted=recolor(asset);
  assert.equal(sha(painted),after,'Stage35 rock material: wrong authored result '+id);
  nextAssets.set(asset,painted);
  if(id===nearId){
   assert.deepEqual(bridge[id],{stage:35,previous:'359227:635a5188',current:legacy,previousOptimized:'295465:df15d6ec'},
    'Stage35 rock material: official original/optimized near provider changed');
   bridge[id]={...bridge[id],current:signature(painted)};
  }else{
   assert.deepEqual(bridge[id],{stage:35,previous:previousStock[id],current:legacy},
    'Stage35 rock material: original/optimized historical provider changed '+id);
   bridge[id]={...bridge[id],current:signature(painted),previousOptimized:legacy};
  }
 }
 return {project:{...project,library:project.library.map(a=>nextAssets.get(a)??a)},previousAct4Signatures:bridge};
}
