# 11장 벡터 지형 미술 · 2026-10-22

> **현재 상태: 부모 미술 미통과.** `69992d5b` 첫 후보는 부모가 직접 검토 후 중앙/동쪽의 중간 규모 파단면과 뿌리 접합 부족으로 반려했다. 아래 첫 후보의 검사/종합/성능 기록은 미술 합격이 아니다. 두 번째 후보 역시 부모가 독립 블록처럼 뜨는 파단면을 지적해 최종 통과하지 않았다. 세 번째 후보는 공유 경계 개선에도 중앙/동쪽의 중간 면이 너무 넓어 부모 미통과다. 부모는 네 번째 후보 최종 사진을 직접 보고 미술 방향을 채택 가능하다고 판단했다. 미술 데이터는 고정하며 비용 분리 확인/통합 인계 전 master/Pages에 반영하지 않는다.

## 짧은 미술 설계 카드

- 원본: master `a091c6bd5e64eff748f5028fb6d0080faea3da87`. 작업 브랜치 `fix/stage11-vector-art-20261022`. 11/14/17/18 진행 개선과 23장 호송을 포함한 원본을 보존한다. master/Pages 반영은 부모의 최종 미술 판단 이후 부모가 수행한다.
- 장소: 2막 1장 「매듭을 거둔 아침」. 서측 혼매듭 → 의식터 → 주민 암대 → 북쪽 혼의 흔적. 실제 시작/중앙/아랫길/동쪽 경사를 한 협곡으로 읽히게 한다.
- 유지: 승패·동행·NPC/적·목표·대사·이벤트·보상·저장·새 흔적 좌표·충돌 polygon·발판·선택 사격로·의도된 부유와 들림. 이번 작업은 전투/난이도 개편이 아니다.
- 큰 형태: 차가운 화강암의 연결된 층상 암대와 깊은 파단면을 하단까지 구성한다. 둥근 밝은 돌 무늬를 반복하지 않는다. 공중 암체 아래는 닫힌 재질 면으로 마감하고 빈 공간은 보존한다.
- 중간 형태: 위쪽 풍화면 → 비스듬한 층리 → 내려가는 절리의 방향이 같은 암체 안에서 연결된다. 큰 뿌리는 암벽 틈에 들어가는 접촉 그림자·뻗는 뿌리 결로 결합한다.
- 가까운 형태: 모서리 부분광·굵은 뿌리 결·피난처의 낮은 천 차양/자리/물건. 주민과 통행면은 비워 둔다. 접근 불가능한 지형에 목적/이벤트를 추가하지 않는다.
- 팔레트: 기존 11장의 청회색 화강암, 먹빛 후벽, 갈색 고목, 회녹색 식생과 작은 삼베색 생활 소품. 이미지 원경은 그대로 사용한다.

## 공통 벡터의 재사용/확장 근거

`MAP_ART_PIPELINE.md`, `STAGE_PRODUCTION_SOP.md`, `.agents/skills/honro-environment/SKILL.md`, 공통 화강암 `shared-geology/ASSETS.md`를 읽었다. 공통 모듈의 독립 둥근 바위 외곽을 대형 절벽에 반복하는 것은 지적된 문제를 강화한다. 기존 11장 opt-in 재질의 실제 collider clip/prepare 캐시 안에서 **저작된 큰 명암면과 층리 데이터**를 사용한다. 기존 공통 SVG compiler·Library instance·L1 back/prop·정적 월드 tile을 재사용한다. 뿌리 결은 기존 11장 목재 재질을 확장하며 피난처는 기존 11장 짐 에셋을 확장한다. 전역 renderer/main/UI 및 다른 29장의 스타일/성능 정책은 변경하지 않는다. 매 프레임 무작위·무한 파티클·새 렌더러는 없다.

## 변경 전 직접 픽셀 검토

`act2-pacing-release-20261022/evidence/11-focus1-overview.jpg`, `11-focus2-refuge.jpg`, `11-final-lower-route.jpg`, `11-focus3-mobile-trace.jpg`를 이 환경의 이미지 뷰어로 직접 열었다. 큰 하단이 단색/그라데이션으로 남고, 윗면 밝은 둥근 무늬가 반복된다. 후벽과 근경의 접합이 약하며 뿌리는 뾰족한 쐐기로 끝난다. 주민 옆 짐은 작고 장소가 읽히지 않는다. 기존 모양 보존이나 진행 검증을 미술 합격으로 간주하지 않는다.

## 검수 기록

구현 뒤 같은 카메라의 before/after JPG(각 1MB 미만), 집중 검수 3회와 별도 최종 종합, 지형/배우/목표 불변 검사, 캐시/프레임 표본을 이 문서에 기록한다. 실제 보지 않은 화면을 통과로 기록하지 않는다.

## 구현과 집중 검수

미술 소스는 `tools/environment/stage11-vector-finish.mjs`이며 기존 11장 저작기의 마지막 단계에서도 호출한다. 원본 master에서 이 파일만 직접 실행해 같은 미술 delta를 재생할 수 있다. 다른 장 재생성 없이 현재 gameplay를 보존한다. 9개 큰 암체에 저작 재질을 넣고 기존 피난처/뒤 절벽 에셋 2개의 identity를 유지해 확장했다. 11장 전용 재질은 `materialRevision:2`에서만 사용하며, 그 필드가 없는 저장은 기존 재질을 사용한다.

1. **전체 줌아웃/연결 검수:** `review1-overview.jpg`에서 균일한 밝은 층리 띠가 암체 전체를 감싸는 문제를 직접 보고 기각했다. `review1b-overview.jpg`에서 부분 층리·좁은 절리·하단 음영으로 교정했다. 마지막 `focus1-final-overview.jpg`, `focus1-final-west.jpg`를 직접 열어 서쪽 진입부터 중앙/주민 암대/동쪽 경사까지 큰 면이 이어지고, 부유 구조와 기존 틈이 보존됨을 확인했다. 큰 파단은 실제 collider 안에만 있고 독립 발판 외곽을 추가하지 않는다.
2. **근접 재질/뿌리/장소 검수:** `review2-refuge.jpg`와 `review3-max-refuge.jpg`에서 차양 기둥/바구니 결이 생략되어 덩어리만 보이는 문제를 확인했다. 현행 공통 미술 정책은 장식 Path2D stroke를 생략하므로 11장 소품의 기둥·밧줄·바구니 결을 채운 벡터 리본으로 저작했다. `focus2-final-central.jpg`, `focus2-final-refuge.jpg`를 직접 열었다. 기존 통행 경사 아래의 얕은 풍화면, 암벽 안으로 갈라지는 곡선 뿌리와 접촉 그림자, 굵은 목재 결, 낮은 차양/자리/광주리/물동이가 확인된다. 주민은 차양의 서쪽 바깥에 그대로 노출되고 통행면은 가리지 않는다.
3. **모바일/최소·최대 배율 검수:** `focus3-final-mobile-trace.jpg`(390×844), `focus3-final-min-mobile.jpg`(844×390의 실제 최소 배율), `focus3-final-max-refuge.jpg`(1440×900의 실제 최대 1.65)를 직접 열었다. 목표·경사 통행면과 주민을 구별할 수 있으며 차양/뿌리는 목표 UI와 겹치지 않는다. 최소 배율에서는 물건의 세부 결이 사라지고 차양의 덩어리만 남는 것이 정상이다. 가로 모바일의 HUD가 차지하는 기존 화면 높이는 그대로다. 그 영역까지 미술이 보인다고 주장하지 않는다.

