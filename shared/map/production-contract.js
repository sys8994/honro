(function(G){'use strict';
// Fixed production rules. A map cannot lower these rules with per-map flags.
// Drafts may be invalid; production export is never inferred from a render.
const VERSION=1,roles=Object.freeze(['vanguard','pursuer','ranged-support','overwatch','area-denial','objective-guard','ambush']);
const reviews=Object.freeze(['structure-and-routes','art-and-readability','camera-and-state','final-integration']);
const reviewViews=Object.freeze({'structure-and-routes':['overview'],'art-and-readability':['normal','close'],'camera-and-state':['min-zoom','mobile','left-edge','right-edge'],'final-integration':['normal']});
const reviewCriteria=Object.freeze({
 'structure-and-routes':Object.freeze({S1:'전체 지형과 맵 바깥이 같은 지질로 연결되는가?',S2:'선언한 주경로·대안·퇴로가 실제 다른 이동·사격 선택을 만드는가?',S3:'그림 속 길/높이가 아니라 실제 충돌과 동선으로 구현됐는가?',S4:'기존 참조 장의 실제 화면·구현과 비교했는가?'}),
 'art-and-readability':Object.freeze({A1:'기존 게임의 미술 체계와 해당 장소의 색감이 이어지는가?',A2:'큰 단색 면·반복 장식으로 대신하지 않고 지형·구조물 접지가 보이는가?',A3:'동행·적·목표·조준선이 실제 플레이 거리에서 구분되는가?',A4:'장식과 여백이 장소를 설명하며 전술 지형을 가리거나 오인시키지 않는가?'}),
 'camera-and-state':Object.freeze({C1:'실제 첫 시점과 일반 이동 시점에서 길과 위협을 판단할 수 있는가?',C2:'최대 축소와 좌우 끝에서 절단·공백·부유가 없는가?',C3:'모바일 세로/가로 화면에서 조작과 대상이 가려지지 않는가?',C4:'이동·배·물·기믹 상태 변화 뒤에도 그림과 충돌이 일치하는가?'}),
 'final-integration':Object.freeze({F1:'정상 이동·발사·상호작용으로 해당 장의 목표까지 진행했는가?',F2:'각 교전군이 문서상의 이름뿐 아니라 실제 지형에서 역할을 수행했는가?',F3:'검수한 최종 소스·에셋·관측 파일이 내보낼 내용과 같은가?',F4:'실패·미확인·부분 구현을 숨기거나 전체 합격으로 확대하지 않았는가?'})
});
const rules=Object.freeze([
 ['P01','기존 장의 실제 구현을 참조하고 보존할 사건·동행·목표를 명시한다.'],
 ['T01','공통 v6 지형 원본·충돌 투영·렌더러를 사용한다. 별도 더미 렌더러를 만들지 않는다.'],
 ['T02','플레이 영역 내부에 지하 끝까지 내려가는 노출 수직 절단면을 남기지 않는다.'],
 ['T03','주경로·대안 경로와 접점은 실제 지지면에 연결한다. 그림만 있는 길은 경로가 아니다.'],
 ['E01','모든 적은 실제 지지면 또는 명시한 공중 공간과 전투 역할을 가진다.'],
 ['E02','역할 군집·여백·대상 구역을 명시한다. 등간격과 동일한 두 마리 조합 반복으로 채우지 않는다.'],
 ['E03','아군·주민·필수 상호작용 면을 적의 몸으로 잠그지 않는다.'],
 ['A01','공통 에셋과 지형 근경/원경 체계를 재사용한다. 예외 에셋은 별도 사유를 남긴다.'],
 ['V01','전체·일반·확대·최대축소·모바일·좌우 끝을 실제 공통 렌더러로 확인한다.'],
 ['V02','동선·사격 차이·적의 실효 행동·목표 진행은 실제 엔진으로 확인한다.'],
 ['V03','서로 다른 세 집중 미술 검수와 최종 종합 검수를 기록한다. 수정하면 이전 증거는 만료된다.'],
 ['V04','자동 검사는 미관·재미·사용자 승인이 아니다. 미확인 항목을 합격으로 표시하지 않는다.']
].map(([id,text])=>Object.freeze({id,text})));
const copy=v=>JSON.parse(JSON.stringify(v)),finite=Number.isFinite;
function stable(v){if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';return JSON.stringify(v);}
function source(project,id){const s=project.stages.find(v=>v.id===id);if(!s)throw Error('Stage not found: '+id);const ids=new Set([...(s.elements||[]),...(s.environment?.placements||[])].map(v=>v.assetId));return stable({version:VERSION,stage:s,assets:project.library.filter(a=>ids.has(a.id)),card:project.production?.cards?.[id]||null});}
function fingerprint(project,id){const text=source(project,id);let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return 'draft-v1-'+(h>>>0).toString(16)+'-'+text.length;}
function begin(input,id){const p=copy(input),s=p.stages.find(v=>v.id===id);if(!s)throw Error('Stage not found');p.production??={version:VERSION,cards:{},reviews:{}};if(p.production.version!==VERSION)throw Error('Unsupported production contract');if(p.production.cards[id])return p;
 const content=G.HONRO_CONTENT.stages.find(v=>v.id===s.metadata?.stageId),story=content?Object.fromEntries(['id','requires','objective','goal','steps','playableRoster'].filter(k=>content[k]!==undefined).map(k=>[k,copy(content[k])])):null;
 p.production.cards[id]={intent:'',referenceStages:[],budget:null,preserve:{objectiveIds:(s.objectives||[]).map(v=>v.id),eventIds:(s.events||[]).map(v=>v.id),partyIds:s.units.filter(v=>v.team==='player').map(v=>v.id),story},routes:[],encounters:[],assetExceptions:[],cameraViews:[],requiredProbes:[]};p.production.reviews[id]=[];return p;}
function audit(project,id){const s=project.stages.find(v=>v.id===id),issues=[],add=(rule,text,objectId=null)=>issues.push({rule,severity:'block',text,objectId});if(!s)throw Error('Stage not found');
 for(const issue of G.HonroMaps.validate({...project,activeStageId:id,stages:[s]}))if(issue.level==='err')add('T01','공통 맵 스키마: '+issue.text);
 const card=project.production?.cards?.[id];if(project.production?.version!==VERSION||!card){add('P01','제작 계약이 없습니다. 기존 장과의 비교·설계 카드를 먼저 작성하십시오.');}
 if(card){if(!card.intent?.trim())add('P01','전투의 핵심 질문이 비어 있습니다.');if(!Array.isArray(card.referenceStages)||!card.referenceStages.length||card.referenceStages.some(n=>n===id||!project.stages.some(v=>v.id===n)))add('P01','실제로 비교할 기존 장을 지정하십시오.');
  for(const [key,collection]of [['objectiveIds','objectives'],['eventIds','events'],['partyIds','units']]){if(!Array.isArray(card.preserve?.[key])){add('P01','보존 계약 누락: '+key);continue;}for(const target of card.preserve[key])if(!(s[collection]||[]).some(v=>v.id===target))add('P01','보존 대상이 삭제됐습니다: '+target,target);}
  if(card.preserve?.story){const current=G.HONRO_CONTENT.stages.find(v=>v.id===card.preserve.story.id);for(const [key,value]of Object.entries(card.preserve.story))if(stable(current?.[key])!==stable(value))add('P01','원래 스토리/진행 계약이 변경됐습니다: '+key);}
 }
 if(!s.terrainBounds||s.terrainDomainVersion!==1)add('T01','단일 확장 지형 v6가 아닙니다.');
 for(const error of G.HonroTerrainDomain.validate(s))add('T01',error.text);
 let compiled;try{compiled=G.HonroMaps.compile(s,project);}catch(e){add('T01','공통 컴파일 실패: '+e.message);return{stageId:id,fingerprint:fingerprint(project,id),issues,machinePass:false,qualityApproved:false};}
 for(const t of compiled.worldTerrain||[]){if(t.oneWay)continue;const ps=t.vertices;for(let i=0;i<ps.length;i++){const a=ps[i],b=ps[(i+1)%ps.length];if(Math.abs(a.x-b.x)<.01&&a.x>1&&a.x<s.width-1&&Math.max(a.y,b.y)>=s.terrainBounds?.bottom-1&&Math.abs(a.y-b.y)>s.height){add('T02','지하 끝까지 내려가는 내부 수직 절단면: x='+Math.round(a.x),t.id);}}}
 const surface=(x,y,id)=>G.HonroMapEngine.surfaceY(compiled.terrain.filter(t=>!id||t.id===id),x,y);
 const enemy=s.units.filter(u=>u.team==='enemy'),players=s.units.filter(u=>u.team==='player');
 const roster=new Map();for(const e of card?.encounters||[]){if(!e.id||!e.purpose?.trim()||!e.targetZone||!['x','y','w','h'].every(k=>finite(e.targetZone[k]))||e.targetZone.w<=0||e.targetZone.h<=0)add('E02','교전군 목적·실제 대상 구역이 필요합니다.',e.id);
  for(const member of e.members||[]){if(roster.has(member.id))add('E02','적이 여러 군집에 중복 지정됐습니다.',member.id);roster.set(member.id,{...member,group:e.id});}
 }
 for(const u of enemy){const r=roster.get(u.id);if(!r||!roles.includes(r.role))add('E01','전투 역할이 없는 적입니다.',u.id);const spec=G.HonroWorld.archetypes[u.kind];if(spec?.flying){if(!r?.airVolume||!['x','y','w','h'].every(k=>finite(r.airVolume[k])))add('E01','공중 적의 이동·공격 여유 공간이 없습니다.',u.id);}else{const hit=surface(u.x,u.y,r?.supportId);if(!r?.supportId)add('E01','적이 사용할 실제 지지면을 지정하지 않았습니다.',u.id);else if(!hit||Math.abs(hit.y-u.y)>8)add('E01','선언한 지지면에 접지하지 않은 적입니다.',u.id);}}
 for(const id of roster.keys())if(!enemy.some(u=>u.id===id))add('E02','군집에 존재하지 않는 적 ID가 있습니다.',id);
 for(const group of card?.encounters||[]){const actual=s.encounters.find(v=>v.id===group.id),ids=(group.members||[]).map(v=>v.id);if(!actual||actual.unitIds.length!==ids.length||ids.some(id=>!actual.unitIds.includes(id))||ids.some(id=>enemy.find(u=>u.id===id)?.encounterGroup!==group.id))add('E02','역할 문서의 군집과 실제 엔진 배치가 일치하지 않습니다.',group.id);}
 // Use actual production body dimensions rather than guessed visual radii.
 let body=[];try{const p=G.HonroMaps.profileFor(s);G.HonroEquipment?.fresh(p);const b=G.HonroMaps.createBattle(s,project,p);body=b.units;}catch(e){add('E03','실제 몸 크기 컴파일 실패: '+e.message);}
 const budget=card?.budget,active=s.initialState?.honroActiveLimit??G.HONRO_CONTENT.stages.find(v=>v.id===s.metadata?.stageId)?.active;
 if(!budget||!['initial','elites','activeLimit','finiteSpawnCount'].every(k=>Number.isInteger(budget[k])&&budget[k]>=0)||!budget.rationale?.trim())add('E02','초기 수·정예·동시 행동·유한 증원 예산과 근거가 필요합니다.');
 else{if(budget.initial!==enemy.length||budget.elites!==body.filter(u=>u.side===1&&u.elite).length||budget.activeLimit!==active)add('E02','선언한 전투 예산과 실제 초기 편성/행동 상한이 다릅니다.');}
 for(let i=0;i<body.length;i++)for(let j=i+1;j<body.length;j++){const a=body[i],b=body[j];if(a.dead||b.dead||a.flying||b.flying)continue;const ra=a.r||18,rb=b.r||18;if(Math.abs(a.x-b.x)<ra+rb-3&&Math.abs(a.y-b.y)<Math.min(a.h||66,b.h||66)-3)add('E03','초기 몸이 겹칩니다: '+a.id+' / '+b.id,a.id);}
 const sorted=enemy.slice().sort((a,b)=>a.x-b.x);if(sorted.length>=5){const gaps=sorted.slice(1).map((u,i)=>u.x-sorted[i].x);if(Math.max(...gaps)-Math.min(...gaps)<8)add('E02','5체 이상이 사실상 등간격으로 배치됐습니다.');}
 const signatures=(card?.encounters||[]).filter(e=>e.members?.length===2).map(e=>e.members.map(m=>{const u=enemy.find(v=>v.id===m.id);return u?.kind+':'+m.role;}).sort().join('|'));
 if(signatures.some(s=>signatures.filter(v=>v===s).length>=3))add('E02','같은 두 마리 역할 조합이 세 교전군 이상 반복됩니다.');
 const routes=card?.routes||[];if(!routes.some(r=>r.role==='primary'))add('T03','실제 주경로가 없습니다.');
 for(const r of routes){if(!r.id||!r.purpose?.trim()||!Array.isArray(r.points)||r.points.length<2){add('T03','경로의 목적과 두 개 이상의 지지점이 필요합니다.',r.id);continue;}for(const p of r.points){const hit=surface(p.x,p.y,p.supportId);if(!finite(p.x)||!finite(p.y)||!p.supportId||!hit||Math.abs(hit.y-p.y)>8)add('T03','경로 지점이 실제 지지면에 없습니다.',r.id);}}
 const refs=new Set((card?.referenceStages||[]).flatMap(id=>{const r=project.stages.find(s=>s.id===id);return[...(r?.elements||[]),...(r?.environment?.placements||[])].map(e=>e.assetId);}));
 for(const e of s.elements||[]){if(!refs.has(e.assetId)&&!(card?.assetExceptions||[]).some(a=>a.assetId===e.assetId&&a.reason?.trim()))add('A01','기존 참조 장에 없는 에셋의 사용 사유가 없습니다.',e.id);}
 const types=new Set((card?.cameraViews||[]).map(v=>v.kind));for(const kind of ['overview','normal','close','min-zoom','mobile','left-edge','right-edge'])if(!types.has(kind))add('V01','필수 화면이 지정되지 않았습니다: '+kind);
 for(const v of card?.cameraViews||[])if(!v.id||![v.x,v.y,v.scale,v.width,v.height].every(finite)||v.scale<=0||v.width<240||v.height<240)add('V01','잘못된 카메라 조건입니다.',v.id);
 const views=card?.cameraViews||[],normal=views.find(v=>v.kind==='normal'),close=views.find(v=>v.kind==='close');if(normal&&close&&close.scale<=normal.scale)add('V01','확대 화면이 일반 화면과 같거나 더 축소돼 있습니다.');
 for(const v of views){if(v.kind==='mobile'&&v.height<=v.width)add('V01','모바일 세로 화면 조건이 아닙니다.',v.id);if(v.kind==='overview'&&(v.x-v.width/(2*v.scale)>0||v.x+v.width/(2*v.scale)<s.width))add('V01','전체 화면이 장의 좌우 전체를 포함하지 않습니다.',v.id);if(v.kind==='left-edge'&&v.x-v.width/(2*v.scale)>=0)add('V01','좌측 끝 바깥을 확인하지 않는 화면입니다.',v.id);if(v.kind==='right-edge'&&v.x+v.width/(2*v.scale)<=s.width)add('V01','우측 끝 바깥을 확인하지 않는 화면입니다.',v.id);if(v.kind==='min-zoom'&&Math.abs(v.scale-G.HonroBounds.zoomLimits(v.width).min)>.01)add('V01','실제 게임 최소 줌 조건과 다릅니다.',v.id);}
 for(const kind of ['route','shot','enemy-action','objective'])if(!(card?.requiredProbes||[]).some(v=>v.kind===kind&&v.id&&v.claim?.trim()))add('V02','실제 엔진 확인 항목 누락: '+kind);
 return{stageId:id,fingerprint:fingerprint(project,id),issues,machinePass:issues.length===0,qualityApproved:false,enemyCount:enemy.length,partyCount:players.length};
}
function releaseStatus(project,id){const result=audit(project,id),receipt=project.production?.reviews?.[id]||[],missing=[];for(const kind of reviews){const r=receipt.find(r=>r.kind===kind&&r.fingerprint===result.fingerprint);if(!r||r.verdict!=='pass'||!r.observation?.trim()||!r.evidence?.length||r.evidence.some(e=>!e.path||!e.sha256||!/^[a-f0-9]{64}$/.test(e.sha256))||reviewViews[kind].some(view=>!r.evidence.some(e=>e.viewKind===view))||Object.keys(reviewCriteria[kind]).some(id=>!r.criteria?.some(c=>c.id===id&&c.result==='pass'&&c.observation?.trim())))missing.push(kind);}
 const probes=project.production?.probeResults?.[id]||[],missingProbes=[];for(const q of project.production?.cards?.[id]?.requiredProbes||[]){const p=probes.find(v=>v.id===q.id&&v.fingerprint===result.fingerprint);if(!p||p.result!=='pass'||p.runner!=='honro-production-engine-v1'||!p.observations?.length)missingProbes.push(q.id);}
 return{...result,missingReviews:missing,missingProbes,exportAllowed:result.machinePass&&missing.length===0&&missingProbes.length===0,qualityApproved:false};}
function assertExport(project,id){const r=releaseStatus(project,id);if(!r.exportAllowed)throw Error('제작용 내보내기 차단: '+[...r.issues.map(v=>v.rule+' '+v.text),...r.missingReviews.map(v=>'실제 검수 미확인/만료: '+v),...r.missingProbes.map(v=>'엔진 관측 미확인/만료: '+v)].join('\n'));return r;}
function placeEnemy(input,stageId,spec){const p=copy(input),s=p.stages.find(v=>v.id===stageId),card=p.production?.cards?.[stageId];if(!card)throw Error('제작 계약부터 시작하십시오.');if(!roles.includes(spec.role))throw Error('허용된 역할을 선택하십시오.');const group=card.encounters.find(v=>v.id===spec.groupId);if(!group)throw Error('교전 목적·구역을 먼저 작성하십시오.');if(s.units.some(v=>v.id===spec.id))throw Error('중복 유닛 ID');const terrain=G.HonroMaps.compile(s,p).terrain.find(t=>t.id===spec.supportId);if(!terrain)throw Error('실제 지지면을 선택하십시오.');const hit=G.HonroMapEngine.surfaceY([terrain],spec.x,spec.referenceY);if(!hit)throw Error('해당 x에 지지면이 없습니다.');const u=G.HonroUnits.record(spec.kind,spec.id,spec.x,hit.y,'enemy');u.encounterGroup=group.id;s.units.push(u);group.members.push({id:u.id,role:spec.role,supportId:terrain.id});let e=s.encounters.find(v=>v.id===group.id);if(!e){e={id:group.id,key:group.id,unitIds:[],behavior:'guard'};s.encounters.push(e);}e.unitIds.push(u.id);return p;}
const governed=(project,id)=>id==='stage-31'||project.stages.find(s=>s.id===id)?.metadata?.stageId===31||!!project.production?.cards?.[id];
function bankFromProfile(input,stageId,spec){const p=copy(input),s=p.stages.find(v=>v.id===stageId);if(!p.production?.cards?.[stageId])throw Error('제작 계약부터 시작하십시오.');const ps=spec.profile;if(!spec.id||!Array.isArray(ps)||ps.length<3||ps.length>512||ps.some((v,i)=>!finite(v.x)||!finite(v.y)||v.y<0||v.y>=s.height-32||i>0&&v.x<=ps[i-1].x)||ps[0].x!==0||ps.at(-1).x!==s.width)throw Error('둑 윤곽은 0부터 맵 폭까지 이어지는 유효한 단면이어야 합니다.');if(!['earth','rock','mud'].includes(spec.material))throw Error('허용된 공통 지면 재질을 선택하십시오.');if(s.terrains.some(t=>t.id===spec.id))throw Error('기존 지형을 암묵적으로 덮어쓸 수 없습니다. 명시적인 초안 편집으로 제거한 뒤 생성하십시오.');
 const terrain={id:spec.id,type:'solid',baseMaterial:spec.material,oneWay:false,breakable:false,points:[...copy(ps),{x:s.width,y:s.height},{x:0,y:s.height}],properties:{honroProductionBank:true},detail:{roughness:0,spacing:24,optimizeEpsilon:0}};
 const temporary={...copy(p),stages:[{...copy(s),terrains:[terrain]}]};for(const key of ['terrainBounds','playBounds','terrainDomainVersion'])delete temporary.stages[0][key];const authored=G.HonroTerrainDomain.author(temporary).stages[0];s.terrains.push(authored.terrains[0]);for(const key of ['terrainBounds','playBounds','terrainDomainVersion'])s[key]=copy(authored[key]);return p;}
function placeScenery(input,stageId,spec){const p=copy(input),s=p.stages.find(v=>v.id===stageId),card=p.production?.cards?.[stageId],a=p.library.find(v=>v.id===spec.assetId);if(!card||!a)throw Error('제작 계약과 실제 공통 에셋이 필요합니다.');const referenceAssets=new Set(card.referenceStages.flatMap(id=>{const st=p.stages.find(s=>s.id===id);return[...(st?.elements||[]),...(st?.environment?.placements||[])].map(v=>v.assetId);}));if(!referenceAssets.has(a.id)&&!card.assetExceptions.some(e=>e.assetId===a.id&&e.reason?.trim()))throw Error('기존 미술에서 가져온 에셋이 아니면 사용 사유를 먼저 기록하십시오.');const range=a.reference?.scaleRange||[.1,4],scale=spec.scale??1;if(!finite(scale)||scale<range[0]||scale>range[1])throw Error('에셋 제작 기준의 표시 크기를 벗어났습니다.');const terrain=G.HonroMaps.compile(s,p).terrain.find(t=>t.id===spec.supportId),hit=terrain&&G.HonroMapEngine.surfaceY([terrain],spec.x,spec.referenceY);if(!hit)throw Error('장식의 실제 지지면이 없습니다.');if(!spec.id||s.elements.some(e=>e.id===spec.id))throw Error('장식 ID가 없거나 중복됐습니다.');s.elements.push({id:spec.id,assetId:a.id,x:spec.x,y:hit.y,scale,rotation:0,snap:false,depthLayer:'L1',layer:a.collision?.length?'prop':'back'});return p;}
G.HonroProductionContract=Object.freeze({version:VERSION,rules,roles,reviewKinds:reviews,reviewViews,reviewCriteria,governed,begin,audit,releaseStatus,assertExport,fingerprint,source,placeEnemy,bankFromProfile,placeScenery});
})(globalThis);
