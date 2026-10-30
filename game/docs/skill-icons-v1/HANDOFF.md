> 이 문서는 이미지 공급 전 준비 브랜치의 기록입니다. 현재 통합 후보·실제 공급 이미지·집중 검수 3 결과는 [integration/README.md](integration/README.md)를 확인하세요.

# 부모 인계 — 코드 준비 완료 / 이미지 공급 대기

브랜치: `feat/all-skill-image-icons`

- 목록 선행 커밋: `da83d426c72944fc4ddcd3895c38efacac725b56`. 원격 푸시 확인 완료.
- 이미지 연결·검증·브라우저 증거: `4632fb40`. 원격 푸시 확인 완료.
- 기준/현재 master: `be79826869c70ae68950eb8be8a4bd7d187600dc`. 착수 전과 최종 원격 조회에서 이후 변경 없음. master 병합·Pages 배포 미실행.

## 지금 바로 사용할 파일

1. [확정 inventory](inventory.json): 실제 최종 정의 141개 중 현재 제작 대상 `skills` 84개, 제외할 `hiddenLegacy` 57개. 한국어 이름·인물·계통·실효과·경지 1/8 수치·색·현 SVG path·화면 사용처 포함.
2. [범위와 공급 방법](README.md): 4 기본기 + 60 사용 기예 + 20 상시 기예. current ultimate 0, capstone 비기 12. 과거 data.ts 이름/효과와 CLASSES.order를 현 노출 목록으로 오해하지 않는다.
3. 원본 manifest: `shared/assets/skill-icons/v1/manifest.json`. 84개 ID 모두 대기 상태다. 부모 원본 경로는 `shared/assets/skill-icons/v1/{ID}.webp`.
4. [검사 상태](evidence/validation.json), [모바일 57개 확인](evidence/browser-checks.json), [잠금/수련점 추가 2개](evidence/disabled-checks.json), [이미지 파일 크기](evidence/screenshots.json).
5. 실제 화면: [360px HUD](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/skill-icons-v1/evidence/hud-360.png), [가로 HUD](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/skill-icons-v1/evidence/hud-844.png), [360px 상세](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/skill-icons-v1/evidence/modal-360.png), [상시 상세](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/skill-icons-v1/evidence/passive-390.png), [장착 목록](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/skill-icons-v1/evidence/slot-library-390.png), [긴 제목/수련점 소진](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/skill-icons-v1/evidence/sp-exhausted-long-title-360.png). 모두 실제 원본 PNG이며 파일당 1MB 미만이다.

## 대기 상태와 후속 행동

**대상:** 위 manifest의 정확한 84개 ID와 해당 WebP 파일.

**대기 이유:** 부모가 이미지 제작·SOP·최종 미술 검수를 직접 담당한다. 이번 실행에서 그림 생성·편집·창작을 하지 않았고 새 스킬 그림은 0개다. 권한 거부나 결과 불명은 없다.

**완료한 작업:** 전수 추출, 안전한 SVG 폴백, 일반 UI 아이콘 보존, DOM 상태/접근성, 실제 보이는 화면의 지연 로드·디코드 캐시, 32~36px HUD 실그림 영역, 기존 조작/맵 영역 보존, 공통 빌드 연결, 필요한 검사와 실제 모바일 Chromium 확인, 브랜치 커밋·비강제 푸시.

**부모의 다음 행동:** SOP에 맞춘 84개 그림을 공급하고 각 항목의 파일 SHA-256과 `status: ready`를 기록한다. 실제 공급 그림을 모바일에서 식별성/표식/스타일 최종 검수한 뒤에만 `artReview: approved`로 바꾼다. `node tools/skill-icons/manifest.mjs`가 exit 0 / complete true가 되어야 전체 이미지 완료다. 지금은 **exit 1 / complete false**가 정상이다. `--allow-pending` 구조 검사 및 일반 빌드 성공을 전체 완료로 대체하지 않는다.

**남은 한계:** 실제 공급 미술과 전체 84개 이미지의 최종 빌드/미술 검수는 대기다. Chromium 모바일 에뮬레이션을 사용했으며 실물 기기와 Safari는 확인하지 않았다. 기존 WebP를 임시 라우팅한 transport fixture는 성공/404/캐시를 검사한 것으로 스킬 그림 공급이나 미술 승인 증거가 아니다. 부모의 최종 미술 검수 전에는 master 병합 및 배포하지 않는다.
