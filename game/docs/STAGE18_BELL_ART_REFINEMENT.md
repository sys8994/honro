# 묵종 — 비극적 청동 주조 미술 검토본

2026-10-18 사용자 승인 방향은 대도사의 야욕이 만든 기괴하고 비극적인 의식물이다. 18·19장의 같은 `stage18:bell-hollow-body`에 적용한다. 검토 브랜치에서 보존하며 master/Pages에는 반영하지 않는다. 기준 master는 수레 삭제까지 배포한 `a25675f`다. 별도 후경 보정 `802aa7e`는 병합하지 않았다.

## 조형과 구현

한국 대종의 둥근 어깨·용뉴·음통·연속된 무거운 입술을 유지한다. 검푸른 산화 청동과 그을린 갈흑, 제한된 무광 황동 마모를 사용한다. 얼굴·손·어깨의 불완전한 인상이 주조 주름으로 이어지며, 생활 금속의 흔적은 끊어진 식기 테두리와 묻힌 고리로 제한한다. 반복 인물·눈/이빨 달린 보스·핏빛/네온은 사용하지 않는다. 게임 대사나 설명을 추가하여 후반 진실을 누설하지 않는다.

- `shared/assets/environment/stage18-hollow-bell.svg`: 편집 가능한100노드 벡터. 실제 외곽과 crown·mouth·측면창·지지귀의 마스크 및 로딩 전 fallback을 제공한다. 예전의 `No anthropomorphic relief` 설명은 폐기했다.
- `shared/assets/environment/mukjong/source/mukjong-bronze.png`: SVG 구도를 기준으로 생성한 보존 회화 원본. `tools/environment/mukjong-painted-assets.mjs`는 이 파일을 WebP로 인코딩하고 manifest를 만든다. 원본을 다시 생성하지 않는다.
- `mukjong-bronze.webp`: 약457KiB의 외부 재질. `shared/build.mjs`가 Game/Workshop 공통 manifest를 연결하고 웹 빌드는 콘텐츠 해시 이미지로 분리한다. HTML 이미지 인라인은 없다.
- `tools/environment/stage18-bell-art.mjs`: artRevision/paintedRevision4와 혼합 미술 기법을 명시한다. 전체 환경을 순수 벡터로 설명하던 `nativeVectorOnly` 대신 `bodyTechnique`를 기록한다.

실제 본체를 그릴 때만 이미지를 로드한다. 로딩 전 SVG, 완료 후 generation에 따른 월드 캐시 갱신을 사용한다. 원본 색조 보정과 SVG 외곽 clip은1139×1381의 정적 canvas 한 장으로 준비하며, canvas는 약6.3MB다. 원본 이미지도 하나를 공유한다. 매 프레임 필터·노이즈 생성·decode를 하지 않는다. 정적 타일과 0.9초 하강 live pass 모두 같은 raster를 사용한다. 새 revision에는 Stage18 전용 옛 palette 덮어쓰기를 적용하지 않아 18·19장이 같은 재질을 쓴다.

## 보존 계약

viewBox `-1610 -4420 3670 4450`, lipY0과 기존 앵커·이동200을 유지한다. `soundWindow.shellOpening`, `interiorReveal`, `cast-sound-window-frame`, `single-east-cast-bearing-ear`와 해당 하단 SVG path 좌표를 유지한다. 실제 reveal 마스크를 뚫고 두 overlay만 다시 그려 내부 통로·발판·캐릭터 순서를 보존한다. 지형·충돌·퀘스트/하강 ID·초기 상태·성장·전투 규칙은 바꾸지 않는다. 이전 저장의 구 에셋은 강제로 교체하지 않는다.

## 한정 확인과 검토 화면

Game/Workshop 빌드, 실제 Stage18 전체(.155 진단 카메라)와 기본 플레이 배율(.94)의 본체 근접을 확인했다. 실제 엔진의 한 하강 fixture에서 0.45초 offset100,0.9초 offset200/settled/횟수1을 확인했고 같은 raster와 하강 중 sceneVersion이 유지됐다. 18·19장 source의 지형·유닛·이벤트·목표·marker·initialState와 개구부 계약은 이전 master와 동일하다. 같은 본체가19에서도 같은 raster를 사용함을 확인했다. 전체 verify·무관한 전투·정상 캠페인 완주는 실행하지 않았다.

- 전체 실제 게임 화면: `libfile_ae4ae1c1068c8191a58f19bcfe3d08b6` (v0)
- 기본 배율 근접: `libfile_933030c1a1848191ad2ab1ead43b9e9a` (v0)
- 로컬 증거: `_local/reports/mukjong-redesign/checks.json`과 두 PNG.

과거 `8dc6a24` 기반의 순수 SVG 정리 및 당시 검증은 역사 기록이다. 이 검토본의 미술 승인이나 추가 배포를 의미하지 않는다.
