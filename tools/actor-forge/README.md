# 동맹과 혼의 공방

현재 제작 기준과 전수조사 결과는 [ACTOR_ART_PIPELINE.md](../../game/docs/ACTOR_ART_PIPELINE.md)를 따른다.

`node tools/actor-forge/lab.mjs`로 공방을 만들고 `_local/reports/actor-forge/index.html`을 연다. 실제 게임도 갱신하려면 `npm run build`. 브라우저 검사·크기별 이미지·20종 동작 시트는 `npm run test:actors`.

수정 순서는 `catalog → humans/spirits/objects → anatomy → recipes → build`다. 생성 SVG/JSON/runtime은 직접 수정하지 않는다. `audit.mjs`와 `tests/actor-art-baseline.py`는 이미 확보한 과거 기준의 최초 감사용이며, 기존 fixture가 있으면 재기록을 거부한다.
