# BGM 통합

Authoritative spec은 [assets/bgm/README.md](assets/bgm/README.md)입니다. 실제 prefix 01~05 파일을 빌드 시 검증합니다.

| 상태 | 파일 |
|---|---|
| 타이틀·여정도·동행·설정 등 | `01 main theme - 혼로.mp3`, 반복·UI 전환 시 유지 |
| 일반 전투 | `02 battle theme - 장막 너머의 음.mp3` → `03 battle theme - 하늘의 그림자.mp3` → `04 battle theme - 불길의 춤.mp3` → 02 |
| 보스 등장 이후 해당 전투 | `05 boss battle theme - 그림자 대결.mp3`, 반복 |

별도 Stage 전용곡은 README에 없으므로 추가하지 않았습니다. Playlist index는 앱 세션 내 Stage 이동·비전투 왕복에도 유지합니다. 실제 awake 보스가 나타나면 해당 전투에 05를 유지합니다.

기존 AudioEngine이 BgmPlayer를 소유합니다. 기존 SFX WebAudio를 유지하고 BGM은 lazy HTMLAudioElement로 스트리밍합니다. 전체 decode/base64/5곡 선로딩은 없습니다. 전환은 420ms crossfade, 최대 두 스트림이며 완료 후 나가는 src를 해제합니다.

첫 실제 포인터/키 입력으로 unlock합니다. Autoplay 거절은 다음 입력을 기다리며 매 프레임 재시도하지 않습니다. 파일 실패는 기록하고 가능한 다음 전투곡을 사용하며 게임을 막지 않습니다. Master volume과 별도 music/musicVolume 설정을 사용하고 SFX mute와 독립입니다.

Pause/숨김은 같은 스트림·시각을 보존하고 resume합니다. 비전투 설정창은 01을 이어가고 전투 pause modal은 음악을 멈춥니다. 전투 종료·비전투 복귀 시 01로 돌아옵니다.

Edit 모드에는 AudioEngine이 없습니다. Playtest는 본게임 AudioEngine을 쓰고 iframe 안의 실제 입력으로 unlock합니다. 테스트 프로필은 오디오 설정을 유지하며 Stop은 SFX/BGM 모두 dispose합니다. assets/bgm을 HTML과 함께 배포해야 합니다.

검사는 실제 MP3 디코딩·currentTime 증가·전환·mute·SFX·iframe 폐기를 포함합니다. 곡 끝은 ended 이벤트로 전체 순환을 확인했습니다. 전곡 청취나 MP3 지연까지 포함한 sample 단위 무간격 검사는 하지 않았습니다. 모바일 검증은 Chrome 가로 터치 에뮬레이션이며 실기기 Safari는 별도 확인 대상입니다.
