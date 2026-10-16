# 분리 배포 복구 인계

2026-10-16. 구현된 로컬 커밋 6b5fcf7c9d1accf257bb290232cb5e3fe329c7f5는 작업 공간 장애로 현재 접근 불가. 원격 배포 완료를 뜻하지 않는다. 기존 코드가 복구되면 재구현하지 않는다. 원격 master 77bf4d8의 최소 검증 지침을 따른다.

## 구현 결과와 범위
- HONRO.html 1,887B, HONRO_WORKSHOP.html 4,031B.
- web/에 226개 콘텐츠 해시 자산, 총 15,053,486B.
- 기존 주소·저장 키·게임/캠페인 로직 보존. HTTP/Pages 실행으로 전환하고 file:// 단일 파일 실행은 지원하지 않음.
- 당시 빌드, JSON 재조립 정확성, native Game/Workshop/Playtest 기본 진입, 생성 자산 HTTP 확인 통과. 실제 브라우저 확인은 미실행.
- 임시 문자열 풀링은 채택하지 않음.

## shared/build.mjs
기존 runtimeParts 내부 목록과 저작 변환을 modelFiles, mapFiles, renderFiles, appFiles, configFiles, backdropFiles, bgmTracks(), authoredProject(), authorProjectSource(expression), adapterSource()로 추출했다. 목록과 저작 변환의 순서를 보존한다. runtimeParts는 native 검사 호환용으로 유지하되 production HTML 경로에서는 쓰지 않는다.

configFiles는 HONRO_BALANCE=game/config/balance.json, HONRO_NARRATIVE_V0=shared/data/narrative-legacy-v0.json, HONRO_SPLIT_V1=shared/data/split-campaign-v1.json, HONRO_OPEN_STRUCTURES=shared/data/open-structures.json, HONRO_WATERWORKS_V2=shared/data/waterworks-v2-content.json이다.

마지막 author 순서는 다음과 같다.

```js
export const authorProjectSource=expression=>
 'globalThis.HONRO_PROJECT=HonroStoryCanonV1.author(HonroBellAnomaly.author(HonroStage2Airborne.author(HonroNarrativeRevision.author(HonroObjectiveRevision.author(HonroAct1Roster.author('+expression+'))))));';
```

adapterSource는 rebuild-game-adapter.mjs의 export를 제거하고 모든 export const/function/class 이름을 globalThis에 연결한다. ES 모듈에서는 최상위 이름이 자동 전역 공개되지 않기 때문이다. WALK_CADENCE, resolveRebuildCharacter, partyPresentationHeight, HonroPoseVisual, HonroArcherVisual, HonroPartyVisual 등이 필요하다.

## shared/delivery-build.mjs
별도 프레임워크 없이 buildDelivery({vector=true,workshop=true,destination=<root>/HONRO.html})를 구현한다. web/<역할>/<이름>.<sha256 앞16자>.<확장자>로 원자 출력하고 경로·역할·bytes·전체 해시를 manifest에 기록한다.

역할은 engine, runtime, map, render, app, ui, workshop, css, data, campaign, library, graphics, art, entries로 나눈다. 기존 IIFE/globalThis 코드를 기능별 모듈로 내보내며 순서를 보존한다.

캠페인은 authoredProject 결과를 {library,stages,...header}로 분리한다. header는 project JSON, stages는 장별 JSON, library는 category별 약400KB 묶음의 {index,asset} 배열로 저장하고 원래 index 순서로 복원한다. SVG source와 컴파일 geometry는 편집·내보내기 호환을 위해 보존한다. 복원 비교 기준은 JSON.parse(JSON.stringify(await authoredProject()))다. null-prototype gradients가 기존 JSON 직렬화에서 plain object로 바뀌는 동작을 따른다.

buildParty/buildMonsters/buildActors 후 생성 runtime.js를 vm.runInNewContext로 실행해 HONRO_PARTY, HONRO_PARTY_ART, HONRO_MONSTERS, HONRO_ACTORS 데이터를 별도 JSON으로 출력한다. party-rig와 adapter는 별도 모듈이다. 배경 SVG의 stroke=none 처리는 기존과 동일하다. 타이틀·wordmark·hanja·stage 이미지와 story portrait도 별도 해시 자산으로 출력한다.

공유 계획 JSON은 configs, campaign:{header,stages,library}, common, visuals, visualData, backdrops, bgm, vector, projectAuthor를 가진다. author 함수의 순서를 로더에 복사하지 않고 authorProjectSource로 작은 project-author 모듈을 생성한다.

