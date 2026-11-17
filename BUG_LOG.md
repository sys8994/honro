
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
