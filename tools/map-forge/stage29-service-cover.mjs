/** A real rise in the existing upper sluice road, not a floating cover prop.
 * Only Stage29 geography, its supported occupant and route notes are authored.
 * Objective/route-choice/finite-wave contracts remain owned by their controllers.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {authorPlaceEncounters} from './act3-place-encounters-20261017.mjs';

export const SERVICE_COVER_TOP=[
 [4550,1840],[5130,1840],[5205,1745],[5290,1745],[5385,1840],
 [5550,1840],[6100,2190],[6500,2190]
];
export const SERVICE_COVER_BOTTOM=[[6500,2270],[6100,2270],[5550,1930],[4550,1930]];
export const SERVICE_COVER_ROUTE=[
 [4900,1840],[5130,1840],[5205,1745],[5290,1745],[5385,1840],[5510,1840]
].map(([x,y])=>({x,y,support:'r29-high-road'}));

export function authorStage29ServiceCover(project){
 const p=structuredClone(project),s=p.stages.find(s=>s.metadata?.stageId===29);
 const road=s?.terrains.find(t=>t.id==='r29-high-road');
 if(!road||s.initialState?.honroRecordCourtRevision!==2)throw Error('Stage29 record-court road required');
 road.points=[...SERVICE_COVER_TOP,...SERVICE_COVER_BOTTOM].map(([x,y])=>({x,y}));
 road.properties={...road.properties,honroWalkEdges:SERVICE_COVER_TOP.slice(1).map((_,i)=>i)};
 s.design.act3.optionalRoutes=(s.design.act3.optionalRoutes||[]).filter(r=>r.id!=='sluice-service-cover');
 s.design.act3.optionalRoutes.push({id:'sluice-service-cover',points:structuredClone(SERVICE_COVER_ROUTE),
  description:'상층 수문길의 95 높이 석제 정비 받침. 낮은 직사를 막고 양쪽 완만한 면으로 기본 이동해 높은 사격면을 선점한다.'});
 s.design.act3.recordCourt.serviceCover={revision:1,terrainId:road.id,height:95,
  scope:'Same upper/lower exits, bridge underside, map dimensions, goals and roster budget; one supported archer follows the road rise.'};
 authorPlaceEncounters(p,s);
 return p;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const path='shared/data/campaign.json',p=authorStage29ServiceCover(JSON.parse(await readFile(path,'utf8')));
 await writeFile(path,JSON.stringify(p)+'\n');console.log('Authored Stage29 upper-road service cover only');
}
