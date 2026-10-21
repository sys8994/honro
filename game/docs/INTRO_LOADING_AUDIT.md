# 인트로 Workshop Map·로딩 감사 — 2026-10-21

기준 master: `544825ee77930756dd28ce056ab15e12bb885278`. 실행 수정 SHA: `a1061dc4ae71803dfa37718f554f1f3511f8fbad`. 작업 브랜치: `codex/intro-loading-audit`. master 병합·Pages 발행은 통합 순서 조정을 위해 대기 중이다.

## 후속 최종 결과 — 임계 경로와 압축 검증

실행 수정 최종 SHA: `15e8373df54285d3883b29b45ca7f2d3b0ba04fa`. 앞의 표는 첫 번째 요청 정리 단계의 기록이며, 아래 결과가 후속 코드 축소까지 포함한 최종 비교다. 원본 master는 동일하다. 지형/스테이지/그림 데이터 189개는 그대로다.

Terser 5.51.2를 고정하고 compress:false/mangle:false로 JS 주석·공백만 줄였다. 코드 이름·순서·전역 등록·비동기 완료 경계를 보존한다. 37개 모듈 합계 raw 2,789,636→2,337,992B(-16.2%), gzip6 880,435→768,790B(-12.7%), Brotli11 713,023→632,629B(-11.3%)다. Brotli는 파일 크기 계산만 했고 실제 네트워크 반복 검사는 gzip으로 수행했다. 읽을 수 있는 원본 JS는 저장소에 그대로 있으며 배포본은 한 줄로 축소된다.

동일 CPU4배/40ms/2MiB/s,390×844모바일 모사, 조건별3회 중앙값. 무압축은 앞의 원기준과 비교했으며 gzip은 원기준 별도 checkout과 수정본을 같은 gzip6 HTTP서버에서 새로 각각3회 측정했다. 실제 Pages의 Content-Encoding 확인 요청은 CONNECT tunnel403으로 거부돼 중단했다. gzip 수치는 배포 검증이 아니다.

| 조건 | 준비 ms 이전→최종 | 클릭 후 ms 이전→최종 | 준비까지 관측 전송B 이전→최종 |
|---|---:|---:|---:|
| 무압축 새 방문/새 시작 | 2977→2636 | 396→453 | 5,160,049→4,677,816 |
| 무압축 재방문/새 시작 | 848→660 | 312→276 | 0→0 |
| 무압축 새 방문/21장 | 3552→3349 | 1715→1774 | 6,506,415→6,024,182 |
| 무압축 재방문/21장 | 995→887 | 1196→1175 | 0→0 |
| gzip 새 방문/새 시작 | 1652→1401 | 411→435 | 1,783,799→1,641,907 |
| gzip 재방문/새 시작 | 768→657 | 323→291 | 0→0 |
| gzip 새 방문/21장 | 1737→1525 | 1692→1734 | 1,968,367→1,826,475 |
| gzip 재방문/21장 | 969→972 | 1200→1149 | 0→0 |

새 방문 준비는 무압축 약11.5%/5.7%, gzip 약15.2%/12.2% 줄었다. 클릭 후 cold 진입은 개선되지 않았다. 첫 그림은 gzip 새 시작289→325ms,21장335→333ms이므로 첫 그림 표시가 빨라졌다고 주장하지 않는다. 자료를 클릭 뒤나 새 대기화면으로 넘겨 준비시간을 줄인 것이 아니다.

### 병목 근거와 남은 위험

다운로드 resource 시간창은 최대36개가 겹쳤다. 즉37모듈을 전부 순서대로 다운로드하는 구조는 아니다. 제한된12모듈 preload와 필수 JSON fetch는 병렬이고, 전역patch가 앞 정의를 캡처하므로 평가만 순차다. 21장 cold 한 표본에서 엔진967,465B는384→2544ms, 현재장 asset JSON1,328,987B는589→2684ms, 구분할 JSON653,520B는387→2107ms를 차지했다. 준비 프로파일의 많은 idle/프로그램 구간 및 gzip 시 약2초→1초대 축소가 전송·요청 임계 경로를 뒷받침한다. 앞 trace의 compileModule 합6.43ms와 module evaluation87.52ms는 전송 대기보다 작았다. worker JSON parse는 메인 스레드 sample에 포함되지 않으므로 이를0ms로 해석하지 않는다. 4배 CPU throttle은 실제 저가 Android CPU/메모리/decoder의 등가 모델이 아니다.

