# 아이콘 재사용과 여정첩 회귀 수정

브랜치: `fix/icon-cache-journey-navigation`. 기준 master: `275144983f93d0de66bbe6f44ede88a82ca36b56`.

아이콘 단계는 [독립 체크포인트](ICON_READY.md)로 먼저 푸시했다. 전체 최종 런타임은 **47abd35422157fbd1cfb2a72fd1775db38013dbc**다. 이후 증거/검사 보강 커밋은 런타임을 바꾸지 않는다. master 병합과 Pages 배포는 부모 검수 후 부모 담당이다.

## A. 아이콘 체크포인트

런타임 **c04218e4f4761b2d19e457131aae2e2a85fae3a6**, 증거 포함 **f35fa61de2d9f52c0e38bc8fc8d7b64c55d71654**. 여정첩 변경 없이 독립 배포 가능하다. 원인·메모리/재시도 정책·정확한 실행과 증거는 [ICON_READY.md](ICON_READY.md)에 있다.

실제 Chromium의 30회 클릭/30회 선택·기력 갱신에서 기준 master는 버튼 생성/삭제 각각 240회와 SVG 비-ready 관측을 보였다. 수정본은 스킬 ID 버튼·이미지 노드를 모두 유지했고 생성/삭제/SVG 노출 관측/src 재설정/추가 load·decode·네트워크 요청이 모두 0이었다. 기준에서도 네트워크 재요청은 0이었으므로 네트워크 캐시만으로 해결한 문제가 아니다. 모닥불의 수련/수치 갱신은 기존 기예 노드를 유지하고, 장착 순서 교체·실제 선택·잠금·기력 부족·오류→복구를 검사했다. 현행 재설계 스킬에는 cooldown이 null이어서 기존 표시 계약은 검사 전용 cooldown=2 fixture로 확인했다.

## B. 실제 여정첩 변경

소스의 `.journey-pin span`은 이미지 절대 좌표 기반 labelOffset에 `--map-factor`를 곱했다. 확대 때 번호는 고정 CSS 크기인데 라벨 이동량만 커진 것이 이격의 원인이었다. 새 마크업은 labelOffset의 방향만 참고하고, 같은 44px 핀 안에서 화면 px 후보 위치로 이름을 배치한다. 선택 핀을 먼저 두고 다른 번호·배치한 라벨·화면 경계를 고려해 가까운 방향으로 뒤집는다. 핀을 화면 밖에 둔 채 이름만 화면 안으로 끌어오지 않는다. 확대/팬/스크롤/회전/리센터에서 다시 배치하며 원본 이미지 좌표는 번호 앵커에만 적용한다.

`rest-journey.js`의 `progressRoutes`에 원본 좌표의 cubic 제어점 데이터 27개를 작성했다. 원본 그림 위의 별도 SVG이며 단순 직선 연결이 아니다.

- 1막: 나루에서 지상 길을 되짚고 나무다리·관문을 경유한다. 아랫마당9→윗마당10은 계단 쪽으로 연결한다.
- 2막: 지상11·12→13 입구→지하 마을/작업굴/16 사찰→18·19의 한 종→20 별도 출구를 구분한다.19→20은 종 오른쪽 계단/상부 통로로 되돌아간다. 한 종을 두 장소의 별개 종으로 복제하지 않았다.
- 3막: **25→26→27**의 실제 진행 순서다. 지하25에서 지상26으로 돌아갔다가 지하27로 내려가므로 출입 통로를 되짚는 선이 겹친다. 기존24→26→28 /24→25→27→28 공간 관계선은 제거했다. 선은 순서에 따른 이동을 의미하며 지상/지하 선택 분기나 충돌 navmesh가 아니다.

