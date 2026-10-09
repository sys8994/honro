# 잠운사 재저작의 정확 역사 계약

16장 잠운사 재저작은 39fa80735eb2a2ad5b5d282b0e56bac52ae50c8b를 비교 경계로 삼는다. 새 지형·미술·편성의 검사는 현재 맵에서 하고, 이전 공간·서사·전투 회귀는 새 16장 변경을 정확히 검증한 뒤 그 변경만 되돌린 프로젝트에서 계속한다. 기존 17장 공사장과 11장 협곡의 고정 기준은 바꾸지 않는다.

## 고정 입력과 명시적 변경

- `tests/fixtures/stage16-temple-before.json`은 재저작 이전 16장 전체, 나머지 29장 SHA-256, 기존 Library 전체 SHA-256와 529개 ID 순서, 원본 커밋을 보존한다. 다시 생성하거나 덮어쓰지 않는다.
- `stage16-temple-capture-history.mjs`는 검토가 끝난 소스에서만 `stage16-temple-history-delta.json`을 한 번 생성한다. 이미 존재하는 출력은 덮어쓰지 않는다. 검토 중 임시 캡처는 `--output=_local/...`로만 허용한다.
- delta에는 16장 필드별 정확한 before/after와 존재 여부, 전체 프로젝트/맵/Library hash, 추가된 `stage16:temple-*` 에셋의 전체 값과 순서, 실제 runtime content·plan·balance·semantic content·unit contract를 기록한다.
- 캡처는 변경된 16장과 추가 art를 되돌린 프로젝트가 원래 39fa807의 전체 hash와 같은지 검증한다. 다른 29장, 기존 art의 값·순서, 다른 장의 runtime content·plan·balance, 전역 balance, 기존 임무 단계와 총 전투/완료 XP 계약도 유지해야 한다.

## 역투영 순서

현재 잠운사 → 39fa807의 16장 → 기존 공사장 역사 경계 → 기존 협곡 완료/마무리/초기 역사 경계 → 더 오래된 역사 계약 순서다. 각 단계는 자기 경계의 정확한 값만 인정한다. 범주를 삭제하거나 승인된 것처럼 넓은 ID 범위를 제외하지 않는다.

`stage16-temple-history-helpers.mjs`는 다음을 제공한다.

- 전체 30장 및 Act 1/2 20장 scope에서 정확한 membership·순서·다른 장 hash·Library 값과 순서 검증
- 새 16장의 모든 필드와 추가 art를 확인한 뒤 원본 필드와 키 순서를 복원하는 순수/idempotent 프로젝트 역투영
- 편성, 의미 계약, 원본 전체 plan과 16장 budget의 독립적인 정확 역투영
- 과거 runtime 검사용 wrapper: project·content·plan·balance를 함께 되돌리며 검사 실패 때도 원래 객체 참조를 복원

기존 17장 helper는 16장 역투영을 최외곽에 적용한다. 11장 helper는 원래의 17장 경로를 그대로 거쳐 모든 후대 변경을 검증한다. 17/11/이전 시대의 golden을 새 16장 데이터로 바꾸지 않는다.

## 실행과 해석

```sh
# 지형·미술·runtime 수치를 검토하고 해당 소스를 커밋한 뒤 한 번만 실행한다.
HONRO_CAPTURE_APPROVED_STAGE16=1 node tests/stage16-temple-capture-history.mjs
node tests/stage16-temple-history.mjs
node tests/stage17-worksite-history.mjs
node tests/stage11-ravine-completion-history.mjs
node tests/stage11-ravine-finish-history.mjs
node tests/stage11-ravine-history.mjs
node tests/act2-spatial-contracts.mjs
```

역사 검사는 변조된 지형·임무·편성·plan·budget·기존/추가 artwork·중복/누락·순서 변경이 거부되는지 확인한다. 이것은 새 16장의 동선 통과, 일반 전투 승리, 시각 검수나 실배포 검증을 대신하지 않는다. 현재 동선·일반 전투는 `stage16-temple-*` 전용 검사와 실제 Game/Stage View/Playtest에서 별도로 검증한다.

## 2026-10-09 고정 경계와 검증

