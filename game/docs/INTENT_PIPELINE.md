# HONRO 의도 → 사용자 선택 → 제작 파이프라인

## 사용자의 역할

사용자는 중요한 기획·공간·그래픽 방향을 화면이 붙은 서로 다른 선택지에서 고른다. 에이전트는 이미 알려진 의도와 제한을 정리하고, 중복되지 않는 후보를 제작하고, 선택한 안을 구현·검사·수정한다. 선택하지 않은 안을 시간 경과나 추천 순위로 자동 채택하지 않는다. `셋 다 다시`도 정상 경로다.

전체 막 실행은 11–20장의 콘셉트·공간·그래픽 선택을 다룬다. 범위와 창작 전제는 실행마다 명시하며, 취소된 실행이나 오래된 revision의 버튼은 선택을 기록할 수 없다.

`npm run pipeline -- init-act --run act2-concepts`는 `act2.concept → act2.layouts → act2.art-direction`의 상위 의사결정 그래프를 만든다. 전체 막의 상세한 콘셉트 보드부터 비교하며, 이 시점에는 어느 장의 지형도 생성·적용하지 않는다. 아래의 18장 adapter 설명은 제한된 기술 시연의 이력이며 현재 사용자 범위를 대신하지 않는다.

## 구현된 것

- `tools/intent-pipeline/state.mjs`: 버전 있는 의도·가정, 선택지, 사용자 근거, 의존 관계, 기술·플레이·미술 게이트, 재개 상태, 원자적 파일 저장, 동시 기록 방지
- `tools/intent-pipeline/plans/`: 서로 다른 18장 공간 계획 A/B/C. 각 계획은 편집 가능한 JSON 데이터이며, 방의 역할·연결·지형·목표·종 위치를 포함한다.
- `runtime.mjs`: 공간 계획을 기존 `HonroMaps` canonical 프로젝트로 변환한다. 별도 지형 렌더러·이동·물리 루프를 만들지 않는다. 실제 `HonroScene`을 설치된 native Canvas로 실행한다.
- `validate.mjs`: 스키마, 이야기·목표·적 구성 보존, 실제 이동·점프, 활 표적 충돌, 저장 roundtrip, 종 여유 공간을 검사한다.
- `cli.mjs`: 후보 생성 → 실제 렌더 → 선택 대기 → 승인된 구조 컴파일 → 검사·렌더 → 다음 그래픽 선택 대기. 기존 캠페인·HTML에 적용하거나 업로드하는 명령은 없다.

런타임·물리 검사 자체가 미술 합격이나 재미를 보장하지 않는다. 에이전트의 자기평가 점수로 미술 승인을 만들 수 없다.


## 선택에 붙은 필수 수정 조건

예를 들어 사용자가 `A`를 고르면서 더 어둡고 음침하고 무섭게 만들라고 한 경우, 지형 선택은 유지하고 그 조건을 선택 기록과 의도에 함께 남긴다. `require-refinement`는 `act2.concept → act2.tone → act2.layouts → act2.art-direction`처럼 수정 검수 게이트를 끼운다. 기존 밝은 A 이미지는 최종 미술 승인이 아니다.

`act2.tone`은 visual-review다. 선택한 방향만 수정한 시안 한 개를 해시와 함께 제안하며, 네이티브 UI는 승인 또는 다시 조정으로 연결한다. 승인에는 단일 option ID를 `decide`로 기록하고, 다시 조정에는 `reject`를 쓴다. 거절해도 이미 선택한 지형 A는 유지된다. 톤 검수 승인 전 장별 레이아웃으로 넘어갈 수 없다. 첫 수정 시안은 tone revision 2이며, 이 승인도 최종 제작물의 미술/기술/플레이 승인을 대신하지 않는다.

## 전체 막의 콘셉트 제안

```sh
npm run pipeline -- init-act --run act2-concepts
npm run pipeline -- propose --run act2-concepts --packet _local/act2-concept-question.json
npm run pipeline -- status --run act2-concepts
```

질문 파일은 `decisionId: "act2.concept"`, 질문 문장, 서로 다른 2–3개 options와 해시가 붙은 concept-board evidence를 담는다. 첫 제안이 채워지면 결정 revision은 2가 된다. 상위 개념 선택 전 하위 레이아웃·그래픽 제안은 거절된다. `resume`은 act 범위를 기존 Stage 18 adapter에 보내지 않는다. 콘셉트를 선택해도 다음 단계의 후보 준비만 허용하며 제작 적용은 별도 승인을 기다린다.

