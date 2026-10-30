# 현재 대사 최종 통합 · 2026-10-22

검사한 코드와 생성물은 **`be3cb71caf035b13138e0118efa8cac8594423f2`**다. 기준은 부모 원고 정렬 `5bac50f97c4d88036b31513a6f1d71d10a8ea0d6`, 포함한 최신 master는 **`63cc28113b36d2da92b9e1557de52620edb7db03`**다. 작업 브랜치는 `integration/narrative-final-current-release-20261022`다. master는 이 브랜치의 조상이므로 그 master에서 fast-forward할 수 있다. master/Pages 쓰기는 수행하지 않았다.

## 변경과 소유권

부모가 확정한 `shared/data/narrative-current.json`은 5bac 원본과 **byte-identical**이다. 새 대사·서술은 만들지 않았다. 최신 master의 기본 초상4종, 주민 identity/모바일 버튼, 12→13 복구, 11장 퀘스트, 방향 초기화·13장 경계·7일 발행 보호를 병합했다. 13장 저작기·renderer/portrait/party rig·11장 미술·units 생성기·BGM7곡 원본은 최신 master와 같다. main은 승인된 완료 요약 hook만 다르다.

11장 `HonroStage11Quest.content`가 별도 JSON에서 문장과 메타데이터를 재생성하던 경로만 정리했다. 현재 원고는 catalogue에서 복제하며 stable rowId/direction을 보존한다. 별도 runtime 정본 `shared/data/stage11-quest-story-20261022.json`과 global 로딩은 제거했다. 테스트는 부모 editorial draft와 승인 퀘스트 fixture를 기준으로 대조한다. `HonroStage11Quest`는 model/author의 **마지막 순서**를 유지하며 필수 resident 구조→자동 trace와 opt-in/구 저장 이행만 담당한다. 전투 중 `b.honroStory`의 원문·cursor를 다시 쓰지 않는다. Act2Plan의 동기 조회도 최종 stage 계약을 읽는다.

V0/split-v1/waterworks-v2, 저장 snapshot/queue, baked12/14, Workshop 사용자 원고는 기존 선택 경계를 유지한다. 한국어 검색에 의한 현재 표현 override나 새로운 wrapper chain은 추가하지 않았다.

## 실제 11장 UI

제목의 실제 여정 이어가기→쉼터 도착→실제 스테이지 진입 버튼으로 확인했다.

- 새 도착 **1행**이 쉼터에서 표시되고, 읽은 뒤 전투에서 중복되지 않는다. 구형 도착3행은 나오지 않는다.
- 전투 도입은 확정 구조 대사 **4행**이다. 기존 기술 안내 `주민 주변의 적 1명을 처치하세요` 1행이 뒤따라 UI 묶음은 **5행**이다. 새 서사를 추가한 것이 아니다.
- 도착 카메라는 설오, 소단/휘겸의 몸짓은 resident를 가리킨다. 네 entry rowId와 direction은 그대로다. 필수 단계는 resident/trace 두 개이며 trace는 자동이다.
- 20턴 진행 중 주민 대화 1/2를 Continue로 열어 원문·cursor를 보존했다. 실제 모바일 터치의 다음/스킵 뒤 trace checkpoint1회→정상 won→완료 visits1회로 이어졌다. 주민은 실제 rescue marker의 살아 있는 시민에 연결됐다.

390×844의 아래 사진 3장, 최신 초상/안전 퇴장/공허 사진 2장을 직접 열었다. 모두 1MB 미만이며 [소스/생성물/이미지 해시](SOURCE_AND_EVIDENCE.json)에 크기와 SHA-256을 기록했다.

- [11장 새 도착1행](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/narrative-final-current-release-20261022/stage11-arrival-390x844.jpg)
- [11장 구조 도입 · UI1/5](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/narrative-final-current-release-20261022/stage11-entry-390x844.jpg)
- [11장 20턴 저장 대화1/2](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/narrative-final-current-release-20261022/stage11-round20-Continue-390x844.jpg)
- [10장 실제 안전 퇴장 · UI1/16](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/narrative-final-current-release-20261022/stage10-safe-outro-390x844.jpg)
- [27장 무명 화자 · 긴 넷째 줄](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/narrative-final-current-release-20261022/stage27-void-390x844.jpg)

## 선별 검사

