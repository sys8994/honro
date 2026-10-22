# BGM 통합

현재 계약과 검증 상태는 [BGM 목록](assets/bgm/README.md)을 따른다. 현행 파일/역할/제목/막·blob 메타데이터는 `shared/data/bgm.json`에 있다. `main.mp3`와 `battle-1.mp3`–`battle-6.mp3`만 허용하며 빌드는 누락·추가 MP3를 거부한다.

`shared/engine/src/bgm.ts`의 BgmPlayer가 막별 목록을 스트리밍하고, `shared/runtime/main.js`가 전장/장 번호/세션 및 9·10장 우선곡을 전달한다. `sound-design.ts`의 기존 AudioEngine·설정·SFX 소유권을 유지한다. legacy boss 선택은 현재 막의 battle로 처리해 목록 밖으로 나가지 않는다.

검사: `node tests/audio.mjs`, `node tests/music-titles.mjs`, `node tests/bgm-assets.mjs`, 타입 검사, build 후 `python tests/bgm-transitions.py`. `tests/audio-browser.py`와 `tools/testing/bgm-rotation-browser.py`는 같은 최신 브라우저 검사의 호환 진입점이다. 과거 5곡/보스 전용 검수 결과는 Git 이력과 당시 evidence에 남으며 새 통과 기록으로 취급하지 않는다.

2026-10-22의 초기 battle 5/6 전송 오류는 첨부 원본을 추가한 `9de282ea`에서 해결했다. 현재 7개 자산 검증·전체 decode·관련 단위/타입·공통 build·Game/Workshop 브라우저·web-split 검사를 완료했다. 실제 검사 소스와 빌드/증거 식별은 현행 BGM README를 따른다. master 통합/Pages 배포는 부모가 별도로 담당한다.
