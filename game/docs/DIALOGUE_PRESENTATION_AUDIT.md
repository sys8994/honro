# 대화·자동소멸 메시지 표현 계약

2026-10-13. 원문과 사건/전투 소유권은 변경하지 않고 표시/전달 경로만 구분한다.

## 활성 원본과 조사 범위

- 공통 번들 목록은 `shared/build.mjs`. Game·Stage View·Playtest 모두 같은 Story를 사용한다.
- 현재 1막 `story-content.js`, 2막 `act2-content.js` → `act2-drama.js`, 3막 `act3-content.js`, 현재 목표 변형 `objective-revision.js`/`narrative-revision.js`.
- 쉼터 `journey-content.js`의 required/interlude/optional, `rest-journey.js`의 arrival 설명. 문서는 `kind:document`, 조작은 `kind:guide`.
- 지도 사건은 최종 저작된 `HONRO_PROJECT.stages[].events/ interactions/ objectives`, 런타임 주입은 `story-content`의 interaction/cooperation/cooperationDefense/finaleMidpoint와 `say/sayLines/Story.queue` 경로.
- `content.js`, `story-content-v0.js`, `shared/data/narrative-legacy-v0.json`, migration/legacy의 초기·역사 데이터는 현재 덮어쓰기 순서 및 구 저장 호환 경로와 구분한다. 옛 저장의 튜플·페이지·큐는 수정하지 않는다. 구 대본에만 남은 월이·칠복은 legacyOnly registry로 구분하고 초상을 만들지 않는다.
- 재현 가능한 `tests/dialogue-source-inventory.mjs`는 최종 30장 대본/결말/목표 beats/서술, 쉼터 필수·선택, 지도 사건과 공개 주입 API를 열거한다. 현재 717개 튜플 발생 위치, 23개 화자 라벨을 검사한다. 중복 출처를 포함하는 저작 위치 수이며 고유 문장 수나 30장 정상 플레이 횟수가 아니다. 함수 안의 조건부 실행/구 저장은 별도 회귀로 확인한다. 추가 AST 조사는 모든 runtime 파일의 화자형 튜플 후보를 열거해 조건부 주입/역사 대본/비대화 레이블을 따로 기록하며 미검토 새 화자를 검사 실패로 만든다.

## 화자와 초상

`meta.kind`의 narration/document/guide를 이름보다 먼저 해석한다. 호환 화자 서술·길 위의 기록·기록·안내도 명시 분류한다. 본문에서 이름을 추측하거나 3인칭 문장을 인물 대사로 바꾸지 않는다.

- 서술: 기존 게임 화면 위 `길 위의 기록` 텍스트 전용 대화. 초상 DOM/인장/빈 열/전체화면 장식 삽화가 없다.
- 문서/안내: 전용 초상 없는 레이아웃 유지. 문서 제목이 없는 구 기록도 빈 제목 대신 `발견한 기록`을 쓴다.
- 인물: 실제 명시 배우 → 등록 이미지/역할 벡터 → 이름과 본문만. class만으로 다른 동행이나 임의 민간인 얼굴을 만들지 않는다. 알 수 없는 인물을 누락하거나 서술로 둔갑시키지 않는다.
- 네 동행과 기존 8 NPC의 명시 벡터는 보존한다. `game/config/story-portraits.json`은 인물 registry이며 새 활성 화자가 빠지면 inventory 검사가 실패한다.
- 전용 초상 미제작 12명: 덕수, 주민, 석공, 길찬, 중층 주민, 노승, 승려, 종지기, 동생을 잃은 형, 언니를 잃은 동생, 수비병 악귀, 짐꾼. 해당 장의 정확한 이름 또는 이미 저작된 배우 매핑이 있으면 그 배우를 그린다. 없는 장면/쉼터/구 저장에서는 정확한 이름만 표시한다. 새 외모는 만들지 않았다.

## 빠르게 지나가던 경로와 처리

