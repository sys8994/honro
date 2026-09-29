# HONRO 게임 수정 맥락

**동맹·소환귀·목표물 미술(2026-09-29):** `tools/actor-forge/`에서 일반 동맹 8역할·나무꾼·주민·소환귀 5종·닫힌/빈 상여·부상자 운반대·피란문·구 숫자 보스의 20종을 제작한다. 기존 서양 마법사/기사 실루엣을 한국식 복식·무구·수의·목탈·장승·행등·창호로 교체했다. 사람은 작은 머리와 긴 팔다리의 성인 비율이며, 승인된 party v008/monster와 같은 높이로 비교한다. 기존 대비 앵커 0.70~2.40배, 3.15배 상한만 적용하며 증량 하한은 없다. `HonroVectorParts`가 기존 몬스터 렌더러를 공통 팩토리로 제공하고 `actor-vector.js`가 실제 유닛/동맹 턴 상태를 읽는다. 소환 여부를 직업보다 먼저 판별하며, 이름 있는 네 동행과 소단 보스는 party v008을 유지한다. `npm run test:actors`는 전체 verify에 포함된다. [제작 기준·범위·한계](ACTOR_ART_PIPELINE.md). 아래 일반 몬스터 항목의 ‘동맹·소환귀·특수 보스는 기존 그림’은 이 개정으로 대체된다.

**기예 시연·상태 표시 최신 기준(HBUG-046/047, 2026-09-29):** [유지 명세](SKILL_PRESENTATION.md). `skill-preview.js`가 프로필 복제와 작은 시연 배치를 공통 Engine/Scene으로 실행한다. 허공터의 이전 고정 카메라를 사용하지 않는다. 스킬별 후속 입력/보조 상황과 화면 범위를 맞추고 반복 때 모달·스크롤을 보존한다. `skillNotes.ts`의 플레이 설명은 서사 아래 별도로 표시하며 `skillGrowthRows()`는 전 경지에서 불변인 비교 행을 제거한다. `combat-status.js`가 모든 진영의 전장 효과·최대 3개 아이콘과 작은 상태 상세 버튼을 제공한다. 기존 효과 규칙/저장 형식은 유지한다. `test:skill-presentation`은 두 HTML의 64기예×2경지, 모바일 3화면, 실제 자동 시연·상태 조작·저장/렌더 불변과 밀집 상태 렌더를 확인하며 `test:skills`/verify에 포함된다.

**공격 템포·소단 후반전 최신 기준(HBUG-044/045, 2026-09-29):** 적/동맹 배너의 700ms 정지와 적 이동 뒤 180ms 대기를 제거했다. 역산한 탄도 후보를 공통 예측으로 검증해 유효한 사격에서 탐색을 마치고, 막힌 사선은 추가 탐색한다. 이동 후보 평가도 같은 초기 후보를 쓰며 동맹 조준까지 실제 App의 4ms 계산 예산을 공유한다. 피해 확인/대사 정지는 유지한다. Stage 10 협력 때 소단은 이전 좌표에서 중앙 `ritual` 돌단으로 옮긴다. 보스 주박 HP 5,803을 이어 쓰지 않고 최소 11레벨 동행 능력치를 적용한다(기본 최대 820, 시작 656, 자동 보호막 없음). 구 협력 저장은 `finaleRevision:2`로 HP 비율·방어 진행을 보존하여 한 번만 이전한다. 증원은 고정된 서/동 전각 `westHall`/`eastHall` 주변에서 나오며, 혼잡하면 멀리 흩어 만들지 않고 배치 전체를 재시도한다. 처음 지상/비행 4+4, 이후 3+3, 생존 상한 28·행동 6·최소 6회 방어는 유지한다. 붉은 혼매듭, 받이진으로 흐르는 금빛 혼불, 풀리는 여섯 매듭과 전각 출몰 표시를 공통 Scene에 그린다. [설계/검증](FINALE_PERFORMANCE.md), `tests/attack-tempo-finale*`를 참고한다. 아래 HBUG-043의 기존 전체 탐색 순서 유지보다 이 후속 기준이 우선한다.

**현재 전투·사건·서사 기준(HBUG-042/043, 2026-09-29):** [수치와 목표](COMBAT_STORY_RULES.md), [피날레·성능 설계](FINALE_PERFORMANCE.md). 사건 조건은 즉시 저장하되 현재 캐릭터의 비행·연격·피해 확인이 끝난 경계에 실행/정지 대사를 연다. 전체 아군 턴 종료나 단순 선택 변경은 기준이 아니다. 승리 조건은 계속 즉시 판정한다. 비관통 궤적은 유닛에 맞은 뒤도 가늘고 흐린 실선으로 표시한다. Stage 10은 고정된 소단이 혼매듭을 푸는 동안 최소 6회의 적 턴을 보호하고, 최초 최대 8명/이후 최대 6명씩 매 턴 증원한다(생존 상한 28). 소단이 쓰러지면 실패한다. 신규 합류는 추천 SP 배분/장착을 마치며 기존 배분·환불은 보존한다. 공격 진목 2~9턴, 회생 4~11턴, 축지 6~13턴으로 랭크마다 +1턴. 기본 치명은 설오/담허/휘겸/소단 8/4/5/6%, 레벨 성장도 낮췄다. 빙호 재입력 기폭, 조준각 25도 기반 휘겸 근접, 군집 편성·HP 60%/인원 2배, Stage 5 한 번 시작/제자리 유지 의식은 계속 적용한다. 피격 필터는 재사용 표면의 적백색 합성으로 교체했고, 조준 예측 캐시·세로 가시 범위 제외·효과음 예열을 적용한다. 대사는 설오의 정보량에 맞춘 첫 만남 질문/응답, 짧은 행동 지문, 소단의 두려움→증거→선택→공동 방어로 이어지며 [작성 규칙](STORY_WRITING.md)과 로컬 스킬을 따른다. 도입 최대 8개, 후속 질문/응답 묶음 최대 5개. `test:finale`는 기존 `test:story`/verify, 동시 피격 성능은 `test:performance`에 포함된다. 아래 과거 항목의 즉시 사건·2턴 피날레·이전 치명/진목 수치는 이 기준으로 대체한다.

**실시간 판단 비용(HBUG-043):** 적 이동/사격의 기존 후보 탐색은 generator로 순서를 유지하며 실제 App 프레임에서 4ms 예산으로 나눈다. `planningBudget()`은 프레임 종료에 해제하고, 전장 입력 변화 시 재계산한다. 중간 iterator는 저장하지 않는다. 유닛 충돌은 AABB로 먼 대상을 먼저 제외하며, 대표 칠성추혼 경로가 끝나면 화면용 예측도 끝낸다. `test:finale`에 동기/분할 동일 결과와 저장 재계산, 비행/전술 회귀가 포함된다. 성능은 렌더만 측정하지 않고 실제 프레임·효과음까지 함께 검사한다.

