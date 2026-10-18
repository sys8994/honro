# 사용자 승인 회화 환경 시범 — 1·18·27장

2026-10-18 후속 승인 범위는 세 장의 환경 미술이다. 원본은 `shared/assets/environment/painted-pilots/source/`의 다섯 PNG이며, 에셋 커밋 `fbb178b`로 보존한다. Stage21의 승인 혼합 미술·자연스러운 가장자리·정적 월드 타일 캐시를 재사용한다. 다른 장의 기존 SVG 원경과 캐릭터/HUD는 그대로다.

## 적용

- 1장: 낮은 대비의 숲 원경, 비대칭 소나무 두 형상·고목·화강암·뿌리 풀을 기존 지지면과 나무 위치에 붙인다. 실제 흙/암반 polygon과 가지 발판에는 월드 좌표 질감을 clip한다. 수레·튜토리얼·실제 물은 기존 표현을 사용한다.
- 18장: 종이 없는 동굴 후경과 암반/부분 석축·목재만 새 이미지로 그린다. 실제 대종은 기존 `sb-bell-body` SVG와 측면 개구/내부 발판을 유지하며 청동 gradient만 조정한다. 0.9초 하강은 기존 엔진이 SVG와 해당 충돌을 함께 이동한다. 경고·안전 구역은 기존 live overlay다. 19장에는 적용하지 않는다.
- 27장: 기존 후면 shell의 월드 공간에 정립/측립/역립 문과 굽은 수로 그림을 배치하고 옛 청록 리본 shell을 숨긴다. 실제 단일 바닥·천장·gallery/문틀의 polygon에 암반/목재/석축을 clip한다. 실제 물·두 동행 경로·적15/정예3·도착 목표는 보존한다.

`tools/environment/painted-pilot-assets.py`가 원본에서 크롭/마스크·WebP와 manifest를 만든다. 파생 이미지13개는 약1.54MB다. `shared/build.mjs`가 Game/Workshop에 같은 모듈/manifest를 연결하고 웹 빌드는 콘텐츠 해시 이미지 파일로 분리한다. HTML에 이미지 base64를 인라인하지 않는다. 배포 직전 HEAD의 생성물을 복원한 뒤 한 번 빌드하여 이전 두 distinct 배포 세대 보존 정책을 유지한다.

이미지는 해당 장에 처음 진입할 때만 로드한다. 준비 전 기존 렌더러가 fallback이며 완료 generation이 월드 캐시를 갱신한다. 색조 처리는 이미지당 한 번만 canvas에 캐시한다. 지형 재질과 접지 사물은 정적 월드 타일/기존 LOD 풀을 공유하고, 후경은 카메라와 배율을 키로 화면 raster를 재사용한다. 전경/원경 확대율은 실제 월드·공통 SKY 투영을 따르며, 별도 충돌·dummy/skirt·플레이 범위는 만들지 않는다.

## 한정 확인

- Game/Workshop 빌드 및 Chromium 기본 실행. 세 장의 실제 렌더러 화면과 원본 에셋을 직접 비교했다. 정상 전투 완주나 최종 미술 승인을 뜻하지 않는다.
- 캠페인 파일 `web/data/campaign.b16d7de109d757f5.json`이 이전 HEAD와 동일하다. 1·18·27장 각각의 생성 데이터 전체 비교가 동일하며 기하·목표·적·저장 revision 소스 변경은 없다. 전투 초기화 revision을 올리지 않는다.
- Stage18 실제 캠페인 엔진에서 하강 fixture를 설정하고 `engine.tick(.45 + .1 + .35)`로 확인했다. 중간 offset100/최종200, 최종 상태 settled/횟수1, SVG 원본과 aperture 유지, 하강 중 sceneVersion/정적 월드 캐시 안정, 정착 시 갱신을 확인했다. 퀘스트 정상 진행 완주는 수행하지 않았다.
- 27장 Workshop 기본 렌더에서 새 미술 활성·적15를 확인했다. 세 장 Game 기본 화면에서도 적8/56/15, 27장 정예3과 pageerror0을 확인했다.
- 증거: `_local/reports/painted-pilots/`의 `browser.json`, `checks.json`, `data-preservation.json`과 실제 PNG. 전체 verify·30장 순회·무관한 기예/전투 검사는 실행하지 않았다. 공개 Pages 접근은 이 실행 환경에서 CONNECT403이므로 로컬 확인과 배포 run 성공을 구분한다.

## 실제 화면 Library

- 1장 숲: `libfile_5c9cb517509081918d8978e0e67279c5` (v1)
- 18장 범종 동굴: `libfile_4308fd694a5081918183484de78fa8e4` (v0)
- 27장 깊은 집하장: `libfile_d9da2a3e0fb48191b6ab84025abb752e` (v0)

세 화면은 실제 Chromium/Game 렌더의 진단 카메라 화면이다. 원화 합성이나 정상 캠페인 완주 증거가 아니다. Stage18 정착 fixture/Workshop 추가 화면은 로컬 보고서에 둔다.

1장 정상 진입 과대 장식 수정: 시작 소나무8.4m 기준, 바위1.3–1.8m, 기존 support의 줄기 foot와 뿌리 alpha/저대비 캐시를 사용한다. 기본 카메라(.94)는 변경하지 않았다. 기본 진입 실제 화면: `libfile_f438b00677a48191b967ef5f4dccca21` (v0). 기존 overview ID는 v1로 교체했다.
