# 12장 실제 지형 교정 V3 — 부모 화면 판정 대기

실행·빌드·최종 화면 소스는 **`4b0465b134eda0dae6522e61a4fb21cb5be8efe6`**다. 기반은 기존 후보 `72679f45`(렌더 소스 `9ec228a5`), 기준 master는 `ee73add57bc27357abdbe2d1c606c9017e393351`이다. 브랜치는 `stage/act2-ch12-geology-v3`, 작업 트리는 `/workspace/honro-stage12`다. 이전 두 불합격 후보의 판정을 바꾸지 않는다. 이 후보도 부모의 픽셀 판정과 통합 순서를 기다리며 **master 통합·Pages 배포는 하지 않았다.**

## 실제 변경

- `sq-north-quarry` / `sq-west-quarry`의 긴 밑변을 깊이가 다른 큰 절리와 깨진 암괴 외곽으로 교체했다. 실제 canonical polygon을 바꿨으며 렌더 경계와 사격 경계가 같은 형상을 쓴다. 바뀐 밑면에 연결되는 중간 규모 암면을 근경 벡터 코드로 저작했다.
- 서쪽 낮은 발판과 중앙 `sq-inner-joint`는 하부 기반이 올라오는 실제 암반 어깨에 합쳤다. 예전 공중 회색 판 아래의 빈 통로를 비충돌 solid 그림으로 메우지 않았다. 두 순환 연결은 유지하며 새 기반 위를 이동한다. 관련 DE/ED/EF/FE/CF/FC 앵커도 실제 표면에 맞춰 다시 저작했다.
- 오른쪽 `sq-cave-buttress`의 수직 왼쪽 벽은 비대칭의 큰 절리 외곽으로 바뀌었다. 통로는 실제 열린 공간이다. 뒤쪽 모암은 기존 에셋·bounds를 유지하면서 대비를 낮춰 앞의 충돌면/이동 공간과 구별하고 동쪽의 긴 수직 끝도 꺾었다.
- 서쪽 높은 발판과 동쪽 작은 발판은 머리 여유와 왕복 도약을 위해 별도의 작은 암체로 남기되, 실제 단면을 비대칭으로 바꿨다. 동쪽 GB 도약은 뒤쪽 끝 x8937에서 낮은 수평 입력으로 시작하도록 저작했다. 작은 발판을 모두 제거했다고 주장하지 않는다.
- 새 기반에 맞춰 같은 편성의 `sq-e3/f3/f4/f7/f8` 높이, 서쪽 수레 진입 기준, 중앙 소나무/전석 접지를 갱신했다. 유닛 ID·종류·정예/역할/수비 지정, 38명/10정예·활성화·예산, 목표/서사/두 출구/카메라·이미지 원경은 보존했다. 다른 29장과 Library 전체는 원본과 동일하다.
- 캠페인12 map revision을 1로 올렸다. 구전투만 같은 장 입구로 다시 시작하고 성장·SP·장착·완료/분기 기록을 보존한다. 구 정상 승리 저장은 원본 경로에 그대로 남겼다.

닫힌 사건 봉인의 요철 실험은 서쪽 접근에서 `invalid supported body pose`를 일으켜 철회했다. `sq-turning-veil`은 원래 직사각형 충돌을 유지한다. 서쪽 높은 발판을 위 암반에 직접 연결한 실험도 기존 내려가는 길을 막아 철회했다. 이 두 실패를 성공으로 포함하지 않는다. 첫 암반 밑면의 톱니 반복과 덧붙인 네모 면도 후속 큰 면 저작에서 줄였다.

## 화면 검수와 정확한 경로

모든 경로는 `evidence/geology-v3/` 기준이다. PNG는 실제 production 브라우저 원본이며 이미지 생성·편집·합성은 하지 않았다.