**네 동행 미술 v008(2026-09-29):** 다운로드 폴더의 실제 260916 캐릭터 시트 4개를 `tools/party-forge/references/`에 확보하고 SHA/crop을 `references.json`에 기록했다. `portrait-shapes.mjs`의 원본 PNG 좌표 경로를 균일 변환해 턱·귀·머리와 두 눈/코/입을 다시 작성한다. 휘겸 초상만 방향을 반전한다. `sheet-faces.mjs`가 머리/목과 팔레트를 적용하며 소단은 상아색에 연보라색 안감·옷깃·치마 포인트를 복원한다. 현재 앵커는 512/541/480/511로 직전 v007의 ±5%이며 이전 2배 증량 기준을 다시 적용하지 않는다. 비교 원본 `tests/fixtures/party-v007.runtime.js`와 PNG 해시를 생성 시 검사한다. v007의 머리 pivot·비율 보존·이동 보정·리그·동작·무기 제약은 유지한다. Game/Stage View/Playtest와 적 소단이 같은 에셋을 쓴다. `npm run test:party`는 시트/현재·v007/현재·크기·모션 비교와 53개 검사를 생성한다. 네 차례 시각 수정 이력은 로컬 Forge reports에, 현재 기준은 [제작 문서](PARTY_ART_PIPELINE.md)에 있다. 자동 검사 통과를 미술 승인으로 취급하지 않는다.

**몬스터 벡터 제작(2026-09-29, 2차):** 일반 적 11종의 원본은 `tools/monster-forge/recipes.mjs`와 `species.mjs`, 생성물은 `shared/assets/monsters/`, 공통 렌더러는 `shared/runtime/monster-vector.js`다. 최초 원본 앵커를 `tests/fixtures/monster-baseline.json`에 고정하고 2.85~3.15배 범위 밖이면 빌드를 실패시킨다. 초기 3종의 과밀 장식도 줄였다. 빌드가 SVG·리그·동작·runtime을 함께 생성한다. side=1의 일반 타입/variant와 해당 중간보스만 새 경로로 그린다. 소단과 일반 궁수가 human 타입을 공유하므로 `honroFinalBoss`/`boss`/`id='boss'` 예외를 유지한다. 아군·동맹·소환귀도 기존 그림을 쓴다. 물리·h/r·전투·저장은 변경하지 않으며, 적 궁수의 기존 사격 각도 반응은 손/활 리그에 연결했다. `npm run test:monsters`는 검수 공방과 두 HTML/Playtest 검사를 생성하고 전체 verify에 포함된다. [제작·시각 검수 계획](MONSTER_ART_PIPELINE.md)을 따른다. 보고서와 직접 본 평가는 `_local/reports/monster-forge/`에 둔다. 특수 보스·발 접지 IK는 후속 범위다.

**방향 가이드(HBUG-040, 2026-09-29):** `Scene.predictionGuide`는 `drawRedesignGuide`의 반환 전에 `drawAimDirection`을 호출한다. 개편 스킬의 조기 반환으로 각도선이 다시 사라지지 않도록 두 표시를 독립시켰다. 짧은 방향선은 네 동행 고유의 선·장식·흐르는 입자로 그리고, 예상 궤적은 기존 점선이다. 방향선 크기/굵기는 화면 픽셀 기준이다. 실제 발사 원점·선택 각도를 사용하며, 근접 검술은 선택 조준각, 검막은 실제 수평 앞쪽 방향을 표시한다. 준비/이탈/사망/대화/비행 중에는 조준 방향선을 표시하지 않는다. `tests/aim-direction-browser.py`가 두 HTML 실제 누름/뗌·좌우 각도·4인 구분·줌·모바일·적 12명 조준 비용을 검사한다.

**허공터·기예 후속 조정(HBUG-039, 2026-09-29):** 허공터의 초상/스킬/경지 변경과 refresh는 전투만 재생성하고 앱의 `trainingMusicSession`을 이어 쓴다. 캠페인 진입·재도전의 음악 순환은 기존대로다. 칠성추혼 예상은 실제 7분열을 모두 시뮬레이션하되 부모→가운데 자탄 한 경로만 그린다. 철화 파편은 초속 560·수명 0.6초, 1.5초 분출·대상별 65% 상한을 유지한다. 휘겸 검술 기본 반경은 기존 ×0.8이며 응수세·견인 뒤 베기도 같은 데이터에서 읽는다. 근접 가이드·효과 패널도 일치한다. `icons.ts`의 21개 전용 SVG, `warriorVisuals.ts`의 검기/공전 잔상·돌격 옷자락, `skillVisuals.ts`의 철화 꽃잎/불티는 전투 RNG나 판정을 변경하지 않는다. 회귀 `npm run test:skill-tuning`은 전체 verify에 포함된다.

**출구·자원 바 최신 기준(HBUG-037/038, 2026-09-29):** 출구 표시와 완료 판정은 현재/저장 전투의 호송 목적지·출구 marker·anchor·`b.width`를 사용한다. Stage 1의 `content.w=8200`은 실제 맵 너비 4200과 다르므로 승리 좌표로 쓰지 않는다. 새 진행 회귀는 `runtime({legacyMaps:false})`로 옛 맵 로딩의 치수 덮어쓰기를 피하고 실제 지도 안에서 검증한다. HUD의 패시브 영역은 자원 바보다 앞에 있으므로 `nth-child`로 자원을 배치하지 않는다. `data-vital`로 고정 배치하며 체력·기력·이동도 라벨은 바 안의 수치 옆에 작은 글씨로 표시한다. `npm run test:progress-hud`는 기존 저장 이어하기, 실제 출구 이동과 다음 단계, 두 HTML·5개 화면 크기의 표시/값 갱신을 검사한다.

**휘겸·P5 최신 기준(HBUG-036, 2026-09-29):** [구현 보고서](SKILL_REDESIGN_HWIGYEOM_P5_REPORT.md), [요청 명세](HONRO_SKILL_REDESIGN_HWIGYEOM_P5.md). 휘겸 기본기는 S00 평참이며 검술/돌격/검기 각 5개와 패시브 5개를 쓴다. 기존 공통 S99는 플레이어에게 노출하지 않는다. 정의는 warriorData.ts, 판정·예측은 warriorMechanics.ts, P5·연세는 combatPassives.ts, 표현은 warriorVisuals.ts. HeroProgress/Battle.martialRevision=1 이전의 휘겸 배분만 환원하며 설오·담허의 현재 배분은 유지한다. 적·NPC와 옛 Sxx 비행은 LSxx로 분리한다. AP05는 실제 직접 화살 피해를 적별로 기록하는 살흔, MP05는 실제 소비 기력 누적 주천이며 구 단일 계통 보정은 없다. 파진연격 착지 후 ready 상태는 근접 한 번만 허용하고 이동·동행 전환을 막는다. 두 HTML에 같은 Engine을 사용하며 `npm run test:hwigyeom`이 전체 `test:skills`/verify에 포함된다.

