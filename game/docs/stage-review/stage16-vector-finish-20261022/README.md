# 16장 잠운사 벡터 미술 보완

브랜치 `art/stage16-vector-finish-20261022`, 기준 공개 `19d9fc28623d2451e37cf665145cfdc3e2fdd51f`. 최종 소스·생성물·검사 SHA는 **`3d902a9c83c128267de6a6bad83bffb146bc5dc0`**, entry는 `web/entries/game.d6bc5a0aa4362948.js`다.3회 집중과 별도 종합 화면을 직접 확인한 미술 후보이며 **부모 최종 판단 대기**다. master/Pages는 변경하지 않았다.

[최종 중앙](review/stage16-final-center.jpg) · [전체](review/stage16-final-overview.jpg) · [기단](review/stage16-final-hall.jpg) · [모바일](review/stage16-final-mobile.jpg)

## SOP 설계·보존 카드

2막6장 잠운사,11000×7600. 산문→승려쉼터/접힌 서회랑→대법당·거대 천개불상→기단 아래 기도굴→동회랑/기록방의 기존 공간을 보존한다. 인공 석축의 수평 쌓기와 자연 모암의 불규칙 공유 파단을 구분한다.26충돌/7선언 경로·모든 anchor/actor/marker/목표/스토리/대사/방어·적/밸런스/저장 판정·타29장·원경/물/카메라·기존 Library 자산은 exact 보존한다. 별도 기계적 진단 후보를 병합하지 않는다.

변경은 `act2-floor`와 실제 전체 화면에서 빈 띠가 확인된 `cave-roof`의 공통 정적 terrainPlanes, 법당 양측의 후면 지지 연결이다. 원본 기단/아치·불상·회랑의 자산·배치·디테일은 바꾸지 않았다. 지지는 기존 SVG compile/정적 Path2D를 사용하는 비충돌8path Library 자산1개이며 L1-back에 둔다. 전면 보행선/중앙 아치와 앞 하부 통로를 남기고 밝은 발판 윗면이나 충돌 윤곽을 만들지 않는다. 전용 runtime renderer/프레임 생성/이미지 교체/미세 반복·격자·작은 돌 스탬프는 추가하지 않았다.14/15장의 좌표·면 패턴을 복제하지 않았다.

## 실제 기준과 발행 보존

부모 Library `libfile_737121d1a3808191a86a71893e029669`의 `stage16-before-center.png`를 현행 Library 스킬의 지원 prepare/materialize helper로 시도했다. 최초 및 허용된 별도 로컬 목적지1회 재시도 모두 `library file transfer failed: download failed`, 파일 존재 false였다. 임의 다운로드/인증 우회 없이 중단했다. **원본 PNG는 보지 못했다.**

허용된 대안으로 같은19d 게임 entry `a3ef88844bfd41a4`의 실제 UI에서16장 입장→대화 넘기기→휠2회→가로중앙 팬을 촬영하고 [기준 중앙](review/before-center.jpg)·[전체](review/before-overview.jpg)·[기단 근접](review/before-hall.jpg)을 직접 열었다. 넓은 단색 녹회색 바닥과 기단 양발의 공중 단절을 확인했다. 최종 중앙과 같은 절차/카메라이며 follow·애니메이션 소수점 차이가 있어 픽셀 hash 일치를 주장하지 않는다.

