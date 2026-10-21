# 10장 철수·막 엔딩 핵심 증거

부모 검수용 후보 브랜치 `codex/act-endings-sodan-exit`. master/Pages는 보류했다. 코드 구현의 최초 원격 저장점은 `10b417fc`다. 이후 부모 확정5줄의 현재 시점 문구와 이 증거 묶음을 추가했다.

## 실제 정상 자원 10장

- [전체 전투 trace](normal-21-combat.json): 검증된9장 승리 저장에서 시작한 생산 엔진/입력. DOM/시계/오디오/엔딩 presentation은 double다. 원본 trace를 변경하지 않고 복사했다.
- [결과](normal-21-result.json):21턴 승리,15턴 Continue 정확 일치,58발/실제 피해164회,회복약3개,외부 unit/resource 쓰기0/강제복구0. 소단 HP350 생존. 남은 적26명 보존,최종 실제 출구 휘겸 x4845.72/y2904.29.
- [21턴 탈출 중 원본 저장](normal-21-escape-save.json): PC/모바일 출구 카메라 검수의 실제 입력 저장이다.
- [승리 profile](normal-21-victory-profile.json): 기존 성장/장착/소단 가입/11장 연결 확인에 사용했다.

이21턴 전투는 최초 구현 검증에서 실행한 결과다. 이후 변경은 출구 표식 우선순위/카메라,부모 확정 후일담5줄과 문서·증거다. 전투/자원/파동/물리를 바꾸지 않았으므로 전체 전투를 반복하지 않았다. 재현 명령은 `node tests/stage10-withdrawal-fullplay.mjs`이며 첫 입력은 저장소의 `game/docs/stage-review/stage09-yard/evidence/normal-victory-profile.json`이다.

## 집중 검수와 최종 화면

1. [안전한 후일담 첫 줄](review-1-safe-outro.png), [마지막 줄](review-1-safe-outro-last.png): 실제 정상21턴 종료 snapshot에서 다시 연 후일담이다. 기존 공통4인 그림,현장 적 없는 화면,부모 확정 현재 시점 문구. 회상 장면을 추가하지 않았다.
2. [정상21턴 저장의 PC 출구](review-2-exit-camera.png): 실제 도착 가능한 지지면,우선순위 출구 표식/카메라,미니맵을 확인했다.
3. [동일 저장의 모바일 출구](review-3-mobile-exit.png), [320px 폭3막 텍스트](review-30-cut1.png): 작은 화면 목표와 줄바꿈,키보드/터치 guard/reduced motion을 확인했다.

최종 흐름은 [브라우저 결과](browser-summary.json)와 [1막 첫 컷](review-10-cut1.png), [2막 첫 컷](review-20-cut1.png), [4막 준비중 제목](review-30-next-title.png)에서 확인한다. `python tests/act-endings-browser.py`로 각 막4컷→제목→휴식터,2컷 새로고침 재개,보상·가입·장비/성장 동일,완료 막 접속 시 미재생,초기 이미지 preload 없음,진입 클릭 관통/중복 pointer-click 방지를 검사했다. 엔딩 흐름 검사에서 전투 완료 상태는 명시적 fixture이며 실제 전투 증거는 위 원본 trace다. 첫/마지막 후일담 최종 PNG는 `python tests/capture-act-ending-outro.py`로 보존된 실제21턴 종료 snapshot에서 재생했다. 전체 전투/보상을 다시 실행하지 않았다.

**이 PNG들은 최종 코드의 실제 Chromium 화면 원본이다. 엔딩 이미지가 없는 안전 fallback 화면이며,제공 이미지의 미술/픽셀/대비 합격 증거가 아니다.** 최종 런타임/문구/컨트롤러 해시는 [final-source-hashes.json](final-source-hashes.json)에 있다.

## 이미지 지원 전송 — 실패, 우회 없음

현재 Library skill의 `references/materialization.md`를 읽고,원문 `library_file_transfer.py`와 `library_hosted_apps.py`를 같은 새 임시 폴더에 저장했다. 최신version1 IDs로 준비한 **complete transfer object를 변경 없이 stdin**으로 전달해 이미지별 `materialize`를1회 실행했다. 세 건 모두 exit1 / `library file transfer failed: download failed`였다. [정확한 대상·상태](library-transfer-status.json)를 보존한다. 원본이 생성되지 않아 readability/pixels/WebP/원본 PNG 보존·커밋은 미완료다. 실패 뒤 추가 다운로드/URL 추측/우회는 하지 않았다. 반려된version0은 사용하지 않았다.

다음 연결 경로는 `shared/assets/endings/act-1.webp`, `act-2.webp`, `act-3.webp`다. 이미지 원본을 실제 소비 환경에 공급한 뒤 압축과 종/기록 구도·3막 밝은 종이 위 하단 텍스트 대비를 검수해야 한다.

## 검사 범위

- HTML build,타입 검사,`sodan-withdrawal.mjs`,기존 `stage10-save-preservation.mjs`,갱신한 `sodan-protection-wording.mjs`,최종 `act-endings-browser.py` 통과.
- `story-direction.mjs`: 모든 연출 줄/30장 진입 보존 통과 후,무관한1장 나무꾼 위치 기대3178 대 실제3154에서 중단. 이 작업은1장 소스/위치를 변경하지 않았다.
- 이미지 미술·실제공개Pages·전30장 전투·사람 전체 플레이 검수는 수행하지 않았다.

최종 저장 검수에서 진행 중 전투의 `honroNarrativeContent`와 `honroStory`가 구문을 동결한다는 것을 확인했다. 안전한10장 후일담에 한해 부모 확정5개의 정확한 옛 문장만 현재 canonical 문구로 투영한다. 실제21턴 원본 저장으로 첫/마지막 줄을 렌더했고,모든 다른 줄/metadata/대사 cursor/자원은 불변 및 투영은 idempotent임을 확인했다. 이미 완료한 막을 강제 재생하지 않는다.