같은 범위에서 창작 전제가 교정되면 `revise-intent --packet ... --evidence ...`로 의도와 사용자 근거를 기록하고 이전 선택지를 모두 무효화한다.

범위가 폐기되면 `cancel --run ... --evidence ... --reason ... --superseded-by ...`로 실행을 닫는다. 취소된 실행의 질문은 null이며 예전 revision과 현재 revision 모두 선택 기록을 거절한다.

## 제한된 Stage 18 adapter의 시작과 재개

```sh
npm run pipeline -- init --run stage18-first
npm run pipeline -- status --run stage18-first
npm run pipeline -- resume --run stage18-first
```

`init`은 `_local/reports/intent-pipeline/runs/stage18-first/`에 원본 계획, 후보 프로젝트, 렌더 이미지, 검사 기록, `run.json`, `question.json`, `status.json`을 남긴다. 동명의 실행이 있으면 덮어쓰지 않는다. `resume`은 선택이 없으면 종료 코드 2로 멈춘다.

상위 대화 에이전트가 `question.json`을 실제 네이티브 선택 UI에 연결하고, 이미지는 별도 네이티브 첨부로 전달한다. 이 코드에는 가짜 웹 버튼·콜백, 모델 API, API 키 또는 자동 추론 서비스가 없다. 의도 해석, 새로운 후보 설계, 실제 사용자 답변의 진위 확인은 현재 상위 에이전트가 담당한다. 실행기는 검증된 답변의 출처를 기록하는 신뢰된 어댑터다. 문자열 `actor:user`만으로 사용자 인증을 증명할 수는 없다.

실제 답변을 확인한 뒤에만 다음을 실행한다. 아래 근거 ID는 예시이며 실제 사용자 메시지 또는 네이티브 응답의 ID로 바꿔야 한다.

```sh
npm run pipeline -- decide --run stage18-first --decision stage18.layout --revision 1 --option B --evidence VERIFIED_USER_MESSAGE_ID
npm run pipeline -- resume --run stage18-first
```

세 안 모두 거절한 경우:

```sh
npm run pipeline -- reject --run stage18-first --decision stage18.layout --revision 1 --evidence VERIFIED_USER_MESSAGE_ID --feedback "사용자의 구체적 수정 이유"
```

이 경로는 선택지를 비우고 재생성을 요청한다. 기존 후보를 조용히 선택하지 않는다. 새 후보는 해시가 있는 렌더·계획과 함께 `propose --packet <저장소 내부 JSON>`으로 제안한다. 의사결정 revision이 달라지므로 옛 버튼 응답은 거절된다.

## 상태와 별도 게이트

1. `awaiting_layout_decision`: 실제 사용자 공간 선택 대기
2. `ready_to_compile`: 승인된 계획을 후보 전용 출력에 컴파일
3. `technical_blocked`: 기술 실패 또는 필수 증거 누락
4. `awaiting_art_direction`: 선택한 구조에 대한 별도의 그래픽 옵션 제작·사용자 선택 대기
5. `awaiting_live_play`: 실제 Game/Workshop 브라우저 입력·저장·성능·정상 플레이 검증 대기
6. `awaiting_artistic_approval`: 현재 실제 렌더에 대한 사용자 최종 검수 대기
7. `ready_for_local_delivery`: 모두 충족한 로컬 결과. 공개 배포 권한은 여전히 없음

공간 선택 후 기존 회색/먹빛 임시 외형을 그래픽 선택으로 대신하지 않는다. 그래픽 후보는 `projectPath`와 `projectHash`에 실제 구현된 canonical 프로젝트를 연결할 수 있다. 재개 시 해당 프로젝트의 치수·앵커·전체 초기 상태·이벤트·encounter·지형·경로·유닛·표식·목표·다른 스테이지와 프로젝트 설정을 보존했는지 검사하고 실제 렌더를 만든다. 기존 자산의 충돌·소켓·앵커 계약과 컴파일된 실제 충돌/물성도 비교한다. 다른 장에서도 쓰는 자산은 바꾸지 않고, 18장 전용 ID로 복제해 시각 변형을 연결한다. 구현 프로젝트가 없으면 멈춘다. 지형까지 바꾸려면 공간 선택 단계로 돌아가야 한다.

