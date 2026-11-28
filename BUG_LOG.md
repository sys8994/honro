## 탑뷰 연목 석교의 그림자·물결·프레임 지연과 마우스 조작

석교와 목교가 배우의 그림자 위에 그려졌고 교각은 물에 그림자를 드리우지 않았다. 강의 바탕은 고정된 채 짧은 선만 움직였다. 두 다리와 83개 지물의 그림자를 지형에 굽고, 다리 상판 위에 배우의 발밑과 투영 그림자를 그린다. 강은 투명한 강바닥 타일 아래로 서로 다른 속도의 물결 두 겹이 흐른다. 멧돼지의 일부 방향은 발굽 아래 빈 공간도 보정했다.

데스크톱은 왼쪽 드래그로 전장 패닝, 오른쪽 클릭으로 보행한다. 같은 일반 저장의 석교 5턴에서 정지·패닝·충전 프레임을 비교했다. 125% 디스플레이 배율에서는 크기가 그대로인 미니맵의 너비·높이를 각각 78번 재설정하던 동작이 0회가 됐다. PC 일반 입력의 1장 완료·이어하기·타이틀과 모바일 크기의 터치 조작을 확인했다. 실기기 GPU 성능은 미측정이다. [석교 전후와 측정 조건](game/docs/topview/BRIDGE_RENDER.md)

## 2026-11-28 · 탑뷰 1장 설오의 발 복원과 전장 치수

대기 원화가 y=291까지 이어지는데 균등 시트 추출기가 y=256에서 잘라 부츠가 다음 자세에 섞였다. 상태와 활 48컷의 실제 경계를 등록하고 밑창을 발점에 맞췄다. 대기 호흡에서는 어깨와 손만 미세하게 움직인다. 원화 등록 밖의 불투명 픽셀은 0개였다. PC와 터치 에뮬레이션으로 일반 진입·이동·피격·이어하기·1장 클리어·타이틀 복귀를 확인했다. 모바일 실기기는 미측정이다. [여덟 방향 복원](game/docs/topview/evidence/art-bible/seolo-eight-directions.jpg)

동시에 수관과 배우의 상대 크기, 사당과 다리의 실측 치수, 길과 엄폐물의 명암을 한 카메라에 맞췄다. 데스크톱 전장 드래그, 선택·정보, 미니맵, 정밀 조준과 세 발사대 버튼의 배치를 실제 입력으로 확인했다. [전후 화면과 검수](game/docs/topview/ART_PASS_ACT1.md)

## 3·4막 증원 재배치 — 2026-11-27

개편된 3막 일부에서는 옛 증원 조건이 빠졌고, 4막 해안 전투는 초기 편성 위주였다. 24~28장과 31~40장의 현재 동선에 일회성 증원 29편대, 조건부 58기를 편성했다. 분대는 경고를 받은 동행의 실제 행동 뒤 지정 지지면으로 들어온다. 희생자와 동행 근처의 자리, 점유 자리와 전투 종료 뒤 생성은 거절한다. 기존 공격 상한 안에서 교전 가능한 새 분대원에 첫 행동 자리 하나를 배정할 수 있다. 새 입장·재시도부터 적용하며 이미 진행 중인 전투 스냅샷은 기존 편성을 유지한다.

## 2026-11-27 · 60장의 시작곡과 엔딩 〈마중〉

기존 재생기는 막 단위 목록에서 새 전투마다 다음 곡을 골랐고 천도 장면을 메인곡으로 처리했다. MP3 7개를 태그와 표지를 정리한 27곡으로 교체하고, 장마다 지정된 시작곡을 먼저 들려준 뒤 장의 목록을 순환하게 했다. 소단의 바깥 주박 파괴와 대도사 등장은 실제 전투 상태를 따른다. 엔딩 스틸컷에서는 별도 99번 파일을 재생하고 크레딧에 곡명을 표시한다.

엑셀의 60행과 빌드 결과, 원본 폴더와 게임의 MP3 27개를 대조했다. PC·모바일 크기의 Chromium에서 장 진입, 재도전·저장 재개, 곡 전환, 우하단 제목을 확인했다. 6막 10장 완료 경로와 미리보기에서 첫 스틸컷, 크레딧, 타이틀 복귀도 확인했다. 음원은 전체 디코딩과 원음 샘플 대조로 검증했다.

