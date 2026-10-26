# 혼로 2막 실제 코드 감사와 대사 표면 보완 목록

## 확인 범위와 결과

기준은 `c7aa5850b402299ff2df76c97ef0dd594a6a5be4`다. 부모가 제공한 `IMPLEMENTATION_RESEARCH.md`, 11~20장 `STAGE_INVENTORY.md`, `data/dialogue-rows.json`, `RUNTIME_TEXT_INVENTORY.md`, `data/runtime-text-source-lines.json`, `journal-objective-dynamic.csv`를 읽었다. 데이터/모델 감사이지 실제 조작 플레이나 코드 변경을 수행한 결과가 아니다.

통합 기획의 200개 대사는 새 본편 초안이다. 기존 본편·arrival·쉼터·엔딩·동적 안내를 모두 자동 대체하는 파일이 아니다. 부모가 별도 addendum 검수에서 아래 표면을 함께 교정해야 구대사 역류가 사라진다. 현재 검수용 part1 83행·part2 115행은 동결했고 통합본에만 말투·조건·15→16 분기 2행·UI ID 보정을 적용했다. 차이는 `honro-act2-v4-draft-migration-map.json`에 보관했다.

## 현재 유효 목표와 최소 연결

| 장 | 실제 현재 유효 목표 | v4 최소 변경 및 연결 |
|---|---|---|
| 11 | `resident` rescue → `trace` 자동 pacing-event | 주민 1인 구조는 v4 산길 사건에 없는 현재 전용 추가다. 새 판에서 NPC/붙은 혼과 구조 전제조건을 함께 퇴역시키고 남은 실 수습·접근 전투·종소리로 치환한다. 기존 `knot-west`, `hold-knots`, `clear-west`는 현재도 퇴역한 목표이므로 무심코 부활시키지 않는다. `lower-refuge`, `north-return` 등 지형과 선택 전투는 유지 가능하다. |
| 12 | `sign` → `route-exit` | 구조 그대로 유지. A=높은 작업굴, B=열린 내리막; 13장 실위치·분기 대사와 handoff를 일치시킨다. 담허가 실제 길표 근처에 없을 때 현재 `mageAbsentText` 처리를 무시하지 않는다. 새 대본이 담허의 손동작을 요구하면 실제 접근을 전제로 한다. |
| 13 | `resident` → `gate` → `exit` | 구조·석문·기존 고저차 유지. 석공의 실제 안전 이동만 추가한다. `resident-1`의 표시 이름을 석공으로 통일한다. 석문 안 빗장 접근은 실제 기존 동선 감사 후 매핑하며 벽 관통 조작 금지. |
| 14 | `family-upper` → `family-mid` → `family-lower` → `bridge` → `hold-refuge` 4라운드 → `clear-village` | 길찬 1명으로 축소. `resident-1` 상층 집이 우선 재사용 후보이며 나머지 주민과 유령·관련 목표·승패 보호 목록을 모두 제거/대체한다. `objective`를 피난 군중으로 남겨두지 않는다. `bridge`는 가까운 은신처로 가는 실제 길의 걸쇠로 유지 가능. 4라운드 홀드는 길찬 실이동·위협차단 완료로 변경한다. |
| 15 | `sluice` 선택 → `groove` 필수 → `route-exit` | 수문 선택/고지 선택 유지. `groove`는 긴 문서가 아니라 도르래·받침·물방울·두드림을 보는 단일 현장 확인으로 매핑한다. A=배수한 아래길, B=고지; 16장 분기 2행을 통합본에 추가했다. |
| 16 | `monk` → `witness` → `temple-escort` → `hall` → `record` | `resident-1` 살아 있는 제자, `objective` 노승 유지. 혼 분리→가까운 안전자리→짧은 사흘 증언으로 묶는다. 기존 `tm-shelter-veranda` 등 근처 기존 지형을 우선하고 기록방까지 긴 호송을 강제하지 않는다. `hall/record`·열쇠·자동 문서 확보와 old date reveal을 새 판에서 전부 제거한다. |
| 17 | `brace` → `hoist` → `repair` → `hold-hoist` 3라운드 → `clear-lift` → `notes` | 버팀목·들린 인양틀·축 자리 유지. 현재 석공/길찬 unit이 없으므로 실제 작업자 2명을 추가한다. 홀드를 부품 운반→축 장착→잠금→시험 하중의 상태 전환으로 교체. `notes` 종지기 일지 필수 획득은 삭제/작업 확인으로 대체. 현재 3라운드를 과거 문서의 5라운드로 잘못 되돌리지 않는다. |
| 18 | `silence` → (`hold-silence` 2라운드 ∥ `upper-chain` 파괴) → `bell-descent` +200 하강 → `leak` → `keeper` 비살상 | **문구만 교체 불가.** 새 v4 opt-in에서 구조 NPC·하강 제동·실구출·유헌 사망·부분 인양·재안착 상태를 저작한다. 기존 고정구는 파괴형이므로 ‘다시 잠근다’ 대사만 덧대면 고장난다. 재사용할 마커/에셋과 새 상태 ID를 분리한다. 보스 HP880 등 기존 기초 수치는 임의 변경 없이 전투 테스트 우선. |
| 19 | `route` → 세 `separate/send` 자유 순서 → `old-soul` | 적/증원0, chapter-local 역할 전환 유지. 분리 뒤 보내기는 같은 장면의 자동 후속으로 합쳐 반복 클릭을 줄이는 안이다. 세 만남은 순서 자유를 보존할 수 있다. 옛 혼을 아직 못 보낸다는 현재 분기를 새 판에 남기지 않는다. 운반 흔적 확인으로 끝낸다. |
| 20 | `escort` → `escort-mid` → `hold-convoy` 4라운드 → `clear-pass` 전멸 → `escape` | 실제 호송 유지. 휴식 4라운드를 실제 전원 집결·부상자 부축·접근선 차단 성과로 대체. `clear-pass`는 전체 맵 잔적이 아닌 최종 호송로 위협만 필수. 외부 도착 뒤 70년 이상 단절/현재 읍성 재난. 초기 runtime에는 주민 행렬 `objective` 하나가 확인되므로 campaign의 `convoy-mason/gilchan` 존재를 ‘현재 둘이 실제 이동 중’의 증거로 삼지 않는다. 새 역할별 표시/개별 위험 정책은 runtime에서 검증한다. |

