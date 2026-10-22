# 84개 스킬 이미지·천뢰호 통합 후보

2026-10-22 UTC. 브랜치 `integration/skill-icons-thunder-v1`. **실제 UI 집중 검수 3 통과 후보이며, 부모의 별도 최종 종합 검수와 master/Pages 승인은 남는다.** master 병합·Pages 배포는 실행하지 않았다. 이미지 생성·그림 수정은 하지 않았다.

## 원본과 통합

착수 시 `git fetch origin --prune` 및 대상 세 브랜치 fetch로 원격 master `be79826869c70ae68950eb8be8a4bd7d187600dc`를 확인하고 새 integration 브랜치를 만들었다. 다음 세 원본 커밋은 모두 merge ancestry로 보존한다.

| 원본 브랜치 | 정확한 SHA | 보존 범위 |
| --- | --- | --- |
| feat/all-skill-image-icons | `fe22486a766d4f32b7389bb358cccf9e78a724e9` | ID 매핑, 지연 로드, 동시 4개 디코드, 캐시, 폴백, 32–36px HUD, 기존 모달 |
| art/skill-icons-v1 | `449998749123b3188ea01f7a8b0538a1b9e44bb3` | 부모 제작 84 WebP, SOP, 캐릭터별 provenance/contact JPG 원본 |
| feat/cheonroe-target-lightning | `b1e4efc41d91107a037ba23977532f546c57f948` | 적별 머리 스냅샷·단일 피해·128.8 피해·폭 3.5·지연·범위·천장·420줄기 보존 |

`SKILL_ICON_ART_STANDARD.md`, `art/ART_HANDOFF.md`, 네 provenance JSON과 contact JPG, `cheonroe-target-lightning/README.md`를 읽고 실제 이미지를 열었다. 부모의 의미 검수 1과 32/48px 미술 검수 2를 제작 근거로 유지한다. 기존 구현을 중복 작성하지 않았다. 천뢰호 병합 충돌은 생성 HTML/index/web manifest와 BUG_LOG에만 있었으며, 두 변경 기록을 모두 보존하고 최종 소스에서 `npm run build`로 생성물을 재생성했다.

변경 단위마다 커밋·비강제 원격 push했다.

- `b0d1e64f`: 아이콘 준비 브랜치 merge.
- `3842e756`: 84개 원본 미술 merge.
- `514a4959`: 천뢰호 merge, ready/hash 연결, 통합 빌드.
- `75c86629`: 천뢰호 본줄기 유지, 보조 가지·머리 광휘 절제.
- `9ad1f395`: 자원 부족 상태의 이미지 식별성 수정, 엄격한 이미지 디코드/중복 검증, M05 inventory 갱신.
- `0e02735a`: 촘촘한 적 사이 간격에 따른 시각 흔들림/광휘 제한.
- 최종 빌드·검수·증거 커밋 SHA는 아래 최종 영수증에 기록한다.

## 84개 파일 전수 검증

[asset-audit.json](evidence/asset-audit.json)은 모든 ID, 파일 경로, SHA-256, 바이트, 부모 provenance 연결을 보존한다. 기본 4 + 액티브 60 + 패시브 20 = **84개**, 각 인물 21개다. 숨은 호환 57개는 제외했다. 84개 전부 부모 provenance의 SHA/크기와 일치하며 원본 WebP 바이트를 변경하지 않았다. 실제 256×256 WebP 전체 디코드, ID/경로/해시/유일성/매핑 외 파일 검사를 통과했다. 전체 **504,894 bytes**, 최대 **10,326 bytes**, 고유 해시 84개, 누락/중복/손상 0개.

[manifest-strict.json](evidence/manifest-strict.json): `complete: true`, ready 84, pending 0, errors 0. `artReview: approved`는 이 후보의 실제 Chromium UI 집중 검수 3 범위다. manifest에도 부모 최종 종합 검수와 배포 승인이 남는다고 명시했다.

`inventory.json`을 실제 최종 초기화에서 다시 추출했다. 준비 inventory와 이름/효과/수치/속성/표식 필드를 비교하면 허용된 **M05의 effectSummary, effectRowsRank1/8, lore만** 바뀐다. 설명은 “착탄 0.35초 뒤 유효 범위의 모든 적 머리에 천뢰가 각각 내려칩니다”이며 기본 피해 128.8과 일치한다. 다른 83개 및 숨은 호환 정의는 해당 필드가 동일하다.

