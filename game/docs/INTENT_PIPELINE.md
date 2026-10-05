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
