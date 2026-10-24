# P2.4 교체된 NPC 가공본·옛 로고 정리 — 2026-10-24

기준 master `24526d56bfdb6460d0cdf6205a744faf00ca45c6`. 부모가 지정한13개 파일의 blob과 크기를 모두 대조한 뒤 **10,331,934B**를 삭제했다. [inventory.json](inventory.json)에 정확한 경로/blob/bytes와 고정 기준 Git 링크를 기록했다. 옛 NPC WebP/encoding 자료·전용 인코더와 rc11 로고만 제거했으며 빈 alias/fallback은 없다.

현재 npc-game-tone-v3, art/portraits의 PNG identity master, 메인4명 원본/가공본과 모든 variation, source/identityMaster metadata, rc11 stage-01.jpg~stage-10.jpg는 보존했다. config·runtime·서사·미술·오디오는 변경하지 않았다. 기존 NPC runtime 역사 문서 상단에 삭제된 인코딩 자료의 고정 Git 안내만 추가했고 기록 hash/증거 JSON은 바꾸지 않았다. README/ARCHITECTURE와 중복 캡처는 건드리지 않았다.

검사:

- `node tests/retired-npc-logo-p24.mjs`: 삭제13개 blob/bytes/집합 exact. 현재 config 가공본25개와 원본/identity master 경로35개의 존재·Git blob·SHA256, config 전체 bytes/metadata 불변 확인. 나머지 art/assets/game source/입력 불변과 rc11 실제 장 이미지10개 exact 확인.
- production portraits/npc-portraits 모듈을 실제 현재 config와 연결해 현재 rowId로 매칭되는46행과 named identity17개가 현재 config 파일로 resolve되는지 확인했다. 오래된 proposal의 JSON 위치를 사용하지 않았다. 전체 대사/30장/스킬 검사는 아니다.
- 기존 `tests/npc-portrait-mapping.mjs`는 테스트 double의 select 누락으로 실패했고, 고정 기준 테스트 소스에서도 같은 실패를 확인했다. 준비 단계에 실제 portraits 모듈을 연결해 진단했을 때에는 과거19장 JSON 포인터가 새 rowId `19.beats.send-1:unfinished-promise`를 옛 `19.beats.send-1:3a9cb34afd`로 기대하는 낡은 항목도 드러났다. 제품 동작/원고나 기대를 수정하지 않았고 이 임시 준비 변경도 되돌려 기존 테스트 파일을 원상 보존했다. 기존 전체 검사가 통과했다고 주장하지 않으며 위 현재 rowId/자산 계약 결과와 구분한다. 기존 output 디렉터리 이름도 바꾸지 않았다.
- `npm run build`, `node tests/web-split.mjs` 통과. `HONRO_NPC_PORTRAITS`/`HONRO_STORY_PORTRAITS`/`HONRO_PORTRAIT_VARIANTS` data3개와 manifest.files 전체의 path/bytes/SHA, common/entry와 HTML3개가 기준과 exact다. 활성354파일/34,594,315B로 배포 그래프 변화가 없다.
- 실제 공개47그래프/중복 제외855파일 SHA·bytes를 확인했다. P2.3의 실제 성공 재발행만 기존 hash dedup 정책으로 등록해 건수는47로 유지했다. 새 후보를 발행으로 등록하지 않았다. 생성물 변경은 manifest의 확인된 발행 metadata뿐이다.

현재 entry는 그대로 `web/entries/game.313759e6ffc706a1.js`, Workshop은 `web/entries/workshop.28ac6e40301490fd.js`. manifest SHA256은 `77bf4b957b32118e33b866d53ef2a44218ee30bf0265ff80e117091fa1d702c9`다.

원시 계약 결과/진단 로그는 `_local/reports/retired-npc-logo-p24/`와 실행 로그에 있다. 이번에는 그래프가 같으므로 새 브라우저 화면/실기기/공개 배포 확인을 주장하지 않는다. master/Pages는 부모 담당이다. 다음 오디오 정리는 착수하지 않았다.
