# 3막 7장 설오 조우: 대사·속도·배치 수정

기준은 `master c0e323ff3df9c5f4120e48d470c8ca80c679c57e`, 작업 브랜치는 `fix/act3-void-dialogue-pacing`이다. 부모가 전달한 2026-10-22 사용자 피드백과 확정 대본만 적용한다. master 병합과 Pages 발행은 부모 최종 검수 담당이다.

## 대본과 공개 범위

| 컷 | 내부 배치 | 대사 |
| --- | --- | --- |
| 1 | 설오 / near | 여긴…… 누구십니까? |
| 2 | 이름 없는 문장 / far | 또 답을 들으러 왔느냐. |
| 3 | 설오 / near | 저는 사람을 찾고 있습니다. |
| 4 | 이름 없는 문장 / far | 그자는 달랐다. 죽은 이의 말이 아니라, 죽음 너머의 답을 원했다. |
| 5 | 이름 없는 문장 / far | 너는 아직 돌아갈 길이 있다. |

복귀 대사:

1. 담허: 발을 헛디뎠나? 다친 데는 없나?
2. 설오: 누군가 말했습니다. 저보다 먼저, 답을 구하러 온 이가 있었다고.
3. 담허: ……나는 아무 소리도 못 들었네. 우선 이곳부터 벗어나세.

[전체 바이블 3.2·6절](../story/HONRO_FULL_STORY_BIBLE_v1.0.md) 및 [개편 사양 C절](../story/HONRO_ACT2_ACT3_REVISION_AGENT_SPEC_v1.0.md)의 정체·공개 상한을 유지한다. 이번 최신 표현 변경은 이전의 '돌아가라' 반복, 긴 정적, 상시 버튼 금지보다 우선한다. 대도사의 **동경**, 즉 죽은 자의 말을 넘어 저승 자체의 답을 듣겠다는 집착을 생각할 단서다. '그자'의 신원이나 동일 존재 여부는 확정하지 않으며, 29장 기록과 연결해 생각할 여지를 남긴다. 이름·초상·형체·악의·예언·선택받음·빙의 면죄·종 제작법·70년 지연 원리는 추가하지 않는다. 원본 바이블은 수정하지 않는다.

## 구현 단위

- 낙하 0.8초 + 암전 0.6초 = 1.4초. 빈 컷과 문장별 1.5~2.5초 wait 삭제. 대사 전체를 즉시 표시한다.
- 화면 클릭/탭, Enter/Space로 진행한다. 실제 단조 시계로 입력 중복만 120ms 차단하며 반복키는 소비한다. 포인터의 진행 경로는 click 하나다. pointerup과 compatibility click에 각각 진행시키지 않는다.
- 전환을 포함한 모든 단계에서 작은 '장면 넘기기'와 '잠시 멈춤'이 보이며 최소 44px hit area다. 버튼 클릭은 바탕 진행으로 전파하지 않는다. 화면 안내는 12px 보조 문구다.
- 양 화자의 최장 문장 영역을 현재 글꼴과 화면비로 먼저 측정한다. 존재는 상부, 설오는 하부에 두고, 그 사이에서 기존 rig의 실제 비투명 픽셀 영역을 맞춘다. 28px 간격과 인물 축척을 함께 계산한다. 타격/충돌 높이를 인물 실루엣으로 오인하지 않는다. 인물은 2배 해상도로 한 번 그린 기존 rig이며 새 형태나 에셋을 추가하지 않는다.
- 기존 transient/blocked 계약, 전투 tick·mission 정지, 저장 revision과 증거 키, 원위치/자원/동행/카메라/입력/HUD/BGM 복원을 유지한다. 스킵 중 반복 요청은 복귀 타이머를 초기화하지 않는다. 보상은 추가하지 않는다.
- 기존 27장 네 도착점, 필수 명세 guard, 28장 합류 및 구 저장/체크포인트 계약을 보존한다. 중간 저장 재개는 원래 안전 위치의 READY, 완료 저장은 RESOLVED와 복귀 대사를 유지한다.

## 병행 통합 주의

읽기 전용으로 확인한 `integration/honro-feedback-20261022`는 `d042aff6c53d40346d57e5ebe431bc72b27c35d2`였다. 당시 이 작업의 JS/CSS/두 테스트에는 직접 변경이 없었다. 통합 브랜치는 계속 진행 중이므로 최종 cherry-pick 시 다시 확인해야 한다.