| 명령/검사 | 결과와 범위 |
|---|---|
| `narrative-catalogue-parity` | 현재30장 기준 계약+명시적인 승인11장 퀘스트 차이, legacy40 선택 일치. 기존 baseline fixture를 통째로 새 값으로 덮지 않았다. |
| `narrative-editorial-v2` | 부모 확정 원고190개 그룹, 30 effective snapshot/도입/요약·선택 대화, 문서/이름/목격 metadata, 실제6개 경로, Workshop 경계. |
| `stage11-quest-simplification` | 원본29장/물리 데이터, 최종 author 재실행, 구7/신6 단계의 중간 저장, 20턴 대화 Continue/export, 자연 완료/보상1회, 제외 경계. rowId/direction 보존도 검사. |
| `narrative-final-stage11-browser` | 실제 UI 새 도착1+구조4+기존 기술 안내1, 모바일 다음/스킵 hit/표시, 20턴 저장 대화→자연 trace/outcome. |
| `narrative-catalogue-save` / `narrative-integration-boundaries` | 현행/구 저장 Continue와 App import의 원문·cursor·vitals·쿨다운·목표, 동기 Act2 API·구 staging 선택. |
| `narrative-json-pool` / browser | 원본4개 global의 deep equality·객체 독립성, 실제 file input의 구12장 baked import/Continue 보존. |
| `narrative-safe-outro-browser` | 실제 출구→철수→won/worldOutro2→지면 위4인/카메라/16줄, cursor15 Continue·스킵→엔딩→쉼터→상세 보고서/정산1회. |
| `act3-void-runtime` / `narrative-voice-browser` | 27장5컷 수동 입력·스킵/복귀/저장, 실제390×844/1280×900의 대표18항목. 긴 대사와 actor bounds 교집합0. |
| `story-portrait-identity` / `npc-dialogue-binding` | 기본4인·NPC8종/실제 배우 identity와 fallback, 11장 marker 기반 주민·없는/죽은/비시민/사용자 맵 제외. 수동 VM fixture에 명시 compat 의존만 보완. |
| `stage12-next-load-browser` | 934 열린 구 클라이언트에서 실패/재시도 후 현재 자료로 같은 탭13장 진입 A/B, 완료 저장 Continue A/B. XP/클리어/보고서 보존·12장 visits1·pageerror0. |
| build / typecheck / `web-split` | Game/Workshop 정상 빌드, native↔external354파일/30장/855 library·hash/bytes·동기 API·embedded 저장 보호. |
| `web-build-retention` | 최근7일+최신2 최소·독립 중간build2·가짜 시계 만료·메타데이터 fail-closed·원본검사/복원·실패 시 무변경. |

검사 로그와 전체 수치/추적 JSON은 `_local/reports/narrative-final-current/`, `_local/reports/stage11-quest-simplification/`, `_local/reports/narrative-voice-v2-integration/`, `_local/reports/stage12-next-load-hotfix/` 및 해당 `/tmp/narrative-final-*.log`에 둔다. 선택 검사에 남은 실패는 없다. 초기 수동 VM fixture의 누락 의존과 UI fixture의 기술 안내 행/기존 입력 유예는 실제 API 계약에 맞춰 검사했고 프로덕션 코드를 바꾸지 않았다.

## 초기 JS/JSON과 발행 보호

AA76의 무손실 pool/로드 복원을 유지했다. 새 Chromium context·cache disabled·비압축 로컬 HTTP·제목 ready+400ms·입력 전의 동일 조건으로 AA76 생성물과 현재 생성물을 직접 비교했다.

| 초기 JS/JSON | AA76 | 최종 |
|---|---:|---:|
| 요청 | 72 | **72** |
| encoded body bytes | 4,402,944 | **4,417,039** |
| transfer bytes | 4,424,544 | **4,438,639** |
| 동일 URL 중복 | 0 | 0 |

현재 master UI/퀘스트를 합친 뒤 AA76 대비 **14,095B**가 추가됐다. 최초 기준4,185,192B 대비 **231,847B(+5.54%)**가 남는다. 78요청/4,946,860B였던 최초 서사 통합으로 되돌아가지 않았다. 원래보다 빨라졌다는 결과가 아니며 실제 Pages 압축량·레이턴시·FPS는 측정하지 않았다. 배포 pool JSON은398,000B이고 API는 동기 소비를 유지한다.

부모가 Pages **39812829113 success**를16:21UTC에 확인한 뒤에만63cc를 등록했다. 정확한 완료 시각을 추측하지 않고 `2026-10-22` 날짜 정밀도·발행 순번7과 성공 근거를 사용했다. 현재 fixture는 확인된7회 발행이며 동일 그래프를 합친5개 그래프는63cc/fe6911/a23/989/934다. `retain-published-web --history tests/fixtures/published-web-history-20261022.json`과 정상 재빌드 뒤에도 최신 master에 추적된 **웹468파일 중 manifest 외467개 원본**이 모두 byte-identical이고 삭제0이다. 기존 manifest 밖의 역사 immutable 파일도 그대로 보존했으며 활성 로딩 목록에 추가하지 않았다. 발행의 최근7일+최신2 최소와 중간build2 정책을 바꾸지 않았다.

이 브랜치/BE3를 실제 발행으로 등록하지 않았다. 배포 후 성공 확인·등록은 부모의 [현재 발행 지침](../../RELEASE_OPERATION_GUARD.md)에 따른다.

## 한계와 인계

11장 이전10장과 여섯 방어 라운드를 새로 완주하지 않았다. 20턴/후반 목표/목격 플래그는 명시된 fixture이며 실제 UI와 정상 전환 API를 검사한 범위다. 전30장 실화면 순회·전체 전투/미술/스킬 회귀·실물 모바일·Pages 새 대사 검수는 하지 않았다. 공유 미술·장르·서사를 새로 설계하지 않았다.

차단 사항은 없다. master63cc에서 fast-forward할 수 있는 검수 브랜치와 생성물을 부모에게 인계한다. 최종 master 반영·새 Pages 발행/공개 UI 확인은 부모 담당이다.
