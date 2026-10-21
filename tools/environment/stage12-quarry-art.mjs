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
 'sq-art-abandoned-cart':{assetId:'cart',scale:1.6},
 'sq-art-remaining-pillar':{assetId:'act2:rock-column',scale:.4},
 'sq-art-carrier-rubble':{assetId:'act2:rock-bank',scale:1.6},
 ...Object.fromEntries([1.4,1.25,1.4,1,1.15,1.25].map((scale,i)=>['sq-art-natural-stone-'+i,{assetId:'act2:rock-bank',scale}]))
};
export function applyStage12QuarryArt(project,{sourceStage}={}){
 const s=project.stages.find(s=>s.metadata?.stageId===12),source=sourceStage||s;
 if(s?.initialState?.honroQuarryRevision!==1)throw Error('Quarry art requires existing revision1 geography');
 const decorative=source.elements.filter(e=>e.id.startsWith('sq-art-')&&e.id!=='sq-art-recessed-mother-rock').map(clone);
 if(!decorative.length)throw Error('Existing quarry placement source required; do not invent a new layout');
 for(const e of decorative){const spec=QUARRY_COMMON_ASSETS[e.id];if(!spec)continue;
  const a=project.library.find(a=>a.id===spec.assetId);if(!a||a.collision?.length)throw Error('Missing/nondecorative common asset '+spec.assetId);
  if(spec.scale<a.reference.scaleRange[0]||spec.scale>a.reference.scaleRange[1])throw Error('Asset scale outside original range');
  Object.assign(e,spec);
  if(e.id==='sq-art-abandoned-cart'){const t=s.terrains.find(t=>t.id===e.stage12Support.terrainId),x=e.stage12Support.x;for(const i of t.properties.honroWalkEdges){const u=t.points[i],v=t.points[i+1];if(u.x<=x&&x<=v.x){e.rotation=Math.atan2(v.y-u.y,v.x-u.x);break;}}}
  const fx=(a.reference.foot.x||0)-(a.anchor?.x||0),fy=(a.reference.foot.y||0)-(a.anchor?.y||0),cs=Math.cos(e.rotation||0),sn=Math.sin(e.rotation||0);
  e.x=e.stage12Support.x-(fx*cs-fy*sn)*e.scale;e.y=e.stage12Support.y-(fx*sn+fy*cs)*e.scale;
 }
 s.elements=[...s.elements.filter(e=>!e.id.startsWith('sq-art-')),...decorative];
 s.environment=clone(source.environment);
 const art=clone(source.design.quarryArt);delete art.commonPilot;delete art.backdropAsset;
 Object.assign(art,{source:'shared-terrain-and-existing-common-assets',artAssetIds:s.elements.map(e=>e.assetId),commonFull:{revision:1,assets:clone(QUARRY_COMMON_ASSETS),retiredDecorativeIds:['sq-art-recessed-mother-rock'],unfulfilled:[{id:'sq-art-cutting-tools',assetId:'stage12:quarry-fallen-cutting-tools',reason:'No matching shared fallen-pickaxe prop found; existing narrative tool drawing retained.'}]}});
 s.design.quarryArt=art;return project;
}