초기 캡처 도구의 resize 직후 카메라는 viewport 비율 보정을 한 번 더 받았다. 최종 도구는 viewport를 먼저 안정화한 후 카메라를 정하고, 실제 결과 camera/limits를 JSON에 기록한다. `baseline-*`은 master를 별도 임시 디렉터리에 읽기 전용으로 풀어 같은 도구/카메라로 촬영한 비교본이다. 초반 `before/candidate/refined` 표본은 최종 비교 근거로 사용하지 않는다.

공통 renderer/main/UI/캐시 정책은 변경하지 않았다. 최적화 과정에서 재질 면별 그라데이션을 암체당 한 번의 깊이 음영으로 합쳐 정적 tile 준비 비용을 줄였다. 새 Path2D/목재 결은 기존 prepare 캐시와 sceneVersion 수명을 공유한다. 매 프레임 무작위/파티클은 추가하지 않았다.


## 첫 후보의 별도 종합 실제 픽셀 · 부모 미술 미통과

미술 구현 커밋 `69992d5b015f4ee32239c83eb1e69cb4adacb875`의 생산 Game HTML을 새 Chromium 세션에서 열고 `final-*` 10장을 별도로 촬영했다. 전부 직접 이미지 뷰어로 열었다. 전체/서쪽, 중앙/피난처, 모바일 흔적/최대/최소, 추가 시작/아랫길/동쪽 능선의 순서로 비교했다. 큰 재질 면과 하단 명암이 끊기지 않고, 흰 tile 이음/새 발판 외곽/주민 가림은 관찰되지 않았다. 실제 지형의 의도된 공중 구조·기존 틈·경사와 원경 이미지는 유지했다. 원본의 뾰족한 뿌리 외곽은 물리 보존 조건 때문에 남으며, 내부 굽은 결·어두운 하부·암벽 속 곡선 갈래로 연결을 보완한 범위다. 전체 조형을 자연주의 암벽 수준으로 완성했다고 주장하지 않는다. 큰 암체의 면 구성과 뿌리 자연스러움에 대한 최종 미술 채택은 부모가 이 화면을 직접 보고 판단한다.

| 검토할 장소 | 같은 카메라 변경 전 | 최종 구현 |
|---|---|---|
| 전체 협곡 | [baseline](evidence/baseline-overview.jpg) | [final](evidence/final-overview.jpg) |
| 서쪽/초기 암대 | [baseline](evidence/baseline-west.jpg) | [final](evidence/final-west.jpg) |
| 중앙 암체/뿌리 | [baseline](evidence/baseline-central.jpg) | [final](evidence/final-central.jpg) |
| 주민 피난처 | [baseline](evidence/baseline-refuge.jpg) | [final](evidence/final-refuge.jpg) |
| 모바일 동쪽 흔적 | [baseline](evidence/baseline-mobile-trace.jpg) | [final](evidence/final-mobile-trace.jpg) |
| 최대 확대 피난처 | [baseline](evidence/baseline-max-refuge.jpg) | [final](evidence/final-max-refuge.jpg) |
| 가로 모바일 최소 배율 | [baseline](evidence/baseline-min-mobile.jpg) | [final](evidence/final-min-mobile.jpg) |
| 아랫길/지형 이음 | [baseline](evidence/baseline-final-lower-route.jpg) | [final](evidence/final-final-lower-route.jpg) |
| 시작 지점 | [baseline](evidence/baseline-final-start.jpg) | [final](evidence/final-final-start.jpg) |
| 동쪽 능선 | [baseline](evidence/baseline-final-east.jpg) | [final](evidence/final-final-east.jpg) |

`baseline-all.json`과 `final-all.json`의 결과 camera/viewport 10쌍이 정확히 같다. 모든 JPG는 1MB 미만(최대 148,974 bytes)이다. 원격 경로는 브랜치 `fix/stage11-vector-art-20261022`의 `game/docs/stage11-vector-art-20261022/evidence/`이며 집중 회차 화면은 `focus1-final-*`, `focus2-final-*`, `focus3-final-*`다. 최종 전후 비교는 위 `baseline-*`/`final-*`를 사용한다.

## 실제 검사와 보존 근거

- `npm run build`, `node tests/web-split.mjs`: 생산 HTML/자산 hash/재조립/embedded 저장 경계 통과. 생성 web 파일은 공통 빌더 출력이며 전역 renderer 소스 수정은 없다.
- `node tests/stage11-vector-finish.mjs`: 원본 master와 비교해 지형·충돌·배우·markers·events·목표·보상·초기 상태·다른29장과 공통 Library 불변, 저작 delta의 재현성과 idempotence 통과. 유일한 element 변경은 기존 짐 에셋의 visual scale/layer다. [상세 hash](evidence/preservation.json).
- `node tests/stage11-landscape-art.mjs`: 실제 Canvas 31개 지형, 새 저작 재질9개, 최대 준비 경로54, 렌더 battle 불변/prepare 재사용/sceneVersion 무효화/다른 장 및 옛 전투 opt-out 통과. [결과](evidence/material-cache.json).
- `node tests/stage11-ravine-traversal.mjs`: 기본4인 × 9개의 기존 실제 이동/점프 경로 36개 통과. 충돌 앵커 clearance 실패0. 격리 경로 검사이며 정상 전투 완주가 아니다. [결과](evidence/traversal-summary.json).
- `node tests/act2-pacing-state.mjs`: 11/14/17/18의 기존 진행·보호·묵종 동작·Continue/export/outcome·보상 exactly-once 확인 통과. 처음에는 이 checkout의 결과 출력 폴더가 없어 마지막 writeFile만 실패했고 폴더를 준비한 뒤 같은 검사를 재실행해 완료했다. 검사 소스/기대값은 변경하지 않았다. [결과](evidence/pacing-state.txt).
- 기존 `act2-pacing-capture.py 11`의 실제 키 입력: ArrowRight + production App.frame 20회에서 x720→840, pageerror0/HTTP 실패0. [결과](evidence/keyboard.json). 새 위치로 배우를 옮겨 검사를 통과시킨 것이 아니다.
- **기존 실패:** `stage11-ravine-tactics.mjs`는 기대 적 수45/현재43에서 멈춘다. 원본 master의 소스/데이터에서도 동일한43≠45를 확인했다. 적·전술·기대값을 바꾸지 않았다. [원본 재현](evidence/baseline-tactics.txt).
- 실기기 터치, 전체30장 완주, 새 정상 전투 완주, Pages 배포는 이번 범위에서 수행하지 않았다. 접근 거부/결과 불명 작업은 없다. master는 부모가 최종 미술 판단 후 반영한다.

## 첫 후보의 캐시와 프레임 비용 · 새 후보에 자동 적용하지 않음

초기 회차에 다른 native 검사가 겹친 성능 숫자는 채택하지 않았다. 모든 검사가 끝난 뒤 master HTML과 최종 HTML을 **순서대로 단독 실행**해 다시 측정했다. 같은 camera/viewport당 워밍업8회 뒤 `Scene.render`40회의 중앙값/p95이며 GPU 실기기 FPS나 이동 전투의 장기 표본이 아니다. [전체 원자료](evidence/performance.json).

| 화면 | 중앙값 ms 전→후 | p95 ms 전→후 | 첫 draw ms 전→후 |
|---|---:|---:|---:|
| overview.jpg | 2.3→2.6 | 3.0→4.0 | 86.9→98.3 |
| west.jpg | 6.2→7.2 | 6.9→9.8 | 61.0→77.8 |
| central.jpg | 1.1→0.9 | 2.4→1.7 | 42.3→45.8 |
| refuge.jpg | 0.7→0.7 | 1.2→1.4 | 51.2→56.5 |
| mobile-trace.jpg | 0.3→0.2 | 1.1→0.5 | 31.9→33.1 |
| max-refuge.jpg | 1.2→1.0 | 1.6→1.5 | 3.9→5.1 |
| min-mobile.jpg | 0.9→0.9 | 1.8→1.8 | 53.6→57.4 |
| final-lower-route.jpg | 0.8→0.8 | 1.4→1.4 | 15.3→17.9 |
| final-start.jpg | 6.2→5.7 | 7.0→6.6 | 55.3→85.0 |
| final-east.jpg | 0.2→0.2 | 0.5→0.4 | 48.6→52.1 |

