/** Fresh 21/24 battles reuse the existing density warning/opportunity contract.
 * No live-save upgrade, population increase, queue reservation or geometry edit. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const clone=v=>JSON.parse(JSON.stringify(v));
const rows={
 21:[
  {id:'act3-response-21-0',objective:'gate-resident',xs:[3390,3510,3620],alt:[3270,3400,3530],kind:'possessedGuard',warning:'성문 동쪽에서 군화 소리가 들립니다. 다음 행동 동안 성문 아래 진입로를 살피세요.'},
  {id:'act3-response-21-1',objective:'refuge-hold',xs:[5030,5170],alt:[5060,5230],kind:'possessedArcher',warning:'시장 동쪽 관아 진입로에서 활시위가 울립니다. 다음 행동 동안 높은 회랑과 낮은 퇴로를 살피세요.'}
 ],
 24:[
  {id:'act3-response-24-0',objective:'family-crest',xs:[3590,3750],alt:[3450,3620],kind:'archiveFiend',warning:'폐가 서재에서 지워진 이름들이 웅성거립니다. 다음 행동 동안 후원 진입로를 살피세요.'},
  {id:'act3-response-24-1',objective:'shrine-seal',xs:[5380,5500,5620],alt:[5320,5450,5580],kind:'archiveFiend',warning:'봉인이 풀린 사당 뒤로 장부귀가 모입니다. 다음 행동 동안 봉인 앞 퇴로를 살피세요.'},
  {id:'act3-response-24-2',objective:'shrine-seal',region:{x:6200,y:2400,width:600,height:800},xs:[6440,6570],alt:[6480,6610],kind:'possessedGuard',elite:true,warning:'토지문서 동쪽 낮은 마당에서 경비가 일어납니다. 다음 행동 동안 문서 곁 사선과 사당 위 길을 살피세요.'}
 ]
};
function ground(s,x){const points=s.terrains.find(t=>t.id==='a3-foundation').points;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(b.x>a.x&&x>=a.x&&x<=b.x&&a.y<s.height&&b.y<s.height)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error('Missing ground '+s.metadata.stageId+'/'+x);}
export function applyTacticalCityResponses(project){const p=clone(project);for(const s of p.stages){const defs=rows[s.metadata?.stageId];if(!defs||!s.metadata.campaign)continue;
 s.initialState.honroEncounterDensityRevision=1;
 for(const q of defs){const ev=s.events.find(e=>e.id===q.id);if(!ev)throw Error('Missing existing response '+q.id);
 const actions=xs=>xs.map((x,i)=>({type:'spawn',kind:q.kind,n:1,x,y:ground(s,x),support:'a3-foundation',maxDistance:0,source:q.id,honroDensityElite:!!q.elite&&i===0,honroDensityRole:q.kind==='possessedArcher'?'exit-cover':q.kind==='archiveFiend'?'record-response':'entry-guard'}));
 Object.assign(ev,{honroDensityResponse:1,honroDensityTrigger:{objectiveDone:q.objective,...(q.region?{region:q.region}:{})},when:{after:'density-gate-'+q.id},warning:q.warning,text:'증원 진입 · '+q.warning,entry:{x:q.xs[0],y:ground(s,q.xs[0])},action:{type:'multi',honroDensityResponse:1,act3Authored:true,source:q.id,actions:actions(q.xs)},honroDensityAlternatives:[actions(q.alt)]});
 }
 s.design.tacticalCityResponses={revision:1,scope:'Existing finite responses, stable contribution IDs and counts. Real player action after warning; exact supported atomic entries or same-side alternatives/wait. No action-cap reservation.'};
 }return p;}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file=process.argv[2]||'shared/data/campaign.json';await writeFile(file,JSON.stringify(applyTacticalCityResponses(JSON.parse(await readFile(file,'utf8'))),null,2)+'\n');}