## shared/runtime/delivery-loader.mjs
import.meta.url에서 ../../를 root로 삼고 모든 파일 URL을 절대화한다. readJSON은 Promise를 캐시하고 HTTP 오류를 명시한다. configs·project·visualData 다운로드는 병렬, common과 visuals 모듈 평가는 기존 manifest 순서로 순차 실행한다. modulepreload는 다운로드만 병렬화한다.

common 실행 뒤 프로젝트 header/stages/library를 조립하고 projectAuthor.author(project)를 호출한다. visualData 전역, HONRO_ARCHER=HONRO_PARTY.seol_o와 배경 URL을 설정한 뒤 visuals를 실행한다. reportBoot는 HONRO_READY, HONRO_BOOT_ERROR, honro:ready 이벤트와 화면 실패 메시지를 제공하고, 호출자는 HONRO_BOOT Promise를 전역 공개한다.

## Game과 Workshop
Game loader는 앱보다 먼저 query의 embedded=1을 HONRO_EMBEDDED에 설정한다. loadShared 후 타이틀·로고·스테이지 그림과 story portrait URL을 절대화하고 fa.js와 기존 appFiles를 순서대로 읽는다. #autostage2 동작을 유지한다.

Game HTML은 기존 body 템플릿, CSS link, loading status, type=module loader만 가진다. 루트 HONRO.html과 web/entries/game.<hash>.html 불변 진입점을 함께 출력한다. 내부 진입점의 CSS/script 상대경로는 ../../ 접두사를 붙인다. 실제 자산 URL은 import.meta.url 기준이므로 iframe 문서 base에 의존하지 않는다.

Workshop HTML의 inline STYLE/SCRIPT를 CSS link와 module loader로 대체한다. loader는 loadShared 뒤 HONRO_PLAYTEST_URL을 불변 Game HTML URL + ?embedded=1로 설정하고 stage-rules와 workshop app을 읽는다. 기존 workshop/HONRO_MAP_WORKSHOP.html 리디렉션을 유지한다.

workshop/src/app.js의 resetPlay는 srcdoc/HONRO_PLAYTEST_HTML 복원 대신 iframe.src=HONRO_PLAYTEST_URL을 사용한다. iframe.onload에서 await frame.contentWindow.HONRO_BOOT 후 HonroApp.launchMap(snapshot,st.id,기존 options)를 실행한다. Stop, selection, camera, embedded 저장 차단을 보존한다.

중요: Workshop 끝에서 document.readyState==='loading'일 때만 DOMContentLoaded once로 init을 등록하고, 아니면 즉시 init한다. 동적 import 후 이벤트가 이미 지나 초기화가 빠지는 문제를 막는다.

## CSS와 빌드 진입점
외부 CSS의 filter:url(#honro-title-ink)는 문서 URL이 아닌 CSS 파일 기준으로 해석될 수 있다. title.css를 filter:var(--honro-title-ink,url(#honro-title-ink))로 바꾸고 Game loader가 location.href에서 hash를 제거한 URL + #honro-title-ink를 변수로 지정한다.

game/build.mjs와 workshop/build.mjs는 같은 buildDelivery를 사용한다. Game만 빌드해도 workshop:true를 유지한다. 출력 완료 후 web/의 현재 manifest에 없는 이전 생성 파일을 정리하므로, Workshop을 생략하면 아직 쓰는 자산을 지울 수 있다. 빌드 중인 폴더를 직접 서비스하지 않고 완성 커밋을 Pages에 배포한다.

web/manifest.json은 version:1, entries:{game,workshop,playtest,gameLoader,workshopLoader,plan}, assets:[{file,role,bytes,sha256}] 구조다.

## 최소 확인과 문서
shared/playtest-template.mjs는 production 경로에서 제외하되 역사 검사 호환용으로 남긴다. tests/workshop-responsive.mjs와 tests/playtest-template-built.mjs의 inline 전제만 바꾸고 분리된 plan·Playtest graph·데이터 재조립을 확인한다. 전체 검사나 새 대형 DOM 대역을 만들지 않는다.
README, ARCHITECTURE, BUG_LOG와 STATIC_DELIVERY.md에 HTTP 실행·분리 구조·기존 주소와 저장 보존을 기록한다. 소스와 생성물을 작은 단위로 원격 보존한 뒤 최종 master/Pages를 확인한다.