`record-technical`, `record-play`는 별도로 수집한 증거를 가져오는 어댑터다. 결과 파일 해시를 확인한다. `record-play`의 통과에는 `browser-live-play` 증거가 필요하며 Node 물리 fixture를 대체 증거로 허용하지 않는다. `approve-art`는 현재 `basis`와 검증된 사용자 근거가 있어야 한다. `deliver`는 선택된 그래픽의 실제 projectPath/projectHash, 이에 연결된 compiled-map, technical-report, render 파일 및 모든 게이트를 검사한 뒤 로컬 manifest만 쓴다. 기술 결과 수동 반입도 이 산출물 조건을 우회하지 못한다. 업로드·배포·병합을 수행하지 않는다.

## 변경과 무효화

- 선택지 내용·이미지가 바뀌면 해당 결정의 revision을 올리고 다시 묻는다.
- 상위 공간 선택이 바뀌면 그래픽 선택지·선택·기술 검사·플레이·미술 승인·산출물 연결을 무효화한다.
- 소스/계획/증거 바이트가 달라지면 이전 승인을 재사용하지 않는다. 지문에는 balance 설정, 빌더·forge .mjs, 기준·참조 이미지, 실제 TypeScript 컴파일러 및 모든 공유 자산을 포함한다. 빌더 실행 전후 지문과 정확한 runtime bundle hash를 비교해 빌더가 증거 뒤에서 출력을 바꾸면 멈춘다.
- 컴파일할 때마다 compilation revision과 artifact hash를 `basis`에 반영한다. 이전 렌더에 대한 늦은 플레이/미술 callback은 새 결과를 승인할 수 없다.
- 파일 잠금과 revision 비교 후 원자적 rename으로 저장한다. 동일 revision의 다른 내용을 덮어쓸 수 없다. 잠금 파일이 남아 있다면 실행 프로세스가 종료됐는지 사람이 확인한 뒤 복구한다. 자동으로 다른 작성자의 잠금을 삭제하지 않는다.

## 후보와 검증의 정확한 의미

- A: 깊은 수갱 바닥으로 내려갔다 우측으로 올라가는 큰 U자 경로
- B: 넓은 공동과 하나의 짧은 사격 경사. 경사는 바닥 고체와 합쳐 매몰 표면 이음을 피한다.
- C: 석교와 아래길. 왼쪽 어깨에서 기존 점프를 하면 위, 그대로 걸으면 아래로 간다. 4인 모두 위/아래 경로 왕복을 실제 Engine에서 확인한다. NPC/적 AI가 같은 선택을 잘한다는 검증은 별개다.

이동 fixture는 적을 제외하고 이동력을 보충한다. 실제 이동·점프·접촉 solver를 쓰지만 정상 전투 완료나 행동 경제를 검증하지 않는다. 활 표적은 위치를 지정한 fixture에서 실제 발사·충돌·지형 피해로 확인한다. 종은 충돌 물체가 아니며 신체와 지면·천장의 겹침만 검사한다. 렌더는 실제 공통 Canvas 렌더러 결과지만 브라우저 스크린샷이 아니다. HUD·터치·브라우저 성능은 포함하지 않는다. 전체보기는 구조 검사용 줌이며 실제 플레이 줌과 구분한다.

## 검사

```sh
npm run test:intent-pipeline
npm run build
npm --prefix game run typecheck
node tests/migration.mjs
```

`test:intent-pipeline`은 상태 전이·무효화·거절·재개·동시 기록을 검사한 뒤 별도 자동 테스트 실행에서 실제 후보 생성/컴파일/렌더/물리를 수행한다. 테스트용 승인 문자열은 테스트 디렉터리에서만 쓰고 종료 시 지운다. 실제 사용자의 실행에는 넣지 않는다. 캠페인과 두 HTML의 SHA256이 바뀌지 않았는지도 확인한다.

전체 `npm run verify`의 브라우저 부분은 허용된 브라우저 실행 경로에서 별도로 수행해야 한다. 접근 거부를 우회하지 않는다. 현재 실행에서 확인하지 못한 정상 전투·브라우저·성능 항목은 통과가 아니라 blocked로 남긴다. 기존 `act2-terrain`의 고정 switchback 전제는 활성 맵에 대한 과거 회귀이며 이 새 파이프라인의 창작 합격 기준으로 가져오지 않는다. 사용자가 새 구조를 승인해 실제 캠페인에 적용할 때 의도/행동 중심 회귀로 별도 정리해야 한다.

## 전달된 전체 계획의 실제 구현 승인

채팅 버튼으로 제시하지 않은 문서를 사용자가 명시적으로 승인한 경우 가짜 option 선택을 만들지 않는다. `approveDeliveredPlan`은 `act2.layouts.approval.type = delivered-plan`에 실제로 전달한 Markdown/JSON의 Library ID, 크기, SHA256과 사용자 승인 메시지를 기록한다. `selection`은 null, options는 빈 배열로 유지한다.