이 문서는 디자인을 제외한 게임 내용·진행·동작 수정의 시작점이다. 최근 정리: 2026-09-29. 과거 대화를 읽지 않아도 판단을 이어갈 수 있도록 유지한다.

**1막 이야기 최신 기준(HBUG-035, 2026-09-29):** [대본 적용·정보 공개·검증 기록](STORY_REWRITE_IMPLEMENTATION_NOTES.md). `story-content.js` v6가 진입/결말·현장 사건·장부·구조·협력 대사를 제공한다. 맵 JSON의 사건 조건/행동은 유지하고 `eventLines`에서 캠페인 문장만 교체한다. 사용자 작성 사건의 문장은 보존한다. `story.js`는 `storyId`로 큐를 나눈다. HBUG-041부터 모든 사건은 즉시 정지 대사로 읽으며 과거 `delivery:'banter'`/`waitForClear` 저장 큐도 같은 방식으로 복원한다. 승리 시 예약된 비전투 증언과 미처 읽지 않은 도입 설명을 결말 앞에 연결한다. 장부는 문서 두 쪽이며 대화/페이지는 기존 `honroStory`에 저장한다. `profile.honroNarrative`의 장면 기록은 열람만 하며 보상·상호작용을 재실행하지 않는다. 소단의 외부 증원이 성공해야 `sodanCoop`를 확정한다. 담허 2 완료/휘겸 5 완료 합류, 소단 1막 미해금, 기존 성장·저장 유지. 회귀는 `npm run test:story`. 병렬 스킬 작업과 구분한 전체 검증 범위는 위 구현 기록을 따른다.

RC21 + Workshop 통합 이후 활성 런타임은 `shared/runtime`, 엔진은 `shared/engine/src`, 맵은 `shared/data/campaign.json`이다. [루트 아키텍처](../../ARCHITECTURE.md)와 [검증](../../VALIDATION.md)을 먼저 확인한다. 구 stage-maps/world는 migration/legacy의 비교 원본이다. 게임·편집기·Playtest에 별도 구현을 추가하지 않는다. BGM은 외부 assets/bgm 파일을 참조하므로 HTML과 함께 배포한다.

**허공터 전투·조준·기예 최신 기준(HBUG-034, 2026-09-28):** [요청별 동작·검증](FIELD_POLISH_2026_09_28.md). 새 허공터는 5600×2300, 물·고저차·파괴 발판과 HP 130~265의 적 12마리를 사용한다. `practiceCombat:true`이면 일반 전투의 이동·충돌·소환·적 AI/턴을 그대로 실행하고 적은 턴마다 최대 2명 행동한다. 아군은 HP 1을 유지하며 사망하지 않는다. 죽은 적은 자동 부활하지 않고 새로고침으로 복구한다. 다음 아군 턴에 기력·재사용 대기·이탈보 제한을 복구한다. 구형 독립 practice 검사에서만 기존 즉시 리셋 경로를 유지한다.

조준선은 화면 픽셀 두께·점선 간격을 유지한다. 산개사/칠성추혼의 화면 예상만 대표 경로 하나로 제한하며 칠성추혼은 분열 뒤 가운데 화살의 추적 궤적을 잇는다. 화살은 절명/곡사/강궁별 몸체와 촉을 구별한다. 전로시는 현재 투사체를 복제한 실제 선회/비행 계산으로 실시간 예상 경로를 표시하고 발사 버튼/E가 동일 목표로 선회한다. 선회 명중 추가 피해는 경지별 30~65%다. 빙호 지연은 충전량별 3.2~6.4초로, 발사 투사체에 저장하고 예상에도 반영한다. 아래 HBUG-032의 이전 2.4초보다 우선한다.

기파는 정적 qi 에셋 대신 움직이는 기류를 그리며 접촉점의 `qiBurst` 한 번만 표시한다. 파문/호리병은 속성별 움직이는 잔광·입자를 사용한다. 화호/연폭호의 `fireBloom`과 기파 폭발은 화면 시간 0.85/0.55초로 배속과 분리한다. 연폭호 후속 폭발은 첫 폭발 주위 반경 240의 공간에 무작위 배치하며 지면에 붙이지 않는다. 축지진목은 첫 설치부터 출발/도착 한 쌍을 만들며, 도착 좌표가 막히면 근처 안전 지면을 찾는다. 턴당 사용 제한·기존 저장·성장은 유지한다. `tests/field-polish.mjs`, `tests/field-polish-browser.py`는 전체 verify에 포함된다.

**연속 수련·파문/번개 최신 기준(HBUG-033, 2026-09-27):** [후속 보고서](SKILL_EFFECTS_2026_09_27.md). 허공터는 공격 종료 시 재사용 대기와 이탈보 제한을 제거하여 같은 기예를 바로 재사용한다. 캠페인 제한은 유지한다. 원호파(M03)는 첫 적/지형 접촉에서 폭발하고, 접촉 순간 속도에 수직으로 충돌 지점의 양옆에 원호를 펼친다. 팔괘파(M15)는 팔각형 외곽을 예상·실제 VFX·명중 판정에 공통 적용한다. 예상 도형은 옅은 점선, 실제 파문은 0.9초 붓결/잔광, 명중 효과는 0.8초, 뇌호/천뢰호는 0.9초 분기 번개다. 새 효과만 실시간 `visualDt`를 사용하여 배속으로 짧아지지 않으며 정지는 유지한다. 옛 비행 중 원호파의 phaseMode도 실제 스텝에서 복구한다. 스키마·성장 초기화 없음. 이번 요청의 원호파/팔괘파 동작이 최초 명세보다 우선한다.

**허공터·기예 후속 기준(HBUG-032, 2026-09-27):** [후속 보고서](SKILL_POLISH_2026_09_27.md). 허공터는 `training.js`/`training.css`의 초상·계통 카드·경지 1~8 선택을 사용한다. `main.js`의 두 전투 준비 경로에서 rank=8을 강제하지 않는다. 서사 설명은 `skillLore.ts`, 수치는 공통 `skillEffectRows()`에서 관리한다. 화살 예측은 복제 전투의 실제 projectile 스텝을 사용하며 원본 RNG·피해·지형을 변경하지 않는다. 빙호는 2.4초 후 폭발하고 적과 지형에 반사한다. 명중음은 피해/보호막 흡수 경로에서 발생한다. `drawStakes`에 Scene 시간을 전달해야 진목 부적과 잔광이 움직인다. 후속 단위/브라우저 회귀도 `npm run test:skills`와 전체 verify에 포함된다. 이 후속 요청은 개편 명세의 이전 빙호 1.6초 수치보다 우선한다.

