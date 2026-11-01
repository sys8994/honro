/** Assemble the reviewed Stage31 evidence without duplicating world assets.
 * Run only with the separately inspected files from the named immutable runs. */
import fs from 'node:fs';import {createHash} from 'node:crypto';
import {createManifest} from './package-manifest.mjs';
const draft=process.argv[2];if(!draft)throw Error('Usage: finalize-direct-evidence.mjs reviewed-draft.json');
const p=JSON.parse(fs.readFileSync(draft)),dir='tools/stage31/evidence/direct-20261101/',id='stage-31';
const read=n=>JSON.parse(fs.readFileSync(dir+n));const card=read('card.json'),focused=read('focused-probes.json'),objective=read('objective-probe.json'),summary=read('play-summary.json');
if(summary.rounds!==15||summary.partyDeaths!==0||summary.enemyKills!==34||summary.sourceCommit!=='ab25208c6a0e6c846e78521441d82463f22fa6f0')throw Error('Unexpected reviewed play evidence');
const evidence=(name,viewKind)=>({path:'evidence/direct-20261101/'+name,viewKind,sha256:createHash('sha256').update(fs.readFileSync(dir+name)).digest('hex')});
const review=(kind,observation,criteria,files)=>({kind,fingerprint:card.candidateFingerprint,verdict:'pass',reviewedAt:'2026-11-01',observation,criteria:Object.entries(criteria).map(([id,observation])=>({id,result:'pass',observation})),evidence:files.map(([name,view])=>evidence(name,view))});
p.production.cards[id]=card.card;p.production.probeResults??={};p.production.probeResults[id]=[...focused.results,objective];
p.production.reviews[id]=[
 review('structure-and-routes','실제 전체 화면, 기존3/30장 화면, 경로 검사와 정상15턴 플레이를 함께 확인했다. 이미지의 길만 보고 연결을 승인하지 않았다.',{
 S1:'수면 아래 암반과 목재 지지 구조가 연결되며, 최대 축소에서도 밑동이 공중에서 잘린 사각 덩어리로 끝나지 않는다.',
 S2:'상층 아치와 아래쪽 물가가 서로 다른 고도·사선을 제공한다. 실제 플레이에서 상층 휘겸/소단과 아래쪽 설오/담허가 분리된 경로를 사용했고 승선 때 합류했다.',
 S3:'입구 이동·사격은 현재 엔진 입력 검사로, 선착장 경사·하강·배 갑판은 새 플레이의 실제 키 입력과 접지 좌표로 확인했다. 잘못된 추가 점프·발판 밖 하강은 실패 기록에 남겼다.',
 S4:'실제3장과30장 화면을 확인했다. 기존 캐릭터 비율과 HUD를 유지하면서4막에 승인된 더 풍부한 절벽·해안 구성과 푸른 색조를 적용한 차이를 확인했다.'},[['overview.jpg','overview'],['reference-3.jpg','reference'],['reference-30.jpg','reference'],['play-summary.json','measurement']]),
 review('art-and-readability','전체·일반·확대 화면에서 바위 면, 목재 구조, 보행면, 인물과 사격 표시를 직접 비교했다. 노드 수로 미술을 승인한 것이 아니다.',{
 A1:'푸른 새벽 해안 원경과 낮은 채도의 바위 그림자가 유지된다. 공통 인물·아이콘·HUD는 기존3/30장과 이어지며 지역별 색과 지형 밀도 차이는 의도적이다.',
 A2:'큰 암면과 보행 ledge, 돌계단, 교량/선착장의 기둥과 대각 지지가 읽힌다. 별도 직사각 슬랩이나 원경의 과도한 미세 무늬로 바꾸지 않았다.',
 A3:'일반 배율에서 동행의 녹색 표식과 적의 붉은 표식, 발사 궤적이 보행면에서 구분된다. 확대에서도 보행 경계가 중복 반투명 띠로 흐려지는 양상이 보이지 않는다.',
 A4:'식생은 길 가장자리를 설명하고 중앙의 아치 개구부와 사선을 막지 않는다. 스테이지 바깥 바다는 연결된 공간이며 내부를 장식으로 무작정 채우지 않았다.'},[['normal.jpg','normal'],['close.jpg','close'],['fresh-first-shot.png','normal']]),
 review('camera-and-state','최대 축소·양 끝·모바일 세로/가로를 직접 확인했다. 초기 캡처의 선착장 카메라는 도입 연출이므로 조작 가능 시야 증거와 구분했다.',{
 C1:'도입 카메라가 배와 위협을 소개한 뒤 실제 첫 발사 화면에는 동행과 첫 교전군이 함께 보인다. 선착장 연출 화면을 플레이어 시작 시야라고 잘못 표시하지 않았다.',
 C2:'최대 축소와 좌우 끝에서 배경이 투명하게 비거나 지형 밑동이 사각형으로 잘리지 않는다. 좌우 비플레이 영역은 해안의 바다와 하부 암반으로 이어진다.',
 C3:'390×844와844×390에서 하단 조작/수치 영역과 지형의 구분을 확인했다. 기존 획득 토스트는 상단을 잠시 덮으며, 이 자료는 실기기 터치 성능 검증을 뜻하지 않는다.',
 C4:'실제 새 플레이에서 배가 도착한 뒤 네 명의 발이 y3366 갑판에 접지하고, 그림의 갑판/수면과 일치했다. E 입력 이후 정상 결과 화면이 나타났다.'},[['min-zoom.jpg','min-zoom'],['mobile.jpg','mobile'],['mobile-landscape.jpg','mobile-landscape'],['left-edge.jpg','left-edge'],['right-edge.jpg','right-edge'],['fresh-party-on-board.png','state-change'],['camera-captures.json','measurement']]),
 review('final-integration','현재 코드의 새31장 입장부터 동일 Chromium 컨텍스트에서 전투·승선·클리어를 완료했다. 통제된 한 번의 성공을 일반 사용자 성공률로 바꾸지 않는다.',{
 F1:'일반 이동·점프·하강·스킬·상호작용 입력으로15턴,34명 처치,네 명 생존,정상 승선을 확인했다. 위치/HP/처치/승리 플래그를 직접 주입하지 않았다. 앞선1–30장 완료는 명시된 합성 입장 조건이다.',
 F2:'네 교전군 모두 실제 발사 기록이 남았다. 발사한 서로 다른 적은 서쪽입구4,교차사격7,능선7,귀환물가4명이며, 표본 위치 변화와 경고 화면도 확인했다. 이 수치는 명중 횟수나 역할별 재미 점수가 아니다.',
 F3:'지도/참조 자산 지문과 현재 런타임 SHA가 집중 검사·목표 검사에 일치한다. 화면/통계 파일은 원본 CI 산출물에서 가져왔으며 최종 빌드가 다시 해시를 검사한다.',
 F4:'이전20턴 초과,14턴4인생존 중단,20턴 전투 뒤 선택 실패를 숨기지 않았다. 최종 성공에도 계획 위력과0.05 이상 다른 발사가1회 있었다. 전체4막·실기기 성능·사람의 재미/클리어 확률을 합격으로 확대하지 않는다.'},[['fresh-first-shot.png','normal'],['fresh-outcome.png','outcome'],['play-summary.json','measurement'],['encounter-observations.json','measurement'],['objective-probe.json','measurement']])
];
const manifest=createManifest(p);manifest.reviewScope='Stage31 only; no approval of the other Act4 stages or deployment';
fs.writeFileSync('tools/stage31/production-package.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({bytes:fs.statSync('tools/stage31/production-package.json').size,fingerprint:card.candidateFingerprint,scope:manifest.reviewScope}));
