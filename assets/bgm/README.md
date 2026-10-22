# HONRO BGM — 2026-10-22

유일한 현행 목표 목록은 사용자 첨부 7개다. 파일명은 역할/번호, 표시 제목은 `shared/data/bgm.json`의 명시 메타데이터로 관리한다. ID3 제목과 무관하게 우하단에는 **배경음 - 곡명**을 표시한다. battle 6의 여분 `]`는 표시 제목에서 제거했다. 재인코딩·음량 편집은 하지 않는다.

| 파일 | 표시 제목 | 용도 | 첨부 Git blob SHA |
|---|---|---|---|
| `main.mp3` | 혼로 | 타이틀·쉼터·비전투 | `12fa25bef170b60de432272743efe44b16bdd50d` |
| `battle-1.mp3` | 장막 너머의 음 | 1·3막 전투 | `2b3ff078d462f90e305254a331c1b1f4e68abc36` |
| `battle-2.mp3` | 하늘의 그림자 | 1·3막 전투 | `051618688414ba24857652d56a7e5998acc713ac` |
| `battle-3.mp3` | 산 자와 남은 자 | 1·3막 전투 | `9453899607e80e5582b5b16a06f82d427baa4f7d` |
| `battle-4.mp3` | 불길의 춤 | 2막 전투 | `60a45c9b9be5a45fe3a24477ce57c18310122083` |
| `battle-5.mp3` | 암막 | 2막 전투 | `6dda465e00296d8d45735d9b684080d01da72816` |
| `battle-6.mp3` | 불완전한 의식 | 2막 전투 | `9f72159db7d34b1845c8e3f0a526986653ea46c7` |

## 재생 계약

- 1막(1–10장)·3막(21–30장): battle 1 → 2 → 3 → 1. 9·10장 진입과 재시도는 battle 3 **산 자와 남은 자**로 시작한 뒤 같은 순환을 따른다. 이 곡은 예전 그림자 대결과 동일한 blob이다.
- 2막(11–20장): battle 4 → 5 → 6 → 4. 막 목록이 달라지면 첫 곡의 0초부터 시작한다. 1→3막은 같은 목록이며 전투 세션 변경 시 다음 곡을 사용한다.
- 같은 목록의 새 전투·재시도는 다음 곡으로 한 번 진행한다. 같은 세션 반복 갱신/입력/ESC/설정은 같은 스트림·시각을 보존한다. 9·10장의 우선곡은 세션 경계에서만 적용한다.
- 보스 등장·죽음은 곡을 강제 전환하지 않는다. legacy boss 호출도 활성 막 목록으로 정규화하며 옛 보스 슬롯을 선택하지 않는다. 실패곡은 같은 막 안에서만 건너뛰고 전부 실패하면 이전 막 스트림까지 해제한다.
- 비전투는 main 반복. 전투 도입 대사·결과창은 전투곡을 유지하며 실제 타이틀·쉼터/여정 화면 복귀 때 main을 선택한다. 비전투 화면 사이에서는 다시 시작하지 않는다.
- HTMLAudioElement 스트리밍, 기존 사용자 제스처 unlock/autoplay 거절 대기, music/musicVolume과 SFX 독립, 탭 숨김 정지, 첫 25ms 램프와 교체 420ms crossfade/최대 두 스트림을 보존한다. 초기에는 main만 준비하며 7곡 전체 다운로드·AudioBuffer decode·base64를 추가하지 않는다.
- 훈련/Workshop도 연결된 장의 막을 사용한다. 장 정보가 없으면 1·3막 목록을 기본으로 한다. Stop은 스트림을 dispose한다. 저장 스키마는 변경하지 않는다.

## 현재 상태와 검증 범위

**미완료·master 통합 금지:** battle 5/6은 확정 Library ID로 준비했지만 실제 바이트 전송 실패, 실행기 내부 목적지로 허용된 한 번 재시도도 실패했다. 현재 디렉터리에 읽을 수 있는 원본은 main/battle 1–4의 5개다. 다른 파일 대체나 추가 전송 재시도는 하지 않았다. 이 다섯 파일은 첨부 blob과 일치해 rename으로 재사용했다. 첨부 ID와 예상 해시 7개는 `shared/data/bgm.json`에 보존했다.

- 실제 완료: 기존 5개 전체 FFmpeg decode, ffprobe 길이(204.840/179.616/150.048/150.000/173.616초)·48kHz stereo MP3·Git blob 일치. 원본 바이트 보존.
- 실제 완료: `node tests/audio.mjs` 30개(대역 HTMLAudioElement와 실제 App updateAudio 함수), `node tests/music-titles.mjs` 7개 제목/URL, `npm --prefix game run typecheck`. 1/9/10/11/20/21/30장, 목록 순환/경계/우선곡/재시도/실패/off-on/크로스페이드는 소스 기반 검사다.
- `node tests/bgm-assets.mjs`는 5개 검증 후 battle 5/6 누락으로 실패하고, `npm run build`는 같은 누락을 검출해 중단한다. 기존 생성 HTML/web는 아직 재생성하지 않았다.
- 청취 페이지에서 기존 5개를 Chromium으로 각각 짧게 실제 재생(currentTime > 0.1초, readyState=4, media error 없음)하고 표시 제목·동시 1곡을 확인했다. 입력 전 MP3 요청은 0개였다. 화면도 직접 확인했다. 이는 변경된 Game/Workshop 검수가 아니다. 로컬 기록: `_local/reports/bgm-listening-page.json` / `.png`.
- 변경된 Game/Workshop의 실제 브라우저 표시·재생·초기 네트워크 검증은 **대기**다. 준비한 `python tests/bgm-transitions.py`는 1280/390 화면의 실제 MP3 currentTime·제목·초기 main만 요청·막별 순환·재시도·설정/음량·타이틀/쉼터·실패곡 회복·Workshop Stop을 검사한다. ended 이벤트는 단축한다.
- 7곡 전체 청취, 정상 조작 전체 전투 완주, 실기기 Safari·스피커 출력은 확인한 것으로 간주하지 않는다. 상세 로컬 기록은 `_local/reports/bgm-assets.json`, `audio-unit.json`에 있다.

누락 2곡을 같은 첨부 ID/해시로 확보한 후 자산 검사 → 관련 검사/타입 → build → 브라우저 → `node tests/web-split.mjs`를 실행해야 한다. 이 브랜치는 master/Pages를 변경하지 않는다.

생성물의 이전 파일 참조도 아직 남아 있습니다. 누락 첨부 확보 후 `npm run build`로 Game/Workshop·web를, `node tools/character-catalog/build.mjs`로 오디오를 생성하지 않는 캐릭터 도감의 내장 런타임 참조를 갱신해야 합니다. 미술 원본은 수정하지 않습니다.
