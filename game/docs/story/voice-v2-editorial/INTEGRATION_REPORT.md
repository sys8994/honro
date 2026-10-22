# 서사 데이터 통합과 원고 연결

기준은 `934fcabd74767d662aee3830585ba807234934cc`, 인계 원고 HEAD는 `3e02bb8295fe05b5ec418bee77b3c6641d29ab6d`다. 작업 브랜치는 `story/narrative-voice-v2-20261022`이며 master/Pages는 부모 최종 검수 담당이다.

## 1. 문구를 바꾸지 않은 동등성 단위

- 현재 신규 진입 30장의 최종 원고를 `shared/data/narrative-current.json`으로 모았다. 장별 비서사 수치·계약은 `stage-contracts.json`, 이전 revision-1 표현과 선택 자료는 명시적인 `narrative-compat-v1.json`에 분리했다. 기존 V0/split-v1/waterworks-v2 파일은 그대로다.
- `HonroNarrativeCatalogue.resolve` 하나가 사용자 원고 → 저장 snapshot → 동결 호환 자료를 구분한다. 사용자 Workshop 원고에는 투영하지 않는다. 신규 맵에만 catalogue revision이 붙고, Continue의 원문·대화 cursor·목표·자원은 마이그레이션하지 않는다.
- `objective-revision`을 감싸던 quarry/vertical/bell/narrative/waterfall/canon/evidence/layered-road의 `contentFor` wrapper를 제거했다. EvidenceQuests의 목표·운반·증거 판정과 Act2Pacing의 실제 3/4라운드 판정은 남겼다.
- `act2-plan.js`, `act2-drama.js`의 중복 현재 조립 코드를 제거했다. act1/act2/act3 content 및 journey의 중복 대사 정의는 데이터 참조로 바꿨다. Act3 atlas의 미술 함수는 유지했다. 기존 map author가 사용하던 역사 자료는 동결 호환 JSON으로 읽으며 지형/단위/보상 author 자체는 재설계하지 않는다.
- 현재 행에 영속적인 `rowId`와 명시적인 camera/direction 참조를 저장했다. 현재 연출은 문장 검색·현재 배열 위치로 재해석하지 않는다. 기존 저장의 index/cues와 legacy projection만 호환 경로에 남긴다. map prologue version 7 및 기존 storyId/once/seen 키는 유지한다.
- [동등성 검사](evidence/parity.txt): 30장의 실제 fresh effective content와 비서사 stage 계약이 일치한다. 새 rowId/연출 참조만 비교에서 분리했다. 40개 V0/revision1/stored/split-v1/waterworks-v2 선택도 기준 runtime에서 잡은 fixture와 일치한다.
- [저장 검사](evidence/save.txt): 실제 App harness에서 현행/구 저장 대화의 원문·cursor·HP/MP/쿨다운·quest marker를 Continue 후 대조했다. 2장 이름 공개는 실제로 해당 줄을 본 상태로 저장한다. DOM/audio는 double이며 실제 화면 증거는 아니다.
- 로컬 공통 빌드는 통과했다. 생성 HTML/web은 통합 최종 소스로 다시 빌드할 대상이며 이 단위에는 커밋하지 않는다.

## 2. 실행 경계 보완

`1f03da01`에서 실제 분할 HTML 검수로 발견한 두 누락을 고쳤다. 막 엔딩만 catalogue에서 추출해야 하는데 파티/몬스터/배우 에셋 추출도 같은 경로로 바뀐 것을 복구했고, 전투가 쓰는 `HonroAct2Plan.forStage`는 최종 stage의 기계 데이터에서 계속 제공한다. 옛 revision-1 저장의 미개봉 staging은 동결 정의를 선택하며, 이미 저장한 steps/cursor는 그대로다. [경계 검사](evidence/boundaries.txt)에서 확인했다.

## 3. 확정 원고 연결

