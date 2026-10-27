# 내부 검수 원고 바인딩 계약

소유: 2막·공통 인프라는 주 담당, 3막 전용 모듈·자료·검사는 부모가 분리한 담당. 공통 파일은 동시에 편집하지 않는다. master/Pages 통합은 부모 소유다.

일반 build와 Phase A만으로는 검수 원고를 포함하지 않는다. 11장은 기존 `HONRO_ACT23_V4_PHASE_B_CH11=1`, 이후는 `HONRO_ACT23_V4_PHASE_A=1 HONRO_ACT23_V4_PHASE_B_STAGES=12,13,...`로 명시한다. build는 해당 장의 `shared/data/reviewed/act23-v4-chN.json`만 payload에 넣는다. 장별 최종 JSON 원문/조건/status를 보존하고 revision1을 추가한다. 추후3막 허용 장·ID 수는 검수 완료 전달 후 공통 담당이 확장한다.

`shared/runtime/act23-v4-reviewed-chapters.js`의 `HonroAct23V4ReviewedChapters.register(N,spec)`를 사용한다. 기본 Phase A 플러그인은 유지하며 검수판에서만 spec이 추가된다.

- `mapRevision`, `actors`(화자→실제 unit ID), `author(map,project)`, `prepare(b,profile)`, `attach(app,engine)`.
- `allow(app,row)`는 실제 사건/지식 가드다. exact ID/화자/본문/revision은 공통 검증, 살아 있는 출연 화자는 공통 검사한다. optional은 `optional(profile,row)`에 별도 사건 가드를 둔다. 실제 관측 증거 없이 완료기록만으로 새 목격을 합성하지 않는다.
- `before(app,api,dt)`가 false이면 기존 물리 tick을 건너뛴다. `drive(app,api,dt)`는 안전 경계에서 실행하며 대화 중에는 실행하지 않는다. `use(app,marker,step)`와 `eligibility`의 undefined는 기존 플러그인으로 위임한다.
- `objective(b)`는 승인된 목표 row ID, `complete(b)`는 새 사실 conjunction, `failure(b)`는 승인된 실패 UI row ID다. `state(b)`/`present(b,result,api)`로 실제 표적·승인된 선택지 표시를 추가할 수 있다. `routeReady(b)`는 실제 선택 전 대화가 끝나기 전 route 확정을 막는다.
- `draw(scene,ctx,b,engine)`은 기존 렌더 뒤에 필요한 사실 표현만 추가한다. `camera(app,key,ids,proof)`는 같은 사건의 실제 위치를 가리키는 공통 프레이밍 metadata다.
- api의 `memory(b)`는 저장되는 `{revision:1,events:{}}`, `begin(app,key,ids,proof)`는 정확한 원고와 scene slot을 한 번 연결한다. `done(b,key)`는 done/skipped 모두이므로 목격 근거가 필요한 사실에는 실제 event.ids/proof도 따로 검사한다. `journal(app,rowId)`는 같은 본문을 sourceRun과 함께 한 번 저장한다. `actor/row/V/C/safe`도 제공한다.
- 승인된 `{survived_count}`/`{lost_count}`만 `templateVars(app,row)`의0–100 정수로 렌더한다. 본문을 임의 생성하지 않는다.

Story/Continue/쉼터 cursor/저널과 정확한 row whitelist는 공통 담당이 연결한다. 모듈 소유자는 원본 App/Engine 집중 검사와 보존할 물리·분기 계약을 검사하고, 실제 Canvas/DOM 검증 여부를 별도로 보고한다. 원고 검수 완료가 구현·일반 캠페인 완주·공개 배포 완료를 뜻하지 않는다.