검토된 제작 소스 `4d17a3162534aad66d4172197c8087c619dd5605`에서 delta를 고정했다. 16장 92개 JSON 필드경로와 충돌이 없는 전용 에셋 10개만 추가/변경한다. 새 맵 SHA-256은 `d953041ac404e375c59ff94804f9f36d9c9f3d9613eab6ac2d5fd2e431781815`, 전체 프로젝트는 `71c1d14ab1bbb205d2e77929d30719fc298c23acc953c82dccb871f7219e0bdb`다. 정확 역투영 후 전체 프로젝트는 원래 `d15ce27ee71c26643c76c207cc712a75c429cc7a860d510a389ecf83ccf0e09b`로 돌아간다.

- 새 16장 exact-history와 원래 17장/11장 history, `test:stage17-worksite`와 `test:stage11-ravine` aggregate가 통과했다. 17장 runtime/author/fixture는 바꾸지 않았으며, 후대 16장을 정확히 되돌린 검사용 경계에서 17장의 원래 전체 Library 순서 계약을 유지했다.
- Act2 의미/저장 13개 계약, route mode 변조 검사, canonical recipe 및 revision 82개 검사가 통과했다.
- ACT1/2·forest/cavern·cavern expansion·open structure·guardian scene·vertical/hidden waterworks·staging·granite 역사 9개, migration, cavern rear/library/contracts/player-walk/layers/shots가 통과했다.
- 이전 cavern 14/16의 모든 도보·도약·사격·mission/roster/art 계약은 정확 pre-temple runtime에서 실행한다. 현재 16장의 물리/전술은 별도 최신 16장 suite에서 검사한다.
- D의 축약 mutation fixture에는 정확한 옛 16/17장 레코드를 남겨 D의 기존 381개 flag/binding/duplicate 검사가 실제로 실행되도록 했다. Granite의 의도적 옛 collider/placement/metadata/art 변조는 새16/17/11 경계를 검증한 뒤 주입해 원래 `mapRules` 불일치 assertion을 유지했다.
- 최초 사찰 재저작 단계의 `git diff 39fa807 -- tests/fixtures`에는 새16 before/delta 두 파일의 추가만 있다. 기존 golden 수정, 비교 범주 제외, 무조건 통과하는 예외는 없다.

이 검증은 Node 역사·회귀·분리된 물리 계약의 결과다. 일반 전투 난이도, 브라우저 입력/성능, 최종 미술 승인 또는 Pages 배포 검증을 의미하지 않는다.

옛 `act2-spirit-encounter`의 고정 편성 count는 정확 16→17 역투영 이후 계산한다. 원래 16장 영혼 6명·17장 5명을 그대로 요구하며, 현재 새 편성의 8명/8명은 각각 전용 최신 편성·unit-contract 검사에서 대조한다. 첫 영혼 조우 안내, O08 설명, 실제 dialogue/save/resume 검사는 투영하지 않은 현재 runtime에서 통과했다. 전체 `test:act2:offline`의 선행 17/11 aggregates·공간/임무/선택 경로/진행/40체형 traversal이 통과한 후 마지막 count 경계만 위와 같이 정비했다.

`test:story-canon`도 통과했다. `story-canon-reviewed-history-helpers.mjs`는 기존 고정구만 사용해 11/16/17의 명시된 content·plan·geometry 경계를 검증한 다음 옛 gameplay hash로 되돌린다. 원래 스토리 golden, 실제 현재 대사·scene/event ID·rest·스포일러 assertion을 유지하며 추가 18개 변조 입력도 거부한다. 8개 데이터 계약과 17개 production App 저장/재개 사례가 통과했으며, 저장 검사는 DOM/storage 대역 기반이고 브라우저 UI 검증은 아니다.

2026-10-09 05:17 UTC, 석불 미술 추가 전 제작 소스에서 `npm run test:act2:offline` 전체를 처음부터 다시 실행해 exit 0으로 완료했다. 새 `test:stage16-temple`, 17/11 전체 suites, Act2 의미/공간/재생성/방어/지형/선택 경로/순차 진행, 10장×4체형 traversal, 마지막 영혼 조우·저장 검사가 모두 통과했다. 재현 로그는 `_local/reports/stage16-history/act2-offline-final.log`이며, 이후 추가되는 석불 미술은 이 결과와 분리해 정확한 후속 art-only 경계에서 검증한다.

## 석불 1차 미술의 별도 정확 층

`dbef41ce1eefc897afcf17ee0ed2a17ce27aebf9`의 석불 미술은 `stage16-temple-buddha-art-delta.json`으로 따로 고정한다. 비교 원본은 `09cf792d82f9576fbd18e8539897e44e27e51ab8`이며 원래 92개 JSON 필드경로/10-asset delta와 이전 golden은 수정하지 않는다. 새 최외곽 층은 collision이 없는 석불 asset 1개와 L1-back element 1개만 제거해 원래 전체 프로젝트를 정확 복원한다. 기존 539 assets의 전체 값·순서, 다른 29장, 16장의 모든 비-element 필드는 동일하다.

