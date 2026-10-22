# 승인 BASE4 초상화 UI · 최종 통합

`c5b51319ef887943726434d84db596f07254bbd3`(13장 shape4 포함)를 병합했다. 실제 build/browser 검수 HEAD는 **`637255dd1a29de413d52d21ff1baf4312570ed37`**이다. 이후 별도 NPC 대사·모바일 버튼 보완과 최신 master 자원 복원은 [추가 인계](NPC_DIALOGUE.md)에 실행 SHA·사진·한계를 따로 기록한다. 이 HEAD는 c5b51319의 후손으로 c5b51319에서 fast-forward 가능했다. 최신 통합 ancestry는 추가 인계 문서를 따른다. master/Pages는 부모 담당이며 여기서는 변경하지 않았다. 대사 통합/표정8종 branch는 가져오지 않았다.

최종 manifest SHA-256 `bb8d7f30130aded063218af46faf1044a29fba05b20d50ac488272859ad90bc0`. HTML SHA-256 `66a8caa4baeef297b2ec1c1b5c322fa22e597e5657b6d8bff4783e9fd535ff80`. 초기302 연결·사진·당시 검수는 [역사 기록](INITIAL_302.md)에 분리했다.

## 실패 폴백 반복 paint 보완

302의 동일-key error 경로는 vector source cache hit와 별개로 매 draw마다 최종 canvas를 clear/draw했다. 실제 target Context의 clearRect/drawImage를 각각 감싸 재현했다. 폴백이 그려진 vector identity와 유효 raster ratio를 저장하고, 기존 sourceFor와 같은 identity 규칙을 공유한다. 같은 인물·크기·표시 원본이면 기존 폴백 canvas를 유지한다. 크기/원본 identity가 달라지면1회 다시 그린다. actor 참조는 paint 후 해제한다.

각 상태가 ready/error로 완전히 정착한 뒤 같은 draw120회. 값은 actual target clearRect/drawImage 각각의 호출 수다. request/decode와 source build를 paint의 대용치로 세지 않는다.

| 상태 | 이전302 | 최종637 | 추가 request/decode | backing 크기 변경 | 변경 뒤 동일120회 |
|---|---:|---:|---:|---:|---:|
| 정상 ready |0/0|0/0|0/0|1/1|0/0|
| request abort fallback |120/120|0/0|0/0|1/1|0/0|
|8초 timeout fallback |120/120|0/0|0/0|1/1|0/0|

error 상태의 최초 폴백 paint는1회다. 반복120회 후 fallbackPaints와 vectorBuilds도 그대로1이었다. 실제 raster pixels도 동일했다. 기존 원본 identity 변경은1회 paint, 같은 변경 원본120회0, portrait와 무관한 HP/좌표 변화0, 원래 identity 복귀1회를 확인했다. 정상 ready/abort/timeout을 모두 구분해 [전](evidence/repaint-before.json)·[후](evidence/repaint-after.json)에 보존한다. 과거 probe 종료의 보류 route 취소 콜백 노이즈는 계측 도구의 종료 문제이며 앱 예외가 아니다. 최종 도구는 route를 명시 정리한다.

## 부모 clean 설오 입력과 provenance

코드가 이미지를 생성·편집하지 않았다. 부모가 직접 만든 다음 두 파일만6606dd03에서 선택 수입했다.

- `art/portraits/runtime-derivatives-v1/seoro-base-clean.png`
- `art/portraits/runtime-derivatives-v1/seoro-base-clean.json`

부모 Library file ID: `libfile_27fe0bec3b5081918706483b7d6e680d`. 생성형 배경 편집 파생본이므로 **승인 원본과 pixel-identical이라고 주장하지 않는다.** 원본 얼굴·흉터·표정·복장·포즈의 동일성은 부모가 나란히 시각 검수한 입력이다. 원본 approved-v1 네 PNG는 그대로 보존한다. 담허/휘겸/소단은 기존 승인 PNG를 계속 인코딩한다.