**설오·담허 기예 최신 기준(HBUG-031, 2026-09-27):** [개편 보고서](SKILL_REDESIGN_IMPLEMENTATION_REPORT.md)와 [명세](HONRO_SKILL_REDESIGN_SEOLO_DAMHEO.md)를 함께 읽는다. 평사/기파는 무료 기본기이며 각각 3×5 사용 기예 + 5 상시 기예다. 여섯 계통 비기는 `capstone:true`로 Lv.1~8 성장하며 전역 ultimate 해금과 분리한다. 정의는 `skillRedesignData.ts`, 공통 판정·저장 이전은 `skillMechanics.ts`, 회백색 파문·도자기·목재 표현은 `skillVisuals.ts`에 있다. 적/NPC는 기존 LAxx/LMxx 정의를 사용한다. 플레이어 새 작성 피해에는 balance factor를 적용하지 않는다. `HeroProgress.skillRevision=1`, `Battle.skillRevision=1` 이전의 설오/담허만 배분을 환원하며 XP·통계·미완료 전투 진행과 휘겸/소단 배분은 보존한다. 기존 ranks를 새 ID 의미로 직접 해석하거나 marker를 지우지 않는다. 진목은 summon이 아니라 `Battle.stakes`, 이탈보는 aim+retreat 플래그다. E와 모바일 context 입력은 공통 interactions 경로를 사용한다. `npm run test:skills`는 두 HTML 빌드 후 실행하며 전체 `npm run verify`에도 포함된다.

BGM 현재 곡은 `main.js`의 `updateMusicLabel()`이 실제 재생 스트림의 파일명으로 표시한다. 우측 하단 9px 표시이며 음소거·일시정지 때는 숨긴다. 스테이지 도입 대사도 전투 상태이며, 3·6·8·10은 활성 중간/최종 보스로 인해 진입부터 05를 선택한다. 메인 테마 잔류 점검과 실제 MP3 검증은 HBUG-028을 참고한다.

**BGM 전환 최신 기준(HBUG-030, 2026-09-26):** 새 `Battle.session`(다음 스테이지·재시도)은 마지막 일반 전투곡의 다음 곡으로 넘어간다. 곡이 끝나도 02→03→04→02 순환하며, ESC·설정·같은 전투 저장 재개로는 순서를 넘기지 않는다. 보스 전용 전투는 일반곡을 추가 소비하지 않는다. 음악 상태는 `screen==='battle' && engine`을 기준으로 하며 won/lost/done만으로 메인 테마를 선택하지 않는다. 대사·결과창·결과창 ESC 닫기는 전투곡을 유지하고 실제 비전투 화면으로 나갈 때 01로 돌아간다. 2026-09-28 후속 요청으로 ESC·전투 설정에서도 같은 스트림을 계속 재생한다. 숨겨진 탭만 재생 시각을 보존하며 멈춘다. 모달 닫기 중 engine이 비어 있는 재시도 준비 구간에서는 main을 고르지 않는다. 재마운트가 완료된 뒤 동기화한다. 순서와 재생 시각은 앱 메모리에만 유지하고 기존 저장 스키마는 보존한다. 회귀: `tests/audio.mjs`, `tests/audio-browser.py`, `tests/bgm-transitions.py`.

**Stage 1·2 현재 지형은 2026-09-25 목업 개편판이다.** `workshop/recipes/stage12-forest-basin.js`와 실제 Workshop 명령/내보내기로 작성했다. 1은 4200×2200 숲길·가지 2개·물 1곳, 2는 4300×3300 분지·가지 5개·물 3곳이다. 상여는 바닥 x=1240→3340으로 이동한다. 아래 과거 RC 지형 수치보다 이 작성 데이터가 우선한다. 상세 화면과 검증은 [개편 기록](STAGE12_REDESIGN.md), 회귀는 `tests/stage12-redesign.mjs`에 있다. 기존 저장 Battle은 강제 지형 이전 없이 유지한다.

매립 바위에서는 유효 지지면이 없는 다음 보행 위치의 발끝도 고체 침투 검사에 포함한다. 물 재질은 `conductive:true`로 실제 Water에 연결하며 바닥 높이 아래 유닛에는 전도하지 않는다. 배경 나무는 충돌을 갖지 않는다.

개별 증상·원인·검증은 [BUG_LOG.md](BUG_LOG.md), 이전 큰 수정의 수치와 화면은 [GAMEPLAY_FIXES.md](../reports/GAMEPLAY_FIXES.md)에 있다. 현재 코드가 달라졌다면 확인한 변경에 맞춰 이 문서를 갱신한다.

## 범위와 실행 구조

메인 플레이 파일은 루트 [HONRO.html](../../HONRO.html)이다. `file://`에서 서버·외부 요청 없이 동작한다. 디자인 시연 `HONRO_Archer_Preview.html`을 실제 게임 검증으로 대신하지 않는다.

| 영역 | 현재 소스와 역할 |
|---|---|
| 앱·입력·결과·대사·저장 연결 | [main.js](../../shared/runtime/main.js), [ui-bridge.js](../../shared/runtime/ui-bridge.js) |
| 대화 정지·포커스·재개·턴 배너 | [story.js](../../shared/runtime/story.js), [presentation.css](../src/presentation.css) |
| 도입·월드맵 이야기 / 교체 가능한 초상 | [story-content.js](../../shared/runtime/story-content.js), [story-portraits.json](../config/story-portraits.json) |
| 스테이지 내용·목표·합류 시점 | [content.js](../../shared/runtime/content.js) |
| 지형·초기 유닛·이벤트 정의 | [world.js](../../shared/runtime/world.js) |
| 열린 교전 지형·5/6/7 배치·기존 저장 이전 | [battlefield-layouts.js](../../shared/runtime/battlefield-layouts.js) |
| 지형 압축·기존 저장 보정·초기 배치 | [stage-rules.js](../../shared/runtime/stage-rules.js) |
| 생성 위치의 몸 전체 충돌·간격 검사 | [terrain-space.js](../../shared/runtime/terrain-space.js) |
| 이벤트 조건·의존성·필수 증원·재시도 | [encounters.js](../../shared/runtime/encounters.js) |
| NPC 행동·증원 실행 | [allies.js](../../shared/runtime/allies.js) |
| 위치 조건 감지·임무 상태 반영·상여 | [mission.js](../../shared/runtime/mission.js) |
| 전투 효과음 / 단일 WebAudio 출력 | [sound-design.ts](../../shared/engine/src/sound-design.ts), [audio.js](../../shared/runtime/audio.js) |
| 캠페인 XP·적 수치 | [progression.js](../../shared/runtime/progression.js), [balance.json](../config/balance.json) |
| 정량 난이도 계산 | [difficulty.js](../../shared/runtime/difficulty.js), [balance-report.mjs](../tests/balance-report.mjs) |
| 턴·공격·피해·낙하 | [engine.ts](../../shared/engine/src/engine.ts), [physics.ts](../../shared/engine/src/physics.ts) |
| 발 지면 탐색·보행 | [locomotion.ts](../../shared/engine/src/locomotion.ts) |
| 기존 XP 곡선·스킬·세이브 구조 | [progression.ts](../../shared/engine/src/progression.ts), [data.ts](../../shared/engine/src/data.ts), [store.ts](../../shared/engine/src/store.ts) |
| 화면 좌표·카메라·실제 유닛 그림 | [renderer.js](../../shared/runtime/renderer.js), [art-dark.js](../../shared/runtime/art-dark.js), [hud.css](../src/hud.css) |
| 생성 HTML의 실제 구성 | [build.mjs](../build.mjs), [engine/build.mjs](../engine/build.mjs) |

