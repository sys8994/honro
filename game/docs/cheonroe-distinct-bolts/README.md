# 천뢰호 M05 — 서로 다른 줄기와 짧아진 옆가지 후보

2026-10-22. 브랜치 **`feat/cheonroe-distinct-bolts`**. 최신 사용자의 “번개에 variation, 가로 가지는 짧게” 교정만 적용했다. **부모의 최종 픽셀 검토용 후보이며 master 병합·Pages 배포는 하지 않았다.** 원본의 풍부한 빛을 복원한 앞선 승인을 이번 새 기하의 최종 승인으로 옮겨 적지 않는다.

- fetch로 확인하고 분기한 master: **`2464b5b370114abacd9d0fa4e8dbd96274b7c621`**.
- 빌드·브라우저 캡처의 실행 후보: **`95b60590897237a3e04f400371522b5c97c81b2f`**, 비강제 push와 원격 SHA 일치 확인 완료.
- 이 보고서·증거·브라우저 재현 도구와 보강한 검사만 후속 커밋이다. 최종 패키지 HEAD는 `git log -1 --format=%H`로 확인한다. 실행 소스/생성물은 위 후보 이후 바꾸지 않았다.

## 반복되어 보인 원인과 선택한 기하

복원 master의 줄기는 길이가 같으면 같은 수의 **등분된 구간**을 쓴다. 가지 여섯 개도 항상 같은 높이 비율 `.18+i*.115`, 같은 좌우 교대 순서를 갖는다. 좌표 seed `x*.17+y*.13+x2*.07+phase*11`를 하나의 sine hash에 넣어 각 점의 옆 이동량을 바꾸지만, 꺾이는 높이·구간 길이·가지 골격은 공유한다. 수직 줄기의 등간격 표적에서는 seed도 간격에 비례해 증가한다. 이 고정된 골격이 나란히 보이는 반복감을 만들었다.

M05가 방출하는 시각 이벤트에만 `lightningSeed`를 추가한다. projectile ID와 target ID 문자열을 FNV 방식으로 접은 뒤 32비트 avalanche mix를 통과시킨다. 그 값은 FX에 한 번 복사되어 수명 내내 고정된다. 전투 RNG를 읽거나 소비하지 않는다. 다른 낙뢰/M04 이벤트는 이 값을 보내지 않으며 기존 `lightningPaths`와 기본 그리기 경로를 그대로 사용한다.

`lightningGeometry.ts`의 M05 기하는 seed·기존 위상·성분 번호·점 번호를 각각 섞는다. 구간 길이는 `.45–1.55` 가중치를 정규화해 꺾임 높이를 바꾼다. 좌우 굴곡은 독립 방향 표본으로 결정하며 자주 반전하는 각진 성격을 유지한다. 원본의 길이별 진폭과 sine taper에 `.82–1.18`의 통제된 줄기별 진폭을 곱한다. 단순 수평 이동으로 같은 경로를 재사용하지 않는다.

옆가지는 **여섯 개와 각 여섯 점을 유지**한다. 여섯 높이 구간 안에서 시작점을 옮기고 좌우 방향·앞으로 기우는 비율을 각각 섞는다. 끝까지의 옆 뻗음은 `min(155,len*.24) × .6 × (.85–1.15)`다. 복원 원본의 명목 길이 대비40% 축소를 중심으로 작은 길이 차이를 둔다. 검사의10대상 묶음에서는 원본 실제 가지 합계의 **52.4–63.9%**다. 각 원본 가지의 난수 길이와 일대일로 정확히.6배인 계약은 아니다.

## 보존한 계약과 범위

그리기 함수는 기하 선택만 추가했다. 네 겹 색/폭/alpha·`lighter`·full contact gradient·아홉 접점 방전·원본 envelope·**.9초 수명**은 같다. 본줄기/가지 폭은 계속 원본의70%다. 기존 세 형태 위상 `min(2,floor(t*7))`을 유지하고 같은 위상 안에서 매 draw마다 모양을 재추첨하지 않는다. 하늘/천장 시작점과 frozen head 끝점은 정확하다.

