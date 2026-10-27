# v4 통합 준비 · 2026-10-27

별도 브랜치 `codex/act23-v4-integration-20261027`는 현재 공개 master `0f19f8f75ebf77a356f9f8016fcb81ea51ff9fa2`를 포함하는 Act2 감사 복구 `47c1e8a91837b77a45d97be8889a5529b91adf3c`에, 확인된 Act3 `8a02a97eec4b44bf382d21c6348dec11d9e31b9a`를 병합했다. 기존 두 작업 브랜치를 변경하지 않는다. master/Pages는 미발행이다.

## 공통 연결

- `shared/build.mjs`: 현재 Act2 모듈 순서 뒤에 Act3 모듈/전용 미술을 연결한다. 21/22/23/24/25/27만 개별 private opt-in을 지원한다. 21장 데이터는 Act3 alias 해석에도 필요하므로 다른 허용 Act3 장만 활성화한 경우 데이터만 포함하며 21장 실행 flag는 켜지 않는다.
- `act23-v4-reviewed.js`: 장별 provider dispatch를 지연 조회해 Act2 wrappers와 함께 쓴다.
- `story.js`: 기존 commonReviewRevision 생존/기예/관측 및 DEATH.01 일회 경계 가드를 유지하고, reviewedStage 검사를 Act3 provider에도 적용한다.
- `rest-journey.js`: Act3 전투 전 현장 관측/재개와 기존 Act2 enabledFor/20장 쉼터를 함께 보존한다. 과거11장 전용 문자열 조건으로 되돌리지 않는다.
- `stake-crossing.js`: 기존 물리 checkpoint 복구 전후로 Act3의 검수 목격/표시 상태만 capture/restore한다. 자원/적/지형/XP 계약은 기존 담당을 유지한다.
- `act23-v4.js`: 활성 provider의 revision421–427을 사용하며 Act2 revision과 비활성 장을 보존한다.

`tools/testing/act3-v4-parent-integration.mjs`는 오래된 base용 검증 복사본 제안이다. 이 통합 브랜치에 그대로 재실행하지 않는다. 현재 Story·쉼터·build 앵커에 맞춰 비교한 결과가 위6개 활성 파일이다.

## 확인과 미완료

`act3-v4-reviewed-source`의 문서 manifest/321행 전체 필드 보존, `act23-v4-reviewed21/22/23/24/25-27` 집중 검사를 통과했다. 제어된 전투·영웅 위치·시간 fixture이며 정상 캠페인 완주/공개 검증이 아니다. 26/28–30은 원고 데이터만 보존했고 구현 완료로 취급하지 않는다. 기본 production 및 Phase A 단독의 검수 플래그는 계속 꺼져 있다.

## 병행 작업 충돌 예상

Stage5 담당이 수정할 수 있는 `shared/runtime/main.js`는 후속 현장 선택 대사 메뉴의 최소 연결 지점과 겹칠 수 있다. `shared/build.mjs`도 모듈/자산 등록 시 충돌 가능하다. `shared/runtime/interactions.js`, `shared/runtime/renderer.js`, `game/src/journey.css`는 이전 Phase A 변경이 있어 기준을 대조해야 한다. `shared/map/terrain-domain.js`는 이번 통합에서 수정하지 않는다. 생성 `HONRO.html`/`HONRO_WORKSHOP.html`/`index.html`/`web/manifest.json`·immutable 파일은 최종 통합 빌드에서 다시 만들며 서로의 생성물로 덮지 않는다.

현재 공개 master의 레벨업·합류·축지 수정은 공통 선조에 포함되어 있다. 이번 공통 연결은 해당 엔진/성장/축지 계산을 변경하지 않는다.
