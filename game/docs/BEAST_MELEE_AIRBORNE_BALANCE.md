# 공중 적 피해 반응과 짐승 근접 공격

사용자 항목 8/9. 기준 master `27efe8eb` (2026-10-21). 전용 브랜치 `feat/airborne-beast-melee`; 부모 검수 전 master/Pages 보류.

## 공중 수치

방어 벡터는 합계 1인 비율이 아니라 **1이 중립인 각 피해 반응 배율**이다. 형만 바꾼다. 기/혼, 등불, 보스, 성장/SP/장비/보상은 보존한다.

| 대상 | archetype HP | 실제 생성 HP 배율 | 형 | 기/혼 | A01 반응 전→후 | HP 포함 연속 피해 효율 |
|---|---|---|---|---|---|---|
| 박쥐 | 70→56 | .8 | .90→1.15 | 1.06/1.10 유지 | .9064→1.1464 | 1.581배 |
| 까마귀 | 88→70 | 70/88 | .92→1.15 | 1.04/1.08 유지 | .9248→1.1456 | 1.557배 |

A01 배합 .96형/.04기에서 `반응=.96×형+.04×기`. 동일 갑옷·기타 조건에서 1타 피해는 각각 약26.48%/23.88% 증가하고, HP 감소까지 합친 연속 필요 피해량은 이전의63.25%/64.21%다. 실제 발수는 정수 피해·HP 반올림·방어막·치명 등에 따라 계단식으로 변한다. archetype HP는 실제 성장 HP가 아니므로 `tuneEnemy()`의 최종 성장 HP와 difficulty 독립 `combatBaseHp`도 함께 보정한다. XP weight는 종전 .68/.78을 유지한다.

`migrateAirborneBalance()`는 유닛별 `honroAirborneBalanceRevision:1`을 둔다. runtimeTemplate/clone은 `HonroUnits.create()`, 새 적/증원은 `tuneEnemy()`, 옛 전투 Continue는 Engine 생성자에서 처리한다. 생존자의 `hp/oldMaxHp`를 정확히 유지하고 `dead` 또는 HP≤0이면 HP0을 유지한다. marker가 복제·저장되므로 반복 보정되지 않는다. 기본 종의 옛 형과 같은 명시 벡터만 형1.15로 바꾸며 다른 사용자 지정 벡터는 보존한다. 보스는 보정에서 제외하고 옛 종 반응을 유지한다. 신규 miniboss record는 HP 계산 전 보스임을 전달한다. 중간보스/보스 재조정은 새 HP 기준을 사용하며 일반 공중 marker를 지운다.

## 짐승 공격

일반 hound/boar/stag의 HBR01/HBR02 loadout을 각각 HBM01 깨물기/HBM02 멧돼지 돌진/HBM03 뿔 받기로 이전한다. 기존 HBR 투사체 정의와 이미 발사된 공격은 보존한다. 보스·소환귀와 별도로 작성된 다른 loadout은 이 일반 짐승 행동에 편입하지 않는다. 신규 기술은 enemyOnly이며 플레이어 기예 수치·배합을 바꾸지 않는다.

`beastMelee.ts`가 준비0.42초, 접촉 구간0.42–0.64초, 회복 종료1.06초를 관리한다. 움직임은 기존 `walkTerrain`의 지지면·벽 sweep·공중 유닛 공간 예약을 쓰며 `moveLeft`를 소모한다. 공격 중 최대 이동은 산개/사슴24, 멧돼지72이며 표적 몸을 지나치지 않는다. 기존 AI의 이동 후보/점프 경로 검사를 그대로 사용하고 위치 점수만 근접 접촉에 맞춘다. 기존 적 행동 수 상한은 그대로다.

판정은 전방·두 몸의 반경+짧은 도달 거리(24/28/34), 발 높이 차≤45, 지지면 접촉, 몸통에서 표적 hurtbox까지 실제 지형 차폐를 모두 요구한다. 닿은 시점에만 `hurt()`를 호출하며 `struck` latch가 피해 중복을 막는다. 전장 projectiles에는 아무것도 만들지 않는다. 준비 중 표적이 멀어지거나 벽에 막히면 빗나간다. 길을 찾지 못하면 이미 가능한 재배치 뒤 경계·방어로 행동을 마친다. 유닛별 `beastAction` 저장은 준비/회복 위치와 타격 latch를 보존하며 validator가 시간·이동·표적·기술을 검증한다.

