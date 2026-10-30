# O05 회귀망령 낙하 종료 수정

기준 master `a0b6b514d91c361f2c394cf56b7f67d30900cd1e`, 작업 브랜치 `fix/sodan-return-fall-20261022`. master/Pages는 변경하지 않았다. 새 묵종 미술,18장 목표/배치, 공통 상호작용, 허공터 초상화/버튼 행은 변경하지 않았다.

**원인:** 실제 스킬은 O05(`wraithReturn`, `returningWraith.ts`의 version1)다. 나갈 때 적을 관통해 표식을 남기고, 지형 swept 접촉에서 망령이 나타난 뒤 역경로로 돌아와 첫 유효 적에게 폭발한다. 그런데 접촉 전3.4초·경로255점·상단y<-700, 전체10초 제한이 있어 높은 곳의 아래 지형에 도달하기 전에 삭제됐다. 예측에도3.4초 종료가 따로 있었다. [수정 전 실제 Engine 재현](before.json): 낮은 각도는y3545.82, 높은 각도는y1462.16에서3.408초에 사라졌고 바닥은y6200이었다. 수직 고각은y-704.43에서2.075초에 사라졌다.

**수정:** O05만3.4초/점 수/상단 화면 밖 조기 삭제를 없앴다. gravity `.14`와 실제 탄도·충돌은 유지했다. 경로가 차면 발사점/끝점을 포함해 같은 궤적을 점진적으로 성기게 표본화하며256점 저장 상한을 지킨다. 접촉 후 귀환 속도1100과 `.32초` 출현, 관통28%·귀환95% 폭발·표식30% 추가·첫 적에서1회 폭발·빈 귀환의 출발점 종료는 보존했다. 접촉 샘플은 Vec의x/y만 저장한다. 기존처럼 Projectile 전체를 경로 점에 넣어 자기참조할 여지도 없앴다.

공중에서 귀환을 미리 시작하지 않는다. 실제 지형에 닿은 뒤에만 출현/귀환하며 그 이후 원래 공중 역경로와 출발점 종료는 유지한다. 화면 카메라의 이탈은 종료 조건이 아니다. 실제 월드 좌우±170/아래+110, 비정상 수치/없는 소유자 방어는 유지한다. O05 무중력 등 비종료 예외는 outbound60초·전체120초 상한으로 정리하고, 지형 접촉 후에는 실제 저장 경로 길이에 맞춘 별도 귀환 deadline을 사용한다. 일반 투사체의 공통 수명/능력치/피해는 올리지 않았다. 과도하게 큰 비표준 맵·중력이 반전되거나 없는 맵에서 반드시 땅에 닿는다는 보장은 하지 않는다.

예측은 같은 outbound 종료 함수와 같은 STEP으로 지형 접촉까지 계산한다. 본게임/허공터/미리보기 모두 같은 Engine을 쓴다. `skill-preview.js`에는 **진행 중인 O05만**22초 반복 초기화에서 제외하는 작은 경계를 추가했다(Engine120초 안전 상한+표시 여유123초). 다른 기예의 시연/허공터 UI는 그대로다. 이 파일의 시연 종료 조건만 별도 UI 작업과 소비 경계가 겹칠 수 있다.

## SHA와 실행 결과

- 수정 코드: `5d1c5866212517d1116dd4df622851fc3defa608`.
- 집중 검사/최종 UI 검사 입력: `29bba00b`의 동일 게임 소스. [Native 결과](after.json)의 checkedCommit은 실행 당시5d1c5866, [브라우저 결과](browser.json)는29bba00b다.
- 공통 build/typecheck PASS. 생성물 커밋: `e3a81ce9`; entry `web/entries/game.18a3d25c3ae89390.js`, preview `web/runtime/shared-runtime-skill-preview.04787118463cb2bc.js`.

| 준비한 정상 중력 사례 | 실제 지형 접촉 | 빈 귀환 종료 |
|---|---:|---:|
| 고도3000→바닥6200, -25°/0.3 |10.175초|14.017초|
| 같은 지형,80°/0.7 |27.675초|36.508초|
| 고도800의 수직90°/1, 화면 위로 갔다 복귀 | [after.json](after.json) 참조 |43.192초|

시뮬레이션 초이며 사람 플레이 시간/스테이지 완주가 아니다. 중력·속도를 높이지 않아 극단 고각의 긴 비행 자체는 남는다. 실제 예측/접촉 일치, 수집/비수집 예측 일치, 최대255점, outbound/manifest/return 세 단계 저장 검증·Engine 복구, 정상 턴 종료·후속 기예, 월드 이탈/NaN/무중력 유한 종료를 확인했다. 별도 가까운 적 fixture에서 관통과 표식 귀환 폭발2회 피해, 원래 폭발 거리 감쇠·계수, 폭발1회, 기력1회 사용과 보고서 uses1/실제 HP 손실 동일·중복 피해0을 확인했다. 기본 O05 미리보기는rank1/8 모두 귀환/피해·원래 프로필 보존을 통과했다.

최종 생성 UI에서 본게임 모드와 실제 허공터에 같은 준비 지형을 놓고 **발사 이후 Engine.fire/tick만 사용**했다. 두120Hz 실제 궤적의 전체 좌표/단계 hash가 같고3.5초/8초에 살아 있으며 바닥 접촉·귀환 후 후속 입력이 가능했다. 긴 미리보기는23.017초에도 같은 시연/투사체가 유지되고37.25초에 귀환 완료 뒤 정상 반복했다. 브라우저 오류/HTTP 실패0. 이는 준비한 물리/전투 fixture이며 정상 캠페인에서 그 고지대까지 걸어 도달한 플레이 증거는 아니다.

[15초 연속 캡처 MP4](evidence/actual-fall.mp4)는120Hz 고정 STEP 실행을0.25초 간격으로 촬영해4fps로 묶었다. 실시간 입력 녹화가 아니라 **실제 Engine의 순차 프레임**이다. 촬영 카메라는 망령을 따라가며 전투 좌표/HP/기력/목표는 발사 뒤 변경하지 않았다. JPG는 각각1MB 미만이다.

- [발사](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/returning-wraith-fall-20261022/evidence/launch.jpg)
- [기존3.4초 제한을 넘긴 공중 낙하](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/returning-wraith-fall-20261022/evidence/after-old-limit.jpg)
- [8초에 계속 낙하](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/returning-wraith-fall-20261022/evidence/falling.jpg)
- [실제 바닥 접촉·망령 출현](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/returning-wraith-fall-20261022/evidence/terrain-contact.jpg)

캠페인 JSON은a0b6b514와 byte exact다. 기존 실제 공개13그래프489파일과 구934 chapter13 JSON2개를 hash/길이로 보존했다. 이번 a0b6b514의 Pages 성공은 이 작업에 전달되지 않았으므로 성공 발행으로 새 등록하지 않았다. 삭제된6개는 기존 활성/중간/실제 공개 보호 집합 밖의 미발행 중간 파일이다. [보존 결과](preservation.json).

재실행은 `node tests/returning-wraith-fall.mjs`, `python tools/testing/returning-wraith-fall-browser.py`. 전체 기예/30장/전역 verify/18장 전투 재실행은 하지 않았다. 터치 실기기/성능 측정과 사용자가 보던 정확한 원래 발사 배치 재현은 미실행이며, 확인된 스킬 종료 원인과 준비 사례 범위에서 수정했다.