## 핵심 엔진 계약

- 새 18장에서만 `honroNonlethal` 제거 또는 `deathRequired`를 opt-in한다. 현재 `core.hurt`/낙사 HP1 유지, `Act2.subdue` side2 전환, `keeperRitual` HP<=1 정지·포즈·음향을 한 묶음으로 변경해야 한다. 기존 `defeat`가 subdued도 성공으로 보는 조건을 그대로 두지 않는다.
- `keeper_dead`, `rescued18`, `brake_locked`, `bell_gap_open`, `bell_reseated`, `bell_stable`은 독립적으로 저장한다. 한방/먼 사격/환경사망에도 보스 사망은 한 번만 정산하고 제동·구출·안정화는 계속한다. 보스가 죽은 뒤 그가 마저 조작해야만 진행되는 잠금이 없어야 한다.
- 기존 하강 swept geometry/safe boundary/actor opportunity를 부분 인양·최소 수평 이동·재안착 각 구간으로 확장한다. renderer·collision·예상 궤적·발사체·진목·소환체 점유가 같은 상태를 본다. 아래에 사람이 있으면 플레이어 조작은 차단/경고하고, 유헌의 고의적 하강은 별도 예고·구출 가능한 위협으로 처리한다.
- 11~18 기존 맵 초기 적은 43/38/23/43/22/49/50/10체이고 동시 활성은 5 또는 4체다. 초안 6~9체는 핵심 조우 수량이지 전체 지도 적을 그 수로 일괄 삭제하라는 뜻이 아니다. 기존 여러 wave source와 새 증원을 더해 새 총원으로 해석하지 않는다.
- 19장 설오·휘겸은 NPC, 길을 연 담허도 NPC가 되는 기존 역할을 지킨다. 정규 파티/성장/장착에서 지우지 않는다. 20장 시작에서 정상 조작 역할을 복구한다.

## 부모 addendum 검수에 필요한 대사 표면

### 1 진입과 경로

`arrivals[11..20]` 10행을 전부 대조한다. 현재 실제 rowId는 아래 보조 JSON `missing_surface_rows`에도 들어 있다.