1. **집중1 구조/지지:** 미커밋 지형 초안 `focus1/` 중 `center-overview`, `north-face`, `west-ledges`, `right-wall` 4컷을 직접 열었다. 밑면의 잦은 톱니 반복과 발판의 사각 인상이 보여 불균등한 큰 암괴로 조정했다. 캡처10컷 중 이4컷만 이 회차의 직접 검수 증거다. 다른6컷을 직접 봤다고 기록하지 않는다. 초안 변경 및 dirty 상태는 `focus1/capture.json`에 남아 있다.
2. **집중2 일반 거리:** 미커밋 후속 지형/암면의 `focus2/` 5컷을 모두 직접 열었다. 중앙 얇은 발판이 여전히 떠 있어 실제 하부 기반에 연결했고, 서쪽 높은 발판의 연결이 내려가는 길을 막아 분리했다. 보행 테두리는 실제 충돌에 남기고 뒤쪽 지지 그림 대비를 낮췄다.
3. **집중3 화면비/카메라:** 미커밋 후속 `focus3/` 7컷을 모두 직접 열었다. 390×844 세로3, 844×390 가로1, 최대확대1.65, 최소줌0.2117647059의 서쪽/동쪽 외곽을 보았다. 동쪽 후면 암반의 긴 수직 끝이 보여 최종 소스에서 꺾고 대비를 더 낮췄다. 사건 봉인의 요철은 이동 검사의 실패로 원형 복귀했다.

**별도 최종 종합:** 소스 `4b0465b1`의 `final/` 14컷과 실제 정상 저장의 `progress-lower/` 7컷, `progress-upper/` 7컷을 모두 직접 열었다. 변경한 중앙/서쪽 접점, 일반/최대확대/최대축소/모바일, 닫힘→개방, 상하 승리 위치, 결과·쉼터·13장 진입을 확인했다. 모든 최종 화면의 파일 SHA256과 직접 열람 여부는 [CORRECTION_V3.json](CORRECTION_V3.json)에 있다. 모바일0.55를 실제 최소 줌이라고 부르지 않는다.

정상 거리의 넓은 평면 구성과 원래 소나무의 단순한 공통 벡터 언어는 남는다. 서쪽 높은 발판과 동쪽 작은 암체도 별도로 남는다. 미술의 최종 수용 여부는 부모가 아래 원본을 보고 판단한다. 검사 숫자나 기존 후보를 근거로 합격시키지 않는다.

`before/`는 깨끗한 `72679f45` detached worktree의 기존 빌드에서 같은 카메라로 새로 촬영한14컷이다. `before/capture.json`의 source/dirty 상태를 보존했다. 전후 비교는 다음이 대표다.

| 대상 | 이전 | 최종 |
| --- | --- | --- |
| 큰 북쪽 암반 | [원본](evidence/geology-v3/before/stage12-north-face.png) | [최종](evidence/geology-v3/final/stage12-north-face.png) |
| 서쪽 발판/기반 | [원본](evidence/geology-v3/before/stage12-west-ledges.png) | [최종](evidence/geology-v3/final/stage12-west-ledges.png) |
| 중앙 실제 암반 어깨 | [원본](evidence/geology-v3/before/stage12-inner-ledge.png) | [최종](evidence/geology-v3/final/stage12-inner-ledge.png) |
| 최대확대1.65 | [원본](evidence/geology-v3/before/stage12-joint-maxzoom.png) | [최종](evidence/geology-v3/final/stage12-joint-maxzoom.png) |
| 모바일 중앙 | [원본](evidence/geology-v3/before/stage12-mobile-joint.png) | [최종](evidence/geology-v3/final/stage12-mobile-joint.png) |
| 오른쪽 받침/닫힌 통로 | [원본](evidence/geology-v3/before/stage12-right-wall.png) | [최종](evidence/geology-v3/final/stage12-right-wall.png) |
| 개방 후 실제 이동 | 구 후보는 기존 `evidence/correction-v2/progress/gate-open.png` | [B경로](evidence/geology-v3/progress-lower/gate-open.png) / [A경로](evidence/geology-v3/progress-upper/gate-open.png) |

## 최종 지형의 기능 증거