## 실제 UI 관찰·실패·수정·재검수

브라우저는 로컬 HTTP에서 최종 빌드 HONRO.html을 실행한 **Chromium 154.0.8037.57**, DPR 1, touch/mobile emulation이다. 전투 HUD는 실제 허공터 엔진, 낙뢰는 원본 `cheonroeArena`를 선언한 진단 배치와 production Scene을 사용했다. 프로필/배치/시간 진행만 검수용으로 설정했으며 UI DOM을 합성하거나 캔버스 그림을 대체하지 않았다. JPG는 실제 `page.screenshot` 원본이다.

### 아이콘/스킬 모달

- 네 캐릭터의 실제 tree 화면을 직접 열어 기본·액티브·패시브 전체 84개의 화면 조화와 큰 형태를 대조했다. 자동 순회는 84개 각각의 실제 상세 모달에서 ready 이미지가 보이는 것을 확인하고 `detail-{ID}.jpg` 84장을 저장한다. 네 기본기 상세 `basic-{class}.jpg`, 모든 20개 패시브 상세와 상시 요약을 포함한다.
- 특히 A08의 어두운 철촉, A14의 작은 명중점, S11의 얇은 관통선, S13의 끝 베기, S03의 인물/원호, O14의 그릇을 실제 상세와 32/36px 선택·자원 부족 HUD에서 직접 열어 확인했다. 원본 형태와 주변 글자/표식이 구분된다. S11은 가는 선이라는 원본 특성이 유지되며 새로운 흐림·SVG 대체를 하지 않았다.
- **실패:** 기존 `.unaffordable { opacity:.4 }`가 버튼 전체에 적용돼 특히 A08·S03·O14와 A14가 너무 어두워졌다. [수정 전 설오](evidence/before-unavailable-archer.jpg), [수정 전 휘겸](evidence/before-unavailable-knight.jpg).
- **수정/재검수:** 버튼 opacity 1, 그림 opacity .85로 보존하고 점선 frame·절제된 배경·비용 색·이름의 약한 감쇠로 자원 부족을 표시했다. 선택 금색 frame과 구별된다. [수정 후 설오](evidence/hud-archer-360-unavailable.jpg), [휘겸](evidence/hud-knight-360-unavailable.jpg), [소단](evidence/hud-occultist-360-unavailable.jpg), [담허](evidence/hud-mage-360-unavailable.jpg). 이미지 파일이나 색 필터를 변경하지 않았다.
- 360×800, 390×844, 844×390, 1280×900에서 스킬 모달 상단 고정 버튼·X, body 위아래 스크롤, SP 추가/제거 후 scroll 유지, 닫기를 실제 입력으로 확인했다. X는 44px 이상이며 헤더 overflow가 없다. 네 캐릭터 각각 잠금·SP0·추가/제거를 별도로 재확인했다. SP0에서 +는 비활성, −는 정상 회수가 가능하다. 선행 기예의 마지막 1 SP 회수 제한은 기존 규칙이며 변경하지 않았다. 처음 시험에서 A14의 이 제한을 SP0 회수 실패와 혼동했으나 rank 2 및 회수 가능한 기예로 시험 설정을 바로잡았다.
- 네 캐릭터 × 네 화면 크기의 HUD 선택·자원 부족을 저장했다. 최종 HUD 캡처는 실제 허공터의 인물→계열→기예→적용 버튼을 눌러 선택한 뒤 네 슬롯 진단 설정을 사용해 상단 인물과 기예도 일치시켰다([hud-final-results.json](evidence/hud-final-results.json)). 아이콘 stylesheet만 비활성화한 실제 DOM bounds와 비교해 **조이스틱·발사·HUD·전투 canvas 영역이 동일**함을 확인했다. 기존 레이아웃과 터치 영역은 보존한다.
- **쿨다운 범위:** 현재 노출 84개에는 cooldown이 설정된 기예가 없다(`currentCooldownSkills: []`). 실제 UI 분기의 2회 표시·자원 부족 표시를 검수할 때만 메모리상의 A14 cooldown cap을 2로 설정하고 현재 round+2를 넣은 후 복원했다. [진단 쿨다운](evidence/diagnostic-cooldown-2-turns.jpg)은 이 조건을 공개한 실제 HUD다. 제품 스킬 수치에 쿨다운을 새로 추가하지 않았다.

대표 실제 화면:

