# 5장 쉼터 ‘폭포 아래 바위턱’ — 2026-10-18

부모가 확인한 5장 전투 최종본 `840847681cedab2abb6e3358c34b2f128c5ab35c`를 최신 master `a6dabf9875ae8feddadd6975c7f7e8ad4e4b3a76`에 병합·push했다. [Pages run39154407739](https://github.com/sys8994/honro/actions/runs/39154407739)의 해당 SHA/completed/success를 확인했다. 승인 브랜치와 병합 tree가 같아 이미 통과한 전투 빌드·물리·화면 검증은 반복하지 않았다.

이 쉼터는 위 master에서 분기한 `art/rest-stage5-location-paint-20261018`의 별도 검토 단위다. 부모 화면 검토 전 master/Pages 미반영이며 6장은 미착수다.

## 구성과 보존

- `journey-art.js`의 stage5/surface만 `paintedRest5()`로 분기한다. 새로 구성한 작은 흙·젖은 바위턱 중앙은 건조한 쉼자리이며, 왼쪽 뒤로 일부 낙수와 암벽, 낮은 수면·작은 포말·국소 물안개가 보인다. 폭포 상부는 panorama 밖으로 이어져 전투의 거대한 절벽 전체를 복사하지 않는다. 소나무를 추가하지 않아 나무 모션도 없다.
- 불/설오/담허는 기존 앵커를 유지한다. 수면 y약650은 쉼자리 뒤에 있고, 새 마른 턱의 상면은 중앙 y약700, 불·동행의 발은 y약765다. 기존 fire markup·원본 배우·불 주변 여백을 유지하고, 거대한 주박목·물길진/소굴/전투 UI·표식을 가져오지 않는다.
- 승인 5장 전투의 cliff5/water5, 공유 valleyFar/forestRock/forestSoil만 사용한다. 새 에셋과 manifest 항목은 없다. cliff5는700×1050, water5는240×720로 원본 비례 그대로 배치한다. 낙수/바위 경계·마른 흙 전이·암반턱의 형태를 이 새 장소에 맞춰 함께 구성하며 옛 쉼터의 벡터 틀에 그림을 늘이지 않는다.
- 정적 SVG 문자열 캐시와 기존 작은 원경 시차를 쓴다. 바위/원경 톤은 정적 이미지 필터이고, 물은 기존 쉼터 App 단일 모션 루프가 두 짧은 흐름선의 dashoffset·작은 포말 opacity·수면 파문/안개 transform만 갱신한다. 물 관련 retained hook은5개다. 새 rAF·전체 화면 효과·매 프레임 필터나 경로/노이즈 생성은 없다. 기존 reduced-motion 처리도 같은 루프를 따른다.
- 모바일 첫 mount만 zoom.96, x최대98px(화면/불 버튼 여유 제한), bounds 안 y최대-55px로 시작한다. 390×844 실제 첫 화면은 translate(97.5px,-26.4px)/scale.96다. 이후 pan/resize/zoom은 기존 카메라 상태와 양끝 bounds를 유지한다. 일반 1600×900 art frame·restGeometry·.9~1.35 줌 범위를 바꾸지 않았다.
- current-chapter 우선 loader/main/web-build, 전투 canonical/Stage5 미술·물리·revision, journey-content와 대화·메뉴·성장/SP·진행 코드는 미수정이다. 1~4장 쉼터 그림 함수도 원문 그대로다. 이미지를 사용하려고 stage5 engine data를 불러오거나 이미지 로드 뒤 restMarkup을 재생성하지 않는다.

## 확인 범위

필요한 `npm run build`, Chromium desktop1440×900/mobile390×844 두 실제 화면, 모바일의 짧은 양끝 패닝/중앙 복귀·실제 모닥불 클릭만 확인했다. 전투·기예·다른 쉼터·전체 verify는 실행하지 않았다.

- pageerror0, 전투 UI0, pine-crown hook0. 표제 ‘폭포 아래 바위턱’, 설오/담허, 불과 장면의 비례를 실제 이미지로 확인했다.
- 모바일 낙수 하단 screen x53.34/y520.16, 동행 버튼 x131.21~270.72/y510.88~633.76, 불 버튼 x232.02~352.98/y644.32~699.04, 하단 메뉴 top780이다. 물·바위턱·동행/불이 첫 화면에서 함께 읽히며 버튼 가림/잘림이 없다.
- 일반 드래그 양끝 도달 오차 .0121px 이내, 패닝 전후 profile JSON 동일, 모닥불 클릭 후 camp 화면 확인.
- 전투를 먼저 열지 않고 정상 쉼터 진입 fixture를 사용했다. water5 요청 진입 전0/후1, cliff5 1회, chapter-05 engine data0, gate4/watch4/burned4/rest1Inn/rest3Worktable 요청0이다.
- 원본 비교로 1~4장 쉼터 함수 및 전투 canonical·main/current-chapter loader·web-build·Stage5 renderer·campaign-map-revision이 기준 master와 같음을 확인했다.

증거: `_local/reports/rest-stage5-location-paint/`의 build.log/checks.json/두 PNG/library.json. 브라우저 fixture는 cleared1~4/설오·담허이며 정상 전투 완료의 증거로 사용하지 않는다.

| 화면 | Library ID | 버전 |
| --- | --- | --- |
| 데스크톱 | `libfile_936e52b636d88191af8f14d733c65da9` | v0 |
| 모바일 | `libfile_4744a49218b08191b44c384ba5b7c95c` | v0 |

후속 수정은 같은 Library ID를 교체한다. 부모 실제 화면 확인 뒤 배포 결정을 기다린다.