두 끝점이 모두 해금된 연결만 출력한다. 완료는 낮은 명도, 현재 길목으로 이어지는 선은 조금 밝게, 기타 접근 가능한 연결은 더 낮은 명도로 구분한다. 잠긴 막/핀/지명/경로를 새로 노출하지 않는다. 경로 아래의 얇은 점선 밑획으로 대비를 확보했으며 SVG filter는 쓰지 않는다.

상단은 나가기·6개 막 탭·지도 맞춤 한 줄(52px)이다. 잠김/준비 중은 반복된 시각 설명 대신 disabled와 aria-label로 유지한다. 하단은 장소 이름/상태와 작은 휴식터로 또는 진입 CTA(64px)다. 상단 나가기는 기존 휴식터로 돌아가는 동작, 하단 휴식터로는 선택한 장소의 쉼터 진입이다. 큰 제목/중복 지역·이벤트 설명/상시 안내/지도 위4버튼/하단 전체 너비2버튼을 제거했다. 모든 헤더/CTA 터치 영역은 검사한 최소360px 화면에서44px 이상이며 safe-area를 유지했다.

드래그·휠·두 손가락 확대는 유지한다. 지도에 포커스한 키보드 사용자는 `+`/`-`/`0`과 방향 키를 쓴다. 지도와 맞춤 버튼의 접근 가능한 설명 및 맞춤 버튼 title로 안내에 접근한다. 맞춤은 기존600px 최소 지도 폭 제한도 해제해 실제 전체 그림이 viewport 안에 들어오도록 고쳤다. 이미지 지연 로딩/최대2개 디코딩 캐시/오류 재시도, 선택만으로 저장 불변, 휴식터/직접 진입, 확인/취소/낡은 확인 방지, 전투 초기화·분할 원정·진행/보상·막 해금·pending ending 코드는 보존했다.

## 실제 면적과 앵커 계측

Chromium `getBoundingClientRect()`로 기본 선택 상태의 실제 지도 viewport를 측정했다. 기본 이미지가 이 영역을 채운다. 핀이나 기존 도구/안내가 덮는 면적은 빼지 않았으므로 이전 화면의 상시 오버레이 제거 효과는 아래 증가율에 더하지 않았다.

| 화면 | 이전 지도 높이 / 면적 | 수정 지도 높이 / 면적 | 면적 증가 |
|---|---:|---:|---:|
| 390×844 | 603.81px / 235,487px² | 728px / 283,920px² | 20.6% |
| 360×800 | 559.81px / 201,533px² | 684px / 246,240px² | 22.2% |
| 844×390 | 248px / 209,312px² | 274px / 231,256px² | 10.5% |

전후 수치는 [review1-results.json](evidence/review1-results.json), 최종 수치는 [final-results.json](evidence/final-results.json). 최종30개 앵커 각각0.8/1.2/1.8배, 총90개 표본에서 원본 좌표 오차1px 미만/자기 번호와 라벨 겹침0/44px hitbox/근접 배치를 확인했다.9번 라벨 offset은 세 배율 모두(-89,-11.5)px,10번은(-78,-11.5)px였다. 가장자리 또는 다른 핀 때문에 방향을 뒤집는 경우에도 화면 픽셀 간격을 사용한다. 확대9·10은 세로/가로 모두 별도 캡처했다.

## 픽셀 검수와 최종 증거

자동 DOM 검사와 별개로 아래 실제 Chromium JPG를 직접 열었다. 합성·이미지 원본 수정·새 이미지 생성은 없다.

1. [집중 검수1: 구조/지리](evidence/review1-notes.md) — 세 막 전체와 세로9, 상하단 축소/라벨 관계. 약한 경로 대비를 발견했다.
2. [집중 검수2: 가독성/레이어](evidence/review2-notes.md) — 세 막, 가로10, 초기 잠김. Chromium SVG filter가 일부 non-scaling 획을 숨기는 결과를 발견해 filter 대신 밑획으로 수정했다.
3. [집중 검수3: 곡선/모바일 상태](evidence/review3-notes.md) — 실제 보이는27개 곡선,360px 화면, 확대9/10과 선택 하단을 확인했다.
4. **별도 최종 종합 검수** — 커밋된 전체 런타임47abd354에서 다시 캡처하고390×844/360×800/844×390, 초기 잠김, 세 막 overview, 확대9·10 세로/가로 JPG를 직접 열어 확인했다. 경로·번호·이름/현재 선택·화면 점유·해금 경계를 함께 확인했다. 이후 런타임 변경은 없다.

