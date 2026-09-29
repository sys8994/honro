# HONRO Monster Forge

이 독립 저장소의 몬스터 제작·검수 도구. 과거 `honro-vector-forge`의 누락된 파일을 요구하지 않는다.

전체 기획과 유지보수 명세: [몬스터 제작 파이프라인](../../game/docs/MONSTER_ART_PIPELINE.md).

```powershell
npm.cmd run build
npm.cmd run test:monsters
```

`_local/reports/monster-forge/index.html`을 연다. 전후·크기별 비교, 양방향, 동작 재생/시간 슬라이더, 배경, 실루엣/선 보기, 메모 내보내기를 제공한다.

`recipes.mjs`(공통 도우미·기존 3종)와 `species.mjs`(새 8종)를 제작 원본으로 편집한다. `shared/assets/monsters/`의 SVG·rig/animation JSON·runtime과 두 게임 HTML은 빌드 생성물이다. 일반 적 11종을 기존 타입/variant와 연결하고, 같은 렌더러를 게임·Workshop·검수 공방에서 사용한다.

앵커는 `tests/fixtures/monster-baseline.json`에 보관한 최초 원본의 **2.85~3.15배**로 제한한다. 반복 장식을 줄이고 종의 형태·얼굴·재질 경계에 배정한다. 이전 개선 시안을 새 기준으로 삼거나 단순 선분 분할로 숫자를 채우지 않는다. 생성기가 범위를 벗어난 에셋을 거부하며, 브라우저 검사는 최초 렌더러의 실제 호출 수와 기준 파일을 대조한다.

일반 에셋 빌드: `node tools/monster-forge/build.mjs`.
공방 빌드: `node tools/monster-forge/lab.mjs`.
전체 검사: `npm.cmd run verify`.

검수 PNG·자동 측정은 `_local/reports/monster-forge/`, 직접 본 미술 평가는 같은 폴더의 `VISUAL_REVIEW.md`에 기록한다. 기술 통과와 미술 승인을 구별한다.
