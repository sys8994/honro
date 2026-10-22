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

## 2. 부모 원고 연결

다음 수정 단위에서 일곱 확정 JSON만 적용한다. 신규 창작·인물 초상 통합·공유 미술 변경은 포함하지 않는다. 현재 단계에서는 문구 교체와 배포가 완료됐다고 보고하지 않는다.
