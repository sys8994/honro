# NPC 게임톤 v3 · 독립 에셋 교체

입력 c21cfd1192606ff6181bdf7f6a69ac60a79a62ce의 승인 PNG9개를 SHA 검증해 연결했다. 기존8종과 종지기 keeper_ritual의 인물 매핑은 exact이며 25개 종지기 대사·전투·S13 P0·지형·주인공4명 원본/크롭·CSS는 변경하지 않았다. 이 단위는 변형 태그/추가7종 연결 전의 독립 변경이다.

배포 후보9개 합계:512×768 Q94 774,646bytes /768×1152 Q94 **1,386,926bytes** /768×1152 무손실5,475,120bytes. [전체 수치·alpha/PSNR](evidence/encoding-candidates.json), [얼굴 확대](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-game-tone-v3-20261023/evidence/encoding-detail.jpg), [실제 UI 후보비교](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-game-tone-v3-20261023/evidence/ui-encoding-keeper.jpg).768/Q94를 선택했다. 확대와 실제 UI에서 눈·수염·의복 선을 확인했으며 미세 노이즈를 새로 넣거나 그림을 편집하지 않았다. 선택 결과는 손실 인코딩이므로 원본 픽셀 동일로 표현하지 않는다. PNG는 불변이다. 원본 연실/종지기 한 코너의 alpha1은 입력 자체이며 완전투명0으로 과장하지 않는다.

기존 source 기준 framing을0.75배로 스케일하고 소스 padding도 이미지 크기에 비례시켰다. 기존1024 주인공의 padding은 그대로이며 새로운768 이미지도 같은 화면상의 프레이밍을 유지한다. native PNG를 초기 다운로드하지 않고 새 WebP 해시 경로만 요청한다.

집중1:9원본 SHA/인물·복장·소품. 집중2:확대 세부와3인×3 인코딩 실제 대사 비교. 집중3:9인×390/844+320덕수/PC종지기의20개 실제 App 대사 화면·버튼·머리/얼굴·투명 가장자리. [앞3](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-game-tone-v3-20261023/evidence/ui-0.jpg)·[중간3](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-game-tone-v3-20261023/evidence/ui-1.jpg)·[뒤3](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-game-tone-v3-20261023/evidence/ui-2.jpg)·[가로종지기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-game-tone-v3-20261023/evidence/844-keeper_ritual.jpg). title NPC요청0, 생산9개 URL, ready draw120회 추가paint/clear/request/decode0, pageerror0. [실측](evidence/browser.json). 저장 index0의 원문 대사 표시 fixture이며 전체 전투 완주 증거가 아니다.

공통 build와web-split 통과. 현재379 공개 graph를 포함한29개 발행 graph의 고유616파일 byte/SHA 확인. 삭제 대상은 빌드 retention의 중간 산출물이며 보호된 공개 파일은 삭제하지 않았다. 실행은 c21+해당 config/WebP/padding 작업트리, 커밋은 그 소스/생성물을 보존한다. 실제기기/Safari/공개 Pages는 미실행. master/Pages는 부모 담당이다.
