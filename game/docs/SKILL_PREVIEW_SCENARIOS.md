# 스킬 미리보기 전수 시연 계약

실제 노출 등록 기준은 CLASS_IDS의 기본기와 TALENTS 합집합이다. 기본기 4 + 사용 기예 60 + 상시 기예 20 = **84개**. 역사적 enemyOnly/옛 ultimate/Lxx 정의는 플레이어 목록에서 제외된다. 시연은 복제 프로필의 실엔진을 사용하고 결과 HP/피해/명중을 그려 넣지 않는다. 상시 기예는 별도 미습득 엔진에 같은 입력을 주어 비교한다. 전투·성장·저장·밸런스 원본은 변경하지 않는다.

목록은 `tools/testing/export-skill-preview-contracts.mjs`로 실제 등록/노트/시연 정책에서 내보낸다. [기계 판독 계약](../../tests/fixtures/skill-preview/contracts.json), [고유 효과 assertion](../../tests/skill-preview-expectations.mjs), [168건 엔진 검사](../../tests/skill-preview-audit.mjs), [데스크톱/모바일 168건 실제 렌더 검사](../../tests/skill-preview-audit-browser.py).

낮은 경지의 관통은 적 둘을, 충분한 관통 예산이 있는 경지는 얇은 목재 뒤 군집을 사용한다. 반탄파의 첫 경지는 반사만 있고 분열은 실제 경지 규칙에 따라 확인한다. 공전검기는 엔진 projectile 하나에 실제 orbit.blades가 5~9개 있는 구조이므로 projectile 수를 검기 수로 오판하지 않는다. 비행 표적은 실제 bat이며, 지상 표적은 floor/preview-platform 충돌면에 접지한다.

## mage

