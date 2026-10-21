import {applyCommonCartArt} from './common-cart-art.mjs';
/** Stage12 visual references only. No chapter-local pine, terrain or rock paths.
 * Existing Library definitions and every physical field remain untouched. */
const clone=v=>JSON.parse(JSON.stringify(v));
export const STAGE12_ART_PREFIX='stage12:quarry-'; // Legacy save/library identity only.
export const QUARRY_COMMON_ASSETS={
 'sq-art-bent-waymark-pine':{assetId:'act1-scene:rooted-pine',scale:.69,rotation:0},
 'sq-art-old-road-pine':{assetId:'act1-scene:rooted-pine',scale:.77,rotation:0},
 'sq-art-western-pine':{assetId:'act1-scene:rooted-pine',scale:.7,rotation:0},
 'sq-art-rear-root-pine':{assetId:'act1-scene:rooted-pine',scale:.52,rotation:0},
 'sq-art-waymark':{assetId:'builtin:receiverStone',scale:1.8},
 'sq-art-abandoned-cart':{assetId:'builtin:singleRefugeeCart',scale:1.6},
 'sq-art-remaining-pillar':{assetId:'act2:rock-column',scale:.4},
 'sq-art-carrier-rubble':{assetId:'act2:rock-bank',scale:1.15},
 ...Object.fromEntries([1.4,1.25,1.4,1,1.15,1.25].map((scale,i)=>['sq-art-natural-stone-'+i,{assetId:'act2:rock-bank',scale}]))
};
// Existing shared art is inserted into the host's front exposure. These
// anchors are real walking or explicitly named solid boundary edges.
export const QUARRY_FACE_ATTACHMENTS=[
 {id:'quarry-face-old-road-west',assetId:'geology:granite-foundation',terrainId:'sq-old-road',anchor:{edge:1,along:.8},depthMode:'base',inset:80,scale:.95,walkClearance:28,replaceBlocks:true},
 {id:'quarry-face-old-road-crown',assetId:'geology:granite-vertical',terrainId:'sq-old-road',anchor:{edge:4,along:.9},depthMode:'base',inset:120,scale:.85,walkClearance:28,replaceBlocks:true},
 {id:'quarry-face-old-road-east',assetId:'geology:granite-vertical-cleft',terrainId:'sq-old-road',anchor:{edge:6,along:.65},depthMode:'base',inset:70,scale:.9,walkClearance:28,replaceBlocks:true},
 {id:'quarry-face-west-workface',assetId:'geology:granite-foundation',terrainId:'sq-west-quarry',anchor:{edge:2,along:.7},depthMode:'base',inset:70,scale:.9,walkClearance:28,replaceBlocks:true},
 {id:'quarry-face-north-foundation',assetId:'geology:granite-foundation',terrainId:'sq-north-quarry',anchor:{edge:3,along:.6},depthMode:'base',inset:140,scale:1.05,walkClearance:28,replaceBlocks:true},
 {id:'quarry-face-north-west',assetId:'geology:granite-vertical',terrainId:'sq-north-quarry',anchor:{edge:1,along:.9},depthMode:'base',inset:80,scale:.9,walkClearance:28,replaceBlocks:true},
 {id:'quarry-face-north-crown',assetId:'geology:granite-vertical-cleft',terrainId:'sq-north-quarry',anchor:{edge:5,along:.3},depthMode:'base',inset:140,scale:1,walkClearance:28,replaceBlocks:true},
 {id:'quarry-face-north-toe',assetId:'geology:granite-ledge-neck',terrainId:'sq-north-quarry',anchor:{edge:9,along:.35},depthMode:'base',inset:60,scale:.8,walkClearance:28,replaceBlocks:true},
 {id:'quarry-face-back-neck',assetId:'geology:granite-ledge-neck',terrainId:'sq-back-road',anchor:{edge:2,along:.25},depthMode:'surface',inset:500,scale:1,walkClearance:28,replaceBlocks:true},
 {id:'quarry-face-cave-buttress',assetId:'geology:granite-vertical',terrainId:'sq-cave-buttress',anchor:{kind:'boundary',edge:0,along:.55},depthMode:'surface',inset:1300,scale:.85,walkClearance:28,replaceBlocks:true},
 {id:'quarry-face-lower-foundation',assetId:'geology:granite-foundation',terrainId:'sq-lower-ground',anchor:{edge:17,along:.935},depthMode:'surface',inset:2200,scale:1.1,walkClearance:28,replaceBlocks:true,embedFade:200},
 {id:'quarry-face-sign-granite',assetId:'geology:granite-vertical-cleft',terrainId:'sq-lower-ground',anchor:{edge:17,along:.05},depthMode:'surface',inset:1600,scale:1.05,walkClearance:28,replaceBlocks:true},
 {id:'quarry-face-sign-neck',assetId:'geology:granite-ledge-neck',terrainId:'sq-lower-ground',anchor:{edge:17,along:.05},depthMode:'surface',inset:610,scale:1,walkClearance:28,replaceBlocks:true,embedFade:180}
];
// Feet/socket contacts sit on the actual lower return terrain. These three
// unequal rear masses support the left workface and the north mass's east root;
// the central return and cave opening retain sky/air on either side.
export const QUARRY_REAR_GEOLOGY={version:1,renderLayer:'back',visualDepth:'L2',brightness:.74,instances:[
 {id:'quarry-rear-west-foot',assetId:'geology:granite-foundation',scale:.9,support:{terrainId:'sq-lower-ground',at:4130/11200,offsetY:50}},
 {id:'quarry-rear-north-root',assetId:'geology:granite-vertical',scale:.9,socket:'lower-rear',support:{terrainId:'sq-lower-ground',at:7800/11200}},
 {id:'quarry-rear-north-foot',assetId:'geology:granite-foundation',scale:1.1,support:{terrainId:'sq-lower-ground',at:7800/11200,offsetY:60}}
]};
export function applyStage12QuarryArt(project,{sourceStage}={}){
 applyCommonCartArt(project);
 const s=project.stages.find(s=>s.metadata?.stageId===12),source=sourceStage||s;
 if(s?.initialState?.honroQuarryRevision!==1)throw Error('Quarry art requires existing revision1 geography');
 const decorative=source.elements.filter(e=>e.id.startsWith('sq-art-')&&e.id!=='sq-art-recessed-mother-rock').map(clone);
 if(!decorative.length)throw Error('Existing quarry placement source required; do not invent a new layout');
 for(const e of decorative){const spec=QUARRY_COMMON_ASSETS[e.id];if(!spec)continue;
  const a=project.library.find(a=>a.id===spec.assetId);if(!a||a.collision?.length)throw Error('Missing/nondecorative common asset '+spec.assetId);
  if(spec.scale<a.reference.scaleRange[0]||spec.scale>a.reference.scaleRange[1])throw Error('Asset scale outside original range');
  Object.assign(e,spec);
  // Only the loose decorative load moves. Keep the cart, objective and all
  // functional coordinates fixed; put this shared rock beside the wheel bay.
  if(e.id==='sq-art-carrier-rubble'){
   const cart=decorative.find(e=>e.id==='sq-art-abandoned-cart'),t=s.terrains.find(t=>t.id===cart.stage12Support.terrainId),x=(cart.stage12CartSourceSupport||cart.stage12Support).x+300;
   const i=t.properties.honroWalkEdges.find(i=>t.points[i].x<=x&&x<=t.points[i+1].x),u=t.points[i],v=t.points[i+1];
   e.stage12Support={terrainId:t.id,x,y:u.y+(v.y-u.y)*(x-u.x)/(v.x-u.x)};e.rotation=Math.atan2(v.y-u.y,v.x-u.x);
  }
  if(e.id==='sq-art-abandoned-cart'){e.stage12CartSourceSupport??=clone(e.stage12Support);const t=s.terrains.find(t=>t.id===e.stage12CartSourceSupport.terrainId),x=e.stage12CartSourceSupport.x+20;for(const i of t.properties.honroWalkEdges){const u=t.points[i],v=t.points[i+1];if(u.x<=x&&x<=v.x){e.stage12Support={terrainId:t.id,x,y:u.y+(v.y-u.y)*(x-u.x)/(v.x-u.x)};e.rotation=Math.atan2(v.y-u.y,v.x-u.x);break;}}}
  const fx=(a.reference.foot.x||0)-(a.anchor?.x||0),fy=(a.reference.foot.y||0)-(a.anchor?.y||0),cs=Math.cos(e.rotation||0),sn=Math.sin(e.rotation||0);
  e.x=e.stage12Support.x-(fx*cs-fy*sn)*e.scale;e.y=e.stage12Support.y-(fx*sn+fy*cs)*e.scale;
 }
 s.elements=[...s.elements.filter(e=>!e.id.startsWith('sq-art-')),...decorative];
 s.environment=clone(source.environment);
 s.design.space.terrainAttachments=clone(QUARRY_FACE_ATTACHMENTS);
 s.design.geologyComposition=clone(QUARRY_REAR_GEOLOGY);
 const art=clone(source.design.quarryArt);delete art.commonPilot;delete art.backdropAsset;
 Object.assign(art,{source:'shared-terrain-and-existing-common-assets',artAssetIds:[...s.elements,...QUARRY_FACE_ATTACHMENTS,...QUARRY_REAR_GEOLOGY.instances].map(e=>e.assetId),commonFull:{revision:1,assets:clone(QUARRY_COMMON_ASSETS),retiredDecorativeIds:['sq-art-recessed-mother-rock'],unfulfilled:[{id:'sq-art-cutting-tools',assetId:'stage12:quarry-fallen-cutting-tools',reason:'No matching shared fallen-pickaxe prop found; existing narrative tool drawing retained.'}]}});
 s.design.quarryArt=art;return project;
}
