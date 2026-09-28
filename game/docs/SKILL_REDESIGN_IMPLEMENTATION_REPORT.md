# 설오·담허 스킬트리 개편 구현 보고서

작업: 2026-09-26~27. 기준: [사용자 명세](HONRO_SKILL_REDESIGN_SEOLO_DAMHEO.md). 브랜치: `skill-redesign-seolo-damheo`.

## 구현 결과

설오·담허 각각 기본 공격 1종을 수련에서 분리하고, 3계통 × 5개 사용 기예 + 5개 상시 기예로 교체했다. 기본 공격은 SP를 쓰지 않으며 첫 슬롯에 유지된다. 계통의 마지막 기술 6종은 `capstone:true`, `ultimate:false`인 일반 talent로 Lv.1~8 성장하고 재사용은 2라운드다. 두 인물에게 모든 액티브를 배워야 해금되는 전역 비기 조건은 없다.

설오의 절명은 수평거리, 곡사는 최고점부터의 낙차, 강궁은 충돌 직전 물리 속력을 각각 사용한다. 담허는 물리 투척 호리병, 같은 geometry를 공유하는 파문 판정·미리보기, AI 없는 고정 진목으로 구분했다. 휘겸·소단의 스킬 정의와 트리는 유지했다. 활성 맵 `shared/data/campaign.json`, 맵 스키마, 이야기, 캐릭터 리그는 변경하지 않았다.

실행 파일: [HONRO.html](../../HONRO.html), [HONRO_WORKSHOP.html](../../HONRO_WORKSHOP.html). 두 HTML은 공통 소스로 빌드했다.

## 최종 ID 매핑

표의 순서는 각 계통의 1~5단계이며 ★는 Lv.1~8 계통 비기다. 피해·기력은 Lv.1 작성 수치다. 실제 피해에는 공격 능력치·궤적/치명·방어·범위 감쇠가 적용된다.

| 인물 | 구분 | ID → 이름 (피해 / 기력) |
|---|---|---|
| 설오 | 기본 | A01 평사 43 / 0 |
| 설오 | 절명 | A14 급소시 46/30 → A02 관통시 50/36 → A06 회기시 40/34 → A10 정심 0/0 → A99 절명시★ 96/62 |
| 설오 | 곡사 | A11 급락시 48/32 → A09 전로시 42/34 → A13 추혼시 45/38 → A12 귀환시 62/44 → A15 칠성추혼★ 26/60 |
| 설오 | 강궁 | A05 격퇴시 36/30 → A04 산개사 22/38 → A07 쇄암시 58/42 → A03 연환시 48/40 → A08 철화★ 70/64 |
| 설오 | 상시 | AP04 궁세 → AP02 급소 간파 → AP01 연속 시위 → AP03 이탈보 → AP05 일념 |
| 담허 | 기본 | M01 기파 34 / 0 |
| 담허 | 호리병술 | M06 화호 42/32 → M02 빙호 38/34 → M04 뇌호 34/38 → M13 연폭호 48/46 → M05 천뢰호★ 88/68 |
| 담허 | 파문술 | M03 원호파 44/32 → M11 반탄파 46/34 → M12 삼재파 38/42 → M14 동심파 72/46 → M15 팔괘파★ 34/66 |
| 담허 | 진법 | M07 파진목 56/30 → M10 회생진목 0/34 → M08 유인진목 30/38 → M09 축지진목 0/44 → M99 오방봉진★ 35/62 |
| 담허 | 상시 | MP01 법맥 → MP02 기해 → MP04 천기감응 → MP03 회기 → MP05 입도 |

삼재파 내부 피해는 16, 팔괘파 중심 피해는 62, 오방봉진 경계 피해는 22다. 기본 피해 성장 곡선은 `1, 1.16, 1.32, 1.40, 1.48, 1.56, 1.64, 1.72`를 유지한다. 기본 공격은 rank 1 고정이다. 기력 비용은 기존 공통 비용 배율을 역산해 명세 수치가 실제 Lv.1 비용이 되도록 작성했다.

## 수정 파일과 책임

