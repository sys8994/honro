# 11장 P0 · 필수 퀘스트 단순화

필수 실제 행동을 **하부 피난처 주민에게 붙은 혼 분리 1회**로 줄였다. 구조한 뒤 기존 북쪽 단서 대사를 자동 기록한다. 서쪽/중앙 매듭 두 곳, 4라운드 의식터 방어, 별도 흔적 조사 E, 먼 잔적 소탕을 요구하지 않는다. 기존 진행 저장도 이 조건으로 이어진다.

브랜치 `fix/stage11-quest-simplification-20261022`. 최초 기준 master는 `c5b51319ef887943726434d84db596f07254bbd3`이며 최신 NPC 버튼·BASE4·13장 공개 자료의 master `e974bfe7a1138b55c5b4648e8a38e192ad0a69f6`도 통합했다. **최종 코드·생성물·정상 턴/브라우저 실행 SHA는 `67dd496a5981c1dee47d0cb4d01573191ba68bb3`**다. 후속 커밋은 테스트·문서·증거만 보존한다. master/Pages는 부모의 최종 검수·단독 반영 대상이다.

## 무엇이 필수였고 무엇을 없앴나

이전 실제 런타임은 소단으로 서쪽 매듭 주변 적을 제압하고 E → 중앙 매듭 주변 적 제압/E → 표시된 원에서 적 점유 없이 4회 보호 → 하부 주민의 혼을 40% 이하로 약화/분리 → 동쪽 능선의 흔적 E였다. 이전 pacing은 서쪽 clear 확인 자동화·일부 적 감축·흔적 접근 단축이었고 핵심 긴 체인은 남아 있었다. 전맵 소탕 제거도 이미 이전 성과였다.

이제 `resident` 구조와 `trace` 자동 기록만 남는다. 매듭/의식터/능선을 다시 찾아갈 필요가 없고, 폐지한 목표에 연결된 미입장 추격·잔향 요청도 진행을 막지 않는다. 이미 입장한 적·받은 피해·파동 이력은 지우지 않는다. 주민 바로 곁의 실제 위협(기존 반경360 판정)과 붙은 혼만 처리하면 된다. 붙은 혼은 기존 규칙대로 체력40% 이하에서 소단으로 분리하거나, 혼을 제압한 뒤 다른 동행으로 구조할 수 있다. 주민 상실 실패도 유지한다.

11장 polygon·환경·미술·장식·배우 편성/좌표/HP·공격력·클래스 이동도·지도 revision은 바꾸지 않았다. 다른29장의 원본과 라이브러리도 동일하다. 높은 고목·사격턱·우회/회귀로와 남은 전투는 선택지로 남는다. 겹친 하강 고목 끝을 돌아오는 지형상의 접근은 여전히 있으며 이를 없앴다고 주장하지 않는다.

## 정상 자원의 전체 경로 비교

기존 `stage11-ravine-fullplay.mjs`의 같은 전진/근접 위협 교전 정책을 사용했다. 이동은 승인된 지지면의 보행/점프 경로, 사격은 실제 예측과 보유 기예, 실제 Engine 선택/이동/발사/E/대기/tick이다. 전체 턴 최소값을 찾는 최적 solver가 아니다. 초기 세팅 이후 무적·좌표 보정·이동도/기력 재충전·적 HP 감소/삭제·목표 강제 완료·숨은 아이템을 사용하지 않았다. 구출 E가 약화된 붙은 혼을 분리하는 것은 원래 production 동작이다.

조건은 **보통(normal), 현행 입장 경지12, 설오·담허·휘겸·소단 4인, 실제 수련 API로 합법 배분한 기예/능력치**다. 두 실행의 초기 전체 배우 ID·좌표·HP/기력·이동/공격 수치·랭크/장착·아이템이 동일함을 [초기 비교](evidence/entry-comparison.json)로 확인했다. 실제 이동도는 설오1590/담허1630/휘겸1823/소단1662이며 임의로 늘리지 않았다.