실제 검사 소스는 `ce9028d10b00d467474ea353f778b1599ca21c4c`다. 일곱 JSON의 입력 SHA-256, catalogue/기계 계약/빌드 manifest와 JPG 크기는 [source-manifest.json](evidence/source-manifest.json)에 있다. 모든 원고는 인계 HEAD의 확정 한국어 그대로 연결했다. 새 문장·세계관·인물 초상은 만들지 않았다.

- `narrative-current.json`만 현재 편집 원본이다. `apply-editorial-v2.py`는 parity 커밋에서 일곱 원고를 옮기는 일회성 재현 도구이고 빌드/런타임에서는 실행하지 않는다. 재실행 전후 catalogue와 metadata 파일 해시가 같았다.
- [METADATA_BINDINGS.json](METADATA_BINDINGS.json)은 공급 원고 196개 입력의 목적지와 행별 의미 메타데이터 출처를 기록한다. 세 번째 숫자를 영속 ID로 쓰지 않는다. 시작 장면, 14장 중층 가족, 29장 편지는 최종 원문의 의미에 맞춰 재연결했다. 새 현재 행에 고정 rowId를 두고 기존 storyId/once/seen과 prologue version 7은 유지했다.
- 13장의 문 폐쇄 긴 문답은 구조 후 resident로 옮겼다. 5장 주박목/물길진, 12/14장 별도 baked snapshot, 17장 3라운드, 18장 4라운드와 안전 하강, 13/16/30장 A/B 경로를 유지했다.
- 2장의 이름 공개, 기록 kind/documentId, 협력 수락, 20장의 종 목격 회상, 28장 퇴장과 29장 편지의 void 목격 조건을 보존했다. 18/27장 요약의 목격 보충은 실제 완료 시에만 덧붙인다.
- 구조 발언은 실제 활성 화자/주민/최초 고지 조건으로 공급된 절만 선택한다. 미사용 옛 조건 기본문과 구조 템플릿 대사는 현재 catalogue에서 제거했다. 옛 원문은 compat에만 남겼다. 현재 지연 대화는 명시적인 상태/onlyWhile로 선택하고 옛 한국어 문구 교정은 legacy 경로에 남긴다.
- 12장 담허가 멀리 있을 때는 기존 공간 분기의 행동절 `담허의 설명을 따라 겹친 획 하나를 풀었다.`와 공급된 새 후반 문장을 사용한다. 인계서가 이 분기 보존을 명시했으며 임의 대체 문장을 만들지 않았다.
- 27장은 무명 화자의 5컷과 3줄 복귀를 공급 원고로 교체했다. 1.4초 진입, 즉시 수동 넘김, 최소 입력 중복 방지, 보이는 skip/pause, 안전 복귀/저장 처리는 유지했다.
- 쉼터 도입은 공급 원고를 한 번만 표시한다. 예전 description 추가/후기 장 narrator 제거가 새 도입을 중복하거나 지우지 않게 연결했다. 진행 중 쉼터의 저장 원문/cursor는 복원한다.

## 4. 확인한 범위와 근거