빌드 전에 실제 성공19d/Pages[39842840879](https://github.com/sys8994/honro/actions/runs/39842840879)/부모 확인 updated_at `2026-10-22T19:47:40Z`를 등록했다. 공개 그래프 SHA256 `a8ee964c2df50cc9314268e252d4983699cb1b11a92573819c681185a89fbfe6`, 원본/현재 bytes 검증·복원0. 최근7일 전체+최소2개를 보호하며 미발행 후보는 성공 발행 이력에 넣지 않았다.

## 서로 다른3집중·별도 종합

| 회차 | 직접 본 발견·교정 | 최종 확인·한계 |
| --- | --- | --- |
|1 전체/입구·서회랑·법당·동회랑 | 단색 바닥/천장을 공유 파단으로 저작했다. 첫 일반거리 입구에 큰 세로 면이 남아 선택 면의 내부 공유 경계와 가로로 꺾이는 파단을 보완했다. | 기존 법당·천개불상·접힌 회랑/기도굴의 구도와 자연 모암/인공 석축의 구별을 유지한다. 먼 연장부와 깊은 곳 일부에는 큰 저대비 면을 남겼다. |
|2 근접/기단·기도굴·바닥/천장 | 후면 받침의 중간 가로 음영이 발판처럼 읽힐 여지를 발견해 기단 상단 접촉부로 옮겼다. 기단 양측·기도굴과 원래 배우/석등·공격 시야를 직접 확인했다. | 기단 뒤 지지는 낮은 대비·무외곽선이며 앞 하부 통행선·배우/날아 있는 적·중앙 아치가 읽힌다. 비충돌 후면 지지 해석의 최종 적합성은 부모가 전후 픽셀로 판단한다. |
|3 모바일/기본·최소·양끝·하단 |390×844 실제 UI로 기본 .82/최소 .098465, x−320/11320와 y7840 실제 clamp에 도달하고 직접 열었다. 시작점만 보고 외곽 완료로 세지 않았다. | 바닥/천장 canonical solid 연장부까지 이어져 수직 재질 시작선/빈 사각 영역은 발견하지 않았다. 하단의 큰 저대비 모암은 여백으로 유지한다. 실기기 검증은 아니다. |
|별도 종합 | clean 최종3d902a9c의 새 UI 입장/휠/중앙·전체/기단을 다시 촬영하고 직접 열어 앞 수정의 회귀와 장소·경로·목표/배우의 결합을 확인했다. | 미술 후보로 인계한다. 자동 assertion/면 수가 미술 합격을 대신하지 않으며 부모 승인은 남는다. |

최종 `final-structure`5장·`final-contact`5장·`final-mobile`6장·`final-whole`5장은 모두 같은3d902a9c **clean 작업 트리**에서 촬영했다. JS/HTTP 오류0, 실제 sourceHashes/상태·좌표·목표/배우/캐시 표본은 각 capture.json에 있다. 자동 원자료는 `_local/reports/stage16-vector-finish/`에만 둔다. Git에는 기준3장과 최종 선택9장만 남기며 모두1MB 미만이다.

전체 고정뷰는1440×900 `(5500,3650,.105)` 별도 저작 검수 카메라다. 실제 중앙은1180×757의 UI 입장→대화 넘기기→휠2회→가로 팬 `(5800,5310.79,.173529)` 부근이다. 기단 일반거리 `(6000,4650,.35)`, 양측 근접 .7/기도굴 .6은 명시적 수동 검수 카메라다. 게임 카메라/제한값을 바꾼 증거가 아니다.

## 최종 관련 검사

- `npm run build`, `npm --prefix game run typecheck`, `node tests/stage16-vector-finish.mjs` 통과. 빌드는 최종 커밋에 들어간 동일 미술 입력/생성물에서 수행했고, native/type 최종 검사는3d902a9c에서 실행했다. 로그 `/tmp/stage16-build-contact.log`, `/tmp/stage16-check-final.log`, `/tmp/stage16-type-final.log`.
- 허용 시각 필드/새 비충돌 자산·요소만 정규화한 전체 프로젝트가19d와 deep exact. 보호 project SHA256 `bad64c5c6bc67efad7514126ea0f1a01144e89a886c84b2d4b2df4ebf68e8072`.26전체 polygon/7경로·모든 anchor/actor/marker/목표/스토리·대사/밸런스/저장 초기 계약·타29장·모든 기존 Library와 공통 runtime/main/renderer/UI bytes 불변.
- 기존 사찰/회랑·발판 terrainPlanes exact, 저작 재현·멱등, 바닥/천장 전체 canonical solid bounds coverage, 현재 chapter16 생성물의 재질 exact 통과. 전체 Act2 recipe를 재실행하지 않고 마지막 opt-in 연결만 추가했다.
- 공통 재질 prepare 재사용·sceneVersion 무효화,3회 반복 draw 신규 Path2D0·렌더 battle JSON/Canvas 순수성 통과. 새 후면 자산도 공통 vector prepare 재사용/3회 반복 신규 Path2D0. 정적 재사용은 draw 비용0/동적 FPS 개선/첫 준비시간 동일의 증거가 아니다. 별도 ms/FPS 계측은 하지 않았다.
- 기존 traversal의 `main,undercroft-east`2경로×archer1체형만 선택해 무피해 통과. 적 제거·시작점 초기화·이동력 충전의 격리 물리 확인이며 정상 전투 완주가 아니다. 로그 `/tmp/stage16-routes.log`.
- 공개9그래프465고유 immutable 파일을 실제 hash·길이로 확인했고 구934 `chapter-13-assets.1387b6a1f088fc74.json`/`chapter-13.516170b245a8b075.json`도 보존했다. 보호 파일 삭제/변조0. 정리된 빌드 파일은 미발행 중간 후보뿐이다.

## 선택 사진·완료 경계

[기준 중앙](review/before-center.jpg) → [최종 중앙](review/stage16-final-center.jpg), [기준 기단](review/before-hall.jpg) → [최종 기단](review/stage16-final-hall.jpg). [최종 기도굴](review/stage16-final-prayer-cave.jpg), [전체](review/stage16-final-overview.jpg), [모바일 기본](review/stage16-final-mobile-entry.jpg)/[중앙](review/stage16-final-mobile.jpg)/[왼쪽 끝](review/stage16-final-mobile-left.jpg)/[오른쪽 끝](review/stage16-final-mobile-right.jpg)/[아래 팬](review/stage16-final-mobile-lower.jpg).

전역 렌더러/동선/충돌/목표·원고·저장 판정과 별도16장 기계적 진단은 수정하지 않았다. 전체30장/전체verify·정상16장 완주·17장 진입·미술 외 무관 실패 수리는 수행하지 않았다. 부모 최종 미술 판단과 최신 게임플레이 후보 통합/공개 검수가 남는다. 통합 시 최신 campaign 전체를 옛19d로 덮지 말고 이 helper의 시각 필드/새 자산·요소만 적용해야 한다. 이번 결과 이후 새 장은 시작하지 않았다.