실제 승인 메시지와 비공개 전달 식별자는 로컬 실행 기록에서만 관리한다. 공개 문서와 검사 fixture에는 일반 예시 식별자를 사용한다. 계획 구현 승인, 현재 산출물의 미술 검수, 공개 업로드·병합·배포 권한은 각각 구분하며, 승인된 범위를 벗어나는 큰 변경에는 별도 결정을 받는다.

## 전체 막 canonical adapter

`act-adapter.mjs`와 `act-cli.mjs`는 기존 Stage 18 시안의 X 단조 경로/고정 좌표를 쓰지 않는다. 승인된 JSON의 전체 scope를 읽고 각 canonical stage의 `design.space`(방, 표면, 연결, 동선, sites, views)와 독립된 topologyId를 검사한다. 현재 실제 11–20장 전부를 기존 HonroMaps/Engine으로 컴파일한다.

```sh
node tools/intent-pipeline/act-cli.mjs inspect --run act2-concepts
node tools/intent-pipeline/act-cli.mjs build --run act2-concepts --skip-render
node tools/intent-pipeline/act-cli.mjs build --run act2-concepts --render-manifest _local/reports/act2-spatial/after/manifest.json
```

기본 build는 현재 canonical campaign을 읽는다. `--author`를 명시하면 전체 막 공간 recipe와 공통 SVG 자산 builder로 메모리 안에서 프로젝트를 생성한다. 둘 다 소스 campaign/HTML을 덮어쓰지 않고 `_local`에 프로젝트·장별 battle·검사·렌더 증거만 쓴다. 별도 캡처 manifest를 가져올 때는 전체 runtime bundle, canonical project, 모든 PNG 해시와 각 장의 전체/플레이/세로 coverage를 확인한다. 과거 캡처는 현재 코드나 데이터가 다르면 거절한다.

전체 막 실행은 일반 runtime/build/forge 입력뿐 아니라 recipe·map-forge·environment builder·pipeline 코드도 지문화한다. 구현 권한 안에서 코드를 바꾸면 새 executionSource를 기록하고 이전 기술·플레이·미술 검수 결과를 무효화한다. 승인된 개념/톤과 변경되지 않은 전달 계획은 유지한다. 실행 소스를 바꾸는 것이 최종 미술 승인으로 이어지지 않는다.

검사 결과는 컴파일·스키마·기존 목표/유닛 정의·다른 막과 공유 에셋 보존·18/19 같은 공간·새 전투 roundtrip·spawn support를 구분한다. 이동 완료, 정상 전투 완료, 기존 저장 복원, 브라우저/HUD/입력, 성능, 최종 미술은 별도 증거가 없으면 blocked다. `build` 종료 0은 이 어댑터 단계가 끝났다는 뜻이며 전체 제작 완료를 뜻하지 않는다.

## 실행·재개 가능한 검수 작업

`review-cli.mjs`는 기존 의도/선택 실행을 실제 구현·빌드·검사 명령과 연결한다. 별도 서버, 모델 API, 원격 callback, 브라우저 자동화나 자격 증명은 만들지 않는다. 영속 작업의 매니페스트·명령 로그·해시·검수 보고서는 `_local/reports/review-jobs/<job>/`에 남긴다. `npm run review-job -- help`가 전체 CLI다.

두 실행 범위는 명시적으로 다르다.

- `current-source`: 이미 저작된 현재 campaign/코드를 재빌드하고 검수한다. 새 콘셉트나 지형을 승인/생성하지 않는다. `--run`을 지정하면 기존 의도, 실제 선택한 콘셉트/톤, 전달 계획을 연결하고 그 파일의 해시를 확인한다. 과거 승인 계획의 범위 밖 변경을 승인한 것으로 취급하지 않는다.
- `act-canonical`: 기존 전체 막 실행의 구현 승인이 필요하다. 승인된 막 전체 scope를 유지하며 `act-cli.mjs build --run ... --skip-render`를 실제 실행한다. 이 canonical adapter는 기존 불변 baseline과 비교하며, 다른 막까지 바뀌었다면 실패한다. 검수를 통과시키기 위해 baseline을 새 소스로 바꾸지 않는다. 현재 adapter는 저작된 canonical 맵을 컴파일하며 새 공간을 자동 발명하거나 캠페인 소스를 덮어쓰지 않는다.