발동 지연.35초, 하나의 대상 snapshot을 시각과 피해가 공유하는 흐름, 적마다 피해1회, 피해128.8(+15%)와 NPC LM05 94, 원래 중앙 천장/범위/감쇠/성장/화면 밖 규칙을 유지했다. 이 변경으로 타깃이나 피해 좌표를 이동시키지 않는다. 적 수·이웃 간격·작은 화면에 따른 가지/빛/폭/불투명도 축소나 cap이 없다.

[파일별 보존 대조](evidence/source-preservation.json): master의 `shared/runtime/`, `shared/data/`, `shared/assets/`, `shared/map/`, `game/config/`, `game/src/` **619파일이 바이트 동일**하다. 그 안의84아이콘, 엔딩6그림/런타임, 쉼터/여정첩/지형을 포함한다. 활성342파일 build graph에서 달라진 참조는 core1개와 game/workshop/direct-playtest entry3개뿐이다. 나머지338개는 SHA256도 같다. 빌더의 지난 세대 entry 정리도 생성물에 포함되며 수작업 HTML 편집은 없다.

## 같은 조건의 실제 픽셀

**26장 모두 Chromium154.0.8037.57/DPR1의 실제 production App/Engine/Scene JPG**다. 총2,053,627bytes, 최대144,918bytes로 모두1MB 미만이다. 합성/생성/리페인트는 하지 않았다. 상단의 설명만 DOM overlay다. 파일별 크기·SHA256과 좌표·피해는 [browser-results.json](evidence/browser-results.json)에 있다.

이전 [arena harness](../../../tests/cheonroe-target-lightning-browser.py)의 SETUP/SNAP과 기존 rich 비교 CONFIG를 재사용했다. 같은 h80 hound, 발 y1000, 카메라(1000,760), 모바일 zoom.75/desktop1.0,10대상 간격38world px,3대상100world px다. **정상 간격의 통제 arena이며 정상 캠페인 전투 장면은 아니다.** 기존 복원 검토와 같은 표적 크기/간격이다.

`master-before`는 위 master의 manifest가 가리키는 **정확한 core 모듈** `ordered-common-2.aaefeb760f1ec736.js`를 HTTP route로 재생한다. `candidate-after`는 override 없이 최종 빌드를 로드한다. 나머지 활성 모듈/데이터/자산은 master와 바이트가 같다. 양쪽의 카메라·scale·머리 snapshot·적 HP/피해·이벤트 끝점/size/color를 자동 대조했다. seed는 후보의 추가 시각 필드다.

초기는 실제 효과 나이.08초(위상0), 중기는.26초(위상2)다. 표의 각 행은 전후 동일 순간이다.

| 화면/대상 | master 초기 | 후보 초기 | master 중기 | 후보 중기 |
|---|---|---|---|---|
| 390×844 / 1 | [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-390x844-1-early.jpg) | [후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-390x844-1-early.jpg) | [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-390x844-1-middle.jpg) | [후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-390x844-1-middle.jpg) |
| 390×844 / 3 | [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-390x844-3-early.jpg) | [후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-390x844-3-early.jpg) | [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-390x844-3-middle.jpg) | [후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-390x844-3-middle.jpg) |
| 390×844 / 10 | [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-390x844-10-early.jpg) | [후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-390x844-10-early.jpg) | [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-390x844-10-middle.jpg) | [후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-390x844-10-middle.jpg) |
| 1280×900 / 10 | [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-1280x900-10-early.jpg) | [후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-1280x900-10-early.jpg) | [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-1280x900-10-middle.jpg) | [후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-1280x900-10-middle.jpg) |
| 360×800 / 10 | [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-360x800-10-early.jpg) | [후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-360x800-10-early.jpg) | [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-360x800-10-middle.jpg) | [후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-360x800-10-middle.jpg) |

위상1(.16초): 390px3대상 [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-390x844-3-phase1.jpg)/[후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-390x844-3-phase1.jpg), desktop10대상 [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-1280x900-10-phase1.jpg)/[후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-1280x900-10-phase1.jpg). 후기(.70초): 390px10대상 [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/master-before-390x844-10-late.jpg)/[후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-distinct-bolts/evidence/candidate-after-390x844-10-late.jpg). .9초 이후 만료도 확인했다.

## 직접 연 세 번의 집중 검수

