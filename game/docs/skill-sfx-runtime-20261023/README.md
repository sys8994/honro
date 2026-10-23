# 승인 스킬 음원 실제 연결

기준 master는 `edf36a5fe8ff3b928918b4f5e8567a7dedac1d69`, 런타임 소스 검수 SHA는 `2e0c2fdfcd48a5f7318c4394cac3171e9a7c483c`다. 작업 브랜치는 `feat/skill-sfx-runtime-20261023`이며 master/Pages 반영은 부모가 담당한다. 승인 입력 `ccac437937dfe565c13bb8bfbf1a2f1a50be982d`는 `6523601a`로 가져왔다. 26 MP3와 2 WAV, 총365,720B 원본은 입력 blob과 동일하며 음원을 생성·재가공하지 않았다. 원천 manifest의 previewOnly/runtimeIntegrationDone는 부모의 입력 당시 상태이며, 현재 연결 사실은 이 문서와 코드가 설명한다.

## 적용

64개 현행 활성 기예의 실제 발사·명중·막힘·반사·지형 파쇄·진목 설치/발동·상태 부착·소환/소멸·회복·축지에 actor/skill/cast/phase 정보를 붙였다. 엔진 오디오 context는 일시 필드이며 저장/스탯/RNG/판정을 바꾸지 않는다. 지정 플레이어 경로의 구 procedural 신호를 차단하고 몬스터·UI·스토리 묵종·BGM은 유지한다. 더 이상 현행 목록에 없는 S99/O99와 적 전용 L 계열은 기존 경로를 보존한다.

한 AudioEngine의 유한28자산 캐시를 공유한다. 타이틀은 이 음원을 요청하지 않으며 현재 파티/장착·선택 기예부터 준비한다. 요청 중복과 decode를 공유하고, 실패는1/2초 및3회 뒤30초 backoff로 다음 준비 기회에 재시도한다. 8초 요청 제한이 있으며 과거 이벤트는 준비 완료 후 재생하지 않는다. 로딩 실패 때 구 소리를 대신 재생하지 않는다.

충전 attack1회에서40ms로 승인 loop에 연결하고 강도 gain을.22→.40으로 완만히 높인다. 발사/취소/모달/사망/입력 불가/음소거/숨김/화면 이탈에20ms fade-stop한다. 활성 스킬 음성16개, 계통3개, 방울2개 상한과256개 중복 기록을 쓴다(정리 중20ms fade 꼬리는 별도). 변주는 정해진 sequence의 물리±2%, 기/혼±3%이며 방울은rate1이다. 소단 본체 발사의1.85초 방울은 행동당1회, 반향/소환귀/자탄에는 추가 방울을 넣지 않는다. 천뢰10대상의 본체음은 행동당1회다.

## 확인 결과

- `node tests/skill-sfx-runtime.mjs`:72개 확인. 64활성 기예 실제 발사 후180스텝의 전체 전투/저장 상태와RNG가 기준edf 엔진과 exact 동일. 활 명중/막힘/쇄암 파쇄, 천뢰10대상, 반사, 진목 발동/회복, 축지, 파산격 실제 착지, 응수, 소환 현현/만료/피격 소멸, 몬스터/UI 원래 소리 경로 확인.
- `node tests/skill-sfx-player.mjs`:7개 묶음 통과. 제어된 WebAudio/시간으로40ms 연결·20ms 해제, 예약 loop 취소, 완만한 gain, 중복/상한/고정 변주, 지연·실패 후 새 행동만 복구, mute/hidden/재마운트 캐시를 확인.
- `python tests/skill-sfx-browser.py`:실제 로컬 최종 빌드의 Chromium26개 통과. 생산 App의 키보드 충전·해제/정리와 실제 Engine 이벤트→AudioBufferSource.start,11개 검/도술/진목/축지/소환 대표 경로,503 실패 및 후속 복구 확인.390×844/844×390 준비 화면 캡처. 최종 표본의28자산 요청28/decode28, decoded buffer3,862,308B, 종료 활성음성0. 처음 활만 준비하면5개, 같은 상태 재마운트에 추가 요청/decode0. 전체 은행 수치는 여러 장착 기예를 차례로 사용한 뒤의 값이다.
- TypeScript typecheck, 변경 JS syntax, 공통 `npm run build`, `tests/web-split.mjs`, `tests/mukjong-bgm-duck.mjs`, `tests/audio-touch-activation.mjs` 통과. 묵종12/18 성공 시작 기반 duck 수학/신호와 UI touch/pen/mouse/keyboard activation 보존. 마지막 두 오디오 테스트의 dependency double만 새 SkillAudioPlayer 구성에 맞췄다.

과거 `skill-redesign.mjs`는7개 실패가 남았고 기준edf 엔진 비교 실행에서도 같은7개를 재현했다. 재조립 기준의 legacy alias fixture 추가 실패1은 제품 결과로 집계하지 않는다. 과거 `audio-latency.mjs`/`audio-release-review.mjs`는 동작·PCM 검사를 통과한 뒤 각각 오래된 story/main 소스 문자열 assertion에서 실패한다. 동일 문자열이 기준edf에도 없음을 직접 확인했으며 기대값/범위 밖 코드는 수리하지 않았다. 이 세 도구 전체를 통과라고 보고하지 않는다.

## 빌드와 보존

최종 진입은 `web/entries/game.bf9e42f5d682c70c.js`, 활성411파일의 graph SHA256은 `01a197be936b8edf845323768a2948fa3e48136d52ffcaf929e84861eeaea10a`다. 기준edf 활성381파일과 기존 성공 발행33그래프를 포함해 immutable733파일의 길이/SHA256을 검증했다. edf의 새 발행 시각/Pages 성공 근거를 임의로 등록하지 않고 현재까지 알려진 그래프를 중간 보존 슬롯에 유지했다. 실제 발행 확인은 부모가 맡는다. 기존2막 대본/19장/지형/수비범위/종지기 보스/UI·초상/카드 동작을 이번 변경에 섞지 않았다.

## 증거와 한계

자동 결과는 `_local/reports/skill-sfx-runtime-20261023/`의 `engine.json`, `player.json`, `browser.json`, `retention.json`, 각 로그에 있다. 사진은 `390-bow-held.jpg`, `390-sodan-cast.jpg`, `844-recovered-charge.jpg`이며 Git 제외를 유지했다. Library 스킬의 공식 배치 업로드는 도구 조회에서 `hosted apps tools/list request failed: network`로 실패했다. 파일이 생성됐다는 사실과 Library 전달 성공을 구분하며 반환 ID는 없다.

Chromium headless의 실제 디코드/start/stop 관측과 준비된 practice 전투/저장 재마운트 검사다. 스피커 청취·출력 품질·실기기 Android/Safari·전체 캠페인 완주·일반 캠페인 Continue 전체를 검사한 것으로 표현하지 않는다. 대본/맵/밸런스/음원 파형은 변경하지 않았으며 공개 배포는 하지 않았다.