```sh
# 이미 승인한 의도와 연결해 현재 실제 구현을 검수한다.
npm run review-job -- init --job act2-current-review --mode current-source --run act2-concepts --stages 11,12,13,14,15,16,17,18,19,20
npm run review-job -- resume --job act2-current-review --through build
# 같은 target으로 외부 브라우저 관찰을 시작할 수 있다. 기술 검사는 아직 not-run이다.
npm run review-job -- resume --job act2-current-review
npm run review-job -- status --job act2-current-review

# 승인된 전체 막 계획의 canonical 구현 adapter까지 실행한다.
npm run review-job -- init --job act2-implementation-review --mode act-canonical --run act2-concepts --stages 11,12,13,14,15,16,17,18,19,20
npm run review-job -- resume --job act2-implementation-review

# 별도의 현재 소스 점검에는 범위와 검수 의도를 직접 명시할 수 있다.
npm run review-job -- init --job current-campaign-audit --stages 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20 --goal "현재 저작된 캠페인의 빌드·회귀·실제 플레이 증거를 연결해 검수"
```

기존 선택이 해결되지 않았으면 명령 실행 전에 멈춘다. `decision-request.json`은 현행 결정 ID/revision과 옵션을 전달하는 로컬 자료다. 실제 사용자 응답을 확인한 운영자가 기존 `pipeline`의 `propose`, `decide`, `reject` 명령으로 기록한 후 같은 job을 `resume`한다. 이 파일은 클릭 가능한 UI나 인증 callback이 아니다. `implementation-review` 역할의 마지막 실제 결과 검수는 구현을 막지 않지만 최종 미술 승인을 대체하지도 않는다.

### 실제 실행하는 고정 명령

`resume`은 계획 문서의 문자열을 셸로 실행하지 않는다. 코드에 정의한 실행 파일과 argv만 순서대로 실행한다.

1. `act-canonical`이면 기존 `act-cli.mjs build --skip-render`
2. `node workshop/build.mjs`: Game/Workshop 두 HTML을 같은 기존 빌더로 생성
3. 게임 TypeScript 검사, migration, 게임 회귀 묶음, 기존 intent-pipeline 검사, review-job 자체 검사, 전투 도움말 회귀
4. `npm run test:campaign-continuity`: production App lifecycle 기반의 진행/저장 상태 회귀. 정상 플레이 증거가 아니다.
5. scope에 해당하는 `test:act1:offline`, `test:act2:offline`; 2막에는 `tests/act2-art-fidelity.mjs`도 실행

각 명령의 시작·완료 상태와 시도별 로그가 즉시 저장된다. 성공한 명령은 입력·로그·산출물 해시가 같을 때만 재사용한다. 실패/누락 명령만 다음 `resume`에서 재시도한다. 명령이 없으면 `missing`, 실행 후 오류면 `failed`, 아직 실행하지 않았다면 `not-run`, 외부 증거나 선택을 기다리면 `blocked`다. 이 고정 오프라인 묶음은 전체 `npm run verify` 통과가 아니다. 브라우저 검사는 별도 승인된 경로에서 실행한다.

프로세스가 끊어지면 `running` 시도는 성공으로 승격하지 않는다. 동시 실행은 `.review.lock`으로 막는다. 비정상 종료로 잠금이 남았으면 `job.json`의 실행 중 명령에 기록된 PID/process group과 `.review.lock`의 CLI 프로세스가 모두 실제로 종료됐는지 확인한 뒤 사람이 잠금만 제거하고 재개한다. 다른 작성자의 잠금을 자동으로 지우지 않는다. 명령별 시간 제한은 15분이며, 초과는 실패다. Unix에서는 해당 명령의 전용 process group에 종료 신호를 보낸다. CLI 강제 종료까지 자동 복구하는 서비스는 없으며, 테스트의 합성 실행 중단은 실제 OS 프로세스 종료 검증을 대신하지 않는다.

### 소스·산출물·증거의 무효화

검수 지문에는 일반 pipeline 소스 외에 전체 검사 코드, 도구 코드, recipe, package script와 설치된 TypeScript 입력이 포함된다. 검사 코드 자체를 바꾸고 과거 성공 로그를 재사용할 수 없다. 빌더가 생성 자산을 갱신하면 새 소스로 모든 하위 검사를 다시 실행한다. 검사 도중 소스가 바뀌면 현재 증거를 실패 처리하고 안정된 소스에서 재개하게 한다.