클릭 뒤 별도 프로파일에서21장 continue462ms, 그 안에 mount416ms/HUD294ms/초상화203ms가 포함됐고 첫 render는541ms였다. 프로파일러 없는 추가 첫프레임 계측에서는 render378ms, 그 안에 배경60ms/지형tile97ms/가림실루엣46ms가 포함됐다. 다른 run과 중첩 구간이라 합산/직접 전후 비교하지 않는다. 프로파일 전체의 silhouette self232ms는 여러 frame 합이며 첫 frame 수치가 아니다. 초기 이미지 decode는 trace상7회/35ms 규모로, 관측된 전체 진입 비용을 설명하지 못했다.

이제 클릭 뒤 지배적인 일은 현재 화면의 실제 벡터그림/타일캐시/가림합성/초상화 생성이다. 이를 idle 사전작업이나 다른 대기화면으로 옮겨 속도가 개선됐다고 계산하지 않았다. raster/pose cache, 해상도 또는 가림 정책을 더 바꾸면 캐릭터 애니메이션·화면 미술·병행8장 검수에 영향을 줄 수 있다. 이번 인트로·로딩 범위를 넘어 공용 renderer를 변경하지 않고, 이 병목을 다음 작업의 구체적 근거로 남긴다. 구분할/서사 JSON의 무조건 삭제·지연도 legacy scene 등록과 진행 중 저장을 바꾸므로 적용하지 않았다.

Game 초기 import 그래프에 workshop/src/app.js·테스트 파일은 없다. Workshop 앱은 별도 entry이며 Playtest의 공통 런타임만 재사용한다. training/skill-preview도 Game 초기 목록에서 제외된다. HONRO_TOOLS는 실제 개발/검수 API이며 데이터 중복 복사 없이 기존 함수·core·content 참조를 내보낸다. 후반장 patch와 호환자료는 현재 초기 등록에 포함되지만 테스트/편집기 찌꺼기로 오인해 제거하지 않았다.

### 갱신된 검증

원기준544825ee 별도 worktree에서 두 타이틀 검사 실패를 실제 재현했다. title-redesign은 옛 game/build.mjs 문자열 계약, title-letter-rendering은 main.js에서 이미 분리된 filter 추출이 원인이었다. 두 검사를 현재 web-build/title-markup으로 갱신했고 PNG identity·alpha/ink·6화면비·5저장분기·반복진입·접근성을 유지했다. DOM double의 가짜 startup marker도 바로잡았다. 최종 npm run test:title은 둘 다 통과한다. 앞 절의 미해결 정적 테스트 한계는 이 후속 수정으로 해소됐다.

최종 minified build에서 web-split, ordered-runtime, retention, intro-loading-browser, startup stage-checks를 통과했다. 타이틀·새 시작·오디오·11/20장 원경·12장 실패/재시도·21장 취소/저장·이전 HTML cache를 확인했다. 전체verify/전장미술 전수검사는 하지 않았다. 원시파일은 compression.json, minified.json, gzip-before.json, gzip-after.json, cpu-summary.json, first-frame.json이다.

## 첫 번째 단계 기록: 결론과 수정 범위

Workshop Map은 `title-markup.js` → `main.js`의 `import-map` → hidden `map-import` 파일 입력 → `launchMap(project, activeStageId)` 경로다. 편집 JSON 검수용이며 일반 여정에 필요하지 않다. 타이틀 버튼만 제거했다. 개발 API·파일 입력/handler·HONRO_WORKSHOP.html·Playtest는 보존했다.

37은 데이터/이미지 개수가 아니라 순서대로 실행하는 bootstrap 모듈 수다. 37개 합계는 기준 JS 2,789,636B이며 그 안에서 추가 JSON·그림·CSS를 요청한다. 실제 새 cold 준비 완료까지 CDP 완료 이벤트는97개였다. 첫 화면은 HTML의 타이틀과 그림3종으로 먼저 표시되고, App 사용 준비까지 공통 엔진/patch/저장 호환 등록을 기다린다. 현재 구현에서 초기화하는 코드 모두가 첫 그림에 필수라는 뜻은 아니다. 사용처가 확인되므로 데이터 삭제로 해결하지 않았다.