모든 쌍에서 정적 world bytes와 tile 수가 동일하고 warm 구간 world/tile 재빌드0이다. 원경 캐시/화면 캐시 예산도 변경하지 않았다. 최종 warm p95 최고9.8ms이며 중앙/피난처/모바일/최대 확대에서 지속 비용의 큰 증가가 관찰되지 않았다. 서쪽 p95 6.9→9.8ms와 첫 캐시 준비 비용(특히 시작55.3→85.0ms)은 늘어난 표본이므로 숨기지 않는다. 40회 표본으로 전체 기기의 성능 무저하를 보장하지 않으며 실제 기기에서 추가 hitch가 보이면 채택 전에 재검토해야 한다. 세부 path 수를 줄이기 위해 면별 그라데이션 대신 암체당 한 번의 깊이 wash를 사용했고 최종 확대 화면의 결/소품 손실은 직접 재확인했다.


## 두 번째 후보 · 부모 방향 검토용

부모의 10:02 반려 피드백을 반영한다. 처음 후보의 검사를 다시 완료 처리하지 않는다. 새 후보의 미술 합격/종합 검수는 아직 진행하지 않는다.

- `stage11-fracture-fields.mjs`: 암체별 위치·크기·깊이를 정한 중간 규모 파단 영역에 서로 물린 각진 면·암편의 측면·짧은 틈·부분 모서리를 저작했다. 큰 면을 받치는 기존 암대 구조와 함께 보이게 하고, 암편군 외곽을 감싸던 어두운 실루엣은 직접 보고 제거했다. 실제 지형 안에 그리는 내부 재질이며 새 발판/충돌/독립 바위 외곽을 추가하지 않는다. 동일 폭 띠를 전면에 두거나 무작위 노이즈를 생성하지 않는다.
- 중앙은 상단/중간/아래쪽 파단 영역을 엇갈리게 두고, 동쪽 경사는 실제 경사 높이를 따라 중간 면이 기울도록 저작했다. 여전히 큰 빈 면과 반복 조형이 얼마나 자연스럽게 읽히는지는 부모 판단 대상으로 남긴다.
- 뿌리 접합은 돌의 어두운 틈 입구·가까운 돌 입술·목재 쪽의 어두운 끼움부와 두께 변화를 추가했다. 세 공중 뿌리 말단에는 짧은 밝은 파단면/어두운 섬유 갈래를 넣었다. 외곽 collider/보행 범위와 의도된 공중 틈은 보존한다. 피난처의 차양·기둥·자리·광주리·물동이 벡터는 첫 후보 그대로다.
- 후벽에는 큰 전후 면/접합 면을 추가해 가까운 암대의 파단과 깊이를 구분한다. 여전히 낮은 대비를 유지하며 근경의 주민/목표를 가리지 않는다.
- 새 데이터는 `materialRevision:3` opt-in이다. `materialRevision:2` 저장은 기존 저작 면을 계속 읽고, 새 뿌리 끼움/단면은3에서만 준비한다. 전역 renderer/main/UI는 변경하지 않았다. 모든 경로는 scene/terrain prepare에서 한 번 만들어 기존 정적 tile과 재사용한다.

실제 생산 Chromium의 같은 카메라 사진 네 장을 직접 열었다. 촬영 시 소스는 미커밋 상태였으며 `candidate2-preview.json`에 SHA/workingTree와 렌더 소스 hash `3d05112acb5f98a607d6edc19c088a928e3276079e51507d407272fe3f356985`를 기록했다.

| 장소 | 첫 후보 | 두 번째 후보 |
|---|---|---|
| 전체 | [첫 후보](evidence/final-overview.jpg) | [candidate2-overview.jpg](evidence/candidate2-overview.jpg) |
| 중앙 | [첫 후보](evidence/final-central.jpg) | [candidate2-central.jpg](evidence/candidate2-central.jpg) |
| 동쪽 모바일 | [첫 후보](evidence/final-mobile-trace.jpg) | [candidate2-mobile-trace.jpg](evidence/candidate2-mobile-trace.jpg) |
| 피난처 보존 | [첫 후보](evidence/final-refuge.jpg) | [candidate2-refuge.jpg](evidence/candidate2-refuge.jpg) |

빌드와 새 후보 불변 검사/정적 재사용 확인은 통과했다. [candidate2-preservation.json](evidence/candidate2-preservation.json), [candidate2-material-cache.json](evidence/candidate2-material-cache.json): 실제31개 지형, 저작재질9개, 최대 준비 경로89, rendering purity/cache/옛 전투·다른 장 opt-out. Chromium 네 화면 pageerror0/HTTP실패0. 새 후보의 별도 종합/추가 성능 채택 판정은 부모가 두 번째 사진을 검토한 뒤 진행한다. 이전54경로/성능 표본을89경로 후보에 그대로 적용하지 않는다.


## 세 번째 후보 · 중앙/동쪽 일체형 파단면 보완

복구 기준은 기존 원격 최신 `e18d51e17b32c4e84788461d9b65aee4de930dbf`(두 번째 구현 `dccf61c0`)다. 새 브랜치는 `fix/stage11-vector-art-refinement-20261022`이며 이전 SHA에서 중복 구현하지 않았다. AGENTS·환경 스킬·SOP·공통 에셋 지침·이 문서를 읽고 첫 후보 집중/최종8장과 두 번째 후보4장을 이 환경의 이미지 뷰어로 직접 열었다.

부모의 두 번째 후보 반려 이유는 밝은 윗면/짙은 아랫면이 붙여놓은 블록처럼 뜬다는 점이다. 중앙 `rv-ritual-buttress`와 동쪽 `rv-north-trace`만 별도 조각군 대신 **인접 면이 꺾인 경계를 공유하는 연속 암대**로 저작했다. 전체 깊이에 같은 기반암 명암이 이어지고, 선택한 경계 일부에만 짧은 틈과 좁은 모서리광을 둔다. 동쪽은 거대한 전체 polygon 폭을 등분하지 않고 흔적 주변의 실제 표시 크기에 맞춰 유한한 면 좌표를 저작했다. 다른7개 암체 재질·기존 피난처/후벽 Library·뿌리 끼움부/목재 단면·콜라이더·배우·목표·전투·전역 renderer/main/UI는 변경하지 않는다. 재질 opt-in과 정적 prepare/tile 재사용도 기존 경로 그대로다.

로컬 첫 시안에서 분리 조각을 너무 넓게 합친 경계가 사각 패치처럼 드러나 기각했다. 다음 시안의 동쪽 면도 모바일에 비해 지나치게 커서 표시 구간의 공통 경계 위치를 다시 정했다. 아래 최종 선공개4장을 직접 열었다. 중앙은 개별 암편 밑의 검은 뚜껑이 없어지고 이웃 면의 접합으로 이어진다. 동쪽은 통행 경사와 같은 기울기의 중간 면이 한 암체 안에서 이어지고 목표 표시는 유지된다. 여전히 넓고 절제된 면 구성이며 자연스러움/유기적 결합의 최종 미술 채택은 부모가 판단한다. 다른 암체에 남은 두 번째 후보 조형까지 이번에 전면 개편했다고 주장하지 않는다.

