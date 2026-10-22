# 승인 BASE4 초상화 UI 연결 · 2026-10-22

기준 art/portrait-standard-20261022 `e99913e337cf06f1c0bdf5dfdcdda7cf78dcdb3e`(master934fcabd 포함). 승인 원본 PNG 네 파일은 변경하지 않는다. SOP `PORTRAIT_PRODUCTION_SOP.md`를 따르며 이미지 생성/리페인트/배경 제거/의상·색상·형상 보정은 하지 않았다. 최종 실행 SHA/사진/검사 결과는 검수 완료 후 아래에 추가한다.

## 변경 범위

- 기존 `game/config/story-portraits.json`의 알려진 네 이름에만 `approvedPortrait.id/defaultExpression/expressions.base`와 source SHA·1024×1536·명시 head/bust bounds를 추가한다. base만 연결하며 미등록 `meta.portraitExpression`은 base로 돌아온다. 문장/기예 키워드로 표정을 추정하지 않는다.
- `shared/web-build.mjs`의 기존 story portrait asset 루프에서 필요한 URL을 배포 manifest에 넣는다. 제목에서 fetch/preload하지 않는다. `shared/build.mjs`는 수정하지 않는다.
- `shared/runtime/portraits.js`가 실제 actor의 이름/클래스/side·summon 구분을 확인하고, actor가 없으면 명시적인 알려진 네 화자 이름만 허용한다. 클래스만 준 호출은 기존 vector다. 소단 boss도 동일한 portrait identity이며 speaker/reveal/recruit 상태를 쓰지 않는다. NPC storyActor와 기존 vector/head crop API를 유지한다.
- request/decode는 URL별1회, image cache 최대8(현재 base4). pending은 최대8초 후 기존 vector로 fallback하며 자동 재요청하지 않는다. normal loading 중 vector를 먼저 그리지 않아 vector→image 반복 전환을 피한다. 현재 연결된 canvas만 갱신하며 오래된 요청이 새 화자를 덮지 않는다.
- hero-switches에 네 canvas, dialogue-root에 하나의 canvas를 소유시킨다(WeakMap). 대사 root의 기존 문구/버튼 HTML 갱신을 전면 재작성하지 않고 portrait surface만 재사용한다. 같은 asset/크기면 재그리지 않는다. 다른 인물로 바꿀 때 필요한 draw는 유지한다. 준비된 image는 큰 vector source canvas 생성 경로를 거치지 않는다.
- main.js의 portrait/drawPortraits 두 멤버, story.js의 drawBust 및 portrait host 삽입 호출부만 연결한다. world vector actors·지도·기예·캠페인·기존 pause/HUD dirty 조건은 변경하지 않는다.

## 미술·배포 확인

4 PNG를 실제로 보고 head/bust safe bounds를 기록했다. 휘겸은 갓의 윗부분/양끝을 포함하는130,0–1010,670 head bounds다. 일반 alphaBounds를 얼굴/모자 범위로 대신하지 않는다. approved crop은 원본 범위 안에서 이동하며 head/gat 전체를 포함한다.

`tools/testing/encode-approved-portraits.mjs`는 크기·crop·색상 변경 없이 lossless WebP만 만든다. PNG7,672,924B→배포 WebP4,092,558B(약47% 감소), 해상도는 모두1024×1536이다. 알파 및 alpha>0의 모든 RGB channel 차이0. 완전 투명 픽셀의 보이지 않는 RGB만 코덱에 의해 바뀔 수 있으며 `encoding.json`에 수치를 남긴다. masters SHA는 그대로다. 원본에 반투명 검정/갈색 영역이 있으므로 완전 투명 외곽이라고 주장하지 않는다.

실제 대화창에서 **설오 위쪽 모서리에 어두운 반투명 잔류가 보인다.** 승인 원본의 alpha/RGB를 그대로 합성한 결과다. 부모에게 실제 screenshot을 보고하며 임의 배경 제거·edge 보정을 하지 않는다. 이 미술 한계를 숨기고 깔끔한 transparent cutout으로 설명하지 않는다.

## 부모의 병행 서사 작업과 충돌 지점

`story/narrative-voice-v2-20261022`는 병합하지 않는다. 정확한 재적용 경계:

1. `shared/web-build.mjs`: story-portraits.json을 읽은 직후의 asset emit 루프만 확장.
2. `shared/runtime/story.js`: drawBust를 mount+identity+명시 meta.portraitExpression 호출로 연결; 기존 canvas HTML 대신 빈 `.story-portrait` host에 retained canvas를 삽입하는3개 변경. 대본/명명/연출/진행 코드는 그대로.
3. `shared/runtime/main.js`: portrait markup과 drawPortraits만 변경. summary/rest-journey/content.js는 수정하지 않음.
4. `game/config/story-portraits.json`: 네 주인공의 approvedPortrait metadata 추가. 기존 NPC row는 변경하지 않음.

부모는 서사/미술 브랜치 통합 시 위 작은 caller 변경을 재적용하고 generated HTML/web를 공통 build로 갱신한다. master/Pages는 이 브랜치에서 변경하지 않는다.