실제 현재 장만 준비한다. 새 방문 1장, 저장21장 이어하기21장만 로드하며 전체 campaign-library나 다른29장 초기 요청은 없다. 다른 장은 `ensureStage`와 기존 취소/재시도 guard로 준비한다. 선택 기예 미리보기/훈련은 기존 lazy import를 유지한다.

수정은 (1) 원문이 필요 없는 SVG data module의 eager fetch를 제거하고 ACT1 쉼터의 inline 원문4개는 보존, (2) fallback Image를 소비 시 생성하고2막 readiness를 현재 전투의 그림으로 한정, (3) 첫 그림 표시를 기다리는 동안 제한된12모듈 prefetch/현재장 JSON/CSS 요청을 시작하는 것이다. 첫 paint 뒤에만 순차 코드를 실행한다. 진행률37표시 자체는 숨기거나 줄이지 않았다. 지형·스테이지·그림 원본은 미수정이며 현행 data/graphics189개 해시는 모두 같다.

## 측정 조건과 결과

로컬 Chromium headless, Linux,390×844 touch/mobile viewport·DPR1, CPU slowdown4, latency40ms, download2MiB/s. 공개Pages 또는 Android 실기 측정이 아니다. 조건별3회, 전후 순차 수행, 아래 값은 중앙값이다. cold는 새 isolated context, warm은 같은 context 재방문으로 정적 web 자산에 max-age600초를 부여한 모델이다. 실제Pages 캐시 헤더를 측정한 결과가 아니다. warm HTTP resource transfer는0B였다. 프로필은 매번 같은 synthetic21장 저장으로 다시 주입했다.

ready는 document data-honro-ready 관측, 첫 그림은 표시 가능한 title image3개 관측, entry는 trusted click에서 화면 전환/audio running 확인 및 두rAF까지다. CDP 완료 이벤트/전송량은 ready 관측 시점까지만 집계하며 미완료 음악 stream과 클릭 뒤 장면 그림은 제외한다. 완료 이벤트는 memory cache/worker도 포함하므로 HTTP 요청 수와 동일하지 않다. 관측 시간과 rAF/Playwright scheduling 오차가 있다.

| 조건 | 첫 그림 ms 전→후 | ready ms 전→후 | 클릭 후 ms 전→후 | CDP bytes 전→후 | 완료 이벤트 전→후 |
|---|---:|---:|---:|---:|---:|
| new cold | 290→324 | 2977→2840 | 396→400 | 5,160,049→5,131,802 | 97→85 |
| new warm | 121→119 | 848→712 | 312→273 | 0→0 | 97→85 |
| continue21 cold | 332→336 | 3552→3517 | 1715→1834 | 6,506,415→6,478,168 | 97→85 |
| continue21 warm | 199→257 | 995→1015 | 1196→1170 | 0→0 | 97→85 |

새 cold ready는 약4.6%, warm은16.0% 감소했지만21장 cold는 약1.0%이고 warm은 약2.0% 늘었다. cold 클릭 후 진입도 개선되지 않았다. 장기기·통계적 성능 개선이나 “로딩 문제 전체 해결”을 주장하지 않는다. 확인된 절감은 불필요한 초기 원경 요청과 약28KB의 cold 전송이다.

캐시가 켜진 baseline에서는 SVG8개가 fetch와Image로 각각 요청됐지만 두 번째8개는 transfer0의 memory cache였다. 이를16회 전체 다운로드라고 해석하면 안 된다. 캐시 비활성 별도 probe에서는 동일URL 본문이 다시 전송됐다. 요청 Map은 동일 URL/응답종류 요청을 합치며 실패를 제거한다. 콘텐츠 해시 URL과 직전2개 배포 세대 보존은 유지한다. 그림 dawn은 ACT1/ACT2의 서로 다른 경로로 동일19,540B가 중복돼 baseline에서 각각 요청됐으며, 이번에는 ACT2 초기 요청을 없앴다. 빌드 전역 콘텐츠 dedup은 하지 않았다.