| ID·이름 | 실제 효과·발동 조건 | 장면·입력 정책 | 관찰 지표·근거 |
|---|---|---|---|
| M01 기파 | 기력을 쓰지 않는 기본 기파입니다. 닿은 곳에 작은 충격을 냅니다. | single · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 기파 착탄 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M06 화호 | 폭발 후 불꽃 파편을 흩뿌립니다. 같은 적은 파편에 최대 두 번 맞습니다. | delayed-burst · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | secondary 화염 파편·피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M02 빙호 | 적과 지형에서 튀는 호리병입니다. 비행 중 발사를 다시 누르면 터집니다. 재입력이 없으면 충전량에 따라 3.2~6.4초 뒤 폭발하고 맞은 적을 한 턴 느리게 만듭니다. | bounce-ice · 실제 반사 후 표적 근처에서 detonateIceGourd 1회 | bounces>0, detonate 입력, frostChip<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M04 뇌호 | 폭발점 주변의 적마다 번개가 한 번씩 닿습니다. 번개는 사이의 벽과 다른 적을 통과합니다. | lightning · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | lightningBolt 및 군집 다중 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M13 연폭호 | 첫 폭발 주변에 작은 폭발이 연달아 생깁니다. 같은 적은 후속 폭발에 최대 세 번 맞습니다. | delayed-burst · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | secondary 연폭·다중 표적<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M05 천뢰호 | 착탄 후 잠시 뒤 위에서 천뢰가 내려칩니다. 천장이나 위쪽 지형에 막힐 수 있습니다. | sky · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 표식 뒤 lightningBolt·착탄 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M03 원호파 | 닿은 자리에서 진행 방향의 양옆으로 원호가 펼쳐집니다. | arc · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 실제 arc geometry와 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M11 반탄파 | 첫 발은 하나입니다. 경지별 반사·분열 순서에 따라 최대 12개로 퍼지고 반사마다 위력 82%를 유지합니다. 예상선은 첫 반사 뒤까지만 보입니다. | reflection · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 반사 횟수·경지별 분열 ID·피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M12 삼재파 | 발사점과 두 번의 반사점이 삼각형을 만듭니다. 경계와 내부를 함께 공격합니다. | reflection · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | triangle geometry와 경계/내부 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M14 동심파 | 충전한 만큼 큰 원주를 공격합니다. 중심은 비어 있으며 너무 넓히면 피해가 줄어듭니다. | ring · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | ring geometry·원주 2명 명중/중심 무피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M15 팔괘파 | 착탄점에 팔각형과 여덟 기선을 펼칩니다. 중심의 추가 피해가 크고 같은 적은 최대 세 기선에 맞습니다. | bagua · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | bagua geometry·군집 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M07 파진목 | 적이 다가오면 주위에 충격을 내는 진목입니다. 유지되는 동안 매 턴 다시 발동합니다. | trap · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 진목 설치 후 실제 적 밟음 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M10 회생진목 | 진목을 밟은 아군의 체력·기력·이동력을 회복합니다. 아군마다 한 턴에 한 번 이용합니다. | healing-stake · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 동행의 실제 HP/기력 증가<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M08 유인진목 | 적 턴이 되면 표시된 범위 안의 적이 진목 쪽으로 이동합니다. 벽을 통과하지 않으며 보스는 유인되지 않습니다. | lure · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 적이 진목 방향으로 이동<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M09 축지진목 | 발밑과 착탄점에 진목 한 쌍을 만듭니다. 진목 위에서 상호작용하면 건너갑니다. 각 동행은 한 턴에 한 번 이용하며 새 진목은 오래된 것을 교체합니다. | gate · 진목 한 쌍 설치 후 useGate | 2진목 설치, useGate, 실제 좌표 이동<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| M99 오방봉진 | 진 안의 적을 느리게 하고 이동력을 줄입니다. 경계를 넘는 적에게 한 턴에 한 번 피해를 주며 안으로 밀어냅니다. | prison · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 진목 crossed 기록과 경계 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| MP01 법맥 | 호리병의 후속 효과와 파문·진목의 효력을 높입니다. | passive-secondary · M06 실제 시전; 같은 입력의 미습득 별도 엔진과 비교 | 동일 조건 실제 누적 피해 비교<br>shared/engine/src/skillMechanics.ts: geometryBoost/redesignImpact |
| MP02 기해 | 담을 수 있는 기력과 매 턴 회복량을 늘립니다. | passive-mana · 실제 아군 차례에 M01; 적 차례는 대기; 같은 입력의 미습득 별도 엔진과 비교 | 최대 기력과 실제 다음 턴 기력 비교<br>shared/engine/src/progression.ts: heroStats; passiveBalance.ts |
| MP04 기맥전도 | 도술이 적에게 명중하면 가까운 동행 한 명에게 방호를 줍니다. 가까운 동행이 없으면 자신에게 적용되며, 한 행동에 한 번 발동합니다. | passive-ward · M01 실제 시전; 같은 입력의 미습득 별도 엔진과 비교 | 명중 후 실제 동행 shield 비교<br>shared/engine/src/engine.ts: hurt |
| MP03 회기 | 공격 도술이 모든 적을 빗나가면 쓴 기력 일부를 돌려받습니다. 진목 설치는 제외합니다. | passive-refund · M06 실제 시전; 같은 입력의 미습득 별도 엔진과 비교 | 빗나감 후 실제 기력 환급 비교<br>shared/engine/src/skillMechanics.ts: finishRedesign |
| MP05 주천 | 기력을 쓰는 도술로 주천을 채웁니다. 완성 후 다음 도술 한 번의 비용은 줄고 효과는 강해집니다. 무료 도술은 주천을 채우지 않습니다. | passive-circulation · 실제 아군 차례에 M06 → M06 → M06 → M06 → M06 → M06 → M06 → M06; 적 차례는 대기; 같은 입력의 미습득 별도 엔진과 비교 | 누적 소비·jucheonReady·다음 cast effectBoost<br>shared/engine/src/combatPassives.ts: beginPlayerCast/jucheonBoost |

## archer

