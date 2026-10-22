# HONRO BGM — 2026-10-22

현재 BGM·승인된 11장·master 실루엣 개선을 결합한 부모 검토본은 [최종 통합 기록](../../game/docs/bgm-stage11-release-20261022/README.md)을 따릅니다. 아래 단독 BGM 검수의 소스/빌드와 이번 통합의 소스/빌드를 구분합니다.

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

## 최종 상태와 검증 범위

초기 battle 5/6 전송 오류는 부모가 첨부 원본을 Git으로 전달한 `9de282ea7aee9e41e97c9390dfc56548e8c76707`에서 해결됐다. 현재 `assets/bgm`에는 위 7개 MP3만 있다. 재전송·대체·재인코딩 없이 원본 바이트를 보존했다. 개인 Library ID는 현행 `shared/data/bgm.json`에서 제거했고, [원본 첨부 파일명·hash 기록](../../game/docs/BGM_TITLE_REVIEW.md)으로 출처를 관리한다.

최종 소스·공통 Game/Workshop 생성물·캐릭터 도감 내장 런타임은 **`e539f9dbbdd3a28d1b7bb53c48e6f128fb9f3701`**에 있다. 검사는 당시 HEAD `68118dac`의 작업 트리에서 수행했고 검증된 코드/생성물을 변경 없이 이 커밋에 저장했다. 이 뒤 변경은 문서뿐이다. 실루엣 개선을 포함한 부모의 최신 master `28b26db6`은 이 단독 검사 기준에 섞지 않았다. master/Pages는 직접 변경하지 않으며 최종 통합은 최신 master 보존·통합 소스 재빌드가 필요하다.

### 실제 완료한 검사

- `node tests/bgm-assets.mjs`: 7개 Git blob 일치, 전체 MP3를 FFmpeg null 출력으로 끝까지 decode, ffprobe codec/길이/48kHz stereo 확인. 길이(main, battle 1–6): **204.840 / 179.616 / 150.048 / 150.000 / 173.616 / 199.248 / 184.056초**. 누락·추가 MP3 0개.
- `node tests/audio.mjs`: **30개**. 대역 HTMLAudioElement 및 실제 App updateAudio 함수로 1/9/10/11/20/21/30장, 막 경계·순환·우선곡·재시도·pause/mute/잠금·실패 목록 고갈·420ms crossfade를 확인했다.
- `node tests/music-titles.mjs`, `npm --prefix game run typecheck`: 7개 첨부 제목/URL·오타 정리와 타입 검사 통과.
- `npm run build`: 공통 Game/Workshop·직접 Playtest 문서 및 351개 현재 웹 자산 생성. `node tools/character-catalog/build.mjs`: 최신 소스로 도감 내장 런타임 재생성. 미술 원본은 수정하지 않았다. 현재 web/도감에서 옛 5개 MP3 파일명 참조가 남지 않았음을 확인했다.
- `python tests/bgm-transitions.py`: **1280×800 / 390×844**의 실제 Chromium에서 1/9/10/11/20/21/30장 곡명·실제 currentSrc/currentTime/readyState·재생 스트림 1개, 1·3막 1→2→3→1 및 2막 4→5→6→4 순환, 현재 메뉴의 재시도·음소거·음량 0/복귀, 휴식터/타이틀 복귀와 스트림 유지, battle 6 fetch 실패→battle 4 복구, Workshop 재생·제목·Stop 해제 통과. 초기 MP3 요청은 양쪽 모두 **main.mp3만** 있었다. 일반 경로의 브라우저/미디어 오류는 0개다. 의도적으로 실패시킨 fetch는 별도 사례다.
- `python tests/dialogue-music-opening-browser.py`: **19개 전환**. 9·10장 battle 3 진입·재시도·저장/Continue, 이후 같은 목록 순환, 반복 갱신·탭 숨김/복귀 시 스트림/시각 보존. 새 세션·저장 상태는 검사 fixture다.
- `python tools/testing/music-label-layout-browser.py`: **320×568 / 390×844(safe top44/bottom34) / 844×390 / 1280×800**, 7개 제목의 배치 fixture 총 28개에서 버튼 겹침 0. 현재 main/전투 라벨과 줄바꿈, 실제 화면도 확인했다. 새 접두어 포함 라벨의 3px 안팎 겹침은 **9px 글씨·우하단 위치를 유지하고 line-height 1, 최소 하단 여백 1px**로 조정했다.
- `node tests/web-split.mjs`: 현재 351개 파일의 해시/바이트, 30장·851개 라이브러리 항목의 native/웹 재조립 일치, Game/embedded 타이틀 진입·저장 보호, Workshop 직접 iframe 문서 연결 통과.

### 빌드와 증거 식별

- 최종 `web/manifest.json` SHA256: `7c9bc60d19a9cc6d666f79f28713beba3625fcbb56b5c13598e90742136278bb`.
- 최종 `HONRO.html` SHA256: `8b7ae1a7ddc4cde3412e826905c0ba8edebbbff064da91b82feddace6acb1b4c`.
- 최종 `HONRO_WORKSHOP.html` SHA256: `1fc6c7123f6b6be53f68365244b4f27d90305bbb5a4d860cf445a8738c2959f0`.
- 브라우저 기록 `_local/reports/bgm-acts/browser.json`은 같은 manifest SHA를 기록한다. `_local/reports/bgm-acts/`의 build.log, catalog-build.log, browser.log, opening-browser.log, layout-browser.log, web-split.log와 장 9/11·타이틀 1280/390 스크린샷이 해당 실행 증거다.
- 상세 자산/단위 결과: `_local/reports/bgm-assets.json`, `_local/reports/audio-unit.json`. 우선곡 브라우저: `_local/reports/dialogue-music-opening/checks.json`. 제목 배치: `_local/reports/bgm-label-layout/label-layout.json` 및 화면별 PNG. 자동 결과는 저장소 지침에 따라 `_local`에만 두며, 이 README의 요약과 위 커밋/해시가 원격 검토 기준이다.

전체 파일 decode는 실제 청취와 다르다. 브라우저에서는 7곡을 각각 짧게 스트리밍했고 ended 이벤트로 순환을 단축했다. **7곡 전체 청취·정상 조작 캠페인 완주·실기기 Safari·물리 스피커 청감**을 확인한 것으로 과장하지 않는다. 전체 verify는 이번 BGM 변경 범위에 포함하지 않았다.