프로젝트 해시 `afc453d8d139a6eab6a4721d56721cb8dc6b1b4a4ec1b0dde0656205b745cf62`. 실제11장 승리 성장 입력의 raw SHA256은 기존과 같은 `ab5f11de3ea79b5955978c07050b01bb6d7d557404a85f8110c09a95c5679421`이다.

- **정상 B 승리:** R8, 4인 생존, 잔적34, 81개 입력/이동 기록. 길표는 소단이 실제 조사했고 담허가 근처에 있어 현행 분기 대사가 발화했다. **정상 A 승리:** R17, 4인 생존, 잔적28, 155개 입력/이동 기록. 높은 작업굴 수비와 교전한 뒤 출구 A에 도착했다. 양쪽 heal3/focus3/cleanse2/ward2 유지, 외부 actor/자원 쓰기0·복구0이다. 두 실행은 원본 App/Engine의 native 입력 정책이며 DOM/storage/clock만 double이다. 인간 플레이나 전투 전체 브라우저 재생으로 부풀리지 않는다.
- `normal-lower/`, `normal-upper/`에 initial/길표/개방/마지막 라운드/terminal 원본을 무손실 gzip으로 보존했다. `inputs.json`의 raw SHA와 runner 원문 SHA가 결과와 일치한다. 초안의 R11 결과는 최종 결과 대신 사용하지 않았다.
- 두 실제 terminal 저장으로 production Continue·성장/보상·중복 지급 방지·export·쉼터·13장 A/B entry variant·장착 이관을 native App에서 각각 통과했다. 각각의 실제4개 저장을 production 브라우저에서 Continue하여 좌표/HP/focus/이동력/사망을 그대로 확인하고 결과·쉼터·13장 UI를 실제로 사용했다. 두 브라우저 모두 pageerror0이다. 각 `progress-*/result.json`과 `normal-*/transition.json`을 참조한다.
- `tests/stage12-quarry-traversal.mjs`: 변경한 실제 지형의 18개 양방향 연결 + 누락 발판 복귀2 + 닫힌 통로 접근/후퇴2, ×4체형 =88건. 바닥/머리/몸통 접촉 표본845개 통과. `checks/all-traversal.json`은 최종 `passed:true`다. 별도 현행 상/하 출구 ×4체형8경로도 통과했다. 이 검사들은 초기 지지 좌표·배우 격리·이동력 보충을 사용한 **격리 이동**이며 정상 전투 증거와 구분한다.
- `tests/stage12-geology-shots.mjs`: 원본11장 성장/기예로 초기 지지 좌표만 설정하여 변경한 중앙 어깨, 뒤쪽 굽이, 서/북 채석면에서 실제 적 피해4곳, 바뀐 북쪽 밑면의 실제 위쪽 탄 충돌1곳을 통과했다. 적 삭제·자원 추가는 없다. 다른 아군만 격리했고 정상 전투로 주장하지 않는다.
- `tests/stage12-geology-save.mjs`: 실제 구저장5개에서 전투만 새 지형으로 재시작하고 성장/남은SP/수련/장착/완료 기록을 보존했다. 새 revision 전투는 정확히 Continue했다. 기존 완료12 기록도 그대로13장 B 진입하며 Workshop snapshot은 제외한다.
- author2회 전체30장/Library 동일성과 실제 CLI 바이트 무변경, 원본 build, render 상태 불변·transform/alpha 복구·cache/scene invalidation/opt-out 통과. manifest current248/retained15 참조가 모두 존재한다. `checks/`에 원본 결과를 보존했다.

새 공개 Pages 검증·13장 전체 검수·다른29장 전체 플레이·모바일 GPU 성능 검사는 하지 않았다. 기존 Library 업로드 결과 불명/공개403을 재시도하거나 우회하지 않았고 새 Library ID는 없다. 요청에 따라 Git 원본 evidence로 전달한다. 완료된 수정과 로컬 검증은 원격에 보존하며, 부모가2장 작업과 통합 순서를 정할 때까지 대기한다.
