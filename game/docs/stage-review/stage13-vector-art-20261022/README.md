# 13장 숨은 석문 · 벡터 재질/작업장 미술 보완

현재 상태: 부모가 shape4 `c5b51319`를 승인·master/Pages 반영했다. 이후 공개 UI 줌아웃 QA에서 별도로 발견된 왼쪽 재질 시작 경계만 교정했다. [배포 후 QA 기록](#배포-후-qa--왼쪽-재질-시작-경계). 이번 경계 수정의 공개 확인·master 반영은 부모 대기이며14장은 시작하지 않는다.

## 설계/보존 카드

- 기준: 부모가 배포/공개 확인한 master `934fcabd74767d662aee3830585ba807234934cc`. 같은 Codex 세션을 재사용하며 `fix/stage13-vector-art-20261022`에서 작업한다.11장 승인 후보4/렌더·실루엣 개선/BGM7곡/세션 재사용 지침은 보존한다. 초상화 시안/전역 main/renderer/실루엣/오디오를 변경하지 않는다.
- 장소/역할:2막3장 「숨은 석문」. 함몰 전정의 입구 어깨/석공 구조 접근 → 석문 빗장 → 낮은 안쪽 회랑/마을 입구. 전투를 전면 재설계하지 않고 이 장소의 모암·지지/접촉·작업장 재료를 정리한다.
- 현행 목표: `shared/runtime/act2-plan.js`의 `resident→gate→exit`. 낡은 design.description/site metadata나 옛 문서의 지지대 사격·전맵소탕·대기 방어를 복원하지 않는다. 도입/대사·NPC/적·HP/보상/목표/저장 스키마/초기 상태를 보존한다.
- 지형/동선:8200×6600의 Play Bounds와 v6 전체 지형은 그대로. 입구 어깨 위 사격자리/아래 구조 접근, 문 양쪽 선택길, 안쪽 작업 참/하부 통과구, 기존12장 A입장 발판을 보존한다. polygon·one-way·충돌·사선·카메라 규칙·이동 능력을 바꾸지 않는다.
- 큰 형태: 전정 내리막의 단단한 모암 층과 석문 상부 천장을 같은 지질 방향으로 묶고, 열린 전정→낮은 회랑의 공간 경계를 읽히게 한다. 실제 문 개방 상태와 바닥/천장 실루엣은 고정한다.
- 중간 형태: 근경 앞면의 비대칭 파단/겹침을 실제 바닥 굴곡과 문 어깨에 맞춰 저작한다.11장 면 패턴 복사·독립 돌 스티커·전폭 균일 격자·작은 반복 무늬를 쓰지 않는다.
- 국소 형태: 문틀과 천장/바닥의 접촉, 목재 승강기의 접합·줄/축, 석공 집/작업 참의 접지와 간결한 도구 흔적. NPC/통행/사격 공간을 비우고 장식의 밝은 수평선을 새 발판처럼 만들지 않는다.
- 공통 경로: 기존 `space.terrainPlanes→HonroAct2SpatialArt.prepareTerrain/terrain`의 정적 Path2D/실고체 clip, 기존 SVG compiler/Library/Scene.landmark를 사용한다.12장의 공통 화강암 attachment와 작업장 자산을 확인하되 기존 공유 원본을 덮어쓰지 않는 opt-in 참조/확장으로 제한한다. 새11장식 임시 렌더러를 만들지 않는다.
- 원경: 승인된 이미지 원경을 유지한다. 현 `authored-far-art.js`는 실제 천장 bounds와 camera.x/y의 smooth 혼합으로 valleyFar/interior를 전환하며 새 스토리 trigger가 아니다.
- 카메라: 실제 바닥은 입구x1760 부근y3310, 석문x4445 부근y4087, 천장하단y3375 부근, 안쪽x5800 부근y4344이다. 기존 저작 참고1760/3200/.5와5800/4220/.5를 실제 생산 카메라 결과/limits로 확인한다.

## 변경 단계와 최소 확인

SOP 단계1·3~6의 지형/배치/편성/목표/대사는 변경하지 않는다. 단계2 재질/기존 장식 보완만 구현한다. 첫 후보 핵심3장(전체/입구 석공 접근/석문과 낮은 회랑)을 직접 열어 전달 경로에 보존한 뒤 부모가 실제 픽셀로 방향을 판단한다. 이후 변경 화면의 집중3회(전체 깊이, 일반 재질·접합, 모바일·상태)와 별도 최종 미술 검수를 수행한다. 숫자/기능 불변은 미술 합격의 근거가 아니다.

검사는 master 대비 gameplay/다른29장/기존 Library 보존 범위, 렌더 순수성/정적 prepare 재사용, 짧은 실제 구조 접근·문 개방/통과만 한다. 공통 연결을 바꾸면11장 관련 국소 비교를 추가한다. 새로운 성능 주장/전체30장 검사/무관한 기존 실패 수리는 하지 않는다. 자동 결과·비선택 화면은 `_local/reports/stage13-vector-art/`에 두고 선택한 전달 JPG만 `review/`에 보존한다. 예전9132997 원경 연결 캡처와12장 A/B 입장은 현재13장 SOP 완료 근거로 쓰지 않는다.

각 변경 단위 commit/push. master/Pages 발행은 부모 최종 검토 담당이다.

## 첫 후보 (미술 판단 대기)

`tools/environment/stage13-vector-finish.mjs`는 기존 공통 terrainPlanes 경로에13장 정적 모암45면(바닥27/천장14/기존 작업 참4)과 비충돌 Library opt-in4종만 저작한다. 기존 Library 원본/다른29장/전역 실행 코드는 그대로다. 층을 잇는 큰 명암, 선택적 파단면, 좁은 접합과 작업장 줄/목재 접합·기초를 보완했다. 지형 개편 완료를 뜻하지 않는다.

전달 사진은 실제 생산 Chromium의 고정 카메라 신규 전투 표본이다.1440×900, 전체4100/3450/.17, 입구1760/3200/.5, 석문4820/3800/.45. 합법 장 진입 성장 예산/기본 동행, 시작 구조 목표와 배우 좌표는 그대로다. 시간10/정지 포즈이며 일반 전투 완주·실기기·성능 표본은 아니다. 각 JPG1MB 미만.

- [전체 연결](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/candidate1-overview.jpg)
- [입구·석공 접근](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/candidate1-entry.jpg)
- [석문·낮은 회랑](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/candidate1-gate.jpg)

`node tests/stage13-vector-art.mjs` 통과: master934fcabd 대비 보호된13장 데이터/다른29장/공통 원본 동일, 저작 재현·멱등, 비충돌 변형4종, 재질 draw의 battle 불변/Canvas 상태 보존/정적 Path2D 재사용/sceneVersion 무효화 확인. 기능 숫자를 미술 합격으로 쓰지 않는다. 집중3회와 별도 최종, 구조 접근/문 통과는 후보1 기록 시점 미완료였으며 아래 교정 후보2에서 따로 수행했다. 자동 보고/기타 사진은 `_local/reports/stage13-vector-art/`에 둔다.

전달 차단: Library helper의 `hosted apps tools/list request failed: network`로 업로드 준비 전 실패했다. 저장 성공/미확정 업로드가 아니며 재전송하지 않았다. 같은 JPG3장은 위 검토 브랜치 경로로 전달한다.

## 생산 연결 교정 후보2

첫 후보 `cb725fff`의 빌드에서는 기존 `applyCavernTransitionLayers`가 전이용 면17개를 다시 추가하고 장면 재저작이 장식 참조 일부를 되돌렸다. 따라서 후보1의 큰 독립 절리/옛 도구 사진은 최종 근거에서 제외한다. `shared/build.mjs`의 기존 저작 체인 끝에서 `stoneFinish.revision===1`인13장에만 같은 opt-in 저작을 재적용한다. 전역 renderer/main을 변경하지 않으며 공통 geometry/route 저작은 그대로 실행한다. 실제 생산 자료의45면/전용 장식 참조를 검사에 추가했다.

교정 후 직접 연 같은 카메라 사진: [전체](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/candidate2-overview.jpg), [석공 접근](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/candidate2-entry.jpg), [석문·회랑](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/candidate2-gate.jpg). 후보1의 붙은 블록/짙은 절리는 제거됐고 연결된 모암면과 짧은 접합이 보인다. 여전히 부모의 실제 픽셀 판단 전이다.

공통 연결 영향 경계: `HONRO_STAGE13_BASELINE=/workspace/honro-stage13-baseline node tests/stage13-vector-art.mjs`로 master934fcabd 원본 작업트리의 실제 runtimeParts와 대조했다. 빌드 후 보호13장/다른29장/기존 Library가 동일하고11장 중앙7290/7080/.43·피난처10350/8470/.8의 비어 있지 않은 재질 PNG가 각각 일치했다. 이는 짧은 연결 보존 검사이며 전체11장 재검수/새 성능 주장이 아니다.

`node tests/stage13-vector-art-play.mjs`는 실제 Engine walk/integrate·HonroInteractions eligibility/use로 원래 소단 spawn에서 구조 접근→석공 구조→빗장 개방→x6581 하부 통과를 확인했다. 위치 보정 없이 이동했고 주민HP가 보존됐다. 전투는 초기 fixture에서 격리하고 붙은 혼은40%로 준비했으며 이동 예산을 재충전했다. 정상 턴 예산/전투 완주·승리를 뜻하지 않는다. 출구 목표가 남은 실제 문 개방 snapshot도 별도로 화면 확인했다.

## 교정된 최종 소스의 집중3회와 별도 종합

실행/미술 소스 `15f64b18`을 고정했다. 이후 변경은 캡처 입력 검증·선택 사진·문서뿐이다. 이전 후보1 및9132997의 원경 연결/12장 A·B 입장을 현재 완료 근거로 쓰지 않는다.

| 회차 | 직접 연 실제 화면과 판단 | 남은 한계 |
|---|---|---|
| 집중1 전체 깊이 | candidate2 overview: 전정 모암의 큰 경사진 층→선택적 중간 파단→짧은 절리가 이어지고, 옛 독립 블록/밑뚜껑17면은 사라짐. 상부 사격 어깨/아래 석공 접근·문·안쪽 작업 참이 구별됨 | 기존 거대한 천장 실루엣과3개 후경 암체는 보존. 큰 여백의 최종 스케일 판단은 부모 담당 |
| 집중2 일반 재질·접합 | candidate2-focus2 entry/gate/inner/mason: 문틀 기초와 천장 받침의 접촉, 사선 모암층, 차양 장부/도구·승강 줄/목재 접합을 직접 확인. 석공 라벨과 실제 통행면이 보임 | 작은 바위 노이즈/추가 발판을 만들지 않음. 원래 목재 작업 참 형상은 그대로 |
| 집중3 모바일·배율·상태 | candidate2-focus3 mobile-gate/mobile-mason/max-gate와 candidate2-opened gate/inner/mobile-gate: 세로 라벨/통로, 최대1.65에서 문틀과 경계, 실제 개방 후 장애물 소거/출구 안내를 확인 |390×844 Chromium viewport이며 실기기 아님. 개방 snapshot은 전투 격리 fixture |
| 별도 최종 종합 | final overview/gate/mobile-mason을 별도 실행 후 직접 다시 열어 깊이·접합·목표 가독성/장식 가림을 함께 확인. 생산45면/옛 transition0/전용 변형4종, pageerror/HTTP실패0 | 정상 장기 전투·실기기·전체 장 미술·성능 채택을 뜻하지 않음 |

최종 선택 JPG: [전체](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/final-overview.jpg), [일반 석문](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/final-gate.jpg), [모바일 석공](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/final-mobile-mason.jpg), [모바일 석문](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/final-mobile-gate.jpg), [개방 상태 — 격리 상호작용 표본](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/opened-gate.jpg). 후보2의 입구 일반 사진은 위 링크를 유지한다. 각1MB 미만이며 자동 나머지 화면/원자료는 `_local/reports/stage13-vector-art/`에만 있다.

실제 실행: 공통 `npm run build` 성공(현재 그래프351파일); `node tests/web-split.mjs` 성공(생성hash/바이트·생산 데이터 재조립·Game/embedded 진입·저장 보호·Workshop 연결). 이는 다른30장 전투/미술 순회를 한 것이 아니다. 보존/순수성 검사와 짧은 접근 검사는 위 범위만 통과했다. 새 FPS·첫 준비 시간·동적 성능 주장은 하지 않는다. 원경의 valleyFar→cave-entrance/interior는 기존 카메라/천장 깊이 혼합을 그대로 사용하며 목표 진행으로 전환 trigger를 만들지 않았다.

SOP의 변경 범위 내부 검수 기록을 마쳤으나 기능 숫자로 미술 합격을 선언하지 않는다. 부모가 후보2의 실제 픽셀을 판단한 뒤 master 반영/Pages 발행한다. 이 브랜치는 master934fcabd를 유지했고 초상화 시안/오디오/전역 renderer/main/실루엣을 수정하지 않았다.

최종 화면 입력 SHA256: campaign `1fb88127aa3d30be33fcff42801b00de4328442797841df0d145b12db4496b37`; 저작 `4d238ec01aadaf245eb88b6adf9b18c5477aeee946279c5612fe4755af8c99b5`; web manifest `d172dafc3023bb46ab5be56fdab602edab8895af8228565201f7ae504fa431a9`.

## 부모 지적에 대한 집중 형태 보정 shape3

부모가 직접 본147b4c19의 전체/석문 사진은 미술 미승인이다. 아래 보정은 그 지적(하단4개의 큰 밝은 면, 천장 거대 삼각형, 붙인 사각 문틀)에 한정하며 새 전체 SOP 완료/승인으로 표현하지 않는다.

- 석문 일반 시야의 바닥: 기존 큰 모암 명암을 바탕에 두고, 경사 방향의 엇갈린 중간 층면으로 연결했다. 단색 면을 화면 폭 약1/4보다 크게 남기던 구간을 나누고, 넓은 포켓·꺾인 파단·낮은 돌턱의 서로 다른 깊이3곳을 선택적으로 둔다. 모든 면에 밑뚜껑/가느다란 선을 붙이지 않았다. 초안 픽셀에서 줄 정렬이 보인 부분은 접합 폭/깊이를 비대칭으로 바꾸었다.
- 천장: 거대한 삼각 면의 아래/중간 부분을 엇갈린 모암 층과 움푹 들어간 접합으로 이었다. 외곽 실루엣과 통행 공간은 그대로다. 층의 크기·깊이가 모두 같아지지 않게 shared junction을 저작했다.
- 석문: 기존 개구부를 남기고, 문설주2~3개의 두꺼운 석재와 엇갈린 상인방3덩어리가 뒤의 모암/천장에 물리도록 전용 기존 에셋을 보완했다. 장식 테두리를 늘리는 대신 하중을 받는 어깨와 상인방 아래 접촉 그림자를 둔다.
- 석공/문 기초: 공통 `stage12:quarry-carrier-rubble`을 기존 바닥에 지지하는 비충돌 후면 장식2묶음으로 재사용했다. NPC2445의 구조 라벨/몸체와 문 앞 사격·통로를 가리지 않는다. 새 collider/발판은 없다.

이번에 직접 연 대표 화면은 정확히 같은3구도다: [전체](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/shape3-overview.jpg), [석문 일반 거리](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/shape3-gate.jpg), [모바일 석공](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/shape3-mobile-mason.jpg). 실제 픽셀에서 하단이 큰 밝은4면으로만 읽히던 상태와 천장의 큰 삼각형이 중간 층/겹침으로 나뉘었고, 문틀의 외측 석재가 천장까지 이어지는 것을 확인했다. 문설주/상인방이 최종적으로 충분한 중량과 일체감으로 읽히는지, 중간 면이 반복적인 타일 인상 없이 읽히는지는 부모의 종합 미술 판단을 받는다. 면 개수나 기능 검사로 합격시키지 않는다.

최소 관련 검사: `npm run build`, `node tests/stage13-vector-art.mjs`, 위 Chromium3구도(오류/HTTP실패0). 기존 보호 게임 데이터/원본 Library/다른29장 자료 동일, 새 잔석은 비충돌 후면 장식만, prepare 재사용/Canvas 상태/전투 불변·캐시 draw Path2D 새 생성0 확인. 공유 renderer/main/원경/실루엣/오디오/이야기·대사·문구 모듈을 바꾸지 않았으므로11장 재검수·전투 완주·기존 전체 검사를 반복하지 않았다. 이전 접근/문 개방 기록은 이전 실행 그대로이며 이번 재실행으로 주장하지 않는다. 성능/FPS 개선 주장은 없다.

자동 사진/결과는 `_local/reports/stage13-vector-art/shape3/` 및 preservation.json에 두고, 위 선택 JPG3장만 전달 보존한다. 각1MB 미만. Library의 기존 업로드 전 network 차단을 반복 시도하지 않고 검토 브랜치 경로로 전달한다. master/Pages 미변경. 서사 개편 소유 브랜치 `story/narrative-voice-v2-20261022`와 내용을 가져오거나 수정하지 않았다.

shape3 화면 입력: campaign SHA256 `04ea9f65102bd4c2ed4aaa861a024182ff520c5ed49e1e063de765cb40d83240`; 저작 SHA256 `199479ec57b79744f868c5933252d523eea816855f817d3dd9ebbc17e4a17891`; manifest SHA256 `a7ddbfbba4298933888fc8307c773d32f92aa573a6064d22e7b83a75f3a2f2be`.

## Shape4 · 왼쪽 전경/상부 천장 교정

기준은 부모가 원격 보존을 확인한 `c32a272407a2678003c2df4cab8e85cdd38a4bdf`. 부모는 shape3의 문틀을 개선으로 인정했으나 전체 미술을 통과시키지 않았다. 이번 범위는 왼쪽 아래 거대 삼각 단색 면과 위/오른쪽 천장 덩어리 두 곳이다.11장 승인 후보4의 `72a8788f` 내 `candidate4-final-overview.jpg`를 직접 열어 중간 형태의 밀도와 기존 벡터 명암을 대조했다.11장 렌더러나 면 배치를 복사하지 않았다.

### 정의 교체와 보존

`tools/environment/stage13-vector-finish.mjs`의 초기 서쪽 큰 삼각 층/얕은 표면 전용 분할, 거대한 천장 삼각 바탕과 가려진 초기 nose 면을 제거했다. 보행면 아래부터 깊은 앞면까지 이어지는 west-bed와 상부/외측까지 이어지는 vault-course의 활성 정의로 교체했다. 인접 면은 같은 저작 꼭짓점과 꺾인 경계를 공유한다. 일부 접합에만 짧은 돌턱과 깊은 음영을 두며, 닫힌 독립 돌·전면 균일 격자·입자/노이즈·지형 이미지로 채우지 않는다. 첫 실제 화면의 곧은 사다리꼴 반복과 근경의 뾰족한 분할을 발견해 공유 경계의 꺾임/서로 다른 종료점·선택적인 중간 되접힘으로 수정한 뒤 아래 최종 소스 화면을 갱신했다.

문틀 SVG와 기존4변형을 포함한 **Library 전체, 장식 배치 전체는 shape3와 정확히 같다.** terrainPlanes와 stoneFinish.planeCount 두 미술 필드만 제외하면 캠페인 전체가 shape3와 동일한 것을 검사했다. 충돌 polygon/보행선·선택길/actor·적/HP/주민 구조→문→출구 조건/서사·문구/저장 데이터는 바꾸지 않았다. 석문 앞 기존 지층은 유지하고 서쪽 연결과 천장 모암만 이어졌다. 공유 renderer/main/실루엣/오디오/초상화/이야기 소스는 수정하지 않았다.

### 최종 소스의 실제 집중3회와 별도 전체 검수

| 구분 | 실제 카메라/사진 | 직접 확인한 내용 |
|---|---|---|
| 집중1 전체 |4100/3450/.17,1440×900 | 왼쪽 아래의 하나의 큰 삼각 면 대신 상부·중간·깊은 층리가 이어짐. 천장도 석문 주변에서 끝나던 중간 형태가 위/오른쪽까지 연결됨. 큰 명암 방향은 보존 |
| 집중2 중간 거리 | 서쪽1750/4070/.3, 천장6350/2500/.3,1440×900 | [왼쪽 전경](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/shape4-west-middle.jpg)·[상부 천장](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/shape4-vault-middle.jpg)의 중간 파단/되접힘과 공유 경계·음영. 표면 밑에 별도 삼각 바탕이 노출되던 문제 제거 |
| 집중3 근경/세로 | 서쪽1700/3950/.6, 천장6500/2400/.55,1440×900; 서쪽2100/3700/.45,390×844 | [전경 근접](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/shape4-west-near.jpg)·[천장 근접](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/shape4-vault-near.jpg)의 선택적 돌턱·깊은 틈/중간 분할과 [모바일](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/shape4-west-mobile.jpg)의 석공 라벨/보행면 가독성을 직접 확인 |
| 별도 최종 종합 | 동일 소스로 다른 실행의 overview/gate/west-mobile | [최종 whole overview](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/shape4-overview.jpg)를 다시 열고, 문틀 일반 거리와 세로 화면까지 함께 확인. 보존된 석문/행동 공간과 두 암체의 연결을 대조 |

위6개 선택 JPG는 각1MB 미만이다. 전체/중간/근경에서 빈 대형 면만 남던 상태를 수정했지만, 모든 넓은 면을 같은 폭으로 잘게 채우지는 않았다. 큰 모암 덩어리와 저대비 여백도 남긴다. 중간 형태의 자연스러운 암반 조직/최종 깊이감은 부모의 실제 픽셀 종합 판단 대상이며, 자동 검사·면 개수·검수 횟수를 미술 합격 근거로 쓰지 않는다.

### 관련 검사와 정확한 한계

- `npm run build`: 공통 생성 성공. `node tests/stage13-vector-art.mjs`: 기존 보호 데이터 검사에 shape3 대비 terrainPlanes/planeCount 외 캠페인 전체 동일 검사를 추가해 통과했다. 저작 재현/멱등·렌더 battle 불변/Canvas 상태·prepare 재사용/sceneVersion 무효화·cached material draw Path2D 신규 생성0을 확인했다.
- 생산 브라우저의 네 검수 그룹이 같은 campaign/저작 해시를 사용했고 pageerror/HTTP실패0이다. 최종 일반 카메라와 모바일에서 world/screen cache hit 증가도 확인했다. 이는 정적 고정 화면 표본이며 정상 동적 FPS/실기기 성능 계측이 아니다.
- 전체 저작 면은90→161(바닥88/천장69/기존 작업 참4)로 증가했다. 초기 준비/직접 draw의 실제 fill 작업 증가가 있을 수 있다. 캐시 재사용과 Path2D 신규 생성0을 draw 비용0 또는 성능 동일로 표현하지 않는다. 새 성능 주장은 하지 않았다.
- 전역 연결/충돌/게임 규칙이 바뀌지 않아11장·다른 장 전투·오래된 무관 실패·구조/문 통과를 재실행하지 않았다. 이전 플레이 기록은 과거 실행 그대로다.14장을 시작하지 않았고 master/Pages를 변경하지 않았다.

실제 변경 소스는 `tools/environment/stage13-vector-finish.mjs`와 `shared/data/campaign.json`; 검증 보조는 `tests/stage13-vector-art.mjs`와 `tools/testing/stage13-vector-art-capture.py`다. 나머지 실행 차이는 이 소스에서 생성한 루트 HTML3개와 web 자산 그래프다. 선택 사진 외 자동 결과/중간 편집 화면은 `_local/reports/stage13-vector-art/`에만 보존한다. 기존 Library helper의 업로드 준비 전 네트워크 실패를 반복 시도하지 않고 Git 검토 경로로 전달한다.

최종 화면 입력 SHA256: campaign `940e3ffce3f7151e6f1d29bdfb15c1758442f85aea1fa5aeba4a1e35c2556831`; 저작 `63484d4434e54f1d938b1ef5c10d68701e68f8947a61f9ef4680018ce6f10207`; web manifest `0551e2e07d42a020baf851a0f4bf70bcba5722e66e63dd2073f11a5370b0c6ee`. 네 검수의 runtime/render source는 동일하며 이 수정 커밋의 파일과 대응한다.

## 배포 후 QA · 왼쪽 재질 시작 경계

이 결함은 앞선 고정 구도의 미술 검수 완료와 별개다. 부모는 shape4 픽셀/보호 검사/ancestry를 확인해 master를 `c5b51319ef887943726434d84db596f07254bbd3`로 반영하고 Pages39798509695 성공·공개 진입 `game.f4a396ddd49c2dfe.js`를 확인했다. 그 뒤1180×757의 실제 UI 입장/줌아웃에서 왼쪽 사각형 같은 재질 시작을 발견했다.

### 추측이 아닌 재현과 원인

이번 환경의 공개 URL 열기는 `net::ERR_TUNNEL_CONNECTION_FAILED`로 실패했다. 부모 제공 `stage13-public-left-edge.png`는 Library 메타데이터/이미지 읽기 응답만 확인됐고 실제 바이트 다운로드는 `download failed`로 실패해 원본 픽셀을 보았다고 하지 않는다. 대신 원격 master/검토 브랜치가 같은 c5b51319이며 checkout의 진입 파일도 부모가 공개 확인한 f4a396ddd49c2dfe와 같은 것을 확인했다. 이 **동일 생성물**을 로컬 HTTP에서 실행했다.

`tools/testing/stage13-left-edge-capture.py`는 신규 격리 브라우저에서 설정→기록·관리→검수 모드→여정첩2막13장→휴식터→진입→대화 넘기기를 실제 클릭한다. 기본뷰와610,320에서 wheel down757을2회, 실제 pointer drag의 왼쪽/아래 팬을 촬영한다. 이 네 화면에는 카메라 좌표·배율을 대입하지 않는다. 마지막 전체 맵만 별도1440×900/4100,3450,.17의 고정 비교다.

[수정 전 실제 UI 줌아웃](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/left-edge-before-wheel.jpg)에서 재질 시작은 화면 **x435.56**, 설오 x577.86, 석공 x946.61로 부모 구도를 재현했다. scene은389.986/2736.045/.173529이고, 역투영한 재질 시작점은 **world x=-500**이다. world x=0의 투영은 화면x522.33으로 서로 다르다. 실제 canonical 바닥 polygon과 renderer clip은 **x=-6000**까지 이어지며 mother-rock-base도 그 전체를 채운다. 원인은 clip/월드 끝이 아니라, 서쪽 상세 저작 면이 x=-500 부근에서 끝나 바깥쪽은 기본 단색만 남은 것이다. 이전 overview의 왼쪽 view가 약-135라서 이 경계가 화면 밖에 있었음을 확인했다.

### 최소 수정

기존 승인161면과 상대 그리기 순서를 한 점/색도 바꾸지 않고, 그 왼쪽으로20개의 정적 공유 층면만 연결했다. 가장 안쪽 연장 면은 기존 a/h/q/A/J/S 경계와 색을 그대로 공유하므로 옛 수직 시작점이 재질 경계로 남지 않는다. 바깥쪽은 실제 polygon의 왼쪽 끝-6000까지 이어지며 상단은 canonical 지형의 언덕/골짜기 꼭짓점을 모두 따라간다. 카메라/줌 자유도, 물리 범위나 기존 지형을 좁혀 숨기지 않았다. 새 collider/Library/장식·매 프레임 geometry/texture·노이즈는 없다.

실제 미술 소스 변경은 `tools/environment/stage13-vector-finish.mjs`와 그 출력 `shared/data/campaign.json`이다. 검증 보조로 `tests/stage13-vector-art.mjs`를 보강하고 실제 UI 촬영 도구 `tools/testing/stage13-left-edge-capture.py`를 추가했다. 루트 HTML/web 생성물을 재생성했다. 공유 renderer/main/bounds/물리/캐시 코드, 서사·문구, 문틀/기존 절리·배치·목표/저장/다른29장은 그대로다.

### 실제 수정 후 화면과 보존 검사

- [같은 UI wheel 줌아웃](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/left-edge-after-wheel.jpg): 원래 x435 부근의 수직 면 시작이 없어지고 왼쪽 층리가 이어짐. 입력은 수정 전과 같고 카메라 자유도도 같다. 프레임 타이밍에 따른 camera.x 차이는0.82world, 옛 경계의 투영은435.42다.
- [실제 왼쪽 팬 한계](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/left-edge-after-pan.jpg)와 [왼쪽 아래 팬](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/left-edge-after-lower.jpg): 원래 focus.x=-320 제약, 보이는 왼쪽 extent=-3720에서도 갑작스러운 수직 시작 없이 연결됨. 지형은 더 왼쪽-6000까지 작성돼 있다.
- [기본 진입뷰](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/left-edge-entry-default.jpg)와 [전체 맵](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage13-vector-art-20261022/review/left-edge-overview.jpg): 보행면/배우/목표·문틀·천장과 원경 보존을 직접 확인했다. 앞선 고정 구도만 재촬영해 해결로 판정하지 않았다.

`npm run build` 및 `node tests/stage13-vector-art.mjs` 통과. 승인161면 원본/순서 동일, 기존 캠페인의 terrainPlanes/planeCount 외 전부 동일, x≤-400 외곽만20면 추가, -5700..-600의130개 실제 바닥 아래 표본에서 상세 재질 coverage를 확인했다. 동일 표본의 대표 world -1000/+600은 배포본에 상세 재질이 없었음을 함께 검사한다. 재현 도구의 수정 전후4개 UI 화면에서 모든 동행/주민의 좌표·HP 및 resident 목표도 같았다.

기존 공통 prepare의 source/version 무효화·객체 재사용·Canvas/battle 상태 보존과 cached material draw 새Path2D0을 확인했다. 실제 UI wheel→left pan→lower pan에서 world/screen cache hit가 증가한다. UI 화면5장의 pageerror/HTTP실패0. 이는 캐시 경로 보존이며 draw/최초 준비 비용0이나 FPS 동일을 뜻하지 않는다. 면161→181 증가이고 새로운 성능 주장은 하지 않았다. 다른 장/전체 전투·무관 실패를 재검사하지 않았다.

선택 JPG6개만 전달용으로 보존하며 각1MB 미만이다. 원자료/자동 화면은 `_local/reports/stage13-left-edge/`에 둔다. 공개 URL 재검수는 현재 환경의 터널 오류로 미실행이고, 부모가 공개 QA 후 master를 업데이트한다. 이 작업은 별도 브랜치에만 보존하며 다른 변경과 병합하지 않고14장을 시작하지 않는다.

경계 수정 후 실제 화면 입력 SHA256: campaign `bfa3bde1af3d02e66851e617f280a159b4c752892650d9dd67af2354bbd81fed`; 저작 `4f5e42f3b34cf482ea1c91fca6df92857c1a886c0e961eea525c3ce7f28f1ce0`; web manifest `b553432565360e5c0a19c7fa016baaa60c62d07531035329b9550886ce7dd369`.
