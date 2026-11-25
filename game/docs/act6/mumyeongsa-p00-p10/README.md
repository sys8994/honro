# 무명사 P00 기준선과 P10 시안·경계 설계

[54→55→56 C 천장과 첫 가름진 역류](torn-eave/README.md) · [53→54 본편 B와 첫 벽 교전](native-b/README.md) · [54→55→56 실제 M09 및 저장 수정](relay-fix/README.md) · [B 수직 슬라이스](proof-slice/README.md) · [P00 보강·선택안 보정](second-pass.md) · [실행·검수 계약](../ACT6_MUMYEONGSA_REBUILD_20261125.md) · [추가 경계 검수 계약](../ACT6_MUMYEONGSA_SEAM_CHECKS_20261125.md) · [A→B→C→D 연결 설계](continuity.md)

기준 앱은 master `dd409de2e635c5c0b16877266c1bb233d5a00fd7`의 추적된 `HONRO.html`과 `web/`이다. 작업 브랜치의 고정본 `b51c9ad5757c6e6913daf2d3c0dcbdda87b9b863`과 추가 요구 `4eca508af2c8a44868e1c04669950b7baf341a53`은 각각 문서 한 개를 추가했다. 아래 브라우저 증거는 로컬에서 재생한 그 앱 파일을 사용했다.

## P00 브라우저 기준선

Chromium 154.0.8037.57, 1440×960, 매 장 새 컨텍스트, 실제 `HONRO.html` → 설정 → 기록 관리 → 디버그 → 여정첩 6막 → 장 선택 → 진입. 앱의 신뢰된 클릭 경로에서 정식 모듈과 고정된 연습용 출발 기록을 불렀다. 영웅 Lv25, UI 기본 난이도, 엔진 최초 RNG 19388, 월드 충돌 몸체 h=92/r=22였다. 시작 팀과 장착은 각 JSON의 `entry.units`에 있다. 키보드 → 이동 0.32초와 Ctrl 도약, 뒤이어 F로 적 턴을 열었다. 58/59의 추가 표본은 역할 선택, 실제 걷기, 58의 두 표식을 순서대로 클릭한 뒤 이어서 측정했다. 게임 파일에 계측 코드를 쓰지 않았다. 브라우저 내부에서 원래 `fire`와 `hurt` 반환을 관찰했으며, 실측은 이 입력 정책과 관측 구간에 해당한다.