브라우저 대상은 두 HTML과 외부 BGM의 바이트 해시를 묶는다. 다른 커밋이라도 실제 배포/열람한 바이트가 완전히 같다는 것을 확인한 관찰은 재사용 가능하다. 새 SVG, 맵, 렌더러, HUD 등으로 HTML이 달라지면 과거 공개 버전의 브라우저 결과는 거절한다. 파일명이나 성공 숫자만 같아서는 재사용할 수 없다. 실행 소스, 의도/선택, 로그, 결과물, 반입 보고서, 미술 검수 이미지 변경은 해당 기술/플레이/미술/전달 증거를 무효화한다.

### 실제 브라우저 관찰 반입

현재 job의 `browser-request.json`은 필요한 scope와 정확한 대상 해시를 출력한다. 이 template 자체는 관찰이 아니며 `observer`, `observedAt`, `evidence`, `coverage`가 비어 있어 반입할 수 없다.

승인된 실제 브라우저 운영자는 열어본 Game/Workshop과 외부 자산이 요청의 바이트와 같은지 먼저 확인한다. 관찰 보고서/스크린샷을 저장소 내부 `_local`에 저장하고 해시가 있는 `honro-browser-evidence/v1` packet을 만든다.

- `kind`: `browser-live-play`; `runType`: `real-browser`
- `observer`, `observedAt`: 실제 관찰자/시각. transcript나 비공개 대화 ID를 공개 파일에 복사하지 않는다.
- `provenance.targetDigest`, `provenance.artifacts`: 검증한 현재 요청의 전체 대상 해시
- `evidence`: 실제 파일의 `{kind, path, sha256}` 배열. `path`는 checkout 상대 경로이며 symlink/바깥 경로는 허용하지 않는다.
- `coverage`: `{surface, check, stageIds, status, detail, evidencePaths}` 배열. `surface`는 `game` 또는 `workshop`, `status`는 `passed`, `failed`, `blocked`, `not-run`이다. 관찰된 성공/실패는 해시 확인한 증거 파일을 연결한다.

필수 검수는 scope의 각 장 `game/normal-playthrough`, 여러 장이면 `game/campaign-continuity`, `game/controls`, `game/save-resume`, `game/mobile-portrait`, `game/mobile-landscape`, `workshop/stage-view`, `workshop/playtest`, `workshop/save-load`, 두 surface의 `performance`다. 장 입장·짧은 이동 같은 부분 관찰은 별도 `stage-entry` 등의 check로 보관하되 정상 완료 요구를 충족하지 않는다. `normal-playthrough` 성공은 해당 `stageIds`, `method: "normal-input"`, `completed: true`, `debug: false`, `modifications: []`를 모두 필요로 한다. 적 삭제·승리 주입·상태 fixture는 허용하지 않는다. `campaign-continuity` 성공은 `method: "normal-input"`, `singleProfile: true`, scope 순서와 같은 `completedStageIds`, `resetCount: 0`, `debug: false`, `modifications: []` 및 해시 확인한 `transitionEvidencePaths`/`saveEvidencePaths`를 요구한다. 장별로 독립 실행한 승리를 한 저장의 연속 여정으로 합치지 않는다. 모바일 두 방향은 실제 `viewport.width`/`height`, `inputMode: "touch-emulation"` 또는 `"real-device-touch"`, `controlsConfirmed: true`, `readabilityConfirmed: true`가 필요하다. 데스크톱 마우스 점검을 모바일로 간주하지 않으며 에뮬레이션과 실기기를 명확히 구분한다. 성능 성공에는 `isolated: true`와 실제 `measurements.frames`, `measurements.p95FrameMs`가 필요하다.

```sh
npm run review-job -- import-browser --job act2-current-review --packet _local/reports/browser/actual-coverage.json
npm run review-job -- status --job act2-current-review
```

Game만 실제 열어본 부분 관찰에는 `provenance.scope: "observed-surfaces"`를 명시하고 `targetDigest`를 생략하며 실제 확인한 `HONRO.html` 해시만 제공할 수 있다. 이 경우 Game 항목만 검수하며, 열지 않은 Workshop·외부 BGM을 검증했다고 주장하지 않는다. 현재 Game HTML이 바뀌면 이 부분 증거도 거절한다. 성능 성공에는 항상 전체 대상 해시가 필요하다. 좁은 창에서 마우스로 누른 점검은 `narrow-pointer-portrait` 같은 별도 check로 보관하며 실제 모바일 touch 요구를 충족하지 않는다.

