# 11장 벡터 지형 미술 · 2026-10-22

> **현재 상태: 부모 미술 미통과.** `69992d5b` 첫 후보는 부모가 직접 검토 후 중앙/동쪽의 중간 규모 파단면과 뿌리 접합 부족으로 반려했다. 아래 첫 후보의 검사/종합/성능 기록은 미술 합격이 아니다. 현행 `materialRevision:3` 두 번째 후보는 화면 선공개와 부모 방향 검토 단계이며 master/Pages에 반영하지 않는다.

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
