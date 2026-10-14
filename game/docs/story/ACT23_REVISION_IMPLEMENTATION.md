# 2·3막 개정 구현 · v1

제작 기준과 원문 검증 상태는 [기준서 채택 기록](README.md)을 따른다. 아래는 현재 구현이며 4–6막 제안·미정 결말을 구현했다는 뜻이 아니다. 전체 최종 검수·배포 상태는 마지막 절에 따로 기록한다.

## 코드와 저장 경계

- 캠페인은 `shared/data/campaign.json`의 stage-11~stage-30. `shared/build.mjs`의 같은 author·번들을 Game, Workshop Stage View, Playtest가 사용한다. 옛 맵 전체 재생성은 실행하지 않는다.
- `story-canon-v1.js`: 새 지도 `honroStoryCanonRevision=1`, 현재 대사에 대한 최소 변경, 구형 content fallback과 기존 snapshot 보존. [채택]인 제작 비밀을 극중 대사에 넣지 않는다.
- 12·14장의 전용 대사 사본도 새 지도 저작 때 각각 진 설명 한 문장·주민 관찰 한 행만 갱신한다. 첫 구현의 전역 대사 수정만으로는 실제 사본에 반영되지 않는 문제를 전체 대사 이력 대조에서 찾아 보완했다. 전용 목표·동선·기존 저장 사본은 유지하며 실제 fresh `contentFor`를 회귀 검사한다.
- `story-anomaly-revision.mjs` / `story-anomaly-art.js`: 17/18/19/25/27의 추가 환경 metadata와 공통 Scene의 국소 표현. 기존 지형 polygon·충돌·적 배치·목표·진목 경로를 보존한다. 27장 일시 낙하만 별도 장면 상태에서 설오의 몸 위치를 움직인다.
- `act3-void.js`: 새 27장의 필수 조우. `main.js`는 입력·시뮬레이션·미션·프레임·오디오 경계와 이어하기 복구를 연결한다. `world.js`는 실제 체험의 영속 증거가 있을 때만 다음 새 장에 witness를 전달한다. `stake-crossing.js`는 완료 조우를 구간 재시도로 되돌리지 않는다.
- `bell-anomaly.js` / `Engine.advanceProjectile`: 새 18장의 단 한 발 소실, 발사 전 상태 보존과 복구, 이후 국소 쏠림. 몸 낙하의 `physics.regions`는 사용하지 않는다.

## 장별 전후

| 장 | 개정 전부터 보존한 핵심 | 이번 개정 |
|---|---|---|
| 11 | 소단 합류·주민·매듭 정리·북쪽 흔적 | 종소리 방향과 혼의 방향을 관찰하고 원인은 보류 |
| 12 | 돌림진·작업굴/내리막 두 출구·13장 합류 | 사람이 설치한 진임을 명시; 묵종의 어그러짐과 동일시하지 않음 |
| 13 | 석공 구조·석문·길찬 연결 | 외부에 알려지지 않은 공동과 위쪽 자연광 관찰 |
| 14 | 세 주민 구조·종이 절보다 먼저라는 구전·선택 출구 | 주민의 최근 헛디딤 관찰만 추가 |
| 15 | 오래된 인양 흔적/최근 구조 방해·수문/고지 | 기존 구분이 이미 명세를 충족하여 보존 |
| 16 | 사흘 생존 증언·외부 종 이송·70년·타종 금기 | 기존 대사·기록 보존; 공간 이상을 설명하는 기록 추가 없음 |
| 17 | 실제 인양축 복원으로 구조 가능성 입증 | 묵종 쪽 벽의 어긋남 관찰·국소 배경; 종지기의 범죄 증거 유지 |
| 18 | 억제진4라운드·고정구·안전 안착·혼 분리·비살상 | 실제 안전한 플레이어 기본 화살1회 소실과 국소 궤도 쏠림 |
| 19 | 가족들의 전투 없는 천도·옛 표식 | 방향이 맞지 않는 짧은 잔향만, 전투/피해/보상 없음 |
| 20 | 실제 주민 행렬·중간 방어·읍성 문서고 | 실제 소실 목격 기록이 있을 때만 화살 관찰을 회상 |
| 21 | 성문 주민 구조와 나루 소문 | 기존 대사·목표 보존 |
| 22 | 공식 보고/호적의 모순 | 무저항 확정 없이 기존 대사 보존 |
| 23 | 실제 운송 시설·시신/생활금속 기록·짐꾼 호송 | 표찰의 석대·검수대 번호를 지하 시각 단서로 연결 |
| 24 | 휘겸+소단 / 설오+담허 분할과 자원 연속성 | 지하로 가는 목적을 운송 표찰 원본 추적으로 명료화 |
| 25 | 5도착점·두 동행·생활물품/이름표 | 후반 옆으로 흐르는 물방울과 배경 불일치, 원인은 유보 |
| 26 | 지상팀·선조 증언·대도사 현장 학살·공방 수량 | 기존 증거 순서와 불확실한 공정 보존 |
| 27 | 4도착점·자유 경로·가족 명세·28장 출구 | 실제 시설의 더 큰 불일치, 필수 단독 조우, 명세 수집으로 복귀 |
| 28 | 적 턴12회 화재·두 팀 합류·책임 구분 | 완료 체험이 있을 때만 체험과 기록 증거를 구별하는 짧은 사후 대사 |
| 29 | 현묵 서명·법맥·비빙의·저편 울림·무명사 기록 | 27장 체험을 질문으로 연결하되 같은 원인이라 단정하지 않음 |
| 30 | 실제 이송/봉쇄 기록·나루3회 방어·옛길 | 무명사로 가는 근거와 실종자 행방 탐색을 유지, 생사 확정 없음 |

