> 역사 기록/초기302 실행. 현재 상태는 README.md를 따른다.

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

## 최종 실행·검수

실제 빌드/브라우저 실행 SHA: `30221dc38e7ddb1e42926aa611e34ad3b1f99bc8`. manifest SHA-256: `c1e69e94cfe1eb161e6a957e3ee1145e7326be0d192f218640b5e4bd67588e1a`. HONRO.html SHA-256: `2806dff92b7e20243e3311969fc29f72b7178d181c928c98cc4100cfb6f6923c`. 이후 문서/검사 증거만 추가한다.

- 공통 Game/Workshop/직접 Playtest build 및 수정 source syntax 통과. 관련 native identity 검사(부재 NPC8/실배우8/기존 동료4)와 vector framing96비교/비주인공4의 기존 fallback 통과. 오래된 literal caller assertion은 retained host 호출로만 갱신했다. Native 결과를 PNG crop/브라우저 실기 검사로 세지 않는다.
- title approved image 요청0. 실제 cold4 assets를 보류해도 Engine/일반 pause 진행, vector source 생성0. release 후 요청4/decode4/보이는 HUD paint4, waiter0, 같은4개 canvas 유지. 준비 전후 **월드 canvas pixel hash가 동일**하며 pause cache를 전역 강제 무효화하지 않았다.
- desktop1280×800/mobile390×844에서4인 대화 head/gat bounds 포함, 명시하지 않은 expression→base. 같은 dialogue canvas로 인물/12회 대사 교체. 실제4인 선택 버튼·HUD 갱신에서 같은4개 portrait canvas 유지, 추가 request/decode0. 다른 인물로 바뀔 때의 필요한 draw만 수행한다.
- 실제 새10장 boss 소단은 미영입 상태에서 sodan identity로 판별됐다. helper 전후 recruited/honroState/배우 이름이 같고 별도 미공개 caption도 그대로였다. 대본/이름 공개 source를 수정하지 않았다. 이 검사는10장 전체 이야기 완주나 새 서사 branch 검사가 아니다.
- 클래스만 준 호출, 무관한 같은 클래스 NPC/적, 주인공 이름을 가진 summon/가짜 적은 approved image를 받지 않는다. 원래 NPC vector fallback 유지.
- 실제 이미지 request abort: error1, vector fallback 표시, 12회 재표시 뒤 요청4/decode3 그대로. 별도 보류8초 timeout·늦은 완료·다른 인물로 전환한 뒤 stale 완료·분리 canvas remount도 통과. timeout 뒤 늦은 asset은 fallback을 덮거나 재decode하지 않는다.
- 기존 paused 경계 검사(회전/DPR/origin/피격/시간 기반 카메라/preview/실제 resume·충전·발사/flight/반복 전환) 통과. 음악 off/Chromium headless·viewport 모사이며 물리 Android/Safari, 전체 캠페인, 새 표정 variant 검사 아님. 체감 FPS 개선 수치로 raw request/paint 감소를 과장하지 않는다.

[전체 browser 결과](evidence/initial-302/checks.json), [비동기 수명](evidence/initial-302/lifetime.json), [기존 pause 경계](evidence/initial-302/pause-boundaries.json), [원본·제외 source 보존](evidence/initial-302/source-preservation.json), [배포 인코딩 증거](evidence/initial-302/encoding.json).

실제 화면(승인 이미지 자체를 편집한 자료가 아니라 runtime screenshot 배열): [desktop 대화4종](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/evidence/initial-302/desktop-dialogue-base4.jpg), [mobile 대화4종](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/evidence/initial-302/mobile-dialogue-base4.jpg), [desktop HUD](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/evidence/initial-302/desktop-hud.jpg), [mobile HUD](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/evidence/initial-302/mobile-hud.jpg), [실패 폴백](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/evidence/initial-302/mobile-failure.jpg). [설오 배경 잔류가 보이는 실제 전체 화면](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/evidence/initial-302/desktop-seoro.jpg).

**미술 한계는 남는다:** 승인 원본의 반투명 검정·갈색 영역은 실제 패널에서도 나타난다. 특히 설오 위쪽 코너의 어두운 잔류는 부모의 미술 확인 대상으로 보고했다. 이 코드 작업에서 제거하거나 색을 조정하지 않는다. 휘겸은 작은 HUD에서 갓 폭 전체를 보존하므로 얼굴이 상대적으로 작다. 갓을 잘라 얼굴을 크게 만드는 변경은 하지 않았다.

master/Pages는 변경하지 않았으며 서사/13장 미술/표정 변형 branch를 병합하지 않았다. Library에 새 이미지를 생성하지 않았고 위 repo JPG가 검수 자료다. 권한 거부/우회/결과 불명 작업 없음.
