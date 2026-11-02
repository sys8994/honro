# 1·2막 자체 포함 미술 저장 테이블 호환 — 2026-11-02

`profile-store.js`의 기존 version 1 테이블 적용 범위를 공식 캠페인 1–20장과 `act1-traced:`/`act2-traced:` 비충돌·비상호작용 벡터로 확장했다. 공통 1막 장식의 2막 재사용을 허용하며 본문·서명·복제 격리·원자적 거부·옛 inline 저장·휴대용 inline export는 그대로다. Custom/Workshop/훈련·21장 이후·외부 공급자 참조는 이 테이블 대상이 아니며 보관본을 삭제하지 않는다.

`tests/act2-local-art-save.mjs`는 기존 1막 벡터를 재명명한 **합성** 11/20장 fixture로 혼합 prefix·재저장/재로드·복제 격리·공급자 독립·내보내기/가져오기·범위 제외·잘못된 테이블13건의 원자적 거부를 검사한다. 실제 2막 신규 미술/플레이/브라우저 증거가 아니다. 기존 1–10장 roundtrip과 Act4 provider cache/story compact 검사도 통과했다. `npm run build`는 변경된 runtime digest 때문에 Stage31의 `Runtime changed after actual Engine probes.` gate에서 예상대로 차단된다. gate를 우회하지 않으며 최종 통합 뒤 새 probe·빌드·실제 2막 저장/화면 확인과 master/Pages 발행은 조정자 담당이다.