## 27장 필수 조우와 복구

새 `honroAct3Void.revision=1`의 `READY → FALLING → VOID → RETURNING → RESOLVED` 흐름이다. 설오가 심부의 실제 안전 발판에 접근할 때 시작하며, 마지막 `family-manifest` 상호작용에도 guard가 있어 긴 진목·점프·담허 선도 경로로 사건을 건너뛸 수 없다. 일반 낙사 판정과 실패를 호출하지 않는다.

낙하 전 설오 전체 상태·활성 동행·카메라를 저장한다. 나머지 파티·적·독·소환·턴·퀘스트는 장면 내내 시뮬레이션을 동결해 그대로 유지한다. 검은 화면은 기존 설오 외형과 이름 없는 짧은 문장만 사용한다. 클릭/터치/Enter/Space로 진행하고 빠른 연타는 최소 노출 시간을 건너뛰지 못한다. Escape·길게 누르기·키보드 접근 버튼으로 멈춤/설정/넘기기/중단이 가능하다. 포커스·화면 회전·탭 비활성화를 처리하며 BGM 스트림을 버리지 않고 pause/resume한다.

정상 복귀 후에만 `profile.honroStoryEvents['act3-void-v1']`을 확정한다. 장면 도중 저장·reload는 낙하 전 실제 안전 위치의 READY로 회복하고, 즉시 검은 화면에 재진입하지 않는다. 완료 후 구간 재시도는 RESOLVED를 유지한다. 명시적인 장 재방문은 새 READY로 회상 가능하며 옛 Continue의 사건 상태를 소급 바꾸지 않는다. 기존 가족 명세 획득은 별도 원래 상호작용으로 계속해야 한다.

## 18장 한 발과 이후 궤도

첫 관찰은 실제 플레이어의 안전한 기본 화살에만 붙는다. 종 서쪽 국소 영역으로 들어가는 전체 예상 경로에서 필수 고정구·보스·보호 유닛을 배제한다. 자동 공격·소환·축지진목·필수 퀘스트 발사체는 소실 대상으로 선택하지 않는다. 소실 전까지 실제 투사체를 그리며 피해·충돌 표시 없이 제거하고, 발사 전 자원·행동 기회·쿨다운·패시브 상태를 복원한 뒤 관찰 대사를 전달한다. 중간 reload는 비용이 소비되기 전 READY 상태로 돌아온다.

이후 소실을 반복하지 않는다. 가시적인 경계 안에서만 공통 `Engine.advanceProjectile`이 국소 힘을 계산하므로 예상선과 실제 궤도는 같은 식이다. 몸의 낙하·지형 충돌·대종 안전 안착 규칙은 바뀌지 않는다. 검증은 실제 사격, 전후 상태, 적군 목표와 저장 레지스트리 모두의 보호를 따로 검사한다.

## 검증 상태

부모의 최종 통합 신호를 받아 원본 도감 `36cbc1c`를 병합하고, 통합 소스 `84afafc`에서 도감을 전체 재생성했다. 배포 기준 `d802331acdcf5a4ac13bff83be76cb3d4d7704c7`의 master 원격 일치와 Pages run `38601987871` 성공을 확인했다. 배포 뒤 전체 `npm run verify`를 한 번 실행했으며 아래 차단/미실행을 통과로 표시하지 않는다. 후속 변경은 테스트·문서뿐이고 세 HTML의 바이트는 동일하다.

