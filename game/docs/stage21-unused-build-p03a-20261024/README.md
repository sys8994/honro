# P0.3a 미사용21장 데이터 생성 제거

기준 master `46cb2b8d4ca88ec3d24708f07d42b2821fefc9a9`. 제품 소스는 `shared/build.mjs`의 HONRO_STAGE21_PAINTED 읽기/4개 이미지 base64/데이터 생성6행만 삭제했다. 현재 runtimeEntries 목록에 유일한 소비자 stage21-painted-art.js가 없다는 부모 감사의 구현이다. 다른 runtime/engine/map/data/assets/CSS/Workshop 코드는 기준과 동일하다.

HONRO_PAINTED_PILOTS는 휴식터가 쓰므로 유지했다. stage21/painted.json·provider 소스와 stage21/far.webp 등 이미지 폴더도 삭제하지 않았다. 현재 원경은 HONRO_AUTHORED_FAR의 townSky를 계속 사용한다. 비핵심 SVG 실패 처리·나머지 P0.3/P1/P2는 착수하지 않았다.

## 활성 graph와 실제 시작 요청의 구분

| 측정 | 제거 전 | 제거 후 | 차이 |
| --- | ---: | ---: | ---: |
| 활성 해시 파일 수 | 414 | 408 | -6 |
| 활성 전체 bytes | 57,243,988 | 56,414,635 | -829,353B |
| 공통 모듈 목록 | 37 | 36 | -1 |
| Game 초기 요청 수 | 106 | 104 | -2 |
| Game 초기 response body | 10,372,247B | 10,342,901B | -29,346B |
| Workshop 초기 요청 수 | 106 | 104 | -2 |
| Workshop 초기 response body | 13,453,805B | 13,424,459B | -29,346B |

전체 활성 감소는 미사용 데이터 JSON28,841B+JS wrapper276B, 이미지 출력 URL4개799,778B, Game/Workshop bootstrap 각229B다. 이미지4개 중 sky88,974B는 같은 SHA256의 현행 `honro_authored_far-images-townSky.229e09a1c984bb1c.webp`로 계속 존재한다. 제거된 중복 URL과 원본 이미지/현행 원경 제거를 혼동하지 않는다.

실제 cold 시작에서는 JSON/JS2개29,117B와 그 시작점 bootstrap229B만 줄었다. 그4개 미사용 이미지 URL은 기준의 cold Game/Workshop 시작에서 요청되지 않았다. 따라서829,353B 전체를 시작 전송 절감이라고 주장하지 않는다. 수치는 새 Chromium 컨텍스트·같은 로컬 비압축 HTTP의 Ready+500ms 관측 response Content-Length 합계다. prefetch 타이밍이 포함되며 실제 공개 gzip/브라우저·기기별 시간/FPS 향상 측정은 아니다. 보호된 옛 파일은 디스크에 남지만 활성 목록/시작 로딩에 포함되지 않는다.

## 관련 확인과 범위

- `node tests/unused-stage21-build.mjs`: 현재 활성 JS/JSON/HTML과 공통/게임 생성 graph에 HONRO_STAGE21_PAINTED 모듈/문자열 참조0. pilots 생성은 유지. runtime/art/source assets/map/data/engine/CSS/Workshop source 차이0. graph 수/bytes와 남은 sky 내용 hash 확인.
- `python tools/testing/stage21-unused-build-browser.py --before`는 변경 전 생성물에서, 기본 실행은 최종 생성물에서 확인했다. 새 컨텍스트의 cold Game/Workshop 공통 기동, 전후 globals의 데이터 object→undefined/provider undefined 유지/pilots object 유지, 페이지 오류0.
- 현재21장은 Native App으로20장 완료 fixture→21장 진입·도입 완료·stopBattle 저장을 준비한 뒤 실제 Continue로 열었다. 원래 App.frame/rAF를 유지하며 townSky ready와 far 오류 없음/App.lastError 없음, 실제 게임 JPG를 확인했다. 별도 canvas의 고정 카메라844×390 background draw PNG SHA256은 전후 `63241fdb8fc5c76b8bbd45e2ec87dabbc69d994d76401fd843061a62fe3bf847`로 동일했다. 전체 애니메이션 프레임의 픽셀 동일이나21장 정상 완주를 주장하지 않는다.
- 추가로 시도했던 Workshop21장 Playtest 대기는 제품 수정 전 기준에서도 기대 조건을 충족하지 못했다. 첫 실행은90초 timeout, 재시도는 공통 기동 측정3개를 보존한 뒤 중단했다. 이 원인은 이번 범위에서 확정/수리하지 않았고 Playtest 성공으로 세지 않는다. 요청된 Workshop 공통 로딩은 전후 직접 검증했다. 데이터 생성 제거가 Playtest 실패를 고쳤다고 주장하지 않는다.
- `npm run build`, `node tests/web-split.mjs` 통과. 해시/bytes·공통 Native campaign 입력과30장 데이터 일치·Native Game/embedded title·direct Workshop iframe 계약이다. 전30장 플레이/스킬/저장 보호 전체 회귀는 실행하지 않았다.
- 기존 `node tests/profile-store-p01-preservation.mjs`의 순수 immutable byte/hash/source 감사만 재사용했다. 현재408파일과 기존40개 실제 공개 그래프의784파일을 확인했고 이전 발행 메타데이터도 유지했다. 저장 보호 UI 전체 재검사가 아니다.

부모가 P0.2 공개 entry와 실제 debug→여정첩2장→전투 처음부터 확인 후4명 HP 유지를 확인한 발행을 기존 도구로 등록했다: source46cb2b8d, [Pages40058841045](https://github.com/sys8994/honro/actions/runs/40058841045), success2026-10-24T03:37:03Z. hash dedup/최근7일/최소2개 정책을 사용했고 새 후보는 발행으로 등록하지 않았다. 이 부모 증거는 계획표에 구분해 반영했다.

최종 entry `web/entries/game.ecae7cabb80a83fd.js`, manifest SHA256 `c53eef3bff8d6a80d3a2dad45be7308d45e40305e7d8c407924b602319e88084`. 자동 입력/측정/JSON/PNG/JPG는 Git 제외 `_local/reports/stage21-unused-p03a/`에 있다. 실제 사용자 저장·실기기·공개 사이트는 접근하지 않았다. master/Pages는 부모 담당이다.