| 파일 | 변경 |
|---|---|
| `shared/engine/src/skillRedesignData.ts`, `data.ts` | 작성 수치·이름·설명·basic/branch/capstone, 옛 A/M 정의의 LA/LM 복제 |
| `shared/engine/src/progression.ts`, `projectileGrowth.ts`, `balanceModel.ts` | 새 트리·패시브·무료 기본기·랭크 성장·7분열·작성 피해 우선 |
| `shared/engine/src/skillMechanics.ts` | 궤적 배율, seeded 치명, 회복 상한, 상태/설치물/파문 판정, 예측, 마이그레이션 |
| `shared/engine/src/engine.ts`, `types.ts`, `world.ts`, `store.ts` | 공통 엔진 연결·저장 타입/검증·발사/충돌/행동 해소 |
| `shared/engine/src/skillVisuals.ts`, `art.ts`, `icons.ts`, `campUI.ts` | 화살/도자기/목재/붓선, 실제 판정 기반 미리보기, SVG 아이콘, 수련 UI |
| `shared/runtime/main.js`, `interactions.js`, `combat-status.js` | 전로시 클릭·터치·E·발사 버튼, 축지 E/버튼, 후퇴 전용 조작·상태·기록 불러오기 |
| `shared/runtime/content.js`, `renderer.js`, `allies.js` | 한국어 기예·계통명, 진목 공통 렌더링, 동맹 이동의 진목 접촉 |
| `shared/runtime/world.js`, `progression.js` | 적/NPC legacy loadout, 기존 적 수치 산정용 역사적 평사 기준 유지 |
| `game/engine/build.mjs`, `package.json` | 공통 모듈 export, `test:skills` 및 전체 verify 편입 |
| `migration/migrate-stages.mjs` | 역사적 맵 비교에서 당시 스킬/초기 분배 복원; 활성 맵 재작성 없음 |
| `game/tests/rc13-balance-audit.mjs` | 옛 다중탄 밸런스 검사를 LM 정의로 유지, 새 플레이어 작성 피해 검사 추가 |
| `tests/skill-redesign.mjs`, `tests/skill-redesign-browser.py` | 새 동작·경계 조건·저장·실제 입력·두 실행 셸·화면 증거 |

작업 시작부터 존재하던 BGM/오디오와 Stage 1·2 검증 변경은 유지했다. 그 변경을 이번 개편의 신규 작업으로 계산하지 않았다. 소스 외 생성물은 두 실행 HTML과 검증 JSON/대표 PNG다. 임시 실행 로그는 gitignore된 `.test-output`에 두었다. 커밋·푸시는 수행하지 않았다.

## 재사용한 코드와 새 동작

- 발사 속도/충전, 고정 시간 간격 물리 적분, 충돌 broad phase·swept collision, 지면·몸체 충돌, 피해/방어/XP, 기존 효과음 경로를 재사용했다.
- 산개사의 발수·확산각·개별탄 보정과 연속 시위의 기존 `stepVolley` 스케줄을 유지했다. 후속은 0.5초 간격, ±2°, 추가 `min(5, rank)`발이며 `(.42+.02*(rank-1))*.66^(index-1)`로 감쇠한다.
- 추혼시는 기존 LOS·완만한 선회를 사용한다. 귀환시는 정점에서 왕복 hit 집합을 분리하고 각속도를 제한한 곡선으로 돌아온다. 칠성추혼은 기존 정점 분열 경로에 7개와 분산 타깃을 연결했다.
- 빙호·반탄파·삼재파는 기존 충돌 법선과 반사 공식을 사용한다. 빙호는 1.6초 fuse 동안 튀며, 삼재파는 발사점과 첫 두 지형 접촉을 기록한다. 천뢰는 실제 수직 collision으로 천장 차폐를 유지한다.
- 철화/연폭호는 Projectile 기반 emitter이며, 연폭호에는 각 소폭발 전 짧은 지점 예고를 넣었다. 난수는 모두 전투 RNG를 사용한다.
- 파문은 하나의 `SkillGeometry`로 명중과 VFX/preview를 계산한다. 동심파는 내부가 아닌 원주만 판정한다. 진목은 `Battle.stakes`에 저장하며 유닛·소환수·AI를 만들지 않는다. 유인진목은 기존 `impulse`→`integrateBody`를 통해 벽을 존중한다.
- 축지는 최대 2개/오래된 것 교체/유닛당 팀 턴 1회/도착 단계별 회복·방호를 적용한다. 목적지가 지형·다른 유닛으로 막히면 이동하지 않는다. 오방봉진은 2R, 내부 감속·매 턴 이동 예산 감소·경계 턴당 1회 피해·안쪽 impulse를 적용한다.
- 이탈보는 기존 aim 상태에 저장 가능한 retreat 플래그를 붙인다. 공격·선택 변경·물품·상호작용은 차단하고 이동·점프·대기만 허용한다. 이동 소진과 착지 해소 후 행동을 끝낸다.