- [확정 원고 검사](evidence/editorial-v2.txt): 190개 장면/값 대조 그룹, 신규 30장의 최종 effective snapshot·도입·요약, 선택 대화, 기록 메타데이터·목격 조건, 실제 6개 route handoff, Workshop 원문 경계. 구조 발언은 화자/주민/최초 플래그 선택까지 검사한다.
- [기계 계약/옛 선택 검사](evidence/mechanics.txt): 신규 30장의 비서사 값·정확한 기술 guide/goal 불변, 기준 runtime에서 캡처한 40개 옛 resolver 선택 일치. 원고 변경 전의 전체 문장 동등성은 별도 `f4182439`와 [parity.txt](evidence/parity.txt)에 남아 있다.
- [Continue 검사](evidence/save-v2.txt): 대표 현행/구 저장의 원문·cursor·HP/MP·쿨다운·quest marker와 이름 공개·seen 경계. App/Engine 실제 코드, DOM/audio double이다.
- [27장 기존 회귀](evidence/void-runtime.txt): 빠른 입력·키 반복·일시정지·백그라운드·전환별 스킵·저장/재개·원위치/자원/활성 동행·checkpoint·목격 플래그. 실제 App/Engine과 authored stage27, 제어된 후반 임무 fixture다.
- [build](evidence/build-v2.txt), [typecheck](evidence/typecheck.txt), [분할 웹 동등성](evidence/web-split.txt) 통과. Game/Workshop 공통 원천과 30개 external chapter/library 및 파일 해시를 확인했다. 전체 npm verify는 실행하지 않았다.
- [실제 Chromium 측정](evidence/ui/checks.json): 390×844와 1280×900에서 18개 선택 확인 항목, pageerror 0. 2장 이름 공개 전후, 9장 진입 연출/거절 퇴장, 10장 협력 수락/6턴 안내/퇴장, 12장 실제 sign 상호작용의 원거리 분기, 14장 baked 대화, 28장 4인 재합류, 29장 목격 편지, 27장 실제 overlay 입력/skip/3줄 복귀를 확인했다. 27장 긴 넷째 줄과 실제 actor bounds의 교집합은 두 화면 모두 0px²다.

JPG 7장을 직접 열어 대사 읽힘·패널 잘림·무명 장면의 여백을 확인했다. 모두 1MB 미만이다.

- [2장 이름 공개 · 모바일](evidence/ui/name-reveal-390x844.jpg)
- [9장 소단 · 모바일](evidence/ui/sodan-refusal-390x844.jpg)
- [10장 퇴장 · 데스크톱](evidence/ui/sodan-aftermath-1280x900.jpg)
- [12장 기록 · 모바일](evidence/ui/quarry-snapshot-390x844.jpg)
- [14장 중층 주민 · 모바일](evidence/ui/village-snapshot-390x844.jpg)
- [27장 무명 조우 · 모바일](evidence/ui/void-long-line-390x844.jpg)
- [29장 목격 편지 · 데스크톱](evidence/ui/witness-letter-1280x900.jpg)

실화면은 authored campaign을 띄운 뒤 위치·목격 플래그·대화 위치를 제어한 대표 fixture다. 30장 정상 전투 완주, 모든 대사 실화면 순회, 실물 모바일, 성능 검수나 Pages 검증으로 보고하지 않는다. 최종 선택 검사에서 남은 실패는 없다.

## 5. 소유권과 통합 주의

현재 prose의 중복 조립/contentFor wrapper는 제거했지만 지형·objective·증거·pacing·행동·기술 경고와 필요한 legacy 코드/데이터는 남긴다. `story-content-v1.js`, `narrative-compat-v1.json` 및 V0/split-v1/waterworks-v2는 옛 저장 선택을 위한 소스이며 새 원고를 덮어쓰지 않는다. 현행 sceneId를 새로 바꿔 본 장면을 다시 열지 않는다.

공유 art/portrait 에셋은 수정하지 않았다. 병행 13장 art 작업과 직접 에셋 충돌은 없다. 부모 통합 시 주의할 파일은 `shared/build.mjs`/`shared/web-build.mjs`의 공통 로딩 순서, `content.js`의 인물 소개, `main.js`의 완료 요약 한 지점, `rest-journey.js`의 도입 선택, `story-staging.js`의 구 저장 정의 선택이다. 이 파일에 다른 변경이 있다면 기능 단위로 합친다. 생성 HTML/web은 부모의 최종 소스로 다시 빌드하며 이 브랜치에는 생성물을 커밋하지 않는다.

브랜치 커밋과 원격 push만 수행했다. master 병합·Pages 배포는 하지 않았다. 기술 차단은 없으며 부모 최종 검수/통합이 남아 있다.
