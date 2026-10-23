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
 const at=(line,x)=>{for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return x<line[0][0]?line[0][1]:line.at(-1)[1];};
 const depths=[UNDERSIDE.map(([x])=>[x,0]),[[-6000,260],[-1800,150],[0,155],[900,240],[1700,125],[2700,260],[3600,180],[4500,250],[5400,120],[6500,280],[7600,190],[13600,260]],[[-6000,1080],[-1800,760],[0,920],[1400,670],[2600,1030],[3700,750],[4900,1090],[6100,730],[7600,1050],[13600,940]],[[-6000,3200],[0,2600],[2500,3100],[4600,2400],[6500,3300],[13600,2800]]];
 const lines=depths.map(d=>[...new Set([...UNDERSIDE.map(p=>p[0]),...d.map(p=>p[0])])].sort((a,b)=>a-b).map(x=>[x,at(UNDERSIDE,x)-at(d,x)]));
 const span=(line,l,r)=>[[l,at(line,l)],...line.filter(p=>p[0]>l&&p[0]<r),[r,at(line,r)]];
 const cuts=[[-6000,-6000],[-3100,-3450],[-1100,-780],[540,190],[1540,1800],[2480,2160],[3450,3690],[4450,4110],[5500,5830],[6600,6280],[7750,8160],[10400,9900],[13600,13600]];
 const tones=[['#59747e','#4c6878','#536f7c','#4e6b78'],['#3e5b6d','#355367','#405c6d','#385568'],['#2d4659','#294354','#304959','#2a4255']];
 for(let band=0;band<3;band++)for(let i=1;i<cuts.length;i++){
  const a=cuts[i-1],b=cuts[i],offset=band%2;
  const loA=a[offset],loB=b[offset],hiA=a[1-offset],hiB=b[1-offset];
  add('bed-'+band+'-'+i,[...span(lines[band],loA,loB),...span(lines[band+1],hiA,hiB).reverse()],tones[band][(i+band)%4]);
 }
 space.terrainPlanes=[...(space.terrainPlanes||[]).filter(p=>!p.stage14Ceiling),...planes];
 s.design.ceiling14={revision:1,source:'tools/map-forge/stage14-ceiling.mjs',terrainId:ROOF_ID,scope:'Restore real enclosing upper vault; all existing paths, actors, rescue conditions and approved art retained.',underside:UNDERSIDE};
 return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json',p=JSON.parse(readFileSync(file,'utf8'));applyStage14Ceiling(p);writeFileSync(file,JSON.stringify(p)+'\n');}