초기 main-thread longtask(50ms이상) 총합 중앙값은 new cold0→0ms, warm64→67ms,21cold59→68ms, warm82→78ms다. 관측 최대는 각각51→58,74→72,59→86,82→97ms였다. 작은 샘플이므로 CPU개선 근거가 아니다. 별도 trace1쌍의 Decode Image는7건/35.03→7건/30.82ms, ImageDecodeTask46건/42.88→44건/39.29ms였다. 중첩/다중 thread event를 합산해 실제 wall time으로 해석하면 안 된다. 타이틀 decode는 여전히 필요하고 초기 Image 생성 제거가 같은 크기의 decoder CPU절감을 보장하지 않는다. JS module evaluation은87.52→118.84ms여서 CPU개선을 주장하지 않는다. 큰JSON은 기존 worker parse/분할 전송/yield를 유지한다. 네트워크 fetch는 겹치지만 전역patch실행은 의존 순서 때문에 직렬이다.

## 37개 목록: 기준 파일명·용량·사용 이유

표의 bytes는 압축 전 디스크 JS 크기다. JSON/이미지는 추가 요청이며 아래 별도 목록을 참고한다. 1/2/4는 타이틀 구성, 나머지는 첫 그림 자체에는 불필요하지만 현행 App생성/저장·patch 순서에서 초기화한다. 사용하지 않는 코드로 판정한 항목은 없다. 전체엔진/후반장patch/과거저장메타를 완전히 stage별로 분할하지 못한 점은 남은 제한이다. 22–27은 주로 작은URL/레이어메타이며 모든 그림 다운로드를 뜻하지 않는다.

| 번호 | 기준 JS 파일 | bytes | 실제 용도/소비 |
|---:|---|---:|---|
| 1 | `game-art.0884251f5e4a011a.js` | 530 | 타이틀·장 도입·대사 초상화 URL 메타 (이미지 자체 제외) |
| 2 | `title-scene.61979ebdf786fbaa.js` | 244 | 타이틀 이미지 URL을 공통 마크업에 연결 |
| 3 | `ordered-common-1.b90980f983e0304d.js` | 2,866 | 전체화면/모바일 입력 공통 등록 |
| 4 | `shared-runtime-title-markup.3976b37b0afc8917.js` | 4,311 | 첫 화면 및 profile 반영 타이틀 템플릿 |
| 5 | `HONRO_BGM_TRACKS.8183477a4872f6a6.js` | 168 | 음악 5곡 URL 목록 (MP3 본문 아님) |
| 6 | `ordered-common-2.097b2927c3c38c0b.js` | 967,465 | 엔진/저장/기예/물리/오디오·UI 공통 코드 |
| 7 | `ordered-common-3.e1856ec64c787e65.js` | 119,327 | 공통 환경 벡터 키트 등록 |
| 8 | `HONRO_BALANCE.ead88f3d9b670254.js` | 162 | 전투 수치/밸런스 |
| 9 | `HONRO_NARRATIVE_V0.c81f5e9266d6d06a.js` | 172 | 구 서사 저장·진행 중 장면 호환 |
| 10 | `HONRO_SPLIT_V1.fe1bd10ce56181e2.js` | 164 | 구 분할 원정의 맵·asset·대사 호환 |
| 11 | `HONRO_OPEN_STRUCTURES.10ceeb69a6df342c.js` | 178 | 기존 개방형 건축물 저장/맵 보정 |
| 12 | `HONRO_WATERWORKS_V2.9735a0c493b64ee7.js` | 174 | 구 수로 진행 저장의 목표·대사 호환 |
| 13 | `ordered-common-4.a145bf1136fe3cec.js` | 193,423 | 스토리/맵 연결·분할 원정·진행/목표 등록 |
| 14 | `ordered-common-5.33efaaf98b2f6071.js` | 189,258 | 장/스토리/진행 규칙의 순서 의존 패치 |
| 15 | `ordered-common-6.acf03aa763ca027f.js` | 193,502 | 장별 목표/이벤트/전투 규칙 패치 |
| 16 | `ordered-common-7.41ebd8c9ffc412fd.js` | 176,053 | 공통 맵·환경·공간/기하 계약 |
| 17 | `ordered-common-8.be150d154838fc77.js` | 158,849 | 맵 schema·unit/compiler·command 계약 |
| 18 | `campaign.d6fe1747147ede84.js` | 342 | 캠페인 manifest와 현재 장 의존성 로딩/저작 |
| 19 | `ordered-common-9.9864947017dc6137.js` | 21,715 | 동행 rig 등록 |
| 20 | `party-alias.b19b3e88a3b965c3.js` | 121 | 동행 JSON 로더/설오 별칭 (추가177,664B JSON) |
| 21 | `ordered-common-10.4546edfd464ff837.js` | 25,736 | 동행 vector adapter |
| 22 | `HONRO_ACT1_FAR_DATA.c067a494dcc5f919.js` | 215 | 1·3막 원경 URL (쉼터 inline SVG 원문 필요) |
| 23 | `HONRO_ACT2_FAR_DATA.852b2a988d0764bf.js` | 241 | 2막 fallback 원경 URL (실제 화면 전까지 지연) |
| 24 | `HONRO_REST_BACKDROPS.a6937a62382f4091.js` | 464 | 장별 쉼터 원경 URL (실제 화면 전까지 이미지 지연) |
| 25 | `HONRO_STAGE21_PAINTED.f43a09de9ac8b0ed.js` | 261 | 21장 그림/레이어 메타 (그림은 장 진입 후) |
| 26 | `HONRO_PAINTED_PILOTS.92a7a1bab144051e.js` | 1,479 | 일부 장·쉼터 이미지 메타 (실제 화면에서 로드) |
| 27 | `HONRO_AUTHORED_FAR.c9728fddbd7f2de9.js` | 540 | 전 장 이미지 원경 URL (현재 장에서 로드) |
| 28 | `shared-assets-monsters-monsters-runtime.63ca9e9192ae871d.js` | 164 | 악귀 공통 벡터 JSON (Scene 소비) |
| 29 | `shared-assets-actors-actors-runtime.c11822d74d18722f.js` | 160 | 동맹/NPC 공통 벡터 JSON (Scene/대사 소비) |
| 30 | `ordered-common-11.42c3d3bd61f34f59.js` | 196,818 | 공통/장별 Scene renderer와 원경·환경 연결 |
| 31 | `ordered-common-12.a2006e4f71407c66.js` | 193,098 | 장별 미술/목표/피드백 renderer 패치 |
| 32 | `ordered-common-13.4b676025750f6f06.js` | 5,729 | 현재 장 이미지 원경의 demand loader/cache |
| 33 | `ordered-game-14.1f4ef1e6791e4c7a.js` | 40,191 | UI icon·장 진입 guard·초상화·bridge |
| 34 | `shared-runtime-stage-rules.425c10ceb6d4b5ec.js` | 3,492 | 장별 실행 규칙/Workshop 공통 계약 |
| 35 | `ordered-game-15.2cc2000c3beadcc4.js` | 36,030 | 오디오·스토리·상호작용·unit-info |
| 36 | `ordered-game-16.22fb47d37d0311e7.js` | 148,418 | 쉼터 미술과 여정 UI |
| 37 | `ordered-game-17.58b372ab84c0b41f.js` | 107,576 | App 생성·저장 복원·입력·타이틀 인계 |

