# 인트로·막 엔딩 방향별 그림 연결 현황

## 부모 전달 사항 · 2026-10-21

- 작업 브랜치: `feat/responsive-story-art`. 조사 시 `origin/master`와 작업 기준은 모두 `c5e5ec8e80ccc03c5ee7d5c8a4a4eea102b83c2f`이며 그 이후 원격 변경은 없었다.
- 부모가 직접 그림 생성·편집을 맡는다. 이 브랜치는 그림을 생성하거나 수정하지 않는다. 최종 부모 이미지 검수 전에는 master에 병합하거나 Pages에 배포하지 않는다.
- 현재 인트로 가로 원본: `shared/assets/environment/title/landscape.webp`, JPEG 대체본 `shared/assets/environment/title/landscape.jpg`.
- 현재 인트로 세로 원본: `shared/assets/environment/title/portrait.webp`, JPEG 대체본 `shared/assets/environment/title/portrait.jpg`. 이미 독립 세로 그림이 존재한다. 새 위아래 확장 그림은 이 세로 파일만 교체하고 가로 파일은 유지하는 방식을 권장한다.
- 제목은 배경 그림에 포함되지 않는다. `shared/runtime/title-markup.js`의 `<h1 class="title-brand">`가 `hanja-wordmark.png`의 `魂路`와 `wordmark.png`의 `혼로`를 별도 이미지로 올린다. 부제·시작 버튼·설정도 DOM이다. 새 그림에 제목과 메뉴 글자를 넣지 않는다.
- 인트로 선택 코드는 같은 파일의 `scene()`의 `<picture>`이다. `shared/web-build.mjs`가 실제 에셋을 해시 파일로 내보내고 방향별 preload와 초기 HTML을 만든다. `game/src/title.css`가 제목·본문·버튼 위치와 safe area를 담당한다. 생성된 HTML을 직접 고치지 않는다.
- 엔딩 가로 원본은 `shared/assets/endings/act-1.webp`, `act-2.webp`, `act-3.webp`이며 보존한다. 권장 신규 세로 경로는 `shared/assets/endings/act-1-portrait.webp`, `act-2-portrait.webp`, `act-3-portrait.webp`이다.
- 엔딩 데이터는 `shared/runtime/act-endings-content.js`의 10/20/30 항목이다. `shared/runtime/act-endings.js`의 `preload()`·`show()`가 로딩·표시하고, `game/src/act-endings.css`가 배치한다. 엔딩 본문 및 다음 막 제목도 DOM이다. 기존 모바일은 가로 그림을 cover로 확대하고 막마다 가로 초점을 옮긴다.
- 현재 `shared/runtime/main.js`는 승리 후 대화 직전에 해당 막 그림만 preload한다. 게임 시작 시 엔딩 그림을 선로딩하지 않는다. 새 구현도 시작 시 금지·현재 막/보이는 방향만 로딩 원칙을 유지한다.

## 구현·검수 상태

조사 완료. 방향별 에셋 선택, 회전, 캐시 재사용, 화면 크기 고정, safe area와 본문 위치를 구현 중이다. 새 엔딩 세로 파일이 없는 동안 명시적으로 가로 대체를 유지하며 없는 파일 요청이나 임의 이미지 가공을 하지 않는다. 최종 새 세로 그림의 미술 합격은 아직 대기 중이다.

320×568, 390×844, 412×915 및 가로 화면을 대상으로 실제 Chromium 스크린샷 검수 3회와 별도 종합 검수를 기록한다. 자동 결과와 스크린샷은 저장소 지침에 따라 `_local/reports/responsive-story-art/`에 두고 이 문서에 판정과 제한을 남긴다.

## 세로 파일 공급 계약

엔딩의 `portraitImage`는 위 권장 경로를 가리킨다. `node game/build.mjs`가 파일 존재를 확인하여 있으면 원본 바이트 그대로 해시 URL로 발행하고 없으면 생성 런타임에서 null로 바꾼다. 부모는 세 파일을 해당 경로에 공급한 뒤 빌드하면 된다. 기존 가로 파일 및 인트로 가로/JPEG/제목 파일은 교체하지 않는다. 새 인트로 세로 WebP는 `portrait.webp`를 교체하며 JPEG 대체본도 부모가 직접 제공한다. 브라우저가 지원하는 WebP만 선택하고 JPEG는 포맷 대체본이다. 파일을 같은 이름으로 교체해도 빌드 결과 URL의 내용 해시가 바뀌므로 예전 캐시와 충돌하지 않는다.

## 1차 집중 검수 · 구조와 기본 화면

실제 Chromium에서 320×568, 390×844, 412×915, 844×390, 1440×900을 촬영했다. 인트로와 세 막의 첫 컷 20장 및 `1/checks.json`은 `_local/reports/responsive-story-art/`에 있다. 인트로 4개 화면, 엔딩 세로 각 막과 가로 3막 캡처를 직접 열어 확인했다. 방향별 인트로 한 장만 요청, 시작 시 엔딩 요청 0건, 엔딩 해당 막 한 장만 요청, 전체 화면 이미지와 본문 범위를 통과했다. 새 엔딩 세로 미공급으로 현재 가로 확대의 구도 제한은 남아 있으며 미술 합격으로 간주하지 않는다. 인트로 하단 음악 제목과 footer가 가로에서 겹쳐 후속 단위에서 간격을 교정한다. 기존 가로/세로/JPEG 7개 파일 SHA-256이 모두 유지됨을 확인했다.