핵심 최종 JPG:

- [390×844](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/icon-cache-journey-navigation/evidence/final-fixed-390x844.jpg), [360×800](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/icon-cache-journey-navigation/evidence/final-fixed-360x800.jpg), [844×390](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/icon-cache-journey-navigation/evidence/final-fixed-844x390.jpg), [최초 잠긴 지도](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/icon-cache-journey-navigation/evidence/final-locked-initial.jpg)
- [확대9 세로](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/icon-cache-journey-navigation/evidence/final-zoom9-390x844.jpg), [확대10 세로](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/icon-cache-journey-navigation/evidence/final-zoom10-390x844.jpg), [확대9 가로](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/icon-cache-journey-navigation/evidence/final-zoom9-844x390.jpg), [확대10 가로](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/icon-cache-journey-navigation/evidence/final-zoom10-844x390.jpg)
- [1막 곡선](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/icon-cache-journey-navigation/evidence/final-act1-overview.jpg), [2막 곡선](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/icon-cache-journey-navigation/evidence/final-act2-overview.jpg), [3막 곡선](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/icon-cache-journey-navigation/evidence/final-act3-overview.jpg)

[전체 JPG 목록/SHA/바이트](evidence/screenshots.json):111개(세 집중 검수·최종·관련 흐름/엔딩 포함), 최대305,984bytes로 각1MB 미만이다. PNG 변환본을 JPG로 꾸민 것이 아닌 실제 Chromium JPEG 캡처다.

[전체 런타임 소스 SHA 목록](evidence/full-runtime-source.json):232개 소스, aggregate SHA256 **b26dad6083dc053b672fdbf9d89ab5265993ed9b8d1f22d0304864a8d900828c**. 최종 실행 코드의 Git SHA는47abd354다. 최종 검사 파일 바이트 SHA는 final-results.json에 별도로 기록했다. [원본 이미지 바이트 감사](evidence/original-image-audit.json):84개 스킬(504,894bytes)+3개 지도 원본 모두 기준 master와 바이트/SHA256 일치.

## 실행과 회귀 결과

2026-10-22, headless **Chromium154.0.8037.57**, 저장소의 정식 외부 모듈 빌드를 로컬 HTTP로 제공했다.

```sh
npm run build
npm --prefix game run typecheck
python tests/icon-cache-journey-browser.py
JOURNEY_REVIEW=review1 python tests/journey-navigation-browser.py
JOURNEY_REVIEW=review2 python tests/journey-navigation-browser.py
JOURNEY_REVIEW=review3 python tests/journey-navigation-browser.py
JOURNEY_REVIEW=final python tests/journey-navigation-browser.py
node tests/skill-image-icons.mjs
node tests/camp-persistence.mjs
node tests/camp-skill-ux.mjs
node tests/rest-journey.mjs
node tests/journey-stage-departure.mjs
node tests/rest-hub-journey-flow.mjs
HONRO_JOURNEY_OUT=game/docs/icon-cache-journey-navigation/evidence/flow python tests/rest-hub-journey-browser.py
HONRO_ENDING_OUT=game/docs/icon-cache-journey-navigation/evidence/endings python tests/rest-hub-act-endings-browser.py
```