| 범위 | 화면 |
| --- | --- |
| 4인 전체 기예 tree | [설오](evidence/tree-archer.jpg), [휘겸](evidence/tree-knight.jpg), [담허](evidence/tree-mage.jpg), [소단](evidence/tree-occultist.jpg) |
| 4인 기본기 | [평사](evidence/basic-archer.jpg), [평참](evidence/basic-knight.jpg), [기파](evidence/basic-mage.jpg), [혼령탄](evidence/basic-occultist.jpg) |
| 패시브 상세 | [살흔](evidence/detail-AP05.jpg), [불굴](evidence/detail-SP05.jpg), [주천](evidence/detail-MP05.jpg), [매듭보전](evidence/detail-OP04.jpg) |
| 모달 4크기 | [360](evidence/modal-360.jpg), [390](evidence/modal-390.jpg), [844 가로](evidence/modal-844.jpg), [1280](evidence/modal-1280.jpg) |
| 잠금·SP0 | [잠긴 A08 tree](evidence/locked-tree-A08.jpg), `locked-{class}.jpg` 4개, `sp0-{class}.jpg` 4개 |
| 선택 HUD·장착 | [설오 세로](evidence/hud-archer-390-selected.jpg), [휘겸 가로](evidence/hud-knight-844-selected.jpg), [담허 가로 자원 부족](evidence/hud-mage-844-unavailable.jpg), [장착 목록](evidence/slot-library.jpg) |

### 천뢰호 미술

원본 [mobile-10](evidence/before-mobile-10.jpg)의 긴 가로 가지·최대 48 world px 굴곡·넓은 머리 광휘가 거미줄처럼 겹치는 것을 직접 확인했다. M05 이벤트에 시각 전용 표식 `text:'cheonroe'`를 붙여 이 경우에만 새 스타일을 사용한다. 뇌호 M04 및 다른 번개의 기본 경로/스타일은 그대로다.

- 본줄기의 네 선층 폭·알파를 유지한다. size **3.5**, 기존 size 5의 **70%**, 기본 피해 **128.8 = 112×1.15**, 수명 .9초가 유지된다.
- M05 본줄기 좌우 진폭은 최대 12 world px이며, 가까운 이웃과의 가로 간격 `g`가 작으면 `max(1.5, .28g)`로 더 제한한다. 각 머리 끝점과 전체 줄기 수는 바꾸지 않는다.
- 긴 보조 가지는 6개→3개, 최대 기본 reach 155→24 world px, 좁은 간격에서는 `max(4,.6g)`로 더 제한한다. 가지 밝기는 기존 .45~.725 계수 대신 .24다. 본줄기 밝기는 줄이지 않았다.
- 접점 glow radius는 약 26 world px에서 시작하며 가까운 적 사이에는 최소 9 / `.45g` 상한을 사용한다. glow alpha .65→.24, 접점 작은 방전은 9→4개와 짧은 길이를 사용한다. 기존 피격 붉은색·폭발 원·피해 숫자는 바꾸지 않았다.
- **중간 재검수:** 첫 축소안은 17px 간격에서 줄기 굴곡이 여전히 서로 교차했다([중간 촘촘한 10명](evidence/intermediate-dense10.jpg)). 렌더러에서 실제 살아 있는 M05 ray들을 x 정렬해 가까운 간격을 구하는 O(n log n) 시각 계산을 추가했다. 판정이나 엔진 표적 수를 바꾸는 계산이 아니다.
- **재검수 통과:** 1/4/10명, 간격 17/38/65/80 world px, 줌 .45/.66/.8/1.15/1.4, 세로/가로/PC, 천장 아래를 실제 열었다. 단일 줄기는 선명한 중심과 충분한 폭이 남고, 촘촘한 10명도 큰 가로 가지망 없이 개별 수직 줄기로 읽힌다. 머리와 적의 몸 실루엣이 남는다. 낮은 가로는 기존 카메라를 수동 이동해 머리가 HUD 뒤로 숨지 않게 캡처했다.

