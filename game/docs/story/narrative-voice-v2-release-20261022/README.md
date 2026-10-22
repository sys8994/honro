# 대사 v2 통합 · 초기 필수 데이터 보완 — 2026-10-22

부모 검토용 `integration/narrative-voice-v2-release-20261022`다. master/Pages는 직접 변경하지 않았다. **초기 전송량 증가를 18.2%→5.2%로 줄였으며, 잔여 증가를 숨기거나 완전히 제거했다고 보고하지 않는다.**

## 정확한 소스와 빌드

- 검토 입력 `caaa25e204a44a122cbf9e3d565cdfb9ab8cc48f`, 대사 통합/초기 증가 확인 `2633e2b4`, 배포 데이터 보완 `aabab09d`.
- 승인된 최신 master13 `c5b51319ef887943726434d84db596f07254bbd3`를 보존한 최종 **코드·생성물 `aa76d27cf6587a2e70091777699505ba9ffc0a38`**. 생성 HTML/web/도감은 충돌한 어느 쪽을 복사하지 않고 통합 소스에서 정상 재빌드했다. 이후 변경은 문서뿐이다.
- 현재 원고 SHA256 `2a6e97153c37b3f6e6be5e10417b8344ec3899d280ec390d5082e80464bed2bd`. current/compat/stage-contracts 원본 JSON은 부모 입력과 byte 단위 일치한다. 원고를 새로 쓰거나 호환 자료를 삭제하지 않았다.
- 최종 manifest SHA256 `01a7af2997a7e9674dfb59095b091995b71ba69d7d68174866f12144577f5256`.
- Game HTML SHA256 `19bcae30149920c6f373c027b268a2c222da458883a5b3d4893657f952f8c07e`.
- Workshop HTML SHA256 `6f1f40a04318c0fc53ecb3508599cd03379c97904d6fef3b3ce29cb5f6d3bbe9`.

