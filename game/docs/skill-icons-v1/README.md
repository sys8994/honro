> 이 문서는 이미지 공급 전 준비 브랜치의 기록입니다. 현재 통합 후보·실제 공급 이미지·집중 검수 3 결과는 [integration/README.md](integration/README.md)를 확인하세요.

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

## 이미지 공급과 코드 연결

`shared/assets/skill-icons/v1/manifest.json`에 84개 ID가 모두 있고 현재 `status: pending`, `sha256: null`, 전체 `artReview: pending`이다. 그림을 공급할 때 해당 `{ID}.webp`를 넣고 항목을 `status: ready`로 바꾸며 **그 파일의 SHA-256**을 넣는다. 최종 미술 검수가 끝난 뒤에만 부모가 `artReview: approved`로 바꾼다. 이 코드는 이미지를 생성하거나 편집하지 않는다. 크기·구도·화풍 SOP는 부모가 결정한다.

- 공급 대기 구조 검사: `node tools/skill-icons/manifest.mjs --allow-pending`. 명시적으로 대기를 허용하며 `complete: false`를 출력한다.
- **전체 완료 검사:** `node tools/skill-icons/manifest.mjs`. 누락/대기 이미지 또는 미술 승인 미완료가 있으면 종료 코드 1. 현재 의도대로 실패한다.
- ID 누락·숨겨진/알 수 없는 ID·동일 파일로 잘못 연결·경로 불일치·ready 파일 누락·WebP 형식 불일치·SHA-256 불일치·manifest에 없는 WebP 파일도 오류다. 대기 파일을 이미 넣고 상태 갱신을 빼먹어도 오류다.
- `npm run build`는 대기 manifest를 명시적으로 허용하지만 malformed/ready 누락은 거부한다. 빌드 성공은 전체 이미지 완료나 미술 승인 의미가 아니다. 공급 파일만 기존 공통 빌드의 `web/graphics/skill-icon-{ID}.{hash}.webp`로 내보낸다. 원본 경로는 manifest의 `file`, 최종 웹 URL은 빌드 결과에서 연결한다.

런타임은 일반 `icon()` 호출을 그대로 유지하고 `skill:{ID}`만 전용 그림 래퍼를 사용한다. pending/로드 실패 때 기존 SVG가 보이며 작은 점으로 공급 대기 상태를 구별한다. 상시 기예 칩도 실제 스킬 ID를 연결했다. 선택/비활성·한국어 이름·기력·경지·비기/상시 표식은 기존 DOM을 유지하며 전투 스킬 선택은 `aria-pressed`도 제공한다.

공급 완료 URL도 manifest만으로 이미지를 가져오지 않는다. 실제 DOM에 있고 화면에 보이는 기예만 IntersectionObserver가 로드한다. 디코드 요청은 최대 4개 동시, 메모리 캐시는 최대 96개 URL이며 실패한 URL은 같은 세션에서 반복 요청하지 않는다. 현재 인물/열린 계통/장착 슬롯/상세 화면만 로드되고 인트로에서 84개 전체를 선로딩하지 않는다. 원본 페이지와 Workshop의 직접 Playtest에서도 공통 연결을 사용한다.

## 확인 결과와 남은 범위

최종 정의 **141개 = 현행 84 + 숨겨진 호환 57**. `inventory.json`의 원래 추출 커밋/벡터를 제작 기준으로 보존했다. 현재 코드와 경지 1/8의 이름·실효과·서사·색·기본/상시/비기/적 전용 플래그 141개를 대조해 변경 없음을 확인했다. 전투·진행·저장 코드 수정은 없다.

- 타입 검사, 공통 빌드, 기존 `camp-skill-ux`, 공통 웹 분리 검사를 수행했다. `evidence/validation.json`에 각 상태를 기록한다.
- 실제 Chromium 154.0.8037.57의 모바일/터치 모드에서 360×800, 390×844, 844×390, 1280×900을 렌더했다. **57개 기본 확인과 추가 2개 잠금/수련점 확인**: 인트로 이미지 요청 없음, 모달 헤더/본문/44px 닫기/증감·스크롤 유지, 상시 표식, 슬롯 설명, 전투 그림 32~36px·스킬 터치 영역 최소 44px, 이미지 성공/404 폴백/캐시/화면 밖 지연, 브라우저 예외 없음.
- HUD 스킬 버튼은 기존 크기 그대로다. 360px에서 44×45, 390px에서 52×45, 844px에서 50×50, 1280px에서 62×54다. 그림만 기존 내부 영역에 재배치했다. 조이스틱·발사·HUD·전장 Canvas의 위치/크기는 새 CSS 적용 전후 비교에서 동일하다. 수련/장착/상세는 32px 실그림과 40~42px 외곽을 사용한다.
- `evidence/*.png`는 실제 브라우저 원본 캡처이며 각각 1MB 미만이다. 합성·새 아이콘 이미지가 아니다. modal-360 / slot-library-390 / hud-360 / hud-844를 직접 열어 확인했다.
- 네트워크·디코드 성공 테스트는 기존 저장소 WebP를 라우팅한 임시 transport fixture다. 그 이미지를 스킬 원본으로 저장하거나 manifest에 공급 완료로 쓰지 않았으며 미술 검수로 주장하지 않는다.

**남은 작업:** 부모의 84개 이미지/SOP 공급, 파일별 checksum/status 반영, 실제 공급 그림의 모바일 식별성·패시브/비기 구분·화풍 최종 검수, strict 완료 검사. 실물 휴대폰과 Safari는 이번 환경에서 확인하지 않았다. 이번 작업은 이미지 적용 준비 완료이며 전체 미술 완료가 아니다. master와 Pages에는 쓰지 않았다. 추가 잠금/수련점 확인은 `python tests/skill-image-disabled-browser.py`로 재현한다.
