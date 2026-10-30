# campaign-balanced-v1 코호트 감사 · 2026-10-30

**판정: ‘계획 레벨22의 기초장비·저투자 합성 프로필’.** `balanced-v1`이라는
이름은 평균 플레이어 대표성의 근거가 아니다. 합법적인 투자/장착 규칙을
사용했지만1–30장 실제 플레이·성장·보상 선택 이력은 재현하지 않았다.
동일 코호트를 사용한 v6↔v8의 조작기술 비교만 가능하며, 사람 난도/승률이나
정상적으로 성장·장비를 활용한 플레이어의 완주 가능성으로 일반화하지 않는다.

| 항목 | 원본 기록과 소스 규칙 | 근거 |
|---|---|---|
| 레벨 | 전원XP158091/Lv22 직접 준비. 30장 계획 exit22→31장 entry22와 일치하나 실제 기여도별 개인 성장의 재현은 아님 | `game/config/balance.json:523–527`; `shared/runtime/act4-content.js:40–41`; `shared/runtime/progression.js:186–198`; `act4-adapter.mjs:15` |
| 능력치 | 영웅당 **전체6SP**. 항목당6SP나42SP가 아님. `statTraining=6`이7개 능력축에 함께 적용 | `shared/engine/src/progression.ts:173–189,244–249`; `act4-adapter.mjs:17` |
| 남은SP | Lv22당45SP. 궁수/도사/기사15사용·**30미사용**, 술사16사용·**29미사용**. 수동패시브 투자0 | `progression.ts:173,188–198`; 원본 run entry.training |
| 기예 | 기본A01/M01/S00/O01 rank1. 선택한3기예는rank3, 술사O06은 초기rank1+3회훈련으로rank4. ‘3회 훈련 시도’와 최종rank를 구분 | `progression.ts:171,190–198`; `act4-adapter.mjs:16–17`; 원본 profile.heroes |
| 장비 | 4인 각T1개인기초장비만 장착, common칸 모두null. **이미 보유한15개**에는4인T3개인장비(`itm_*_05`)와 공통3개(`itm_co_01/02/11`)도 포함. 미획득이 아니라 **보유T3·공통장비 미장착** | `shared/runtime/equipment-state.js:14–16,21,39–52`; `shared/runtime/main.js:334`; 원본 export.equipment |
| 보상 | clear표식으로 필수1–3막 보상을 소급지급. stage7/12/16/17/18/20 선택보상6개는pending/미선택. 선택정예12·수문15 보상은 실제receipt가 없어 미획득 | `equipment-state.js:17–25,38–52,65`; `tests/app-regression-helpers.mjs:41` |

원본 증거는 `honro-pilot-estuary-calibration/_local/reports/estuary-v6-full-calibration/`
의 `74f9a0ef-7ab5-4185-bb42-97e556e9da20.jsonl.gz` 및
`SYNTHETIC-prepared-stage31-entry.json`이다. 프로필 SHA256:
`3dfa72e5d5ed7ce58133020e813514bc28fa758e663094460364b61e7c6c4714`.
이 감사는 읽기 전용이며 새 Engine 실행·적/성장/장비/프로필 변경을 하지 않았다.
사용자 인계 지시에 따라 낮은 하구 추가 제작·balancing·시험은 중단한다.
