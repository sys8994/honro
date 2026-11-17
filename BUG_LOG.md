## 2026-11-17 · 32장 공통 재질 접합 후보

- 실제 Chrome 기준선의 BODY 사각 절단은 foundation만 바꿔도 남아 첫 후보를 반려했다. 현재 후보는 원본 도로·풀·돌·25개 경로/순서를 보존한 채 지질 색면에 같은 월드 재질 버퍼를 합성한다.
- 옛 provider와 저장 호환 등록, 지형·물리·정적 바다를 유지한다. 정적 계약과 캐시 검사는 통과했지만 얇은 하단 원본 잔선은 실제 Chrome 검수 대상이다. master/Pages 미반영, 공개 UI·실기기·플레이 미검수. 상세: game/docs/STAGE32_SHARED_MATERIAL_CANDIDATE_20261117.md.

## 2026-11-17 · 22장 매립 기초 끝 합성 후보

- 사각 단면 관측은 저작된 두 매립 기초 색면의 하단/측면 끝과 일치했다. 의도된 기초 자체와 상부 건축 접점은 보존하고 두 ID에만 경계 합성 메타데이터와 isolated device mask를 적용했다.
- 전체 campaign의 두 필드 외 불변, 원본 점·색·물리·6뷰 카메라/상태 보존, 재생성, mask alpha, 기존 runtime 복원 일치, 14장 251개 rim 회귀를 확인했다. 공개 UI·확대/연속 줌·동적 상태는 미검수다. 상세: `game/docs/STAGE22_BURIED_EDGE_CANDIDATE_20261117.md`.

## 2026-11-17 · 21장 유한 암면 끝 합성 후보

- 유한 원본의 좌우/아래 색 경계가 직접 노출되던 합성에 21장 한정 fade를 적용했다. 원본 vector·접지·bounds·충돌은 그대로다.
- Native 변환 gradient에서 strip이 사라진 첫 후보는 반려하고 affine source-y 등고선을 보존하는 device gradient로 보완했다. 다른 장의 기존 분기는 그대로다. 브라우저 동일 버그라고 단정하지 않는다.
- 6뷰 물리/카메라 불변과 원본 보존, affine 수학검사, 다른 9장 첫 tile RGBA 동일을 확인했다. 하드컷은 완화되지만 재질 밀도 차이·공개 UI·동적 플레이는 미해결/미검수다. 상세: `game/docs/STAGE21_EDGE_BLEND_CANDIDATE_20261117.md`. 원격 후보와 실제 배포를 구분한다.

## 2026-11-17 · 41장 접합 coverage 수정

- 기존 clip이 색면마다 반복되고 원본 내부/외부 alpha가 중첩되어 밝은 수평·지그재그 경계가 생겼다. 서쪽의 서로 배타적인 영역도 source-over로 겹쳐 coverage가 부족했다.
- 실제 Inkscape의 기존 alpha 교집합과 bounded single-coverage 합성, 기존 서쪽 암영 한 색상의 정합으로 수정한다. 도형·원본·충돌·다른 장은 보존한다. 암괴 확장 후보는 원본 가시 영역을 가려 반려했고 활성화하지 않았다.
- 회귀·Native 결과 및 배포 상태: `game/docs/STAGE41_JOIN_STATUS.md`, 상세 native 근거: `art/stage41-join/README.md`. 공식 CI 및 Pages 배포 성공, 공개 파일 바이트 일치와 서쪽/동쪽/하단 화면 및 짧은 이동을 확인했다. 전체 미션 완주나 정량 게임플레이 검수 완료는 아니다.


## 2026-11-16 Stage33 foreground continuity
Previous west extension only continued rear stone; foreground still closed at x0.
Replaced lowland with one Inkscape-traced continuous formation extending to x=-3000;
kept all interior contact points/collision and narrowed the staircase edge marks.
Focused art regression passed. Corrected dedicated native inspection to load the
production Act4 art module; missing module produced artificial collision outlines.

## 2026-11-16 Stage33 continuous staircase support (review checkpoint)
Re-designed stairs with their supporting rock instead of detached per-step skins. Native Inkscape trace and Boolean editing produce separate upper support and lowland BODY assets from registered source geometry; original contacts, collision, gameplay, saves and other chapters remain unchanged. Focused coastal art regression passed. Actual browser validation and final visual review remain pending; this entry does not claim deployment or campaign completion. Earlier strip/rectangle candidates were rejected and not deployed.

## 2026-11-16 — 47장 외곽 연속 암벽 후보