| 같은 카메라 | 두 번째 후보 | 세 번째 후보 |
|---|---|---|
| 전체 | [candidate2](evidence/candidate2-overview.jpg) | [candidate3](evidence/candidate3-overview.jpg) |
| 중앙 | [candidate2](evidence/candidate2-central.jpg) | [candidate3](evidence/candidate3-central.jpg) |
| 동쪽 세로 모바일 | [candidate2](evidence/candidate2-mobile-trace.jpg) | [candidate3](evidence/candidate3-mobile-trace.jpg) |
| 피난처/뿌리 접촉 보존 | [candidate2](evidence/candidate2-refuge.jpg) | [candidate3](evidence/candidate3-refuge.jpg) |

선공개는 생산 Chromium의 같은 camera/viewport/상태 fixture이며 실제 전투 완주나 실기기 터치 증거가 아니다. 촬영 당시 미커밋 소스와 `sourceHashes`를 [candidate3-preview.json](evidence/candidate3-preview.json)에 기록했다. JPG 각1MB 미만. 별도 최종 종합/새 성능 채택 결과는 아래 후속 기록에 구분해 남긴다. 첫 후보의3회/성능/기존45≠43 실패를 이번 통과로 재사용하지 않는다.


### 세 번째 후보의 집중3회와 별도 종합 · 부모 최종 채택 대기

최종 미술 소스 커밋은 `4016913c`다. 첫 선공개의 미커밋 sourceHashes와 커밋 후 최종10장의 campaign/저작기/재질 renderer/생성 manifest SHA256이 모두 같음을 대조했다. 이후 미술 소스 변경은 없다. 회차는 이번에 바뀐 중앙·동쪽 및 접촉/가림 영향만 확인하며, 옛 전체 전투·전술 실패를 다시 실행하지 않았다.

1. **전체 면/깊이:** 최종 선공개 `candidate3-overview.jpg`를 직접 열어 중앙의 분리된 밝은 암편 밑 캡이 없어지고 윗면에서 하단까지 같은 암체 내부의 큰/중간 명암면으로 이어지는지 확인했다. 실제 공중 틈과 경사·지지점·기존 원경은 유지한다. 다른7개 암체는 두 번째 후보 그대로여서 기존 블록 조형이 일부 남는다.
2. **근접 재질/접합:** `candidate3-central.jpg`와 `candidate3-refuge.jpg`를 직접 열었다. 중앙에서 이웃 면이 같은 꺾인 경계를 쓰며, 일부 틈/모서리광만 남는다. 뿌리가 만나는 암벽의 어두운 입구와 돌 입술/목재 끼움이 유지되고, 차양·자리·기둥·광주리·물동이와 주민 노출이 유지됨을 보았다. 뿌리/천막/후벽 원본 소스와 데이터는 이번에 손대지 않았고 사실적인 암벽 결합을 최종 완성했다고 주장하지 않는다.
3. **모바일·최소/최대 배율 가림:** 별도 촬영한 `candidate3-focus-mobile-trace.jpg`(390×844), `candidate3-focus-min-mobile.jpg`(844×390의 실제 min), `candidate3-focus-max-refuge.jpg`(1440×900, max1.65)를 직접 열었다. 흔적 주변의 중간 면이 끊어진 대각 암편의 독립 아래 캡 대신 같은 경사 내부 면으로 이어진다. 흔적/화살표와 통행선·주민은 가리지 않는다. 축소에서 작은 결이 사라지는 점과 기존 가로 모바일 HUD의 큰 화면 점유는 그대로이며 그 아래 픽셀을 검수했다고 하지 않는다. [실제 camera/limits/상태](evidence/candidate3-focus-focus3.json).

**별도 종합:** 집중 회차 이후 새 Chromium 세션으로 `candidate3-final-*`10장을 촬영하고 전부 직접 열었다. 전체/서쪽→중앙/피난처→세로 모바일/최대/최소→아랫길/시작/동쪽 능선 순서로, 인접 재질과의 회귀·구조/공중 공간·후벽 대비·목표/배우 가림을 재확인했다. 흰 타일 이음, 새 독립 발판 외곽, 주민/목표의 새 가림은 관찰하지 못했다. 동쪽 바깥 능선은 큰 저대비 면이 남고, 중앙도 절제된 넓은 면으로 보인다. 이 조형이 충분히 유기적으로 연결됐는지에 대한 미술 최종 합격은 부모의 실제 이미지 판단이다. 기능 불변이나 검수 횟수로 합격을 대신하지 않는다.

| 장소 | 최종 종합 JPG |
|---|---|
| 전체 | [overview](evidence/candidate3-final-overview.jpg) |
| 서쪽 | [west](evidence/candidate3-final-west.jpg) |
| 중앙 | [central](evidence/candidate3-final-central.jpg) |
| 피난처/뿌리 | [refuge](evidence/candidate3-final-refuge.jpg) |
| 동쪽 세로 모바일 | [mobile-trace](evidence/candidate3-final-mobile-trace.jpg) |
| 최대 배율 | [max-refuge](evidence/candidate3-final-max-refuge.jpg) |
| 가로 모바일 최소 | [min-mobile](evidence/candidate3-final-min-mobile.jpg) |
| 아랫길/이음 | [lower-route](evidence/candidate3-final-final-lower-route.jpg) |
| 시작 | [start](evidence/candidate3-final-final-start.jpg) |
| 동쪽 바깥 능선 | [east](evidence/candidate3-final-final-east.jpg) |

[최종 촬영 원자료](evidence/candidate3-final-all.json). 모든 세 번째 후보 JPG는1MB 미만(최대133,928 bytes)이다. 새 사진은 모두 생산 Game/Scene의 고정 카메라·진행 상태 fixture이며 정상 전투 완주·실기기 터치·GPU FPS 검사가 아니다.

### 세 번째 후보의 실제 불변/정적 캐시 확인

- `npm run build`, `node tests/web-split.mjs` 통과. 환경 복구 직후 root/game 개발 의존성이 없어 설치한 뒤 빌드했다. 저장소 lockfile이나 의존성 버전은 변경하지 않았다.
- `node tests/stage11-vector-finish.mjs` 통과. master `a091c6bd` 대비 지형/충돌/배우/목표/markers/events/보상/초기 상태·다른29장 불변, 저작기 멱등·재현 통과. [candidate3-preservation.json](evidence/candidate3-preservation.json).
- 두 번째 후보 `e18d51e1`와 추가 대조: 바뀐 재질은 `rv-ritual-buttress`, `rv-north-trace` 두 개뿐이다. 나머지7개 재질, **전체 Library(피난처·후벽 포함)**, 중앙 뿌리 접합21개 face는 정확히 같다. 선공개4개의 camera/viewport/phase/current 목표도 정확히 같다. [candidate3-delta.json](evidence/candidate3-delta.json).
- `node tests/stage11-landscape-art.mjs` 통과. 실제31개 지형·저작재질9개, 최대 준비 경로85(두 번째89), 렌더 battle/Canvas 상태 불변, prepare 재사용/sceneVersion 무효화, 옛 전투와 다른 장 opt-out 확인. 이 수치는 미술 점수로 사용하지 않는다. [candidate3-material-cache.json](evidence/candidate3-material-cache.json).
- 새 Chromium 촬영/측정에서 pageerror0/HTTP실패0. 기존 지형 이동36경로·키보드·2막 상태 검사는 데이터/동작 변경이 없어 재실행하지 않았다. 원본master에서도 재현한 전술 적 수45≠43 실패는 그대로이며 이번에 수리하거나 통과 처리하지 않았다.

### 세 번째 후보의 전후 프레임 표본 · 두 번째 후보와 비교

