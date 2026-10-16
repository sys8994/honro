# 24장 「휘겸의 문장」 미술 검수 후보

기준 master: `d7c1f8457dd33decda5481c7c3b57d8505f6f157`.
브랜치: `codex/stage24-place-review`. 사용자 미술 승인 전 후보이며 master 병합/Pages 배포하지 않았다.

실제 브라우저 이미지: `before/after-desktop/mobile-{overview,family-hall,rear-garden,shrine,two-entries}.png` (20개). 동일 viewport·요청 카메라로 실제 Game을 렌더했다. `browser.json`의 `views`는 최종 프레임의 실제 camera x/y/zoom과 storyTween=null을 기록한다. 미니맵·HUD·목표 안내를 숨기지 않았다. 별도 신규 브라우저 프로필만 사용했다. 사용자 저장은 읽거나 수정하지 않았다.

공간은 바깥 행랑마당, 가문 대청 기단, 낮아지는 후원과 짧은 측면 회랑, 뒤 사당, 낮은 물길 입구와 높은 지상 기록실 입구 순서다. 사당은 가문의 조상을 모시는 공간이다. 물길 입구 평면은 x5590–6040/y2720, 지상 입구는 x6410–7000/y2440으로 두 동행의 판정 원을 비웠다. 종이/선택 문서 UI를 추가하지 않았다. 흙·암반은 실제 지형 윤곽 안의 큰 명암면과 얕은 기단으로 처리했다.

`tools/map-forge/stage24-family-compound.mjs`는 이 장만 재생성한다. 기존 빌드가 구형24장 추가 발판/증원을 재주입하는 두 생성기에 `stageId===24 && honroFamilyCompound24Revision===1` 제외를 추가했다. 다른 29장 및 그 장들이 참조하는 자산은 그대로다. 최초 적18/정예4, 행동 상한3, 유한 증원2+3+2와 기존 ID·트리거 순서를 보존했다. 등장 위치는 새 장소로 접지했다.

검사:
- `node tests/stage24-family-contract.mjs`: 기준 전체 프로젝트에서 단독 생성기 exact 재생, 다른29장/공유 자산 불변, 목표 순서/초기 편성/유한 증원 인원 보존. `exact-delta.json`에 변경 소스와 HTML 바이트 SHA256.
- `node tests/stage24-family-routes.mjs`: 네 체형의 주 동선 왕복과 선택 회랑 왕복. 유한 이동/점프/대기만 사용하며 시작 이후 좌표/자원 수정 없음. **적 제거·첫 위치 배치·문 개방한 지형 격리 검사**이고 정상 전투 완주가 아니다. `routes.json`.
- `python tests/stage24-family-browser.py`: 실제 desktop/mobile 전후 화면, 두 입구 동행 방문 latch, 중복 목표 방지 및 실제 reload/Continue 지형 보존. **목표 선행 플래그/동행 위치를 둔 판정 격리 검사**이고 정상 연속 캠페인이 아니다. `browser.json`.
- `node tests/evidence-pickup-p0.mjs`: 기존48개 확보거리/소유/누락 저장 복구 회귀 통과.
- `node tests/field-evidence.mjs`: 실제 물증 소유·대조·NPC 인계 회귀 통과.
- `node tools/environment/validate.mjs`: 30장 환경 오류0.

남은 검수: 정상 자원 전투, 모든 군집/각 파동의 실제 전술 영향과 첫 실효 행동, Workshop 직접 Playtest, 독립 미술/교전 검수, 사용자 장별 승인. 승인 후 역사 runtime/campaign exact 역변환 체인 통합이 필요하다. 기존 immutable fixture는 바꾸지 않았으며 이 브랜치에서 전체 runtime-contract/verify 통과를 주장하지 않는다. 기존 binding-detail/migration/integration 실패를 완화하지 않았다.

참고 조사: 정부 공식 Korea.net의 충효당/양진당 기사 https://www.korea.net/NewsFocus/Culture/view?articleId=135173 를 확인했다. 기사에서 연결된 실제 사진은 executor 다운로드 HTTP403으로 중단되어 **사진 픽셀 검토 미완료**다. 우회/URL 추측/외부 사진 복제는 하지 않았다. 기존 프로젝트의 한국 건축 벡터 원형을 재사용했다. Library 업로드 도구/스킬은 이 worker에서 현재 제공되지 않아 사용자가 요청한 대안인 이 branch `review/` 경로에 PNG를 보존한다.