`game/build.mjs`가 TypeScript 엔진과 앱 모듈, 에셋을 inline한다. 일부 CSS·여정도·아이콘·타이틀은 보관용 handoff에서 읽는다. 그 영역을 바꿀 때는 필요한 소스를 활성 디렉터리로 옮기고 빌드 참조도 함께 바꾼다. 원본 0.6.8 HTML이나 생성 HTML에 수정 블록을 덧붙이지 않는다.

## 유지할 동작과 확인할 경계

- **카메라**: 월드보다 뷰포트가 넓으면 맵을 가운데 놓는다. 최대 줌아웃 배율은 현재 0.16이다. 맵 바깥 배경 지형은 시각 전용이다. 9/15 사용자 요청으로 대화 중에는 화자에게 포커스를 강제하며, 장면 종료 시 이전 수동 카메라 상태를 복원한다. 실시간 플레이의 카메라와 구분한다.
- **스테이지 2 지형**: 세로 0.7배 변환은 y/h뿐 아니라 slope와 관련 좌표에도 적용한다. `honroGeometryRevision=2`와 `honroGeometryReady`로 예전 저장 보정과 최초 배치를 구분한다. 재마운트 때 살아 있는 유닛을 반복적으로 순간이동시키지 않는다.
- **생성**: 비행 몬스터를 땅에 내려놓지 않는다. 몸 전체·경계·유닛 간격을 확인하고 공간이 없으면 보류한다. 여러 그룹 생성은 모두 배치 가능할 때 반영해 일부 생성 후 재시도로 중복되는 일을 막는다.
- **이벤트**: 위치·적 수·라운드 조건이 충족되면 즉시 증원/행동과 대사를 실행한다. `pendingEvents`는 이미 열린 대사·배치 실패·생존 상한으로 실행할 수 없는 사건을 보존한다. 한 번의 flush에서 전투 증원 한 묶음, 성공 후 flags 확정, 선행 사건·사망 화자 검사는 유지한다. 주변 적이나 미실행 증원만으로 목표 완료를 막지 않는다. HBUG-009의 턴 경계 전용 정책은 폐기했다.
- **스토리**: 대화 중에는 앱의 물리 tick·임무 tick·이동·충전 입력을 멈춘다. 턴 배너의 정지 구간은 아군 0.25초·자동 행동 진영 1초이며 배너 전체 표시 시간과 별개다. 프레임 누적도 비워 재개 때 시간이 몰리지 않는다. `storyQueue`는 즉시 장면으로 열고, 도입·승리 후 대사·월드맵 장면은 별도 진입점이다. 초상은 설정 이미지가 우선이고 없으면 현재 인게임 캐릭터를 그린다. `art-dark.js`가 실제 `Scene.unit/human`을 덮어쓰므로 베이스 렌더러만 고치고 끝내지 않는다.
- **화자**: 실제 아군/NPC의 생존 상태를 본다. 적 클래스가 mage라는 이유로 담허로 취급하지 않는다. 사망한 배우의 예약·현재·신규 대사와 행동을 중단한다. 승리 문구와 기록에도 같은 조건을 적용한다.
- **대화 배치**: 하나의 패널 안에 왼쪽 상반신 초상, 오른쪽 이름·대사·버튼을 둔다. 인게임 대체 초상은 `story.js`에서 머리 장식을 포함해 상반신으로 자른다. 이미지 초상의 확대는 설정 `imageZoom`으로 조정할 수 있다(기본 1.65, 이미 상반신인 이미지는 1).
- **보행**: 도착 x의 노출된 지면을 사용하고 작은 구간으로 이동한다. 걸을 수 없는 급경사를 지지면에서 제외해도 그 면의 고체 충돌을 무시해서는 안 된다. 겹친 절벽 안의 바닥은 지지면이 아니며, 급경사의 위쪽 법선도 낙하 충돌로 처리한다. 연결 보정은 폭 2.5px 이하·단차 3px 이하만 허용한다. 진짜 절벽·높은 벽·점프·이동력 소모는 유지한다.
- **소리**: 버튼 `click`은 무음. 화살·명중·폭발·직접 피해·NPC 베기 등 실제 엔진 이벤트를 단일 AudioContext로 재생한다. 최초 실제 포인터/키 입력으로 unlock한다. 낮은 감쇠 공명과 필터링한 타격 질감을 사용하며 기존 전자음·피치 스윕·승리 멜로디는 사용하지 않는다. 설정 음소거와 동시 음원 상한을 유지한다.
- **충전 표시**: 바깥 원은 현재 충전, 안쪽 원은 `b.lastShots[unit.id].power`의 이전 발사량이다. 실제 발사 전에는 이전 값이 없다. 캐릭터 전환 시 각자 기억한다. 궁사는 0.32초 안에 활을 들고 그 뒤 시위를 당긴다. 시각 상태는 리그 어댑터의 WeakMap에 두며 게임 좌표·탄도에는 쓰지 않는다.
- **캐릭터 표시의 현재 연결**: 상단의 v007 제작 기준을 따른다. `party.v006.runtime.js`는 고정 비교 원본으로만 읽으며 게임은 `party/party.runtime.js`와 `party-rig.js`, 기존 `rebuild-game-adapter.mjs`를 사용한다. 260916 compact 설오는 디자인 검수에서 거절되었으므로 자동 재적용하지 않는다. 이번 v007은 사용자가 다시 요청한 네 캐릭터 개선으로 v006의 정체성과 크기를 유지한다. 캐릭터별 투사체와 엔진 상태는 그대로다.
- **저장**: 성장 지급 기록은 `profile.honroGrowth`, 전투 상태는 `profile.honroBattle`에 연결된다. 실패·재시도·재개에서 보상이 중복되거나 마이그레이션이 반복되지 않는지 본다. 사용자의 기존 초과 XP는 회수하지 않는다. 현재 import는 schema 1–4를 허용한다. `honro-first-act-profile-1`은 현재 localStorage 키다.
- **새 저장 맥락**: 전투 대화는 `b.honroStory`, 월드맵 재개 위치는 `profile.honroMapStory`, 읽은 맵 장면은 `profile.seen`에 저장한다. 이전 지형 침투 버그로 발이 고체 안에 있는 저장만 `honroContactRevision=1` 보정으로 유효 지면에 한 번 복구한다. 정상 낙하·점프·지면 위 좌표는 변경하지 않는다.

