# 평범한 NPC v2 연결 · 최종 인계

> 역사 자료 안내(P2.4): 이 문서의 옛 NPC WebP/encoding 자료와 전용 인코더는 퇴역했다. [당시 encoding.json](https://github.com/sys8994/honro/blob/24526d56bfdb6460d0cdf6205a744faf00ca45c6/shared/assets/portraits/npc-plain-v2/encoding.json)과 [당시 인코더](https://github.com/sys8994/honro/blob/24526d56bfdb6460d0cdf6205a744faf00ca45c6/tools/testing/encode-npc-portraits.mjs)는 고정 Git 자료다. PNG identity master와 기록 hash/증거는 보존하며 현재 실행 파일은 npc-game-tone-v3다. [삭제 inventory·결과](../../retired-npc-logo-p24-20261024/README.md).

브랜치 `fix/plain-npc-portraits-v2-20261023`. 구현 `f602d99019d1a85abe9a79216c82b29fdfd43367`, P0 통합 `66758d137da48ba25ddd8abd9ebffb206084526f`, 최종 runtime/build 소스 `36ddbdd840fa54b71b483df101b917b8f575eb09`. 마지막 증거 커밋은 문서·사진과 검사 stdout/소스해시 설명만 바꾸며 런타임/생성물은 이 실행 소스와 같다. master/Pages는 부모 담당이다.

기준 대본 master `aa4b7ab784a3f9f4a490c0004f0b74fc51b3f361`의661행과 부모 승인 art `ab9906822ea21bb08675058187944ee96bb5cafc`를 사용했다. 별도 S13 방어 후 다음 턴 이동 잠금 P0 master `67022abd0281c476d5ab223b2f05cb5420c3c06b`를 병합했다. 충돌은 생성 HTML/manifest만 공통 빌드로 해결했다. 엔진·지형·대본·카메라·스킬·카드·CSS는 이 최신 master 원본과 같고 주인공4명/종지기 registry도 aa4와 같다. 이 작업에서 P0 전투 검사를 다시 수행했다고 주장하지 않는다.

승인 PNG8개는 `art/portraits/npc-plain-v2/manifest.json`의 SHA256과 일치한다. 원본 크기1024×1536, 네 코너 alpha0을 확인했다. 원본/그림/색/크롭 수정 없이 full-size lossless WebP로 인코딩했으며 보이는 RGBA·alpha 변경0이다. 배포8개 합8,964,946bytes. 최초 미남형/새 종지기 시안은 사용하지 않았다. [인코딩 결과](../../../../shared/assets/portraits/npc-plain-v2/encoding.json).

화자는 rowId → exact scene+source speaker → stage별 명시 actor → 명시된 고유 이름 fallback 순서로 연결한다. generic ‘주민’ 전역 얼굴이나 클래스 추정은 없다. 덕수/석공/길찬은 서로 다른 얼굴이며 재등장 때 같은 얼굴이다. 7장의 덕수/월이/칠복은 실제 rescue 마커·동적 증언으로 장년/여성/노년을 구별한다.14장 fresh revision1의 상층target resident-1/중층target resident-3을 실제 App launch로 확인했고 actor fallback도 현재 marker target 일치가 필요하다. 익명·기록·서술은 무초상, 종지기와 미제작 인물의 기존 정상경로는 유지한다. 이름·본문·관계·공개 타이밍은 바꾸지 않았다.

새 NPC는 loading/error/timeout에서 벡터를 만들지 않고 고정 중립 영역을 유지한다.8초 timeout 후 최대3회 자동시도하고 재오픈에서 다시 유한 시도한다. 공유 요청/디코드, 유지되는 canvas를 사용하며 별도 frame/scene loop는 없다. 이미지 cache는 현재4주인공+8NPC의12개로 제한하고 title에서는 NPC 요청0이다. 기존 주인공의 실패 정책은 이번 NPC 범위에서 바꾸지 않았다.

## 집중 검수와 실제 사진

1. **화자/분기:** [고정65행·동적3인 첫/반복](evidence/mapping.json), [실제7·14장 마커](evidence/actor-verification.json), [기존 identity 검사](evidence/story-identity-final.txt). 고정65행 중56개 매핑,5개 종지기 보류,3개 익명,1개 동적별칭이며 마지막 별칭은 실제 rescue 이름·마커·scene으로 구별한다. 고유3인과 노승/승려의 구별, unknown generic/주인공/종지기 제외가 통과했다.
2. **UI/저장:**8종×PC1280/390/320/가로844의32개 실제 App 대사 표본에서 얼굴·본문·이전/다음 접근을 확인했다. 생산 원문 row와 index0 저장 복원 표시 경로를 사용하는 fixture이며 장 전투를 완주한 증거는 아니다. 정상 Story.save→reload→Continue가 같은 원문/metadata를 복원하고 실제 쉼터 prelude의 주막주인도 연결된다. [32표본 raw](evidence/browser-working.json), [390 앞4종](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/390-npc-1.jpg)·[뒤4종](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/390-npc-2.jpg), [844 앞4종](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/844-npc-1.jpg)·[뒤4종](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/844-npc-2.jpg). JPG 합본은 실제 화면을 축소 없이 나란히 배치한 것이다.
3. **수명/실패/기존 영웅:** slow/404/8초 timeout에서 중립 영역, 본문·이전/다음 유지, 늦은 성공/재오픈 복구, NPC vectorBuilds/fallbackPaints0.404는 자동3회 뒤 재오픈4번째 물리 요청에서 복구했고 timeout은 Chromium의 진행 중 URL 공유로 물리1회였다. 정상 ready NPC의 동일 draw120회 추가 paint/clear/request/decode0. [404 중립](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/404-neutral.jpg), [timeout 중립](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/404-neutral.jpg). [기존 주인공 ready/abort/timeout의120회 추가 repaint0](evidence/hero-lifetime.txt). 실패 중 NPC에120회를 반복한 검사와 구분한다.

## P0 통합 후 종합 확인

`66758d13`에서 최초 통합 검사를 통과한 뒤 유지되는 canvas의 추가 경계를 확인했다. 같은7장에서 실패한 덕수→정상 월이→이미 실패한 덕수로 돌아오면 직전 월이 픽셀이 남았다. 최초 진단은 장을 바꾸면서 dialogue owner 자체가 교체되어 이 경계를 재현하지 못했다. 동일 장·동일 owner의 실제 월이 rescue 행으로 수정하여66758d13 이전 구현의 잘못된 얼굴을 재현했다. 새 실패 인물로 전환할 때만 canvas를 한 번 비우는 최소 수정이36ddbdd8이다. 게임 내 월드 배우와 이름은 변경하지 않았다.

[수정 전 잘못 남은 월이](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/reuse-before.jpg)·[수정 후 중립 영역](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/reuse-after.jpg), [전후 alpha·실패120회·재오픈 복구](evidence/reuse.json), [결과](evidence/reuse-final.txt). 수정 후 실패한 동일 인물 draw120회 추가 paint/clear/request/decode0이며 복구된 실제 덕수 이미지도 확인했다.

최종 `36ddbdd8` 실행에서 NPC2종×4viewport=8화면, 정상 저장/reload/Continue, 쉼터, ready draw120회 추가 paint/clear/request/decode0을 다시 통과했다. [최종 실행 JSON](evidence/final-smoke.json), [stdout](evidence/smoke-final.txt). 최종 smoke는 cold2종·fault0이며 위 별도 retained-error 검사는 실제404를 사용한다. 최초32화면·3개 fault는 앞선 전체 실행 증거에 보존하고 최종 smoke가 모두 재실행했다고 쓰지 않는다. 초기667 smoke의 고정 stdout 문구 `cold8/fault/reopen`이 smoke 범위를 부정확하게 요약하던 것도 검사 출력만 수정해 실제 수량을 표시한다.

[통합390 덕수](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/integrated-390-worker_mature.jpg)·[가로 연실](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/integrated-844-yeonsil.jpg)·[320 덕수](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/320-worker_mature.jpg)·[PC 연실](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/1280-yeonsil.jpg)·[실제 쉼터 주막주인](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/npc-portraits-20261023/runtime/evidence/rest-pub-owner.jpg)을 직접 열어 확인했다. [4주인공 dialogue/bust/icon RGBA12조합 aa4 exact](evidence/hero-regression.json)는 최종36ddbdd8에서 다시 통과했다.

최종 빌드는66758d13에 위 한 줄의 cached-error clear를 적용한 작업트리에서 실행했고 그 소스/생성물을36ddbdd8에 커밋했다. [최종 공통 build](evidence/build-reuse-fix.txt), [최종 생성 해시·native 기본 진입·campaign input parity](evidence/web-split-reuse-fix.txt), [통합 때 발행 자산 보존 검사](evidence/retention-integrated.txt), 관련 JS/Python syntax가 통과했다. active graph363파일, `web/entries/game.b64b2ab51c7c3a21.js`, Playtest `game.4c8907aa77e8eaa7.html`, graph SHA256 `7f314d91b0ccb8a8020dcb8186f8fb5e2e688aaff5f51ec2c09c4d3b0351e782`다. [최종 빌드·보존·불변 경계](evidence/preservation-final.json).

부모가 P0 master에 등록한 실제 aa4 공개 graph354파일과 기존27개 발행 graph의 고유596파일은 모두 byte/SHA를 확인했다. aa4 발행 사실은 Pages39898027299 /2026-10-23T04:03:25Z이며 이 사실을 manifest/history fixture에 동일하게 보존했다. 이번 NPC 후보나 배포 진행 중 P0를 새 성공 발행으로 등록하지 않았다. 부모가 실제 배포 후 새 발행 사실을 기록한다.

## 한계와 남은 작업

원래 Library ZIP 전송은 정상1회+허용 재시도1회 모두 실패했고 우회하지 않았다. 이후 부모의 GitHub 전달로 해결됐다. 최초 저장 probe는 reload 때 fixture를 덮어쓴 도구 오류였으며 조건부 초기화 후 통과했다. 두 진단 실패를 생산 저장/권한 문제로 표현하지 않는다.

데스크톱 Chromium의 화면비/터치 모사 검사다. 물리 Android/Safari·전체캠페인·공개 Pages는 미실행이며 사용자 기기 문제를 재현했다고 주장하지 않는다. 종지기 새 설정/시안은 보류다. NPC 코드/에셋 연결에 남은 차단은 없고 부모의 최종 시각 검수와 master/Pages 순차 반영이 남았다.
