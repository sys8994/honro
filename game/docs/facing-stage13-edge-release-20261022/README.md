# 방향·13장 왼쪽 경계 통합

**후속 보강:** 아래 두 슬롯 예외는 미발행 검토 기록이며 폐기했다. 최종 후보는 [7일 실제 발행 보존](SEVEN_DAY_RETENTION.md)을 적용한다.

기준 master: `a23dffb5afab998646817ffd3ee9732d99ce3172`. 승인 입력은 방향 `611bfd4b1cf87e7a2f7240df7b38158442141283`(런타임 f3ac0953)와 13장 경계 `9f3050dad256d4b7895d9c79db4d6ef306fc40e3`. 두 원격 브랜치의 ancestry를 병합하고 이전 HTML/web은 가져오지 않았다. 정상 통합 build와 실제 브라우저 검사의 정확한 코드+생성물은 **`6ddf93f7d280674b54d552978d19adf1ec788237`**다. 이후 이 기록만 추가한다. master/Pages는 부모 담당이다.

생산 소스의 master 대비 차이는 `shared/map/units.js`, `tools/environment/stage13-vector-finish.mjs`, 그 출력 `shared/data/campaign.json` 세 파일뿐이다. 각 승인 입력과 byte-identical이다. 최신 NPC/BASE4 UI, 11장 미술/렌더·오디오·BGM7개와 발행 보존 소스는 master와 동일하다. 새 대사와 11장 퀘스트는 합치지 않았다.

## 긴급 보호 934: 등록 전 발견과 최소 조치

그대로 최신 발행을 등록하면 기본 두 슬롯이 `[최신,989]`가 되어 보호 중인 934가 탈락한다. `planWebAssetRetention`의 실제 삭제 계획에서 `chapter-13.516170b245a8b075.json`, `chapter-13-assets.1387b6a1f088fc74.json`이 다시 삭제 대상으로 나오는 것을 확인했다. 이 위험한 상태를 커밋하거나 발행하지 않았다.

이번 릴리스는 기존 manifest의 보존 후보에서 **934를 우선 유지**한 뒤 기존 도구 `node tools/release/retain-published-web.mjs e974bfe7a1138b55c5b4648e8a38e192ad0a69f6`를 실행했다. 실제 발행 기준은 부모가 Pages39804701720 success를 확인한 e974이며, a23의 활성 그래프도 이와 같다. 실행기의 별도 Pages 실행 이력 조회는 Forbidden으로 차단되어 반복/우회하지 않았다.

최종 두 슬롯은 `[e974,934]`이며 989를 별도 고정 슬롯에서 제외했다. 보존 상한·도구·빌더·로더 실행 코드는 바꾸지 않았다. e974 활성355파일과 934 활성351파일 전체가 원본 SHA256과 같다. 동일 실제 발행의 재등록과 정상 build 반복 뒤에도 Git 추가 변경0이며 두 보호 파일은 유지된다. 이 비활성 보존 파일을 현재 초기 요청 목록에 추가하지 않는다.

**사용자의 실제 재시도 성공 회신 전에는 다음 발행 등록에서도 934 우선 보존을 유지해야 한다.** 차기 새 그래프를 일반 등록하면 다시 밀려날 수 있으므로 자동으로 현재 두 슬롯을 회전시키지 않는다. 두 슬롯 안에서 실제 최신 발행과 보호 934를 선택한 뒤 아래 old-client 검사를 실행한다. 무기한 과거 전체 누적이나 옛 runtime 중복 연결은 없다.

## 통합 확인

- `npm run build` 두 번, `node tests/web-split.mjs`, `node tests/web-build-retention.mjs` 통과. manifest SHA256 `b9dccb020b799c4aaab5e9b75516ae4aced6afc7504fdafb903a0d2ae6e2e641`.
- `node tests/spawn-facing-aim.mjs`, `node tests/aim-readout.mjs`, `node tests/joystick-intent.mjs`: 신규 생성/explicit pair·저장 보존, mirrored HUD/각도, 20도 포함 경계·방향 hysteresis 통과.
- `node tests/stage13-vector-art.mjs`: 승인161면/순서 동일, 외곽20면·130 coverage 표본, 충돌/배치/서사/다른29장 불변, 재현/멱등·렌더 상태 불변·prepare 재사용/버전 무효화·cached draw 신규 Path2D0. 종전 검사 중 runtime 소스 비교 기준만 934에서 이번 기준 master a23으로 갱신해 승인된 UI를 보호한다. assert를 제거하지 않았다.
- `python3 tests/stage12-next-load-browser.py`: 390×844, 934 열린 클라이언트→삭제 배포 모사→실패/실패 재시도→같은 탭에서 현재 자료 재시도→13장 쉼터/전투. A/B 모두 통과. 새 현재 탭에서 결과 시점 완료 저장 Continue도 A/B 통과. 네 경우 모두 XP/레벨 heroes·클리어/서사 기록·clear report 동일, 12장 visits=1, pageerror0.
- 보호 두 URL의 실제 로컬 HTTP 응답200 및 Git 원본과 전체 바이트 동일: 본문57580B/hash `516170b245a8b07515d056a25cd841526898fb4f2bc6c0c28c51d4bf9624e701`, assets24657B/hash `1387b6a1f088fc74db0214c2d751d5069ad7c298bc6cacc071f2d0b42296e07d`. 아직 발행하지 않은 이 후보의 공개 HTTP 성공으로 표현하지 않는다.
- `python3 tools/testing/spawn-facing-aim.py`: 기존 production 자연 rAF/신뢰된 키보드·touch/실제 충전·발사/Continue·retry 검사87상태, 오류0. 대표 설오 왼쪽/오른쪽 충전 JPG를 직접 열어 몸·무기·궤적 방향을 확인했다. legacy explicit 불일치 저장을 추정 교정하지 않는다.
- `python3 tools/testing/stage13-left-edge-capture.py integrated-release`: 실제 UI 입장→wheel2회→왼쪽 팬→아래 팬, 별도 전체 고정 뷰5장. pageerror/HTTP실패0. wheel·아래 팬 사진을 직접 열어 옛 x=-500 수직 재질 시작이 사라지고 왼쪽 층리가 이어짐을 확인했다. actor/주민 HP/목표 유지, world/screen cache hit 증가. 초기 준비·draw 비용0/FPS 향상 주장이 아니다.

자동 결과는 `_local/reports/facing-stage13-edge-release/`, 기존 검사 출력은 `_local/reports/spawn-facing-aim/`, `_local/reports/stage12-next-load-hotfix/`, `_local/reports/stage13-left-edge/integrated-release/`에 보존한다. 대표 사진은 `after-p-archer-charge-left.jpg`, `after-p-archer-charge-right.jpg`, `wheel-left.jpg`, `pan-left-lower.jpg`이며 이번 통합 생성물에서 촬영했다. 과거 브랜치의 사진을 이번 최종 화면으로 재사용하지 않았다. 전투 종료/기존 QA 진행 fixture를 사용했으며 전체 캠페인 완주·사용자 실제 저장 실행·실기기 성능을 검증한 것은 아니다.