이 환경에서 보존된 두 번째 후보 `e18d51e1`의 HTML/web 자산을 `/tmp`로 읽기 전용 추출해 먼저 실행하고, 이어 세 번째 후보 `4016913c`를 실행했다. 다른 검사/빌드/브라우저 부하와 겹치지 않았다. camera/viewport/phase/current 목표10쌍이 같고, 화면당 warmup8회 후 `Scene.render`40회 중앙값/p95다. 첫 draw는 viewport 안정화 뒤 해당 카메라의 첫 draw이며 새 페이지 전체 로딩 시간이나 장기 전투 FPS가 아니다. [두 번째 후보 원자료](evidence/candidate2-cost-all.json), [세 번째 후보 원자료](evidence/candidate3-final-all.json), [전후 대조](evidence/candidate3-performance.json).

| 화면 | 중앙값 ms 두 번째→세 번째 | p95 ms 두 번째→세 번째 | 첫 draw ms 두 번째→세 번째 |
|---|---:|---:|---:|
| overview.jpg | 2.7→2.8 | 4.6→4.4 | 132.0→124.2 |
| west.jpg | 7.8→6.8 | 9.9→8.7 | 77.6→89.1 |
| central.jpg | 0.9→0.9 | 1.4→1.8 | 51.7→58.0 |
| refuge.jpg | 0.7→0.7 | 1.1→1.6 | 55.2→61.9 |
| mobile-trace.jpg | 0.3→0.2 | 0.5→0.8 | 32.9→37.5 |
| max-refuge.jpg | 1.0→1.0 | 1.5→1.3 | 3.7→4.6 |
| min-mobile.jpg | 1.1→0.9 | 1.7→1.3 | 63.7→71.3 |
| final-lower-route.jpg | 0.8→0.8 | 1.5→1.3 | 18.7→23.5 |
| final-start.jpg | 6.0→6.0 | 7.1→7.2 | 58.4→58.7 |
| final-east.jpg | 0.3→0.2 | 0.5→0.4 | 69.5→60.8 |

10쌍 모두 정적 world/screen/background 캐시 bytes·tile 수 동일, warm 구간 world/tile/canvas/screen 재빌드0. 이번 표본에서 지속 비용의 큰 악화는 관찰하지 못했지만 중앙 p95 1.4→1.8ms, 피난처1.1→1.6ms, 모바일0.5→0.8ms 증가가 있다. 첫 draw도 서쪽77.6→89.1ms, 중앙51.7→58.0ms, 피난처55.2→61.9ms, 가로 최소63.7→71.3ms 등 증가했다. 이 중 미술이 동일한 서쪽/피난처도 증가하므로 단일 순차40회 표본에서 전부 재질 변경의 인과로 단정하지 않는다. p95 최고는9.9→8.7ms이며 시작 첫 draw58.4→58.7ms다. 실기기 성능 무저하나 성능 최종 채택을 자동 선언하지 않는다.

**원본master→첫 후보의 시작 캐시55.3→85.0ms 증가 한계는 위 역사 기록 그대로 남는다.** 이번 비교는 같은 환경의 두 번째→세 번째 후보이며 원본master와의 새 직접 비교가 아니다. 이번 작은 표본의 시작58.7ms를 근거로 옛 캐시 한계를 해결했다고 주장하지 않는다.

최종 미술/성능 채택은 부모 판단 대기다. 이번 브랜치의 구현/사진/검사/기록만 커밋·push하며 master/Pages는 변경하지 않는다. 접근 거부·결과 불명 쓰기·미커밋 구현은 없다. 정상 전체 전투·실기기 터치·Pages 배포는 미실행이다.


## 네 번째 후보 · 공유 경계 안의 중간 크기 조절 (부모 미술 판단 대기)

세 번째 후보 `4016913c`/기록 `8e5571af`는 부모가 최종 전체/중앙/모바일/피난처4장을 직접 본 뒤 **중간 스케일이 다시 너무 넓다**고 반려했다. 앞 절의 집중/종합/수치 결과는 미술 합격이 아니다.

이번에는 기존4×6 암대 구성을 전체 균등 증식하지 않는다. 중앙의 선택한8개 부모 면 안에서만 비대칭 공통 접합을 나누고 나머지 큰 면은 그대로 남긴다. 새 분할의 위/아래 끝은 기존 공유 경계의 실제 선분 위에 놓고, 두 이웃 면이 같은 꺾인 내부 경계를 함께 사용한다. 별도의 외곽/독립 돌/어두운 밑뚜껑을 더하지 않는다. 자식 면의 톤은 기존 부모 면에서 소폭만 다르게 하며 선택한 접합 일부에만 짧은 틈과 얇은 비대칭 모서리광을 둔다. 동쪽은 흔적 아래에 보이는4개 부모 면을 선택적으로 나눠 모바일 표시 크기를 조절했다. 부모가 제시한100~220px/10~16개는 미술 스케일 참고이며 도형 수의 자동 합격 조건으로 사용하지 않는다.

다른7개 암체는 기존 face의 위치/점/형상/개수를 모두 보존하고, 독립 아랫면처럼 강했던 `side` 색만 `#48666a`→`#5b7474`로 완화했다. 전체 Library(피난처/후벽 포함), 목재, 중앙 뿌리 접합21개 face, gameplay/collider/목표/배우/전투, 전역 renderer/main/UI는 그대로다. 모든 새 재질 경로는 기존 정적 prepare/tile 수명으로만 준비·재사용한다.

최종 선공개4장을 직접 이미지 뷰어로 열었다. 중앙에서 이전 큰 부모 면 안의 중간 접합들이 보이고, 면 하단 전체를 검게 감싸지 않는다. 동쪽 흔적 아래의 큰 경사 내부에도 작은 접합이 더 보인다. overview에서는 다른 암체의 아랫면이 완화되고 피난처/뿌리/후벽은 유지된다. 여전히 일부 큰 면을 남긴 구성이고, 이 세 크기 체계가 충분히 읽히는지는 부모가 실제 사진으로 판단한다.

| 같은 카메라 | 세 번째 후보 | 네 번째 후보 |
|---|---|---|
| 중앙1440×900 | [candidate3](evidence/candidate3-final-central.jpg) | [candidate4](evidence/candidate4-central.jpg) |
| 동쪽 모바일390×844 | [candidate3](evidence/candidate3-final-mobile-trace.jpg) | [candidate4](evidence/candidate4-mobile-trace.jpg) |
| 전체 | [candidate3](evidence/candidate3-final-overview.jpg) | [candidate4](evidence/candidate4-overview.jpg) |
| 피난처 보존 | [candidate3](evidence/candidate3-final-refuge.jpg) | [candidate4](evidence/candidate4-refuge.jpg) |

[candidate4-preview.json](evidence/candidate4-preview.json)에 미커밋 sourceHashes/camera/viewport/상태를 기록했다. 네 장의 camera/viewport/phase/current 목표는 세 번째 후보와 정확히 같고 JPG 각1MB 미만이다. 새 사진은 생산 Game의 고정 fixture이며 정상 전투 완주나 실기기 터치 검사가 아니다.

빌드, `stage11-vector-finish.mjs`의 master대비 gameplay/다른29장 불변과 저작기 재현/멱등, `stage11-landscape-art.mjs`의 렌더 순수성·prepare 캐시/옛 전투/다른 장 opt-out을 확인했다. [보존](evidence/candidate4-preservation.json), [캐시](evidence/candidate4-material-cache.json), [세 번째 후보 대비 범위](evidence/candidate4-delta.json). 네 번째 후보의 집중/별도 종합과 비용은 후속 절에서 실제 수행 범위만 갱신한다. 기존의 무관한 전술45≠43 실패나 다른 장 검사를 재실행/수리하지 않는다.


### 네 번째 후보의 변경 범위 집중3회와 별도 종합

미술 최종 소스는 `8d31b096`이다. 선공개와 커밋 후 촬영의 campaign/저작기/재질 renderer/생성 manifest sourceHashes가 모두 같으며, 그 뒤 미술 소스는 바꾸지 않았다. 아래는 검사 수행 기록이고 부모 미술 합격은 아니다.

