# P0.1 캠페인 저장 보호

기준 master `7cab23ef7bf18920c629ab419691caee154d8c71`. 첫 소스 보존은 `1e216fdc7703b396cfe0b812107a0bbef55d094c`이며 최종 후보는 `refactor/profile-store-p01-20261024` 브랜치다. master/Pages 반영은 부모가 담당한다. P0.2 이후는 착수하지 않았다.

잠재 원인은 `load()`가 읽기/JSON/형식/버전/이관 실패를 모두 `fresh()`로 감추고 이후 persist/직접 debug 설정 저장이 같은 KEY를 쓰는 구조였다. 실제 사용자 데이터 손실 신고나 원본 저장을 재현한 것은 아니다.

## 구현 경계

- `profile-store.js`만 캠페인 KEY의 읽기/쓰기·실패 잠금·읽어둔 원문을 소유한다. 저장 없음은 정상 시작이고 read/parse/format/version/migration 실패를 구별해 잠근다. 정상 ready/absent의 write 실패는 false를 반환하고 잠그지 않는다. 읽기에 실패한 fresh는 제목 UI용이며 자동 저장·일반 캠페인 진입·직접 debug 환경설정 저장을 차단한다.
- 정상 load와 import의 이관은 `migrate()` 한 함수다. fresh 병합→schema4/settings 병합→migrateSkills→migrateGrowth→CampaignMapRevision.discard→repairRecruits→reconcileCampAllocations 순서를 보존했다. Import 교체 직전의 party=recruited 정규화도 기존 persist 동작대로 유지한다.
- 원문은 DOM/알림/로그에 출력하지 않는다. 명시 원본 내보내기는 JSON 재직렬화 없이 읽은 문자열 그대로 다운로드한다. getItem 실패로 읽은 원문이 없으면 버튼을 비활성화하고 이유를 표시한다. 새 백업 키는 없다.
- 다시 읽기는 정상 이관이 가능한 후보를 준비할 뿐 잠금을 풀지 않는다. 읽은 기록을 가져오겠다는 확인과 저장 쓰기 성공 후에만 교체한다. 확인 취소는 잠금/원문을 유지한다. 파일 가져오기/새 여정도 쓰기 성공 전에는 기존 프로필/전투/custom 소유자를 교체하지 않는다. 실패한 새 여정/재시도 확인은 복구 또는 기록 메뉴로 돌아가 다시 선택할 수 있다.
- 설정 변경은 실패 중 세션 안에서만 반영된다. 닫기/취소/새로고침도 원문을 쓰지 않는다. 정상 ready/absent 세션의 일시적 quota 실패는 원문과 유효한 메모리 진행을 유지하며 잠금을 만들지 않는다. 최신 profile/전투 내보내기와 일반 진입이 계속 가능하고, 용량이 회복되면 후속 persist가 다시 성공한다. 이미 읽기 실패로 잠긴 세션의 교체 쓰기 실패는 잠금을 유지한다. 비동기 import는 더 늦게 확정된 새 세션을 덮지 않게 요청 순서를 확인한다.
- debug 직접 쓰기 실패도 잠금을 만들지 않으며 기존 import/newgame 교체 금지를 그대로 유지한다. 불필요했던 debug 잠금 예외 복구 분기는 제거했다. debug는 정상 기록의 독립 사본, custom은 기존 반환 소유자, embedded는 캠페인 저장 무접근을 유지한다. `shared/web-loader.js`의 기존 읽기 전용 시작 장 힌트는 이관/저장/복구의 소유자가 아니며 건드리지 않았다. 이 힌트가 실패해도 이후 profile-store의 잠금을 우회할 수 없다.

## 실행한 관련 검사