검사는 merge 중 작업 트리에서 실행했고 보고서의 manifest와 위 커밋의 실제 파일 hash가 일치한다. 기존 부모 원고/안전 퇴장 인계는 [caaa25e2 당시 보고서](https://github.com/sys8994/honro/blob/caaa25e2/game/docs/story/voice-v2-editorial/INTEGRATION_REPORT.md)와 구분한다.

## 작은 보완을 선택한 이유와 범위

`story-content-v1`은 story 도입·퇴장·이벤트를 시작 시 const로 잡고, objective/canon/18장/연출 모듈도 compat 정의를 시작 시 동기 참조한다. content/base와 native/map author 역시 동기 경계를 사용한다. Continue/import에서만 전체 compat를 불러오게 하려면 이 초기 의존과 API 경계들을 함께 바꿔야 하므로 이번 작은 보완에서는 그렇게 하지 않았다.

대신 배포용 네 JSON(waterworks-v2/current/compat/stage-contracts)만 **같은 하위 객체·문자열을 참조하는 JSON pool 한 파일**로 만든다. 표준 원본은 그대로다. 브라우저는 이미 필수였던 waterworks 데이터 경계에서 복원하고 기존 네 global에 일반 JSON 객체를 넣는다. 새 동기 resolver API를 비동기로 바꾸지 않았고, 추가 request barrier나 dependency/gzip 라이브러리를 도입하지 않았다. 동일 데이터의 fetch cache와 원래 asset hydration도 유지한다.

`shared/json-pool.mjs`는 build용 encoder/복원기를 정의하며 복원 함수만 기존 web-loader에 포함한다. **복원 때 객체를 occurrence마다 새로 만들어** 독립적이던 원래 JSON 객체에 alias가 생기지 않는다. current/legacy 전체 deep equality, 음수/0/boolean/null/배열/리터럴 형식/잘못된 순환 참조와 객체 독립성을 검사했다. 실제 배포 loader로 복원한 네 global도 원본 JSON과 모두 같다. 최종 배포 packet은 **397,598B**다.

## 같은 cold 시작의 요청·바이트

새 Chromium context/캐시 disabled, 로컬 비압축 HTTP, 타이틀 ready+400ms·입력 전의 JS/JSON만 비교했다. 원래 master934와 최신 master-c5는 이 시작 조건에서 동일한 값이었다. c5 baseline은 해당 커밋의 정상 생성물을 별도 정적 root에 그대로 펼쳐 사용했으며 새 Codex 세션을 만들지 않았다.

| 시작 JS/JSON | master-c5 | 첫 서사 통합 | 최종 pool 통합 |
|---|---:|---:|---:|
| 요청 수 | 73 | 78 | **72** |
| encoded body bytes | 4,185,192 | 4,946,860 | **4,402,944** |
| transfer bytes | 4,207,092 | 4,970,260 | **4,424,544** |

동일 URL 중복 요청은 0개다. 추가 요청은 없어졌고, 기존 증가분761,668B 중 **543,916B(71.4%)**를 제거했다. 그래도 기준 대비 **217,752B(+5.2%)**가 남는다. 서로 다른 현재/호환 원문까지 지우지 않고 동일 객체·문자열의 중복만 줄인 결과다. 완전한 title 지연 제거·실제 Pages 압축 전송량/지연·동적 FPS 개선을 측정했다고 주장하지 않는다. 더 큰 lazy 경계 재설계는 이번 범위에 포함하지 않는다.

## 다시 통과한 검사

- `narrative-json-pool` 및 실제 `narrative-json-pool-browser`: 전체 원본 deep equality/객체 독립성, 실제 네 global 복원, **옛 12장 baked 저장을 실제 file input으로 import/Continue**해 원문·cursor·HP/MP·쿨다운·quest marker 보존.
- `narrative-catalogue-parity`: 30 current 비서사 계약·guide/goal, **40 legacy** V0/revision1/stored/12·14 baked/25·27 split 및 물길 선택, 저장 원본 불변.
- `narrative-editorial-v2`: 부모 원고190개 대조 그룹, 30 snapshot/도입/요약·문서/이름/목격 gates, 6개 실제 A/B 경로·Workshop 경계. `narrative-integration-boundaries`: Act2 API·구 staging.
- `narrative-catalogue-save`: 현행/구 저장 모두 Continue **및 실제 App import handler** 후 원문·cursor·vitals/쿨다운·quest marker. `narrative-row-metadata`: 30장111행의 문구와 독립된 연출/카메라·전투/퀘스트/자원 불변.
- **수정한 story-direction 9개 case 전부 통과**. 대응은 아래 표를 따른다. `act3-void-runtime`도 통과.
- 실제 Chromium `narrative-safe-outro-browser`: 10장 정상 supported exit→withdrawal→won/worldOutro2, 지형 위4인/16줄·마지막 cursor15 Continue·동결·엔딩/쉼터/보고서 정산1회. 여섯 방어 라운드 완료 상태는 fixture다.
- 실제 `narrative-voice-browser`: 좁은390×844/1280×900의18개 확인, 27장5컷/긴 줄·배우 겹침0·skip 후3줄 복귀. 페이지 오류0.
- `stage13-vector-art`: 승인 shape4/Library4옵트인·충돌/퀘스트/다른29장 보존·재현/멱등·prepare 캐시/무효화. 검사의 main 보호에는 **승인된 catalogue 요약 한 줄만** 예외로 허용하고 나머지 바이트를 그대로 비교했다.
- build·typecheck·도감 재생성·web-split: **350개 파일·30장·855 library**, native/웹 재조립·hash/byte·embedded 저장 보호/Workshop 연결. 초기 실패였던 옛 문구 검사를 현재 원고에 맞춰 바꿨으며 최종 선택 검사에 남은 실패는 없다.

| 기존 story-direction case | 현재 의미 있는 대응 |
|---|---|
| 1: 모든 옛 문구가 current에 존재 | current row ID·action shape/duration/target와 4/11/15장의 고정 의미 row ID 검증. 새 metadata111행 검사는 텍스트를 빈 fixture로 바꿔도 binding/자원 불변을 추가로 담당한다. |
| 2: 30장 실제 연출 실행 | 그대로 유지. metadata 순수 binding 검사가 덮지 않는 실제 tick·완료·pose 정리·입력/기록을 확인한다. |
| 3: 숨은 배우/입장 | actor boundary·한 번 reveal·정확한 current cast 입장 끝점·휘겸/춘례 좌표 유지. 옛 추가24px cue의3178을 무조건 기대하지 않고 현재 authored entrance를 검사한다. |
| 4/5: 이동 겹침·저장·느린 이동 | 옛 한국어 검색만 `11.story:add0dc3ef3`으로 교체.22px/850ms 이동·history freeze·origin/cue 저장·다음 gesture 대기 assertion은 유지했다. |
| 6: unread event와 outcome 합류 | `15.beats.groove:6fe593174c` row ID로 바꾸고 storyId·cue index·inspect 동작을 그대로 검증한다. |
| 7/8/9: skip, 막힌/죽은/없는 배우, old/custom, first spirit | 기존 입력/배우/자원/실제 적 포커스/스킬 비시전 검사를 그대로 유지했다. assertion을 단순 삭제하지 않았다. |

상세 결과는 `_local/reports/narrative-voice-v2-integration/`의 `final-*` 로그/JSON과 기존 network baseline 파일에만 둔다. 명령은 위 이름의 `node tests/*.mjs`, 타입/build/web-split 및 세 narrative browser 스크립트다. 원본 전체 계측/정상 전투 완주/실기기 성능 검사를 새로 수행하지 않았다.

## 보존과 다음 합류 경계

13장 campaign/stoneFinish 저작 소스는 **c5b51319와 byte 단위 일치**하며 shared/build의 마지막 finish 재적용을 보존했다. chapter13의 현재 원문은 narrative-current를 유지한다. renderer/party-rig/portraits/HUD 캐시·paused dirty/occlusion·BGM7곡·11장 승인 미술을 덮지 않았고 다른 초상화 작업은 미포함이다.

별도 진행 중인 `fix/stage11-quest-simplification-20261022`는 아직 합치지 않았다. 이후 합류할 때 fresh stage-contracts뿐 아니라 compat/진행 중 Continue에도11장 새 기계 조건이 적용되는지 함께 확인해야 한다. 이 작업에서 임의의 새11장 원고나 단순화 코드를 만들지 않았다.

대표 JPG: [새 대사](https://github.com/sys8994/honro/blob/aa76d27cf6587a2e70091777699505ba9ffc0a38/review/narrative-voice-v2-release-20261022/stage2-name-390x844.jpg) · [10장 실제 안전 퇴장](https://github.com/sys8994/honro/blob/aa76d27cf6587a2e70091777699505ba9ffc0a38/review/narrative-voice-v2-release-20261022/stage10-safe-outro-390x844.jpg) · [27장 공허](https://github.com/sys8994/honro/blob/aa76d27cf6587a2e70091777699505ba9ffc0a38/review/narrative-voice-v2-release-20261022/stage27-void-390x844.jpg). 최종 pool/13장 통합 후 다시 촬영한 선택 화면이다. master 반영과 Pages 확인은 부모가 별도로 수행한다.