- `arrival.11:8525bea78b`: 하부 피난처 사람을 예고하는 구대사. 새 11장에서 제거한 민간인을 다시 언급하지 않는다.
- `arrival.12:351e7eb34b`: 이미 세 번째 같은 길을 지났다는 말. 새 본편은 같은 구도 두 번이므로 첫 루프 전에 이 arrival을 틀면 선행 지식 오류다.
- `arrival.13:49a67bc38c`: 석공을 ‘노인’, 밧줄을 ‘멎은 승강기’로 묘사. 본편의 피 묻은 밧줄/석공 위치와 실제 장치에 맞춰 검토한다.
- `arrival.14:413ce3ec0d`: 아래층에서 누군가 이름을 반복해 부르는 소리. 새 14장은 길찬이 집 안에서 먼저 말하기 전 사람 목소리가 없어야 한다.
- `arrival.15:4b47c1703b`: 물 위 조각의 왕복 움직임. 고정된 작은 편향과 무작위 역류를 혼동하지 않게 수정한다.
- `arrival.16:281aab977a`: 제자가 손바닥 이름과 다른 이름을 말하는 추가 상황은 원본에 없다. 유지 필요성보다 단순 노승/제자 구조 장면을 우선한다.
- `arrival.17:8b984ce771`: ‘승려가 알려준’ 작업굴은 노승 필수 증언으로 연결한다.
- `arrival.18:6d28e4f7e8`: 검은 줄/청동판 셋을 새 유헌 장치·진목 설계와 일치시킨다. 원본에 없는 봉음판 설정을 대사만으로 고정하지 않는다.
- `arrival.19:511bad7dcc`: 형/동생·언니/동생 사연을 확정하는 옛 서술. v4 초안은 익명 주민 2명과 물건만 두며 새 개인사 발명은 하지 않았다. 부모가 유지할 기존 사연이 있다면 별도 승인 원문 근거를 확인한다.
- `arrival.20:fcf02b688d`: 구조상 대체로 호환되나 유헌 생존·남은 옛 혼을 덧붙이지 않는다.
- `routes[13].variants[A/B].lines`는 실제 `routeEntry.13.A:v2-fdbd42d857`, `routeEntry.13.B:v2-669d43948f`. 새 `A2.S13.BRANCH.01/02`에 대응한다.
- `routes[16].variants[A/B].lines`는 `routeEntry.16.A:v2-9b901e141b`, `routeEntry.16.B:v2-78a3b2c9f5`. 새 `A2.S16.BRANCH.01/02`에 대응한다. 기존 ‘스님, 손 놓지 마십시오’와 새 혼 분리 지시가 같은 순간 충돌하지 않게 한다.

### 2 쉼터와 막 종료

`optional[11..20][archer/mage/knight/occultist]`의 40개 대화 묶음, 56개 기존 행을 전부 검토한다. 추가로 `restEndings[20].required` 1행과 `.optional` 4행, `actEndings[20].lines` 4문단이 있다. 본편을 고쳐도 이 표면은 남는다.

우선 제거/재작성할 충돌은 다음과 같다.