| 검사 | 결과와 범위 |
| --- | --- |
| `node tests/profile-store-p01.mjs` | 11묶음 통과. 없는/빈/invalid JSON/null/배열/형식/unknown schema, schema1–4 × revision10/12/13의 load 및 import와 기준 load 결과 동치, 구 지도 revision 폐기, 각 이관 단계 강제 throw, getItem throw, quota, 원문/상태 보존, 재시도/취소/명시 교체, 직접 save와 App persist/일반 진입 차단, debug/embedded/custom 격리. VM DOM/storage 대역이며 실제 브라우저 증거와 구분한다. |
| `python tools/testing/profile-store-p01-browser.py` | 새 Chromium390×844 touch 컨텍스트의 실제 클릭/파일 선택/다운로드. 기존 일반/복구 UI9묶음은 재사용하고, 최종 후보에서는 quota 관련 UI3묶음만 검사했다(총12묶음·pageerror0). 원문 byte 일치 다운로드, 실패 중 설정/닫기/새로고침/재시도/확인 취소, invalid import, quota import/newgame 실패 후 재선택, 유효 import/명시 newgame, read throw 시 export 불가와 확인한 재시도 복구, version/format/migration 실패, schema4/1 정상13장 Continue와 설정 저장, 일반 전투에서 실제 방어 후 quota로 저장 실패→기존 문자열 보존/메모리와 다운로드에 행동 완료 유지→용량 회복 후 설정 persist 성공, debug 독립 설정/일반 minimap 저장/최신 정상 export 및 quota 후 저장 재시도, 저장 없는 일반 시작. 원래 App.frame/rAF를 계속 실행했다. 최초 전체 UI는 game.386ec8008f8f198c.js에서 통과했고, 마지막 교정에서는 정상 quota 잠금과 debug 예외를 제거하고 최종 entry의 quota 관련 회귀만 실행했다(`--quota-only`, report의 retainedPrefixEntry로 구별). 무관한 긴 UI 경로를 반복하지 않았다. |
| `node tests/settings-menu.mjs` | 기존 설정 계층/일시정지/확인/취소/invalid import/debug 내보내기 경계 통과. |
| `node tests/custom-map-return-profile.mjs` | 기존18그룹 중16통과. 아래 두 검사 대역 실패는 기준7cab 코드로 직접 대조해 동일함을 확인했으며 범위 밖 수리를 하지 않았다. 확인 없이 실행되던 옛 confirm-newgame 테스트 경로만 명시 확인을 거치도록 갱신했다. |
| `npm run build`, `node tests/web-split.mjs` | 통과. 활성414파일 hash/bytes, Native Game/embedded title·embedded 저장 격리, direct Workshop iframe. 전30장 플레이 순회가 아니다. |
| `node tests/profile-store-p01-preservation.mjs` | 기준 master 활성414와 기존35개 발행 그래프의767파일 bytes/SHA256, 발행 메타데이터 정확 보존. engine/assets/map/data/CSS/22장 판정·가이드/audio/VFX 소스는 기준과 동일. bow v4 활성 MP3/오디오 JSON 해시도 기준과 동일. |

기존 custom 검사 한계는 (1) fresh 재로드에 honroBattle:null/upgradeNotice:false가 추가된다는 낡은 기대값이며 기준 load도 이를 추가하지 않고, (2) training의 DOM 대역이 HonroPortraits.markup을 제공하지 않아 발생하는 `markup is not a function`이다. 기준7cab App에서 같은 결과를 따로 확인했다. 실제 게임 새 여정/Continue는 위 브라우저 검사에서 통과했다. 이 둘을 통과라고 기록하지 않는다.

## 부모 검토 후 최소 교정

최초 후보는 정상 쓰기 실패까지 보호 잠금으로 확대해 유효한 메모리 진행 내보내기와 저장 재시도를 막을 수 있었다. 부모 지적에 따라 잠금은 읽기/파싱/형식/지원 버전/이관 실패에만 적용했다. store.save의 catch는 false만 반환하고 ready/absent와 메모리 프로필을 유지한다. 이 때문에 추가했던 debug 잠금 예외 UI/핸들러는 모두 제거했다. 별도 복구 기능은 추가하지 않았다.

## 생성물·증거와 한계

최종 entry `web/entries/game.66fcb6346e75df3e.js`, manifest SHA256 `db45be5f89799ee1cce522b04ac9d56a4ad2dc800a492c5c262fe6be8966b1f7`. 반복 build로 밀려난 기준 파일은 기준 Git blob에서 복원하고 공식 retention 계획으로 미사용 중간 빌드만 정리했다. 기존 발행 성공 시간/run을 새로 만들거나 바꾸지 않았다.

자동 보고와 모바일 JPG는 Git 제외 `_local/reports/profile-store-p01/`에 둔다. `native.json`, `browser.json`, `preservation.json`, `custom-baseline.json`, `parse-recovery-390.jpg`, `read-unavailable-390.jpg`, `confirmed-new-journey-390.jpg`가 있다. 원문 문자열 대신 고정된 합성 fixture만 사용했고 읽기/quota/이관 예외는 명시 주입했다. 정상 Continue의13장 전투/대사 저장은 Native App에서 준비한 snapshot으로 시작하며 전체 캠페인 플레이·실기기·공개 배포 검증을 주장하지 않는다. 실제 사용자 localStorage/저장 파일을 읽거나 삭제하지 않았다. 공개403을 우회하지 않았으며 배포는 부모 검토 대기다.