## 저장 및 적/NPC 호환

`SKILL_REVISION=1`을 각 HeroProgress 및 Battle에 저장한다. `profile.heroes`, `saved.heroes`, `honroBattle.heroes`를 독립적으로 검사하므로 프로필만 새 버전인 미완료 전투도 처리한다. 설오/담허의 ranks만 기본기 1로 초기화하고 XP·kills·damage·난이도·맵 진행·전투 HP/위치는 유지한다. 총 SP는 기존 `3 + 2*(level-1)` 규칙으로 그대로 미사용 포인트가 된다. 이후 투자한 새 랭크는 재로드로 초기화하지 않는다. 휘겸/소단의 기존 배분은 변경하지 않는다.

새 플레이어 정의 설치 전에 옛 Axx/Mxx를 LAxx/LMxx로 복제했다. 적/NPC의 loadout/ranks와 이전 저장의 비행 중 발사체를 해당 정의로 이관한다. `legacyId`로 옛 balance factor와 다중탄 피해 상한도 유지한다. 신규 훈련 목록에는 enemyOnly 정의를 노출하지 않는다. 기존 적에게 전로시나 축지처럼 사람 입력이 필요한 기술을 부여하지 않는다.

저장 검증은 새 emitter·자탄·대기 mode, apex/반사 접촉·타깃·후퇴·정심·진목 상태와 5회 후속 volley를 허용하며 유효성도 검사한다. 기본 IndexedDB/localStorage 검증 경로와 실제 HONRO localStorage 재로드 모두 시험했다.

## 검증 결과

`npm run verify` 전체 통과(실제 프로세스 종료 코드 0). 마지막 완료: 2026-09-27 00:55 KST. 타입 검사, game 기존 회귀, RC21 브라우저/성능, Stage 1~10 migration, 공통 렌더/물리 integration 47개, 편집 23개, authored 15개, 오디오/BGM, Stage 1·2, 신규 스킬 및 두 HTML 성능을 순차 실행했다. 최종 브라우저 스킬 검사 21개, 예외 0. 외부 라이브러리 Pillow의 기존 deprecated API 경고는 남아 있으나 검사 실패는 없다.

- `node tests/skill-redesign.mjs`: 35개 검사 통과. 거리 300/900/1800, 낙차·속력 독립성, crit RNG, 정심, 관통·회복·전로·LOS·귀환·7분열·충돌·연쇄·철화, 산개사+연속 시위, 이탈보, 호리병/fuse/직선 번개/천장, 파문 geometry, 진목, 저장 복원, 전문화, 적 legacy 상한을 포함한다.
- `python -X utf8 tests/skill-redesign-browser.py`: 게임 64 + Workshop Playtest 64개 발사/rank 조합. 8적 밀집과 빙호·반탄파·삼재파용 벽·천장·발판 fixture를 사용한다. 실제 발사 버튼, E, context 버튼, 터치 입력, 두 아군의 축지·회생, 저장 재로드, Playtest 작성 데이터 불변을 확인한다. 브라우저 예외 0.
- 정량 밸런스: 새 정의는 `skillBalanceFactor=1`. 철화 자탄 합계 65%, 화호/빙호 대상당 최대 2파편, 연폭호 최대 3회, 칠성추혼 최대 4발(1/.70/.50/.35), 팔괘 최대 3선 상한을 검사했다. 기존 RC13 다중탄 정규화 검사는 legacy 스킬 대상으로 계속 수행한다.
- 대표 증거: [unit.json](../../_local/reports/skill-redesign/unit.json), [browser.json](../../_local/reports/skill-redesign/browser.json), [호리병](../../_local/reports/skill-redesign/vfx-M06.png), [빙호](../../_local/reports/skill-redesign/vfx-M02.png), [칠성추혼](../../_local/reports/skill-redesign/vfx-A15.png), [팔괘](../../_local/reports/skill-redesign/vfx-M15.png), [삼재](../../_local/reports/skill-redesign/vfx-M12.png), [진목/회생](../../_local/reports/skill-redesign/vfx-stakes.png).

두 HTML의 실제 캡처를 직접 확인했다. [설오 수련 UI](../../_local/reports/skill-redesign/tree-archer.png)에서 3계통과 기본기 분리도 확인했다. 호리병은 도자기·끈·패찰, 진목은 목재·종이, 화살은 화살촉·깃, 파문은 얇은 회백색 기하선이다. 새 스킬 VFX는 Canvas filter를 사용하지 않으며 캐릭터 그림은 기존 것을 유지한다.

