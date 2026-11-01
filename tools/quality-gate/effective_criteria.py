"""Versioned criteria projection. Preserve the exact v3 evidence artifact.
The v4 projection is a pre-cohort design amendment, never measured acceptance.
"""
import copy,gzip,hashlib,json
BASE_SHA='e2183e74492a4cb61338f8a691a51f23e7af2205fb9148ae6f6b2c138311aa54'
AMENDMENT_SHA='cd44b64eae8ffcda23291042f474cc911e58a5b9a252ec6b60ad1787fc312236'
ACTIVE_VERSION='v4'
# Identity binds exact original bytes and the exact frozen amendment, not a
# mutable summary. Collector and projection source hashes are pinned separately.
ACTIVE_DIGEST=hashlib.sha256((BASE_SHA+':'+AMENDMENT_SHA).encode()).hexdigest()
def load(root,version=ACTIVE_VERSION):
 if version not in ('v3','v4'):raise ValueError('Unknown criteria version')
 raw=gzip.decompress((root/'tools/quality-gate/criteria-v3.json.gz').read_bytes())
 if hashlib.sha256(raw).hexdigest()!=BASE_SHA:raise ValueError('Original v3 changed')
 result=json.loads(raw)
 if version=='v3':return result
 raw_amend=(root/'tools/quality-gate/criteria-v4-amendment.json').read_bytes()
 if hashlib.sha256(raw_amend).hexdigest()!=AMENDMENT_SHA:raise ValueError('Frozen v4 amendment changed')
 amend=json.loads(raw_amend);result['version']='v4';result['status']='설계 목표 · 실제 검수 미완료';result['amendment']=amend;result['projectionStatus']='v4 gate connected; actual evidence unmeasured'
 result['historicalDesignAuditV3']=result.pop('designAudit',None)
 for s in result['stages']:
  s['_criteriaDigest']=ACTIVE_DIGEST;s['_criteriaVersion']='v4'
  if s['id']>=31:s['measurementClassification']={'jumps':'reference','drops':'reference'}
 s=next(s for s in result['stages'] if s['id']==40);d=s['design'];r=amend['stage40']['required']
 for field,key in [('rounds','rounds'),('enemies','uniqueEnemyBudget'),('requiredEngagements','requiredEngagements'),('simultaneous','simultaneousParticipants'),('enemyActions','effectiveEnemyActions'),('enemyAttackPctHP','enemyAttackPctHP'),('clearRate','generalPolicyClearRate')]:d[field]=r[key]
 d['majorBossCount']=1;d['roundBudget']['target']=[18,20];d['roundBudget']['hardMax']=20
 d['miniboss'].update(count=[2,2],mandatoryCount=2,exposureTarget=[2,2],killRounds=[3,5],variants=['고정표적 결박·대응·노출','고정표적 곡사·재배치·노출'])
 d['boss']=copy.deepcopy(amend['stage40']['majorBoss']);d['requiredUniqueEnemyBudget']=[42,42];d['requiredSimultaneousParticipants']=[8,10];d['finaleSafetyRequirements']=copy.deepcopy(r)
 s['gimmick']='포구 최종 방어와 조수 변화 → 부상자2명 실제 배/보행2명 높은길 → 안전 재회와13/11/2결산.'
 s['winCondition']='전체 고유 위협42명 해소·별도 주요보스1/중간보스2 포함 → 주민4명 실제 귀환 → 기존7명 증거와13명 결산 → 생존 파티 안전 출구.'
 d['spatialType']='복합형 포구 방어·조수 전투·배/고지 병렬 귀환'
 d['reason']='기존의 다채로운 지형과 실제 귀환을 보존하며 전투를 피날레로 강화한다. 단순 HP·빈 대기·강제 왕복으로 분량을 늘리지 않는다.'
 d['verticalRoute']['exception']='점프/아래점프 횟수는 참고값. 실제 지지·도달·유용한 고저차와 경로는 필수이며 기존 공간 다양성을 없애지 않는다.'
 d['objectivePressure']['reason']='전투 중 예고·위치·역할 대응 압력. 위협 해소 뒤 귀환/재회/결산에는 새 적·보스·추격·강제 대기를 추가하지 않는다.'
 d['enemyPlan']=[{'role':'포구 전위·사격·고저차 지원','behavior':'기존 지지면을 쓰는 국소 역할군','status':'설계 목표'},{'role':'중간보스2','behavior':'결박/곡사 예고, 실제 대응과 노출','status':'설계 목표'},{'role':'별도 주요보스1','behavior':'기존 폐선 보스와 다른 개체. 실제 패턴·대응·조수 위치 선택','status':'설계 목표'}]
 d['growthPressure']['enemyResponse']='포구 최종 방어의 주요보스·중간보스·조수·역할 대응으로 성장 압력을 높이고, 위협 해소 뒤 실제 귀환은 안전하게 유지한다.'
 d['pacingChanges']=['전체18–20R에 전투·이동·조수·귀환을 모두 포함한다. 빈 대기/왕복으로 하한을 맞추지 않는다.']
 d['encounterTiming']='초기+유한 고유 총예산42. 실제 동시 교전 참여8–10, 유효 적 행동6–7. 안전 귀환 뒤 적 행동·증원0.'
 s['tactics']='전열 유지, 적 상성에 맞는 기예, 고저차·경로 선택, 보스 예고 대응과 노출 공략.'
 s['varianceReason']='최종 전투의 상승 압력과 전투 뒤 안전한 귀환을 분리한다.'
 s['proposedChanges']=[d['reason'],d['encounterTiming'],'이 변경은 기존 v3의짧은 전투 예외를 명시적으로 대체한다. 과거 검사를 새 버전 합격으로 바꾸지 않는다.']
 for m in s['specialMetrics']:
  if m['metric']=='짧은 호송':m.update(metric='최종 방어와 안전 귀환',target='전체18–20R·주요보스1·중간보스2·귀환후적행동0',reason='보스전은 강화하되 위협 해소 뒤 귀환은 안전하게 유지한다.')
  elif m['metric']=='성장 대비 교전 압력':m['target']='유효 적 행동6–7·동시 교전 참여8–10·일반 공격 피해24–30%'
  elif m['metric']=='기존 전멸계약 보존':m['target']='전체 고유 위협42해소, 주요보스1/중간보스2 별도 집계, 귀환 전 quiet100%'
 result['macro']['version']='v4';result['macro']['storyExceptions']['40']='주요보스 포함 최종 방어 후 보호된 실제 귀환·결산'
 for act in result['macro']['acts']:
  if act['act']==4:act.update(minibossCount=[11,13],minibossStages=[8,8])
 for row in result['macro'].get('roundChanges',[]):
  if row['id']==40:row.update(oldRounds=[8,11],newRounds=[18,20],reason='Explicit v4 finale amendment')
 result['criteriaClassification']['precedence']='v4 amendment supersedes v3 only at explicitly listed fields. Stage31–40 jump/drop counts are reference-only; support, diversity, safety and art remain required.'
 for container,key in [(result['macro'],'essentialCriteria'),(result['criteriaClassification'],'essential')]:
  for item in container[key]:
   if item['key']=='space':item['rule']='수직/복합 유형·실제 지지·필수 고도 활용·경로 유용성.31–40장 점프/아래점프 단순 횟수는 참고.'
 result['criteriaClassification']['reference'].append('31–40장 점프/아래점프 횟수(원래 범위 보존)')
 result['measurementDefinitionsV4']={'uniqueEnemyBudget':'Initial plus finite distinct enemy IDs; no repeats or omitted spawns.','peakRoundParticipants':'Maximum per-round distinct enemy union: player damage contacts, effective enemy damage, or verified meaningful enemy approaches. Not actors merely alive or on-screen. Diagnostic only; never substituted for simultaneous participation.','enemyActions':'Existing conservative effective-action definition retained; empty attacks/telegraphs alone do not inflate it.'}
 result['designAudit']={'version':'v4','status':'target arithmetic only; not play evidence','act4TargetCenters':{k:sum(sum(s['design'][k])/2 for s in result['stages'] if s['act']==4)/10 for k in ['rounds','clearRate','enemyActions','enemyAttackPctHP']},'preservedChecks':['Act3→4 pressure rise','V/C spatial diversity','20R hard cap','Actual image and play review']}
 return result
