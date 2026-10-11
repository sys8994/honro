# 퀘스트·대사 통합 체크포인트 · 2026-10-11

## 소스와 산출물

- 기준: `b9dd992` (아래점프 포함). 통합 브랜치: `feat/quest-story-integration-20261011`.
- 최종 제품 소스/HTML 검수 기준: `b3ef194`. 이후 변경은 검수 문서와 테스트만 포함한다.
- Game: `HONRO.html`; Workshop: `HONRO_WORKSHOP.html`. 하나의 shared manifest에서 함께 빌드했다.
- 세부 승인안 추적: `QUEST_STORY_REDESIGN.md`, `ACT23_QUEST_STORY_REDESIGN.md`.

## 통과한 로컬 검사

- TypeScript, Game/Workshop 빌드.
- `npm run test:quest-story:contracts`: 11개 스크립트. 분기35 synthetic 계약, 소단/초기화18계약, 생산 App30그룹, 1막/2·3막 본문·목표·미술/맵 저작 계약 포함.
- `narrative-runtime-edges`: 최종19계약. 15장 배수 후 실제 하부 지지면의 전체 초기 roster 안전 활성화도 확인했다.
- `act23-route-geometry`: 12/15/29 × 두 길 × 네 직업24경로의 기본 보행/도약 피해0; 13/16/30 A/B 전24명 compiler→sanitize 진입 좌표 exact.
- `story-direction`: 30장 정상 입장, 기존 큐와 완료 대사 합성, 이동/포즈 순서, skip/저장 재개 계약.
- `story-staging`, `story-rewrite`, `journey-content`, `natural-dialogue`, 목표 안내39계약, camp-persistence11건, rest-journey9그룹, playtest-template.
- 실제 생산 Scene Native 8장면 및 읽기 전용 렌더. 5장 고리/바닥진,10장 몸/별도 주박/중복 이름 제거,19장 사람에 맞는 유품 비례,20장 회수 인물,24장 약도,30장 운송선 등을 직접 확인했다.

## 증거의 한계

- App/VM 검사는 DOM·Canvas·저장장치 대역 및 명시적 상태/배치 fixture를 사용했다. 소단의 투사체 충돌은 실제 엔진 코드지만 표적 마무리 피해와 발사 시작 좌표는 fixture다.
- 경로 검사는 적을 제외하고 이동 자원을 보충한 기하검사다. 정상 자원 전투 완주, 첫 교전 난이도 및 분기 간 실제 비용 비교는 확인하지 않았다.
- Native 검사는 실제 Scene 코드의 이미지다. 실제 브라우저 입력/프레임·공식 Pages 검수를 대신하지 않는다.
- 새 버전 30장 정상 플레이, 배포 후 Game/Workshop 직접 검수는 남아 있다.

## 미통과·미완료 회귀

- `npm run verify`: encounter-density 역사 전체 프로젝트 해시 계약에서 중단. 기대 `4e6862fc…`, 첫 통합 실행 값 `4fc3b6fe…`. 합격으로 기록하지 않았고 역사 골든을 완화하거나 덮지 않았다.
- `tests/migration.mjs`: All580 원본 라이브러리 멤버십/순서 역사 계약에서 중단.
- `tests/story-canon-save.mjs`: pre-v0.1 큐 fixture의 기존 대사에 staging/presentation 메타가 붙는 비교 차이. 별도 b9dd992 구저장 3/9 미발생 대사와 진행 중 대사·배치 보존은 새 생산 App 계약에서 통과했다.
- 전체 역사 projection 및 aggregate integration/performance 통과를 주장하지 않는다.

## 게시

master 반영, 기존 GitHub Pages 게시 및 공식 URL 직접 검수는 원격 작성 담당의 승인·배포 흐름으로 이어진다. 이 문서는 게시 성공의 증거가 아니다.
