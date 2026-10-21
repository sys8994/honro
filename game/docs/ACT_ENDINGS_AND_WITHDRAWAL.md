# 10장 철수와 막 엔딩 연결 계약

작업 브랜치: `codex/act-endings-sodan-exit`. 부모 최종 검수 전 master/Pages 보류.

## 이미지 경로

`shared/assets/endings/act-1.webp`, `act-2.webp`, `act-3.webp`.
`shared/runtime/act-endings-content.js`의 `image`만 바꾸어 교체 가능하다. 제목/초기 로더에 이미지 preload를 추가하지 않는다. 해당 막의 승리 후일담 진입 때만 요청하며 실패하면 어두운 배경과 텍스트로 계속한다. 가로·세로 모두 contain으로 원본 전체를 보존한다. 원본 PNG는 `_local/archive/act-ending-originals/`에 보존하며 최종 공급 이미지의 Library ID/해시를 이 문서에 기록한다.

부모의 최초 세 이미지는 사용자 반려로 **적용 제외**다. 교체 원본은 version 1로 확인했다. 처음에는 서명 URL 반환을 전송 차단으로 잘못 해석했으나, 부모 지시에 따라 현재 Library skill의 materialization 문서와 원문 helper 두 파일을 읽고 별도 임시 폴더에 저장한 뒤 정상 전송 단계를 실행했다. 최신 version1 transfer object를 변경 없이 stdin으로 전달해 `materialize`를 각 파일에1회 실행했으며 세 건 모두 종료 코드1 / `library file transfer failed: download failed`였다. 원본 파일이 생성되지 않아 실제 pixels/WebP 연결은 미완료다. helper 실패 뒤 추가 다운로드/우회는 하지 않았다.

## 부모 확정 시간 순서 문구

2026-10-21 부모가 확정한 아래5개 줄만 `story-content.js`에 반영했다. 회상/flashback을 추가하지 않았으며 나머지 원문과 `남은 매듭` 수습 약속은 보존했다.

- 소단: `(방울을 내려놓으려다 다시 쥔다) …이제 손을 놔도 돼요?`
- 담허: `천천히 펴보게. 자네가 놓은 원혼은 양옆 받이진으로 들어갔네. 여기서는 잠시 쉬어도 되네.`
- 휘겸 첫 발언: `뒤따르는 기척은 없소. 잠시 숨을 고릅시다.`
- 휘겸 동쪽 흔적: `새 무리는 동쪽 외문을 넘어왔소. 마당까지 산길의 진흙이 이어져 있었소.`
- 마지막 서술: `소단이 굳은 손가락을 하나씩 폈다. 잠시 숨을 고른 뒤, 방울을 챙겨 일행 곁에 앉았다.`

## 진행과 저장

방어6턴 → `sodanWithdrawal.phase=escape` → 생존 플레이어1명 지지면 출구 도착 → `withdrawing` → 짧은 집단 철수 → `safe` → 승리 → 기존 긴 후일담 → 보상·가입/완료 저장 → 막 엔딩4컷 → 다음 막 제목 → 휴식터.

방어 후에도 소단은 받이진을 지키는 역할로 보호되며 출구 확보 시 함께 철수한다. 탈출 도중 기존 적은 정상 행동한다. 의식 습격은 최초+방어1–5턴까지만 생성해 최대6개 파동으로 제한한다. 적 자동 처치/무한 증원은 없다.

엔딩 진행 `profile.honroActEnding={stage,index}`는 완료/보상과 같은 profile에 저장한다. 엔딩 넘김/재개는 보상 함수를 호출하지 않는다. 기존 완료 막에 pending이 없으면 강제 재생하지 않는다. 30장 뒤 `H.nextAct.available=false`일 때 제목에 `다음 여정 · 준비 중`을 함께 표시하며 실제 다음 맵을 생성하지 않는다.

## 확인 기록