| ID·이름 | 실제 효과·발동 조건 | 장면·입력 정책 | 관찰 지표·근거 |
|---|---|---|---|
| A01 평사 | 곧게 날아가는 기본 사격입니다. 기력을 쓰지 않습니다. | single · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 직접 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A14 급소시 | 치명타 확률과 피해가 높은 정밀 사격입니다. 멀리서 맞힐수록 피해가 증가합니다. | distance · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 1000 이상 거리의 표적 명중<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A02 관통시 | 적과 얇은 목재를 꿰뚫습니다. 관통할 때마다 피해가 조금 줄어듭니다. 멀리서 맞힐수록 피해가 증가합니다. | line · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 목재 뒤 표적/일렬 적 다중 명중<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A06 회기시 | 적에게 준 피해 일부를 체력과 기력으로 되돌려 받습니다. 한 번에 회복할 수 있는 양에는 한도가 있습니다. 멀리서 맞힐수록 피해가 증가합니다. | recovery · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 시전 전후 실제 체력·기력<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A10 정심 | 한 행동을 써서 집중합니다. 두 턴 안에 다음 절명 사격 한 번의 피해·치명타·방어 관통이 강화됩니다. | prepare · prepare → A14 강화 사격 | prepared 상태 → 후속 절명 사격<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A99 절명시 | 멀리서 치명타를 내면 체력이 낮은 일반 적을 즉시 쓰러뜨립니다. 보스에게는 잃은 체력에 비례한 추가 피해를 줍니다. 멀리서 맞힐수록 피해가 증가합니다. | execution · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 약해진 일반 적의 원거리 치명타와 처치<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A11 급락시 | 최고점을 지난 화살이 빠르게 떨어집니다. 높은 곳에서 떨어져 맞힐수록 피해가 증가합니다. | apex · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | apex 이후 낙하와 명중<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A09 전로시 | 비행 중 발사 버튼이나 전장 클릭으로 한 번 꺾을 수 있습니다. 꺾은 뒤 명중하면 추가 피해를 줍니다. 높은 곳에서 떨어져 맞힐수록 피해가 증가합니다. | turn-once · 올려 쏨 → 실제 비행 .48초 뒤 turnArrow 1회 (황색/청록은 실제 좌표) | turns=1, 전후 속도·실제 좌표, 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A13 추혼시 | 사선이 열린 적을 따라갑니다. 벽은 통과하지 못합니다. 높은 곳에서 떨어져 맞힐수록 피해가 증가합니다. | offset · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 실제 높은 발판의 표적에 유도 명중<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A12 귀환시 | 돌아오는 길에도 적을 관통합니다. 같은 적을 다시 맞히면 귀환 피해가 더 강해집니다. 높은 곳에서 떨어져 맞힐수록 피해가 증가합니다. | return · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | returning, 같은 적의 나감/귀환 2회 명중<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A15 칠성추혼 | 최고점에서 일곱 추적 화살로 갈라집니다. 한 적에게 최대 네 발이 맞으며 연속 명중 피해는 줄어듭니다. 높은 곳에서 떨어져 맞힐수록 피해가 증가합니다. | apex · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | seekChild 7분열·다중 표적 명중<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A05 격퇴시 | 맞은 적을 밀쳐 뒤의 적과 충돌시킵니다. 뒤로 이어질수록 충격은 약해집니다. 빠르게 충돌할수록 피해가 증가합니다. | push · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 주 표적 밀림과 뒤 표적 충돌 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A04 산개사 | 여러 화살을 부채꼴로 동시에 쏩니다. 연속 시위의 추가 사격에도 적용됩니다. 빠르게 충돌할수록 피해가 증가합니다. | spread · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 실제 3발 이상 + 비행종 둘 이상 명중<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A07 쇄암시 | 직격 주변에도 충격을 주며, 파괴 가능한 지형에 4.5배의 피해를 줍니다. 빠르게 충돌할수록 피해가 증가합니다. | break · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 목재 HP/파괴와 주변 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A03 연환시 | 명중한 적에서 가까운 다른 적으로 튕깁니다. 도약할 때마다 피해가 줄어듭니다. 빠르게 충돌할수록 피해가 증가합니다. | ground-chain · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 두 적 이상으로 chain 도약<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| A08 철화 | 명중한 자리에서 1.5초 동안 짧은 파편을 쏟습니다. 한 적이 받는 파편 피해는 직격 피해의 65%까지입니다. 빠르게 충돌할수록 피해가 증가합니다. | fragments · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | secondary 파편과 추가 피해<br>shared/engine/src/skillMechanics.ts/projectileGrowth.ts/engine.ts |
| AP04 궁세 | 거리·낙차·충돌 속력에 따른 궁술의 피해 보너스를 높입니다. | passive-trajectory · A14 실제 시전; 같은 입력의 미습득 별도 엔진과 비교 | 동일 조건 실제 누적 피해 비교<br>shared/engine/src/skillMechanics.ts: trajectoryMultiplier/redesignConditionBonuses |
| AP02 급소 간파 | 모든 화살의 치명타 확률과 배율을 높입니다. | passive-critical · A14 실제 시전; 같은 입력의 미습득 별도 엔진과 비교 | 치명 확률·배율과 동일 RNG의 실제 피해 비교<br>shared/engine/src/progression.ts: criticalStats; skillMechanics.ts: critProfile |
| AP01 연속 시위 | 첫 사격 뒤 추가 화살을 이어 쏩니다. 뒤따르는 화살일수록 피해가 낮습니다. | passive-volley · A01 실제 시전; 같은 입력의 미습득 별도 엔진과 비교 | 미습득 비교 대비 실제 후속 projectile 수<br>shared/engine/src/engine.ts: fire/volley |
| AP03 이탈보 | 사격이 끝난 뒤 남은 행동으로 이동·도약할 수 있습니다. | passive-retreat · 실제 아군 차례에 A01; 적 차례는 대기; 같은 입력의 미습득 별도 엔진과 비교 | 사격 후 실제 후퇴 거리 비교<br>shared/engine/src/skillMechanics.ts: finishRedesign |
| AP05 살흔 | 같은 적을 다시 맞히면 지난 내 턴의 직접 화살 피해 일부가 되살아납니다. 후속 화살과 파편은 상처를 중복 발동시키지 않습니다. | passive-history · 실제 아군 차례에 A01 → A01; 적 차례는 대기; 같은 입력의 미습득 별도 엔진과 비교 | 동일 조건 실제 누적 피해 비교<br>shared/engine/src/combatPassives.ts: arrowTurn/recordSalheun |