수치는 확인된 현재 기준이며 영구 불변 규칙은 아니다. 사용자 요청으로 바꾸면 관련 설정·검증·문서를 함께 갱신한다.

## 접촉 복구와 행동 제한 안내

2026-09-19 [장례문 끼임·상태 안내 보고서](STAGE8_CONTACT_STATUS_2026_09_19.md). `integrateBody`는 머리/몸통뿐 아니라 **발끝의 이동 경로**도 수직 벽과 검사한다. 발 위 5 지점만 검사하면 낮은 턱에 발부터 침투할 수 있다. 착지 후보도 `terrainSurface`와 마찬가지로 다른 고체에 묻힌 표면을 제외해야 한다. 충돌 뒤에는 몸 탐침 반경 밖에 여유를 두어 반대 방향 이동을 허용한다.

`honroContactRevision=2`이며 `repairEmbeddedSave`는 로드 시 실제 침투를 검사한다. 이미 버전 2인 저장도 발이 고체 안에 있으면 복구하고, 유효 위치는 반복 이동시키지 않는다. 정상 낙하/점프, 몸체 투사체가 제어 중인 배우, 운반 중인 배우는 원래 상태를 유지한다. 체력·진행·상태이상은 보존한다. 이전 문서의 버전 1 단발 보정보다 이 기준이 우선한다.

행동 상태 문구는 `combat-status.js`에 모았다. `stun`은 턴 시작에 소비되므로 UI가 이 값만 보고 기절을 표시하면 안 된다. `stunnedRound===b.round && acted`는 기절로 현재 턴을 잃은 상태이고, `stun>0`은 다음 행동의 기절이다. `stunUntil`은 재기절 방지 시간이며 남은 기절 턴이 아니다. 결박은 이동량/비용을 바꾸지만 발사 자체를 금지하지 않는다. 하단 상태 줄·동행 칩·대상 정보는 공통 설명을 사용한다. 제한을 알리기 위해 실제 행동 권한이나 턴을 바꾸지 않는다.

검증: `node game/tests/stage8-lock.mjs`(기본 verify 포함), 빌드 후 `node tools/honro-vector-forge/tests/stage8-lock.mjs`. 엔진 비교 예외의 `newRound/switchTeam` 변경은 기절 턴 표시용 필드 기록만 허용한 것이다.

## 지형 배치의 기준

2026-09-18 [전 스테이지 공중 발판 조사](../reports/OPEN_TERRAIN_2026_09_18.md). 기본 경로는 **천장이 없는 연결 지면**을 우선한다. 위·아래를 넓게 덮는 긴 판이나 층층이 쌓인 발판을 이동 해결책으로 추가하지 않는다. `oneWay`도 일반 포탄을 막으므로 보행 가능 여부만으로 배치를 승인하지 않는다. 높은 곳과 낮은 곳 사이에서 일반 화살과 불씨의 양방향 실제 명중을 검증한다.

현행 5/6/7 지형은 `HonroLayouts.create`에 모았다. 5는 공중 발판 0개, 6은 폭 360의 독립된 다리 조각 3개(기본 점프로 도달하며 파괴 후에도 바닥 길 유지), 7은 공중 발판 0개와 최대 경사 1.2의 연속 오르막이다. 왕문 제단은 `(4950,1080)`, 매듭은 `(1775,3870)`, `(2900,2820)`의 지면 위다. 목표 안내는 실제 마커/지형을 참조하므로 좌표를 다른 곳에 다시 하드코딩하지 않는다. 1·2·3·4·8은 기존 지형을 유지했다.

`honroLayoutRevision=1` 이전 전투는 `stage-rules.js`에서 한 번 이전한다. 발사·낙하 중에는 보류하고 `App.missionTick`에서 다음 안전한 경계에 재시도한다. 현재 HP·턴·진행·파괴 기록을 유지하며 새 맵을 통째로 재시작하지 않는다. 이전이 끝난 뒤에는 매번 유닛을 땅에 붙이지 않는다. 왕문 신규 증원은 현재 지면을 기준으로 생성한다.

`node game/tests/terrain-audit.mjs`는 기본 verify에 포함된다. 이전 지형의 재현 입력은 `game/reports/terrain-before.json`이다. 모든 현행 맵의 발판 피복은 가로 범위 25% 이하, 같은 x에서 한 겹 이하, 개별 폭 400 이하를 검사한다. 새 배치가 필요하면 수치만 완화하지 말고 이동·상하 사격·목표 도달 근거를 함께 검토한다. 실제 화면/입력은 빌드 후 `node tools/honro-vector-forge/tests/terrain-layout.mjs`로 확인한다.

## 목표 안내와 적 투사체 템포

2026-09-17 [목표·공격 템포 보고서](../reports/OBJECTIVES_TEMPO_2026_09_17.md). `objectives.js`의 `state`가 **승리 판정과 진행 안내의 공통 기준**이다. 승리 판정을 `main.js`에 다시 중복 구현하지 않는다. `mission.js`는 HBUG-041부터 회수·구조·사건을 즉시 반영한다. 실패와 목표 안정화 시작 기록은 `main.js`에서 관리하며, 완료된 목표에는 전투 정리/동맹 턴 대기를 적용하지 않는다.

스테이지 진입 시 등장인물의 행동 설명과 목표 카메라 이동을 제공한다. 좌상단 목표는 재안내 버튼이다. 남은 목표를 화면/미니맵에 표시하고 다음 단계로 갱신한다. 대사 튜플의 선택 항목 `{focus: 'seal'|'shrine'|'exit'|'objective'|'relic'|'boss'}`를 `story.js`가 읽고 `renderer.js`가 초점을 맞춘다. 대사 정지·카메라 복원·저장 재개를 유지한다. 왕문 의식은 매듭 둘 파괴 후 살아 있는 휘겸의 발 좌표가 제단에서 330 미만 거리일 때 **아군 턴 종료마다 한 번**, 총 세 번 누적된다. 이탈은 누적을 초기화하지 않는다.