설오 identity master SHA-256: `d05ce83f8487515f127abb441dbae4a4616c66181ffbea15498060a237a090a9`. 실제 인코딩 입력 clean PNG SHA-256: `f2c1dea750c048babd7ac8b28d6013a39038b140954fac9876718d1241e86206`. 부모 metadata의 sourceMasterSha `06d88387f50e64ae00976871c9b1656846737437`는 동일 원본의 **Git blob ID**이며 SHA-256과 구분해 검증했다.

config의 `identityMaster/identityMasterSha256`는 승인 identity 기준, `source/sourceSha256`는 실제 인코딩 입력이다. encoding schema2도 `identityMaster*`와 `encodingSource*`를 구분한다. lossless channel 비교는 **실제 encodingSource PNG 대 WebP**에만 적용하며 알파·alpha>0 RGB 차이0이다. 완전 투명 픽셀의 보이지 않는 RGB는 코덱에 의해 달라질 수 있다.

최종 입력4종 합계7,661,632B→WebP3,866,070B, 모두1024×1536. crop/resize/filter/색보정 없이 기존 무손실 WebP 인코딩만 했다. [인코딩 보고서](../../../shared/assets/portraits/approved-v1/encoding.json), [출처 검증](evidence/source-provenance.json).

clean PNG의 좌상·우상·상단 중앙·100,100 alpha0과1024×1536을 확인했다. 우하단은 의상이 닿는 alpha252 픽셀이며 임의로 지우지 않았다. 실제 배포 canvas의 양쪽 위 코너도 alpha0이다. **실제 대사창의 이전 설오 검정 모서리 잔류는 제거됐다.** [동일 UI의 이전/clean 사진](evidence/seoro-before-after-ui.jpg), [현재 전체 화면](evidence/desktop-seoro.jpg), [alpha 검사](evidence/seoro-alpha.json). 원본을 투명 원본이었다고 소급 설명하지 않는다.

## 유지한 API·갱신 소유권

- 정확한 네 이름/명시 identity와 실제 actor를 우선한다. 같은 클래스 NPC/적/summon은 기존 vector fallback이며 class-only 호출은 승인 이미지로 바뀌지 않는다. 실제 미영입 소단 boss도 같은 portrait identity지만 이름 공개/영입 상태를 쓰지 않는다.
- 명시 `meta.portraitExpression`만 선택하며 미등록/누락은 base다. runtime에는 base4만 있다. head/bust 안전영역은 alpha bounds 추정이 아닌 manifest의 시각 검수값이다. 휘겸의 넓은 갓을 전부 보존한다(작은 HUD에서는 얼굴이 상대적으로 작다).
- title의 승인 image request0, 관련 UI의4회 request/4회 decode. 준비 완료 때 현재 연결된 HUD canvas만 한 번씩 paint한다. 정상 로딩 중 반복 vector→image flash가 없다. HUD4개와 dialogue-root의1개 canvas를 WeakMap 소유로 유지한다. 기존 이야기 텍스트 shell 갱신을 전면 재작성한 작업은 아니다.
- image cache8, 현재 base4. timeout8초/abort/error는 비차단 vector fallback이며 자동 request/decode 재시도를 하지 않는다. 늦은 완료가 다른 화자/정착된 error를 덮지 않는다. detached loading canvas도 remount하면 올바르게 준비 그림을 그린다.
- world vector actors·지도·전투 규칙/수치·기예·BGM·기존 frame/HUD/pause dirty 로직을 변경하지 않는다. 이미지 준비 전후 World canvas hash 동일, pause cache 유지, 목표/카메라/FX 경계도 그대로다. CPU/FPS 개선으로 raw call 수를 확대 해석하지 않는다.

## 새 master 통합과 검수

병합 충돌은 generated HTML/web와 BUG_LOG뿐이었다. BUG_LOG 양쪽 내용을 유지하고 공개 c5b51319 생성물 기준으로 공통 rebuild했다. c5b51319의 공개 web351개 파일을 byte-identical하게 보존해 기존 cached entrypoint도 유지한다.

