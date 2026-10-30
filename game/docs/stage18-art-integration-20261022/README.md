# 18장 승인 미술 + 완료 진단 통합 후보

부모가 승인한 미술 6507be487521ca72cc7f0dfa8e39e65eadf02028과 완료 진단 d4819235b87a92b2f94b041f1e58d8f222f3e8f1만 통합했다. 기준 master는 793a9a953d6f82038d44dc44b51ea5a01ce996c4이며, 브랜치는 `integration/stage18-art-current-release-20261022`다. 미완료 R29 프로파일/입력 정책 변경은 가져오지 않았다. master/Pages는 부모 담당이며 이 후보를 성공 발행으로 등록하지 않았다.

- 통합 merge: `fd982a4d5caa13d7af08cc68c14c5d04c6fc3865`.
- 최종 소스·검사·캡처 기준 clean SHA: `8a330e27af463de3f953078de6bbd6c3eec34dbe`.
- 승인 미술 소스/생성물 SHA: `f420f2ff03689363b4a4aebc1b35714c2a6f1026`. 통합 공통 빌드를 다시 실행했으며 HTML/web 전체가 6507과 바이트 동일하다.
- entry: `web/entries/game.2e5ecd617e4248ee.js`.
- 현재 18장: `web/data/chapter-18.e8c90b0b6584941a.json` (228462 bytes, SHA256 `e8c90b0b6584941a359d329c4dc3e69fd81f4006cfb48ca46ab4cc06e5624041`).

## 통합 경계와 검사

승인 미술에서 변경된 43개 경로가 6507과 exact이고, 완료 진단의 20개 경로가 d481과 exact다. 유일한 공통 수정은 공개 이력 JSON의 같은 793a 발행 설명 문구였으며 승인 미술 쪽 문구를 유지했다. 793a 성공 발행 사실은 한 번만 존재한다. 새 실행 코드는 검사 도구 `tools/testing/stage18-art-integration-browser.py`뿐이며 게임 런타임 변경은 없다.

| 확인 | 결과 / 실제 범위 |
| --- | --- |
| `npm run build`, `npm --prefix game run typecheck` | 통과. 생성물 전체 6507 exact |
| `tests/stage18-floor-finish.mjs` | 시각 필드만 정규화한 전체 프로젝트 exact; 다른 29장/Library/배우/목표/대사/충돌/27경로 보존. 현재 생성 18장 비미술 exact 및 17장 교정 anchor exact |
| `tests/authored-rock-planes-preservation.mjs` | 15–17 승인 JSON 바이트 재현·멱등·현재 출력/경로 보존 |
| 정적 재사용 | prepare 재사용, sceneVersion 무효화, 반복 draw 신규 Path2D 0, 렌더 상태 순수성. 0/100/200은 기존 강제 미술 fixture이며 자연 하강 증거가 아님 |
| 실제 R22/R29 native App | `tests/stage18-current-checkpoint-review.mjs`: Continue→export whole-battle exact, 접지 body/고정구 actor 동기화 |
| 실제 R22/R29 production browser | 새 검사 도구로 동일 whole-battle exact + 렌더 순수성. 입력 gz 바이트 불변, 기존 저장 미술과 fresh 미술이 다름을 명시적으로 확인 |
| 기존 종 상태/저장 fixture | runtime·점유 이동·App resume·현재 predicates 모두 통과. 합성 상태/국소 이동 검사이며 정상 완주 증거가 아님 |
| 공개 보호 집합 | 11개 실제 공개 그래프 / 479개 immutable 파일 전부 SHA256·길이 통과. 최근 7일 전체 + 최소 2개 정책 유지 |

현재 보호된 793a 공개 사실은 Pages39858691582, `2026-10-22T21:38:56Z`, `game.4fd156b0f594da4a.js`다. 구934의 `chapter-13-assets.1387b6a1f088fc74.json`과 `chapter-13.516170b245a8b075.json`도 보호 집합 안에서 hash/길이를 재확인했다. 삭제된 `chapter-16.7e378696658e362a.json`은 현재 활성 파일/보호 집합에 없으며, 보호 집합 누락으로 처리하지 않았다.

## 실제 저장과 새 미술 화면의 구분

두 실제 저장은 생산 브라우저에서 frame scheduling을 고정한 뒤 production App Continue/export로 읽었다. 새 전투 입력·tick·위치 보정·목표 준비·저장 미술 치환은 하지 않았다. 전체 battle equality에는 원래 미술, 좌표, HP, 기계/이벤트/대사 상태까지 포함된다.

