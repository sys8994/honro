# 2·3막 v4 비대사 Phase A

기준 성장/합류 소스는 `c7aa5850`. 1막·Stage5·4–6막·전체 XP/아이템 설계와 production manuscript JSON은 변경하지 않는다. 새 원고의 Gemini 3단 검수는 아직 전달되지 않았다. 이번 소스는 승인된 기계 계약과 안정적인 장면 슬롯의 내부 검수판이며, 새 사건과 구대사를 섞은 공개 완성본이 아니다.

## 활성화와 원본 경계

- 기본 build와 일반 프로젝트는 v4를 활성화하지 않는다. `HONRO_ACT23_V4_PHASE_A=1 npm run build`로 만든 **별도 내부 검수 디렉터리**에서만 새 author를 적용한다. 소스별 호출은 `HonroAct23V4.author(project,{enabled:true})`다.
- `HonroAct23V4`는 공통 모델 목록 마지막에 등록되며 최종 projectAuthor다. 이후 과거 author가 신규 목표를 되돌리지 않는다. 원본 campaign.json, stage-contracts.json, narrative-current/compat/legacy JSON은 byte-exact 보존한다.
- candidate initialState의 `honroAct23V4Revision=1`과 `honroV4Steps`만 새 기계를 선택한다. catalogueRevision은 기존 `===1`을 유지한다. 단계 라벨은 기술 ID다. 신판 전투의 구 story/outro/beats/failure/queues와 20/30 구 엔딩 노출을 막으며, 새 대사는 넣지 않는다. 실제 검은 공간 동작은 유지하되 Phase A overlay 문구는 비운다.
- 장면 슬롯은 `honroState.act23v4.slots[id]`의 pending/done/cancelled와 `rowPrefix`/context/proof로 직렬화한다. 승인 원고는 Phase B에서 이 슬롯에 연결한다. 테스트의 fixture acknowledgment는 실제 대본 검수나 사용자의 승인으로 해석하지 않는다. 현재16장 필수 슬롯은 내부 검수의 명시적 E acknowledgment만 지원한다.
- 신판18은 기존 기본화살 소실/소실 witness를 생성하지 않는다. 한정 구역 고정 수평 편향만 공통 advanceProjectile에서 실제/예측에 동일 적용한다. 구판 profile의 관측 역사와 compat는 지우지 않는다.

## 구현 소유

| 범위 | 파일 | 기계 계약 |
|---|---|---|
| 공통 | shared/runtime/act23-v4.js | opt-in author, 단계/상호작용/슬롯, 출구, bounded force, 이관/검증 경계 |
|11–17| act23-v4-act2.js | 잔실/북쪽 혼의 ambient, 반복 구도, 석공 실제 이동, 길찬1인/홀림/혼분리/은신처, A/B 물길, 제자 구조/증언 슬롯, 부품·맞물림·유한 방어·축 회전 |
|18| act23-v4-stage18.js | 새 lethal 종지기, 실제 생존자 보행, 인양틀 보호, 음수 offset 부분인양/새 받침 재안착, 독립 완료 불변조건과 죽은 보스 pending 정리 |
|19–28| act23-v4-act3.js | 비전투 천도/이동, 실제 소수 행렬, 곽진/현재 병사, 기록1묶음, 짐꾼 호송/물자, 분리, 진목·검은 공간 유지, 지상 증언, 12적턴 화재/4인 합류/주민 보행 |
|29| act23-v4-stage29.js | 방패2/상층궁수2→실제 안전 차폐+후위2→보스 실제 전진, 조기 처치 허용, 명령 부하만 완료 조건, 신판 잔영/두 출구 |
|30| act23-v4-stage30.js | 현재 수역의 실제 선박/승객 동기화, 승하선/곽진 호송 후 구조, 유한 방어, 직렬화/차폐 |

기존 지형·초기 적의 넓은 밀도는 유지하고 필요한 새 받침/차폐/선착장 연결만 국소 저작한다. 29장은 관계 없는 기존 수비병이 살아 있어도 명령 부대·보스·차폐·잔영을 마치면 이탈할 수 있다. 보스 무적/HP잠금/부활을 사용하지 않는다.18은 bossDeath/rescueSafe/liftDone/settled 등 각 불변조건을 따로 확인한다. 종이 위로 이동하지 않은 구판200하강을 부분 인양으로 표시하지 않는다.

