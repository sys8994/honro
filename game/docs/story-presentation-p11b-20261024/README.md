# P1.1b story presentation 중복 제거 — 2026-10-24

기준은 배포 master `d1e45a0fe72507a695dbdcf00f1141fee357b1dd`다. story.js 내부의 private storyCopy가 narration/19장 비문/character의 동일한 안쪽 copy·heading·escaped 본문·actions만 생성한다. private finishPage는 일반 guide/narration/비문/character 페이지의 controls→next focus({preventScroll:true})→save만 공유한다. guide는 종료 tail만 공유한다.

각 variant의 outer classes/ARIA/초상화 dispatch/카메라는 기존 함수에 남아 있다. heading/progress/버튼 이름·순서·class·id·style은 같다. line escape는 helper에서 정확히 한 번 실행한다. staging draw=true는 여전히 controls만 실행하고 return한다. 정확한19장 active+rowId selector 및 unrelated document의 기존 표시도 유지한다. 새 module/cache/render-skip/registry는 없다.

## 검사와 제한

- `node tests/story-presentation-state-p11b.mjs`: production Story/App/save를 DOM/audio/frame double과 연결한 기준/현재 differential. 이전·다음·넘기기·중복 finish·실제 저장/reload/Continue 후 dialogue/history/seen/profile 동치, redraw 소리 중복 없음. 각 실행의 시각 기반 battle session/attempt 식별자 두 개만 정규화했다. presentation 앞/finish 이후 원본 소스 exact, staging early return 유지 확인. 새 세이브 context만 사용했다.
- `python3 tests/story-presentation-browser-p11b.py`: 실제 로컬 Chromium154에서 기준/현재 production story.js를 번갈아 연결해 DOM을 비교했다. 본문 &<>"'가 그대로 한 번 표시되는지, 인물 초상화 있음/없음, 명시 narration, legacy 길 위의 기록, guide, 정확한19장 비문, 19장 unrelated document, 일반 document 8종의 DOM 동치를 확인했다. canvas의 비동기 준비 상태 속성2개만 정규화했다. 전장/카메라/초상화 코드는 실제 공통 코드이고 입력 상태는 fixture로 준비했다.
- controls(이전 삽입)→audio→focus:true→save 순서/각1회, 반복 draw에서 이전1개/첫 행 disabled·audio0, 다음 행 이전 enabled를 확인했다. staging true fixture는 skip focus 유지, controls/audio만 각1회, next focus/save0이며 기준/현재 동치다.
- 정상 App/rAF를 끄지 않고 360×780 및1280×900에서 실제 본문 bounding rect/computed visibility와 action 영역 분리, 인물/서술/guide/비문 4종의 실제 버튼 입력을 확인했다. guide에는 원래 skip이 없어 확인/다음으로 종료했다. desktop guide의 기존 가로 배치는 본문과 action이 좌우로 분리되는 것으로 검사했다. 전투 전체나 전체 장 순회는 하지 않았다.
- 최종 생성 entry를 새로 열어 title→훈련 fixture→실제 narration의 정상 frame 본문·다음/이전/넘기기 동작도 별도로 확인했다. 실기기·공개 배포 확인은 아니다.
- 기존 `dialogue-speaker-presentation.mjs`의 일반 document=story-document 기대는 수정 전 기준에서도 실패했다. `dialogue-controls-audio.mjs`는 첫 다장면 cue/reread 항목은 통과했으나 옛11장 문구를 찾는 Continue 항목에서 null dialogue로 실패했고, 그 항목을 기준 원본으로 단독 실행해 같은 실패를 확인했다. 해당 테스트/원고/표시를 억지 수정하지 않았다. 위 좁은 differential이 현재 진행 상태와 실제 Continue를 비교한다.
- `npm run build`, `node tests/web-split.mjs`, 기존 공개 보존 검사 통과. 활성354파일/실제 공개44그래프/중복 제외845파일 SHA·bytes·기존 발행 metadata 보존, engine/terrain/data/CSS/audio/VFX 불변. web-split의30장 입력 비교는 플레이 순회가 아니다. 기존 P1.1a 성공 발행만 등록했고 새 후보를 발행으로 등록하지 않았다.

entry: `web/entries/game.48d68fb3a174b033.js`. manifest SHA256: `8e0210726a0d6789e410b80bb560afda30d8bd231013a90a33fd6d875d6f26b3`.

원시 결과/캡처는 정책대로 `_local/reports/story-presentation-p11b/`에 둔다. 기능·속도 개선을 주장하지 않으며 상태/DOM 보존을 검사한 책임 정리다. master/Pages는 부모가 담당한다. P1.2는 기존 rawState→enhance→surface 경계를 유지하고 광범위 재작성을 제외하도록 계획만 갱신했다. P1.3 옛 대사 데이터의 저장 compat 소비를 명시했고 삭제하지 않았다.
