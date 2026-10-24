# P2.5 교체된 SFX와 bank 소유권 — 2026-10-24

기준 master `868a84589b502c2980e3cd205a14cc08e870570f`에서 부모 지정8개 blob/size 일치 후 **53,011B**를 삭제했다. skills-v2의 bow_release/bow_hit/arrow_block/sword_swing/sword_hit/sword_parry/blade_launch.mp3와 weapons-v3의 옛 bow_release.mp3만 대상이다. manifest도 해당7+1항목만 제거했다. 원본/출처/license 파일과 다른 오디오·metadata는 보존했고 인코딩하지 않았다.

shared/build.mjs의 작은 skillAudioData가 현재 base/weapon/arrow/thunder/bowstring bank를 한 번 합치며 중복 ID는 오류로 처리한다. 이전 항목 덮어쓰기/폴백은 없다. 별도 module/framework는 만들지 않았다. engine/runtime/config/캐릭터/갤러리·부모 docs dedup 변경은 보존했다.

확인 결과:

- `node tests/superseded-sfx-p25.mjs`: 기준 build의 실제 덮어쓰기 블록을 고정 Git 입력으로 평가한 결과와 **최종29개 ID 전체 metadata·오디오430,957B exact**. 현재 빌드의 오디오 emit bytes/metadata도 이 결과와 exact. bank 간/같은 bank의 duplicate 두 fixture가 모두 빌드 오류로 거부됐다. 나머지 오디오 및 source/license·engine/runtime/수치 불변 확인.
- `node tests/skill-sfx-runtime.mjs --assets-only`: 64개 활성 ID의 사용 asset 존재, ccac4379 manifest+binary의 역사28파일/365,720B 계약 통과. 기존 전투 assertion은 그대로이고 이번에는64스킬 전투 반복을 실행하지 않았다.
- `node tests/approved-weapons-v3.mjs --assets-only`: 고정6b784c80의 옛5파일 중4개 검술 파일은 현재 bytes와 exact, 옛 bow는 Git 역사 입력으로 구분했다. 현재 bow는18c15e9a의 승인 bytes와 exact이고 SHA256 `d359936cf63869053ace383263162c9b45bb1e52af1a9bf1612d27a31107872a`, gain.95를 확인했다. 해당6b 비교 객체가 처음에는 로컬에 없어 승인 weapons 자산 브랜치를 fetch한 뒤 통과했다. 파일/기준을 다른 것으로 대체하지 않았다.
- `node tests/skill-sfx-player.mjs`: 실제 effective bank로 준비하고 현재 bow 라우트/hash를 별도 검사했다. 기존7개 voice cap/error/retry/charge stop/bell 제한/중복/음소거·hidden·Continue assertion 모두 통과(WebAudio double).
- `python3 tests/approved-weapons-v3-browser.py --smoke`: 실제 Chromium App/Engine/WebAudio의 A01/S00 대표 발사23항목 통과. 현재 manifest의4개 검술·arrow/thunder에 현재 bowstring 라우트도 명시했다. 제한 실행은 bow_release/bow_hit/sword_swing/sword_hit 실제 source 및 served bytes, muted/failure/옛 파일 폴백 없음 등을 확인한다. 기본 전체 검사 항목은 삭제하지 않았다.
- `python3 tests/bowstring-v4-browser.py`: quick/held 각각 release1회, 실제 gain.95·duration, cancel/mute0회, unmute 지연 재생 없음, served hash exact,503/옛 폴백 없음 등11항목 통과. 실제 decode/source.start 관측이며 주관적 청취·실기기 검수는 아니다.
- `npm run build`, `node tests/web-split.mjs`와 공개47그래프/중복 제외860파일 SHA·bytes 보존 통과. web-split의30장 입력 비교는 플레이 순회가 아니다. source950561ce 이후 제품 코드는 추가 변경하지 않았다. 새 후보는 발행으로 등록하지 않았다.

ID 직렬화 순서만 달라져 audio JSON/그 loader와 Game/embedded/Workshop entry **5개 content hash**가 바뀌었다. 활성354파일·34,594,315B는 기준과 같아 **활성 bytes 차이0**이다. 오디오 신호 재가공이나 실행 용량 개선 주장은 없다. 53,011B는 source에서 제거한 옛 오디오의 크기다.

새 entry `web/entries/game.26d3b4afe6e0075f.js`, Workshop `web/entries/workshop.71d94d920bc2c68e.js`, manifest SHA256 `0d9d562b4739ce278f33f21363482e50bdd38280931f57403f44bc6747ea5917`.

원시 결과는 `_local/reports/superseded-sfx-p25/`와 기존 SFX 검사 경로에 있다. source/license attribution은 원래 위치에 남겼다. 전체64스킬 전투·30장 플레이·전체 verify·새 공개 배포 검증은 실행하지 않았고 master/Pages는 부모 담당이다.