## 2026-11-27 · 돌당골 원본 절단선과 최종 지형 확인

돌당골의 늘린 양끝을 제거한 뒤에도 원본 돌 가장자리의 밝은 윤곽이 새 암층과 맞닿는 곳에 남았다. 실제 발판과 아치 안쪽을 기준으로 원본 마스크를 다듬고, 양끝의 경사진 암면과 이끼가 경계를 가로지르게 했다. 입구와 반대편을 같은 카메라로 확대해 재확인했다.

26개 장에서 PC 방향키·세로 터치 조이스틱으로 이동 후 접지를 확인했고, 기준판과 접촉 지형·카메라 경계가 일치했다. 단독 Chromium 비교에서 5-6·5-8·5-9 입구 휠 간격 p95는 131→41, 138→33, 192→35ms였다. 5-4 중앙은 59→25ms였다. 일부 드래그와 가장 긴 개별 프레임은 여전히 느리다. 실제 휴대전화 성능과 전투 전체는 미측정이다. 옛 40장 단위 검사의 파일럿 모듈 누락과 가상 갑판 검사의 조수 바닥 ID 오류는 기준 master에서도 재현됐다.

## 2026-11-27 · 하부 지질·나루·법당의 접합과 축소 캐시

서낭나루 절개와 해가 닿지 않는 마을의 실제 비탈·착지면에 침식면과 석축을 맞췄다. 22장의 두 사각형은 하부 뜰의 명명된 기초 미술면이었다. 기존 색층 안에서 불규칙하게 끝나도록 현행 데이터와 제작 원본을 함께 수정했다. 23장의 물결·문기둥 밑돌, 24·26·28·29장의 대칭 바윗결, 35·37장의 첫 단과 목조 갈림길, 53·58장의 기단·천장·처마, 59·60장의 깊은 층리도 같은 위치에서 다시 그렸다. 45·50·59에는 축소 합성 경로를 적용했다. 축소가 끝난 뒤 첫 화면에서 동일 타일을 재사용하며, 두 배율의 타일을 합쳐 기존 기기별 캐시 한도를 적용한다.

3·14는 첫 캡처에서 보행선 돌출과 후면 가림을 발견해 다시 수정했다. 54의 세 전환은 기존 검수 발점에서 실제 버튼으로 재현했고, 각 전환 후 담허의 접지면과 암반 변환을 대조했다. 14의 과거 단일 변경 전용 검사 `stage14-vector-finish.mjs`는 이번 기준 master에서도 10월 프로젝트 전체 해시 검사에서 실패한다. 현재 장의 물리·화면 비교와 분리했다.

## 2026-11-27 · 돌당골·빈 포구·거꾸로 선 처마 접합, 귀림과 무명사 외부의 축소

돌당골 양옆의 늘린 절단면을 서로 다른 암층과 이끼로 잇고, 빈 포구의 황토와 해안석이 같은 깊이에서 교차하게 했다. 무명사 54 동쪽 암벽의 배면은 원본 회랑과 같은 N/L/C 좌표 변환을 따른다. 귀림 44의 정적 뿌리 화면에 축소 자료를 등록하고, 51·52의 지형 타일에는 화면 밖 암면 제외와 동일 경로 재사용을 적용했다. 여섯 장의 PC 12구도와 모바일 에뮬레이션 4구도에서 진입과 그림을 확인했다. 51·52 중앙 휠 프레임 간격 p95는 각각 112→33ms, 105→44ms였다. 단일 환경의 표본이며 전투 프레임률과 구별한다.

## 2026-11-27 · 우물과 귀항 선착장의 축소 렌더링

5-6·5-8·5-9에서 화면 밖까지 만드는 유휴 작업 한 번이 203~281ms를 차지했다. 4-10은 연속 배율마다 정적 해안을 다시 그렸다. 이 장들은 줌 조작 동안 지리 좌표를 공유하는 타일과 원본 정적 랜드마크의 투명 축소본을 사용한다. 축소본은 해당 장에서만 읽으며, 소스 아트·배우·물·접촉 표시와 카메라 범위는 독립적으로 유지한다. PC 휠과 세로 터치 에뮬레이션에서 입구·중앙을 대조했다. 원본 랜드마크의 재출력은 `python tools/terrain-zoom/export.py 46 48 49 40`이다.

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
