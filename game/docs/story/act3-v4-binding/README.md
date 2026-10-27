# 3막 v4 검수 원고 연결 경계

기준은 `15243cc1fbc04d0ea63751376325b5cdbe70bcb4`, 작업 브랜치는 `codex/act3-v4-reviewed-binding-20261027`이다. 통합·master·Pages 발행은 부모 담당이다.

## 소유권

- 이 브랜치: `shared/data/reviewed/act23-v4-ch21.json` 등 부모 최종 채택 장별 데이터, `shared/runtime/act23-v4-ch21-scenes.js`·`act23-v4-ch21-reviewed.js`·전용 미술, `tests/act23-v4-reviewed21.mjs` 등 3막 전용 검사와 이 디렉터리.
- 필요할 때 기존 3막 전용 `act23-v4-city.js`, `act23-v4-act3.js`, `act23-v4-stage29.js`, `act23-v4-stage30.js`를 최소 수정할 수 있다. 기존 기계 구현을 우선 재사용한다.
- 부모/기존 담당: `shared/build.mjs`, `main.js`, `story.js`, `rest-journey.js`, `act23-v4.js`, `act23-v4-reviewed.js`, 공통 테스트 helper·진행/성장/저장/빌드 인프라. 이 파일의 수정사항은 통합 요청/별도 패치로 전달하고 작업 브랜치의 활성 소스에는 적용하지 않는다.

## 연결 계약

장별 provider는 `enabled/active/rowsReviewed/lineAllowed/accepts/finished/present/content/failure/optional/journal/talkId`를 제공한다. 부모 공통 registry가 장 번호로 위임한다. opt-in flag와 stage/revision/status 및 정확한 ID·화자·본문을 확인하며, 미검수 장에 대한 fallback이나 창작 본문을 넣지 않는다. 씬은 기존 장 plugin을 감싸고 전용 상태를 `honroState.act23v4.chapter21` 등에 저장한다. 실제 사건 proof·한 번 재생 acknowledgment·안정 rowId/커서가 같은 revision 저장으로 이어져야 한다.

11장 패턴의 공통 story whitelist, 재개 시 whitelist 유지, `finished` acknowledgment, 목표/내용/실패/휴식 talk key/journal 연결과 map revision을 부모 통합 대상으로 삼는다. 기존 11장·첫 혼령 공통 장면은 보존한다.

## 보존 경계

원본 `v4-planning/honro-v4-source-extracted.md` 53,466B/SHA256 `76a30c4d1968ab31d9d9ba112e254d63958f9bd7d41d43371c60714af3aaa6d2`와 상세 기획은 설계 기준이며 검수 원고 입력이 아니다. 부모가 최종 채택 JSON을 전달한 장만 연결한다. 최신 입력은 문서 브랜치 `c6bb72992f2e920739f7f95e15f9ac95ba34dddb`의21–30장321행이다. 원문/별칭/전달 메타데이터를 `v4-reviewed/`와 전용 데이터에 보존했다. 21–24장 실제 연결은 [CH21.md](CH21.md), [CH22.md](CH22.md), [CH23.md](CH23.md), [CH24.md](CH24.md)에 있다. 25–30장은 후속 연결 중이며 데이터 보존을 구현 완료로 보고하지 않는다.

24장 수레 문장→저택/사당 가문표식, 25/27 자유 순서·각 지점 두 영웅 동시 도착, 24–28 무휴식·자원 연속, 26 실제 구조·짧은 선조 증언, 27 설오 단독 선택 검은 공간·정체 미확정·담허 비청취, 28 실제 4인 재합류·불길/물길·12적턴 deadline·사망/시간지연 hazard 정지, 29 실제 차폐·명령 부하 단계·조기처치 보상, 30 연실배·곽진 호송·승하선/왕복을 보존한다. Stage5/성장/레벨업/Pages 패키징은 범위 밖이다.

## 검증 구분

장별 원본 Engine/App focused fixture 검사와 실제 Chromium DOM/Canvas/localStorage 확인을 구별한다. 적 처치·영웅 위치·선행 완료를 공급한 fixture를 정상 전투 완주로 보고하지 않는다. 문서/원고 전용 커밋에는 빌드를 수행하지 않는다. 실제 연결 뒤 해당 장의 조건·위험 해소 pending 폐기·실제 화자·동일판 재개/구판 성장 보존만 집중 확인한다.

공통 통합 변경은 `tools/testing/act3-v4-parent-integration.mjs`의 파일별 exact-base 패치에 정리했다. 활성 공통 소스는 수정하지 않았다. 같은 revision 초기 내부 저장의 누락된 원고 메타데이터는 정확한 승인 ID/화자/본문인 경우만 mount 전에 승격한다. 새 metadata를 가진 저장의 변조는 보정하지 않는다.
