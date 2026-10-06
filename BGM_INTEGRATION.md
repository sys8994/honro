# BGM 통합

Authoritative spec은 [assets/bgm/README.md](assets/bgm/README.md)입니다. 실제 prefix 01~05 파일을 빌드 시 검증합니다.

| 상태 | 파일 |
|---|---|
| 타이틀·여정도·동행 및 그 화면의 설정 | `01 main theme - 혼로.mp3`, 반복·UI 전환 시 유지 |
| 일반 전투 | `02 battle theme - 장막 너머의 음.mp3` → `03 battle theme - 하늘의 그림자.mp3` → `04 battle theme - 불길의 춤.mp3` → 02 |
| 보스 등장 이후 해당 전투 | `05 boss battle theme - 그림자 대결.mp3`, 반복 |

별도 Stage 전용곡은 추가하지 않습니다. **main·battle·boss 플레이리스트가 실제로 바뀔 때 다음 플레이리스트의 첫 곡을 0초부터 재생합니다**(2026-10-06). main→battle과 boss→battle은 02, battle/boss→main은 01, main/battle→boss는 05입니다. 일반 전투 안에서는 02→03→04→02 순환을 유지합니다. 일반 전투 화면에서 바로 새 스테이지에 진입하거나 재시도해 플레이리스트가 바뀌지 않는 경우에는 기존대로 다음 일반곡을 0초부터 재생합니다.

전투 식별은 저장에도 들어 있는 `Battle.session`을 사용합니다. ESC·설정·일시정지와 같은 전투의 저장 재개는 곡 순서를 소비하지 않습니다. 여정도·타이틀에 나갔다가 같은 전투를 이어 해도 실제 플레이리스트 전환이므로 일반은 02, 보스는 05를 0초부터 재생합니다. 화면을 떠나지 않은 일시정지·설정·탭 숨김/복귀는 같은 스트림과 시각을 유지합니다. 보스 등장 시 05로 전환하고, 그 전투의 결과·동일 세션 재개까지 유지합니다. 일반곡 없이 보스곡만 재생한 전투는 일반곡 순서를 추가로 소비하지 않습니다. 같은 플레이리스트의 곡 순서·현재 스트림은 앱 메모리에만 두므로 페이지 새로고침 또는 Workshop Stop 후 새 Playtest에서는 초기화됩니다. 프로필·저장 스키마는 바꾸지 않았습니다.

스테이지 도입 대사 중에도 전투곡을 재생합니다. 현재 앱은 1막 10장의 보스 등장 이후 05를 선택합니다. 앞 장의 중간 보스는 일반 전투 playlist를 사용합니다.

기존 AudioEngine이 BgmPlayer를 소유합니다. 기존 SFX WebAudio를 유지하고 BGM은 lazy HTMLAudioElement로 스트리밍합니다. 전체 decode/base64/5곡 선로딩은 없습니다. 전환은 420ms crossfade, 최대 두 스트림이며 완료 후 나가는 src를 해제합니다.

첫 실제 포인터/키 입력으로 unlock합니다. Autoplay 거절은 다음 입력을 기다리며 매 프레임 재시도하지 않습니다. 파일 실패는 기록하고 가능한 다음 전투곡을 사용하며 게임을 막지 않습니다. Master volume과 별도 music/musicVolume 설정을 사용하고 SFX mute와 독립입니다.

2026-09-28 요청에 따라 ESC 일시정지·전투 설정창에서도 같은 음악 스트림을 계속 재생합니다. 메뉴를 닫아도 재생을 재시작하거나 다음 곡을 선택하지 않습니다. 숨겨진 탭은 같은 스트림·시각을 보존하며 멈추고 다시 보이면 재개합니다. 비전투 설정창도 01을 이어갑니다. 전투 후 대사·결과창은 해당 전투곡을 유지하며, ESC로 결과창을 닫아도 01을 고르지 않습니다. **실제로 타이틀·여정도 등으로 나갈 때** 01로 돌아옵니다. 설정 입력에 포커스가 있어도 ESC로 닫고 같은 곡을 이어갑니다.

재생 중에는 우측 하단에 9px로 `BGM · 02 battle theme - 장막 너머의 음`처럼 곡 정보를 표시합니다. 상태 이름으로 추측하지 않고 실제 재생 가능한 스트림의 currentSrc를 사용하며, 음소거·0 음량·일시정지·재생 실패에는 숨깁니다. 클릭/터치를 가로채지 않고 대사와 화면 전환 후에도 유지됩니다. 본게임과 Workshop Playtest가 같은 표시를 사용합니다.

Edit 모드에는 AudioEngine이 없습니다. Playtest는 본게임 AudioEngine을 쓰고 iframe 안의 실제 입력으로 unlock합니다. 테스트 프로필은 오디오 설정을 유지하며 Stop은 SFX/BGM 모두 dispose합니다. assets/bgm을 HTML과 함께 배포해야 합니다.

검사는 실제 MP3 디코딩·currentTime 증가·전환·mute·SFX·iframe 폐기를 포함합니다. `tests/bgm-transitions.py`는 두 HTML에서 실제 ESC·설정·재시도 입력과 구성한 승패 결과→지도→다음 전투를 확인합니다. 수정 전 관측은 [before](_local/reports/bgm-transitions-before.json), 회귀 결과는 [after](_local/reports/bgm-transitions.json)에 있습니다. 곡 끝은 ended 이벤트로 전체 순환을 확인했습니다. 전체 전투 수동 클리어·전곡 청취나 MP3 지연까지 포함한 sample 단위 무간격 검사는 하지 않았습니다. 모바일 검증은 Chrome 가로 터치 에뮬레이션이며 실기기 Safari는 별도 확인 대상입니다.

`tests/audio.mjs`는 여섯 전환의 첫 곡·0초, 상태별 150회 반복 갱신/입력의 무재시작, 음소거·숨김·autoplay 잠금, 빠른 교차 전환과 스트림 해제를 검사합니다. HTMLAudioElement 대역 검사이며 실제 MP3 청취·브라우저 currentTime 검증은 별도입니다.
