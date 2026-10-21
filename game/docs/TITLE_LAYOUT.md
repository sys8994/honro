# 인트로 세로 배치 — 2026-10-21

기준 master: `1ebd7985e21487329cc079102eeaa3bfd945da3b`. 이미지 편집·생성 없이 기존 DOM의 CSS 위치만 조정했다. 원본 PNG/JPG/WebP/SVG, 로고 크기·필획·색, 배경 object-fit/object-position 및 가로/데스크톱 배치는 보존한다.

`game/src/title.css`의 portrait 규칙에서 로고 상단을 일반 화면 높이의15%에 둔다. 설정 safe area와 충돌하지 않게 최소 상단 여백을 둔다. 부제는 기존처럼 로고 바로 아래의 문서 흐름을 따른다. 버튼은43%를 기준으로 두되 로고·부제 뒤의 최소 간격을 침범하면 필요한 만큼 아래로 내려간다. 650px 이하의 짧은 세로 화면은 기존 작은 로고 크기를 유지하며 상단60–78px/12%와 버튼44%를 기준으로 공간을 계산한다. 시작·이어하기 및 두 번째 버튼을 숨기지 않는다.

## 확인

로컬 Chromium에서360×780,390×844,320×480,360×640,844×390,1280×800의 새 기록/실제 저장 전투 이어하기 및 로딩/준비 완료 총24개 배치를 확인했다. 초기 runtime entry 요청만 잠시 보류해 실제 로딩 중 DOM을 촬영하고, 같은 요청을 계속 진행한 뒤 profile-aware 타이틀을 촬영했다. 타이머·로딩 장벽은 수정하지 않았다.

| 화면 | 로고 상단 기존→수정 px | 첫 버튼 상단 px (이어하기) |
|---|---:|---:|
| 360×780 | 28.9→117.0 | 335.4 |
| 390×844 | 31.2→126.6 | 362.9 |
| 320×480 | 0→60.0 | 221.9 |
| 360×640 | 0→76.8 | 281.6 |
| 844×390 | 59.0→59.0 | 216.0 |
| 1280×800 | 166.2→166.2 | 457.8 |

각 배치의 로고/부제/모든 버튼/설정이 화면 안에 있고 서로 겹치지 않으며, 버튼이 footer를 침범하지 않는다. 세로 로고는 로딩→준비 완료 때 위치가 바뀌지 않는다. 현재 viewport에서 기준 CSS를 임시 적용해 비교했으며 로고 크기/색·배경 표시와 가로 화면 좌표가 동일했다. 설정 버튼도 실제로 열고 닫았다. 기존 title 정적 검사2개도 통과했다. Android 실기나 공개 Pages 검수는 아니며 전체 게임플레이·오디오 검사는 범위에 포함하지 않는다.

원본 그림6개의 기준/현재 SHA256은 [preservation.json](evidence/title-portrait-layout-2026-10-21/preservation.json),24개 배치 좌표는 [checks.json](evidence/title-portrait-layout-2026-10-21/checks.json)에 있다. [같은 폴더](evidence/title-portrait-layout-2026-10-21/)의 PNG는 실제 브라우저 캡처이며 원본 미술 에셋 수정물이 아니다. 재현 명령은 `python tools/testing/title-portrait-layout-browser.py`이다. 저장 전투는 현재 런타임으로 별도 브라우저 context에서 생성하며 외부/개인 저장 fixture를 사용하지 않는다.

적 버그 master `ec1b66d45539d9d1fa4fa79ce5dc40599490991b`을 보존하여 통합한 뒤 재빌드·기존 title 검사·24개 배치 검사를 다시 통과했다. 적 버그 실행 코드와 원본 이미지·지형 데이터는 해당 master와 동일하다. 통합 후 좌표 결과는 [integrated-checks.json](evidence/title-portrait-layout-2026-10-21/integrated-checks.json)에 보존한다. 초기 캡처 PNG는 그대로 두고 통합 후 실제 캡처는 `_local/reports/title-portrait-layout/integrated/`에 저장했다. 검수 도구의 `HONRO_TITLE_LAYOUT_OUT`으로 별도 출력 경로를 지정할 수 있다.
