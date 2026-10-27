# 혼로 장비52 구현 인계 요약

이 파일은 코드가 아니라 확정 설계의 짧은 인계다. 실제 코드 수정·빌드·Pages 배포는 기존 담당 세션이 수행한다.

## 입력과 범위

- 기준 데이터: `honro_equipment_52_v03.json`. 읽기용 동등 문서: 같은 이름의 HTML/MD.
- 전용32(4명×8)+공용20=52. 티어마다13. 기본 지급4개는52 안에 포함.
- 고정24개+2택1 여덟 사건+3택1 네 사건=회차 최대36. 모든20,736개 선택 조합을 데이터 수준에서 검사했다.
- 1–3막 공개 콘텐츠에 연결할 정의31개/회차 최대23. 4막 잠금8개를 더하면1–4막39개/최대29. 5–6막13개는 비활성 예약.
- 31/35/36은 초기미리보기일 뿐이다. `officialAct4`가 열리기 전에 정상 보상으로 주지 않는다. 아직 없는4막 NPC/정예/영역은 제작 대상이지 구현 완료가 아니다.
- 아이콘 itemId·이름은 고정. `icon_briefs_all52.json` 사용. 물건 그림이며 전투 스킬 장면을 그리지 않는다.

## 기존 코드에 연결할 곳

주 읽기 기준 bdb6fe6f, 저장/분할/방어의 독립 검토 기준039f342. 최신 작업과 충돌 여부는 담당 세션에서 확인한다.

- `shared/engine/src/progression.ts`: heroStats/applyHero. 장비 없는 기저와 보정 분리. 성장/레벨업 적용에도 장비ID가 유지돼야 한다.
- `shared/engine/src/engine.ts`: manaCost/effective, jumpCost/jump, applyHit, applyCurse, spawnSummon/expireSummon.
- `shared/engine/src/skillMechanics.ts`: 낙차/관통/밀침/A06 회수, 진목 생성·M10 회복, M03 geometryBoost.
- `shared/engine/src/warriorMechanics.ts`: S02 실제HP 비용 비례 항.
- `shared/engine/src/damageVariance.ts`: 기존 rollDamage 표본/seed/index 재사용.
- `shared/engine/src/store.ts`: 저장된 damageRoll 허용범위와 장비 정의 검증.
- `shared/runtime/profile-store.js`, `main.js`: 단일 저장 writer, 보상/선택 commit, 쉼터 UI 연결.
- `shared/runtime/split-campaign.js`: snapshot/restore/outcome의 장비ID/최대치/현재치 일치.
- 기존 성장/기예 UI를 재사용한다. 새 SaaS 대시보드나 전투중 장비창은 만들지 않는다.

## 반드시 지킬 실제 코드 주의점

1. applyHero와 split restore가 최대치 증가분으로 HP/focus/moveLeft를 올린다. 장비 착탈에는 이 경로를 그대로 쓰지 말고 세 현재값의 절대값 유지·감소시 clamp만 한다. 기존 성장/레벨업 의미는 보존한다.
2. App.persist()는 성공시에도 undefined다. 선택 commit은 profileStore.save(candidate)의 boolean을 받는 어댑터를 써 저장 성공 뒤 app.profile/normalProfile을 교체한다.
3. 코어 revision13을 장비 때문에14로 올리지 않는 안을 우선한다. equipment.schema1+캠페인 schema5로 확장한다.14로 올리려면 store.validate의 [4..13].includes 성장/튜토리얼 분기까지 모두 다뤄야 한다.
4. 방어무시는 guard 방향방어 결정 뒤, ward .32 floor 앞에만 적용한다. S02 .65는 기존 위치다. 보스/중간보스/Act2Boss/FinalBoss/목표 객체는 제외한다.
5. O06은 공용 curseTurns를 쓰므로 기간을 늘리지 않는다. 여운매듭은 공격약화12→15%이며 방어약화·기간 불변이다.
6. M03은 새 반경 규칙이 아니라 geometryBoost 두께+20%/위력−10%다. 미리보기와 실전 같은 helper를 쓴다.
7. 요동추의 roll은 .78~1.28, 평균1.03, 진폭.25다. 기존 저장 허용 .85~1.15를 함께 고치고 이미 저장된 roll을 재추첨하지 않는다. 새 난수 원장은 불필요하다.
8. 파진목·반향령은 생성시 라운드 만료만+1. 반향령 ECHO_LIMIT, 파진목 usedRounds를 보존한다. 로드/재장착으로 재연장하지 않는다.
9. 공용 소품 실물은 파티에 하나다. 분할 원정 중 장착 변경을 잠그고 합류한 휴식터에서만 교환한다. 전투 스냅샷에는 두 장착ID만, 소유/선택 원장은 프로필 하나에 둔다.
10. 기본 치명배율 최대 합은+.20이다. 다른 실제 기본옵션 최대는 데이터의 basicOptionMaximaFromAllLegalPairs를 사용한다.

## 보상과 저장

- 획득은 드롭 오브젝트가 아닌 성공 사건 메시지: 아이콘+이름+얻었다/발견했다.
- 고정 보상과 선택 화면을 구분한다. 강제 입력/비행/대사 중에는 사실을 큐에 보존하고 안전 경계에 띄운다.
- 선택 전 대안을 모두 비교하고 “이번 회차 하나만/취소 불가/미선택 회수 불가”를 확인 버튼 위에 표시한다.
- rewardLedger는 eventId 단위 eligible/pending/committed와 선택 itemId를 보존한다. 미결정은 자동 선택하지 않고 재접속 후 같은 대안을 유지한다.
- 중복 클릭·재처치·장 재도전·옛 battle 체크포인트는 committed event를 재지급/재선택하지 않는다.
- 과거 필수 클리어/합류 보상은 정책상 소급, 선택은 pending. 선택 정예/수문/숨은 도달은 클리어만으로 소급하지 않는다. 기존 전투에는 자동 장착하지 않는다.
- 디버그 인벤토리52개/4막미리보기 획득을 정상 프로필에 쓰지 않는다.

## 필요한 최소 확인

데이터 검사 후2택1/3택1의 취소·재접속·확정·이중탭·저장실패, 휴식터 공용품 이전/착탈 회복 방지,4막 잠금/디버그 분리, 대표 정예·도달 이벤트를 확인한다. 효과는 바뀐 helper별 대표만 검사하고 전체30장 순회나 새 대형 검수 체계를 기본 요구로 만들지 않는다.

장비 기능·아이콘 제작·코드·원격 반영·Pages 확인은 각각 완료 여부를 구분해 보고한다.