반입 후에도 파일 해시를 다시 확인한다. 이미 반입한 packet/증거는 덮어쓰지 않고 새 이름으로 재검수 자료를 만든다. 과거 대상의 증거는 새 HTML에서 stale로 분리하지만, 반입된 파일 자체가 사라지거나 변조되면 원본을 복구하기 전 전달을 막는다. 실패를 수정한 재검수는 더 늦은 `observedAt`으로 같은 항목을 명시해서 반입하며 과거 실패 이력은 지우지 않는다. 같은 최신 시각에 성공/실패가 충돌하면 실패가 우선한다. 최소 요구 목록 밖에서 발견한 실제 실패도 전달을 막는다. 같은 항목/장에 대한 더 늦은 명시적 성공 재검수로만 해결되며, `not-run`이나 `blocked`를 새로 써서 실패를 지울 수 없다. 알려지지 않은 항목이나 부분 관찰은 보고서에 남지만 필수 검수로 확대 계산하지 않는다. 발견한 실패는 `job.json`의 영속 `knownFailures` 장부에 surface/check/장 단위로 기록하며, 원래 반입 packet·보고서·이미지의 해시와 당시 대상 출처를 유지한다. 소스/HTML 변경이나 과거 packet의 stale 분류가 결함을 해결하지 않는다. 각 결함은 원래 실패보다 실제 관찰 시각이 늦고, 현재 대상에 유효한 같은 check/장의 명시적 성공 재검수를 필요로 한다. 여러 장의 실패 중 한 장만 재검수하면 나머지는 열린 상태다. 해결된 결함도 원래 이력을 지우지 않으며 새 대상에서는 그 대상의 재검수를 요구한다.

장부가 없던 기존 job은 이미 반입했던 해시 확인된 packet에서 실패를 복원한다. 새 반입은 당시 승인된 정확한 대상 해시 묶음도 receipt에 보관한다. 과거 대상이라고 해서 연결된 보고서/이미지의 무결성 검사를 건너뛰지 않는다. 이 파일이 사라지거나 바뀌면 새 대상의 최소 검사가 모두 통과해도 전달을 막는다. 같은 시각의 서로 다른 ISO 표기(`Z`와 `.000Z`)는 동일한 순간으로 비교하며 실패가 우선한다.

### 새 빌드 후 도착한 과거 브라우저 관찰

공개된 이전 빌드에서 계속 진행한 검수가 새 로컬 빌드보다 늦게 도착하면, 일반 `import-browser`는 여전히 오래된 HTML을 거절한다. 새 관찰의 실패를 잃지 않으려면 별도 명령을 사용한다. `--against-receipt`에는 **같은 job의 `imports`에 이미 기록된 일반 브라우저 packet의 경로**를 지정한다. 새 packet을 자기 자신의 출처로 지정하거나, 기록되지 않은 대상/다른 job/과거 전용 반입을 출처로 지정할 수 없다.

```sh
npm run review-job -- import-historical-browser --job current-campaign-audit --packet _local/reports/browser/late-old-build-coverage.json --against-receipt _local/reports/browser/already-accepted-coverage.json
npm run review-job -- status --job current-campaign-audit
```

이 명령은 과거 대상의 별도 레지스트리를 추측하지 않는다. 이미 반입된 receipt의 packet 바이트·연결 보고서/스크린샷 해시를 다시 검증하고, 그 receipt에 저장한 `acceptedTarget`을 기준으로 새 packet의 전체 스키마·장 범위·증거·일반 브라우저 규칙을 검증한다. `acceptedTarget`이 없는 구형 receipt는 **원래 해시로 묶인 packet의 대상 정보만** 출처로 쓴다. 특히 구형 `observed-surfaces` Game receipt는 기록된 Game HTML 부분집합만 허용하며, 확인하지 않은 Workshop·BGM이나 전체 대상 digest를 새로 주장할 수 없다. 원본 receipt·보고서·대상 정보는 수정/이관하지 않는다. 이 제한을 풀려고 원본 해시나 job 장부를 수동 편집하지 않는다.

새 관찰은 `historicalImports`에 별도 보관하고, 검수 보고서의 `historicalObservations` 및 “Historical browser observations (zero current proof)”에서 원본 출처와 성공/실패/부분 관찰을 보여준다. packet과 연결 파일은 `_local`의 고유 경로에 계속 보관한다. 이후 status/resume/delivery에서도 새 packet과 출처 receipt 양쪽의 파일 무결성을 확인한다. 파일 변조/삭제는 전달을 막는다. 과거 전용 반입은 현재 성공 빌드가 다시 실행되기 전에도 기록할 수 있지만 빌드·기술 검수 상태를 통과로 만들지 않는다.

