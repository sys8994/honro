# BGM · 11장 최종 통합 — 2026-10-22

부모 검토용 `integration/bgm-stage11-release-20261022`다. master/Pages는 변경하지 않았다.

## 입력과 정확한 통합 소스

- master **28b26db62da7081b49962d5116fe7ad1de542f52**: 빈 실루엣 합성 개선을 포함한다.
- BGM **adadf16f85d8f5e48ebd16fa6c7ac412ff9ff559**: 첨부 7곡·막 목록·제목·우선곡과 스트리밍 계약.
- 11장 인계 **72a8788f**, 실제 승인 소스 **9b69f1f2**: 고정 후보4 미술·국소 준비 계산 개선. 다른 초상화 시안은 가져오지 않았다.
- 최종 소스·공통 생성물·도감·검사 입력·선택 사진 커밋: **551da47f6f5ffc990152a7bcda5de8cd46467c75**.
- 검사는 merge 진행 중 HEAD `9a930650`의 통합 작업 트리에서 실행했다. 보고서의 소스/빌드 SHA와 이후 커밋된 위 코드/생성물의 바이트가 일치한다. 이 뒤 수정은 문서뿐이다.
- 최종 `web/manifest.json` SHA256: `0c7f13b928ebfafab2176a6d107abded1be3f5ecf934cab544a16bb0620e274f`.

생성 HTML/web/도감 충돌은 어느 한쪽 생성물을 채택하지 않고 통합 소스의 공통 build/도감 빌더로 재생성했다. BUG_LOG 양쪽 기록을 보존했다. AGENTS의 해당 섹션에 같은/연관 작업의 기존 Codex 세션 우선 재사용과 필요한 이관 범위만 한 문단 추가했고 모델·검증 지침은 변경하지 않았다.

## 이번 짧은 검증

- BGM 7개 blob·전체 MP3 decode/길이, 오디오 대역 30개, 7개 제목 검사 통과. 원본 바이트는 그대로다.
- `stage11-vector-finish`: 지형·유닛·마커·이벤트·게임 규칙과 다른 29장 보존, 저작 재현/멱등성 통과. `stage11-landscape-art`: 31개 재질 렌더·경로 최대85·저작면9, live battle 불변·prepare 캐시 재사용·무효화/옛 전투 제외 통과.
- 18개 정확한 소스 경계: renderer/party-rig/portraits/objectives/combat은 master28과, BGM 소스는 adadf16f와, 11장 campaign/재질/저작 소스는 9b69f1f2와 byte 단위 일치. 실루엣 개선과 기존 초상화를 보존했다.
- 실제 Chromium: 타이틀 main → 1장 battle1 → 9/10장 battle3 → 11장 battle4 → 21장 battle1의 곡명/currentSrc/currentTime/스트림1개, Workshop 실제 재생 후 Stop 해제 통과. 페이지 오류0.
- 승인 원자료의 서쪽/중앙/피난처 일반 배율 및 최대1.65 **재질 PNG 해시 6개가 정확히 같다**. 입력은 `tests/fixtures/stage11-approved-material-pixels.json`에만 작게 남겼다.
- 세 장소의 고정 warm 화면을 각각 한 번 다시 그려 **재질 호출0·타일 build0·world hit+1·screen hit+2** 확인. 시간/FPS를 새로 계측하지 않았다.
- 통합된 공통 build·캐릭터 도감 재생성, web-split 351개 파일 해시/바이트·30장/851라이브러리 재조립·native/embedded 진입/저장 보호·Workshop iframe 연결 통과.
- 전체/중앙/피난처/모바일과 BGM 제목 사진을 생산 Game에서 새로 촬영하고 5장을 모두 직접 열었다. 새 미술을 추가로 변경하지 않았다.