c5b51319와 shared/build.mjs·전체 shared/data/map/engine·world renderer·11/13 미술 source·BGM 파일/source가 동일하다. main.js는 portrait/drawPortraits 두 멤버를 제외하면 원문 전체가 같아 audio/frame/paused dirty 보호를 확인했다. [보존·ancestry 기록](evidence/master-preservation.json).

공통 Game/Workshop/직접 Playtest build·syntax·새 portrait browser18항목·async 수명4경계·request/decode 및 실제 repaint3상태·Native identity를 통과했다. Native vector framing96비교/비주인공4도 f827의 동일 portrait runtime에서 통과했다. 새 master 뒤에는 관련 연결/소유권/기존 pause 검사만 갱신했으며 긴 성능3회나 전체 캠페인은 반복하지 않았다.

pause 검사의 기존 '8 frame 후에도720ms focus가 남아야 함'은 느린 호스트에서 실제 시간이 먼저 만료되어 실패했다. deadline 시작/보존·경과시간을 함께 확인하도록 검사만 고쳤다. 최종8 frame elapsed443ms/duration720ms·실제 focus 유지 및 이후 안정화가 통과했다. 제품 clock/애니메이션을 변경하지 않았다. [최종 pause](evidence/pause-boundaries.json), [이전 시간 가정 실패](evidence/pause-prior-frame-assumption.txt).

13장 단독 검사 원본은 'main.js/portraits.js가934fcabd와 완전히 같아야 함' 가드에서 의도된 초상화 변경 때문에 실패했다. 원본 검사는 수정하지 않았다. `portrait-stage13-preservation.mjs`는 이 두 whole-file equality 가드만 제외하고 같은 나머지 검사를 실행했다. 보호13/다른29장·기존 Library·production plane/배치·순수성·정적 Path 재사용·cached draw 새Path0·sceneVersion invalidation이 통과했다. source preservation과 분리해 기록하며 원본 전체 검사 통과로 숨기지 않는다. [원래 가드 실패](evidence/stage13-original-guard.txt), [적용 가능한 집중 검사](evidence/stage13-focused.txt). optional baselineComparison pixel 대조는 이 실행에서 설정하지 않았다.

Chromium headless/desktop1280×800 및 mobile390×844 모사, 음악 off의 제한이 있다. 물리 Android/Safari·실제 소리·30장 완주·새 표정8종 검사가 아니다. BGM은 source/asset 보존 확인이며 실기기 재생 승인으로 표현하지 않는다.

## 현재 사진·자료와 충돌 경계

[desktop 대화4종](evidence/desktop-dialogue-base4.jpg) · [mobile 대화4종](evidence/mobile-dialogue-base4.jpg) · [desktop HUD](evidence/desktop-hud.jpg) · [mobile HUD](evidence/mobile-hud.jpg) · [실패 폴백](evidence/mobile-failure.jpg). composite는 실제 screenshot을 크기 변경 없이 배열한 문서 자료이며 source 이미지를 편집하지 않는다.

[브라우저 결과](evidence/checks.json), [비동기 수명](evidence/lifetime.json), [repaint](evidence/repaint-after.json), [build](evidence/build.txt). 기본 연결 검수/검정 잔류의 옛 사진·문서는 [302 역사 기록](INITIAL_302.md)에 보존한다.

부모의 대사 refactor와 겹칠 수 있는 파일은 기존과 같다: portraits.js; story.js의 drawBust/retained host 호출3곳; main.js portrait/drawPortraits; story-portraits.json의4개 metadata; web-build.mjs의 portrait asset emit 루프. **shared/build.mjs는 최신 master 그대로**이며 대사 branch를 merge/rewrite하지 않았다. source field/검사 도구 외 새로운 미술/실루엣/궤적 변경은 없다. master/Pages는 변경하지 않았고 권한 거부/우회/결과 불명은 없다.
