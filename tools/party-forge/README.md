# HONRO 네 동행 벡터 공방

설오·담허·휘겸·소단 v010의 작성 도구다. [제작 기준과 검수 절차](../../game/docs/PARTY_ART_PIPELINE.md)를 따른다. v009의 키를 유지하고 몸 폭·머리의 성인 비율을 맞춘다. 얼굴 형태·복식·물리 크기는 보존한다.

- `references/`, `references.json`: 실제 시트 4개와 SHA·얼굴 crop·직전 v008의 고정 앵커 수. PNG는 제작·공방에만 쓰며 게임에는 넣지 않는다.
- `portrait-shapes.mjs`: 원본 PNG 픽셀 좌표의 제한된 윤곽/이목구비 경로와 균일 변환. 휘겸만 방향을 반전한다.
- `sheet-faces.mjs`: 머리/목 교체, 시트 팔레트와 소단의 연보라색 포인트, 얼굴 기준점 메타데이터.
- `recipes.mjs`: 고정 v006에서 v007 몸·모션을 재현하고 새 얼굴·색상을 적용한다.
- `proportions.mjs`: v008 머리를 이동만 하고 몸·관절·완전한 포즈 목표를 v009 체격에 맞춘다. 휘겸의 손·신발·검날도 보완한다.
- `head-scale.mjs`: v009 재현 단계에서 머리를 균일 변환한다. 장식을 제외한 얼굴 높이는 남성 셋이 같은 수준, 소단은 약 12.5% 작게 맞춘다.
- `balance.mjs`, `shape-bounds.mjs`: v010의 몸 폭, 정수리→턱 등신, 기존 키 보존, 초상 머리 경계를 계산한다.
- `build.mjs`: v006/v008/PNG SHA와 v008 대비 동일 앵커 수를 검사하고 SVG·rig·animation·runtime을 생성한다. `shared/build.mjs`에서 호출한다.
- `lab.mjs`, `lab.html`: 시트/현재와 격리된 v008/현재 비교 공방. 같은 배율의 전후 비교와 새 전체 높이 기준 축소 검토를 구분한다.
- `../../shared/runtime/party-rig.js`: 공통 리그·Canvas/SVG 렌더러.
- `../../tests/fixtures/party-baseline.json`, `party-v007.runtime.js`, `party-v008.runtime.js`, `party-v009.runtime.js`: 고정 기준 원본.
- `../../tests/character-balance.mjs`: v009 전후·2,020 모션·28개 초상 크기의 오프라인 검사와 Native Canvas 증거.
- `../../tests/party-art-browser.py`: 모션·실제 전투·세 화면 픽셀·성능 검사와 비교 이미지 생성.

루트에서 `npm.cmd run build`, `npm.cmd run test:party`를 실행하고 `_local/reports/party-forge/index.html`을 연다. `node tools/party-forge/lab.mjs`는 공방·에셋만 생성하므로 게임 HTML은 따로 빌드한다. 결과는 `shared/assets/party/`다. 다운로드 폴더나 과거 외부 Forge 없이 저장소 입력으로 재현한다.
