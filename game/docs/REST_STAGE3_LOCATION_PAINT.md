# 3장 휴식터 장소 회화 — 2026-10-18

기준 master는 승인 2장 휴식터까지 통합한 `516844f442fbfb84457245bc8c84705d3192d400`이다. 이번 작업은 ‘나루로 내려가는 길’ 휴식터만 바꾼다. 부모 화면 확인 전 이 작업을 master/Pages에 반영하지 않으며 4장 전투나 이후 휴식터는 착수하지 않는다.

## 구현과 보존

- `journey-art.js`의 stage3/surface만 `paintedRest3()`에 opt-in한다. 물가로 내려가는 흙길과 낮은 돌턱, 가까운 정적 소나무 한 그루, 작은 나루 작업대, 오른쪽의 낮은 수면과 짧은 잔교 끝으로 장소를 구성한다. 공유 valleyFar를 낮은 대비/채도로 처리하고 물 윗부분은 계곡에 투명하게 섞는다. 불과 현재 동행 주변은 비워 둔다. 전투 나루/창고 그림 전체를 복사하거나 큰 건물을 축소 배치하지 않는다.
- 새 작업대는 기존 workbay의 목재 화풍만 참고해 만든 독립 투명 WebP768×340/90,154bytes다. 원본과 제작 도구는 `shared/assets/environment/rest-stage3/`, `tools/environment/rest-stage3-assets.py`에 있다. 전체를 균일 축척280×123.958333으로 표시하며 strip 왜곡을 하지 않는다. 작은 흙 받침면을 네 발 아래에 만들고 완전한 작업대를 그 위에 그린다. 소나무 뿌리는 앞 지면에 묻히며 잔교의 해안 쪽 끝도 같은 지면에 매몰된다. 잔교는 몇 개의 원래 판재 형상과 수중 기둥으로 구성하고, 목재 면만 작업대의 깨끗한 판재 소재를 공유한다.
- 기존1600×900 SVG·restGeometry·모닥불/인물 앵커·원경 시차·전체 패닝/.9~1.35 줌을 유지한다. 모바일 첫 mount만 zoom1.04/x0/bounds 안 y 최대-60px로 시작한다. 1장 좌측 편향을 복사하지 않으며 이후 resize/pan 상태는 기존 계약을 따른다. 1·2장 전용 초기 구도 코드는 그대로다.
- 에셋 revision별 정적 SVG 문자열을 캐시하고 기존 App 단일 RAF/retained motion을 쓴다. 불·불씨·인물과 기존 river ripples, river rain을 유지한다. 새 나무 모션·RAF·매 프레임 SVG/재질 재생성·restMarkup 이미지 로드 재구성은 없다. 새 작업대 이미지는 해당 쉼터에서만 요청한다.
- 대화/다음 길로/모닥불/저장·스토리 순서·동행·성장/SP/전투 지형·mapRevision은 미수정이다. 현재 장 우선 로딩과 3장 실제 한옥/one-way 지붕 재설계도 그대로 보존한다.

## 실제 확인

필요한 build와 Chromium 데스크톱1440×900·모바일390×844 두 화면, 짧은 모바일 패닝/중앙 복귀·실제 대화/모닥불 클릭만 확인했다. 처음 실제 화면에서 작업대 발과 수면 경계 결함을 발견해 해당 미술만 보정하고 같은 두 화면을 최종 갱신했다. 전체 전투·기예·전 장 검사는 실행하지 않았다.

- pageerror0, 패닝 전후 profile JSON 동일, 실제 설오 클릭이 `rest-talk-v1-3-archer`를 열고 모닥불 클릭이 camp를 연다.
- 같은 SVG와 ripple 노드를 유지하면서 기존 불/ripples transform이 시간에 따라 바뀐다. rain hook1/ripples hook1, pine-crown hook0이다. 큰 건물 이미지0이며 작업대 요청은 쉼터 진입 전0/진입 후1이다.
- 모바일 첫 transform은 translate(0px,-60px)/scale1.04이다. 설오 버튼 left20.26~right99.31, 모닥불 left129.48~right260.52/bottom688.56, 하단 버튼 top780으로 잘림/겹침이 없다. 수면 잔물결과 잔교 끝도 실제 화면에 보인다.
- 일반 드래그로 world 양끝 도달 오차는 .013px 미만이다. 1장 transition은 계속 `direct`이며 1→2 필수 휴식 삽입이 없다.
- source 비교상 campaign/journey-content/startup main·entry·loader·web-build 및 Stage3 전투 미술/지형/revision은 기준 master와 동일하다.

증거: `_local/reports/rest-stage3-location-paint/checks.json`, `rest3-desktop.png`, `rest3-mobile.png`, `library.json`.

| 화면 | Library ID | 버전 |
|---|---|---|
| 데스크톱 | `libfile_22d13af1833c81918ac3fdca05831cc2` | v0 |
| 모바일 | `libfile_f8ad6277ea788191aac76927d8721b69` | v0 |
