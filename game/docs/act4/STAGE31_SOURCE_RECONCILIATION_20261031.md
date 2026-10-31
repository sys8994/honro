# 31장 정본·생산 패키지 대조 — 2026-10-31

상태: **미해결·출하 차단**. 승인된 지형 자산을 받아 실제 픽셀과 충돌/동선/서사를 대조하고, 선택한 최종 데이터로 생산 패키지와 증거를 다시 작성해야 한다. 해시나 증거를 임의 갱신하지 않는다.

- 현재 브랜치의 정본은 `shared/data/act4/world.parts/manifest.json`(SHA-256 `0918d3b6d2cb5aded1e5975a50a4365670e4f03db7fc56d48b9324350d8e6e18`)과 검증된 조각이며, 마지막 정본 manifest 수정 커밋은 `64964b4d4f602bc311b1cc58552b997c3e519917`이다. 복원한 31장과 실제 출하 asset precedence를 반영한 참조는 7000×4700, 지형 22개, 유닛 38개, 참조 자산 44개다.
- `tools/stage31/production-package.json` 및 `release-binding-plan.json`은 `e281e273bbc6cf603600b073aff8b8dd8cb6036c`에서 보존된 별도 과거 패키지다. 해당 패키지 31장은 7200×3100, 지형 6개, 유닛 17개, 참조 자산 24개다. 계획 문서의 과거 정본 SHA는 `801df923ce89d8747f337f0b71e2ae38c604a8efbd6250d56e885b931af9f1b5`다. 수치와 지형 구성이 다르므로 동일 후보로 취급할 수 없다.
- 공식 `tools/stage31/check-release.mjs`는 정본 복원 후 `Stage31 production package differs from the actual shipped map/assets.`로 실패한다. 이는 필요한 보호이며 우회하거나 기준을 낮추지 않는다.
- 미술 입력은 승인을 받은 전경 시안이지만 게임 충돌 스켈레톤 자체가 아니다. [지리 우선 기준](../GEOGRAPHY_FIRST_PRODUCTION.md), [4막 지형 기획](honro-act4-terrain-art-spec-v0.2.md), [40장 기준](../quality/40-stage-criteria-v3.md)의 하구·두 교전 주머니·실제 배 접근/전원 승선과 원본 이동·충돌을 함께 대조해 최종 후보를 정한다. 옛 패키지, 다른 브랜치, 수치 중 하나를 자동 승인하지 않는다.
- 임시 브라우저 빌드의 lazy stage 31–40 JSON은 정본과 일치했다(미정의 서사 revision 기본값 1만 허용). 이는 데이터 연결 검사일 뿐, 정식 release guard·실제 게임성·미술 승인·배포의 증거가 아니다.