`Engine.stepProjectile`은 `honro` 전용 몬스터 탄 16종만 원래 물리 단계를 두 번씩 적용한다. 기존 진영 배속은 계속 적용되며 플레이어 탄은 제외한다. 해당 모드 수명은 물리 시간 6초, 실제 기본 속도 약 3초다. `predict`도 이 수명과 일치해야 한다. 피해량·소멸 전 궤적은 유지하지만 수명이 짧아져 극단적인 최대 비행 거리는 줄어든다. `game.mjs` 원본 비교 예외에 이번 승인 범위인 `predict`, `stepProjectile`을 추가했다.

검증: `node game/tests/mission-tempo.mjs`(기본 verify 포함), 빌드 후 `node tools/honro-vector-forge/tests/mission-tempo.mjs`. 새 목표 종류나 스테이지 추가 시 공통 상태·대사·표식과 판정 검사를 함께 추가한다.

## 전투 조작의 최신 기준

2026-09-15의 [조작·배속 수정](../reports/CONTROLS_2026_09_15.md) 후 최신 기준은 [충격·대상 정보 보고서](../reports/IMPACT_INSPECTION_2026_09_16.md)에 있다. 턴 정지는 **아군 0.25초·적군/동맹군 0.7초**, 메시지 표시는 **1.05초**다. 정지 여부는 `HonroStory.turnPaused`로 판정한다. 이때 시뮬레이션은 멈추지만 적군/동맹군의 다음 행동자에게 카메라를 이동한다. 소환귀→NPC 실행은 한 **동맹군 턴**으로 표시한다. 공격 후 확인은 적군·NPC·소환귀 모두 기준 **0.65초**, 설정 배속을 적용한다. NPC `fire` 후에는 전역 상태를 `ally`로 유지해 동맹 큐가 비행과 확인까지 담당한다.

플레이어 충전은 실제 누름 시간당 초속 **480** 증가, 최대 **5초**다. 조정 상수는 엔진 `balance.ts`, 계산/실제 발사·예측은 `Engine.chargeDuration/chargePower/velocity`가 담당한다. 현재 최대 사거리 수치와 적/NPC의 기존 파워 보정은 유지한다. `controls.css`가 HUD의 고정 62px 스킬·동심 충전 원·대칭 행동 버튼·18px 수치 바·모바일 메뉴를 정의한다. 체력·기력·**이동력**은 같은 스타일의 바와 현재/최대 숫자다. 미니맵에는 포인터 캡처 드래그가 있다.

걷기 주기는 `rebuild-game-adapter.mjs`의 `WALK_CADENCE`에서 캐릭터별 **120~132보/분**으로 정한다. `Scene.render`의 실제 시간과 효과용 시뮬레이션 시간을 구분한다. 이동 성능을 유지하므로 기존 발의 월드 픽셀 고정 조건은 완화됐으며, 보폭/맵 축척 결합은 후속 개선 범위다. 공격·피격은 기존 배속 시간, 보행은 실제 시간으로 표시한다.

합류 XP는 `HonroProgression.recruit/repairRecruits`가 프로필과 전투 기록 모두에 반영한다. 담허 3·휘겸 6레벨, 미래 동료는 콘텐츠 `joinLevel` 또는 해당 성장 계획의 완료 레벨. 완료 전투에서 `profile.heroes`를 다시 복사하지 않는다. 저장 보정은 이미 합류한 동료에게만 최소 합류 XP를 보충하고 더 높은 XP·기예와 사망 상태는 유지한다.

검증은 `node game/tests/charge-audit.mjs`, `node game/tests/party-pacing.mjs`(둘 다 기본 verify 포함)와 빌드 후 `node tools/honro-vector-forge/tests/controls.mjs`, `node tools/honro-vector-forge/tests/party-pacing.mjs`를 사용한다. 보행 어댑터는 `node --test tools/honro-vector-forge/tests/rebuild-adapter.test.mjs`. 기존 `game.mjs`의 엔진 원본 비교 예외에 승인된 충전/동맹 변경인 `velocity`, `fire`, `stepSummonTurn`이 포함되어 있으며 새 동작은 전용 검사로 검증한다.

최신 충격·정보 표시(2026-09-16): `integrateBody`의 지면 지지는 하강 속도 0~3일 때만 성립한다. 빠른 착지의 속도를 먼저 0으로 만들면 기존 `contactDamage`가 누락된다. 충격 수치는 `physics.ts`, 회귀는 `game/tests/impact-audit.mjs`(기본 test 포함)에서 관리한다. 정지/일반 점프와 AI의 silent 탐색은 무피해로 유지한다.

적·동맹·소환귀 정보는 `unit-info.js/css`의 `HonroUnitInfo`가 담당한다. `scene.hoverUnitId/inspectUnitId`는 표시 전용이며 `battle.active`와 분리한다. `art-dark.js`의 `unitBody`가 그림자/HUD를 제외한 현재 포즈를 제공한다. 대화/모달·사망 시 닫고 클릭과 드래그를 구별한다. 검증: `node tools/honro-vector-forge/tests/unit-info.mjs`. 카드와 호버는 저장하지 않는다.

2026-09-16 [HUD·비행·AI 변경](../reports/HUD_TACTICS_2026_09_16.md): 자원 바는 모든 화면에서 **같은 너비 3열 한 줄**이다. `controls.css`에서 라벨은 1열, meter는 2열로 명시해 기존 가로 모바일 CSS의 라벨 숨김 영향을 막는다. 미니맵은 **우상단 헤더 아래**이고 화면 높이로 최대 크기를 제한한다.

박쥐·까마귀·등불귀는 `enemyAI.ts`의 `flyingEnemy/planFlight/advanceFlight`를 사용한다. 중력 방지 `fixed`를 유지하면서 해당 3종만 이동 경로에 포함한다. 최대 280 거리/턴, 180 거리/초, 사선·거리 개선 후보 평가, 전체 몸의 연속 충돌 검사. 다른 고정 유닛을 이동시키지 않는다. 기존 `aiMove`와 `moveLeft`로 재개하므로 별도 세이브 마이그레이션은 없다.