모두 통과했다. 각 단계는 해당 코드 시점에서 실행했다. A 전용 아이콘 증거를 B 검사에서 덮어쓰지 않았다. `review1`의 기준 비교는 /tmp/honro-icon-baseline에27514498을 checkout하고 동일 의존성으로 빌드해 제공했다. 기준에서 같은 아이콘 DOM/벡터 회귀를 재현했다. 기존 rest-hub-journey-browser도 기준과 수정 양쪽 모두4개 크기에서 통과했다([기준 로그](evidence/baseline-rest-hub-browser.txt), [수정 로그](evidence/rest-hub-browser.txt)). 기존 검사에서 실패하던 별개 게임 결함을 수정 범위에 끌어오지 않았다. 새 짧은 CTA 문구를 검사하는 기존 assertion 두 곳만 새 표현에 맞췄다.

[빌드](evidence/build.txt)/[typecheck](evidence/typecheck.txt), [여정/대화](evidence/rest-journey.txt), [직접 진입](evidence/journey-stage-departure.txt), [저장/승인/초기화/장착 보존/debug 경계](evidence/rest-hub-flow.txt), [실제 브라우저 흐름](evidence/flow/browser-results.json), [pending 엔딩](evidence/endings/flow-summary.json)을 남겼다. 엔딩 검사는10/20/30장 terminal fixture에서4컷/입력/재로드·파일 가져오기/보상1회/휴식터·여정첩 우회 불가를 확인한 것이다.

검사 준비 중 합성 PointerEvent의 임의 pointer ID가 setPointerCapture에서 거절된 일은 Chromium의 실제 touch 주입으로 바꿔 해결했다. 구현 중 쉼터에 잘못 붙은 지도 키보드 핸들러도 기존 쉼터 브라우저 검사에서 잡아 제거한 뒤 전체 관련 흐름을 재검사했다. 최종 런타임에는 남아 있지 않으며 이 둘을 기존 master 결함으로 기록하지 않는다.

전체 정상 캠페인 완주·실물 모바일/모바일 Chrome 실기기 검수는 하지 않았다. 프로필/종료 상태 fixture, 로컬 Chromium의 실제 UI/포인터·터치 입력과 실제 렌더 캡처의 범위를 구분한다. 지도 선은 그림에 맞춘 여정 연결이며 플레이 충돌 지형을 바꾸지 않는다. 배포 환경의 최종 검수는 부모 통합 후 필요하다.

## 최신 master와 통합 필요성

최종 확인한 origin/master는 **b48423b360b2d6d6b1147c16811685f215a33513**다. 부모가 **8f4cfa68**에서 이 작업의 A 아이콘 체크포인트와 먼저 반영된 조이스틱 수정을 통합하고, b48423b3에 통합 체크포인트를 기록했다. 따라서 A는 이미 master 이력에 있으며 이 브랜치의 추가 B 여정첩 변경을 부모가 이어서 통합하면 된다. `feat/stage-clear-report`는 **66b7cef9cd712b04a2f6acd9fcb23aa9adfe24d6**이며 이 기능을 변경하지 않았다. 조이스틱/통계/경험치 보고서 구현은 이 브랜치에서 손대지 않았다.

[통합 미리보기](evidence/integration-preview.json)는 `git merge-tree --write-tree`만 실행했고 실제 merge는 하지 않았다. A가 들어간 최신 master와의 미리보기에서 런타임 소스 충돌은 없었지만, 동시에 재생성한 HTML/웹 해시·manifest와 BUG_LOG의 추가 문단이 충돌한다. **부모는 양쪽 소스를 보존해 통합하고 BUG_LOG 문단을 함께 유지한 뒤 생성물을 다시 빌드**해야 한다. 이후 아이콘·여정첩·조이스틱 집중 검사를 통합본에서 확인하고 기존 Pages에 배포한다. 생성물을 한쪽 것으로 통째로 덮거나 강제 push하면 안 된다. 차단/승인 대기/결과 불명 쓰기는 없으며, master 통합/배포만 위임 범위에 따라 부모 작업으로 남았다.
