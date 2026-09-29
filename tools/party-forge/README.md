# HONRO 네 동행 벡터 공방

현재 설오·담허·휘겸·소단의 v007 작성 도구다. [제작 기준과 검수 절차](../../game/docs/PARTY_ART_PIPELINE.md)를 따른다.

- `recipes.mjs`: v006 원본에서 얼굴·복식·도구·모션을 작성하는 유일한 디자인 소스.
- `build.mjs`: 변경하지 않은 기준 원본의 SHA와 1.9~2.1배 앵커 예산을 검사한 뒤 SVG·rig·animation·runtime을 생성한다. `shared/build.mjs`에서 호출한다.
- `lab.mjs`, `lab.html`: 실제 공통 런타임과 격리된 v006을 사용한 비교 공방. 게임용 대체 렌더러는 없다.
- `../../shared/runtime/party-rig.js`: 공통 리그·Canvas/SVG 렌더러.
- `../../tests/fixtures/party-baseline.json`: 고정 원본의 SHA·앵커·발 기준·크기.
- `../../tests/party-art-browser.py`: 모션·실제 전투 연결·세 화면의 그림 일치·성능 검사와 이미지 생성.

루트에서 `npm.cmd run build`, `npm.cmd run test:party`를 실행하고 `_local/reports/party-forge/index.html`을 연다. `node tools/party-forge/lab.mjs`만 실행하면 공방과 에셋을 다시 만들며 게임 HTML은 별도로 빌드해야 한다. 생성 경로는 `shared/assets/party/`다. 다른 PC에서도 v006 기준으로 재현하며 과거 compact 시안이나 외부 Forge 경로를 요구하지 않는다.