AI 공격 선택은 `shotImpactValue/shotViable`를 공통 사용한다. 첫 충돌 기준 예상 상대 피해가 아군 손실×1.15보다 충분히 클 때 혼합 타격도 허용한다. 아군 사망 예상 비용은 1.8배. NPC의 기존 같은 편 피해 면제를 계산에 반영하되 실제 피해 규칙을 바꾸지 않는다. 목표가 막히면 다른 가까운 목표 최대 2개를 추가 시도한다. NPC 파워 .82 상한은 예측 시점에 적용해 실탄과 일치시킨다. 후속 파편·지연 효과·밀침 낙사는 정밀 예측하지 않는다. 검증은 `game/tests/tactics-audit.mjs`(기본 verify 포함), 빌드 후 `tools/honro-vector-forge/tests/hud-tactics.mjs`다.

## 성장·난이도의 합의된 기준

- 최대 레벨 25, 1막 종료 약 10, 4막 초중반 25를 목표로 한다.
- 현재 콘텐츠는 **1막 8개 스테이지**다. 종료 목표는 `2 → 3 → 4 → 5 → 6 → 7 → 8.5 → 10`. 8.5는 8레벨 XP 바의 절반이다.
- 후속 막은 각각 8스테이지로 가정한 데이터다. 2막 종료 16, 3막 종료 22, 4막 세 번째 스테이지 25, 이후 25 유지. 아직 플레이 콘텐츠로 구현된 것은 아니다.
- 기존 XP 곡선을 유지하며 스테이지별 성장량의 40%를 전투 XP 예산으로 둔다. 피해와 처치는 같은 적의 한 예산을 공유한다. 참가 파티에 공유하고, 최초 완료 시 목표 누적 XP까지 보충한다. 재시도 지급량을 저장하고 완료 스테이지의 반복 XP를 막는다.
- 난이도는 단순한 적 레벨 대신 기준 궁사의 명중 횟수, 기준 영웅 HP 대비 한 발 피해, 초기 적 수, 동시 행동 수, 동시 생존 상한으로 조정한다. 역할·보스·난이도 배율을 포함하며 현재 기준 공격의 스킬 랭크 가정도 확인한다.
- 수치 원본은 [설정](../config/balance.json), 계산 결과는 [balance.json](../../_local/game-reports/balance.json), [progression.json](../../_local/game-reports/progression.json), [전체 성장 CSV](../../_local/game-reports/level-schedule.csv)다. 보고서의 수치를 직접 수정해서 검사를 통과시키지 않는다.

## 변경에 맞는 검증

Node 22 이상과 설치된 Chrome/Edge/Chromium을 사용한다. 명령은 저장소 루트에서 실행한다. PowerShell은 `npm.cmd`, 다른 셸은 `npm`을 쓴다. 두 프로젝트의 `node_modules`가 없을 때만 각각 `npm.cmd --prefix game ci`, `npm.cmd --prefix tools/honro-vector-forge ci`로 준비한다.

| 변경 | 명령과 목적 |
|---|---|
| 지형·보행·스폰·이벤트·XP | `node game/tests/regressions.mjs` — 실제 소스 엔진을 로드하는 재현 검사 |
| 스테이지 2 실제 지형 보행 | `node game/tests/movement-audit.mjs` — 노출된 지형 3위치·양방향·3개 dt, 540조건 고체 침투 검사 |
| 효과음 품질 기준 | `node game/tests/audio-audit.mjs` — 17음원 파형·저역 에너지·무음 버튼, WAV 청취용 모음 생성 |
| TypeScript 엔진 | `npm.cmd --prefix game run typecheck` |
| 성장·적 수치·스테이지 수 | `node game/tests/balance-report.mjs` — 정량 예산과 목표 레벨 |
| 게임 검증 묶음 | `npm.cmd --prefix game run verify` — 타입·회귀·보행·음원·예산 |
| 소스 변경을 플레이 파일에 반영 | `node game/build.mjs` — 아래 브라우저 검사보다 먼저 실행 |
| 실제 메뉴·이동·공격·턴·오프라인 | `node tools/honro-vector-forge/tests/game.mjs` |
| 카메라·죽은 NPC·증원·완료·XP·모바일 | `node tools/honro-vector-forge/tests/game-bugs.mjs` |
| 대화·저장 재개·턴 경계·충전·실제 음 출력 | `node tools/honro-vector-forge/tests/presentation.mjs` |
| Forge나 그래픽 연결도 바꾼 경우 | `npm.cmd --prefix tools/honro-vector-forge test` — 현재 전체 묶음은 게임 검사도 포함 |
| 빌드·export 재현성이 관련된 경우 | `npm.cmd --prefix tools/honro-vector-forge run repro` — 전체 제작을 다시 실행하므로 생성물을 읽는 브라우저 검사와 동시에 실행하지 않음 |

`tests/game*.mjs`는 현재 기본 Chrome 경로 또는 `HONRO_BROWSER`를 사용한다. 다른 브라우저가 설치돼 있으면 실행 파일 경로를 환경 변수로 전달한다. 일반 테스트를 위해 사용자에게 열린 게임의 저장을 지우지 않는다.

2026-09-14 수정 완료 시 회귀 44개, 실제 게임 브라우저 20개, 버그 브라우저 17개, Forge/시연 30개가 통과했다. 합계 111개는 당시 결과이며 앞으로 고정해야 할 개수가 아니다. 타입 검사, 8스테이지 예산, 산출물 17개의 재빌드 일치도 확인했다. 이번 작업 결과는 실제 재실행한 명령으로 별도 기록한다.

2026-09-15의 경사 재발·소리·스토리·턴 경계·충전 변경은 [이번 검증 보고서](../reports/PRESENTATION_GAMEPLAY_2026_09_15.md)에 기록한다. 향후 전체 캠페인 자동 진행 테스트는 대화창을 명시적으로 넘겨야 한다. 사용자 진행을 흉내내는 테스트에서 이야기 정지를 제거해 타임아웃을 피하지 않는다.

자동 적 제거로 이벤트 조건을 만든 검사는 정상 조작으로 전체 캠페인을 클리어했다는 증거가 아니다. 전체 플레이 시간, 체감 난이도, 실기기 터치·성능, 모든 특수 기예 조합은 추가 검증 대상이다.

## 기록 유지

수정 작업이 끝나면 [BUG_LOG.md](BUG_LOG.md)에 재현 조건·원인·수정·검증·한계를 기록한다. 구조나 목표가 바뀌면 이 문서도 수정한다. 상세 로그와 스크린샷은 Git에서 제외된 `_local/game-reports/`, `_local/reports/`에 두고 링크한다. 현재 동작의 명세와 계속 필요한 설명은 `game/docs/`에 남긴다. 특정 버그의 과거 증거를 새 실행 결과처럼 덮어 쓰지 않도록 날짜와 변경 범위를 남긴다. 2026-09-28 이전 RC 패치 문서와 배포 자료는 로컬 `_local/archive/`로 옮겼으며, 패키지에 원래 없던 과거 보고서 링크는 역사 기록이다.