1. **줄기 식별과 머리 접점.** 390px3대상 초기와 desktop10대상 초기의 전후를 직접 열었다. 후보의 세 줄기는 서로 다른 높이에서 넓게 꺾이고 한 줄기의 긴 구간 옆에 다른 줄기의 짧은 굴곡이 놓인다. desktop의10개도 굽는 위치와 좌우 진행이 달라졌다. 아래쪽은 각각의 frozen head 접점으로 모이며 발이나 몸 중앙으로 옮겨 가지 않는다. 수학적 exact endpoint 검사와 실제 browser snapshot 일치도 함께 확인했다.
2. **짧아진 가지와 빛의 풍부함.** 390px1·3대상의 전후 초기/중기를 직접 대조했다. master에서 화면 가장자리까지 뻗던 밝은 옆가지가 후보에서는 더 가까이 끝난다. 길이·시작점이 서로 달라지면서 여섯 가지와 흰 가지 중심/푸른 줄기 외곽이 살아 있다. 한 대상에서도 강한 각진 줄기와 큰 접점 광휘가 보인다. 선폭·색·alpha·방전은 실제 draw-command 비교에서 동일하다.
3. **모바일/desktop과 시간.** 390px3대상의 위상0/1/2,360px10대상 초기/중기,desktop10대상 위상1/중기와390px10대상 후기를 별도로 열었다. 의도한 위상 전환 때 모양이 바뀌며 같은 위상에서는 seed와 경로가 그대로다. 후기는 밝기가 자연스럽게 줄고 머리 끝점은 같은 위치다.360px의10명은 강한 빛과 숫자가 겹친다. 이 겹침은 캡처에 남겼고 이를 줄이려고 이펙트 층이나 방전을 제거하지 않았다.

## 별도 최종 종합 검토

위 집중 검수 후 최종 후보의390px3대상 중기,390px10대상 초기/후기,desktop10대상 중기,360px10대상 초기를 다시 직접 열어 전체 인상과 실제 접점을 함께 보았다. 짧은 옆가지와 불규칙한 줄기 진행이 동시에 읽히며 원래의 두꺼운 외곽빛·흰 중심·접점의 강한 방전이 남는다.10명이 나란한 모바일 장면은 여전히 밝고 복잡하다. 이번 후보는 그 풍부함을 유지한 채 모양의 반복을 줄이는 방향이다. **이것은 구현자의 내부 관찰이며 부모의 최종 미술 수락은 남아 있다.**

## 실제 실행한 검사

[명령/exit/시간](evidence/checks.json)과 같은 폴더의 `.log`, [기하 결과](evidence/geometry-results.json), [원본 그리기 비교](evidence/visual-contracts.json), [대상 역학](evidence/engine-results.json)을 커밋한다.

| 명령 | 결과/실제 범위 |
|---|---|
| `node tests/cheonroe-rich-effects.mjs` | PASS. 기존21 draw traces/9기하 조건의 default·M04 원본 계약 유지. M05에만 새 기하를 허용하고 색/폭/alpha/gradient/fill/9방전/수명은 원본과 동일함을 추가 대조 |
| `node tests/cheonroe-distinct-bolts.mjs` | PASS. 실제 arena strike ID1과 독립 ID17,3위상×8/38/100간격×10대상=180경로,810쌍 normalized 비교. 최소 RMS19.23world px, 최대 절대상관.674. 꺾임 높이·방향·가지 시작/방향 차이, 정확 끝점/짧은 천장/대각/0길이,6가지/.9초/고정seed/재시전 검증 |
| `node tests/cheonroe-visual-spacing.mjs` | PASS. 기존 default 원본6가지/큰굴곡/긴가지·15위상/간격 독립성. M05 단축 계약은 위 전용 검사에서 검증 |
| `node tests/cheonroe-target-lightning.mjs` | PASS. SP1/4/8×0/1/4/10,경계/.35초/제거·죽음·captured/천장·oneWay/치사snapshot/재시전·저장/420명. 이벤트 seed와 대상 ID도 대조 |
| `node tests/damheo-damage-balance.mjs` / `node tests/projectile-platforms.mjs` | PASS. 기존 담허 피해 및 발판/천장 집중 검사 |
| `npm --prefix game run typecheck` / `npm run build` / `node tests/web-split.mjs` | PASS. 공통342파일,분리빌드 해시/재조립/native·embedded/저장 |
| `node tests/rest-hub-journey-flow.mjs` / `node tests/journey-stage-departure.mjs` / `node tests/rest-journey.mjs` | PASS. 쉼터 확인/취소/출발/여정/저장/분할 등 기존 Node 회귀 |
| `node tests/camp-persistence.mjs` / `node tests/rest-scene-controls.mjs` / `node tests/rest-idle.mjs` | PASS. 캠프 저장·쉼터 조작/idle |
| `python -X utf8 tests/cheonroe-distinct-bolts-browser.py` | PASS.26JPG,5동일조건 장면의전후/초기/중기와위상1/후기,동일위상repeat/seed불변/만료,exception0 |
| `python -X utf8 tests/cheonroe-distinct-rest-smoke.py` | PASS.390/1280 실제 UI의 쉼터→여정첩/선택/CTA→쉼터→새5장→확인/취소/승인→reload/Continue. [결과](evidence/rest-smoke-results.json) |
| 기존 `tests/rest-hub-journey-browser.py` (OUT만 로컬로 치환) | 첫 실행 timeout, master 비교와 후보 재실행은 모두4viewport PASS. 상세는 아래에 기록 |
| 보호소스/84아이콘/342 build graph 바이트 대조, `git diff --check` | PASS |