- `rest.11.knight:d3c35a7e15`: 문밖 마지막 피난처 주민 확인을 계속 지시한다.
- `rest.13.occultist:33bd6d01f4`: 석문 너머 복수의 명료한 구조 요청·경고 목소리를 선공개한다. 동굴 적막·14장 첫 길찬 목소리와 충돌한다.
- `rest.14.knight:2bc3d8360f`: 석공이 ‘기다리지 말고 먼저 피하라’고 했다는 기존 소식. 새 13장에서는 안전자리에서 기다린다고 했으므로 그대로 남기면 상충한다.
- `rest.15.archer:2ae24966eb`, `rest.15.occultist:cc068335a3`: 등잔집의 여러 주민·두 명의 손목 줄을 이미 구조한 것으로 회상한다. 새 14장은 길찬 1명이다.
- `rest.16.knight:0f0296d337`: 기록에서 날짜 확인을 목표로 삼는다. 새 16장에는 기록방 퀘스트가 없다.
- `rest.17.mage:35aa20a132`: 70년 전 기록을 이미 읽고 자기 법맥까지 연결한다. 20장 이전 시간차 공개를 삭제한다.
- `rest.17.archer:4748daa32e`: 16장 증언 뒤에도 인양틀 고장 때문에 못 구했는지 의심한다. 노승의 명확한 축 제거 증언을 잊은 듯 말하지 않게 한다.
- `rest.19.knight:765413dd1a`: 유헌을 기둥에 묶어 두었다고 말한다. 새 18장 사망과 정면 충돌한다.
- `rest.20.archer:4ed4d9d07a`, `:cb6ab84c79`, `rest.20.mage:b254a72118`: 옛 혼이 아직 종 밑에 있고 천도할 수 없다는 옛 분기다. v4 천도 뒤 두드림 종료와 분리한다.
- `actEndings.20.lines[1]`: ‘칠십 년’ 고정 수치 대신 ‘칠십 해 이상’의 단절을 반영한다.
- `actEndings.20.lines[2]`: 종의 옛 혼이 여전히 못 떠났다는 설명을 새 판에서 제거한다.
- `actEndings.20.lines[3]`: 읍성행을 옛 장부 찾기만으로 동기화한다. 현재 성문 들림·수로 실종을 먼저 다뤄야 한다.
- 나머지 쉼터 행도 설오 반말·담허 지나친 해설·길찬/석공 실제 생존 여부를 확인한다. 이미 승인된 공통 기예 설명 자체를 지워서 기능 가이드를 잃지 않는다.

### 3 실패와 서술

`stages[11..20].failure`는 전부 `{n}.failure:ca5dbe766e` 한 행의 휘겸 대사다. 휘겸이 죽거나 전멸했을 때도 그가 말하는 현재 무가드 사용을 그대로 새 장에 복사하면 안 된다. 통합 초안은 이유별 실패 UI를 분리했다. 휘겸 생존·출연 때만 짧은 퇴각 발화를 허용하고, 부재 시 UI만 내는 정책이 가장 작다. 19장에는 전투 실패 대사를 붙이지 않는다.

`stages[n].narration/storySummary/goal/guide/outro`, `conditionalSummaries`, `places[n].restDescription`, `endingPlace`도 본편 대사와 별도다. `storySummary`가 유헌 생존, 멈춘 시간, 기록방 열쇠, 미천도 옛 혼을 기록하지 않도록 한다.

### 4 반드시 보존할 공통 관측

- 공통 첫 혼령: `scenes['firstSpirit.observation.current']` 4행, `values['firstSpirit.reply.manifest|lamp|neither']`, 동적 `first-spirit.reply`/`first-spirit.guide`. 최신 승인 문구/기예 안내는 부모가 보존한다. 소단 recruited+alive, 최초 관측, 실제 적 혼령 거리·O08/등불/가용 혼기예·기력·쿨다운 조건을 유지한다.
- 새 장의 혼 소개가 먼저 나와도 이 공통 이벤트를 중복 설명·잘못된 기예 약속으로 만들지 않는다. 역할 대사는 UI 사용법을 읊지 않는다.
- 기존 `scenes['bellAnomaly.lines']` 6행은 실제 ‘화살 소실’ 목격 사건이다. v4의 고정 작은 편향과 동일 사건으로 자동 치환하지 않는다. 부모가 유지/퇴역을 정하면 `requiresBellWitness`, `conditionalSummaries['18.requiresBellWitness']`, `values['bellAnomaly.settledLastLine']`를 함께 맞춘다.
- 기존 음고 대사 `18.beats.pitch-first:sodan/damheo`, `18.beats.pitch-tighten:keeper/sodan`은 실제 audible rise·안전 발화·보스 생존 조건이다. 새 유헌 사망 뒤 pending을 반드시 비운다.

### 5 동적 목표와 팝업

아래는 추출 위치이며 실제 rowId가 아니다. `shared/runtime/*` 원문에서 발동 가드를 확인해 새 opt-in에서만 교체한다.

