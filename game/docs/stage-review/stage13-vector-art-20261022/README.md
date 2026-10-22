# 13장 숨은 석문 · 벡터 재질/작업장 미술 보완

현재 상태: 생산 연결 교정 후보2 고정. 변경 범위 집중3회·별도 최종 화면 검수/보존·짧은 격리 접근 확인 완료. 부모 최종 미술 판단·master/Pages 발행 대기.

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

- [전체 연결](review/candidate1-overview.jpg)
- [입구·석공 접근](review/candidate1-entry.jpg)
- [석문·낮은 회랑](review/candidate1-gate.jpg)

`node tests/stage13-vector-art.mjs` 통과: master934fcabd 대비 보호된13장 데이터/다른29장/공통 원본 동일, 저작 재현·멱등, 비충돌 변형4종, 재질 draw의 battle 불변/Canvas 상태 보존/정적 Path2D 재사용/sceneVersion 무효화 확인. 기능 숫자를 미술 합격으로 쓰지 않는다. 집중3회와 별도 최종, 구조 접근/문 통과는 후보1 기록 시점 미완료였으며 아래 교정 후보2에서 따로 수행했다. 자동 보고/기타 사진은 `_local/reports/stage13-vector-art/`에 둔다.

전달 차단: Library helper의 `hosted apps tools/list request failed: network`로 업로드 준비 전 실패했다. 저장 성공/미확정 업로드가 아니며 재전송하지 않았다. 같은 JPG3장은 위 검토 브랜치 경로로 전달한다.

## 생산 연결 교정 후보2

첫 후보 `cb725fff`의 빌드에서는 기존 `applyCavernTransitionLayers`가 전이용 면17개를 다시 추가하고 장면 재저작이 장식 참조 일부를 되돌렸다. 따라서 후보1의 큰 독립 절리/옛 도구 사진은 최종 근거에서 제외한다. `shared/build.mjs`의 기존 저작 체인 끝에서 `stoneFinish.revision===1`인13장에만 같은 opt-in 저작을 재적용한다. 전역 renderer/main을 변경하지 않으며 공통 geometry/route 저작은 그대로 실행한다. 실제 생산 자료의45면/전용 장식 참조를 검사에 추가했다.

교정 후 직접 연 같은 카메라 사진: [전체](review/candidate2-overview.jpg), [석공 접근](review/candidate2-entry.jpg), [석문·회랑](review/candidate2-gate.jpg). 후보1의 붙은 블록/짙은 절리는 제거됐고 연결된 모암면과 짧은 접합이 보인다. 여전히 부모의 실제 픽셀 판단 전이다.

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

최종 선택 JPG: [전체](review/final-overview.jpg), [일반 석문](review/final-gate.jpg), [모바일 석공](review/final-mobile-mason.jpg), [모바일 석문](review/final-mobile-gate.jpg), [개방 상태 — 격리 상호작용 표본](review/opened-gate.jpg). 후보2의 입구 일반 사진은 위 링크를 유지한다. 각1MB 미만이며 자동 나머지 화면/원자료는 `_local/reports/stage13-vector-art/`에만 있다.

실제 실행: 공통 `npm run build` 성공(현재 그래프351파일); `node tests/web-split.mjs` 성공(생성hash/바이트·생산 데이터 재조립·Game/embedded 진입·저장 보호·Workshop 연결). 이는 다른30장 전투/미술 순회를 한 것이 아니다. 보존/순수성 검사와 짧은 접근 검사는 위 범위만 통과했다. 새 FPS·첫 준비 시간·동적 성능 주장은 하지 않는다. 원경의 valleyFar→cave-entrance/interior는 기존 카메라/천장 깊이 혼합을 그대로 사용하며 목표 진행으로 전환 trigger를 만들지 않았다.

SOP의 변경 범위 내부 검수 기록을 마쳤으나 기능 숫자로 미술 합격을 선언하지 않는다. 부모가 후보2의 실제 픽셀을 판단한 뒤 master 반영/Pages 발행한다. 이 브랜치는 master934fcabd를 유지했고 초상화 시안/오디오/전역 renderer/main/실루엣을 수정하지 않았다.

최종 화면 입력 SHA256: campaign `1fb88127aa3d30be33fcff42801b00de4328442797841df0d145b12db4496b37`; 저작 `4d238ec01aadaf245eb88b6adf9b18c5477aeee946279c5612fe4755af8c99b5`; web manifest `d172dafc3023bb46ab5be56fdab602edab8895af8228565201f7ae504fa431a9`.