1. **전체/큰 면과 깊이:** `candidate4-overview.jpg`를 직접 열었다. 중앙은 큰 명암 묶음을 유지하면서 그 안의 중간 접합이 더 보이고, 다른 암체의 강한 아랫면 톤을 완화했다. 전폭 균일 타일이나 새 독립 외곽은 없다. 다른 암체와 중앙의 조형 차이가 최종적으로 충분히 줄었는지는 부모 실제 픽셀 판단 대상이다.
2. **일반 거리의 중간 파단/접합:** `candidate4-central.jpg`와 `candidate4-refuge.jpg`를 직접 열었다. 새 경계는 부모 면 안에서 이웃 면과 공유하고, 소수의 틈/광만 강조된다. 인물과 비교할 때 이전 큰 면 안에 더 작은 분할이 읽히지만,100~220px/10~16개를 단순 계수해 미술 합격으로 처리하지 않는다. 뿌리의 암벽 입구·피난처 차양/자리/물건·주민 노출은 보존된다.
3. **모바일·최소/최대:** 별도 촬영한 `candidate4-focus-mobile-trace.jpg`(390×844), `candidate4-focus-min-mobile.jpg`(844×390, 실제 min), `candidate4-focus-max-refuge.jpg`(1440×900, 실제 max1.65)를 직접 열었다. 흔적 아래 경사 내부의 추가 중간 접합, 목표 라벨/통행선·주민 가림을 확인했다. 새 가림/발판 외곽은 보지 못했다. 축소에서 약한 세부 톤은 사라지고 기존 가로 모바일 HUD의 넓은 점유는 그대로다. [focus camera/limits/상태](evidence/candidate4-focus-focus3.json).

**별도 종합:** 집중 화면 검토 뒤 새 Chromium 세션의 최종7장(전체·서쪽·중앙·피난처·동쪽 세로 모바일·최대·가로 최소)을 전부 직접 열었다. 다른7개 암체의 톤 변화 영향은 overview/서쪽, 새 분할 영향은 중앙/모바일, 피난처·접촉·가림은 피난처/최대/최소에서 재확인했다. 새 흰 타일 이음·독립 발판 외곽·목표/주민의 새 가림은 관찰하지 못했다. 여전히 넓고 저대비인 일부 면이 남고, 모든 장식의 자연주의적 완성을 선언하지 않는다. 이번에 바뀌지 않은 시작/동쪽 바깥 능선의 종합 사진을 반복 촬영하거나 무관한 전투/다른 장 검사를 추가하지 않았다.

| 영향받은 화면 | 최종 종합 |
|---|---|
| 전체 | [overview](evidence/candidate4-final-overview.jpg) |
| 서쪽 톤 | [west](evidence/candidate4-final-west.jpg) |
| 중앙 | [central](evidence/candidate4-final-central.jpg) |
| 피난처/접합 | [refuge](evidence/candidate4-final-refuge.jpg) |
| 동쪽 모바일 | [mobile-trace](evidence/candidate4-final-mobile-trace.jpg) |
| 최대 | [max-refuge](evidence/candidate4-final-max-refuge.jpg) |
| 가로 최소 | [min-mobile](evidence/candidate4-final-min-mobile.jpg) |

[final camera/상태/sourceHashes 원자료](evidence/candidate4-final-refinement.json). 네 번째 후보 JPG 최대133,593 bytes이며 모두1MB 미만이다. 정지한 생산 Game의 카메라/진행 fixture이며 전체 정상 전투·실기기 터치 검사가 아니다.

빌드와 기존 두 국소 검사 외에 생성 자산 연결의 `node tests/web-split.mjs`도 통과했다. 분할 전 부모24개 면과 분할 후 자식 면의 총 유향 면적이 중앙/동쪽에서 각각 동일한지도 확인해 [delta](evidence/candidate4-delta.json)에 남겼다. 다른7개는 점/경로/개수 변화 없이 side fill만 달라진다. 최대 준비 경로는85로 세 번째 후보와 같고, 렌더 순수성/prepare 재사용/sceneVersion 무효화는 통과했다. 이전45≠43 실패는 미실행/미수리 상태를 유지한다.

### 네 번째 후보의 비용 표본 · 성능 채택 보류

같은 환경에서 보존된 세 번째 후보 `8e5571af`의 HTML/web을 `/tmp`에 읽기 전용 추출해 먼저 단독 실행한 뒤, 네 번째 후보 `8d31b096`을 실행했다. 변경 영향이 있는 같은7개 camera/viewport/phase/current 목표를 사용했고 다른 검사/빌드와 겹치지 않았다. 화면당 warmup8회+동기 `Scene.render`40회다. 첫 draw는 viewport 안정화 후 해당 카메라 첫 draw이며 페이지 전체 시작시간/장기 전투 FPS가 아니다.

[세 번째 후보](evidence/candidate3-cost-refinement.json), [네 번째 후보](evidence/candidate4-final-refinement.json), [전체 전후 대조와 역순 추가 표본](evidence/candidate4-performance.json).

| 화면 | 중앙값 ms 세 번째→네 번째 | p95 ms 세 번째→네 번째 | 첫 draw ms 세 번째→네 번째 |
|---|---:|---:|---:|
| overview.jpg | 2.3→2.4 | 3.0→3.1 | 102.6→98.9 |
| west.jpg | 6.1→6.9 | 7.0→7.8 | 66.2→74.6 |
| central.jpg | 0.9→1.2 | 1.6→1.7 | 45.8→78.4 |
| refuge.jpg | 0.7→0.8 | 0.9→1.1 | 56.7→72.4 |
| mobile-trace.jpg | 0.2→0.2 | 0.4→0.3 | 30.2→31.9 |
| max-refuge.jpg | 0.9→1.0 | 1.2→1.8 | 4.9→4.7 |
| min-mobile.jpg | 1.0→0.9 | 1.4→1.5 | 58.8→61.8 |

첫 표본의 중앙 첫 draw45.8→78.4ms 증가를 그냥 채택하지 않고, 네 번째를 먼저 실행한 후 세 번째를 실행하는 역순 비교를 한 번 추가했다. [네 번째 역순 원자료](evidence/candidate4-cost-reverse-refinement.json), [세 번째 역순 원자료](evidence/candidate3-cost-reverse-refinement.json). 다음 표도 모두 **세 번째→네 번째** 순서로 표시한다.

| 역순 실행 재확인 화면 | 중앙값 ms 세 번째→네 번째 | p95 ms 세 번째→네 번째 | 첫 draw ms 세 번째→네 번째 |
|---|---:|---:|---:|
| overview.jpg | 2.9→3.2 | 6.3→5.3 | 117.6→120.6 |
| west.jpg | 7.2→9.3 | 8.1→17.8 | 75.7→93.3 |
| central.jpg | 1.1→1.1 | 1.6→1.9 | 51.7→58.8 |
| refuge.jpg | 0.8→0.9 | 1.3→4.3 | 66.9→92.7 |
| mobile-trace.jpg | 0.3→0.3 | 0.4→0.5 | 36.4→47.7 |
| max-refuge.jpg | 1.2→1.3 | 2.0→3.0 | 5.2→4.8 |
| min-mobile.jpg | 1.0→1.3 | 2.1→3.1 | 76.3→84.3 |