- 원인: `act5-edge-art`의 경계1px 수평/수직 샘플 늘이기가 좌우 전 높이·하단 블러 띠를 만들었다.
- 변경:47장만 실제 Inkscape 추적 연속 BODY로 바꾸고 외곽 색면을 실제 카메라/overscan 범위까지 제작. 원본 BODY a/b 실루엣·구멍, 문 backing, 계단/다리 c 경로는 보존. 큰 삼각 상면·긴 세로 띠 후보는 반려 후 재제작했고 비보행 상면 강조를 낮췄다.
- 확인: 원본 stage47 게임플레이 데이터 hash 동일,1440×900부터320×1200까지6개 화면비 coverage, Native production Scene10구도. 동일 Inkscape 원본/최종 BODY alpha MAE0.0051/255,128 초과 차이0px.
- 범위: 미술 수정이며 충돌·성장·저장·이벤트·카메라 정책 불변. Native 검수는 브라우저 입력/완주 증거가 아니다. 작업 브랜치 후보이며 master/Pages 반영·공개 확인은 별도 진행한다. [제작/검수 계약](art/stage47-continuity/README.md).

### Stage47 continuous cliff publication verification (2026-11-16)
- Source `9092030`, build/master `cd72282`; latest `c26abb7` stage33 audit and old hashed assets preserved.
- Pages run `43873082290`: build/deploy/report successful.
- Reloaded public Game, entered stage47 via debug Journey UI; actual minimum zoom and west/east/lower drag pans showed continuous non-blurred rock. Original steps/openings remain readable.
- Actual Right movement:1100→981 movement, original starting bridge. No normal-save writes; not a stage-clear/campaign proof. Portrait tests were Native/camera coverage, not mobile browser.
- Accepted limitation: exterior color masses remain somewhat larger than the original inner rock.

## 2026-11-17 — 48장 연속 지지 암반 배포 검수

- 원인: 원본 하단 y655 절단과 단순 늘이기, v8의 인공 어깨/재질 크기 차이. v9 원본 전체 덧붙임과 v10 사각 접합도 반려하고, 원배율 근거리 v12와 별도 심부 v11-bleed 시안을 실제 Inkscape로 제작했다.
- 변경: 원본 계단·발판·갈고리·터널, 충돌·배우·저장·기획은 유지. 새 비보행 지지체를 Native Boolean으로 접합하고 세 paint stack에 coverage를 각각 한 번 적용했다. 경로 예산은 유지했고 epsilon0.3 최적화와 추적/분할 오차를 기록했다.
- 확인: 전체 stage/content/다른 장 asset 불변, 터널 내부1,982점과 원본 접촉 보호330점, single-alpha 및 예외시 canvas 해제 회귀 통과. 정식 CI44006099211 성공, 코드78035c8a8ddada7241d9a7fe74245ab5562a7623 master 반영, Pages44006345050 성공. 공개 HTML2개·manifest·entry·campaign·변경 renderer·48장 assets 총7파일이 로컬 빌드와 byte/hash 일치.
- 공개 게임: 정상 타이틀→여정첩→5막→48장→진입에서 ‘디버그 · 기록 분리’를 확인. 서쪽·동쪽 터널·하단·전체 화면을 검수했고 첫 계단 하강과 착지 후 이동/발사 가능 복귀, HP365/365 유지(이동도1100→799)를 확인했다. 일반 저장이나 기존 탭을 덮어쓰지 않았다.
- 한계: 전체 미션/전투 완주는 수행하지 않았다. 모바일·극단 세로 팬은 Native Scene 검수이며 실제 모바일 기기 검증이 아니다. Boolean 경계2표본의 1 source pixel 이내 판정 차이는 남으며 내부 침범은 검출되지 않았다. 로컬 브라우저 연결/파일 URL 제한은 우회하지 않고 공개 Pages에서 검수했다.

## 2026-11-17 — 49장 좌우·하단 연속 암벽 후보

- 원인: 원본 경계 1px 늘림과 하단 그라데이션이 큰 카메라 영역에서 블러/절단으로 보였다.
- 변경: 실제 Inkscape 추적·형상 보존 최적화·Boolean 분할 암벽, 원본 접촉 보호와 single-alpha 합성. source 전체 데이터·다른 장·충돌·저장·카메라는 보존했다.
- 확인: 보호 접촉2,022점, 아치 내부1,661점, 6개 화면비 coverage, 원본 stage/content/다른 asset 불변 및 합성 예외/opacity/clip 회귀. 후보7 Native 전체·좌우·하단·세로 화면 확인.
- 아직 CI/master/Pages/실제 공개 입력은 미완료. 세부 근거와 미술 한계는 `game/docs/STAGE49_CONTINUITY_STATUS.md`.

## 공개 배포 검수 완료 · 2026-11-17