과거 실패는 surface/check/장별 영속 결함 장부에 추가하며 현재 대상의 더 늦은 **일반 `import-browser` 성공 재검수**를 요구한다. 과거 성공은 현재 필수 검수·실패 해결·최종 미술 승인에 **항상 0의 증거 기여**만 한다. 나중에 현재 HTML을 과거 바이트로 되돌려도 이 구분을 유지한다. 같은 과거 packet을 일반 반입으로 승격할 수 없으며, JSON 공백/키 순서/동일 시각 표기나 순서 없는 coverage·증거·artifact 목록을 재배열한 관찰도 새 재검수로 인정하지 않는다. 동일 관찰자·실제 시각·surface·HTML 해시가 같은 관찰은 보수적으로 같은 사건으로 묶어 coverage 행 분할이나 부분 surface packet 재작성도 승격하지 않는다. 같은 HTML의 다른 check를 새로 검수했다면 실제 새 관찰 시각을 기록해야 하며 시간을 임의로 바꿔 승격하지 않는다. HTML이 실제로 다른 현재 대상의 같은 시각 관찰은 별도로 검증하며, 기존 동률 실패 우선 규칙을 유지한다. 정상 완료/성능 등 성공 주장의 기존 스키마 규칙도 완화하지 않는다. 같은 순간의 다른 ISO 표기는 여전히 동률이며, 한 장의 재검수로 다른 장의 실패를 해결하지 않는다. 새 관찰은 이전 미술 승인/전달을 무효화하고, 공개 배포나 미술 승인을 만들지 않는다.

JSON은 운영자가 확인한 사실을 반입하는 신뢰 어댑터다. 해시 검사는 관찰자나 사용자 신원, 글의 진실성을 인증하는 서비스가 아니다.

### 검수 보고서와 로컬 전달

`reviewer.md`와 `reviewer.json`은 항상 현재 의도/선택, 구현 기록, 커밋/소스/대상 지문, 명령별 로그, 실제 브라우저 coverage, 부족한 증거를 함께 보여준다. 미술의 합격은 자동 점수로 만들지 않는다.

기술/실제 플레이가 모두 충족한 뒤 실제 사용자에게 현재 결과 이미지를 보여 주고 최종 승인을 받은 경우에만, 운영자가 `user-artistic-approval` packet을 반입한다. 필수 필드는 `actor: "user"`, 실제 응답의 `reference`, `approvedAt`, 현재 `reviewer.json`의 `basis`, 현재 `targetDigest`, 현재 대상을 가리키는 해시 있는 `renderEvidence`(`kind: "screenshot"` 또는 `"render"`, 각각의 `targetDigest`)다. 이 비공개 응답 출처는 로컬 기록에만 보관하며 fixture에는 예시만 사용한다.

```sh
npm run review-job -- approve-art --job act2-current-review --packet _local/actual-user-art-approval.json
npm run review-job -- deliver --job act2-current-review
```

`deliver`는 모든 현재 증거가 충족됐을 때만 `delivery.json`을 만든다. 정확한 두 HTML/외부 자산, 동결된 검수 보고서, 브라우저 관찰, 사용자 미술 승인과 하나의 proof basis를 연결한다. 이것은 로컬 전달 manifest이며 업로드·공개 배포·merge 권한을 만들지 않는다. 하나라도 미확인인 job은 완료 manifest를 만들지 않고 검수 보고서와 다음 필요한 행동을 남긴다.

검사: `npm run test:review-job`. 이 테스트의 합성 명령/승인/브라우저 packet은 임시 디렉터리의 상태전이 검사용이며 실제 job 증거로 반입하지 않는다. 실제 브라우저가 없는 환경의 실행은 빌드·오프라인 검사를 실제로 수행한 뒤 정확히 그 자리에서 대기한다.

### 연속 여정의 재시도 기록

`campaign-continuity.resetCount`는 새 여정 시작이나 프로필 교체로 진행을 초기화한 횟수다. 같은 프로필에서 정상 메뉴로 한 장을 다시 시도한 것은 여정 초기화와 구분한다. 정상 재시도가 있었다면 coverage의 상세 기록에 장·실패/재시도 횟수와 증거를 남기고, 무실패·단일 시도 완주라고 표시하지 않는다. 장별 강제 승리나 별도 초기 프로필의 승리를 합치는 것은 여전히 허용하지 않는다.

현재 고정 기술 프로필에는 `test:camp-persistence`도 포함된다. 캠프 수련·환불·장착과 진행 중 전투 스냅샷의 경계를 검사하며, 브라우저의 실제 캠프 입력 증거를 대신하지 않는다.
