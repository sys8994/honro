/** Construct a partial production draft from the actual assembled campaign.
 * Authored support IDs are carried as declarations, not independently certified.
 * Inferred combat categories and recorded route points remain proposals;
 * blank reviews and probes deliberately keep the gate closed. */
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {loadPilotRuntime} from './pilot-runtime.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false});
await loadPilotRuntime(g);
const id='stage-31',p=g.HonroProductionContract.begin(g.HONRO_PROJECT,id),s=p.stages.find(v=>v.id===id),card=p.production.cards[id];
if(!s||s.metadata?.stageId!==31)throw Error('Actual assembled Stage 31 is missing');
const enemy=new Map(s.units.filter(u=>u.team==='enemy').map(u=>[u.id,u]));
card.encounters=(s.encounters||[]).map(group=>({id:group.id,purpose:'',targetZone:null,members:group.unitIds.map(id=>{
 const u=enemy.get(id);if(!u||u.encounterGroup!==group.id)throw Error('Encounter membership mismatch: '+id);
 const supportId=u.stageOverrides?.honroEncounterSupport;
 if(typeof supportId!=='string'||!supportId)throw Error('Authored support is missing: '+id);
 return {id,role:'',supportId};
})}));
const assigned=card.encounters.flatMap(e=>e.members.map(m=>m.id));
if(assigned.length!==enemy.size||new Set(assigned).size!==enemy.size)throw Error('Enemy groups do not cover the exact roster');
// These translate the authored pilot role into the contract's vocabulary;
// they are design declarations, not proof of observed enemy behavior.
const roles={guard:'vanguard',close:'pursuer',arc:'area-denial',bind:'area-denial',midboss:'area-denial'};
// Planned player corridors, not the enemy activation envelope or evidence that
// a projectile reaches the corridor. Crossfire spans two elevations on purpose.
const zones={
 'west-entry':{x:315,y:1800,w:1908,h:700},
 'west-crossfire':{x:1696,y:1550,w:1450,h:1280},
 'ridge-court':{x:5000,y:1300,w:1150,h:1500},
 'lookout-return':{x:3500,y:2600,w:1585,h:550}
};
for(const group of card.encounters){
 const units=group.members.map(m=>enemy.get(m.id)),activation=s.initialState?.honroEncounterDensityActivation?.[group.id];
 if(!activation||!Number.isFinite(activation.radius))throw Error('Missing authored encounter activation: '+group.id);
 for(const m of group.members){const raw=enemy.get(m.id).stageOverrides?.honroPilotRole;m.role=raw==='bow'?(m.supportId.includes('upper')?'overwatch':'ranged-support'):roles[raw];if(!m.role)throw Error('Unknown authored combat role: '+raw);}
 group.purpose='배치된 순찰군이 선언된 지지면에서 지정한 동행 이동 구간을 압박하도록 계획한다. 실제 시야·발사·도달 여부는 별도 검증한다.';
 group.targetZone=zones[group.id];if(!group.targetZone)throw Error('Missing planned player corridor: '+group.id);
}
// Observed normal App placement corrections; the contract independently checks
// both contacts, exact resulting coordinates and the original slope filter.
const resolvedSpawns={
 'pilot31-ridge-court-7':{x:5953,y:2190.35},
 'pilot31-lookout-return-5':{x:4805.5,y:3065.766666666667}
};
for(const group of card.encounters)for(const m of group.members)if(resolvedSpawns[m.id])m.spawnResolution={...resolvedSpawns[m.id],reason:'정식 장 진입의 sanitizeStageBattle이 같은 지지면의 보행 가능한 인접 구간으로 배치한다.'};
card.intent='상층 둑길과 아래쪽 물가를 활용해 위협을 정리한 뒤 동행 전원이 오른쪽 선착장에서 배에 오른다.';
card.referenceStages=['stage-3','stage-30'];
const profile=g.HonroMaps.profileFor(s);g.HonroEquipment.fresh(profile);const battle=g.HonroMaps.createBattle(s,p,profile);
card.budget={initial:enemy.size,elites:battle.units.filter(u=>u.side===1&&u.elite).length,activeLimit:s.initialState.honroActiveLimit,finiteSpawnCount:0,rationale:'초기 배치와 동시 활성 상한은 실제 생성 전투에서 확인했다. 별도 스테이지 증원 이벤트는 선언되지 않았다.'};
// Candidate points come from actual browser input observations in the P0 run.
// Contract audit checks each against compiled support; this does not turn the
// point list itself into a traversability or current-runtime probe pass.
const compiled=g.HonroMaps.compile(s,p);
const point=(supportId,x,nearY)=>{const hit=g.HonroMapEngine.surfaceY(compiled.terrain.filter(t=>t.id===supportId),x,nearY);if(!hit||Math.abs(hit.y-nearY)>8)throw Error('Recorded route point does not match support: '+supportId+' '+x);return{x,y:hit.y,supportId};};
card.routes=[
 {id:'upper-to-harbor',role:'primary',purpose:'브라우저 기록의 상층 진행과 하강 후 선착장 접근',points:[['approved31-entry',315,2456],['approved31-entry',1800,1926],['approved31-upper-west',2974,1422],['approved31-upper-east',4203,1095],['approved31-upper-east',5574,1557],['approved31-east-return',5922,2230],['approved31-boarding',6105,2730],['approved31-harbor-stair',6402,2956]].map(v=>point(...v))},
 {id:'lower-flank',role:'alternate',purpose:'브라우저 기록의 아래쪽 물가 측면 접근',points:[['approved31-entry',1560,1966],['approved31-low-flank',1877,2565],['approved31-low-flank',3129,2913],['approved31-low-flank',4731,3076],['approved31-east-return',5833,2346]].map(v=>point(...v))}
];
const assetReasons={
 'approved31:coastal-foundation':'해안 원경과 플레이 지형의 바닥 연결을 표현하는 전용 기반.',
 'approved31:body':'해당 장의 해안 실루엣과 층별 암면을 표현하는 본체.',
 'approved31:harbor-piling':'선착장의 목재 지지 구조물.',
 'approved31:harbor-stair':'선착장 접근 계단의 시각 요소.',
 'a4:boat':'기존 승선 목표에 사용하는 4막 공통 배 자산.'
};
card.assetExceptions=Object.entries(assetReasons).map(([assetId,reason])=>({assetId,reason}));
const minZoom=g.HonroBounds.zoomLimits(1440).min;
card.cameraViews=[
 {kind:'overview',x:s.width/2,y:s.height/2,scale:1440/(s.width+100),width:1440,height:900},
 {kind:'normal',x:1400,y:2000,scale:.5,width:1440,height:900},
 {kind:'close',x:1400,y:2000,scale:1,width:1440,height:900},
 {kind:'min-zoom',x:s.width/2,y:s.height/2,scale:minZoom,width:1440,height:900},
 {kind:'mobile',x:1400,y:2000,scale:.5,width:390,height:844},
 {kind:'left-edge',x:0,y:2200,scale:.5,width:1440,height:900},
 {kind:'right-edge',x:s.width,y:2200,scale:.5,width:1440,height:900}
].map(v=>({id:v.kind,...v}));
card.requiredProbes=[
 {id:'entry-route',kind:'route',claim:'실제 이동 입력으로 입구 지지면의 두 지점을 통과한다.'},
 {id:'entry-shot',kind:'shot',claim:'실제 발사 입력으로 선언한 적에게 피해를 준다.'},
 {id:'west-enemy-action',kind:'enemy-action',claim:'서쪽 교전군이 실제 접근하거나 아군에게 피해를 준다.'},
 {id:'boarding-objective',kind:'objective',claim:'실제 App 상호작용으로 목표 승선을 완료한다.'}
];
const result=g.HonroProductionContract.releaseStatus(p,id);
if(result.exportAllowed)throw Error('An incomplete scaffold cannot be released');
const dir=process.argv[2]||'_local/reports/stage31-production';await mkdir(dir,{recursive:true});
await writeFile(dir+'/draft.json',JSON.stringify(p));
await writeFile(dir+'/audit.json',JSON.stringify(result,null,2)+'\n');
await writeFile(dir+'/card.json',JSON.stringify({candidateFingerprint:result.fingerprint,card,releaseApproved:false},null,2)+'\n');
console.log(JSON.stringify({directory:dir,stage:id,enemies:enemy.size,groups:card.encounters.length,fingerprint:result.fingerprint,issues:result.issues.length,exportAllowed:result.exportAllowed}));