## 성능

개편 전 동일 harness 결과는 [skill-redesign-before.json](../../_local/reports/skill-redesign-before.json)에 보관했다. 테스트용 브라우저는 한 번에 하나씩 실행했다. 성능 기준을 낮추지 않았다.

초기 전체 검사의 RC21 Stage 1에서 renderHz 40.3, 별도 재검사에서 43.6으로 50Hz 기준에 미달했다. 조준 guide의 반복 예측을 WeakMap 캐시로 바꾼 뒤 렌더 함수 시간은 약 3.82ms에서 1.51ms로 줄었다. 동일 세션의 HEAD/현재 프레임 계측에서는 현재 208회/3.51초(약 59Hz), render 합계 248.7ms였다. 짧은 headless 측정 변동이 있어 최종 정규 harness 결과를 별도로 기록한다.

| Stage | 크기 / 줌 | 이전 Hz | 이후 Hz | 이전 평균 ms | 이후 평균 ms |
|---|---|---:|---:|---:|---:|
| 1 | 1365×768 / 0.82 | 59.95 | 60.09 | 3.843 | 0.863 |
| 2 | 1365×768 / 0.82 | 59.93 | 60.04 | 2.677 | 1.321 |
| 1 | 1365×768 / 0.2 | 59.76 | 60.28 | 4.001 | 1.131 |
| 2 | 1365×768 / 0.2 | 60.17 | 60.0 | 2.618 | 1.637 |
| 1 | 844×390 / 0.2 | 60.12 | 59.68 | 3.883 | 1.058 |
| 2 | 844×390 / 0.2 | 59.79 | 60.25 | 2.684 | 1.336 |

최종 `npm run verify`는 종료 코드 0, 236.1초로 완료했다. 게임 6조건·Workshop Stage View 6조건 모두 50Hz 이상/평균 7ms 미만/예열 후 캐시 재생성 0이다. Workshop은 59.62~60.21Hz, 평균 0.669~1.459ms다. RC21 실제 전투 갱신 포함 Stage 1~4도 59.7~60.1Hz로 통과했고 지형 파괴 시 캐시 무효화도 통과했다.

원본 수치: [통합 성능 비교](../../_local/reports/skill-redesign/performance.json), [최종 verify 종료·HTML 해시](../../_local/reports/skill-redesign/verification.json). 짧은 headless 측정이므로 ms 차이를 모든 기기의 동일한 향상률로 일반화하지 않는다.


## 한계와 추가 체감 검토

- 브라우저 검증은 실제 빌드와 입력을 사용한 debug fixture다. 신규 스킬을 정상 육성하며 캠페인 전체를 수동 완주했다는 의미는 아니다. 이동/점프 및 진행 fixture는 기존 회귀 검사와 함께 실행한다.
- 레벨·SP 조건은 수련 UI에서 유지하고, Lv.8 메커니즘 시험은 각 기술을 독립적으로 부여해 검사했다. 전체 스킬을 한 번에 최대 육성한 합법 세이브를 가정하지 않았다.
- 파문의 몸 판정은 유닛 중심·반경 기반이며 미리보기와 실제가 동일하다. 캐릭터 그림의 세밀한 윤곽을 그대로 판정하지 않는다. 작은 삼각형은 내부 피해를 생략한다.
- 천기감응 마지막 단계의 low/high는 간단한 참고 범위다. 지형·방어·난수·파편 적중·위치 변화까지 확정 예측하지 않는다.
- 진목은 투척 당시 지면에 고정된다. 설치 뒤 지형 파괴/이동에 맞추어 다시 낙하하는 지지체 시뮬레이션은 추가하지 않았다. 오방봉진은 물리 impulse 제어이며 보스를 강제로 고정하거나 순간이동시키지 않는다.
- 장기 체감 난이도는 추가 플레이로 조정할 여지가 있다. 이번에는 명세의 작성 피해와 명시적 중복 상한을 우선했고 맵/적 체력이나 성장 XP를 그에 맞춰 임의 조정하지 않았다.


## 2026-09-27 후속 개선

사용자 후속 요청 7개를 [별도 보고서](SKILL_POLISH_2026_09_27.md)에 기록했다. 허공터 카드/경지 선택, 서사 설명, 명중음과 궤적 보정, 빙호 **2.4초·적 반사**, 진목 식별/애니메이션, 파문 붓결/명중음을 반영했다. 본문의 초기 개편 수치와 검증은 당시 기록이며 현재 빙호와 선택 화면은 후속 보고서를 우선한다.
