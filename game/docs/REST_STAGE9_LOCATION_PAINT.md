# 9장 쉼터 — 아랫마당 길목

2026-10-18. 승인9장 v1 `a5a6668090c1f75ff446568cf341235c6a476a3d`를 최신 master `9e1fd5290b0bf77052405a9aa3b0b9c12af79666`에 병합·push했다. 최신 master의8장 창고 픽셀 접지80251166와 생성물 rename 충돌이 있어 두 소스를 보존하고 생성물만 재빌드했다.9장 소스/terrain/assets는 승인본과 같고8장 접지 소스도 최신 master와 같음을 확인했다. 전투 검사는 반복하지 않았다. [Pages39168421755](https://github.com/sys8994/honro/actions/runs/39168421755)는 해당 master SHA/completed/success다. 공개 실제 화면은 부모가 확인한다.

쉼터 작업은 이 master에서 분기한 `art/rest-stage9-location-paint-20261018`만이다. 부모 미술 검토 전 쉼터는 master에 반영하지 않는다.10장은 미착수다.

## 구도와 기존 계약

- journey-content의 위쪽 마당으로 가는 길이 보이고 주민이 지나갈 자리를 살피는 입장 전 시점이다. 활성화된 두 받이진·소단 합류·완료 장면·군중은 없다. 전투 마당이나 고목 전체를 축소 복제하지 않았다.
- 전투와 같은 회랑1536:486 자산을 원비율1550×490.4296875, x-900/foot760으로 두어 부서진 끝과 마지막 목재 기둥·돌기초만 보인다. 하단 돌은 기존 앞 흙에 묻힌다. 옆에 낮은 무너진 담장 흔적을 두고 넓은 중앙 흙마당을 비웠다. 공유 mountain-dusk는 낮은 대비/채도로 기존 패닝 깊이 계약을 사용한다.
- 오른쪽 흙길 가장자리의 마른 우물은 낮은 자연 화강암 돌테두리 자산이다. source PNG를 보존하고 alpha 여백만 잘라 원비율 WebP640×200/60794bytes로 준비했다. 실제 배치는x1140/width180/height56.25/foot730이며 앞 흙이 밑돌 일부를 가린다. 물·반사·기능·새 모션은 없다. SVG나 검은 고리의 단순 재질로 처리하지 않고 독립된 돌의 부피를 그린 자산이다.
- 중앙 동행/모닥불과 하단 버튼 공간은 그대로 비웠다. 기존1600×900 art 좌표, fire800/745/ground765와 실제 버튼/동행 위치·대사/진행/SP는 유지한다. 기존 배우 idle/모닥불 motion만 쓰며 새 RAF/기능/환경 모션은 없다. 붉은 실/문간은 이 쉼터에서 추가하지 않았다.
-9장 surface 분기와9장 모바일 첫 framing만 추가했다. 모바일은 기존 같은 zoom.94/x최대85/y bounds 안에서 회랑 일부와 세 동행/fire를 함께 보여준다. 이후 기존 패닝/중앙복귀/줌0.9~1.35는 그대로다. main/현재 장 우선 loader/전투 geometry/revision은 미수정이다. 회랑과 우물은9장 쉼터의 SVG에서만 참조하며 무관 자산을 요청하지 않는다.

## 최소 확인

build와 실제 Chromium1440×900/390×844 두 화면, 모바일 양끝 패닝/중앙복귀/줌과 모닥불 클릭만 확인했다. pageerror0, 카메라 조작 중 profile 불변, 모닥불 클릭은 기존 camp 화면으로 진입한다. 세 동행/fire/action 버튼은 화면 안이며 겹치지 않는다. 최초 모바일 회랑 bounds right164.07px로 일부가 보이고 원비율3.1604938271604937이다. 기둥 돌기초 밑 원경 틈도 없다.

회랑 요청은 쉼터 진입 전0→후1, chapter-09 전투 데이터 요청0, 무관4/5장 구조물/물·절벽 요청0이다. 우물 그림만 마지막에 마감한 뒤 실제 두 화면을 다시 저장했고, 통과한 패닝/줌/모닥불 검사는 반복하지 않았다. 전투/소단/성장/다른 장 검사는 실행하지 않았다.

증거 `_local/reports/rest-stage9-location-paint/{build.log,checks.json,final-render-checks.json,library.json,rest9-desktop.png,rest9-mobile.png}`.

## Library 실제 화면

- rest9-desktop.png: `libfile_b7709be4a6e8819190fdf7684a4c28a9`, version0
- rest9-mobile.png: `libfile_b2781505d8c081919de5f1d776aaa091`, version0