- 코드 master: `fd7329bc810fa57b8dc6537d68bda6e8cde5e3a1`. 정식 CI `44011887800`와 Pages `44012140967` 성공. 변경 전 master `1228a522`의 기록을 보존했다.
- 공개 `HONRO.html`, `HONRO_WORKSHOP.html`, manifest, Game entry, campaign data, 변경 renderer, 49장 asset 총 7파일이 로컬 production build와 byte/SHA256 일치했다.
- 공개 Game을 새로고침하고 정상 UI `길을 열다 → 여정첩 → 5막 → 49장 → 휴식터 → 진입`으로 확인했다. ‘디버그 · 기록 분리’를 확인했으며 일반 저장과 기존 검수 탭은 변경하지 않았다.
- 서쪽 시작 발판의 하강 버튼으로 실제 하강 후 착지, `이동·발사 가능` 복귀를 확인했다. Right 1초로 원본 계단을 이동해 이동도 1100→863, HP365/365 유지, ‘낮은 석단으로 하강’에서 다음 하층 제압 목표로 전환됐다.
- 실제 휠 축소와 미니맵 팬으로 서쪽·동쪽 두 아치/계단 끝·하단 연속 암벽을 확인했다. 공개 탭 29와 전후/이동/동쪽/하단/종합 화면을 보존했다.
- Native 동일구도 전후는 1440×900 `(150,3252)` / `0.45`. 공개 전후는 동일 브라우저의 초기 진입 자동 카메라와 HP/이동도 같은 상태에서 별도 캡처했다. 두 증거를 혼동하지 않는다.
- 미검수: 전체 미션/전투 완주, 실제 모바일 기기, Workshop 실입력. 모바일·극단 세로 상하 팬은 Native Scene 검사다.
- 남는 시각 한계: 외벽은 원본보다 각지고 조밀한 색면이며 동쪽 계단 끝 주변에 재질 전환이 남는다. 반복 블러·신규 절단·큰 사각 접합·밝은 가짜 발판은 이번 Native/공개 범위에서 발견하지 못했다.

## 50장 연속 암벽 후보 · 2026-11-17

- 원인: 기본 늘림/gradient 외곽이 원본 암면과 분리됐다.
- 변경: 실제 Inkscape 추적·형상 보존 최적화 암벽, 원본 하단 색경계 분할, 원본 보행/계단/산문/아치 보호 및 단일 alpha 합성. 원본 데이터와 다른 장, 충돌·저장·카메라는 불변이다.
- 확인: 데이터 hash·보행 327점·색면 968점·아치 323점·6개 화면비 bounds, 합성 예외/opacity/clip 회귀, 서쪽/동쪽/세로 Native 화면.
- 아직 master/CI/Pages/공개 실제 입력은 미완료. source PNG/raw는 지원 Library 및 로컬에 원본 보존했으며 전송 제한 우회는 하지 않았다. 세부 근거와 한계는 `game/docs/STAGE50_CONTINUITY_STATUS.md`.

## 2026-11-17 · 28장 지반 하단 source 연속성 후보

- 관측 y669 절단은 실제 source polygon y9000 끝과 일치했다. 저작 바닥 두 점만 기존 domain 하단27400으로 연장하고 collision projection9000은 유지했다. 별도 렌더 지리/스커트를 만들지 않았다.
- 전체 project에서 두 점 외 불변, projection·충돌·보행·unit 불변, Native 전후5뷰를 확인했다. portrait4뷰 하단띠만 없어지고 desktop중앙은 byte 동일하다. 기존 저장된 world polygon은 변환하지 않으며 공개 UI·동적 상태는 미검수다. 상세: `game/docs/STAGE28_EDGE_JOIN_STATUS.md`.

## 2026-11-17 · 30장 후면 수면·암면 하드컷 후보

- 후면 수면 source의 y7100 끝과 두 유한 암면의 y7668/y7290 끝이 실제 관측 위치에 일치했다. 수면 첫 path·정합 bounds만 기존 domain31200으로 잇고, 두 암면의 깊은 끝만 기존 바탕과 합성했다.
- campaign 자산1개 외 불변, 원본 forms/색/배율·물리·배 이벤트/22장메타 보존, 재생성/원문복원/Native6뷰를 확인했다. 재질 차이·고배율 AA/연속 줌·공개 UI·배 상태는 미검수다. 상세: `game/docs/STAGE30_EDGE_COMPOSITION_20261117.md`.

## 2026-11-17 · 29장 Chrome 왼쪽 외곽 접합 후보

- Native 내부 strip 누락은 철회했지만 실제 독립 Chrome Scene에서 world x0의 수직 외곽 이음은 남았다. source 왼쪽 fade가 null인 별개 원인이다.
- edgeFade[0]만 [0,170]으로 추가하고 원본 path·mapping·bounds·오른쪽 fade·물리를 보존했다. 정적/재생성 검사는 통과했으며 Chrome A/B의 상단 돌/보행rim 확인 전 판정은 보류한다. 상세: `game/docs/STAGE29_LEFT_JOIN_CANDIDATE_20261117.md`.
