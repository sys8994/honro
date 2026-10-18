# 1장 휴식터 장소 회화 — 2026-10-18

기준 master는 승인3장까지 배포된 `2d678f6cd487d3fbd434c159f4f316a2bbd841ed`다. 1장 ‘고개 아래 주막’만 바꾼다. 다른 휴식터와4장 전투는 후속 순차 범위다. 부모 후속 검토에 따라1장 모바일 첫 프레이밍만 작은 왼쪽 장소 중심 구도로 보정했다. 작업 브랜치에서 부모 화면 검토를 마쳤으며, 최종 승인 후3장 한옥 재설계와 함께 최신 master/Pages에 통합한다.

## 구현과 보존

- `journey-art.js`의 `scene()`은 stage1/surface만 `paintedRest1()`으로 opt-in한다. 기존1600×900 SVG·restGeometry·전체 파노라마·원경 data-rest-backdrop 시차·.9~1.35 카메라를 공유한다. 모바일 첫 mount에서만 zoom1.12, x는 화면 폭/모닥불 버튼 여유로 제한된 최대112px, y는 bounds 안 최대-90px로 시작한다. 이후 resize/pan은 상태를 유지한다. 재료는 화면별 정적 SVG 문자열에 한 번 구성해 캐시하고 fire/person은 기존 retained motion 속성과 App RAF를 그대로 쓴다. 별도 RAF·새 모션·전체그림 매프레임 재생성은 없다.
- 기존1장 mountain-dusk와 흙·돌·깨끗한 소나무 자산을 공유한다. 양끝 소나무2그루는 정적이며 뿌리는 앞의 실제 마당 실루엣에 묻힌다. 옛 vector pine/rock/building 장면을 함께 겹치지 않는다. 원경은 넓은 여유 영역과 낮은 대비/채도로 조용하게 두고 가까운 주막/나무는 선명하게 유지한다.
- 주막은3장 workbay의 목재·기와 화풍을 참고한 작은 두 칸 건물이며 큰 창고 전체를 복사하지 않았다. 따뜻한 창·작은 차양/솥·개별 돌 주춧돌을 가진 투명 WebP1024×499/181,122bytes다. source PNG와 재현 도구는 `shared/assets/environment/rest-stage1/`, `tools/environment/rest-stage1-assets.py`에 있다. 벤치 판재는3장 창고의 작은 깨끗한 목재 면을 공유하고 밝은 단색 윗면을 제거했다. 기능 없는 기존 SVG 화살표 판은1장에만 생략하며 실제 다음 길로 버튼은 그대로다.
- 흙마당·낮은 독립 바위·주막을 별개 레이어로 구성하고 중앙 gathering/fire 여백을 남겼다. 불 경로/기존 motionFrame과 인물 원본은 그대로다. fire800,745/ground765, gathering480~1130, signpost1370,628 계약은 바꾸지 않았다.
- 새 자산 URL은 manifest에만 등록하고 이 휴식터의 SVG가 표시될 때 요청된다. intro/main/web-build를 수정하거나 전투의 모든 이미지와 함께 요청하지 않는다. 인물/모닥불 DOM·새SP 강조·대화점/이름·여정 지도/허공터/다음 길로·진행/저장·대사ID도 미수정이다. 이미지 로드 완료를 이유로 restMarkup을 다시 만들거나 카메라를 리셋하지 않는다.

## 실제 확인

필요한 build와 Chromium 데스크톱1440×900/모바일390×844만 확인했다. 재질 마감 중 발견한 SVG 속성 따옴표 오류를 수정한 뒤 같은2화면을 최종 갱신했다.

- pageerror0, 정적 렌더/패닝 전후 profile JSON 동일.
- 두 화면 모두 viewBox `0 0 1600 900`; 그림 ground와 기존 DOM 카메라 앵커 차이는 최대 .009px.
- 모바일 일반 드래그로 왼쪽/오른쪽 world 양끝 도달(오차 .013/.004px 이내), 중앙 복귀 정상.
- 실제 설오 버튼 클릭이 `rest-talk-v1-1-archer` optional 대화를 열고, 실제 모닥불 클릭이 camp 화면을 연다.
- 기존 불 motion transform이 시간에 따라 바뀌고 pine-crown motion hook은0개다.
- 주막 이미지 요청은 휴식터 진입 전0, 진입 뒤에만 발생한다.
- rest-journey.js의1장 모바일 초기 시점 외에 restGeometry/허용 bounds/줌 계약은 동일하다. journey-content.js/journey.css, 전투1·2·3장/지형/대사/성장 원본은 master와 동일하다. 전투·기예·전체 검사는 실행하지 않았다.

증거: `_local/reports/rest-stage1-location-paint/checks.json`, `rest1-desktop.png`, `rest1-mobile.png`.

| 화면 | Library ID | 버전 |
|---|---|---|
| 데스크톱 | `libfile_88593c1e3bb08191a69cf441d270c1b6` | v1 |
| 모바일 | `libfile_391dc9a610b0819191932ed46bfa5ef6` | v1 |

최신 후속 확인은 `framing-checks.json` 및 `final-visual-checks.json`에 있다. 모바일390×844의 첫 transform은 translate(109.2px,-90px)/scale1.12이며 주막178px 폭·설오·모닥불을 함께 보여준다. 모닥불 버튼 right374.76/bottom681.68, 하단 버튼 top780으로 잘림/겹침이 없다. 최초 이후 실제 양끝 이동과 .9/1.35 줌·기존 버튼 클릭을 확인했고, 최종 SVG 안내판 count0이다. 정량 전체 검사나 다른 장 검수는 실행하지 않았다.
