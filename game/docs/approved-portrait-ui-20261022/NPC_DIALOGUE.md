# 주민 대사 · 모바일 진행 버튼

통합 HEAD **`76238bffa38205a935e8a1aad54c4e0c164f72d4`**, 최신 master **`9890006179e45c7b323941a1252a3003c298751f`**의 후손이다. 실제 실행 runtime/build는 **`eaee271225a5808bb5ddf78126fdb8ce8e1d4a7e`**이며 이후 통합은 master의 과거13장 공개 자원 JSON2개만 추가한다. main/frame/paused dirty/BGM·11/13미술·스테이지/퀘스트/원고·기본 초상화 loader는 BASE4 인계3cf2782c와 동일하다. master/Pages는 변경하지 않았다.

manifest SHA-256 `0823b029c38ed39878c6adff6de85f0ba335c5cad46824ae5d59c425715fa203`. BASE4 최종 검수는65f735b1의 작업 트리에 최종 guide CSS/build가 있던 시점에 실행했고 그것을 그대로eaee2712에 커밋했다. NPC 긴 검수 종료 HEAD는eaee2712이며 별도의 실제 구조 smoke도 커밋 후 실행했다. raw HEAD를 바꾸지 않고 [실행 매핑](npc-evidence/execution.json)과 [source/build 보존](npc-evidence/preservation.json)에 구분한다.

## 재현과 최소 수정

390×844에서 초상 없는 `.dialogue-scene.text-only-scene`은 한 열이지만 기존 모바일 규칙이 `.story-copy`를 display:contents로 바꾸고 본문을 grid-column2에 놓았다. 생긴 implicit2열은337px, 명시1열은0px이었다. 버튼 행이 `1/-1`로 명시1열만 차지해 width0, 다음 버튼 x=-11.27…28이 됐다. overflow/터치 문제를 실제 DOM과 [이전 UI](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/npc-evidence/before-390x844.jpg), [좌표](npc-evidence/before-layout.json)로 재현했다. 이 전 사진은 round1의 동일 생산 문구 fixture이며 사용자 첨부나 같은18턴 저장의 pixel A/B가 아니다.

2열/display:contents 규칙을 초상이 있는 창에만 적용한다. 초상 없는 화자는 기존 flex 본문을 한 열 안에 유지한다. 긴 본문에서는 기존 창의 버튼 행에 bottom sticky를 적용해 본문 스크롤 중에도 버튼을 남긴다. 안내문은 넓은 화면에서 본문 옆에 버튼이 있으므로 top 경계도 지정한다. 전체 대화창을 재설계하지 않았다. 실제 주민 대화390×844의 버튼 행은337px, 다음 x325.73…365, height44px로 모두 창 안에 있다.

화자 `주민`은 실제 world actor의 이름 `동굴 주민`과 달라 기존 actorFor/name lookup에서 누락됐다. `HonroStoryDirection.speaker`에서 **11장 `resident` 마커의 target이 가리키는 살아 있는 honroCivilian**만 명시 연결한다. 고정 resident 번호·클래스·첫 시민·본문 키워드로 추측하지 않는다. 마커/배우 누락, 사망/HP0, 시민이 아닌 target, custom이면 연결하지 않는다. world name·통계·구출 상태·원고를 변경하지 않는다. 등록 NPC의 기존 registry fallback, 미제작 화자의 text-only, 서술/기록/안내의 무초상 의도는 보존한다. 주인공 이미지를 NPC에 대신 쓰지 않는다.

## 확인한 실행

[브라우저82항목](npc-evidence/checks.json), [실행 출력](npc-evidence/browser.txt). production `HonroAct2.use`→완료→story queue로 신고 문구2줄을 열었다. fixture는 이전 목표 완료·소단을 마커 곁에 배치·붙은 혼 약화·인접 위협 제압·round18을 준비한다. 실제 구조/목표 완료/queue/save 경로를 쓰되 **정상18턴 플레이 완주가 아니다.** 북쪽 혼의 흔적 목표, 주민1/2, 정확한 동굴 주민 actor/vector, 열린 대사 저장과 continue 복원을 확인했다. 실제 vector canvas가 동일 live actor를 직접 그린 픽셀과 같고 approved protagonist identity는null이다.

