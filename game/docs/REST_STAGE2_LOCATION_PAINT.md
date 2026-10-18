# 2장 휴식터 장소 회화 — 2026-10-18

기준 master는 `ef163d1917a1d78428ac975754ed75231d964838`이다. 이번 단위는 기존 2장 휴식터 ‘능선 바위턱’만 바꾸며, 부모 화면 검토 전 master/Pages에는 반영하지 않는다.

## 구현과 보존

- `journey-art.js`는 stage2/surface만 `paintedRest2()`로 분기한다. 공유 valleyFar·forestSoil·forestRock·pineA·granite를 사용하고 새 에셋이나 다른 장소 건물은 요청하지 않는다. 왼쪽에 유한한 바람막이 암괴와 정적 소나무 한 그루, 중앙에 흙 섞인 넓은 바위턱, 오른쪽에 열린 계곡을 둔다. 작은 돌은 지면 뒤에 부분 매몰하고 아래 암반은 어둡게 감쇠한다. 주막·집·안내판·벤치는 넣지 않는다.
- 기존 1600×900 SVG, restGeometry/인물/모닥불 앵커, data-rest-backdrop 시차, .9~1.35 줌과 전체 패닝 범위를 유지한다. 모바일 첫 mount에만 zoom1.08, x=min(42px,화면 폭*.1), bounds 안 y 최대 -65px로 시작한다. 기존 1장 초기 구도와 이후 resize/pan 상태 보존은 그대로다.
- 장식은 에셋 revision별 정적 SVG 문자열 캐시를 사용한다. 새 RAF나 나무 모션을 추가하지 않으며 불/불씨·인물은 기존 retained motion과 App RAF를 쓴다. 기존 휴식터 여는 경로만 사용한다. `directAfter[1]`을 바꾸거나 1→2 사이에 필수 휴식을 삽입하지 않는다.
- 전투 지형/적/목표/스토리/대사/성장/SP/저장·mapRevision과 startup loader는 미수정이다. 1장 휴식터와 1·2·3장 전투 미술, 3장 휴식터 및 4장은 이번 변경 대상이 아니다.

## 실제 확인

필요한 build와 Chromium 데스크톱1440×900·모바일390×844 두 화면, 모바일 양끝 패닝/중앙 복귀와 실제 모닥불 버튼 클릭만 확인했다. 기존 전투 중 휴식터 진입 경로로 화면을 열었으며 전체 전투/기예/전 장 검사는 실행하지 않았다.

- pageerror0, 패닝 전후 profile JSON 동일, 모닥불 클릭 후 camp 화면 확인.
- 1장 transition은 `direct`, pine-crown 모션 hook0, 건물/안내판0, 무관한 rest1Inn/ferryHall 요청0.
- 모바일 최초 transform은 translate(39px,-65px)/scale1.08이다. 설오와 모닥불은 화면 안에 있고, 모닥불 bottom695.12px·하단 버튼 top780px로 겹치지 않는다.
- 일반 드래그로 world 양끝 도달 오차는 .013px 이내다. 빌드 후 두 PNG를 직접 보고 왼쪽 암괴·열린 원경·인물/불의 구도를 확인했다.

증거: `_local/reports/rest-stage2-location-paint/checks.json`, `rest2-desktop.png`, `rest2-mobile.png`.

| 화면 | Library ID | 버전 |
|---|---|---|
| 데스크톱 | `libfile_3d1c132835f48191acdac74b37f8d439` | v0 |
| 모바일 | `libfile_a79776a721b88191993a9455f8bfab38` | v0 |
