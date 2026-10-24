# P1.1a 캠프 DOM 조정 소유자 분리 — 2026-10-24

기준은 실제 배포 master `5154db899d3c9f62012c87b4f943cd44f2c3e676`이다. `skill-images.js`가 이미지 수명과 캠프 전체 DOM 조정을 함께 소유하던 책임을 분리했다. 기존 `key/sync/patch`를 `camp-renderer.js`로 옮겼고 key의 action/slot, 순서, 속성 동기화와 노드 재사용 알고리즘은 그대로다. `HonroSkillImages.canRetainHost(old,next)`는 기존 같은 skill-icon host 판정을 그대로 제공하고 `scan(root)`가 patch 뒤 호출된다. 이미지 queue/cache/timeout/retry/late-success/observer 본문은 변경하지 않았다.

`main.showCamp`는 mandatory `HonroCampRenderer.patch`만 호출한다. 이미지 모듈의 patch alias 및 main의 innerHTML 폴백은 제거했다. 공통 빌드는 이미지 모듈→캠프 렌더러→나머지 app/main 순서를 사용한다. ui-bridge의 detached parsing/localize, CSS·문구·초상화·배치·드래그·게임/저장 로직은 그대로다. DOM double을 쓰는 기존 모델 검사에는 명시적인 test-only renderer double을 연결했다. 실제 reconciliation 검증은 Chromium에서 했다.

## 관련 검사

- `node tests/camp-renderer-ownership.mjs`: 기준의 기존 알고리즘과 이동 결과 exact 비교, 이미지 lifecycle 나머지 코드 exact, main의 단일 호출 교체·공통 build 순서 확인.
- `python3 tests/camp-renderer-browser.py`: 기존 icon-cache-journey의 INIT/SETUP/WATCH를 재사용한 로컬 Chromium154, 390×844 touch, 새 storage context, 정상 App/rAF 실행. 레벨/SP는 기존 fixture 방식으로 준비하고 실제 UI의 랭크+·스탯투자·분기·동행 선택을 클릭했다. 전 캠페인 도달 검사는 아니다.
- HUD12회 상태 갱신: 동일 버튼/이미지 host, 추가/삭제/flash0, 추가 이미지 요청/decode/src load0. 캠프 랭크/스탯 갱신: 기존 버튼·이미지 host 유지, 이미지 요청/decode/src 쓰기0. 이미지84개 warm 이후의 상태 갱신 비교이며 cold 로딩 감소 주장이 아니다.
- 스크롤120→120. 동일 아이콘을 서로 다른 두 slot에 둔 DOM fixture에서 각각의 노드/이미지와 action+slot key 유지, 순서·속성·텍스트 갱신, details open/close 및 제거를 확인했다. 현재 실제 캠프에는 details가 없으므로 details 검증은 fixture 범위다.
- 별도 fresh context에서 로딩 중 A01 host를 제거한 뒤 targets1→0, 늦은 이미지 성공 후 분리 노드 src 쓰기·재삽입 없음, JS error0을 확인했다. 재시도 전체 시간 검사는 반복하지 않았으며 해당 소스가 기준과 exact임을 확인했다.
- 포커스: 같은 캠프 재렌더에서 버튼은 유지되지만 activeElement가 body로 이동했다. 기준5154의 원래 알고리즘을 같은 UI에 연결한 비교도 동일했다. 새 회귀는 없으나 포커스 유지가 통과했다고 주장하지 않는다. 이번 소유자 이동 외의 UX 수정은 하지 않았다.
- `node tests/camp-skill-ux.mjs`: 기존 production App/DOM double 모델의 캠프 랭크/장착/반환·스크롤·저장 경로 통과. 실제 DOM 노드 증거와 구별한다.
- `npm run build`, `node tests/web-split.mjs`: 생성 hash/bytes·기동 및 embedded 격리·Workshop 공통 진입 확인. 30장 입력 데이터 비교는 플레이 순회가 아니다.
- 기존 공개 그래프 보존 검사 `node tests/profile-store-p01-preservation.mjs`: 활성354파일, 실제 공개43그래프, 중복 제외841파일 bytes/SHA/발행 메타데이터 확인. 기존 P1.0 성공 발행을 기존 도구로 등록했고 새 후보는 발행으로 등록하지 않았다. 전투/지형/데이터/CSS/오디오/VFX 소스 불변.

현재 entry는 `web/entries/game.2fdc7017a36f3482.js`, manifest SHA256 `ff861a5dfeae97b5e92acb4c14c102728ffc261a51e0cdb94081b510f54a2bc1`이다. FPS·시작 속도 개선은 측정하거나 주장하지 않는다. raw 결과/모바일 캡처는 저장소 정책대로 `_local/reports/camp-renderer-p11a/`에 있다. 부모가 master/Pages를 최종 반영하며 이번 후보의 공개 검증은 아직 하지 않았다. 나머지 P1/P2는 대기한다.