두 표본 모두7쌍의 캐시 world/screen/background bytes와 tile 수가 같고 warm world/tile/canvas/screen 재빌드0, pageerror0/HTTP실패0이다. 역순에서 중앙 첫 draw는51.7→58.8ms로 차이가 줄었으나, 피난처66.9→92.7ms와 서쪽 p958.1→17.8ms가 관찰됐다. 캐시가 재생성되지 않는 warm 구간에도 표본 간 변화가 커 이 짧은 벽시계 측정만으로 비용 증가의 원인을 확정하지 않는다. **무저하/성능 통과를 선언하지 않으며 성능 채택은 보류한다.** 특히 중앙/피난처의 첫 준비 비용과 서쪽 tail은 부모가 이 원자료와 함께 검토해야 한다. 이 문제를 숨기려고 전역 renderer나 다른 작업의 캐시 정책을 수정하지 않았다.

원본master→첫 후보의 시작55.3→85.0ms 증가 한계도 그대로 유효한 역사 기록이다. 이번 표본은 세 번째→네 번째 후보 비교이므로 그것을 해결한 증거가 아니다. 정상 장기 전투·실기기 성능·Pages 검증은 미실행이다. 원래 브랜치/master/Pages는 변경하지 않고 부모의 실제 미술 판단 및 성능 채택을 기다린다. 접근 거부나 결과 불명 쓰기는 없다.


## 분리 계측/통합 인계 착수 · 미술 고정

부모는 네 번째 후보 최종 central/mobile/overview 실제 픽셀을 보고 미술 방향을 채택 가능하다고 판단했다. 추가 미술 형태 변경은 중단한다. 비용은 기존 표본만으로 통과 처리하지 않고 최초 준비·타일 miss·screen hit·최대1.65 직접 draw를 나누는 시험 전용 계측을 수행한다.

`integration/stage11-art-release-20261022`를 master `1c397248`에서 만들고 고정 후보 `f853e866`을 병합했다. 전역 renderer/main/UI와 master의 objectives/combat-feedback/combat-status는1c397248과 byte 단위로 같다. 후보4 campaign도 byte 단위로 같다. 생성 HTML/web 충돌은 통합 소스의 공통 build로 재생성했고 BUG_LOG 양쪽 기록은 모두 보존했다. build·stage11-vector-finish·stage11-landscape-art·web-split 통과. 통합 `integration-final-*` 전체/중앙/피난처/세로 모바일4장을 생산 Chromium에서 촬영하고 전부 직접 열었다. 고정 후보4 미술과 목표/주민/원경 구도를 확인했으며 새 형상 변경은 없다.

이 시점 부모가 master를 `28b26db6`로 갱신했다. 지금까지의1c397248 분리 계측과 섞지 않고 최종 통합에는 해당 부모 실루엣 개선을 추가 보존한다. 이 개선의 성능은 본 미술의 성과로 주장하지 않는다. master 쓰기/배포는 계속 부모 담당이다.


## 배포 전 분리 계측 결론 · 후보4 미술 고정 / 최신master 보존

부모 독립 감사의 지적을 반영해 이전 순차 카메라 표본과 구분한다. 후보3/4의 stage11 renderer SHA는 같고 prepare는 terrain/vertices/sceneVersion WeakMap 캐시다. 매 프레임 JSON 직렬화는 없다. **최대 준비 경로85 동일은 전체 작업량 동일이라는 뜻이 아니다. 실제 authored face 합은438→465(중앙54→71, 동쪽33→43)**이다. 이전 `coldMs`는 같은 Scene으로 다른 카메라를 순차 방문한 첫 draw이며 순수 새 재질 최초 준비 시간으로 사용하지 않는다.

### 계측 조건과 경로

시험 전용 `tools/testing/stage11-material-probe.py`/`.js`를 사용했다. 생산 HTML을 별도 로컬 HTTP root에서 읽고 Chromium 한 세션에서 전/후와 역순을 교차 실행한다. 런타임 파일은 계측 때문에 저장/변경하지 않는다. 브라우저 안에서 해당 stage11 모듈에 카운터/타이머만 삽입하고 Canvas Path2D constructor·clip/fill/stroke·linear/radial gradient 생성 호출을 센다. 원래 liveWater hook을 다시 감싸지 않도록 계측용 재등록에서 그 부분은 제외한다. prepare miss/hit은 로컬 함수 내부에서 실제 cache 조건을 계수한다.

1440×900/DPR1, 서쪽(3200,6650,.18)·중앙(7290,7080,.43)·피난처(10350,8470,.5), 동일 고정 battle/진행·좌표·HP·포즈, Scene.time10/dt0/effectDt0, 원경 이미지 ready를 사용했다. 모든 비교의 보호된 fixture SHA가 같고 각 render 전후에도 보존된다. engine.step은 호출하지 않는다. 전체 render는 배경/배우 등을 포함하고 재질/prepare 타이머는 그 안의 중첩 비용이다. 계측 hook 비용과 동기 Canvas 명령 제출 시간이 포함되므로 GPU 완료시간·정상 동적 게임 FPS가 아니다.

- **새 battle/Scene의 prepare+첫 타일:** 고정 canonical battle을 복제해 새 Engine/Scene을 만들고 stage11 prepare cache를 비운 뒤 첫 render. target/view당6회. 모듈 import/정적 ROCK_BLOCKS 상수 생성 시간은 제외된다. 원경 이미지 다운로드는 이미 완료돼 있으나 새 Scene의 배경 준비·배우 draw 등 전체 render 비용도 포함하므로 재질 준비는 별도 prepareMs로 읽는다.
- **prepare 재사용+타일 miss:** 같은 battle·terrain·sceneVersion에서 world tile/screenWorld만 비우고 다시 draw. target/view당6회. 실제 prepare miss0, 새 Path2D0, 타일 build 서쪽12/중앙8/피난처12다.
- **정상 screen hit:** 같은 화면을 안정화한 뒤 target/view당48회. 매 회 worldHits+1/screenHits+2, 재질 호출/prepare/Path2D/clip/fill/gradient0, world/tile build0이다. 앞선17.8ms tail을 새 face loop 회귀로 단정하지 않는다.
- **최대1.65 직접 draw:** 같은 중심에서 배율1.65로 바꾸고 prepare를 안정화한 뒤 target/view당32회. worldHits+0, background hit+1, screenHits+1, 재질 호출은 서쪽7/중앙13/피난처11회, prepare miss/새 Path2D/타일 build0이다. **warm 재빌드0이어도 재질 draw 비용은0이 아니다.**

[집계·카운터 범위·보존 SHA](evidence/separated-summary.json), [후보3↔4 원자료](evidence/candidate34-separated.json), [master1c397248↔고정 미술 원자료](evidence/master1c-art-separated.json), [최신master28/고정 미술/국소 최적화 최종 원자료](evidence/final28-separated.json).

### 후보3→4의 실제 추가 작업

후보3와4를3→4→4→3 순서로 실행했다. 재질 호출 수와 clip/gradient 호출 수는 같지만, 실제 Path2D/fill은 증가한다. 다음은 재질 범위 실제 호출 수이며 여러 타일에 같은 암체를 다시 그리는 작업을 포함한다.

| 장소 | 첫 준비 Path2D 후보3→4 | 첫 타일 fill 후보3→4 | prepare 재사용 타일 fill 후보3→4 | 최대 직접 draw fill 후보3→4 |
|---|---:|---:|---:|---:|
| 서쪽 |842→859|2242→2276|2242→2276|326→326|
| 중앙 |381→398|1502→1638|1502→1638|550→567|
| 피난처 |369→396|2510→2638|2510→2638|514→541|

