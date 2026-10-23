# 평범한 NPC v2 연결 검수

기준 master aa4b7ab7 및 부모 승인 art ab990682. 원본 PNG8개를 manifest SHA256으로 검증하고 full-size lossless WebP로 인코딩했다. 보이는 RGBA/alpha 변경0이며 원본과 네 주인공 에셋은 불변이다. 최초 미남형/새 종지기 시안은 사용하지 않는다.

화자 매핑은 rowId → exact scene+source speaker → stage별 명시 actor → 확정된 named fallback 순서다. generic ‘주민’ 전역 얼굴이나 클래스 추정은 없다. 덕수/석공/길찬은 서로 다른 얼굴, 7장의 덕수/월이/칠복은 실제 rescue 마커·증언으로 장년/여성/노년을 쓴다.14장 fresh revision1의 상층target resident-1/중층target resident-3을 실제 App launch로 확인했고 actor fallback도 현재 marker target이 일치할 때만 허용한다. 익명·기록·서술은 무초상, 종지기와 미제작 인물의 기존 정상경로는 유지한다. 이름·본문·관계·공개 타이밍은 바꾸지 않았다.

[고정65행/동적 첫·반복3인](evidence/mapping.json), [실제 마커](evidence/actor-verification.json). 8종×PC1280/390/320/가로844의32개 실제 App 대사 표본에서 얼굴/본문/버튼을 확인했다. 생산 원문의 row와 index0 저장 복원 표시 경로를 사용한 fixture이며 각 장 전투를 실제 완주한 증거는 아니다. [32표본/저장·쉼터·캐시](evidence/browser-working.json).

[390 앞4종](evidence/390-npc-1.jpg) · [뒤4종](evidence/390-npc-2.jpg) · [844 앞4종](evidence/844-npc-1.jpg) · [뒤4종](evidence/844-npc-2.jpg) · [쉼터 주막주인](evidence/rest-pub-owner.jpg). JPG는 실제 스크린샷을 리사이즈 없이 나란히 배치했다. 새 NPC는 loading/error/timeout에서 벡터를 만들지 않고 고정 중립 영역을 유지한다. 실패는 최대3회 자동시도하고 재오픈에서 다시 유한 시도한다. 요청/디코드는 공유하며 scene/frame 루프를 추가하지 않았다. [404 중립](evidence/404-neutral.jpg), [timeout 중립](evidence/timeout-neutral.jpg).

검수1:65개 현행 원문 row와 동적 구조 첫/반복,14장 target, generic/익명/종지기/주인공 제외. 검수2:8종32화면·쉼터·정상 저장/reload/Continue. 검수3:slow/404/timeout·본문/이전/다음 유지·재오픈 복구·120회 추가target paint/clear/request/decode0. 로더 cache는4주인공+8NPC를 담는12개로 제한하고 title에서NPC를선로딩하지 않는다. [4주인공 dialogue/bust/icon RGBA12개 aa4 exact](evidence/hero-regression.json), [기존 주인공 ready/abort/timeout120회 repaint0](evidence/hero-lifetime.txt). 기존 hero 실패 정책은 이번 NPC 범위에서 바꾸지 않았다.

원래 Library ZIP 전송은 정상1회+허용 재시도1회 모두 실패했고 우회하지 않았다. 이후 부모가 GitHub로 전달한 승인 원본을 사용했다. 첫 저장 probe는 reload때fixture를덮어쓴 도구 오류였으며 조건부 초기화로 수정 후 정상 저장 복원이 통과했다. 스킬·카드·UI구조·전투엔진·원고는 변경하지 않았다. 작업중 rawHEAD ab990682+소스/빌드이며 최종 실행/빌드 SHA는 후속 통합 검수에서 확정한다. 별도 S13 P0 master67022abd0281c476d5ab223b2f05cb5420c3c06b를 보존 통합했다. 충돌은 생성 HTML/manifest만 공통 빌드로 해결했다. master/Pages는 부모 담당이다. 실기기/Safari·전체캠페인 검사는 미실행이다.