- `shared/runtime/main.js`의 blocked 분기와 `act3-void.js` API는 그대로다. 읽어 본 통합 `clear-report.js:115`는 `!HonroAct3Void.blocked(app)`와 `!app.dialogue`를 집계 조건으로 유지했다. 이번 수정도 blocked를 모든 연출 단계에 유지한다. 이는 정적 계약 확인이며, 통합 보고서의 실제 시간 집계는 부모 통합 검수가 필요하다. 이번 브랜치에는 그 보고서 코드가 없다.
- 통합 쪽의 `split-campaign.js`, `stake-crossing.js`, `campaign-entry.js`, `rest-journey.js`, `main.js`를 덮어쓰지 않는다. 변경은 장면 JS/CSS, 해당 테스트와 이 보고서 및 BUG_LOG의 짧은 링크에 한정한다.
- `game/docs/BUG_LOG.md`는 병행 추가에 따른 문맥 충돌 가능성이 있다. 이 작업의 마지막 항목만 추가하면 된다.
- 빌드 산출물 `HONRO*.html`, `index.html`, `web/`는 로컬 검증에만 사용한다. 기준 checkout 자체의 생성물 불일치도 있으므로 부모가 최종 통합 소스로 한 번 재생성한다. 이 브랜치에는 생성물 diff를 커밋하지 않는다.

## 검수 기록

최종 실행 소스는 `a52518157ef1143c83d1693fea556c3882c62ca8`다. 최초 구현은 `804cc520e90be447cc85d49006dcea2206c9868e`다. 런타임·CSS·테스트·검증용 생성 manifest의 SHA-256은 [source.json](evidence/checks/source.json)에 있다. 종합 검수에서 프레임 누적 시간 기반 입력 guard가 느린 프레임에서 실제 120ms보다 길어질 수 있음을 발견해 `performance.now()` 단조 시계로 수정했다. 렌더 프레임 없이 121ms 뒤 진행되는 회귀 검사도 추가했다. 이 수정 뒤 세 집중 검수와 별도 종합 검수를 다시 실행했다. 이후에는 증거·보고서만 추가한다.

| 검수 | 확인 결과 | 증거 |
| --- | --- | --- |
| 집중 1: 속도·입력 | 첫 대사 전체 즉시 표시, 진입 약 1.4초, 실제 모바일 탭 1회당 1컷, compatibility click·100회 연속 click·더블클릭·키 반복 방지, Enter/Space, 버튼 전파 차단, 설정/포커스 순환 | [입력 요약](evidence/input/summary.json), [모바일 첫 컷](evidence/input/mobile-immediate-line.jpg) |
| 집중 2: 모든 컷 반응형 | 4개 화면비 × 5컷의 실제 Canvas alpha 픽셀과 DOM 문장 box/줄 box를 대조. 모두 겹침 0px². 긴 4컷에서 세로↔가로 회전 후에도 원래 복귀 snapshot 유지 | [컷별 수치](evidence/layout/summary.json), [360 세로 긴 대사](evidence/layout/360x800-cut4.jpg), [844 가로 긴 대사](evidence/layout/844x390-cut4.jpg) |
| 집중 3: 복귀·저장 | FALLING/DARKENING/VOID/RETURNING 각 실제 reload → READY/안전 위치. 전환 3단계의 보이는 스킵 → 정확한 원상 복원, 100회 추가 skip 무동작, 완료 후 reload → RESOLVED/복귀 대화 3줄. hidden-document 정지 및 기존 자동 일시정지 복귀 | [상태 요약](evidence/state/summary.json), [암전 중 스킵 후 재개](evidence/state/skip-darkening-reloaded-return.jpg) |
| 별도 종합 | 동일 실행 소스에서 위 흐름을 다시 결합하고 실제 Workshop Playtest iframe, BGM 원 스트림/재생 위치/사용자 음소거 유지까지 확인 | [종합 요약](evidence/final/summary.json), [Workshop](evidence/final/workshop-void.jpg) |

보관한 실제 Chromium JPG는 총 59개이며 최대 파일 크기는 84,954바이트로 모두 1MB 미만이다.

JPG 직접 열람: 집중 1의 모바일 즉시 표시/복귀, 집중 2의 360×800·390×844·844×390·1440×900 **각 5컷 전부**, 집중 3의 재개 화면 및 최종 종합 대표 화면을 실제 파일로 열었다. 검은 공간/기존 설오만 있는 구도, 존재 대사 상부 분리, 설오 대사 하부 분리, 버튼과 안내 가독성·여백을 확인했다. 초기 그림의 인물 확대 흐림을 보고 캐시 렌더를 2배 해상도로 보완한 뒤 최종 소스로 다시 촬영했다.

초기 검수 하네스는 지연 로딩을 즉시 진입으로 가정하거나 설정 닫기 버튼 둘을 한 개로 가정했고, visibilitychange 때 기존 자동 멈춤 메뉴가 열리는 동작을 빠뜨렸다. 이를 현재 앱 계약에 맞췄다. 종합 단계의 Workshop API 초기화 대기와 BGM의 '연출 일시정지 플래그'/'실제 오디오 paused' 구분도 보완했다. 이 하네스 실패를 게임 실행 통과로 세지 않았다.

화면 좌표는 CSS px이며 실제 Canvas의 모든 alpha > 0 픽셀을 포함한다. 아래 최소 간격은 모든 5컷 중 가장 가까운 문장 box와 인물 box 사이의 수직 거리다.