### 초기 데이터와 이미지의 필요성

- HONRO_SPLIT_V1 653,520B: `world.js`의 legacy library/stage, `encounters.js`, `split-campaign.js`, `objective-revision.js`의 구 원정/재회 장면. 새 타이틀 그림에는 불필요하나 초기 scene등록이 읽으므로 무작정 지연하면 구 저장/대사가 달라진다.
- HONRO_NARRATIVE_V0 142,604B: `narrative-revision`, `story-staging`, `mission`, `story-direction`의 진행 중 구 서사 보존. 삭제하지 않았다.
- HONRO_OPEN_STRUCTURES 14,618B: `shared/map/open-structures.js`가 로딩 시 rows를 캡처한다. HONRO_WATERWORKS_V2 6,398B: 구 수로 목표 호환.
- 동행 JSON177,567B + ART97B, 악귀125,281B, NPC169,079B: 공통 renderer 및 초상화가 소비한다. 모든 장에서 각 인물을 즉시 그린다는 뜻은 아니다. renderer registry분할은 남은 작업이다.
- ACT1 SVG원문은 mountains19,263B/gorge22,474B/dawn19,540B/act3 3,196B. `journey-art.campaignBackdrop`의 inline markup보존 때문에 eager source4개를 유지했다. Image객체는 실제 전투 fallback 소비까지 미룬다.
- ACT2 SVG는 clouded2,501B/dawn19,540B/stage11-ravine3,333B/readable3,334B. 소비자는 `act2-spatial-art`이며 source문자열 사용처가 없어 초기 fetch제거. 현재 전투 fallback필요 시만 Image요청.
- 쉼터/장 이미지URL 메타·stage21 레이어메타는 초기 등록하되 raster는 화면에서 요구한다. authored-far의 현재장 cache, fallback→완료 image 전환을 보존한다.
- 음악URL목록259B와 오디오코드는 초기 준비한다. MP3는 메인4,741,261B, 전투3곡4,416,906/3,783,443/4,269,672B,보스3,770,116B. 5곡 전체를37모듈과 함께 받는 구조가 아니다. 메인곡은 title의 기존 preload/사용자입력 정책을 유지한다. 준비완료 뒤 stream바이트는 위 성능표에 포함되지 않으며 음원 전체시간이나 실기 청취 품질은 검증하지 않았다.

