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


## 2026-10-16 지붕 동선 후속

사용자 재개 지시에 따라 실제 건물5개 지붕을 기존 단방향 플랫폼으로 적용했다. 아래에서 점프로 관통하고 위에 착지하며 기존 내려가기 버튼으로 하강한다. 대청 양옆 낮은 처마 발판을 통해 양방향 기본 이동/점프 경로를 만들었다. 집 내부/지상 길에는 고체 건물 벽을 추가하지 않았다. 발사체 플랫폼 정책과 공통 엔진은 변경하지 않았다.

- `stage24-roof-routes.mjs` / `roof-routes.json`: 네 직업 대청 지붕 횡단 양방향, 처마→지붕 점프, 기존 drop→처마→지면 복귀, 나머지 네 건물별 아래 관통/착지/drop까지20조건. 시작 위치만 둔 적 없는 지형 격리 검수다.
- `stage24-family-browser.py`: desktop/mobile 실제 `#drop` 버튼 두 번으로 대청 지붕→동쪽 처마→지면 내려오기. 시작 지붕 위치를 둔 UI 격리 검수다. `after-{desktop,mobile}-roof-route.png` 추가.
- `stage24-normal-play.mjs` / `normal-play/stage-24.json`: 준비 진입 프로필 + 합법 자동수련, production App/Engine의 이동/점프/발사/상호작용/대기 입력. 현재 UI에 없는 소모품 명령을 제거했다. 전투 HP·좌표·목표·적·지형 주입 없음. 9라운드41행동, 네 명 생존, 유한 증원3/3·7명 진입으로 완료. **Canvas/메뉴/저장이 대역인 Native이며 실제 브라우저 전투나 이전 장부터 연속 캠페인이 아니다.**

처음 정상 진단에서 사당 파동은 기존 이동 등불의 진입점 점유로 끝까지 대기했다. 같은 사당 평탄부의 안전한 저작좌표로 재배치한 최종 소스에서3/3 진입을 확인했다. 점유대기/대체 입구/취소 정책 자체는 변경하지 않았다. 모든 군집/각 파동의 첫 실효 행동·플레이어 대응, 지붕 사선의 최종 교전 승인, Workshop 직접 Playtest 및 부모의 active exact-contract 통합은 아직 남았다. 이전 independent-review.md는 최초 후보 스냅샷에 대한 독립 검토이며 지붕 후속을 승인한 문서가 아니다. master 병합과 원격 발행은 부모가 조율한다.