렌더는 기존 vector attack clip의 머리/턱/목과 산개 lunge를 준비/접촉/회복 시간에 맞춘다. 기존 body joint에 작은 기울임/전진을 더해 멧돼지의 몸 낮추기와 밀침을 드러낸다. 새 이미지/rig 에셋을 만들지 않는다.

## 왜 세 종이 각각18 피해인가

이번 브라우저 사례는 세 종 모두 같은1장 진입 기준, 같은 상대, 같은 공격 경지1을 사용했다. 기존 `HonroProgression.tuneEnemy()`는 `referenceHp × targetIncomingHpFraction`을 평균1타 예산으로 삼고 `mean(skill.damage × skillBalanceFactor)`로 종별 공격 배율을 역산한다. 세 신규 근접 기술의 기본 damage는32이며, 실제 공격 배율은 기술별 보정계수를 상쇄하도록 각각 달라진다.

| 종 | 기술 보정계수 | 실제 u.attack | 방어 전 effective.damage |
|---|---|---|---|
| 산개 | 2.1123073250 | .2934728692 | 19.8369565217 |
| 멧돼지 | 2.0872533092 | .2969955245 | 19.8369565217 |
| 사슴 | 2.0528212736 | .3019770397 | 19.8369565217 |

1장 기준 HP365, `targetIncomingHpFraction=.05`, 기준/실제 상대 갑옷 .08이다. 일반 난이도의 피해 배율은 `combatBaseAttack` 계산과 실제 attack 적용에서 상쇄된다. 따라서 `effective.damage = 365 × .05 / (1−.08) = 19.8369565217`이고, 실제 형/기 반응1·치명1·조건1·갑옷 .92를 거치면 `Math.round(19.8369565217 × .92) = Math.round(18.25) = 18`이다. 방어막은0이다. [production 수치 계산과 damage layer 원본](stage-review/airborne-beast-melee/evidence/damage-calculation.json), [실제 브라우저 초기 능력치·18 HP 감소](stage-review/airborne-beast-melee/evidence/browser/summary.json)를 함께 확인할 수 있다.

18을 타격 코드에 상수로 넣거나 HP를18씩 강제로 차감한 결과가 아니다. 같은 진입 기준으로1타 예산을 맞추던 기존 성장 보정을 따른 결과다. 종의 차이는 준비 후 접근/접촉 거리, 멧돼지의 짧은 돌진, 몸/머리/턱 모션에서 드러난다. 다른 장·난이도·갑옷·상태·정예 및 기존 저장의 유지된 attack까지 항상 같은 피해라는 뜻은 아니다. 이번 보존 작업에서 공격 수치를 새로 조정하지 않았다.

## 집중 검수와 종합 검수

1. **공중 수치·저장:** 실제 App Continue/export/import 3회, 신규 factory/기존 runtimeTemplate, 생존 비율·사망·보스·명시 qi/soul·성장 ledger·행동 상한 보존. 새 miniboss 제외와 보상 weight 확인.
2. **근접 지형·범위:** 실제 Engine 접촉·벽·높이100의 다른 층·사거리 밖, 이동 예산과 거리 제한, 저장한 타격 latch 재개 시 중복 피해 없음. 저장 validator도 통과.
3. **모션·AI:** 실제 Chromium/production Scene에서 일반 진입 HP365/기력96/공격1.75 아군과 일반 생성 짐승 사용. 피해 무적·피해 override 없이 skirmish를 준비했다. 산개/멧돼지/사슴은 각각18 피해를 한 번 주었고 모든 근접 trace의 projectile 수는0. 실제 AI 접근, 작은 상층으로 점프 후 같은 높이에서 타격, 큰 벽·도달 불가능한 고지 무피해 확인. 박쥐/까마귀/등불은 fixed를 유지하고 각각 약214.5 거리 비행(280 예산 이내). 원본 PNG 준비/접촉/회복 3프레임씩 직접 확인.
4. **최종 종합:** 최종 소스·타입·공통 빌드·웹 자산 연결과 관련 저장/비행 회귀 확인. 공유 stage2/5 데이터·지형·활성화·플레이어 스킬 수치는 미수정. 준비된 skirmish의 동작 증거와 원본1장 정상 전투에서 일반 이동/점프/방어로 관찰한 근접 시도·고저차 무피해를 구분한다. 전 장 완주/실제 모바일 기기/Pages 검증으로 확대하지 않는다.

