import {actorCatalog} from '../actor-forge/catalog.mjs';

export const directIds=['minecart','picks','waterwheel','stoneLantern','resonance','echo','bellCluster','hoist','keeper'];
export function classify(G,u){
 if(u.honroObjectiveTarget)return 'target_'+u.id.replace(/bier-knot-[01]$/,'bier-knot');
 if(u.honroAct2||u.honroSpirit){if(directIds.includes(u.honroType))return u.honroType;}
 const actor=G.HonroActorVisual.kind(u)||G.HonroActorVisual.monsterKind(u)||G.HonroMonsterVisual.kind(u);if(actor)return actor;
 if(['beast','bat','crow','ghost','shade','lantern','warden','mourner'].includes(u.honroType))return 'legacy_'+(u.honroType==='beast'?u.honroVariant||'stag':u.honroType);
 if(u.summoned)return 'legacy_summon';
 return G.resolveRebuildCharacter(u)||'legacy_'+(u.cls||'archer');
}
export function inventory(G){
 const C=G.HONRO_CORE,rows=[],stages=[],by=new Map();
 const add=row=>{row.usage=[];row.aliases=[];rows.push(row);by.set(row.id,row);return row;};
 const unit=(extra)=>C.makeUnit(extra.cls||'knight',extra.side??1,0,0,{id:'catalog-'+(extra.honroType||extra.cls||'unit'),name:'도감 표본',h:110,r:25,hp:100,maxHp:100,angle:0,facing:1,...extra});
 for(const [cls,id] of Object.entries({archer:'seol_o',mage:'damheo',knight:'hwigyeom',occultist:'sodan'})){const a=G.HONRO_PARTY[id];add({id,name:a.name_ko,type:'주인공',layer:'현행 전용 벡터',excluded:true,unit:unit({cls,side:0,name:a.name_ko,h:92}),clips:Object.entries(a.animation.animations).map(([id,c])=>({id,duration:(c.duration_ms||1000)/1000,animated:c.keyframes.length>1})),source:'shared/assets/party/'+id+'.svg',renderer:'shared/runtime/art-dark.js',role:G.HONRO_CONTENT.hero[cls].title||'플레이어 동행'});}
 for(const [id,a]of Object.entries(G.HONRO_MONSTERS.assets)){const d=G.HonroWorld.archetypes[id];add({id,name:a.name,type:'몬스터',layer:'현행 전용 벡터',unit:unit({cls:d.cls,honroType:d.look,honroVariant:d.variant||id,side:1,h:d.h}),clips:Object.entries(a.clips).map(([id,c])=>({id,duration:c.duration,animated:c.tracks.some(t=>new Set(t.keys.map(k=>k[1])).size>1)})),source:'shared/assets/monsters/'+id+'.svg',renderer:'shared/runtime/monster-vector.js',role:d.intent||d.name});}
 for(const d of actorCatalog){const a=G.HONRO_ACTORS.assets[d.id];add({id:d.id,name:d.name,type:d.id.startsWith('summon_')?'소환':d.family==='object'||d.id==='colossus'?'목표·호환 보스':'동맹·주민',layer:'현행 전용 벡터',unit:unit({...d.unit,h:a.baseHeight,name:d.unit.name||d.name}),clips:Object.entries(a.clips).map(([id,c])=>({id,duration:c.duration,animated:c.tracks.some(t=>new Set(t.keys.map(k=>k[1])).size>1)})),source:'shared/assets/actors/'+d.id+'.svg',renderer:'shared/runtime/actor-vector.js',role:d.name});}
 for(const id of directIds){const d=G.HonroWorld.archetypes[id],u=unit({cls:d.cls,honroType:d.look,honroVariant:id,side:1,h:d.h,name:d.name});G.HonroAct2.configureEnemy(u,d);add({id,name:d.name,type:'2막 직접 그림',layer:'현행 Canvas 경로',unit:u,clips:[{id:'idle',duration:4,animated:id!=='stoneLantern'},...(['minecart','keeper'].includes(id)?[{id:'move',duration:1,animated:true}]:[])],source:'shared/runtime/act2-art.js',renderer:'shared/runtime/act2-art.js',role:d.intent});}
 for(const id of ['hound','boar','stag','bat','crow','ghost','shade','lantern','warden','mourner']){const main=by.get(id);add({id:'legacy_'+id,name:main.name+' · 구형',type:'호환 그림',layer:'도달 가능한 구형 분기',unit:{...main.unit,id:'legacy-'+id,side:0},clips:[{id:'idle',duration:4,animated:true},{id:'move',duration:1,animated:true}],source:'shared/runtime/art-dark.js',renderer:'shared/runtime/art-dark.js',role:'사용자 맵의 player 팀 몬스터',parent:id});}
 for(const cls of ['archer','mage','knight','occultist'])add({id:'legacy_'+cls,name:{archer:'구형 궁수',mage:'구형 술사',knight:'구형 무사',occultist:'구형 주술사'}[cls],type:'호환 그림',layer:'도달 가능한 구형 분기',unit:unit({cls,honroType:'compatibility',side:1}),clips:[{id:'idle',duration:4,animated:true},{id:'move',duration:1,animated:true}],source:'shared/runtime/art-dark.js',renderer:'shared/runtime/art-dark.js',role:'구 저장·runtimeTemplate/stageOverrides 기본 사람 분기'});
 add({id:'legacy_summon',name:'구형 소환혼 기본형',type:'호환 그림',layer:'도달 가능한 구형 분기',unit:unit({cls:'occultist',side:0,summoned:true,summonKind:'compatibility'}),clips:[{id:'idle',duration:4,animated:true}],source:'shared/runtime/art-dark.js',renderer:'shared/runtime/art-dark.js',role:'미등록 summonKind를 가진 구 저장·사용자 템플릿 fallback'});
 const use=(u,stage,route,path,extra={})=>{const id=classify(G,u),row=by.get(id);if(!row)throw Error('Uncatalogued renderer '+id+' '+JSON.stringify(u));const rec={stage,route,path,unitId:u.id,name:u.name,...extra};if(!row.usage.some(v=>JSON.stringify(v)===JSON.stringify(rec)))row.usage.push(rec);};
 for(let stage=1;stage<=30;stage++){
  const st=G.HONRO_CONTENT.stages[stage-1],p=C.defaults();p.recruited=G.HonroStageRules.stageParty(stage);for(const cls of p.recruited)p.heroes[cls].xp=G.HonroProgression.xpAt(G.HonroProgression.plan(stage).entryLevel);
  const b=G.HonroWorld.build(st,p,false,'archer','A01');G.HonroStageRules.sanitizeStageBattle(b);stages.push({id:stage,name:st.name,act:Math.ceil(stage/10)});
  b.units.forEach((u,i)=>{if(u.honroObjectiveTarget){const id=classify(G,u);if(!by.has(id)){const t=b.honroQuestTargets.find(t=>t.id===u.id);const context=Object.fromEntries(Object.entries(b).filter(([k])=>/Revision$/.test(k)||['width','height','honroStage','honroMap','honroState','honroNarrativeRevision','honroCustom'].includes(k)));add({id,name:u.id.startsWith('bier-knot-')?'상여 결박':u.name,type:'전투 목표',layer:'목표 전용 Canvas 경로',unit:structuredClone(u),context:structuredClone({...context,honroQuestTargets:[t]}),clips:[{id:'idle',duration:3,animated:u.id==='sodan-binding'}],source:'shared/runtime/quest-target-art.js',renderer:'shared/runtime/quest-target-art.js',role:'적대 유닛으로 전환된 파괴 목표 · 원래 지형/서사 그림을 그대로 사용'});}}use(u,stage,'초기 전투',`b.units[${i}]`);});
  Object.entries(b.honroStaging?.hidden||{}).forEach(([id,u])=>use(u,stage,'연출 공개',`b.honroStaging.hidden.${id}`));
  (b.honroConvoyActors||[]).forEach((u,i)=>use(u,stage,'호송 배우',`b.honroConvoyActors[${i}]`));
  if(stage===1)for(const row of rows.filter(r=>r.type==='호환 그림'&&r.parent)){
   const record=G.HonroUnits.record(row.parent,'catalog-'+row.id,0,0,'player');
   row.unit=structuredClone(G.HonroUnits.create(record,b,p,st));
  }
  if(stage===11){const engine=new C.Engine(structuredClone(b)),owner=engine.b.units.find(u=>u.side===0&&u.cls==='occultist'&&!u.summoned);for(const row of rows.filter(r=>r.type==='소환'))row.unit=structuredClone(engine.spawnSummon(owner,row.id.slice(7),owner.x,owner.y));}
  const map=G.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===stage);
  function scan(v,path){if(!v||typeof v!=='object')return;
   if(v.type==='spawn'||v.type==='sniperAmbush'||(v.kind&&G.HonroWorld.archetypes[v.kind]&&(v.count||v.n||Number.isFinite(v.x)))){const kind=v.kind||'human';if(G.HonroWorld.archetypes[kind]){const u=G.HonroWorld.createEnemy(b,st,200,kind,0,200,true);use(u,stage,'조건부 생성',path,{kind,condition:'설정 경로 확인 · 조건의 정상 완주 미실행'});if(v.eliteEvery||v.elite||v.honroDensityElite){u.elite=true;use(u,stage,'조건부 정예 생성',path,{kind});}}}
   if(v.type==='ally'&&v.role)use(G.HonroWorld.ally(b,st,'event-ally',v.role,200,200),stage,'사건 동맹 생성',path);
   if(v.kind&&G.HonroWorld.archetypes[v.kind]&&v.elite){const u=G.HonroWorld.createEnemy(b,st,200,v.kind,0,200,true);u.elite=true;use(u,stage,'정예 편성',path,{kind:v.kind});}
   for(const [k,q] of Object.entries(v))scan(q,path+'.'+k);
  }
  scan(map.meta,'HONRO_PROJECT.stages['+(stage-1)+'].meta');scan(map.encounters,'HONRO_PROJECT.stages['+(stage-1)+'].encounters');scan(map.initialState,'HONRO_PROJECT.stages['+(stage-1)+'].initialState');scan(map.events,'HONRO_PROJECT.stages['+(stage-1)+'].events');scan(map.metadata,'HONRO_PROJECT.stages['+(stage-1)+'].metadata');scan(st,'HONRO_CONTENT.stages['+(stage-1)+']');scan(b.honroEvents,'b.honroEvents');scan(b.honroMap,'b.honroMap');
  if(stage>=11&&stage<=20)scan(G.HonroAct2Plan.forStage(stage),'HonroAct2Plan.forStage('+stage+')');
  if(b.units.some(u=>u.honroEcho)){const u=unit({honroAct2:true,honroType:'picks'});use(u,stage,'2라운드 변형','shared/runtime/act2.js: honroEchoBorn → honroPossessed',{name:'잔향이 든 곡괭이',unitId:'echo → picks'});}
 }
 const summonModes={summon_stalker:['summonStalker','nightParade'],summon_lantern:['summonLantern'],summon_charger:['nightParade'],summon_warden:['summonWarden'],summon_eater:['summonEater'],summon_echo:['summonEcho'],summon_earthbound:['curseEarth'],summon_host:[]};
 for(const [id,modes] of Object.entries(summonModes)){const row=by.get(id);row.skills=Object.values(C.SKILLS).filter(s=>!s.enemyOnly&&modes.includes(s.mode)).map(s=>({id:s.id,name:s.name,mode:s.mode}));for(const stage of stages.filter(s=>G.HonroStageRules.stageParty(s.id).includes('occultist')))for(const skill of row.skills)row.usage.push({stage:stage.id,route:'기예 생성 가능',path:'HONRO_CORE.SKILLS.'+skill.id+' → '+skill.mode,name:skill.name,condition:'소단 편성 장 · 습득/장착 및 기예 조건 필요 · 정상 플레이 생성 관측과 구분'});}
 by.get('resonance').aliases.push('monkVessel → resonance (승려에게 붙은 혼)');by.get('bier_boss').aliases.push('8장 빈 상여 → bier_boss (장별 외부 연출 추가)');
 for(const row of rows){
  row.stages=[...new Set(row.usage.map(x=>x.stage))].sort((a,b)=>a-b);row.acts=[...new Set(row.stages.map(n=>Math.ceil(n/10)))];
  row.routes=[];
  if(row.usage.some(u=>u.route!=='기예 생성 가능'))row.routes.push({label:'캠페인 원본과 아래 사용처의 런타임 경로 (공통 저작/정규화 적용 후 수집)',file:'shared/build.mjs',token:'globalThis.HONRO_PROJECT='});
  if(row.id==='mourner'){row.routes.push({label:'허공터 cluster / precision 수련 표적에서 현재 생성',file:'shared/runtime/world.js',token:"['mourner',3000]"});row.usageState='현행 허공터 · 사용자 맵';}
  if(row.type==='소환'){row.routes.push({label:row.id==='summon_charger'?'돌격귀는 현행 선택 기예에서 직접 생성되지 않음. 구 summonCharger / summonHost / nightParade 투사체와 팩토리는 유지':row.id==='summon_host'?'보존된 summonHost 모드도 stalker + charger를 생성. host 자체는 구 저장·spawnSummon 도구 호환':'소단 기예 및 엔진 spawnSummon 생성',file:'shared/engine/src/engine.ts',token:row.id==='summon_host'?"p.mode==='summonHost'":'private spawnSummon'});row.usageState=['summon_host','summon_charger'].includes(row.id)?'호환 경로 확인 · 현행 기예 직접 생성 없음':'현행 동적 생성';}
  if(row.type==='소환'&&row.skills.length){row.routes.push({label:'현재 유효 기예: '+row.skills.map(s=>s.id+' '+s.name+' ('+s.mode+')').join(' / '),file:row.id==='summon_charger'?'shared/engine/src/engine.ts':'shared/engine/src/occultData.ts',token:row.id==='summon_charger'?"if(p.mode==='nightParade')":row.id==='summon_earthbound'?"update('O10'":row.id==='summon_stalker'?"update('O11'":row.id==='summon_lantern'?"update('O12'":row.id==='summon_warden'?"update('O13'":row.id==='summon_eater'?"update('O14'":"update('O15'"});}
  if(row.id==='summon_charger')row.routes.push({label:'O99는 과거 저장 투사체용이며 현재 선택 기예에서 제외',file:'shared/engine/src/occultData.ts',token:'O99 remains as an inaccessible historical definition'});
  if(row.type!=='소환')row.usageState=row.usageState||(row.usage.length?'캠페인 경로 확인':row.type==='호환 그림'?'사용자 맵·구 저장 도달 가능':'캠페인 미관측 · 도구/호환 확인');
  if(row.id==='legacy_mourner')row.routes.push({label:'side=0 상두꾼은 구형 human에서 소단으로 해석된 뒤 목 부분을 가리는 분기까지 도달',file:'shared/runtime/art-dark.js',token:"u.honroType==='mourner'"});
  if(row.type==='몬스터'||row.type==='2막 직접 그림'||row.type==='동맹·주민')row.routes.push({label:'Workshop 기본 팩토리·사용자 맵 작성 경로',file:'shared/map/units.js',token:'function catalog'});
  row.routes.push({label:'실제 그리기 경로',file:row.renderer,token:row.renderer.endsWith('act2-art.js')?(['resonance','echo'].includes(row.id)?'if(u.honroSpirit)':"kind==='"+row.id+"'"):'unitBody'});
  if(row.type==='호환 그림')row.routes.push({label:'팀·runtimeTemplate·stageOverrides를 보존하는 사용자 맵 팩토리',file:'shared/map/units.js',token:'function create'});
  if(row.id==='ally_daoist'||row.id==='ally_medium'){row.routes.push({label:'담허/소단 이름이면 주인공 그림. 사용자 맵 label을 바꾸면 이 자산을 사용',file:'shared/assets/rebuild-game-adapter.mjs',token:'resolveRebuildCharacter'});row.routes.push({label:'사용자 맵 label 덮어쓰기',file:'shared/map/units.js',token:'if(record.label)'});}
  if(row.id==='colossus')row.routes.push({label:'boss 플래그가 켜진 구 저장·사용자 템플릿. 캠페인 단독 신규 보스 미관측',file:'shared/runtime/actor-vector.js',token:"if(u.boss)return'colossus'"});
  if(row.id==='possessedGuard'||row.id==='possessedArcher'||row.id==='gateMaster'||row.id==='archerMaster')row.routes.push({label:'possessedGuard/Archer 정예는 gateMaster/archerMaster 그림으로 전환',file:'shared/runtime/monster-vector.js',token:'function species'});
  if(['echo','picks'].includes(row.id))row.routes.push({label:'잔향혼은 생성 뒤 2라운드가 지나면 곡괭이로 변형',file:'shared/runtime/act2.js',token:'b.round-u.honroEchoBorn>=2'});
  if(['resonance','echo','bellCluster'].includes(row.id))row.routes.push({label:'현형 전 공기 띠 / 현형 후 몸체를 Scene.unit에서 결정',file:'shared/runtime/act2-art.js',token:'G.HonroAct2.visible'});
 }
 return {rows,stages,scope:'최신 fresh 30장 초기·숨김·호송 배우와 조건부 설정/팩토리 전수 수집. 조건부는 정상 플레이 실현/완주와 구분. 모든 과거 개인 저장·사용자 맵을 보유하지 않으므로 전역 미사용 확정 0.',counts:{primary:rows.filter(r=>r.type!=='호환 그림'&&r.type!=='전투 목표').length,compatibility:rows.filter(r=>r.type==='호환 그림').length,targets:rows.filter(r=>r.type==='전투 목표').length,vector:rows.filter(r=>r.layer==='현행 전용 벡터').length,clips:rows.filter(r=>r.layer==='현행 전용 벡터').reduce((n,r)=>n+r.clips.length,0)}};
}