| 검사 | 현재 결과와 범위 |
|---|---|
| `test:story-revision` | 30장 기존 핵심 필드·공개 상한·구형 snapshot, 환경 저작/순수 렌더, 실제 탄도/자원/퀘스트 보호, 필수 조우/우회/담허 선도/빠른 입력/정상 복귀/중간 reload/옛 저장/재방문 통과 |
| `test:quest-hostile-targets` | 현재 5개·구형14개 목표, 실제 검·화살·App 저장/재로드 통과 |
| `stage18-bell-refinement.mjs` | 기존 안착 조건과 억제진 집중 검사 통과; 별도 resume 검사의 오래된 목표 fixture 실패는 아래 구별 |
| `stake-crossing-flexible.mjs` | 자유 경로·긴 사격·점프·도착점 계약8그룹 통과 |
| `vertical-waterworks-structure/physics` | 현재5/4구조와27개 이동/탄도 사례 통과 |
| `act23-narrative-redesign.mjs`, TypeScript | 통과 |
| current runtime/campaign contracts, dialogue-clarity | 소스167개·9빌드·두HTML,30장/640자산 독립 재생과804개 대사 발생 위치 통과. 기존 manifest/fixture는 불변이고42개 정확 대사 변경 구간과 소스/지도 역변환만 추가. 역변환이 관련 없는 HP·좌표·순서 변경을 숨기지 못하는 음성 대조 포함 |
| `act3-void-browser.py` | 실제 Chromium desktop/mobile·회전·키/터치·멈춤/설정·동일 BGM 스트림·정확한 복귀·reload·Workshop Playtest 통과. 심부 도착 위치를 둔 관찰 fixture |
| `bell-anomaly-browser.py` | 실제 Space 또는 모바일 발사 버튼 press/release→화살→즉시 대화→정확한 자원 환급/목표 보존 통과. 기존 안전 발판 위치를 둔 관찰 fixture |
| Native 전후 화면 | 같은 카메라·같은 기존 배우 위치에서17작업장 배경,18국소 영향 경계,19장례 잔향,25/27기둥/물방울 검토. 구현자와 별도 통합자가 전후 화면을 직접 확인했다. 정상 조작 완주·브라우저·성능 증거와 구별 |

실행 로그/JSON/PNG/WebM은 `_local/reports/story-revision/`, `act3-void-browser/`, `bell-anomaly-browser/`, `story-anomaly-native/`, `story-anomaly-focused-native/`, `story-anomaly-17-19-native/`에 둔다. 새 검사는 `npm run test:story-revision`과 `npm run test:story-revision:browser`로 재현하며 전체 `test:integration`에도 연결한다. 브라우저 검사는 HTTP 서버를 사용하며 `HONRO_BASE_URL`로 최종 Pages를 지정할 수 있다. 묵종 브라우저 증거의 HTML은 `26818aa8…`, 이후 검은 틈 복귀 대사 수정 빌드는 `9645d315…`이다. 12/14장 새 진입 대사 snapshot을 반영한 최종 Game SHA256은 `f55a9dd8624d7b3c316dc83c4cafbf3c35deab11f528ee233a34baa8cc7b3cbe`, Workshop은 `d73a575794ffb8cf4bcc6928bc4d35933741d6634cacf9a6436f23d4c5518f35`다. 18/27장 관련 소스는 이후 동일하므로 해당 집중 증거를 재사용한다. 공개 Pages 바이트 직접 대조는 아래 네트워크 제한으로 미완료다.

로컬 브라우저 검사는 별도 서버 준비 없이 임시 localhost 포트를 열고 종료 시 정리한다. `HONRO_BASE_URL`이 있으면 로컬 서버 없이 지정된 배포 주소를 검수한다.

현재와 수정 전 master `4a601580d1a55d9455c0bb25aeb9db3e7613c529`에서 각각 재현한 기존 실패:

- `environment-composition.mjs:44`: 현재 없는 `env:rock` fixture에 `Object.keys`를 호출한다.
- `act3-split-campaign.mjs:52`: XP83635와 옛 기대83652가 다르다. 앞4시나리오는 통과한다.
- `act3-split-v2.mjs:18`: 현재 장 이름 `지운 이름과 남은 명령`과 옛 기대 `왕실의 선택`이 다르다.
- `act3-save-boundaries.mjs:73`: 기록 수0과 옛 기대1이 다르다.
- `stage18-bell-refinement-resume.mjs:8`: 이미 적군 유닛인 `upper-chain`을 지형에서 찾아 `broken`을 쓰다가 실패한다. 현재 목표 보호는 새 실제 유닛/records 검사로 확인했다.