## knight

| ID·이름 | 실제 효과·발동 조건 | 장면·입력 정책 | 관찰 지표·근거 |
|---|---|---|---|
| S00 평참 | 선택한 방향을 좁게 벱니다. 빠르게 놓으면 기력을 아끼고 수세를 취하며, 오래 모으면 더 멀고 강하게 벱니다. | melee · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 전방 근접 피해<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S03 횡참 | 전방을 넓게 벱니다. 오래 힘을 모으면 사거리와 피해가 증가합니다. | melee · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 전방 군집 광역 베기<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S05 회신참 | 앞과 뒤를 한 번씩 벱니다. 아주 가까운 적은 두 번 맞을 수 있습니다. | turn · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 앞/뒤 두 표적 베기<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S07 연참 | 한 적을 연속으로 벱니다. 도중에 쓰러뜨리면 가까운 다른 적에게 이어갑니다. | combo · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 처치한 뒤 다른 적으로 이어지는 연격<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S08 응수세 | 자세를 잡으며 최대 체력의 2~5.5%를 회복하고 받는 피해를 25~35% 줄입니다. 적의 차례에 전방의 적들을 한 번 반격하며, 피격 뒤에는 반격 사거리와 각도가 조금 넓어집니다. | counter · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 회복·martialGuard·적 공격 뒤 반격<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S02 사생참 | 현재 체력의 약 ⅓을 먼저 쓰고 그 힘을 일격에 더합니다. 적 방어의 35%를 무시합니다. | life · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 자신 HP 소비와 대상 피해<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S01 도약참 | 몸을 날려 적을 베고 착지한 자리에 남습니다. | rush · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 몸의 실제 비행·착지 좌표와 피해<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S06 회풍참 | 비행 경로의 적을 한 번씩 베며 통과합니다. | sweep · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 이동 경로 두 적 이상 베기<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S04 파산격 | 비행 중 발사를 다시 누르면 급강하합니다. 높이 떨어질수록 충격이 강하며 재입력하지 않으면 약한 착지 공격이 됩니다. | rush · 비행 중 manualDive 1회 | manualDive 입력과 급강하 피해<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S15 쇄진돌격 | 지상의 적을 함께 밀며 전진합니다. 공중의 적은 베고 지나갑니다. | ground-air · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 지상 운반/실제 bat 통과 피해<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S13 파진연격 | 돌파하고 착지한 뒤 평참이나 검술을 한 번 더 씁니다. 후속 검술 전에는 이동할 수 없습니다. | rush · 착지 meleeFollow ready 후 S00 1회 | 착지 후 허용된 S00 후속 입력<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S09 월영참 | 전방으로 반달 모양의 검기를 날립니다. | single · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 검기 비행과 피해<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S10 견인참 | 맞은 자를 앞으로 끌어옵니다. 적은 가까이 오면 다시 베고, 아군은 피해 없이 옮깁니다. 벽과 절벽 앞에서는 멈춥니다. | pull · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 피격 적의 당김 좌표와 후속 베기<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S11 관통참 | 지나가는 모든 적을 한 번씩 관통합니다. | line · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 일렬 다중 관통<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S14 파열참 | 첫 적이나 지형에 닿으면 진행 방향과 수직인 짧은 검압이 펼쳐집니다. 가까운 군집을 한 번 베며 벽에 가로막힙니다. | burst-blade · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 실제 inkLine 검압·군집 타격<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| S12 회륜검기 | 공전하는 여러 검기를 함께 날립니다. 각 검기는 같은 적을 최대 두 번 맞힙니다. | orbit · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 실제 orbit.blades 5~9개와 반복 명중<br>shared/engine/src/warriorMechanics.ts/warriorData.ts |
| SP01 검세 | 검술의 각도와 축세, 돌격 피해, 검기의 크기·속도를 강화합니다. | passive-sword · S03 실제 시전; 같은 입력의 미습득 별도 엔진과 비교 | 동일 조건 실제 누적 피해 비교<br>shared/engine/src/warriorMechanics.ts; progression.ts |
| SP02 단련 | 최대 체력과 방어를 높이고 밀림을 줄입니다. | passive-durability · 실제 LA01 적 공격으로 시작; 같은 입력의 미습득 별도 엔진과 비교 | 동일 적 공격의 HP/방어 적용 차이<br>shared/engine/src/progression.ts: heroStats; engine.ts: hurt/impulse |
| SP03 경신 | 이동과 도약을 강화하고 점프의 이동력 소모를 줄입니다. | passive-mobility · 실제 jump 후 착지/공격; 같은 입력의 미습득 별도 엔진과 비교 | 실제 도약 최고점·jumpCost 비교<br>shared/engine/src/progression.ts: heroStats; engine.ts: jump/jumpCost |
| SP04 연세 | 검술·돌격·검기를 이어 쓰면 합세가 완성됩니다. 기력을 회복하고 다음 기예의 비용·피해와 잠시 받는 피해를 랭크에 따라 강화합니다. | passive-harmony · 실제 아군 차례에 S03 → S01 → S09 → S03; 적 차례는 대기; 같은 입력의 미습득 별도 엔진과 비교 | 3계통 시전→harmony→강화 4번째 시전<br>shared/engine/src/combatPassives.ts: beginPlayerCast/passiveCost |
| SP05 불굴 | 전투마다 한 번 치명적인 피해를 버팁니다. 직후에는 잠시 받는 피해가 줄어듭니다. | passive-last-stand · 실제 LA01 적 공격으로 시작; 같은 입력의 미습득 별도 엔진과 비교 | 같은 치명 공격의 사망/불굴 비교<br>shared/engine/src/engine.ts: hurt |

