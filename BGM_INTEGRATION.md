# BGM 통합

[27곡 목록과 갱신 방법](assets/bgm/README.md)과 [60장 악곡표](shared/data/bgm-stages.json)를 사용한다. 빌드는 코드·파일명·장별 참조를 대조한 뒤 음원 URL, 표시 제목, 재생 순서를 Game과 Workshop에 전달한다. URL의 버전은 정리된 MP3의 Git blob이며 음원이 바뀔 때 갱신된다.

`shared/runtime/main.js`가 장 번호, 전투 세션, 주박과 대도사의 실제 진행 상태를 전달한다. `shared/engine/src/bgm.ts`는 AudioEngine의 스트리밍 채널로 시작곡, 순환, 이벤트 반복을 재생한다. 6막 엔딩 스틸 플레이어는 같은 목록에서 99의 파일과 크레딧 제목을 읽는다. 게임 저장 형식에는 음악 상태를 추가하지 않는다.

관련 검사는 `node tests/audio.mjs`, `node tests/music-titles.mjs`, `node tests/bgm-assets.mjs`와 빌드 후 `python tests/bgm-transitions.py`다. 자산 검사는 ffprobe와 ffmpeg를 사용한다.
