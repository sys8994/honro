# 28장 지반 하단 연속성 후보 — 2026-11-17

## 원인과 변경

세로 최소줌에서 지반 아래 원경이 띠로 드러났다. `tools/map-forge/stage28-record-court.mjs`의 `a3-foundation` 실제 원본 다각형이 y=9000에서 끝났지만 terrainBounds.bottom은27400이었다. edge-portrait 카메라 y3400, scale390/6800, 높이696에서 원본 바닥은 화면669.176px이다. focus 하단 카메라 y3640에서는655.412px이다. 관측된 잘림과 일치하며 타일 컬링이나 Native backend 결함으로 분류하지 않는다.

저작기의 마지막 두 묻힌 바닥 정점 `(16200,9000),(-9000,9000)`만 기존 terrain domain 하단27400으로 연장했다. 보행선·지반 상부·좌우 외곽·색·미술 자산은 바꾸지 않았다. 별도 렌더러 지리나 덧칠을 만들지 않았다. `playProjection.bounds.bottom=9000`은 그대로다. `shared/build.mjs`의 production `applyStage28RecordCourt` 경로를 통해 새 장에 반영한다.

## 확인

`node tests/stage28-foundation-domain.mjs`:
- 실제 production runtimeParts 결과에서 source 두 점27400, 투영9000 확인.
- 수정 전후 projection·compiled collision·battle collision·units·walk edge exact 동일.
- 역변환한 author 원문 SHA가 변경 전 백업과 동일. 같은 입력을 구/신 author에 넣고 두 점을 되돌리면 모든 장과 라이브러리의 전체 project가 동일.
- 입력 project 불변 및 domain validator 통과.

동일 seeded production Scene을 heavy render lock 아래에서 전후 각5뷰로 비교했다. portrait play하단 좌/우, portrait focus하단 좌/우, desktop중앙. 렌더 전후 battle와 physics 불변 검사 통과. 각 A/B의 physics SHA256은 `412e9c8a32aa58a8bff588539fe820a272ae4190f889d346f8922349e1eedbee`로 동일하다.
- portrait 네 뷰에서 아래 원경띠가 없어지고 기존 지반색이 하단까지 연속됨을 원본 PNG로 확인.
- play하단 두 뷰 변경영역 y667~695, focus하단 두 뷰 y654~695. 그 위 픽셀은 동일.
- desktop중앙 PNG는 전후 byte 동일: `730277ab0cabc38fe76347c40b6bac6145cc8aaf4236cb9131639a7dc8bbf511`.

## 증거와 한계

원본author 및 SHA: 로컬 `audit/act3-stage28-20261117/`.
원본5뷰: `_local/reports/stage28-independent-bottom-before-20261117/`, `_local/reports/stage28-independent-bottom-after-20261117/`. 같은 폴더의 report.json에 실제 카메라와 물리 검증 기록. PNG별 SHA와 변경 bbox는 `audit/act3-stage28-20261117/image-comparison.json`.

Native production 검사이며 실제 공개 Game/브라우저·모바일 실기기·화재/물/문 상태 변화·완주 검수가 아니다. 사용자 기존 저장이나 전투는 열지 않았다. 저장된 world polygon을 변환하지 않으므로 과거 진행 중 전투에는 이전 지반 그림이 남는다. 원격 반영·CI·Pages·공개 확인은 이 로컬 후보 문서의 완료 범위가 아니다.

초기 조사 명령의 stdout buffer 부족 및 최초 캡처의 cwd 오류는 수정 전 종료됐고 해당 실패에서 PNG는 생성되지 않았다. 올바른 cwd의 전후5뷰를 위 증거로 사용한다.