| 파일/핵심 위치 | 구문 위험 |
|---|---|
| `stage11-quest-simplification.js:10,32`, `stage11-trace-exit.js:31` | 주민 구조/자동 북쪽 단서가 새 11장 목표를 다시 덮는다. |
| `stage11-ravine-encounters.js:148,156,185,206,217~244` | 퇴역 매듭/홀드 경고와 실제 현재 구조 안내가 섞여 있다. 소스 행을 모두 현재 활성으로 오인하지 말고 old opt-in과 새 판을 분리한다. |
| `stage12-quarry.js:31,71` | `mageAbsentText`, ‘담허가’라는 문구 검사로 연출 actor를 고른다. 원고만 바꾸면 장면 움직임이 빠질 수 있다. |
| `stage14-vertical.js:47~54,96` | 피난 군중/4턴/다리 안의 적/진입 대기 문구. 길찬 실제 호송 조건으로 재작성한다. |
| `stage16-temple.js:43~48,135~136` | 2승려 호송 뒤 기록방·열쇠를 계속 요구한다. 새 증언 목표와 출구를 소유하는 author가 필요하다. |
| `stage17-worksite.js:13`, `act2-pacing.js:17` | 작업 단계가 아닌 hold source·일지 자동 획득에 묶인 완료/증원 경고를 분리한다. |
| `stage18-bell.js:38,48~60,97~98`, `stage18-short-quest.js:20` | 200 하강 전용 안전 문구/2턴 억제/고정구 파괴 안내. 새 제동·부분 인양·재안착 상태별 HUD가 필요하다. 구문 안 과거 4라운드를 current 2라운드로 착각하지 않는다. |
| `keeperRitual.ts:29,35,41,53` | 봉음 연결 회복/반사/바닥 결박의 명칭과 실제 상태. 보스 사망 후 남은 cast·zone·반사탄 정리와 함께 확인한다. |
| `stage19-farewell.js:12~14` | 형제·자매·이름 없는 혼/옛 혼 이름을 코드가 직접 actor로 만든다. 새 중립 주민/천도 계약을 쓰면 이름·actor·metadata도 함께 맞춘다. |
| `act2.js`, `objective-guidance.js`, `evidence-quests.js` | completeStep의 자동 beat/완료 narration, 직업 필수·구조 가능 조건, 옛 기록 자동 획득이 새 목표와 맞는지 대조한다. |

## 저장과 대사 커서

새 대본은 기존 rowId를 무작정 바꾸는 교체물이 아니다. 새 의미의 목표·장면에는 판본 분리 namespace를 쓰고 구 스냅샷과 혼합하지 않는다. 변경 14/16/17/18 목표는 같은 장 안전 시작으로 이관하는 현재 경로가 우선이다. 기존 XP/SP/기예/장착/완료 보상/클리어/사망/설정은 보존하며 global revision으로 전 장을 초기화하지 않는다.

`honroJourney.story`는 본문 없이 index/id/kind/stage만 저장하고 `honroActEnding`도 stage/index만 저장한다. 행수 변경 후 예전 index를 새 본문에 그대로 적용하면 문답의 중간을 잘못 시작한다. 변경된 쉼터·20장 엔딩 커서만 revision+rowId로 이관하거나 안전한 장면 처음으로 재정렬한다. 전체 seen/talked 삭제는 금지한다. 1막 엔딩10은 건드리지 않는다.

이전판18 클리어의 ‘제압’ 기록은 유헌 사망 목격 증거가 아니다. 과거 플레이 기록을 새 범행/사망 목격으로 덮지 말고, 이전판 완료자의 이후 연결 대사는 부모가 별도 판본 분기로 확정한다.

## 통합본 자체 점검

- 10장 모두 진입/퇴장 지식, 지형 역할, 인원/배치, 유한 증원, 행동 트리거, 실패/재시도/완료, 최소 연출/음향, 조건부 대사, UI를 포함한다.
- 대사 200행, UI 65행의 총 265 ID가 중복 없이 JSON 파싱된다.
- 16장 필수 증언 8행에 스무 명·첫날 물 요청·사흘·석공 인양 가능·유헌의 고의가 포함된다.
- 18장 사망/구출/종 상태 독립, 한방·환경사망·사망 후 음성 차단, 19장 적0, 20장 외부 도착 뒤 시간차가 명시돼 있다.
- 검사한 것은 내용·구조·출처 대조다. 실제 맵 이동/사격/세이브/배포 검증 및 Gemini 최종 검수는 아직 수행하지 않았다.