1. `App.event`: 기존 2.3초 후 소멸 및 다음 이벤트가 덮어쓰기. 현행 52개 호출지 중 24곳은 명시 수동 서술을 포함하고 28곳은 전술 알림. 조건부 두 곳(주박 진행/완료, 왕문 진행/완료)은 완료만 서술이고 진행은 전술이다. 호출지 수이지 고유 메시지 수가 아니다.
2. 서사 전달: 길·배수·종/화물/배 정착·발견·구출·상여 인계·상호작용·목표완료는 `event(text,{kind:'narration',source})`로 행동 경계 큐에 넣는다. 이미 동일 사건의 정식 대사가 있으면 중복 요약 toast를 제거한다. 발견 원문을 요약하거나 새 사건을 만들지 않는다.
3. 전술 경고: 증원/실시간 지형 이동/일시 효과/진행/짧은 구역명은 전투를 멈추지 않는 지속 `전장 알림`이다. 시각만으로 사라지지 않고 확인 버튼으로 순서대로 읽는다. 여러 개는 큐에 보존하며 같은 대기 문장만 중복 제거한다. 발생 턴을 표시해 지난 경고임을 구분한다. 저장/Continue도 대기 목록을 유지한다. 알림 확인 자체는 대응 행동으로 세지 않는다.
4. `say/sayLines` 12호출지는 이미 수동 인물대화 큐로 통합되어 있다. 옛 storyBanter/banterLine도 restoreQueuedSpeech가 복구한다. App의 nextBanter/drawBanter는 비활성 호환 껍데기다.
5. `notify` 15호출지는 설정/저장/읽기실패·조작거절·오류의 운영 알림이며 기존 3.2초 표시를 유지한다. 서사 발견을 이 경로로 보내지 않는다.
6. `Engine.message` 호출은 전투 이벤트 로그/기술 피드백 경로이며 App.event와 다르다. 종지기 제압/장치파괴 등은 기존 목표 대사와도 연결된다. 붕괴 후 복구 요구 한 곳은 수동 서술로 옮겼다. 엔진 일반 스킬·회복·선택실패를 모달로 바꾸지 않았다.
7. 팀 턴 배너는 기존 짧은 상태 전환 표시를 유지한다. 피해 숫자/효과 문자는 전투 피드백으로 유지한다.

## 저장·순서·경계

- 서술은 기존 storyQueue의 actorTurnSerial/waitActor/waitRound를 사용한다. 연격·비행 중 즉시 모달을 열지 않는다.
- 한 번에 여러 사건은 발생 순서를 유지하고 같은 source+문장의 대기 중복만 제거한다. 다음/이전/넘기기는 기존 Story 규칙을 사용한다.
- 승리 직전 읽지 못한 발견은 결말 앞으로 회수한다. 패배는 원래 결과/재시도 흐름을 유지하며 죽은 인물의 새 발화는 만들지 않는다.
- 현재 대화 중 들어온 사건은 그 묶음이 끝난 뒤 읽는다. 서술/기록은 인물 생존 조건으로 지워지지 않는다.
- 새 필드는 honroState 안에 추가하며 이전 저장의 필수 필드나 revision을 바꾸지 않는다. 사용자 원본 저장 파일은 변경하지 않는다.

## 검증 구분

- `test:dialogue-presentation`: 초상/서술 DOM 7항목, 전체 출처 registry coverage, 큐/중복/Continue/수동 진행/전술 확인/대화 중 사건/승리회수 7묶음.
- 기존 dialogue-controls-audio: 이전·다음·넘기기·재방문 cue 및 오디오 6묶음.
- Native Canvas portrait identity: 실제 렌더러 배우/8 NPC/네 동행 보존. DOM 대역과 Native 검사는 실제 브라우저/실제 휴대폰 증거가 아니다.
- 최종 합본 Game·Workshop 실제 브라우저 반응형 화면, 최종 master/Pages는 통합 담당이 별도 검수한다. 정상 30장 연속 인간 플레이로 주장하지 않는다.