재현: `node tests/bgm-assets.mjs`, `node tests/audio.mjs`, `node tests/music-titles.mjs`, `node tests/stage11-vector-finish.mjs`, `node tests/stage11-landscape-art.mjs`, `npm run build`, `node tools/character-catalog/build.mjs`, `python tools/testing/bgm-stage11-integration.py`, `node tests/web-split.mjs`. 자동 상세 결과는 `_local/reports/bgm-stage11-integration/`의 assets/audio-unit/stage11-preservation/stage11-cache/build/catalog-build/browser/web-split 로그, source-boundary.json, integration-browser.json에만 둔다.

## 부모가 볼 최종 사진

Library 저장은 업로드 전 앱 연결 확인 단계의 네트워크 오류로 실패했다. 파일 생성 전 실패이며 Library ID는 없다. 같은 경로를 반복하거나 결과 불명 업로드를 재제출하지 않았다. 대체 전달은 이미 사용 가능한 검토 브랜치의 아래 native Git 파일이다. 자동 상세 캡처 전체가 아니라 사용자가 요청한 선택 최종 사진 5장만 전달용으로 남긴다.

| 화면 | 원격 파일 | 정확한 Git blob ID |
|---|---|---|
| 11장 전체 | [stage11-overview.jpg](https://github.com/sys8994/honro/blob/551da47f6f5ffc990152a7bcda5de8cd46467c75/review/bgm-stage11-release-20261022/stage11-overview.jpg) | `3e187814c76e00e26035ccf584390d560f97aba5` |
| 중앙 | [stage11-central.jpg](https://github.com/sys8994/honro/blob/551da47f6f5ffc990152a7bcda5de8cd46467c75/review/bgm-stage11-release-20261022/stage11-central.jpg) | `e7e24701eb6e7b36bd3065b27431946093a80e2a` |
| 피난처 | [stage11-refuge.jpg](https://github.com/sys8994/honro/blob/551da47f6f5ffc990152a7bcda5de8cd46467c75/review/bgm-stage11-release-20261022/stage11-refuge.jpg) | `abe81b56e14317b91dadbf44d4511da0f18ca41b` |
| 모바일 | [stage11-mobile.jpg](https://github.com/sys8994/honro/blob/551da47f6f5ffc990152a7bcda5de8cd46467c75/review/bgm-stage11-release-20261022/stage11-mobile.jpg) | `d47fa2683e4271d87be750b45f33bfaab60c4515` |
| BGM 제목 | [bgm-stage11-title.jpg](https://github.com/sys8994/honro/blob/551da47f6f5ffc990152a7bcda5de8cd46467c75/review/bgm-stage11-release-20261022/bgm-stage11-title.jpg) | `5047e172497dbf3b41364482674e1a14030aeca0` |

## 이전 채택 근거와 이번 검사의 한계

기존 분리 계측은 [72a8788f의 승인 인계 기록](https://github.com/sys8994/honro/blob/72a8788f/game/docs/stage11-vector-art-20261022/README.md) 및 해당 evidence의 원자료로 보존한다. 현재 checkout의 자동 상세 자료는 `_local/archive/stage11-reviewed-evidence-72a8788f/`로 옮겼고 Git 이력은 지우지 않았다. 이번 보고서와 같은 실행으로 합산하지 않는다.

부모는 정상 screen hit 재질호출0과 최대1.65 직접 draw의 큰 지속 회귀 근거 없음, 첫 준비 전체 중앙값의 **서쪽 +4.15ms / 중앙 +2.75ms / 피난처 +8.05ms** 증가를 인정한 채택을 완료했다. 이 긴 계측을 다시 실행하거나 추가 미술을 변경하지 않았다. 고정 계측을 동적 FPS 개선으로 부르지 않으며 master의 실루엣 개선을 BGM/11장 미술 성과로 섞지 않는다.

이번 사진은 고정 카메라·진행 fixture, 재생은 짧은 스트리밍 확인이다. 전곡 전체 청취·정상 전투 완주·실기기 성능/청감·Pages 발행을 완료했다고 주장하지 않는다. 부모 최종 확인 뒤의 master 반영/배포는 별도다.
