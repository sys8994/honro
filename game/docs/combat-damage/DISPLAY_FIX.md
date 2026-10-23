# 실제 상세 화면의 평균·편차 안내 누락 보완 — 2026-10-23

기준 master/성공 Pages는 `a3c99e33ec8c7a2c050bf71866a077bbc2cbd9ee` / 39889380063 / 2026-10-23T02:26:33Z다. 이 빌드의 보존 entry `web/entries/game.f46e2a3a157557eb.html`에서 실제 클릭으로 누락을 재현했다.

## 원인과 수정

`skillEffectRows()`에는 피해 기준 행이 있었지만, 모닥불의 실제 `talentView()`와 허공터의 `training.render()`는 경지별로 바뀌는 항목만 남기는 `skillGrowthRows()`로 효과표를 만든다. 고정된 ±편차는 이 필터에서 빠졌다. 기본기 `talentView()` 분기는 효과표도 사용하지 않는다. 앞선 `combat-damage-browser.py`는 함수 반환값만 확인했으므로 실제 상세 UI 표시 검증이라는 보고는 부정확했다.

성장 비교표와 별도로 `campUI.ts`의 순수 view helper `damageVarianceView()`를 기본기/사용 기예/역사적 비기 상세와 허공터 상세에 직접 연결했다. 피해 편차 데이터의 기존 `damageSpread()` 값을 읽어 `피해 수치는 평균 · 행동당 ±5%`처럼 한 줄만 출력한다. 회복·지원·상시 등 편차가 없는 기예에는 만들지 않는다. 기존 CSS를 그대로 쓰며 피해 계산·성장표·저장·랜덤 버퍼는 변경하지 않았다.

실행 코드 수정 파일은 `shared/engine/src/campUI.ts`, `shared/runtime/training.js` 두 개다. `engine.ts`, `damageVariance.ts`, `progression.ts`, `store.ts`, `world.ts`, `types.ts`, `main.js`, 카메라, 대사/스토리, 캠페인/천장 데이터는 기준 master와 동일함을 diff로 확인했다. `combat-damage-browser.py`의 API 직접 호출을 UI 확인으로 기록하던 항목도 제거했다.

## 실제 클릭 검수

`tests/visible-skill-damage-variance-browser.py`는 title→휴식터→모닥불→평사 슬롯/급소시 카드를 실제 Playwright 클릭으로 연다. 이어 휴식터 허공터 버튼, 기예/계통/동행 카드, 수련 적용, 전장의 기예 고르기 버튼도 실제로 클릭한다. App의 render 메서드나 기예 데이터 함수를 호출해 화면 검증을 대신하지 않는다. JavaScript 평가는 DOM/보존할 프로필의 읽기만 한다.

1280×900 및390×844에서 변경 전30개/변경 후30개 판정, 각24개 실제 화면 PNG와 상세 DOM JSON을 남겼다. 같은 UI 경로의 비교다.

|실제 진입|검수|
|---|---|
|모닥불 평사·급소시|기본기와 사용 기예 모두 평균·±5%가 실제 DOM에 각1번, 화면 안 표시|
|허공터 최초 설정|평사/급소시 ±5%, 산개사 ±10%, 화호 ±15%, 회생진목에는 안내 없음|
|다른 동행 기본기|기파 ±10%, 평참 ±5%, 혼령탄 ±10%|
|허공터 전장에서 다시 기예 고르기|수련 적용 후 다시 연 상세의 급소시·평사에도 안내 표시|
|모닥불 읽기|성장/기예 배치/완료/진행 중 전투 스냅샷 동일|
|일반 캠페인 전투 HUD|기예 클릭은 선택만 하며 상세를 열지 않는 기존 정책을 실제 클릭으로 확인. 공개 화면에는 `training-info` 버튼도 없다. 별도 상세 진입 UI는 신설하지 않음|

변경 전22개 공격 안내 위치에는 문구가 없었고, 변경 후 같은22개 위치에 정확한 평균·±범위가 표시됐다. 회생진목2뷰는 안내가 없는 상태를 유지했다. 안내 중복0, 가로 넘침0, 표시된 안내의 viewport 이탈0, 두 viewport 모두 pageerror0이다. 모닥불 평사 세로 화면과 허공터 급소시 가로 화면의 실제 PNG도 직접 열어 읽기 상태를 확인했다.

재현 명령:

```sh
HONRO_VARIANCE_PHASE=before HONRO_VARIANCE_DOCUMENT=web/entries/game.f46e2a3a157557eb.html python tests/visible-skill-damage-variance-browser.py
python tests/visible-skill-damage-variance-browser.py
```

원본은 `_local/reports/visible-skill-variance/{before,after}/checks.json`, 각24개 PNG 및 `*.dom.json`이다. 대표 after 이미지는 `390-camp-A01.png`, `390-camp-A14.png`, `1280-training-A14.png`, `390-battle-training-reopen-A14.png`다. 일반 캠페인에는 현재 클릭 가능한 기예 상세 진입점이 없으므로 이를 검수했다고 주장하지 않는다. 실제 기기 검수·전체 캠페인/피해 회귀는 이 UI-only 변경에서 실행하지 않았다.

`npm --prefix game run typecheck`, `npm run build`, `node tests/web-split.mjs` 통과. 부모가 전달한 실제 성공 a3c99e33/Pages39889380063을 성공 그래프 보존 목록에 등록해 기존 공개 `game.eb159c693a154367.js`와354파일을 보존한다. 이 후보의 master 병합/새 Pages 배포는 부모 담당이다.