| 실행 | 실제 결과 | 해석 |
|---|---|---|
| [기존 master](evidence/before-normal-play.json) | 20턴을 사용한 뒤 미완료. R19에 보호4회 완료, R20에는 주민 쪽으로 내려가는 중. R21 시작에서 명시한 비교 상한으로 중단 | exit1/미완료를 통과로 쓰지 않는다. 이전 전체 완료 턴은 측정하지 않았으므로 정확한 총 절감 턴수도 주장하지 않는다 |
| [최종 단순화본](evidence/after-normal-play.json) | **새 진입 R1→R11 승리**, 96개 기록 입력, 추가 파동0. 주민 HP876/950, 네 동행 생존. 강제 방어와 최종 흔적 왕복 없이 주민 구조 뒤 단서 기록 완료 | 전체 새 진입 완료 경로의 정상 턴 증거다. 사람의 플레이 시간/모든 빌드·난이도/연속 캠페인 증거는 아니다 |

6~10턴은 설계 가이드였고 이 보수적인 전진 정책의 실측은 **11턴으로 1턴 초과**했다. 이를 10턴 이하나 보통 사람 모두의 완료 시간으로 바꾸어 쓰지 않는다. 이전의 ‘주민→흔적 5→2라운드’ 격리 이동 검사를 이번 전체 완료 근거로 재사용하지 않았다. Node 실행 초/프레임도 사람 시간이나 성능 개선치가 아니다.

## 현재 20턴 저장과 대화

`HonroStage11Quest.upgradeBattle`은 campaign/origin·11장·지원 revision과 알려진6/7단계 ID 순서를 확인하는 bounded 이행이다. 지형·배우·좌표·HP/기력/이동 잔량·아이템·성장/보상 원장·라운드·현재 행동·기존 done/checkpoint·진행 대화 원문/cursor를 유지한다. 제거한 단계의 done을 허위로 채우지 않는다. Workshop/custom/완료·실패/미래 revision/미인식 계획은 건드리지 않는다.

사용자 첨부는 **18턴의 주민 대화1/2·현재 흔적 조사**였고, 사용자가 말한 현재 진행은20턴이다. 실제 저장 JSON은 제공되지 않았다. 이 경계를 재현한 **20턴 호환성 fixture**에서 양쪽 주민 대화 cursor(0/1)와 원문, export→Continue를 검사했다. 대화 중에는 완료·보상·전투 진행을 하지 않는다. 이미 주민 분리를 완료한 사실이 있으면 대화를 마친 뒤 일반 tick이 기존 trace checkpoint/단서 대사를 한 번 기록하고, 일반 checkMission/outcome이 같은20턴에서 완료·정산한다. 임의 `won` 처리나 재시작/맵 재생성은 없다.

구조 전 각 중간 단계7경계의 Continue/export도 현재 주민 목표로 이어지며 완료되지 않은 구조를 건너뛰지 않는다. 실제 구출이 끝난 저장은 폐지된 흔적 원정 때문에 막히지 않는다. 현행 map revision1은 올리지 않았으므로 배포 후 새로고침→이어하기를 사용할 수 있다. 훨씬 옛 비호환 map revision의 기존 재시작 정책을 전역으로 풀지는 않았다.

## 확정 원고와 연출 인계

부모가 작성하고 장소 일관성을 정정한 최종 원고를 [정본 JSON](../../../shared/data/stage11-quest-story-20261022.json)에 보존했다. 런타임이 이 JSON을 읽으므로 문서용 사본만 만든 것이 아니다. 도입 휘겸은 **‘내가 앞을 막겠소. 주민부터 구합시다.’**, 완료 휘겸은 **‘이제 움직일 수 있겠소? 사람들 있는 곳으로 가시오.’**를 사용한다. 다른 도입3줄·완료1줄·도착 서술·완료 요약도 확정 원고 그대로다. 기존 resident2줄·trace2줄은 유지했다.

새 도입/이후 정상 완료에 적용하며 `b.honroStory`의 진행 중 원문/cursor는 교체하지 않는다. scene keys는 `act2-v1:act2-r2-entry-11`, `act2-v1:act2-r2-outro-11`, `act2-v1:act2-11-resident`, `act2-v1:act2-11-trace`다. 소단/휘겸의 옛 knot-west 지시는 resident를 향한 몸짓으로 바꾸고 camera=false를 유지했다. 도착 서술 카메라는 일행의 설오에 두어 먼 주민까지 장거리 이동/풀줌하지 않는다.