전용 검사에서 19개 변조/누락 guard, full/Act12 순수·반복 역투영, 실제 compiled battle의 terrain·units·markers·events·initialState·보호 NPC·규칙·성장 불변을 확인했다. 미술 뒤의 gameplay project/runtime fingerprint도 추가 전 47라운드 완주와 같다. 이는 전투구조 동일성 증거이며 석불 추가 뒤에 전투를 다시 47라운드 수행한 결과가 아니다.

`stage16-temple-buddha-continue.mjs`의 기본 실행은 외부 파일 없이 옛 미술의 저장을 재구성해 production App Continue로 검증한다(41 actors, 43개 완전한 gameplay/map 필드). `HONRO_STAGE16_BUDDHA_CONTINUE=<checkpoint.json>`을 명시하면 실제 추가 전 R47 저장도 검사한다. 실제 `_local/reports/stage16-temple/fullplay-4d17-final-fresh/checkpoint.json`에서 51 actors와 43개 필드가 모두 동일하게 복원됐고, 새 미술이 옛 전장 snapshot을 덮어쓰지 않았다. 봇 runner의 fingerprint 제한을 해제하거나 새 전투로 교체하지 않았다. 실제 결과는 `_local/reports/stage16-temple/buddha/actual-r47-continue.json`, 재구성 가능한 계약 결과는 `portable-continue.json`이다.

1차 석불 추가 뒤의 선택 재검사도 통과했다: 새 art-only/Continue, 기존16·17·11 completion/finish/history, Act2 13개 의미/저장 계약, story 8개 계약, migration 1–10장. 로그는 `_local/reports/stage16-history/post-buddha-*.log`다. 약 10분짜리 전체 offline 검사는 앞서 석불 추가 전 exit 0 결과이며, 이 미술 추가 후에는 위 선택 검사와 정확 전투/저장 불변 검증만 수행했다.

## 석불 2차 얼굴·체형 수정의 정확 층

제작 소스 `e5fdd3751df64301f40d9576d38600f4bb1f6d63`의 수정은 별도 `stage16-temple-buddha-refinement-delta.json`에 고정했다. 원본은 1차 미술 `dbef41c`이며, 새 전체 프로젝트 SHA-256은 `3c42a9b65a4841617813028c245aa81f0dcf3a5bd684f4a0d8091980cf669089`다. 동일 ID의 충돌 없는 석불 asset 값 하나만 before/after로 대조한다. 30장 전체 JSON, 석불 element의 위치·scale·순서, 나머지 539개 asset 전체 값·순서는 그대로다. 새 최외곽 역투영 뒤에 1차 미술, 원래 16장, 17장, 11장 순서로 기존 정확 경계를 통과하며 앞선 모든 fixture는 수정하지 않는다.

전용 refinement 검사는 full/Act12의 순수·반복 역투영, 17개 변조 거부, 실제 compiled battle의 지형·편성·markers·events·initialState·보호 NPC·규칙·성장과 두 gameplay fingerprint의 동일성을 확인했다. 최초 불상 이전의 재구성 가능 저장(41 actors)과 실제 R47 저장(51 actors)을 production App Continue로 열어 43개 gameplay/map 필드의 정확 복원을 다시 확인했다. 보고서는 `buddha/refinement-portable-continue.json`과 `buddha/refinement-actual-r47-continue.json`이다. 이 저장에는 석불 element가 없으므로 추가되지 않은 상태를 유지한다. 같은 asset ID의 옛 렌더링 모양 자체가 보존된다는 검사는 아니며, 47라운드 전투를 다시 수행한 결과도 아니다.

2차 수정 뒤 새 refinement, 기존 1차 미술 exact-history, 기존 16장 exact-history, 위 두 Continue만 재검사해 모두 통과했다. 로그는 `_local/reports/stage16-history/post-buddha-refinement-*.log`다. 전체 offline는 석불 추가 전의 exit 0 결과를 유지하며 이번 asset-only 수정 뒤에 다시 실행하지 않았다.

최종 현재 범위에서39fa807 대비 추가된 fixture는 사찰 before/delta와 석불1차/2차 delta의4개다. 원래 모든 golden 및 먼저 고정한 사찰/1차석불 fixture의 수정은 없다.