- 정상 자원: `node tests/stage10-withdrawal-fullplay.mjs`. 저장소의 검증된9장 승리 profile에서 시작.21턴 완료,15턴 정확한 Continue, 실제 입력58발/피해164회,회복약3개,소단 HP350 생존. 최종 휘겸 위치 (4845.72,2904.29)로 실제 출구 도착. 잔존 적26명을 보존했다. 총4회 실제 생성된 의식 파동 (8/5/1/1명)은 기존28명 동시 상한에 따른 유한 결과다. 보호 후 추가 파동 없음. 외부 unit/resource 쓰기0,강제 복구0. DOM/시계/그림/엔딩 화면은 double이며 브라우저 검사는 별개다.
- 저장: `node tests/stage10-save-preservation.mjs`, `node tests/sodan-withdrawal.mjs`. 동 revision Continue/성장/장착 보존,6턴만으로 완료되지 않음, 실제 지지면 출구 도착, 철수 전 소단 상실 실패, 남은 적 자동 전멸 없음 확인.
- 엔딩: `python tests/act-endings-browser.py` (먼저 정상10장 검사를 실행해 round-21 저장을 만든다). Chromium에서10/20/30장의4컷·제목·휴식터,Enter/Space,중복 click 방지,진입 guard,2컷 reload,성장/장착/가입/완료 exactly once,기존 완료 막 접속 시 강제 재생 없음,4막 준비중 경계 확인. 전투 완료 지점은 명시적 fixture다.
- 집중 검수1: 안전한 후일담 배경에서 실제4인 공통 캐릭터 그림과 대사 위치 확인. 현장 적은 배경에 보이지 않는다. 부모 확정5줄의 안전 철수 후 현재 시점 연결을 확인.
- 집중 검수2: 정상21턴 escape 저장의PC 출구 카메라/목표/미니맵 화면 확인.
- 집중 검수3: 같은 정상 저장의390×844 모바일 출구 목표/동행/HUD,320×568 엔딩 줄바꿈, reduced motion 확인.
- 최종 종합 검수: 코드/정상완주/저장/엔딩 실패 배경 화면은 확인. 교체 이미지3장의 실제 픽셀·각 막 색감·밝은 종이 위 텍스트 대비는 원본 전달 차단으로 미완료. 이미지 검수를 완료로 간주하지 않는다.

전체 로컬 기록은 `_local/reports/sodan-withdrawal/normal-play/` 및 `_local/reports/act-endings/`에 있으며, 정상 완주 trace/출구 저장/핵심 최종 화면은 [`stage-review/act-endings/evidence`](stage-review/act-endings/evidence/README.md)에 커밋했다. 원본 PNG는 helper 다운로드 실패로 포함할 수 없었다. 타입 검사와 HTML 빌드를 통과했다. master/Pages는 부모 검수 전 보류하며 공개 환경 검증은 하지 않았다.

문구 반영 후 `sodan-protection-wording.mjs`의 오래된 현장 후일담/6턴 자동완료 기대를 새 승인 계약에 맞춰 좁게 갱신했고 통과했다. `story-direction.mjs`는 모든 연출 줄 해석/30장 진입 보존 검사를 통과한 뒤 무관한1장 나무꾼 x 기대3178 대 실제3154에서 중단됐다. 이 작업은1장 위치를 바꾸지 않았으며 해당 검사 수리는 범위에 포함하지 않았다. 정상21턴 전체 전투는 반복하지 않았다.

최종 저장 검수에서 진행 중 전투의 `honroNarrativeContent`와 `honroStory`가 구문을 동결한다는 것을 확인했다. 안전한10장 후일담에 한해 부모 확정5개의 정확한 옛 문장만 현재 canonical 문구로 투영한다. 실제21턴 원본 저장으로 첫/마지막 줄을 렌더했고,모든 다른 줄/metadata/대사 cursor/자원은 불변 및 투영은 idempotent임을 확인했다. 이미 완료한 막을 강제 재생하지 않는다.