- **시작 / 누적 관측**은 적대 전투 실체 ID 수다. 52의 `cliff-stone`은 실제 roster의 side=1, 엔진 후보에도 들어가지만 고정 사격 표적이며 공격 기예가 없다. 57의 담허 육신과 60의 혼 둘은 side=2다.
- **활성 최고**는 관측한 프레임의 `combatEnemies()` 최대치에서 표적을 뺀 값이다. **실제 공격**은 발사가 승인되거나 아군 HP·실드에 실제 감소를 준 서로 다른 적의 수다. 괴이 이동 교란만으로 성립한 공격은 이 집계에서 별도 미측정이다.
- **과거**는 [클로드 1~7장 인계서](https://github.com/sys8994/honro/blob/4212a1c7cd706361c8dea33c3664b1df17dd77b1/game/docs/act6/ACT6_CH1-7_REVISION_HANDOFF.md) 당시의 시작→누적이다. **소스 누적**은 현행 패킷과 소유 모듈이 제공하는 출현 경로 또는 후보 상한이다. 조기 종료·예비대 지연·실제 교전 결과에 따라 달라진다.

| 장 | 시작 | 누적 관측 | 활성 최고 | 실제 공격 ID 수 | 관측 종료 | 현행 소스 누적 | 과거 인계 |
|---|---:|---:|---:|---:|---|---|---|
| 51 | 4 | 4 | 0 | 0 | 라운드 4, aim | 4 시작 개체 | 4→4 |
| 52 | 3 | 3 | 1 | 0 | 라운드 4, aim | 3 공격 개체 및 고정 사격 표적 1 | 3→3 |
| 53 | 2 | 2 | 1 | 1 | 라운드 4, aim | 2 시작 개체 | 2→2 |
| 54 | 0 | 0 | 0 | 0 | 라운드 4, aim | 0, 전투 없음 | 0→0 |
| 55 | 4 | 4 | 4 | 2 | 라운드 1, enemy | 4 시작 개체 | 4→4 |
| 56 | 3 | 3 | 1 | 0 | 라운드 4, aim | 4. 역류 확인 때 `draft-pressure-3` 추가 | 3→4 |
| 57 | 2 | 2 | 2 | 2 | 라운드 1, flight | 3. 석교 난간 사건 때 차단 적 추가 | 2→3 |
| 58 | 0 | 5 | 5 | 4 | 라운드 5, flight (문턱 기믹까지 진행) | 최대 12 제공. 1상 보스·그릇 2, 3상 유지점·먹선 2, 괴이 6. 동시에 존재할 수 있는 괴이는 최대 2 | — |
| 59 | 1 | 5 | 5 | 3 | 라운드 3, flight (휘겸 교각까지 진행) | 최대 37 제공. 개별 위협 3, 서 16·동 17, 조건부 거대 앞발 1. 웨이브 cap은 전선 6·전체 16이며 앞발 이후 전선식 보정 +1 및 별개 개체가 있다 | — |
| 60 | 0 | 0 | 0 | 0 | 라운드 1, aim | 0. 인도 대상 두 혼 | — |

[입력·공격·접지 CSV](baseline/observations.csv) · [10장 투입/입력 원시 JSON](baseline/raw/) · [54·58·59 집중 표본](baseline/focus/) · [패킷 SHA·원본 지형 점/경계·후보 roster](baseline/packets.json)

58 입장에 적 0을 확인한 뒤, 소단으로 기둥(x=3496)에 접근하고 담허로 문턱(x=3680)에 접근해 실제 응답을 둘 다 발동했다. 대도사 및 그릇 2개체가 `local-lower-08-body`에 서서 등장했고, 두 괴이까지 총 5 ID를 보았다. 적대 HP·실드 감소로 대도사·그릇 2·첫 괴이 1의 공격을 확인했다. 초기 `local-sealed-axis`의 (+320,0)은 `projectileOnly:true`였다. 59는 휘겸으로 교각에 가서 상부 적과 서측 1차 분대를 보았다. 동측 분대, 거대 앞발, 최대 상한 및 종결까지의 누적은 미실측이다.

55와 57의 방어 표본은 각각 enemy/flight에서 다음 aim을 기다리는 5초 관측창이 끝났다. 브라우저 예외나 HTTP 오류를 기록한 경우는 없었다. 짧은 방어 관측, 첫 화면의 애니메이션, 실제 장간 완주를 서로 대체할 수 없다.

## 지형과 장 경계 관측

아래 `지형범위`는 런타임 terrain bounds의 좌·상·우·하, 괄호 안 수는 플레이/월드 지형 레코드 수다. 월드 범위 안에 시야·콜라이더가 어디까지 분포하는지는 [원본 패킷 계측](baseline/packets.json)에서 확인한다. 각 첫 화면의 아군을 전원 접지 검증하고 해당 입력 주체가 이동 및 Ctrl 착지 뒤 다시 접지한 것을 확인했다. 장 끝 칸은 현재 소스의 전환 또는 검증 조건이다.

| 장 | 플레이 크기 / 지형범위 | 시작 접지와 화면 | 현행 장 끝 → 다음의 소스 관측 |
|---|---|---|---|
| 51 | 7200×5400 / −6400,−9800,12900,17100 (2/2) | 네 명 `mountain-main` [화면](baseline/screens/stage-51.webp) | x6740 관찰턱에 네 명과 정예 해소 → 52 외부 별도 시작 좌표 |
| 52 | 6250×6250 / −6500,−9800,13000,17000 (10/10) | 네 명 `west-watch-and-descent` [화면](baseline/screens/stage-52.webp) | 사격 지지석·석교·종터, x4480에 담당 확인 후 전원 종터 접지 → 53 담허 단독 시작 |
| 53 | 3000×3000 / −305,−285,3425,3450 (5/5) | 담허 `south` (425,2476.99) [화면](baseline/screens/stage-53.webp) | 네이티브 양단 진목 사용 x425→2640, 상부 진목 실제 충돌 x2450~2600 및 출구 x2710~2740/y520~590 → 54의 독립 foothill 발점 |
| 54 | 3200×3000 / −260,−280,3580,3450 (5/5) | 담허 `foothill` (250,2655.64) [화면](baseline/screens/stage-54.webp) | N→L→C→L, L `mid-contact`의 M09 증거와 x2308~2324/y2926~2934 출구. 55 live 진입과 저장에서 말뚝 y2930 재확인 |
| 55 | 6800×3200 / −4496,−1992,11536,11768 (6/6) | 휘겸·설오 `west-ring-descent`, 소단 `arrival-core-terrace` [화면](baseline/screens/stage-55.webp) | 바깥 세 앵커·빈 종터 조건과 별도 담허 보관 → 56 정상 veranda |
| 56 | 6720×5040 / −4528,−1992,11488,13776 (11/11) | 담허 `A-upper-veranda` (928,1136) [화면](baseline/screens/stage-56.webp) | 첫·둘째 진목, 가름진 역류와 낮은 턱 대피, x6400/y3368 `E-joined-ordinary-floor` → 57 수성 셋 |
| 57 | 7200×3600 / −3200,−3100,11320,7400 (7/7) | 조작 셋 `local-lower-07-west`, 담허 몸 `a6-c07-stationary-stone-ward` [화면](baseline/screens/stage-57.webp) | 석교 열림·육신 회수 뒤 원본 넷이 `local-07-08-exact-receiving-slice`에 접지. 경계의 x−3200, y+758 검증 → 58 |
| 58 | 7200×3600 / −3600,−3250,11440,7500 (2/2) | 네 명 `local-lower-08-body` [화면](baseline/screens/stage-58.webp) | 대도사 및 유지점 해소, 수정 진목·네 몸 귀환. 이동 순서 넘기기는 가능. 59에서 네 좌석 재배치 |
| 59 | 7800×4700 / −5000,−2100,13000,14700 (2/2) | 설오 `finale-cutout-west-terrace`, 다른 셋 `finale-cutout-near-body` [화면](baseline/screens/stage-59.webp) | 가름진, 위협을 격퇴 또는 처치, 방패선 증거를 갖고 → 60 네 몸과 상처 유지 |
| 60 | 7200×4100 / −5000,−2100,13000,14700 (2/2) | 담허 `return-cutout-upper-ledges`, 나머지 `return-cutout-near-body` [화면](baseline/screens/stage-60.webp) | 비전투. 두 혼 실제 인도 및 네 명 접지 뒤 카메라/엔딩 연결 |

집중 표본에서 54의 담허를 합법 입력으로 N의 (550.76,2685)까지 걸린 뒤 상호작용했다. L 3000×3200의 동일 `foothill` (2639,2780.10)에 정상 아래 방향 (0,320)으로 다시 붙었다. N/L 두 장 모두 접지 유효다. x522.32에서 먼저 시도한 입력은 관측 시간 내 차트가 바뀌지 않았고, 같은 장의 유효 마크 내 위치를 바꿔 재실행했다. L→C→L·M09·55 live/reload는 검수표에 별도 남겼다. [L 착지 화면](baseline/screens/legacy-54-N-to-L.webp) · [집중 로그](baseline/focus/stage-54.json)

### 실제 벌크와 축척 참조

[1막 1장 승인 미술 화면](../../art-reviews/stage1-balanced-20261019/stage1-normal.webp)의 명암·재질·원경 깊이 분리를 참고했다. 활성 BODY는 [지형 SOP](../../TERRAIN_PRODUCTION_REVIEW_SOP_20261120.md)의 1막 1·2장 계측과 원격 소스의 두 blob이 같다. 1장 `9868e01095bebbab67f6d4eea7dea14b1b9f64dc`, 2장 `94bc93576e97e4154645361f8356b82be87c00ec`. 아래 수치는 SOP 당시 동일 바이트 BODY의 플레이 ROI / 엔진·에셋 clip을 합성한 참조다.

| BODY | 실측 벌크 1× / 2× (world²) | ROI 끝점 | 벌크 100만 world²당 끝점 (1×) |
|---|---:|---:|---:|
| 1장 | 4,735,702 / 4,730,119 | 5,263 | 1,111.3 |
| 2장 | 2,242,093 / 2,232,966 | 2,876 | 1,282.7 |

동일 blob 확인만 이번에 다시 했다. 개정 P10의 레이어·벡터는 미구현이므로 노드 예산의 적합 판정 및 신규 벌크 합성은 후속이다. 53·54 유효 경로 길이 1.8배는 실제 접지/점프 경로 길이로 판정한다. 53의 현행 양단 진목과 54의 차트 좌표 전환을 물리 도보 길이에 더하지 않는다. 현행 보행 기준 길이 및 제안 네 방·두 분기·합류의 양쪽 동선 플레이 검증은 미측정이다.

## P10 정측면 후보 검토

후보 이미지는 ImageGen으로 생성하고 직접 열어 확인했다. [생성 입력](concepts/prompts.md) · [공유 문/영웅 실측 h/r 스케일](concepts/threshold-scale.svg). 정측면에 맞춘 구조 비교용이며 최종 실루엣·깊이 마스크·동선과 플레이 collision은 별도 통과 기준이다.

| 후보 | 구조와 선택 근거 | 다음 단계에 넘기는 문제 |
|---|---|---|
| 53-A · 비교판 위 | 낮은 석단 마당, 길게 올라가는 우측 갈지자 계단과 상부 회랑. A를 도입하고 높은 B로 수렴하는 단면이 읽힌다. | 우측 B 지붕·기둥 가장자리가 화면 끝에 걸린다. 회랑 하부의 위/아래 실제 분기와 진목 앞 착지 면을 분명히 그린다. |
| 53-B · 비교판 아래 | 기둥이 층을 만드는 높은 서고, 파손된 동쪽 큰 방, 목교와 하부 우회 마루. A보다 상하 교전 시야와 재합류 공간을 확보하기 쉽다. 구조 검토 우선안. | B의 우측을 패널 밖에서 끝맺고 대향 문틀 폭을 복구한다. 아래 빈 공간의 가림과 실제 접지선을 독립 마스크에서 드러낸다. |
| 54-A · 비교판 위 | 긴 우측 세로벽과 높은 빈 회랑. 벽에 발이 붙는 첫 교전과 위쪽으로 바뀌는 부근을 떨어뜨려 보여줄 수 있다. 첫 축 교전 구조 검토 우선안. | 수직벽의 짧은 돌출받침을 보행면으로 오인할 수 있다. 벽 연속 면과 C 처마 밑면을 명확히 구분하고 B 입구 온전한 수신 면과 함께 프레임을 확장한다. |
| 54-B · 비교판 아래 | 엇맞춘 두 층이 커다란 내부 빈 공간을 둘러싼다. 바닥으로 보이는 우회처와 천장 재합류를 배치할 여지가 있다. | 구조가 거의 정상 층계로 보인다. 실제 역방향 받침과 환승 위치를 더 명확하게 해야 한다. 두 54 패널은 패킷 3200×3000보다 가로로 넓게 생성되어 정량 도면에서 원래 축척으로 확정한다. |
| 58-A | 거대한 단일 법당과 중앙 기단을 아래에서 받치는 돌기둥. 높이를 명확히 보여 주며 중앙 기단 양측에 대피 응답을 붙일 수 있다. | 넓은 하단 회복로가 출구 기단과 연결되는 모습이 약하다. 좌 입구 수신 단면과 우 산문까지 복귀 길을 선명하게 잡는다. |
| 58-B | 어긋난 법당, 돌벽 이음, 길게 매달린 상부 방과 하부 우회 마루. 중앙 교전과 우회·귀환을 한 단면에서 읽기 쉬워 구조 검토 우선안. | 매달린 동쪽 방의 밧줄은 접지·충돌과 분리한다. 실제 천장 접촉 면의 실루엣을 명시하고, 좌측 D 석교 끝을 양쪽 일치 단면과 함께 완결한다. |

[53 A/B](concepts/53-A-B.png) · [54 A/B](concepts/54-A-B.png) · [58 A](concepts/58-A.png) · [58 B](concepts/58-B.png)

58 최초 비교판은 각 패널이 지나치게 납작하고 지붕 상단이 절단되어 반려했다. 두 독립 1774×887 후보로 다시 생성했다. B·C·D·R의 실제 일치 단면은 [경계 선언](continuity.md)의 공용 기하를 사용한다. 시안의 풀 사이즈 외곽, 암체/원경/전경 분리 마스크와 여섯 후보 모두의 실제 경로·월드 축척은 후속 검수 대상이다.

## 게이트 상태

| 상태 | 근거 |
|---|---|
| PASS | 고정 빌드의 정식 사용자 진입점 부팅, 독립 연습 경로로 10장 로드, 모든 시작 영웅 접지 및 대표 이동·점프·착지, 10개 임시 컨텍스트의 보통 저장 바이트 동일. 54 N→L, 58 보스 등장·첫 교전, 59의 첫 서측 분대. |
| FAIL | 54 초회 x522.32 진입 시도의 타임아웃을 x550.76 재현으로 회복. 첫 58 이미지 비교판의 화면비와 지붕 크롭은 개별 재생성으로 수정. 53·54 원본 크롭 및 54 시안 비율, 58 A/B의 연결면 가독성은 위 후보 판정에 남아 있다. |
| NOT RUN | 정상 성장 캠페인 51→60 완주, live/저장 다시 열기 및 엔딩·타이틀 복귀, lane 전체/상하좌우·모서리 충돌-그래픽 대조, 외부 장 가시 발판 최대 편차, 수평/천장 접지 교전 및 60/120 Hz, 모바일 화면·터치·성능, 56/57 조건 증원·58/59 이후 적 누적·최고 상한. 신규 아트 벡터·더미·원경/전경 마스크·경계 구현과 5회 미술 검수는 설계 게이트 이후 범위. |

이 표는 합계 0%였던 1차 기준선과 설계 시점의 기록이다. 감독자는 후속 `aa40fb1`에서 P00를 통과로 판정했고 당시 전체 검증을 10%로 기록했다. 아래는 이후에 실시한 하위 검수다.

### 재현 명령

저장소 루트에서 Python Playwright와 Chromium이 설치된 상태로 실행한다. `browser.py`는 허용 origin을 현재 체크아웃에 연결한다. 별도의 브라우저 컨텍스트마다 앱이 제공한 고정 연습 프로필을 쓰며 앱 내 일반 저장 바이트가 같은지 비교한다.

```sh
evidence=game/docs/act6/mumyeongsa-p00-p10/baseline
python "$evidence/browser.py" --out /tmp/act6-entry --defense-rounds 3
python "$evidence/browser.py" --out /tmp/act6-focus --stage 54 58 59 --defense-rounds 5 --chart-start --fight-start
node "$evidence/packets.mjs" > /tmp/act6-packets.json
python "$evidence/summarize.py" /tmp/act6-entry /tmp/act6-focus > /tmp/act6-observations.csv
git ls-tree HEAD web/data/chapter-01-assets.088719e10e63d482.json web/data/chapter-02-assets.ddddf53df4d749c6.json
```

방어·이동 관찰 길이와 타이밍 때문에 프레임별 위치·시각은 조금 달라질 수 있다. 패킷의 authored 레코드는 JSON 순서와 signed owner에 고정되고, 실행 roster와의 차이는 출현 시점 및 역할을 기준으로 해석한다.

## 경과 기록

| 시각 | 단계 | 상태 | 검증 배점 | 증거 커밋 | 후속 |
|---|---|---|---:|---|---|
| 2026-11-25 13:44 UTC / 22:44 KST | P00 / P10 1차 | 기준선 표본·시안·경계 설계 기록, 전체 게이트 대기 | 0% | [`ba543671d11013ac5f3ed790c23b673d41f17fbd`](https://github.com/sys8994/honro/commit/ba543671d11013ac5f3ed790c23b673d41f17fbd) | 위 FAIL·NOT RUN 및 [경계 검수표](continuity.md#연속성과-입력-증거-요구) |
| 2026-11-25 13:55 UTC / 22:55 KST | P00 보강 | 모바일 10장·외부 국소 표본, 기존 54 전환 거부·검수 재로드, 선택안 보정 | 게이트 대기 | [e58e1c6c](https://github.com/sys8994/honro/commit/e58e1c6cd2d9ce8429abf57f956a9656d0974530) | [보강 기록](second-pass.md) |
| 2026-11-25 14:15 UTC / 23:15 KST | 첫 B 수직 슬라이스 | 로컬 60/120 Hz 접지·이동·점프·실제 사격 PASS, 54~56 캡처 기록 재로드 PASS | 전체 게이트 대기 | [934b1a04](https://github.com/sys8994/honro/commit/934b1a048ef64ad5c56ccb3f82acb32c65f49be6) | [검수 실행·화면·누락](proof-slice/README.md) |
| 2026-11-25 14:35 UTC / 23:35 KST | M09와 종터 저장 이음 | 54→55→56 live, 55·56 새 기록 재로드, 잘못된 면과 기예 거부 PASS | 하위 검수 | [b018546d](https://github.com/sys8994/honro/commit/b018546dcd34b847583e819705dcfbdd3c2e21b2) | [실제 입력·새/기존 저장](relay-fix/README.md) |
| 2026-11-25 15:03 UTC / 26일 00:03 KST | 53→54 본편과 관측 회랑 | 60/120 Hz 실제 B 통과·벽 교전·기존 차트와 M09, 53·54 터치, 새 54·55 및 기존 54~56 기록 PASS | 하위 검수 | [b2d73cd7](https://github.com/sys8994/honro/commit/b2d73cd70e4f495b7d2c0401a73596766de7154e) | [본편 B 실측·남은 검수](native-b/README.md) |
| 2026-11-25 15:12 UTC / 26일 00:12 KST | B 네 방향 연장과 상태 HUD | 양편 그래픽·콜라이더·월드 마스크 일치, 잘못된 접지 경고 해소, 최종 60/120 Hz와 모바일·저장 재검수 PASS | 하위 검수 | [af21bcb5](https://github.com/sys8994/honro/commit/af21bcb5e8ac38ebd404bb03755c33196ade74d7) | [실측](native-b/observed.json) |
| 2026-11-25 15:35 UTC / 26일 00:35 KST | C 천장과 정상 방향 복귀 | 실제 위쪽 접지의 54→55→56 라이브와 새 저장, 56 원본 마루 정상 착지·첫 가름진 역류 | 하위 검수 | [7b661db7](https://github.com/sys8994/honro/commit/7b661db743c23af162fb107cc9ba9f584f8a9f6b) | [C 화면과 측정](torn-eave/README.md) |
| 2026-11-25 15:52 UTC / 26일 00:52 KST | D 법당 수신과 상층 | 기존 저장 열기, 60/120 Hz 실제 벽·천장 접지와 마루 복귀, 두 의식 후 대도사 등장 | 하위 검수 | [d5346a2d](https://github.com/sys8994/honro/commit/d5346a2df0873052952deb05b679a1cd0d6d4b06) | [D 증거](hall-d/README.md) |
| 2026-11-25 16:13 UTC / 26일 01:13 KST | D 직접 통과와 R 귀환 | 네 원본 57→58 라이브·새 저장, 58에서 실제 제기혼 타격, 대도사·유지점과 R 승리, 59 수신 계약 | 하위 검수 | [6bdf6718](https://github.com/sys8994/honro/commit/6bdf671823eb3d89932ea30c180aeaea3f9e83d6) | [D 실전](hall-d/README.md) · [R 검수](return-r/README.md) |

54→55의 원본 저장 차단을 고쳤고 53·54 본편의 분기·재합류, 공용 B 문턱·벽 교전과 실제 터치를 검수했다. C는 승인된 56 본체의 수신 보호 범위만 사용한다. 다음 항목은 57→58 원본 네 몸 수신, 58-B 법당·대도사·실제 지지면, 58→59 수동 문턱과 외부·소단 동선, 58·59의 출현·활성·실제 공격 로스터다. [실제 54→55→56·새/기존 저장·거부 검수](relay-fix/README.md) · [본편 B](native-b/README.md)

## D 법당 중간 검수

57→58 네 원본 배우의 직접 통과, 같은 객체의 라이브 수신과 새 저장을 검수했다. 58은 벽·천장 실제 접지와 정상 마루 착지, 두 의식의 대도사 등장, 마루 틈을 통한 기존 제기혼의 실제 타격을 검수했다. [D 증거와 실행 명령](hall-d/README.md)

통합 빌드에서도 54→55→56 라이브·새 저장, 잘못된 표면·기예·C 접지 거부와 첫 가름진 역류를 다시 확인했다. [C 검수 명령](torn-eave/README.md)

## R 귀환 중간 검수

58 실전에서 두 목표를 쓰러뜨리고 네 명이 R을 걸어 승리했다. 59는 같은 객체·산문·발점과 아래 방향 중력을 받았다. 새 저장을 일반 쉼터에서 다시 열고 네 명이 실제로 석단을 걸어 마당으로 나온 것을 확인했다. 기존 59 저장과 잘못된 발점의 거부도 확인했다. [R 증거와 실행 명령](return-r/README.md)

## P60 체크리스트

- 이전 55 정상 기록을 일반 여정첩에서 열어 쉼터와의 불일치를 재현했다. 같은 읽기 전용 검사를 적용해 여정첩에서 55를 확인하고 쉼터를 거쳐 실제로 이어갔다. 출발본이 다른 시험 기록은 51만, 훼손 판은 시작 지점과 일반 안내만 표시했다. 세 판 모두 기존 바이트를 유지했고 60 완료 영수증을 PC·모바일에서 다시 검수했다. [실측과 명령](journey-boundary/README.md)

## 외부·소단·편성 후속 검수

- P30은 외부 6개 장의 PC·터치 시작 이동과 대표 오버레이를 남겼다. 55 중앙 비접촉 암면은 거리감이 읽히도록 명도를 조정했고, 59 서쪽 높은 단과 57 접힌 석교는 원본 윗변·꼭짓점이 물리 면과 일치했다. 60의 두 혼 인도와 엔딩을 PC·모바일에서 확인했다. 개별 외곽 착지 전수 플레이는 미검수다. [외부 실측과 명령](exterior/README.md)
- P40은 53·54 실제 혼 O06과 차트·M09·C, 55 온전한 정렬과 실제 복구 뒤 각각 56 라이브/새 저장, 방치했을 때 패배, 모바일 터치 좌정·복구를 확인했다. 장착 시험 기록에서 실제 O13 호혼령도 소환했다. 56 실제 O06의 57 인계·단일 차감, 57 합체 뒤 소단의 일반 O06과 네 원본 D 통과를 확인했다. [소단 검수표와 명령](sodan-thread/README.md)
- P50은 51–59에 편성을 추가했다. 51 전망대와 57→58의 새 저장, 54 B와 55 두 결속 결과, 56 역류 회피, 58 두 의식·천장 명중, 59 실제 터치 양쪽 출현을 검수했다. 장별 누적·공격·정량 목표는 미달 또는 미검수 항목과 함께 기록했다. [편성 로그와 명령](encounters/README.md) · [첫 가름진 역류](torn-eave/README.md)

[P10·P20·P30·P40·P50/P60 검수표](gate-checklist.md) · [56 실내 D와 외부 57→58](d-interior/README.md)

### 현재 검수 기준

- 감독이 P00과 P40을 통과로 판정했다. 두 게이트의 승인 배점은 25%다. P40의 장착·기력 격리 표본은 검수표에 남겼다. [게이트 검수표](gate-checklist.md)
- 공용 B·C·D·R의 수신 기록을 360×800과 430×932의 실제 터치에 다시 사용했다. 54의 C, 56의 실내 D, 57의 외부 D와 58의 R 라이브 송신을 각각 확인했다. 57의 D와 58의 R은 네 원본과 저장 바이트를 대조했다. [모바일 입력·발점·재로드](mobile-seams/README.md)
- 외부 6장의 대응 미술 표본 860점을 확인했다. 최대 위치 편차는 51의 0.006006 world px다. 57 특수 받침의 렌더러 직결 15점은 별도다. 53·54·58의 독립 미술 수정·화면 대조와 54 본편의 L→C→L 전체·모서리도 기록했다. [외부 접촉 실측](exterior/README.md) · [본편 외곽과 명암](visual-atlas/README.md)
- 일반 입력의 단일 시드 검수에서 51은 17명·12라운드, 54는 회복기 시전 없이 14명·11라운드, 55의 복구는 26명·12라운드, 58 상층은 19명·13라운드, 59의 두 전술은 각각 34명·11라운드를 기록했다. 58 지상과 57, 다른 시드, 저사양 실기기의 남은 결과를 구분하고 있다. 실제 59 승리에서 60 엔딩과 타이틀은 별도 연속 판으로 확인했다. [편성 수치와 상태](encounters/observed.csv) · [한 탭 검수와 첫 중단](continuous/README.md)

## 추가 구현과 검수 커밋

| 단위 | 원격 커밋과 증거 |
|---|---|
| 소단 육신, 결속·붕괴, 안쪽 혼줄, 실제 터치 | [850208d6](https://github.com/sys8994/honro/commit/850208d69ce632998ea0e0007a6021ee80cc5a32) · [18ae93e8](https://github.com/sys8994/honro/commit/18ae93e83ea2f5a153f3d59456c2cafc14f64011) · [bce43de8](https://github.com/sys8994/honro/commit/bce43de8) · [a743f4de](https://github.com/sys8994/honro/commit/a743f4de574234bcfc0b69fbb1772068cca7d26e) · [소단 증거](sodan-thread/README.md) |
| 외부 접촉선과 55 암면 명도 | [d42f27c9](https://github.com/sys8994/honro/commit/d42f27c9ff0b42d0cdaac4568ca4b12f3cf9c22c) · [외부 표본](exterior/README.md) |
| 51 전망대와 52 하강·종터 | [761d60f6](https://github.com/sys8994/honro/commit/761d60f67ff49ac835542477a1046dd7c2766c03) · [c7859779](https://github.com/sys8994/honro/commit/c7859779) · [51 완주](encounters/overlook-live-51.json) · [52 완주](encounters/cliff-bell-52.json) · [481aab2c, 52 하단 예비 실전](https://github.com/sys8994/honro/commit/481aab2c) |
| 53·54 실전 B, 55 수비, 56 역류, 57 합체, 58 대도사·R | [531273be](https://github.com/sys8994/honro/commit/531273be61bf3b583fe08c39d6f21db4acc52eb3) · [cb8dc54d](https://github.com/sys8994/honro/commit/cb8dc54d82960c1de96f5ea8754a40b1ff01d5ba) · [59cf4d34](https://github.com/sys8994/honro/commit/59cf4d3492d102fc4274878eff12ad6323f7d333) · [4ff52e82](https://github.com/sys8994/honro/commit/4ff52e82) · [3075c4bc](https://github.com/sys8994/honro/commit/3075c4bc4c859272732a5ecffd421124eec5326e) · [d82d7258](https://github.com/sys8994/honro/commit/d82d725883f449baad8712a0adbcca354e2f0780) · [출현·교전표](encounters/README.md) |
| 59 두 전선과 실제 방어·전진 | [e7668b6a](https://github.com/sys8994/honro/commit/e7668b6a) · [d729d739](https://github.com/sys8994/honro/commit/d729d739) · [bd5a48dc](https://github.com/sys8994/honro/commit/bd5a48dce461fbdec791692b96163e1af3d02175) · [da7946af, 동일 시드와 단독 프레임](https://github.com/sys8994/honro/commit/da7946af) · [147f3bf8, 실제 승리에서 엔딩](https://github.com/sys8994/honro/commit/147f3bf8) · [전진 로그](encounters/courtyard-advance-59.json) |
| 이전 정상 기록과 여정첩 | [1899cfd3](https://github.com/sys8994/honro/commit/1899cfd3) · [변경 전후](journey-boundary/README.md) |

`npm run test:release-guard`는 19개 통과했다. `test:runtime-contracts`와 `test:campaign-contracts`는 각각 `shared/build.mjs`와 `tools/environment/stage22-vertical-art.mjs`의 승인 SHA 검사에서 멈췄다. 두 파일의 실측 SHA가 기존 `master dd409de2`의 실제 바이트와 같은 것을 확인했다. 기존 승인 SHA를 직접 바꾸지 않았다.

[53·54·58 본체와 외곽 실측, B·58 천장·R의 같은 카메라 전후](visual-atlas/README.md)

- 감독이 P20까지 통과로 판정해 P00·P20·P40의 합계는 40%다. P20의 대표 실측 범위와 별도 미검수 조합은 게이트 표에 있다. [감독 판정과 검수표](gate-checklist.md)