390×844,720×1560, 같은720:1560비율의360×780,844×390 가로 화면에서 실재 주민·등록 문탁·새 주민(text-only)·서술·기록·안내, 정상/35배 긴 기존 문구48조합을 확인했다. 활성 버튼 전체 rect가 viewport/panel 안에 있고 중심 hit-test가 실제 버튼인지 확인한 뒤 Playwright touch tap으로 다음→이전→넘기기를 수행했다. 긴 본문은 끝 글자까지 스크롤하면서 버튼 접근을 검사한다. 안내에는 원래 확인만 있으며, 확인→다음 화자의 넘기기를 검사했다. 안내에 없는 넘기기를 성공으로 세지 않는다.

[코드 identity 경계](npc-evidence/binding.txt)·[기존 Native NPC/동행 identity](npc-evidence/identity.txt)·공통 Game/Workshop/직접 Playtest [build](npc-evidence/build.txt)·syntax 통과. 이전 기본초상화 [18항목](npc-evidence/base4-checks.json)도 같은 최종 manifest에서 통과했다: cold/warm4요청/4decode·retained canvas·NPC/클래스 충돌·prejoin소단·오류 폴백·pause world hash 보존. 이전 timeout/반복paint 검사를 다시 주장하지 않으며 [그 정확한 실행은 기존 보고서](README.md)에 유지한다. 일반 전투 FPS나 점증 렉 해결로 확대하지 않는다.

수정 중 검사의 저장 재로드는 초기 profile init-script가 매번 저장을 덮고 launch를 호출하던 harness를 고쳐 continue 경로로 검사했다. 안내에는 skip이 없는 점과 옆 열의 본문 tail을 일렬 배치로 보던 assertion도 바로잡았다. 넓은 안내의 실제 top 경계는 소스로 보완했다. 이들을 제품 전체 실패/통과로 섞지 않는다.

## 실제 UI 사진

- [신고된 주민 ·390×844](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/npc-evidence/resident-390x844.jpg), [720×1560](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/npc-evidence/resident-720x1560.jpg), [360×780](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/npc-evidence/resident-360x780.jpg), [가로](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/npc-evidence/resident-landscape.jpg)
- [초상 없는 긴 본문 스크롤 끝](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/npc-evidence/text-only-long.jpg)
- 최종 CSS의 clean 설오 [mobile](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/npc-evidence/final-mobile-seoro.jpg), [desktop](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/approved-portrait-ui-20261022/npc-evidence/final-desktop-seoro.jpg). 기본 승인 원본/부모 clean PNG를 편집하지 않았다.

직접 사진을 열어 NPC가 시민 벡터이고 진행 버튼이 읽기창 안에 있는지, 가로 창과 clean 설오 모서리를 확인했다. 사진은 실제 Chromium 캡처이며 신규 미술이 아니다.

## 인계·한계·차단

새 충돌 위치는 **shared/runtime/story-direction.js의 speaker 함수**와 **game/src/presentation.css의 모바일 대사 규칙/공통 sticky 행**이다. 기존 BASE4의 portraits/story/main/config/web-build 경계는 [원래 문서](README.md)에 있다. 부모 대사 refactor branch를 가져오지 않았고11장 퀘스트/원고도 변경하지 않았다. 첫 배치/조준 방향 코드는 이번 NPC/초상화 작업에서 변경하지 않았다.

최신 master의 현재 공개 파일351개와 복원 자원2개를 동일하게 보존한다. runtime/tree/HTML은eaee2712와 같다. 이 문서/증거 외 추가 실행 수정은 없다. 최종 fast-forward 가능 여부와 원격 SHA를 인계 때 다시 읽는다.

**차단 1건:** Library `libfile_7e660bcbcbd08191bc2b44bf47a848ed`의1000047845.jpg를 준비 도구가 준 signed transfer URL로 다운로드하려 했으나 proxy의 `Tunnel connection failed: 403 Forbidden`으로 거부됐다. 파일은 내려받지 못했고 성공/열람으로 세지 않는다. 재시도·우회하지 않았다. 부모가 제공한 화면 설명과 생산 DOM/문구로 재현하고 자체 UI 캡처를 완료했다. 코드·검수·push의 차단/불명 결과는 없다.

Chromium headless의 touch/viewport 모사, 음악 off다. 물리 Android/Safari·실제 소리·사용자 기기의 원본 screenshot 픽셀 대조·전체 캠페인을 검증했다고 주장하지 않는다.