- `migration.mjs`: 7장 story `honroGrowth`의 HP527/434 등 성장 원장 기대 차이. 기준 master와 현재의 경로 정규화 전체 로그가 동일하다.
- `integration.py`: 8장 화면679픽셀(비율0.001309799, bbox0/397/52/424) 차이. 동일 HTTP 호스트 조건의 기준 master에서도 정확히 재현했다. 1–7장 비교는 차이0이다.

이 실패를 없애려고 옛 fixture 전체를 새 데이터로 덮지 않는다. 정상 자원으로 전20장 완주, 물리 기기 입력/청취, 성능과 공개 배포 화면 전체 검수는 통과 범위에 포함하지 않는다. 기준서 원본은 부모의 실제 Library materialize 결과와 저장 파일의 크기·SHA256·말미 개행이 일치함을 대조했다([채택 기록](README.md)).


## 배포 후 검사 결과와 남은 한계

- **전체 검사 한 차례:** `npm run verify`는 release guard19검사·두 HTML 빌드·제목 계약/실제 SVG 검사 후 `quest-space-reference-repair.mjs`의 과거 전체 맵 해시에서 중단했다. 이 항목은 이전 master에서 통과하므로 새 개정으로 생긴 검사 경계 불일치다. 승인된 스토리 delta를 정확히 역적용하도록 보완했으며 기존 fixture는 불변이다. 보완 후 집중 실행에서30장 스키마/전체 전투 상태와9 metadata·3 story 음성 대조가 통과했다. 전체 verify를 재실행하지 않았으므로 뒤의 aggregate 명령은 **미실행**이다. 위 표의 앞선 개별 실행 증거와 구분한다.
- **실제 브라우저 집중 후속:** 기존 8장 실패를 그대로 남긴 별도 범위 실행으로11–30장 Game/Workshop 픽셀 차이0,30장 짧은 실행의 유효 좌표·동행 생존, 실제 사용자 맵420스텝 이동/충돌/발사 일치, JSON·편집 Undo/Redo·Playtest Stop·모바일 복귀를 확인했다(77검사). 장 진입 smoke는 전투 완주나 각 장 실제 발사 성공을 보증하지 않는다. 원본 `integration.py`의 실패를 지우거나 허용 임계치를 바꾸지 않았다. 파일 URL 대신 자체 HTTP 서버와 선택적 `HONRO_BASE_URL`을 사용하도록 호스트만 정리했다.
- **도감:** 통합본31검사/1,386렌더 표본·저장 API0회·JS오류0·desktop/390/333/667폭 통과. 주요53·호환15·목표4·44벡터/209클립을 보존했다. HTML SHA256 `afd1ca84cc81adc6f690119508c492335fb4afe69149357cca84685719b77da9`. [도감 검증 범위](../CHARACTER_CATALOG.md).
- **공개 검수 차단:** 실행 환경의 공개 Pages HTTP는 CONNECT tunnel403, Playwright HTTP는 DNS `EAI_AGAIN sys8994.github.io`, 승인된 web reader도 해당 URL 접근 불가였다. 프록시/DNS/보안 설정을 우회하지 않았다. 공개 Game/Workshop/도감의 화면·일반/캐시무효화 URL 해시·BGM5파일 검증은 **미완료**다. 필수4개 HTTP200/hash 행이 없으므로 release guard의 최종 publication receipt를 만들지 않았다. GitHub Pages run 성공만으로 최종 검수 완료를 주장하지 않는다.

자동 기록은 Git 제외 `_local/reports/integration-acts23.json`, `campaign-contracts/metadata-repair.json`, `character-catalog-integrated/`에 있다. 발행자의 원문 로그·정확한 Pages 응답·master manifest·네트워크 오류는 공유 저널과 같은 `/workspace/honro-release/`에 보존한다. 공개 검수를 재개할 때에는 현재 master SHA와 동일한 Pages run을 새로 읽고, 일반/`?release=<SHA>` Game·Workshop4개 바이트 및 도감/음악을 대조한 뒤 `HONRO_BASE_URL` 브라우저 검사를 실행한다. **구현·통합·배포와 검수 완료를 구분하며, 공개 접근과 정상 자원 전20장 완주/성능 검증은 남아 있다.**
