# 10장 쉼터 — 윗마당 아래 계단

2026-10-18. 부모가 승인한 10장 전투 미술에 주박 중복 안내만 마감했다. 표시 보정 커밋 `bd50080`은 실제 대상 이름/체력과 focus ring·화면 밖 안내를 유지한다. build·고목/제단 실제1뷰 pageerror0, 화면 안 이름1회/3366 체력 및 화면 밖 안내만 확인했다. 기존 이동/협력/저장 검사는 반복하지 않았다. 기존 고목/제단 Library `libfile_85db8352b36081919d7fa05ea683b311` v1이다.

승인 전투를 master `b559b8cb5fbaec0d7db29225851a467b2b08ce03`에 병합·push했다. [Pages39171473583](https://github.com/sys8994/honro/actions/runs/39171473583)는 해당 SHA/completed/success다. 이 실행 환경의 공개 주소는 Tunnel403으로 열리지 않아 공개 실제 화면은 부모 확인이 필요하다. 이 쉼터는 별도 `art/rest-stage10-location-paint-20261018`에서만 작업하며 부모 미술 검토 전 master에 반영하지 않는다. 11장은 미착수다.

## 장면과 유지한 계약

- 두 받이진을 뒤로하고 소단이 줄을 붙든 윗마당으로 가는 전투 전 입구다. 소단/거대 주박/받이진·완료 장면·동료 합류·전투맵 축소 복제는 없다.
- 승인 새 당산나무를 참고한 가까운 뿌리와 낮은 화강암 계단을 한 자연스러운 근경 군집으로 제작했다. 전체 나무/수관 없이 화면 밖 왼쪽 줄기에서 뿌리가 돌기초로 퍼진다. source PNG를 보존하고 외부 WebP1536×512/245372bytes로 준비했다. 원비율740×246.6667, x-75/foot751에 놓아 아래 접점을 기존 흙 contour 아래에 묻었다. 새 모션은 없다.
- 오른쪽은 전투와 같은 온전한 회랑의 끝만 원비율1350×471.09375, x1210/foot739로 두며 앞 흙이 기둥 돌기초를 덮는다. 중앙 흙길과 세 동행/fire 공간은 비웠다. 한 줄의 가늘고 낮은 대비 붉은 실만 먼 회랑 쪽에 이어진다.
- 원경은 같은 mountain-dusk의 형태를 유지하고 채도.31/대비 slope.48의 더 어두운 산과 큰 여백으로 처리한다. 기존 공통 패닝 깊이,1600×900 좌표,fire800/745/ground765, 배우/모닥불 idle·인터랙션을 쓴다.
- 10장 surface SVG 분기와 모바일 첫 framing만 추가했다. 모바일은 기존 zoom.94/x최대85/y bounds, 이후 같은 패닝·중앙복귀·줌.9~1.35를 사용한다. journey-content/directAfter9·대사·진행/SP·main/현재 장 우선 loader·전투 geometry/revision은 미수정이다. 정상 기존 경로로 들어온 쉼터 미술만 바뀐다.

## 필요한 확인만 실행

build와 실제 Chromium1440×900/390×844 두 화면, 모바일 양끝 패닝/중앙복귀와 모닥불 클릭을 확인했다. pageerror0, 패닝 중 profile 불변, 모닥불은 기존 camp 화면에 진입했다. 세 동행/fire/action은 화면 안이며 버튼과 겹치지 않는다. directAfter9는 direct다. 쉼터 전 회랑 요청0→진입 후1, 근경 군집1, chapter-10 전투 데이터0, 전체 당산나무/다른 장 구조물/물·절벽 요청0이다. 줌 구현은 그대로이며 이번에 별도 반복 검사하지 않았다.

처음 캡처 fixture에서 cleared8을 남겨9장 쉼터를 기다린 실수는 fixture를9완료로 바로잡았다. 해당 실행은 selector 대기 중 종료됐고, 화면/패닝/클릭 검사는 수정된10장 fixture에서 한 번 실행했다. 전투/협력/저장/기예/다른 장 검사는 실행하지 않았다. 증거는 `_local/reports/rest-stage10-location-paint/{build.log,checks.json,rest10-desktop.png,rest10-mobile.png}`다.

## Library 실제 화면

- desktop: `libfile_d18400431f0c8191bb0c852fb9f8eeda`, version0
- mobile: `libfile_ef64e2d927108191ac58c6466d82f17c`, version0

별도 쉼터 커밋·push 후 부모 화면 검토 대기. 쉼터는 아직 배포하지 않았다.