## occultist

| ID·이름 | 실제 효과·발동 조건 | 장면·입력 정책 | 관찰 지표·근거 |
|---|---|---|---|
| O01 혼령탄 | 중력과 바람의 영향을 적게 받는 혼령탄을 날립니다. | single · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 혼령탄 비행·명중<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O02 투과령 | 지형과 적을 통과하며 피해를 남긴 뒤 폭발합니다. 오래 충전할수록 더 늦게 터집니다. | phase-wall · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 벽 통과·통과한 적 피해·폭발<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O03 역천령 | 거꾸로 솟아오른 혼이 원혼비로 갈라져 아래를 덮칩니다. | reverse-rain · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | reverseGhost → spiritRain 및 군집 피해<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O04 황천창 | 벽을 통과하고 처음 닿은 적에게 강한 피해를 줍니다. | phase-wall · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 벽 뒤 첫 적 명중<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O05 회귀망령 | 나갈 때 적을 관통해 28% 피해를 남기고 지형에서 멈춥니다. 실제 궤적을 거꾸로 따라 첫 적에 닿으면 95% 위력으로 폭발하며, 나갈 때 맞힌 적은 폭발 피해가 30% 증가합니다. 지형에 닿지 않으면 최대 3.4초 뒤 사라집니다. | reverse-path · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | wraithState outbound/manifest/return·귀환 폭발<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O16 만혼귀결 | 대표 혼령이 닿은 곳을 귀결점으로 삼습니다. 흩어져 돌아온 혼령이 경로와 귀결점에 피해를 줍니다. | converge · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | convergeSpirit 실제 외향/귀결 궤적·다중 피해<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O06 쇠망부 | 공격력과 방어력을 낮추는 부적입니다. 경지가 높을수록 오래 갑니다. | weakness · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | curseTurns/curseArmor 변화 및 적 반응<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O07 증오부 | 맞은 적이 같은 편에게도 공격 대상으로 보입니다. 경지가 높을수록 오래 갑니다. | betrayal · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | curseTurns/betrayal 및 적의 대상 변경<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O08 현형부 | 작은 범위의 적을 현형합니다. 숨은 혼령도 다른 동료에게 보입니다. | manifest · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 숨은 ghost의 manifested/reveal 상태<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O09 섭혼부 | 보스가 아닌 적을 잠시 동맹으로 돌립니다. 직접 행동한 횟수만큼 효력이 소모됩니다. | enthrall · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | enthrall 후 동맹 공격<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O10 지박부 | 넓은 범위에 지박주를 남깁니다. 저주받은 적이 죽으면 그 자리에 지박령이 생깁니다. | earthbound · 지박 후 O01로 처치 | earthbind 이후 실제 처치·earthbound 생성<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O11 배회령 | 배회령이 소단의 행동 직후 가까운 적을 쫓아 공격합니다. | summon · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 실제 소환→접근→공격<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O12 등불귀 | 등불귀가 소단의 행동 직후 먼 적에게 추적탄을 보냅니다. 높은 경지에서는 최대 두 적을 노립니다. | summon · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 실제 소환→summonBolt→피해<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O13 호혼령 | 호혼령이 소단의 행동 직후 범위 안 동행을 방호하고 체력·기력을 회복합니다. 여러 호혼령이 있어도 회복은 동행마다 턴당 한 번이며, 실제 적 피해로 잃은 체력의 회복만 기여 경험치에 반영됩니다. | warden · 선택 스킬의 실제 e.fire → 엔진 tick·적/소환 차례 | 소환 후 동행 HP/기력·shield<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O14 먹귀 | 지형에 닿으면 주변 일반·정예 적을 한 번 삼킵니다. 2~4턴 동안 아군이 먹귀에 가한 HP 피해를 포획 적 각각에 전달합니다. 남은 먹귀 HP를 넘는 피해는 전달하지 않으며, 죽거나 만료되면 생존자를 방출합니다. | eater · 포획 뒤 O01로 먹귀 공격 | eaterCapturedBy와 먹귀 실피해의 전달<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| O15 반향령 | 소단이 지정한 목표를 각자의 자리에서 함께 겨눕니다. 부적과 초혼은 반향하지 않습니다. | echo · 반향령 설치 뒤 O01 | 소환 후 O01 입력·echo 동시 발사<br>shared/engine/src/engine.ts/occultMechanics.ts/returningWraith.ts/eaterMechanics.ts |
| OP01 잔부 | 빗나간 부적은 잠시 함정으로 남습니다. 섭혼부와 지박부에는 적용되지 않습니다. | passive-trap · O06 빗나감 후 적이 잔부 쪽으로 실제 걷기; 같은 입력의 미습득 별도 엔진과 비교 | 실제 occultTraps→접촉 curse→피해<br>shared/engine/src/engine.ts: occultImpact/tickOccultZones |
| OP02 혼맥 | 자신의 주박·지박이 남은 적을 소환령과 섭혼한 적이 우선 찾고 더 강하게 공격합니다. | passive-mark-priority · 실제 아군 차례에 O06 → O11; 적 차례는 대기; 같은 입력의 미습득 별도 엔진과 비교 | 주박 적의 실제 소환 우선 추적·강화 피해<br>shared/engine/src/engine.ts: stepSummonTurn/hurt |
| OP03 분혼 | 방호 뒤 남은 피해의 일부를 가까운 소환령과 나눕니다. 한 공격에서 나눌 수 있는 피해에는 한도가 있습니다. | passive-share · 실제 소환 후 적이 주인에게 LA01 발사; 같은 입력의 미습득 별도 엔진과 비교 | 소환령 HP/shield가 실제 분담한 피해와 주인 HP 비교<br>shared/engine/src/engine.ts: hurt |
| OP04 매듭보전 | 수명이 끝난 소환령에게서 기력을 돌려받고 다음 초혼 비용을 줄입니다. | passive-expiry · 실제 아군 차례에 O11; 적 차례는 대기; 같은 입력의 미습득 별도 엔진과 비교 | 자연 만료 뒤 nextSummonDiscount/기력 비교<br>shared/engine/src/engine.ts: expireSummon |
| OP05 잔혼 | 영향 아래 쓰러진 적의 잔혼 셋을 모아 다음 기예 하나를 강화합니다. | passive-remnants · 실제 아군 차례에 O10 → O01; 적 차례는 대기; 같은 입력의 미습득 별도 엔진과 비교 | 실제 3처치→잔혼3→다음 projectile soulBoost·피해<br>shared/engine/src/engine.ts: hurt; occultMechanics.ts: beginOccultCast |

