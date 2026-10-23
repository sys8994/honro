/** Local Stage14 roof restoration. Existing solids/routes/actors/story stay
 * byte-equivalent; one canonical rock mass supplies collision and visible art. */
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const ROOF_ID='v14-cavern-vault';
export const UNDERSIDE=[[-6000,420],[-2800,340],[-900,460],[0,480],[620,600],[1300,660],[1620,740],[2200,1480],[2650,1510],[3040,1600],[3550,2070],[4100,2800],[4660,2850],[5100,2740],[5330,2700],[5650,2980],[6200,3340],[6760,3980],[7240,4200],[7600,4270],[9200,4100],[11200,4380],[13600,4200]];
export function applyStage14Ceiling(project){
 const s=project.stages.find(s=>s.metadata?.stageId===14),space=s.design.space;
 if(s.width!==7600||s.height!==10400||s.initialState.honroVerticalStage14Revision!==1)throw Error('Current Stage14 vertical map required');
 const points=[{x:-6000,y:-24000},{x:13600,y:-24000},...UNDERSIDE.toReversed().map(([x,y])=>({x,y}))];
 const roof={id:ROOF_ID,name:'마을 상층의 이어진 암반 천장',type:'solid',baseMaterial:'rock',points,breakable:false,oneWay:false,layer:'terrain',properties:{honroCeiling:true,honroCave:true,honroRole:'ceiling',honroWalkEdges:[],surfaceKind:'cave'},detail:{roughness:0,optimizeEpsilon:0},playProjection:{bounds:{left:0,top:0,right:7600,bottom:10400},start:{x:0,y:0}}};
 s.terrains=s.terrains.filter(t=>t.id!==ROOF_ID);s.terrains.push(roof);
 const planes=[],add=(id,points,fill)=>planes.push({id:'v14-vault-'+id,terrainId:ROOF_ID,stage14Ceiling:true,points,fill});
 add('mother-rock',points.map(p=>[p.x,p.y]),'#203847');
 // Unequal broad beds share the actual irregular underside. Deep ink mass,
 // broken blue-grey bedding and a readable underside, not decorative teeth.
 const depths=[0,105,390,1020],tones=['#5b7580','#435e70','#2e495b'];
 for(let band=0;band<3;band++)for(let i=1;i<UNDERSIDE.length;i++){
  const a=UNDERSIDE[i-1],b=UNDERSIDE[i],d0=depths[band],d1=depths[band+1],j=(i%4-1.5)*25;
  add('bed-'+band+'-'+i,[[a[0],a[1]-d0],[b[0],b[1]-d0],[b[0],b[1]-d1-j],[a[0],a[1]-d1+(i%3-1)*28]],tones[band]);
 }
 space.terrainPlanes=[...(space.terrainPlanes||[]).filter(p=>!p.stage14Ceiling),...planes];
 s.design.ceiling14={revision:1,source:'tools/map-forge/stage14-ceiling.mjs',terrainId:ROOF_ID,scope:'Restore real enclosing upper vault; all existing paths, actors, rescue conditions and approved art retained.',underside:UNDERSIDE};
 return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json',p=JSON.parse(readFileSync(file,'utf8'));applyStage14Ceiling(p);writeFileSync(file,JSON.stringify(p)+'\n');}