## 검증과 남은 제한

`npm run build`, `tests/web-split.mjs`, `tests/web-build-retention.mjs`, `tests/ordered-runtime-groups.mjs`, `tools/testing/intro-loading-browser.py`, `tools/testing/startup-browser.py stage-checks` 통과. actual title에 Workshop버튼0, hidden input/API존재, 초기ACT2 SVG요청0, ACT1Image 미생성 확인. 새 시작/audio context running,11장/20장 원경·단일 이미지객체 재사용, 초기SVG실패→그림/재시도→ready,12장 실패시전투/profile/save불변→재시도, 늦게온21장 요청취소,21장HP/round/성장/장착/완료/author보존,여정첩/다음장전환,기존HTML→retained assets로ready를 확인했다. native/embedded와Workshop초기화도 보존했다.

기존 `tests/title-redesign.mjs`는현재빌드가아닌 game/build.mjs의 옛portrait/landscape문자열계약에서 실패한다. 이번에 해당 검사/옛builder는수정하지않았고 실제브라우저타이틀검사로보완했다. WorkshopPlaytest전투의 기존schema문제를 수리하거나 전 장 정상완주를 검증한 것이 아니다. Android실기/느린모바일망/통계적효과/최종Pages는 미확인이다. 공개사이트 접근은 이번브랜치작업에서 시도하지 않았으며 로컬결과를배포검증으로표시하지 않는다.

사용자 원본 Library `libfile_88af52b502d08191b50787bf5ac618b4`는 ID조회성공, local materialization 다운로드실패여서 원본픽셀은 직접대조하지못했다. 제공된스크린샷설명과현재코드로용도를추적했다. 아래새스크린샷은실제수정본 로컬Chromium화면이다.

원시측정·전체리소스별 디스크/응답/전송바이트·시작/종료시각은 `_local/reports/intro-audit/{before,final,summary}.json`, `requests.csv`, `modules37.csv`, `trace-summary.json`, `regressions.json`에 있다. 같은디렉터리probe.py로재현한다. 코드수정본 SHA와문서커밋 SHA는구분한다. master/Pages에는아직반영하지않았다.

실제 타이틀·쉼터·11장 스크린샷 3장과 전체 초기 요청 부록을 포함한 [Library PDF 보고서](https://chatgpt.com/api/library/files/libfile_42196569e88081918d529be604512763/download)를 저장했다. Library ID: `libfile_42196569e88081918d529be604512763`. 로컬 보고서의 file:// 브라우저 열기는 `ERR_BLOCKED_BY_ADMINISTRATOR`로 거부되어 중단했고, 독립 PDF 작성 도구로 생성·렌더 확인했다. 이 거부는 게임 로컬 HTTP 검증이나 공개 Pages 접근 결과가 아니다.

후속 optional-checks도 통과했다: 초기 선택모듈 요청0, preview/훈련 실패 후 재시도·화면/저장 보존·복원, embedded engine 진입 확인. Library의 후속 PDF 교체와 독립 PNG 3개 저장은 prepared upload helper의 hosted apps 호출 network 오류로 실패했다. 조회상 기존 PDF의 file ID/size/modified_at은 그대로이며 새 PNG는 검색되지 않았다. 따라서 위 Library 링크는 첫 단계 PDF이고, 후속 최종 결과는 이 저장소 문서와 로컬 갱신 PDF가 최신이다. 해당 batch는 중복 제출하거나 직접 업로드로 우회하지 않았다.

2026-10-21 사용자 후속 설명에 따라 작업을 종료하지 않고, 사전 로딩 이전·도입 직후·벡터 복원 후의 실제 성능 회귀를 Git 이력과 같은 실행 조건으로 추적 중이다. master 통합 대기는 유지한다.
