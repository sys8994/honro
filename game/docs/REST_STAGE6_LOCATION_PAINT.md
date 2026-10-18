# 6장 쉼터 ‘나무다리 위 길목’ — 2026-10-18

부모가 승인한 6장 전투 `e4be8cd290e6e6589749bc0de2dc0866c72a608a`를 최신 master `cb8f4a8d09d2d4df5af9f00dadcbb918988dc042`에 병합·push했고 [Pages run39156677078](https://github.com/sys8994/honro/actions/runs/39156677078)의 해당 SHA/completed/success를 확인했다. 승인 브랜치와 병합 tree가 같아 이미 확인한 전투 빌드/검증은 반복하지 않았다. 공개 실제 화면 확인은 부모가 담당한다.

이 쉼터는 위 master에서 분기한 `art/rest-stage6-location-paint-20261018`의 별도 검토 단위다. 부모 실제 화면 검토 전 master/Pages 미반영이며 7장은 미착수다.

## 구성과 보존

- journey-content의 기존6장은 구조 전 ‘나무다리 위 길목’이다. 뒤처진 운반대를 데리러 내려가기 직전이며 휘겸이 돌아온3인 동행 시점으로 표현한다. 구조한 사람들의 군중/운반대/복구된 전체 다리는 그리지 않았다.
- journey-art.js stage6/surface만 paintedRest6()로 분기한다. 완성한 bridge6를 원본 비례2500×460.405…로 x=-1850/y560에 놓아, panorama 왼쪽에 진입 끝의 난간·교대 일부만 보인다. 파손된 주 경간은 왼쪽 화면 밖으로 이어지며 전체 교량을 쉼터에 복사하지 않는다. 낮은 석재 면은 새 흙·자갈 어깨 지면으로 매몰해 떠 있는 받침을 만들지 않는다.
- 중앙의 마른 흙길을 넓게 비우고 기존 모닥불(800,745)/지면765 및 설오·담허·휘겸의 원본 배우·클릭 앵커를 유지한다. 전투와 같은 산 계열 valleyFar를 낮은 대비/채도로 사용하고, 국소 목교/교대는 보다 선명하게 둔다. 나무나 별도 벡터 막대 장식을 추가하지 않았다.
- 공유 bridge6/valleyFar/forestSoil/forestRock(화덕만)을 사용하며 새 래스터·manifest 항목이 없다. 정적 SVG 문자열 캐시, 기존 작은 원경 시차와 App 단일 불/불씨/배우 모션 루프를 쓴다. 새 모션/RAF/매 프레임 경로 재생성/전체 화면 필터는 없다. 이미지 로드 뒤 markup 재생성이나 카메라 리셋도 없다.
- 모바일 첫 mount만 zoom.94/x최대35px(화면 폭9% 제한)/bounds 안 y최대-55px로 시작한다. 실제390×844는 translate(35px,-17.6px)/scale.94다. 기존1600×900 frame, restGeometry, .9~1.35 줌과 양끝 패닝을 보존한다. 이후 resize/pan/zoom은 기존 상태를 유지한다.
- 기존1~5장 쉼터 함수, current-chapter main/loader/web-build, 전투 canonical/6장 renderer/물리/revision, journey-content, 대화·진행 ID·메뉴·성장/SP 코드는 미수정이다. 쉼터 미술을 위해 chapter06 engine data를 불러오지 않는다.

## 필요한 확인만 실행

필요한 build, Chromium desktop1440×900/mobile390×844 두 실제 화면, 모바일의 짧은 양끝 패닝/중앙 복귀·실제 모닥불 클릭만 확인했다. 첫 미술 확인에서 교대의 석재 면과 배경 fade 연결을 보정한 뒤, 같은 두 화면만 갱신했다. pan/camp 확인과 전투 검증을 반복하지 않았다.

- pageerror0, combat UI0, pine-crown/water hook0. 기존 정상 showRest에 cleared1~5/설오·담허 입력을 사용했고, 기존 recruitAtEntry 흐름으로 휘겸까지3인 동행이 표시됨을 확인했다. 정상 전투 완료의 증거로 사용하지 않는다.
- 최종 모바일 bridge tread 끝 screen x114.07/y511.89, 동행 버튼 x72.07~326.81/y517.82~638.14, 불 버튼 x170.78~289.22/y648.48~702.06, 하단 메뉴 top780이다. 교대/난간 일부와3인·불이 함께 읽히며 버튼 가림/잘림이 없다.
- 일반 드래그로 panorama 양끝 도달 오차 .012px 이내, 패닝 전후 profile JSON 동일, 모닥불 클릭 후 camp 화면 확인.
- 전투를 먼저 열지 않은 정상 쉼터 진입 fixture에서 bridge6 요청 전0/후1, chapter-06 engine data0, gate4/watch4/burned4/rest1Inn/rest3Worktable/water5/cliff5 요청0이다.
- 원본 비교로1~5장 쉼터 그림 함수와 전투 canonical·현재장 우선 로딩·6장 전투/revision·journey-content 보존을 확인했다. 전체 전투/스킬/다른 쉼터/전체 verify는 실행하지 않았다.

증거: `_local/reports/rest-stage6-location-paint/`의 build.log, checks.json, finish-art-checks.json, 두 PNG와 library.json.

| 화면 | Library ID | 버전 |
| --- | --- | --- |
| 데스크톱 | `libfile_a1ed497a75fc8191a32f930b367fa26a` | v0 |
| 모바일 | `libfile_14c9e2d79a748191b43a2aa8531b2322` | v0 |

후속 미술 수정은 같은 ID를 교체한다. 부모 실제 화면 확인 후 배포 결정을 기다린다.
