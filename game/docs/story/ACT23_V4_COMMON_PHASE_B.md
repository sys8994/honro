# 검토 확정 공통 안내 UI 결합

`shared/data/reviewed/act23-v4-common.json`의 revision 1은 잠금 원문 일곱 행(첫 관측 네 행과 배타적인 답변 세 행), 첫 혼령의 동적 안내 두 ID, 잠운사 안내와 27장 합류 안내를 보존한다. 기존 원문에 새 대사나 사건을 추가하지 않는다. `shared/runtime/act23-v4-reviewed-common.js`는 명시적인 common 후보 플래그와 v4 실행 상태에서만 결합한다. 구현·기본 gate·기예 비용·저장 whitelist의 원본 검사와 공통 번들은 부모 담당이다.

## 실제 Chromium UI 확인 (2026-10-27)

부모가 common을 켜서 갱신한 내부 후보 `http://127.0.0.1:8768/HONRO.html`에서 `python tools/testing/act23-v4-reviewed-common-browser.py` 통과. 후보의 common JSON과 현재 정본 JSON 전체가 같음을 확인했다. `act23-v4-reviewed-common.js`, `act2.js`, `act3-void.js`, `story.js`를 실제 빌드와 같은 Terser 설정으로 변환해 served runtime 본문과 대조했다. `story.js`가 들어 있는 `manifest.gameOnly`와 공통 runtime을 함께 검사하며, 공통 번들에 없다는 이유로 오래된 빌드라고 판정하지 않는다.

자동 전투 프레임을 멈추고 실제 App·Engine·Story API와 DOM을 사용했다. 선행 완료·경지·출전 구성·기예 loadout/기력·혼령 관측 위치·등불 표면 위치·대사 대기 action boundary·마지막 설오 합류 위치는 명시적인 fixture다. `HonroAct2.firstSpiritEncounter`가 만든 실제 queue를 `HonroStory.tick`으로 열고, 원문과 실제 `#story-line`을 비교하며 Enter로 넘겼다. 이 작업은 일반 전투·이동 입력으로 처음부터 조우한 증거가 아니다.

- 첫 관측 네 행의 순서를 보존하고 현형부/등불/혼 공격 중 실제 사용할 수 있는 조건에 맞는 답변 한 행만 표시했다. 세 경로를 합쳐 잠금 원문 일곱 행을 모두 DOM에서 정본과 비교했다. fallback을 포함한 네 경로의 실제 표시 행 관측은 24개다.
- 현형부는 실제 `C.SKILLS.O08`, Engine의 `skillAllowed`·`manaCost`·common의 `usable`과 실제 `combat-skill` HUD 클릭으로 확인했다. `App.selectHero`가 살아 있는 소단을 실제 active로 바꾸었고 O08이 선택되었다. 아이템 소지로 분류하거나 발사·명중을 실행했다고 주장하지 않는다.
- 등불 fixture는 실제 지형 표면과 유효 접지를 사용하며 소단에서 532.54 world 거리다. 현재 즉시 상호작용 거리 밖에서도 관련 혼령 반경 안의 표면 유효 등불을 향해 접근하라는 원문이 표시됨을 확인했다. 이 검사는 등불까지의 전체 점프/보행 경로 또는 점등 완료의 증거가 아니다.
- 사용할 혼 기예 이름이 없는 경우에는 nonempty O08 loadout·기력 0 fixture를 사용했다. O01은 기력 0에서도 비용 0으로 사용할 수 있으므로 fallback 근거로 쓰지 않았다. 실제 안내는 승인된 일반형 `소단의 혼 공격은 드러나지 않은 혼령에게도 유효합니다.`와 neither 접미부로 정확히 결합되었다. acted·사망·적 턴의 세 별도 상태에서는 queue/대화/조우 seen이 모두 생기지 않았다.
- 실제 16장을 로더로 열고 살아 있는 `objective`, `resident-1` 및 작성된 `16.elder`, `16.disciple`, `16.work-exit`을 확인했다. 실제 HUD 목표 버튼으로 연 목표·조작 도움말의 `.battle-help-goal`에 정확한 `EDGE.RUNTIME.TEMPLE.GUIDE`가 표시되고 돌아가기 버튼이 동작했다. 이 경로에서 분리/구조 보행/증언 완료를 새로 실행한 것은 아니다.
- 실제 27장을 로더로 열었으며 void는 `READY`, 설오는 `(300,4700)`, 실제 trigger는 x3370–4230/y3050이었다. `beforeManifest`가 정확한 `EDGE.RUNTIME.VOID.REJOIN_PROMPT`를 표시했고 이전 안내의 `명세`는 없었다. 실제 localStorage 저장·reload/continue 뒤 같은 행을 확인하고 Enter로 닫았다. 설오를 실제 trigger에 둔 마지막 위치 fixture 뒤에는 안내 허용이 false이고 대화가 생기지 않았으며 기존 void가 `FALLING`으로 진입했다. 이후 추락/복귀/장 완료는 검사하지 않았다.

최종 경로의 page error는 0이다. `_local/reports/act23-v4/reviewed-common-browser/capture.json`에 source/served bundle 해시, 표시한 원문, 실행 조건, 13개 캡처를 저장했다. common runtime source SHA는 `d2500f824b1809820e1eba7b084002d082c26bcb01301bffa819f8cd90461030`, JSON SHA는 `f8ed4ecc02449d1ba052a81ce4a7d24dac578455659e4e95a26b56f07a34e1c2`다. `01-real-O08-skill-selected.png`, `02-lamp-5.png`, `02-fallback-5.png`, `03-actual-temple-help-modal.png`, `04-actual-void-rejoin-guide.png`, `06-void-rejoin-guide-suppressed.png`를 직접 열어 실제 기예 HUD·등불 안내·fallback 본문·도움말·합류 전후 안내를 확인했다. 모두 1280×800이며 별도 모바일/미술 집중 검수가 아니다.

## 관측한 예외와 미실행 범위

초기 fallback 실험에서 mandatory loadout을 직접 `[]`로 비운 뒤 `App.selectHero`를 호출하자 `App.updateHUD → Engine.manaCost`에서 `Cannot read properties of undefined (reading 'ultimate')` 예외가 났다. 이것은 실제 App 예외이며 통과로 세지 않았다. 정상 프로필에서 그 빈 loadout이 만들어진다는 증거는 없고 공통 안내 변경의 회귀라고 판정하지 않았다. 최종 실행에서는 nonempty loadout으로 no-name 조건을 검사했다. 정확한 초기 조건과 예외는 같은 보고서 폴더의 `fixture-diagnostics.json`에 남겼다. 공통 source/일반 HUD의 수정은 이 담당 범위에서 하지 않았다.

일반 전투 연속 완주, O08 발사/명중, 등불 실제 점등, 16장 구조/증언 전체 재실행, 27장 추락/복귀, 실제 음향 청취, 모바일, 전체 30장, 공개 배포는 미검사다. 이 작업은 새 browser runner·이 문서·로컬 증거만 작성했으며 공통 runtime·빌드·커밋·master·Pages를 변경하지 않았다.