| 실제 저장 | 보존 결과 |
| --- | --- |
| R22 하강 후, 누출 처리 전 | 현재 목표 `leak`; 종 settled / offset200 / count1 / 완료 R16. 소단 `(7137.560542722002,7199.847533920125)`, HP738, act2-floor 접지/validBody true. 네 인물 모두 접지/validBody true. 고정구 target와 actor 상태 exact |
| R29 시작 | 현재 목표 `keeper`; 종 settled / offset200 / count1. 종지기 HP3398/3748. 네 인물 HP 순서 궁수768·법사801·기사1179·도사599, 모두 생존·접지/validBody true |

정상 입력의 R12/R16/R22/R29 기록은 [완료 진단 README](../stage18-current-pacing-20261022/README.md)에 있다. R29 입력 정체는 게임 실패로 판정하지 않았다. 정상18 승리·결과·19장 전환은 아직 미확인이다. 이번 통합에서 전투를 재실행하거나 전체27경로/30장 검사를 추가하지 않았다.

fresh18은 실제 UI 설정→디버그 여정첩→18장 휴식터→입장→도입 넘김으로 열었다. 새 미술의 기본뷰·실제 휠 최소줌·종 중앙 팬·모바일 기본뷰/최소줌·양끝/하단 팬을 확인했고, 종 하부/전체는 별도 선언한 고정 카메라로 확인했다. 전부 위 clean 검사 SHA의 같은 생성물이다. 브라우저 JS/HTTP 오류 0. 모바일 실제 최소줌 `.09846531362867107`, 좌/우 focus `-320/13920`, 하단 focus `9840`을 확인했다. 전체 overview의 `.09`는 검사용 고정 카메라이며 실제 UI 최소줌이라고 부르지 않는다.

선택 사진은 모두 직접 이미지 뷰어로 열었고 각 1MB 미만이다.

- [새 미술 실제 중앙](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage18-art-integration-20261022/review/fresh-center.jpg), [종 하부](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage18-art-integration-20261022/review/fresh-under-bell.jpg), [전체](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage18-art-integration-20261022/review/fresh-overview.jpg), [모바일 중앙](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage18-art-integration-20261022/review/fresh-mobile-center.jpg).
- [실제 R22 / 옛 저장 미술](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage18-art-integration-20261022/review/actual-r22-old-art.jpg), [실제 R29 / 옛 저장 미술](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage18-art-integration-20261022/review/actual-r29-old-art.jpg). 이 두 장을 새 미술 적용 화면으로 부르지 않는다.

승인된 저대비 중간 파단과 큰 종/기존 발판 구도는 그대로다. 깊은 바닥과 일부 가까운 면의 큰 여백도 승인 당시 한계를 유지한다. FPS/ms 개선은 측정·주장하지 않는다. 이번 검사는 승인 미술의 통합 보존 확인이며 새 미술 개편이나 정상 전투 완주 판정이 아니다.

## 재현 자료

자동 결과/대량 캡처는 `_local`에 두고 위 선택 6장만 전달용으로 보존했다.

- `_local/reports/stage18-integration/exact.json`: 두 승인 경계와 생성물 exact, 공개479파일.
- `_local/reports/stage18-integration/browser/result.json`: production R22/R29 equality/접지/HP/기계/입력 hash.
- `_local/reports/stage18-current-pacing-20261022/actual-checkpoints.json`: native App 실제 저장 검사.
- `_local/reports/stage18-floor-finish/preservation.json`: 전체 비미술 exact/현재 생성장/캐시/공개 보존.
- `_local/reports/stage18-floor-finish/integration-fresh/capture.json`, `integration-mobile/capture.json`: clean SHA, 실제 카메라/선언 고정 카메라, source hashes, 오류0.
- `/tmp/stage18-integration-{build,type,preservation,shared,native-save,browser,bell-runtime,occupancy,resume,contracts}.log`.

최종 실행 기록(위 clean 검사 SHA): `node tests/stage18-bell-runtime.mjs` 8개 상태 계약, `node tests/stage18-bell-occupancy-movement.mjs` 4개 직업의 점유 이탈/대기 Continue, `node tests/stage18-bell-app-resume.mjs` warning/waiting/중간 하강 export-import-Continue 및 구18/19 저장·대사 cursor, `node tests/stage18-current-contracts.mjs` 현재 factory/predicates 모두 통과했다. 구19 fixture는 저장 호환 검사이며 새18에서19장으로 정상 진입했다는 뜻이 아니다.
