# HONRO 네 동행 벡터 공방

설오·담허·휘겸·소단 v008의 작성 도구다. [제작 기준과 검수 절차](../../game/docs/PARTY_ART_PIPELINE.md)를 따른다.

- `references/`, `references.json`: 실제 시트 4개와 SHA·얼굴 crop·직전 v007 앵커 예산. PNG는 제작·공방에만 쓰며 게임에는 넣지 않는다.
- `portrait-shapes.mjs`: 원본 PNG 픽셀 좌표의 제한된 윤곽/이목구비 경로와 균일 변환. 휘겸만 방향을 반전한다.
- `sheet-faces.mjs`: 머리/목 교체, 시트 팔레트와 소단의 연보라색 포인트, 얼굴 기준점 메타데이터.
- `recipes.mjs`: 고정 v006에서 v007 몸·모션을 재현하고 새 얼굴·색상을 적용한다.
- `build.mjs`: v006/v007/PNG SHA와 v007 대비 0.95~1.05배 앵커 예산을 검사하고 SVG·rig·animation·runtime을 생성한다. `shared/build.mjs`에서 호출한다.
- `lab.mjs`, `lab.html`: 시트/현재와 격리된 v007/현재 비교 공방. 실제 공통 런타임을 쓴다.
- `../../shared/runtime/party-rig.js`: 공통 리그·Canvas/SVG 렌더러.
- `../../tests/fixtures/party-baseline.json`, `party-v007.runtime.js`: 고정 기준 원본.
- `../../tests/party-art-browser.py`: 모션·실제 전투·세 화면 픽셀·성능 검사와 비교 이미지 생성.

루트에서 `npm.cmd run build`, `npm.cmd run test:party`를 실행하고 `_local/reports/party-forge/index.html`을 연다. `node tools/party-forge/lab.mjs`는 공방·에셋만 생성하므로 게임 HTML은 따로 빌드한다. 결과는 `shared/assets/party/`다. 다운로드 폴더나 과거 외부 Forge 없이 저장소 입력으로 재현한다.