명령: `node tests/airborne-beast-melee.mjs`, `python tests/airborne-beast-melee-browser.py`, `npm --prefix game run typecheck`, `npm run build`, `node tests/flying-knockback.mjs`, `node tests/act1-defense-resume.mjs`, `node tests/web-split.mjs`, `node tests/lure-enemy-turn.mjs`.

부모 픽셀 검수를 위한 원본 PNG19장(세 종3프레임씩9컷 포함), 전체 관련 trace, 브라우저 summary, 저장 이전 결과, 최종 검수는 [저장소 검수 갤러리](stage-review/airborne-beast-melee/README.md)에 보존했다. [보존 manifest](stage-review/airborne-beast-melee/evidence/preservation-manifest.json)가 기존 `_local/reports/airborne-beast-melee/` 원본과 복사본의 바이트 동일성을 연결한다. 브라우저는 `browser/summary.json`, 세 종 `*-1-prepare.png`/`*-2-contact.png`/`*-3-recover.png`, `*-trace.json`, `canonical-stage1-trace.json`을 남긴다. 이는 준비 skirmish와 대표 원본 캠페인 구간의 확인이며 전체 캠페인 정상 완주 증거가 아니다.

기존 검사 한계: `existence-damage.mjs`는 unclassified S14, `existence-variety.mjs`는 과거 attack delta fixture 차이, `stage2-airborne.mjs`는 역사 clone의 `plan?.flightEscape` assertion에서 실패한다. 세 실패 모두 수정 전 master27efe8eb의 별도 worktree에서 같은 위치/내용으로 재현했다. [실패 summary와 원본 로그3개](stage-review/airborne-beast-melee/README.md#기존-실패3개--통과-아님)에 연결했으며 세 검사 상태는 모두 **실패**다. 관련 코드/검사 기준을 임의로 고치지 않았다. stage2 검사의 앞선 배치/기회/상한/호스트/기타 장 보존 사례는 통과했다.

## 통합 시 주의

- `engine.ts`: 생성자의 유닛 이전, `fire()`의 투사체 생성 전 짐승 분기, `refreshIntents()`, `enemyActionSteps()`의 근접/경계 결정, `tick()`의 짐승 상태 갱신과 flight 종료 대기. 스킬 작업과 합칠 때 이 좁은 hook만 유지한다.
- `enemyAI.ts`: `preferredRange()`, `candidates()`, `shotOpportunity()`의 일반 짐승 한정 분기. 공중 planning/advance 함수와 지형 물리는 미수정이다.
- `existence.ts`: 종 form, `defenseForUnit()`의 공중 보스 보존, `migrateAirborneBalance()` 및 HBM 배합. `skillMechanics.ts:migrateEnemySkills()`는 기존 일반 짐승 skill ID만 이전한다.
- `progression.js:tuneEnemy/tuneMidboss/tuneBoss`, `map/units.js:create`, `world.js:createEnemy/trainingWorld`는 HP/보스/clone 경계 담당이다. stage author에서 새 HP를 직접 덮어쓸 경우 marker와 `combatBaseHp`를 함께 확인한다.
- `monster-vector.js:pose/state`는 모션만 다룬다. actors.runtime의 변경은 이 공유 렌더 소스를 참조하는 생성 source hash이며 actor 그림 데이터 자체는 동일하다.
- 2장 공중 배치·5장 지형/활성화·별도 스킬 작업과 병합 후 **공통 빌드를 다시 실행**한다. 생성 HTML/web manifest와 hash 파일을 각 브랜치 버전에서 수동 선택해 섞지 않는다. master 반영과 Pages는 부모의 검수·통합 단계다.