| 화면 | 실제 인물 x / y 범위 | 4컷 줄 수 | 모든 컷 최소 간격 | 겹침 |
| --- | --- | --- | --- | --- |
| 360×800 | 142.5–217.5 / 343.5–503.5 | 2 | 132.12px | 0px² |
| 390×844 | 155–235 / 361.5–530.5 | 2 | 141.77px | 0px² |
| 844×390 | 403.5–440.5 / 164–242 | 1 | 63.95px | 0px² |
| 1440×900 | 677.5–762.5 / 371.5–551.5 | 1 | 160.86px | 0px² |

두 상시 버튼은 모든 측정에서 가로/세로 44px 이상이며, 글자 크기는 존재 18–24px, 설오 17–21px다. 짧은 가로 화면을 위해 글자를 더 줄이지 않았다.

### 자동 검사와 기존 실패

- 통과: [장면 런타임 14개 검사](evidence/checks/runtime.txt), [빌드](evidence/checks/build.txt), [typecheck](evidence/checks/types.txt), [web-split](evidence/checks/web.txt), [기존 공간 이상 author 검사](evidence/checks/anomaly.txt), [기존 종 이상 런타임 검사](evidence/checks/bell.txt).
- 장면 런타임은 전체 unit snapshot(HP/MP/쿨다운/상태 포함), 동행/활성 선택, 아이템/라운드/teamEnds/fields/stakes/heroes, 카메라, 명세 guard, 구 저장, abandon/retry/새 장 witness를 확인한다. 실제 브라우저는 HUD·입력·BGM·복귀 대화와 저장을 확인한다.
- `npm run test:story-revision`은 `story-canon-v1`의 29장 구 revision 대사 비교에서 실패한다. `npm run test:act3:split`도 첫 `act3-split-campaign`의 XP 비교 `83635 !== 83652`에서 중단된다. **두 npm 묶음을 통과로 보고하지 않는다.**
- 중단 뒤의 분할 검사도 각 명령으로 실행해 누락을 드러냈다. 별도 기준 worktree `c0e323ff`와 최초 수정 tree `804cc520`의 14개 관련 검사 결과는 4개 통과/10개 실패로 같았다. [대조 결과](evidence/checks/regression-comparison.json)와 `evidence/checks/baseline-*.txt` / `changed-*.txt`에 전체 원인을 남긴다. 이 작업 범위 밖의 기존 테스트/게임 로직은 수정하지 않았다.

| 기준과 수정 양쪽에서 실패한 검사 | 기존 실패 지점 |
| --- | --- |
| act3-split-campaign | 28장 합류 XP 기대치 차이, line 52 |
| act3-split-v2 | 28장 제목 기대값 '왕실의 선택' vs 현재 '지운 이름과 남은 명령' |
| stake-preparation | 소모품/준비 실패 메뉴의 stake-retry 버튼 기대값, line 17 |
| stake-crossing-canonical | 실제 횡단 후 objective 완료 기대값, line 14 |
| split-custom-return-boundary | 디버그 기예 snapshot 비교, line 14 |
| stake-crossing-xp | 새로 획득한 shared XP 차이, line 20 |
| split-v1-population-cap | 새 집하장 적 편성 수 기대값, line 10 |
| act3-continuity | 기존 소모품 기대값 1 vs 7, line 6 |
| act3-save-boundaries | 기존 승패/완료 경계 기대값 0 vs 1, line 73 |
| story-canon-v1 | 구 revision 29장 대사에 현묵 법맥 문장 추가, line 33 |

기준과 수정 양쪽에서 통과한 분할 검사: `stake-crossing-runtime`, `stake-crossing-flexible`, `stake-crossing-physics`, `stake-crossing-cache`. 위 기존 실패 때문에 넓은 split/story 게이트 전체는 미통과이며, 새 장면의 집중 검수 통과와 구분한다.

재현 명령:

```sh
npm ci --ignore-scripts --cache /tmp/honro-npm-cache
npm --prefix game ci --ignore-scripts --cache /tmp/honro-npm-cache
npm run build
HONRO_VOID_REVIEW=input python tests/act3-void-browser.py
HONRO_VOID_REVIEW=layout python tests/act3-void-browser.py
HONRO_VOID_REVIEW=state python tests/act3-void-browser.py
HONRO_VOID_REVIEW=final python tests/act3-void-browser.py
node tests/act3-void-runtime.mjs
npm run test:story-revision
npm run test:act3:split
npm --prefix game run typecheck
node tests/web-split.mjs
```

검수는 실제 빌드한 로컬 Chromium과 명시적인 27장 심부 배치 fixture다. 전체 30장 완주·정상 전투 완주·실물 모바일·OS 백그라운드 수명주기·성능 합격을 주장하지 않는다. `document.hidden`은 통제한 getter fixture로 검사한다. master/Pages 공개 검증은 부모 작업으로 남긴다.