| 후보3→4 중앙값 ms | 새 battle 전체 / 재질 / prepare | prepare재사용 타일 전체 / 재질 | screen hit 전체 | 최대 직접 전체 / 재질 |
|---|---|---|---|---|
| west | 89.90→85.15 / 12.75→11.15 / 9.05→7.40 | 73.05→73.55 / 2.70→2.75 | 7.20→7.10 | 0.80→0.90 / 0.20→0.30 |
| central | 58.35→48.80 / 5.90→4.65 / 3.75→2.70 | 50.55→47.85 / 1.80→1.75 | 1.35→1.20 | 1.40→1.20 / 0.45→0.40 |
| refuge | 59.05→58.05 / 4.50→4.65 / 1.85→2.00 | 60.95→56.70 / 2.45→2.25 | 0.80→0.75 | 1.00→1.00 / 0.30→0.35 |

이 교차 표본에서 추가 분할의 큰 지속시간 회귀는 보이지 않았지만 호출 수 증가 자체는 분명하다. 수치가 줄어든 표본을 분할 때문에 빨라졌다고 주장하지 않는다. 전체/재질의 대기·JIT·Canvas 등 짧은 표본 변동이 있으므로 경로 카운터와 함께 해석한다.

### 확인된 낭비만11장 모듈 안에서 제거

`stage11-landscape-art.js`에서 authored face가 있으면 실제 draw에 쓰지 않을 legacy numeric plate/EXPOSURES 배열을 계산하지 않게 했다. 기존 connected 기반암 색 선택과 moss/rim은 그대로이며 authored가 없는 옛 전투는 원래 fallback을 유지한다. 목재의 seats/breaks 합친 배열도 prepare에서 한 번 만들고 draw에서 재사용한다. 두 항목은 후보3/4에 공통이던 코드이므로 후보4 회귀 원인이라고 부르지 않는다. 품질·해상도·애니메이션을 줄이거나 전역 renderer/main/UI를 재작성하지 않았다. 작은 시간 차이를 최적화 효과의 보장으로 사용하지 않고, 사용하지 않는 계산/프레임 배열 생성이 제거됐다는 코드상의 근거만 확정한다.

최적화 전후에는 같은28b26db6 공통 소스를 사용했다. 서쪽/중앙/피난처 각각 일반/최대1.65의 **생산 Canvas 재질 레이어 PNG 해시6쌍이 정확히 같다.** campaign은 고정 후보4 `f853e866`와 byte 단위로 같다. terrain/배우/목표/스토리·전체Library/뿌리 데이터는 그대로다. 최종 build·stage11-vector-finish·stage11-landscape-art·web-split은 통과했다.

### 최신 master28b26db6 대비 최종 영향

통합 merge `7cccd914`는1c397248 렌더 개선과 고정 미술을 결합했고, `a8402d77`는 부모가 검수해 master에 올린28b26db6의 빈 실루엣 합성 생략을 추가 보존했다. 모든 전역 main/renderer/party-rig/objectives/combat 및 actor/party runtime 소스는28b26db6와 byte 단위로 같다. BGM 및 다른 별도 브랜치는 가져오지 않았다. 이후 변경은 위11장 국소 최적화뿐이다. 생성 HTML/web 충돌은 매번 통합 소스의 공통 build로 재생성했다.

1c397248 비교 자료는 보존하되28b26db6 결과에 섞지 않는다. 특히 서쪽 screen-hit 시간이1c397248 시기보다 낮아진 것을 미술 성과로 표현하지 않는다. 다음은 **동일28b26db6 기반** master 원본→최종 미술/국소 최적화의 중앙값이다.

| 장소 | 새 battle 전체 ms | 그 안의 재질 / prepare ms | prepare 재사용 타일 전체 / 재질 ms | screen hit 전체 ms | 최대 직접 전체 / 재질 ms |
|---|---|---|---|---|---|
| west | 84.00→88.15 | 12.05→12.85 / 7.35→8.70 | 67.55→69.70 / 3.65→3.05 | 4.10→3.65 | 1.10→0.95 / 0.40→0.30 |
| central | 46.65→49.40 | 4.25→5.10 / 2.50→3.45 | 46.75→46.20 / 1.95→1.65 | 1.00→0.90 | 1.35→1.30 / 0.45→0.50 |
| refuge | 51.40→59.45 | 4.50→4.80 / 1.60→1.75 | 52.45→59.45 / 2.55→2.35 | 0.90→0.80 | 1.00→1.00 / 0.40→0.40 |

| 장소 | screen hit 전체 p95 ms master→최종 | 최대 직접 전체 p95 ms master→최종 |
|---|---|---|
| west | 6.30→5.70 | 1.60→1.20 |
| central | 1.60→1.20 | 2.30→2.10 |
| refuge | 1.60→1.50 | 1.20→1.20 |

최신 동일 기반의 정상 screen-hit/최대 직접 draw에서 중대한 지속 비용 회귀 근거는 관찰되지 않았다. 중앙 직접 draw의 재질 중앙값은0.45→0.50ms로 소폭 증가했고 fill은 master344→최종567이다. 원본master와 최종 미술의 전체작업량이 같다고 하지 않는다. 첫 준비 전체 중앙값은 서쪽+4.15ms, 중앙+2.75ms, 피난처+8.05ms가 남으며 재질/prepare와 전체 시간을 구분해 고지한다. 고정·짧은 계측으로 실기기/장기전투 hitch 무발생을 보장하지 않는다. 원래 시작55.3→85.0ms는 다른 조건의 역사 기록이며 새 조건으로 그것을 해결했다고 주장하지 않는다.

**인계 결론:** 요청한 네 경로의 분리 근거가 확보됐다. 후보4 미술과 최신master를 보존하고, 국소적인 낭비만 제거한 통합본을 부모의 최종 비용 채택/발행 판단에 인계한다. 추가 실험이나 미술 변경은 늘리지 않는다. master/Pages 쓰기·배포는 부모 담당이며 이 작업에서는 미실행이다.

### 최신 통합 소스의 최종 사진/불변 경계

최종 `integration-ready-*` 전체·서쪽·중앙·피난처·세로 모바일·최대·가로 최소7장을 새 생산 Chromium 세션에서 촬영하고 전부 직접 열었다. 후보4의 큰/중간 면과 접합·피난처/목재·후벽·주민/목표 가독성을 확인했고 새로운 타일 이음·가림·발판 외곽을 관찰하지 못했다. 미술 데이터는 고정했고 위 재질 픽셀 해시도 같으므로 이전 승인된 후보4를 다시 디자인하지 않는다. 파일별 camera/viewport/상태/소스 SHA256은 [integration-ready-refinement.json](evidence/integration-ready-refinement.json), 보호 소스·픽셀 해시와 actual face 합은 [separated-summary.json](evidence/separated-summary.json)에 있다.

[전체](evidence/integration-ready-overview.jpg) · [서쪽](evidence/integration-ready-west.jpg) · [중앙](evidence/integration-ready-central.jpg) · [피난처](evidence/integration-ready-refuge.jpg) · [동쪽 모바일](evidence/integration-ready-mobile-trace.jpg) · [최대](evidence/integration-ready-max-refuge.jpg) · [최소](evidence/integration-ready-min-mobile.jpg). 전달 JPG는 각1MB 미만이다. 이전의 무관한45≠43 전술 검사나 다른 장 완주/정상 장기 전투는 다시 실행하지 않았다. 접근 거부/결과 불명 작업은 없다.


최종11장 국소 최적화/통합 소스 커밋은 `9b69f1f2`이며 부모 최신master `28b26db6`를 포함한다. 분리 계측 target별 정확한 소스/빌드/helper SHA와 원자료 SHA256은 [SEPARATED_PROVENANCE.json](evidence/SEPARATED_PROVENANCE.json)에 기록했다. 캡처 당시 미커밋이었던 자료는 이후 커밋된 해당 소스의 SHA256과 실제 일치함을 대조했다. 최신 최종 사진의 sourceHashes도9b69f1f2와 모두 같다. 이 뒤 문서/인계 정보만 바꾸며 미술/런타임 재측정은 늘리지 않는다.