## 저장과 진행

내부 검수 활성 상태의 11–30은 mapRevision111–130을 사용한다. 기본 build의 장별 기존 revision은 보존한다. 변경된 중간 전투는 기존 discard/preserveGrowth/split.restartForMap 경로로 같은 장의 안전 시작을 사용한다. 같은 신판 snapshot의 actor/terrain/state/성장/턴은 유지한다. 24–28 split은 기존 시작 checkpoint 자원과 팀을 보존하며 실제 level-up 회복은 최신 규칙을 따른다. Workshop 사용자 snapshot은 discard 대상이 아니다.

쉼터의 index-only 진행과20/30 pending 엔딩을 신판 원고의 같은 index에 붙이지 않는다. 대상 쉼터 cursor만 초기화하고 구 pending 엔딩은 `honroAct23V4LegacyEnding`으로 보관한다. cleared/seen/기존 내러티브 기록과 과거18 실제 소실 witness는 보존하며 유헌 사망 목격으로 위조하지 않는다.27 void witness는 정상 복귀 후 기존 key로 확정한다.

## 현재 확인 범위

다음은 실제 소스/Engine와 production App의 제어된 fixture 검사다. 지형·체력·원장 상태를 둔 fixture를 정상 캠페인 완주라고 하지 않는다.

- `node tests/act23-v4-act2.mjs`:11–17 author/compiler/attach/use, 길찬 실제8,978월드단위 보행, 경로/수문/필수 슬롯/작업·6유한 방어/회전. 길찬 경로 검사는 합성 안내자·적 제외와 라운드별 정상 이동예산 보충을 사용했다.
- `node tests/act23-v4-stage18.mjs`:10집중 항목. 실제 보행/살상·낙사/독립 불변조건/단계별 sweep/각 동행의 행동 기회/이동 중 저장·재안착 exactly-once.
- `node tests/act23-v4-stage29.mjs`: 세 단계·실제 차폐/보행·유한 증원·조기 처치·저장·잔영·A/B. 관계 없는 적이 남아도 이탈, 필수 부하 source 누락은 미완료.
- `node tests/act23-v4-stage30.mjs`:13집중 항목. 실제 물·선착장/승하선/1,230월드단위 왕복 이동/승객 동기화/4인 하선·호송/3구간 복원/차폐·사망/3적턴 방어/16유한 증원/완료 conjunction.
- `node tests/act23-v4-integration.mjs`:20장 진입·원본 byte 보존·공통 탄도·5/4진목·19비전투·28양순서/화재동결·재개/재시작/성장/SP/장착/기존완료/분할자원/Workshop 제외.
- `node tests/levelup-companion-growth.mjs`: 기존12항목 통과. 경지 상한·장별 예산·기여도 정책은 바꾸지 않았다.
- `npm --prefix game run typecheck`: 통과.

실제 Canvas/이동·사격·상태 변화·모바일과 SOP의 서로 다른 미술3회 및 최종 종합은 별도 증거로 갱신한다. 기계 검사만으로 미술·재미·20장 정상 완주를 합격 처리하지 않는다. 미검수 대본 적용, master 병합 및 공개 배포는 금지 상태다.

## 전달 패킷 접근 상태

Library `libfile_c75de7efe8b48191adb7be869cf4ce1b`의 새154,850바이트 ZIP은 prepare 응답을 받았으나 실제 전송과 지원 경로1회 재시도가 모두 download failed였다. 추가 우회/재시도하지 않았다. ZIP/MANIFEST의 파일별 SHA/크기나 전체 v4 MD의53,466바이트/지정 해시는 이 소비 환경에서 검증하지 못했다. 부모에게 act2/act3 plan·audit addendum·migration map의 짧은 구간 전송을 요청했다. 현재 구현은 부모가 직접 전달한 확정 계약과 이전 v4 본문+누락 보충을 근거로 하며, 패킷을 모두 읽었다고 주장하지 않는다.

## 통합 제한

별도 브랜치 `codex/act23-v4-phase-a`만 사용한다. 최신 master의 Pages 패키징 진단 디렉터리 제외 수정(`b3486006`)과 부모 시각 검수 대기 Stage5 후보를 보존한다. 후보의 생성 web/HTML을 master에 가져오지 않고 Phase B 최종 통합 소스에서 재빌드한다. 공개 배포를 재실행하지 않는다.
