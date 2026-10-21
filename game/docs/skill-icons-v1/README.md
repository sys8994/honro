# 전체 기예 이미지 아이콘 v1 준비

상태: **부모 이미지 공급 대기. 이미지 제작·편집·SOP 작성·최종 미술 승인은 부모 담당. master 병합 및 배포 금지.**

브랜치: `feat/all-skill-image-icons`. 시작 master: `be798268` (원격 fetch 결과 이후 변경 없음).

## 확정 목록과 범위

`inventory.json`은 원시 data.ts 선언이 아니라 실제 엔진의 `installOccultRedesign` → `installSkillRedesign` → `installWarriorSkills`, `content.js`, `main.js`의 HONRO 초기화 코드를 실행한 결과다. 이름·서사 설명과 실제 플레이 설명을 따로 보존하고 실제 정량 효과를 경지 1/8에서 추출한다. 재추출: 저장소 루트에서 `node tools/skill-icons/inventory.mjs`.

현행 플레이어 기예는 **84개 = 기본기 4 + 습득 사용 기예 60 + 상시 기예 20**. 동행당 21개다. HONRO 화면 순서는 **설오(archer), 담허(mage), 휘겸(knight), 소단(occultist)**. core `CLASS_IDS`는 담허부터 시작하므로 혼동하지 않는다. 각 동행은 기본기 다음 실제 TALENTS의 계통/행 순서로 수록한다.

**현재 ultimate 플래그는 0개, capstone 비기는 12개**다. A99·M99는 옛 궁극기 이름/효과를 쓰지 않으며 현재 계통 비기다. S99·O99는 숨겨진 호환 항목으로 새 아이콘 제작 범위에 포함하지 않는다. O16 만혼귀결이 현재 소단 혼행 비기다. `historicalClassOrders`의 CLASSES.order는 과거 12~15개 목록이며 현재 수련/장착 노출 범위가 아니다.

전체 최종 SKILLS 정의와 숨겨진 legacy의 정확한 개수는 inventory의 `counts` 및 `hiddenLegacy`를 참조한다. LA/LM/LS/LO 계열, enemyOnly S99/O99 등은 적·NPC·옛 비행체 저장 호환용으로 별도 기록하며 삭제하거나 새 플레이어 아이콘에 합치지 않는다. 모든 최종 ID는 유일하며 같은 기본 아이콘 키를 공유해도 스킬 ID별 그림이 필요하다.

## 부모 전달 계약

제작 대상은 `skills` 배열의 정확한 84개 ID다. 한국어 이름, 실제 효과, 클래스/인물/계통 색, 현 벡터의 실제 SVG path와 화면 사용처가 각 항목에 있다. `lore`만으로 판정을 추정하지 말고 `effectSummary`, `effectRowsRank1`, `effectRowsRank8`을 함께 확인한다. 이름·설명·판정·세이브·성장은 변경하지 않는다.

권장 원본 경로: `shared/assets/skill-icons/v1/{ID}.webp`. manifest 연결과 검증 절차는 다음 코드 커밋에 추가한다. 현재 폴더에는 새 이미지가 없으며 전체 완료가 아니다.

최종 manifest는 현재 84개 skillID와 일대일 대응해야 한다. 기본기·상시 기예도 포함하며 hiddenLegacy는 제외한다. 접근성 이름, 선택, 비활성, 수련점, 경지, 비기/상시 표식은 DOM이 담당한다. 전체 그림을 인트로에 선로딩하지 않는다.

## 지침과 증거

`AGENTS.md`, `.agents/skills/honro-environment/SKILL.md`, README, BUGFIX_CONTEXT, 관련 BUG_LOG, RELEASE_OPERATION_GUARD를 확인했다. 환경 스킬은 목록 확인/참고만 했으며 배경 작업을 수행하지 않는다. 사용자의 명시적 지시에 따라 일반 지침의 master/Pages 반영과 `_local` 증거 위치 대신 이 브랜치와 본 폴더에 증거를 보존한다.