| 조건 | 실제 화면 |
| --- | --- |
| 1명 세로 / 확대 | [360×800](evidence/lightning-360-1-spacing38-zoom0.66.jpg), [1280 확대](evidence/lightning-1280-1-spacing38-zoom1.4.jpg) |
| 4명 넓은 배치 | [세로](evidence/lightning-360-4-spacing65-zoom0.66.jpg), [가로 확대](evidence/lightning-844-4-spacing80-zoom1.15.jpg) |
| 10명 일반 / 촘촘 | [360 세로](evidence/lightning-360-10-spacing38-zoom0.66.jpg), [390 촘촘](evidence/lightning-390-10-spacing17-zoom0.8.jpg) |
| 10명 가로 / 작은 줌 | [844 가로](evidence/lightning-844-10-spacing38-zoom0.66.jpg), [1280 줌 .45](evidence/lightning-1280-10-spacing38-zoom0.45.jpg) |
| 10명 천장 아래 | [1280 천장](evidence/lightning-1280-10-spacing17-zoom1.15-roof.jpg) |

기존 머리 관절 112조건, 유효 표적/중복 피해 없음, 지연·사거리·천장/oneWay, 화면 밖 타깃, 420줄기 보존/소멸 검사도 다시 통과했다. 판정 중심과 머리 스냅샷은 원본 브랜치 그대로다. 피해 숫자가 서로 겹치는 기존 문제와 정확히 같은 위치의 적/줄기 중첩은 남을 수 있으며, 무관한 숫자 UI나 적 배치를 재설계하지 않았다.

## 실제 네트워크·디코드

[browser-results.json](evidence/browser-results.json)의 실제 Chromium request 이벤트와 PerformanceResourceTiming이다. 제목 화면 전/후와 실제 화면 순회/재진입의 누적치를 구분한다. 아래 body는 84개 원본 WebP의 실제 압축 전송 바이트이며 HTTP 헤더를 포함한 transfer도 별도로 기록했다.

| 시점 | 누적 이미지 요청 | body bytes | transfer bytes |
| --- | ---: | ---: | ---: |
| 최초 인트로, 모닥불 진입 전 | 0 | 0 | 0 |
| 설오 첫 모닥불, 보이는 영역만 | 1 | 3,936 | 4,236 |
| 네 인물 84개 상세를 실제 연 뒤 | 84 | 504,894 | 530,094 |
| 모든 HUD 상태·화면 회전·재진입 뒤 | 84 | 504,894 | 530,094 |

처음부터 84개를 preload하지 않으며 첫 화면의 가려진 tree는 요청하지 않는다. 캐릭터 선택/실제 화면 진입에 따라 로드된다. `HTMLImageElement.decode`를 초기 진입 전부터 관찰한 결과 최대 동시 decode **4**, 총 **84**, 완료 뒤 active 0이다. URL별 캐시 상한 96은 원본 구현을 유지했다. 재진입 추가 요청/중복 디코드 0개다.

[final-build-smoke.json](evidence/final-build-smoke.json)은 approved manifest를 포함한 최종 생성물에서 84개의 실제 해시 URL과 기본 진입을 재확인한 결과다. 실제 A08 hashed WebP 요청에 Chromium route로 의도적 HTTP 404를 반환해, **같은 모달 3회 방문 동안 실패 요청 1회**, SVG fallback 표시를 확인했다([실제 실패 화면](evidence/network-failure-A08.jpg)). 정상 이미지가 폴백으로 대체된 완료 주장과는 구분한다. 검수용 404 외에 실제 자산 누락은 없다.

## 명령과 결과

[regression-results.json](evidence/regression-results.json)은 정확한 명령·종료코드·원문 출력을 보존한다. [cheonroe-browser-regression.json](evidence/cheonroe-browser-regression.json)은 원본 집중 브라우저 검사의 재실행 결과다. 과거 브랜치 증거 파일은 덮어쓰지 않았다.