기하 검사는 수평 위치를 빼고 비교해 단순 이동 복제와 좌우 거울 복제를 검출한다. 같은 높이의 표적뿐 아니라 같은 seed의 반복과 별도 시전/표적 seed를 확인한다. 기본 렌더와 M05 변경 계약을 분리했으며 기존 피해/머리/범위 검사를 삭제하지 않았다.

### 실패와 미실행

기존 full rest-hub browser suite의 첫 실행은 첫360×800 시나리오에서 쉼터/확인/취소/저장/reload/여정첩/입력/새5장까지 통과한 뒤, `setup(page,19)`로 fixture를 바꾸고2막 탭을 찾는 `:87`에서30초 timeout이 났다. [첫 실패](evidence/rest-hub-candidate-failure.json). 이 실행의 이후2막/다른 viewport는 미실행이다. **동일 master core와 바이트 동일한 나머지 UI로 대조한 full suite는4viewport 모두 PASS**했다([대조](evidence/rest-hub-baseline-check.json)). 후보의 재실행은 별도 결과에 기록하며 첫 실패를 지우지 않는다. 이 좁은 VFX 범위에서 쉼터 제품 코드는 고치지 않았다.

[후보 재실행 결과](evidence/rest-hub-candidate-rerun.json): **4viewport 모두 PASS**.360×800/390×844/844×390/1280×900에서확인·저장/reload·탭/CTA·2막직접진입·회전·드래그/휠/더블클릭을 확인했다. 첫 timeout은 master 대조와 후보 재실행에서 재현되지 않았으며 원인은 확정하지 않았다. 최초 실패와 최종 재실행을 구분해 보존한다.

전30장 정상 완주,실기기 터치/GPU,FPS/최대부하 성능,고DPR/Safari,전체 `verify`,엔딩 전체 브라우저 suite,Pages 검증은 이번에 **미실행**이다. 기존 보고서의 unrelated campaign-transition/quest-targets-app-resume/custom-map/journey-content 실패 묶음도 이번에 재실행하거나 수리하지 않았다. 과거의 통과를 이번 실행으로 계산하지 않는다. 여기의 VFX 화면은 production renderer를 통제 arena에서 재생한 증거다.

## 재현과 인계

저장소 루트에서 의존성 설치 후 위 명령을 실행한다. 비교 도구는 git에 남은 정확한 master core를 직접 읽으므로 별도 과거 빌드 생성이 필요 없다. 브라우저 테스트는 `tests/browser_support.py`의 실제 Chromium과 임시 HTTP 서버를 사용한다. 캡처 도구는 기존 같은 이름의 후보 증거를 덮어쓰므로 새 후보에서는 별도 증거 경로를 지정한다.

차단/승인 대기/결과 불명 쓰기는 없다. 구현과 증거를 논리 단위로 commit·비강제 push한다. **master fast-forward와 기존 Pages 발행/공개 화면 확인은 부모가 최종 픽셀을 검토한 뒤 수행할 단계다.**
