# UI/P0와 묵종 BGM ducking 최종 후보

기준 master는 `cf2bd15887435a80574e1eadc9b6d67f38fd8343`이다. 실행 게임 소스는 보존 WIP `ee8e56b5b769944140e316bc922f0e8bcc2f6499`와 동일하며, 재개 후 제품 소스를 추가 수정하지 않았다. 마지막 빌드/실제 검사 진입점은 `web/entries/game.4e1b47a04affd72a.js`, 활성 그래프 SHA-256은 `f61323e70379ed1a52bf0c531c1d207e4ae1da1fbf67a28f23f5b1933bc6ba99`다. 최종 커밋은 검사 보완·문서·기준 자산 보존을 담는다. master/Pages는 부모가 반영한다.

## 초기 실패의 원인과 해결

브라우저의 before.factor===1 실패 때 실제 묵종 재생은0회, duck 호출은 인자 없이1회였다. 검사 준비 코드의 마지막 표현식이 `m.duck = 함수`라 Playwright가 반환된 함수를 실행했다. 이 검사 부작용으로 짧은 duck이 만들어졌으며12장 종이 먼저 울린 것이 아니었다. 준비 코드를 명시적인 무반환 블록으로 고치고, 초기 기대를 factor1/재생0/duck호출0으로 강화해 통과했다. 기다려서 문제를 가리거나 기대를 약화하지 않았다.

같은 fixture에서 처음부터 App.frame을 정지하면 상호작용 뒤 정상 대사 큐도 진행하지 않는다.12장 표본은 실제 App.frame으로 입력/상호작용 준비와 대사 경계를 진행하고 일반 다음 버튼으로 지정 row에 도달한다.18장은 기존 준비된 의식/라운드 경계를 사용한다. 이전 WIP 미완료 판정은 이 결과로 해소됐다.

## 동작과 확인

- 실제 묵종 AudioBufferSource.start 성공 뒤에만 BGM을 별도 배율0.63(약-4dB),140ms attack으로 줄인다. duration/playbackRate의 끝900ms 동안 자연 복귀한다. 겹침은 배율을 누적하지 않고 마지막 소리 기준으로 갱신한다. 기존 사용자 musicVolume·master/SFX gain은 바꾸지 않는다.
- pause, visibility의 공통 정지 경로, SFX/음악 음소거, 음악/장면 전환에서 배율을 초기화한다. 입력과 대사를 소리 종료까지 막거나 추가 rAF/타이머 루프를 만들지 않는다.
- `tests/mukjong-bgm-duck.mjs` 및 `tests/mukjong-audio.mjs`의 동일 게임 소스 통과 기록을 유지했다. 제어 시간/media double의140ms/.63/900ms 경계, 비누적 중첩, 설정 보존,12/18 성공 start 전용·미준비/무음 제외와 기존 묵종 회귀를 확인했다.
- `tools/testing/mukjong-bgm-duck-browser.py` 최종 통과: 실제12장 상호작용/대사 row,18장 Engine.enemyAction 의식과 실제 라운드 상승음. 스트리밍 BGM 볼륨0.3575→0.225225→0.3575, SFX master0.55 유지, 중첩해도 factor.63, 이전/다음 반복 재생 없음, pause·mute·장면 전환 복귀를 확인했다. 성공 표본의 승인 종 MP3 요청1·decode1·buffer1,023,116바이트다.
- document.hidden을 검사에서 잠시 모사하여 실제 visibilitychange 핸들러에 전달했을 때 factor1/paused, 복귀 때 factor1/재생 수 불변을 확인했다. OS의 실제 탭 가시성이나 실기기 검증으로 표현하지 않는다.
- 별도 Chromium 페이지의 실제503에서 재생0/duck0/factor1이었다. 복구 뒤 요청2·decode1/ready가 되었지만 과거 대사는 뒤늦게 재생하지 않고 duck0/factor1을 유지했다. 최종 pageerror0.
- `npm run build` 및 `node tests/web-split.mjs` 통과: 생성 파일381개 해시/바이트, Game/embedded/Workshop 진입과 저장 격리. cf2 활성381파일과 기존 공개33개 그래프를 원본 바이트/hash로 복원·검증했다. 공개 메타데이터는 그대로이고 후보를 성공 발행으로 추가하지 않았다.

## 포함된 UI/P0와 한계

기존 완료 단위는 재작성하지 않았다: 카드500ms/잡기 b3339899, 정보 초상/재사용 확대3561a2f3, 수비 원78ab2808, 종지기 보스 표기/섭혼 제외a64c5896, 일반 서술0c752898. 각 문서의 해당 실제 검사를 유지한다. 수비 범위는 실제680반경을 표시하고0 contest는 점선만 생략한다. 종지기 HP880/비살상 진행을 보존한다.

기존 character-info의 Tab fixture p0/mage-test 실패는 기준에도 동일함을 확인해 해당 문서에 별도 기록했다. 이를 새로 고치거나 전체 캠페인/기존 무관 검사를 반복하지 않았다. 정상 장 완주·물리 Android/Safari·주관적 음질 청취·공개 배포 검사는 아니다. 현재 제품 실패나 실행 차단은 없다.

자동 결과/사진은 AGENTS에 따라 Git 제외 `_local/reports/mukjong-bgm-duck-20261023/`의 `initial-diagnostic.json`, `native.json`, `browser.json`, `browser-final.txt`, `build-final.txt`, `web-split-final.txt`, `retention-final.json`, `390-chapter12.jpg`, `844-chapter18.jpg`다. UI/P0 사진은 각 작업의 `_local/reports/` 경로에 보존돼 있다.

후속 입력 ccac4379(스킬28음원/64매핑),6177899(확정2막/19장 원고·SVG)는 이번 후보에 가져오지 않았다.19장 비전투 전환도 이번 범위에 없다. 다음 작업은 부모의 통합 상태를 확인한 뒤 별도로 진행한다.