| 명령 | 결과 |
| --- | --- |
| `npm --prefix game run typecheck` | PASS |
| `npm run build` | PASS, 공통 최종 빌드 342파일, game shell 17,415 / workshop shell 3,947 bytes |
| `node tests/web-split.mjs` | PASS, 342파일 해시/바이트, 캠페인30장/도감851 재조립, native/embedded 기본 진입·저장 보호·Workshop iframe |
| `node tools/skill-icons/manifest.mjs` | PASS strict: complete true, ready84/pending0/unique84/errors0 |
| `node tests/skill-image-icons.mjs` | PASS, 실제 정의 대조, 파일/해시/상태/검수 gate의 실패 조건도 확인 |
| `python tests/skill-icons-art-provenance.py` | PASS, 부모 provenance와 모든84개 바이트/해시 일치 |
| `node tests/camp-skill-ux.mjs` | PASS, 슬롯/중복 교환/환불/미리보기/스크롤/명시 해제/저장/전투/기본기 제한 |
| `npm run test:cheonroe-target-lightning` | PASS, SP1/4/8 × 0/1/4/10, .349/.35초, 정확한 경계, 사망/제거/포획/이동, 치사 스냅샷, 재시전/저장 탄, 중복 피해 없음,420명 |
| `node tests/cheonroe-visual-spacing.mjs` | PASS, 시각 간격·끝점·진폭/가지 상한·단일 적·기본 번개 보존 |
| `npm run test:damheo-damage` | PASS,16기예 SP1/8, 실제 피해/후속/반사/설치/NPC/저장 |
| `node tests/quest-hostile-targets.mjs` | PASS |
| `node tests/quest-targets-live-combat.mjs` | PASS |
| `node tests/projectile-platforms.mjs` | PASS,6동작군 |
| `node tests/skill-effects.mjs` | PASS, 기존 낙뢰/이펙트 회귀 |
| `npm run test:cheonroe-target-lightning:browser` | PASS,112머리 변환,0/1/4/10,여러 줌/화면 밖/천장/420보존/소멸/예외0 |
| `python tests/skill-icons-integration-browser.py` | PASS,84실제 상세,4화면크기/4인HUD/잠금/SP/고정헤더/404/요청량/디코드,낙뢰9조건,예외0 |
| `python tests/skill-icons-final-build-browser.py` | PASS,최종approved빌드,4043회재방문/1요청,4인추가·회수/잠금/SP0,최종M05모달 |
| `python tests/skill-icons-hud-browser.py` | PASS, 실제 허공터 선택 입력,4인×4크기×2상태,32–36px그림/44px이상버튼/예외0 |
| `git diff --check` | PASS |
| `node tests/quest-targets-app-resume.mjs` | **기존 실패**, exit1 `ReferenceError: window is not defined`, App.bind의 resize listener를 VM 대역이 제공하지 않음 |

마지막 추가 표적 재개 검사는 `/tmp/honro-master-check`의 독립 origin/master `be798268` worktree에서도 같은 명령·같은 `window is not defined`를 재현했다. 이 실패를 통과로 기록하거나 무관한 검사 대역을 고치지 않았다. 반면 필수 표적 목록/실전투·천뢰호/담허·camp-skill-ux·web-split 저장 보호는 통과했다. 전체 verify나30장완주는 실행하지 않았다.

환경 준비 중 최초 build는 누락된 TypeScript로 실패했고 최초 npm ci는 읽기 전용 HOME 아래 npm cache 경로 생성 실패였다. `npm ci --ignore-scripts --cache /tmp/honro-npm` 및 game 하위 동일 ci로 쓰기 가능한 캐시를 사용해 정상 설치했다. 공급 파일이 pending인 최초 빌드는 의도된 manifest gate에서 거절됐고,84개 실제 해시/ready 연결 뒤 성공했다. 권한 거부·대기·결과 불명인 쓰기는 없다.

## 증거·남은 제한·최종 영수증

[screenshots.json](evidence/screenshots.json)은 커밋한 실제 JPG 각각의 크기·SHA-256을 제공한다. 모든 파일이 **1MB 미만**이다. `before-*`는 원본 브랜치 또는 최초 실패 상태, `intermediate-*`는 첫 수정의 재검수 실패, 나머지는 최종 시각 소스에서 캡처했다. [최종 빌드 M05](evidence/final-build-M05.jpg)는 approved manifest를 포함한 최종 생성물에서도 실제 화면을 열었다.

심각한 원본 미술 실패를 발견하지 않았다. 이번 approved는 자동 검사만으로 정한 결과가 아니라, 부모의 두 선행 검수와 이 문서의 실제 tree/모달/HUD/낙뢰 화면 직접 열람 및 수정 후 재검수에 근거한다. 실물 기기·Safari·고DPR 전량 검수, 정상 캠페인 완주 및 부모의 별도 최종 종합 검수는 하지 않았다. 최대 성능이나 접근성 전체 감사를 주장하지 않는다. 진단 fixture 화면과 정상 캠페인 플레이를 구분한다.

최종 빌드·검수·증거 SHA: 최종 커밋 후 영수증 갱신 예정. 이후 영수증만 추가한 문서 커밋의 SHA는 `git log -1 --format=%H -- game/docs/skill-icons-v1/integration/README.md`로 확인한다. master/Pages는 그대로 유지한다.
