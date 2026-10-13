/** Bounded, idempotent topology authoring. Existing objectives, NPC floor,
 * gate, map bounds, encounter counts and live-save snapshots are untouched. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const point=([x,y])=>({x,y});
function surface(t,x){for(let i=1;i<t.points.length;i++){const a=t.points[i-1],b=t.points[i];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error('No surface '+t.id+' '+x);}
function slab(id,top,thickness=45,oneWay=false,material='rock'){return{id,name:id,type:'solid',points:[...top,...top.toReversed().map(([x,y])=>[x,y+thickness])].map(point),baseMaterial:material,oneWay,breakable:false,layer:'terrain',properties:{hp:99999,maxHp:99999,optional:true,surfaceKind:oneWay?'wood':'rock',honroWalkEdges:top.slice(1).map((_,i)=>i)},detail:{spacing:18,roughness:0,seed:913,optimizeEpsilon:0}};}
function author(s){
 const n=s.metadata.stageId,floor=s.terrains.find(t=>t.id===(n===9?'yard-floor':'act2-floor')),ground=x=>surface(floor,x);
 const removed=n===9?['west-step-1','west-step-2','west-gallery','center-lookout','east-step-1','east-step-2','east-gallery']:['ct-gallery-work-deck'];
 s.terrains=s.terrains.filter(t=>!removed.includes(t.id)&&!t.id.startsWith('tactical-'));
 const additions=n===9?[
 slab('tactical-west-collapsed-gallery',[[610,2340],[960,2310],[1340,2400]],45),
 slab('tactical-west-rubble-ascent',[[430,ground(430)-160],[660,2340]],25,true,'wood'),
 slab('tactical-west-rubble-return',[[1280,2386],[1550,ground(1550)-160]],25,true,'wood'),
 slab('tactical-east-stone-shoulder',[[2520,1990],[2750,1970],[3020,2020]],65),
 slab('tactical-east-root-ascent',[[2140,ground(2140)-160],[2420,2180],[2600,1983]],25,true,'wood'),
 slab('tactical-east-root-return',[[2940,2005],[3140,2200],[3380,ground(3380)-160]],25,true,'wood')
 ]:[
 slab('tactical-entry-shoulder',[[1110,ground(1110)-180],[1560,ground(1560)-245],[2130,ground(2130)-180]],50),
 slab('tactical-entry-west-ramp',[[820,ground(820)-160],[1180,ground(1110)-180+2]],25,true,'wood'),
 slab('tactical-mason-return',[[2080,ground(2130)-190],[2350,ground(2350)-160]],25,true,'wood'),
 slab('tactical-inner-gallery',[[5270,ground(5270)-200],[5700,ground(5700)-240],[6290,ground(6290)-200]],50),
 slab('tactical-inner-west-ramp',[[5020,ground(5020)-160],[5350,ground(5270)-176]],25,true,'wood'),
 slab('tactical-inner-east-ramp',[[6220,ground(6290)-218],[6530,ground(6530)-160]],25,true,'wood')
 ];s.terrains.push(...additions);
 const p=(x,t)=>({x,y:t?surface(additions.find(q=>q.id===t),x):ground(x),surfaceId:t||(n===9?'yard-floor':'floor-main')});
 const routes=n===9?[
 {id:'west-covered-floor',defaultJump:false,anchors:[p(430),p(850),p(1420),p(1800)]},
 {id:'west-collapsed-gallery',anchors:[p(400),p(470,'tactical-west-rubble-ascent'),p(570,'tactical-west-rubble-ascent'),p(960,'tactical-west-collapsed-gallery'),p(1400,'tactical-west-rubble-return'),p(1510,'tactical-west-rubble-return'),p(1630),p(1800)]},
 {id:'east-root-loop',anchors:[p(2060),p(2190,'tactical-east-root-ascent'),p(2340,'tactical-east-root-ascent'),p(2600,'tactical-east-stone-shoulder'),p(2800,'tactical-east-stone-shoulder'),p(3070,'tactical-east-root-return'),p(3320,'tactical-east-root-return'),p(3480)]},
 {id:'receiver-return',defaultJump:false,anchors:[p(850),p(1400),p(1800),p(2300),p(2800),p(3380)]}
 ]:[
 {id:'entry-shoulder',anchors:[p(740),p(865,'tactical-entry-west-ramp'),p(1050,'tactical-entry-west-ramp'),p(1200,'tactical-entry-shoulder'),p(1550,'tactical-entry-shoulder'),p(2050,'tactical-entry-shoulder'),p(2190,'tactical-mason-return'),p(2290,'tactical-mason-return'),p(2430)]},
 {id:'mason-covered-approach',defaultJump:false,anchors:[p(820),p(1300),p(1800),p(2400)]},
 {id:'inner-gallery',anchors:[p(4940),p(5070,'tactical-inner-west-ramp'),p(5190,'tactical-inner-west-ramp'),p(5400,'tactical-inner-gallery'),p(5700,'tactical-inner-gallery'),p(6200,'tactical-inner-gallery'),p(6360,'tactical-inner-east-ramp'),p(6470,'tactical-inner-east-ramp'),p(6620)]},
 {id:'inner-low-passage',defaultJump:false,anchors:[p(5020),p(5400),p(5900),p(6400),p(6600)]}
 ];
 s.design.tacticalRoutes={version:1,geometryRevision:1,scope:'ordinary walking and default jump, no skill or reward required',routes:routes.map(r=>({...r,requires:[],bidirectional:true})),preserved:{bounds:true,encounters:true,objectives:true,npcFloor:true}};
 if(n===13){const sp=s.design.space;sp.routes=sp.routes.filter(r=>!removed.includes(r.id)&&!r.id.startsWith('tactical-'));sp.surfaces=sp.surfaces.filter(r=>!removed.includes(r.terrainId)&&!r.terrainId.startsWith('tactical-'));for(const room of sp.rooms)room.terrainIds=room.terrainIds.filter(id=>!removed.includes(id)&&!id.startsWith('tactical-'));for(const t of additions)sp.surfaces.push({id:t.id,terrainId:t.id,role:'shelf',edgeIndices:t.properties.honroWalkEdges,roomIds:[t.id.includes('inner')?'low-gallery':'sunken-forecourt']});sp.routes.push(...routes.map(r=>({...r,id:'tactical-'+r.id,kind:'optional-jump',requires:[]})));}
 return s;
}
export function applyStage9And13Tactical(project){for(const s of project.stages)if([9,13].includes(s.metadata?.stageId))author(s);return project;}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json';await writeFile(file,JSON.stringify(applyStage9And13Tactical(JSON.parse(await readFile(file,'utf8'))),null,2)+'\n');}
