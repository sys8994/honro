# 승인 스킬 이미지 전용 표시와 로딩 복구

스킬 수정 **`ea936eff49710e8d220b627f193b982335719876`**, 목표 안내 행 수정 및 최종 실행/빌드 **`977eac64c38dc9e8c88a8bf1f0c64de2ec9142a1`**. 기준 master는 `5987f6db1a500f7a7911880e9b84578b9cf37cb8`이다. 최종 entry는 `web/entries/game.795c4f3ba61a14b1.js`, 직접 Playtest는 `web/entries/game.d57b1a9a6ab2de5a.html`, manifest SHA256 `31e64de1ea02fdef689bb62604708d7121bf57d82472aa76ab58763137f463ba`다. [소스·빌드·과거 자산 보존](evidence/preservation-final.json).

## 재현과 원인

5987의 보존된 공개 entry에서 실제 이미지 응답을 지연시키자 설오 절명 트리의 급소시/관통시/회기시/정심/절명시가 옛 SVG로 나타났다. markup이 항상 SVG를 포함하고 ready 때만 숨기는 구조였으므로 loading/error는 벡터를 표시했다. 원래 로더에는 timeout이 없었고, 세 번 실패한 cache와 재관찰되지 않는 retained error 노드는 복구가 막힐 수 있었다. 전역 이미지 파일 소실로 단정하지 않는다.

[실제 캠프 이전 벡터 / 지연 중 중립 / 완료 이미지](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/skill-image-only-20261023/evidence/camp-before-placeholder-ready.jpg) · [이전 실행](evidence/before.json). 첨부 `1000047863.jpg`는 정상 Library 전송 도구가 `download failed`를 반환해 로컬 파일이 생기지 않았다. HTTP 원인은 도구가 노출하지 않았다. 픽셀을 열거나 우회하지 않고, 부모가 확인한 설명과 생산 UI로 재현했다.

## 수정

84개 승인 기예의 생성 markup에는 SVG가 없고 고정 크기 중립 프레임과 img만 있다. loading/error/timeout 모두 벡터로 바꾸지 않는다. 원본 WebP·이름·효과·경지·저장 규칙은 유지했다.

전용 `REDESIGN_PATHS/GOURD/STAKE/skillPath`와 현재 참조가 없는 24개 path를 소스와 새 active graph에서 제거했다. 공용 직업·지도·아이템·조작 36기호와 crest는 이전 출력과 같다. 별도 standalone UI의 두 skill caller도 ID 경로로 바꿨다. 과거 스킬의 전투/저장 호환 정의와 비스킬 UI 기호는 삭제하지 않는다. [84 ID / 일반 기호 / active graph 검사](evidence/vector-removal-final.txt).

공유 cache 84개와 예약 작업 4개를 유지한다. 8초 timeout은 예약 슬롯을 반환하되 같은 이미지의 늦은 성공을 받을 listener를 유지한다. 따라서 timeout 중 실제 미완료 HTTP 수가 반드시 4개라는 뜻은 아니다. 연결된 화면의 오류는 750/1500ms 간격으로 최대 3회 자동 시도하고, 이후 재진입에서 다시 유한 시도한다. 재진입은 아직 pending인 옛 job을 정리하며, 분리된 노드의 구독·retry timer도 제거한다. 같은 asset은 cache를 공유하고 같은 skill의 DOM과 준비된 src를 유지한다. 프레임 루프는 추가하지 않았다.

## 확인

정상/slow/일시503/404 후 재진입/8초timeout 후 late success의 5조건 × 10소비 표본을 검사했다. 경로는 4인 캠프 tree·slot·passive, active/passive 상세, slot 목록, 허공터 picker, toolbar/HUD, 실제 HUD 클릭이다. 모든 상태에서 해당 skill subtree의 SVG는 0개였고 복구 후 실제 256px 이미지가 표시됐다.

| 조건 | 전체 asset 요청 | decode | 대상 복구 |
|---|---:|---:|---|
|정상 / slow|각84|각84|동일 요청 완료|
|일시503|89|84|5대상 각2회|
|404 → 재진입|99|84|5대상 각 자동3회 + 재진입1회|
|timeout → late success|84|84|A14 동일1요청의 늦은 완료|

최종 cache84/targets0이다. camp 20회 갱신·HUD 12회 실제 클릭에서 이미지 노드가 유지되고 추가 request/decode/srcWrites는 0이었다. 이는 브라우저 전체 paint/GPU/FPS 계측이 아니다. [5조건 50표본](evidence/after.json) · [timeout 중립](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/skill-image-only-20261023/evidence/timeout-placeholder.jpg) · [404 중립](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/skill-image-only-20261023/evidence/404-placeholder.jpg) · [84원본/이름·효과 보존](evidence/native.txt).

전체 fault matrix의 raw HEAD는5987+이 단위 작업 소스/빌드다. [실행 소스 해시](evidence/executed-source-sha256.json)가 최종 소스와 exact임을 확인했다. 최종977eac64에서는 별도로 실제 10소비 경로/반복 입력과 공통 Game·embedded·Workshop 연결을 확인했다. [최종 UI](evidence/final-smoke.json) · [공통 연결](evidence/web-final.txt) · [retention](evidence/retention-final.txt). 원래 SVG를 합격으로 보던 5개 browser 도구의 기대도 중립 계약으로 바꿨으나, 그 도구들의 무관한 전체 시나리오는 실행하지 않았다. 초기 probe의 준비 변수 참조·보류 route 종료 문제는 검사 도구에서 바로잡았다.

[목표 안내 행 수정과 64위치 검사](../reading-action-rows-20261023/README.md)는 독립 commit이다. 최종 소스에서 안내 8위치도 추가 확인했다. 과거 성공발행21개 graph의7435개 파일 hash를 보존했다. 5987의 Pages39883682247 success2026-10-23T01:25:17Z 및 부모 공개 캠프 드래그 확인을 등록했고 새 후보를 성공 발행으로 등록하지 않았다.

생산 순변경은 `icons.ts/main.ts`의 표시 코드, `skill-images.js/skill-icons.css`, `story.js/presentation.css` 여섯 파일이다. 5987 카드 drag·c8 초상화·d196 카메라·스테이지·미술·BGM·밸런스는 그대로다. 새 묵종/40%조건은 포함하지 않았다. master/Pages는 변경하지 않았다. Chromium headless/touch 모사이며 실기기/Safari·전체캠페인·원경 로더 개편은 미실행이다.
