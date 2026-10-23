# 승인 묵종 B 음향 연결

기준 공개13a91c94. HP 조건 제거는 독립 `fd789583`, 승인 MP3 입력은3a459bc0을 cherry-pick한 `b2b43634`다. master/Pages 반영은 부모 담당이다.

승인 B 원본 `shared/assets/sfx/mukjong-b.mp3`는93740바이트, Git blob `aacb8ea3ce4a3b15ac2dcd651abc9f6b4e087b3e`, MP3 컨테이너5.832초이며 FFmpeg 디코딩 통과. 실제 Chromium AudioBuffer는5.79998초/1023116바이트다. 재인코딩·추가 기본 피치 하향은 하지 않았다. 출처와 CC0 문서는 같은 폴더 LICENSE를 보존한다. Library 확인 ID의 직접 materialization은 download failed였으나, 부모가 동일 승인 원본을 저장소로 전달해 정상 수급했다. 거부 우회가 아니다.

| 실제 사건 | 고정 playbackRate | 횟수 |
|---|---:|---|
|12장 현장 울림 `12.beats.sign:a6e603d56a`|1|해당 전투에서 첫 진입1회|
|18장 act2-keeper의 `beginKeeperRitual` 성공: H2KEEPER 기반 의식|1.059463|새 의식 serial당1회|

종지기는 현재 일반 Engine.fire가 아닌 전용 의식으로 발동한다. 그 성공 시점의 기존 qiRebound 신호만 mukjongKeeper로 대체했고, 피해 대상/타격/매 프레임에는 연결하지 않았다. 일반 H2RESONANCE·다른 honroMournerWail·반사 충돌음은 유지한다. +2반음은 확정 절정 타종 사건이 없어 제외했다. 억제 hold 반복, 받침 착지, 조건부 ‘다시 운다’, 회고/기록에는 새 타종을 만들지 않는다.

한 AudioEngine에서 승인 파일 요청·decode·AudioBuffer를 공유한다.12/18장 진입과 실제 입력에서만 준비하며 title의 MP3 요청은0이다. 음원 Promise를 게임 진입·대사·퀘스트가 기다리지 않는다. 차가운 상태/실패/음소거/비가시에서 발생한 소리는 소비하고 생략한다. 늦게 준비되거나 음소거를 풀어도 과거 소리를 재생하지 않는다. 준비는8초 abort와 최대2회·1초 간격의 후속 준비 시도로 제한한다. 한 번 준비되면 재진입·다른 장면에서도 재요청/재디코딩하지 않는다. 새 브라우저 문서는 새 AudioEngine이며 별도 캐시 수명이다.

첫 row 소비와 종지기 serial은 전투의 표시용 honroState.mukjongAudio에 보존한다. Continue에서는 이미 읽은 row/현재 serial을 재타종하지 않는다. 기존 AudioEngine.voices에 추가해 음소거·visibility·dispose의 정리를 공유한다. 새 rAF나 지연 재생 큐는 없다.

검사:

- `tests/mukjong-audio.mjs`: 고정 두 rate/같은 buffer,120회 반복, 이전/저장/skip/음소거/비가시/지연/실패 및 제한 재시도. 실제 준비된 Engine.enemyAction 의식 시작 신호1회, 옛 시작 신호0.
- `tools/testing/mukjong-audio-browser.py`: 실제 빌드 Chromium MP3 decode, 준비된12장 Continue→실제 E/대사 다음·이전·120회 draw, 저장 Continue/음소거 재설정.18장 실제 enemyAction 의식 발동 및 같은 캐시 재사용,120회 중복 호출/Continue 무추가. 임시503→성공 준비 뒤 밀린 소리0. pageerror0.
- 기존 `keeper-ritual-mechanics`, syntax/build/web-split 및 로컬 TypeScript noEmit52소스 검사가 통과했다. 정확한 실행 결과는 인계와 로그를 참조한다.
- 기존 `keeper-ritual-app`의 마지막379 시점 NPC manifest 비교는 실패한다. 현재 NPC manifest는 공개13a와 바이트 동일하며379와 이미 다르다. 이번 음향 변경의 NPC 회귀로 보지 않고 옛 미술 fixture를 수정하지 않았다. 현재 생산 App Continue는 위 브라우저 검사에서 별도 통과했다.

자동 증거는 `_local/reports/mukjong-audio-20261023/`의 unit/browser/keeper-mechanics/keeper-app/web-split/typecheck/retention JSON·TXT다. 준비된 좌표/이전 상태/제한된 의식 발동을 사용했다. 일반 전투 완주·실기기 청취·음향 품질 재심사는 하지 않았다.

활성381파일과 과거 공개33그래프를 해시·바이트로 검증했다.13a의 공개 사실은 부모 확인과 같은 날의 소스 생성 근거로2026-10-23 일자 정밀도/순서33으로 등록했다. 정확한 Pages run/완료UTC는 제공되지 않아 만들지 않았다. 기존 묵종v08·카드/초상화·독립 전투/보스·종지기 보복HP60%는 보존했다.