후속 narrative catalogue 통합 시 **modelFiles의 `stage11-quest-simplification`과 projectAuthors의 `HonroStage11Quest`를 마지막에 유지**하고 이 정본 JSON을 채택한다. 전체 author 재실행 뒤에도 새 단계/원고가 유지되는 검사를 포함했다. 다른 대사 브랜치·초상화 제작·13장 추가 경계 작업은 가져오지 않았다.

## 선별 검증과 실제 화면

- `npm run build`: 최종 공통 Game/Workshop/Playtest 빌드 완료.
- `node tests/stage11-quest-simplification.mjs`: 원본/재생성 author, 다른29장/30장 제외, 전체 물리·자원 보존, 각 중간 단계·20턴 대화 양쪽 cursor·export/Continue, 자연 완료·trace/보상1회, 지원 제외, 정본 원고·실제 주민 몸짓/카메라 통과. [기록](evidence/state.json), [로그](evidence/state.log).
- `python tests/stage11-quest-simplification-browser.py`: Chromium390×844 실제 새 목표, 옛20턴 주민 대화1/2 Continue, 화면 안의 다음/넘기기 **실제 터치**, 같은20턴 완료·보상1회 통과. pageerror/HTTP 실패0. [기록](evidence/browser.json).
- `node tests/web-split.mjs`: 생성357파일 해시/바이트·데이터 재조립·Game/embedded 기본 진입·embedded 저장 보호·Workshop iframe 연결 통과. [로그](evidence/web-split.log).
- 최신 master의 main/NPC 대화/초상화 설정·presentation CSS·portraits·기존 web-build는 바이트 동일하다. master 공개 자산 **454개를 모두 같은 경로·바이트로 보존**했고 삭제는0개다. 오래된 공개 파일4개는 이번 빌드 후 다시 보존했으며 새 세대 보존 정책을 별도로 만들지 않았다. [소스·공개 파일 보존](evidence/preservation.json).

직접 열어 확인한 JPG: [현재 주민 목표·다음 행동](evidence/fresh-rescue-objective-390x844.jpg), [20턴 주민 대화1/2와 보이는 조작 버튼](evidence/round20-resident-dialogue-1of2-390x844.jpg), [같은20턴 정상 완료](evidence/round20-natural-result-390x844.jpg). 전부1MB 미만이며 [크기/해시](evidence/screenshots.json)를 보존했다. 20턴 화면의 부분 기록/XP 표시는 호환성 fixture의 실제 결과이며 실제 사용자의 완료 보고서로 주장하지 않는다.

확인 중 새 두 단계 원본에 TraceExit opt-in이 없으면 옛 소탕 guard가 되살아날 수 있는 author 연결 결함을 발견했다. 새 원본에 정확한 기존 revision을 보존해 해결하고 author·저장·최종 전체 경로를 재검사했다. 초기 c5 브라우저의 NPC 버튼 가림은 부모의 e974 수정 통합 뒤 실제 터치로 통과했다. 관련 없는 baseline4실패 수리·전30장 완주·전역 verify/성능 검사·장식 반복 검수는 하지 않았다.

## 커밋·원격 상태

초기 코드 `ce18bd73`, 안정 master 세대 보존 빌드 `27d12992`, 검사 `6fd8b8f3`는 비강제 push 완료다. 이후 로컬 `a5e9aa91` push에서 **`fatal: could not read Username for 'https://github.com': No such device or address`**가 발생했다. 대상은 `origin/fix/stage11-quest-simplification-20261022`이며 해당 쓰기는 실패했다. 로컬 a5e9aa91와 최종 e974 통합/확정 원고 `67dd496a` 및 후속 문서 커밋은 보존했으며, 재인증 없이 다른 쓰기 경로로 우회하지 않았다. 명시적 승인 거절이나 결과 불명 쓰기는 아니다. 원격 최종 확인은 부모에게 인계한다.

남은 배포 차단은 **GitHub push 인증 복구**다. 런타임 진행 차단은 발견하지 않았다. 재현 입력·실제 JPG·최종 코드/생성물은 로컬 커밋과 Git bundle로 함께 인계한다. master 직접 변경·Pages 배포는 수행하지 않았다.
