# 기존 휴식 아트 복원과 동행 존재 — 2026-10-27

기준 공개 master는 `bdb6fe6f1c1531c6ebfdaf60569c455ba307c437`이다. 전투 누수의 원인은 종료하지 않은 본전투가 아니라 휴식 관찰 preview가 복제 전투를 생성해 원래 SVG를 Canvas로 교체한 경로였다. 마지막 render 인자 true는 paused이며 전투 표시를 숨기지 않았다. 전경의 반투명은 선택대사 없는 disabled 버튼에 전역 opacity .35가 적용된 별도 문제였다. 사용자 저장은 읽지 않았다.

## 수정

- `HonroJourneyArt.scene`의 원래 공유 SVG, 원경 이미지, 건물·지면·소품·불/날씨와 휴식 모션을 그대로 사용한다. 휴식 진입/대화 후 재렌더에서 21/23/24/30의 전투 preview 호출과 구현을 제거했다. 휴식용 새 Scene/Engine/scenery 렌더러는 없다.
- 기존 3막 야외 판정 `HonroEnvironment.act3Palette`의 지리 범위를 재사용해 원래 SVG 색상과 기존 원경 이미지의 색 전달만 황토/흐린 낮으로 바꾼다. 22장 실내와25/27장 지하는 그대로다. 새 그림·문장·지형·사물 배치를 만들지 않는다.
- 존재 판정은 실제 전투 저장의 영웅 units를 우선 참고하며, 분리 진행은 공개 `HonroSplitCampaign.roster(id,version)`를 따른다. v2의24/28은 전원,25/27은 설오·담허,26은 휘겸·소단이다. v1의25 휘겸·담허/26 설오·소단/27 전원을 유지한다. 일반 장은 실제 authored player spawn 목록이다. 지연 로딩 catalog에 동일 spawn에서 만든 읽기 전용 playerRoster를 전달한다.
- 모집 여부와 장내 존재는 별도 필터다. 임시 party 선택이나 선택대사 유무로 존재를 결정하지 않는다. HP0/dead는 숨김/alpha 대신 별도 전투불능 상태로 표시한다. 부재 인물의 버튼/캔버스/이름/말풍선/포커스 타깃은 DOM 자체를 생성하지 않는다. 실제 있는 인물은 disabled여도 opacity1이며 대화 버튼은 계속 비활성이다. 다른 disabled 버튼 규칙은 유지한다.
- 원래 휴식 그림은 가문 문장이나 현장 묶음/NPC의 실제 관측 증거가 아니다. 퇴역 Canvas preview 플래그를 새 관측으로 소비하지 않는다. 실제 stage history의 run/proof만 읽으며 기록/성장/장비/완료나 사용자의 저장을 초기화하지 않는다.

## 선택문 경로의 남은 제약

아래는 최초 hotfix 시점의 보류 기록이다. 후속으로 부모가 확정한 실제 문장 관측 전 선택5행/소단 휴식1행 연결과 해결 결과는 [24장 현장 선택 접근](story/CH24_FIELD_CHOICES_20261027.md)을 따른다.

24장 승인된6개 ID `EDGE.OPTIONAL_24_ARCHER_0`, `EDGE.OPTIONAL_24_MAGE_0`, `EDGE.OPTIONAL_24_KNIGHT_0`, `EDGE.OPTIONAL_24_KNIGHT_1`, `EDGE.OPTIONAL_24_KNIGHT_2`, `EDGE.OPTIONAL_24_OCCULTIST_0`의 원고/메타데이터는 보존한다. 최초 휴식에서는 실제 문장 관측이 없으므로 전원 표시하되 이 선택문은 잠긴다. 23장 실제 wagon familyCrest/safe proof만으로 현재 저택의 문장을 봤다고 만들지 않는다.

현재24장 필수 소개는 휘겸의 문장 근접에서 먼저 발생하고, `proof.familyCrest`는 `done['family-crest']`와 실제 접지·근접 이후 생긴다. 승인된 선택문 조건은 본편 가문 소개·분할 이전이며, 이미 확인한 질문을 반복하지 않아야 한다. 따라서 기존 현장 대화(현재2막만)의 대상으로 단순 확장하면 승인 시점을 위반한다. 이번 긴급 수정에서 새 모달/대사/필수 진행 gate나 소개 순서를 만들지 않았다. **이6개 선택문의 새 현장 접근 시점은 부모의 조건 판단이 필요한 미연결 항목**이다. 필수24 소개/문장 확인/두 경로/분할/출발은 유지한다.

같은 이유로 물리 현장을 직접 요구하는21장 pre-rescue 선택6행,23장 `EDGE.OPTIONAL_23_OCCULTIST_0`,30장 `EDGE.OPTIONAL_30_OCCULTIST_0`도 generic 휴식 그림으로 관측을 새로 만들지 않는다. 실제 이전 장 기록을 회상하는23장 설오/담허/휘겸과30장 담허 등은 기존 승인 조건으로 계속 접근한다. 이 제한을 원고 삭제/검수 완료로 처리하지 않는다.

## 집중 검증

`tests/rest-presence.mjs`: 실제 authored/v2/v1 roster와 HP 분리/프로필 무변경, 이전 master SVG와 path geometry·원경 href 동일,22/25/27 내부 palette 완전 동일을 검사한다. `tests/rest-presence-scenery-browser.py`: 실제 Chromium 390×844에서24장 증거 없음/23장 실제 선행 proof 있음/낡은 Canvas 플래그 있음, 전원 불투명·관찰 선택문 잠금, 대화 후 재렌더, 여정첩 왕복, localStorage 여정 재개,25–28 실제 편성/v1/전투불능,21/22/23/30의 원래 SVG와 전투 모델 생성0을 확인한다. 프로필/이전 proof는 fixture이며 사용자 저장이나 정상 캠페인 완주 검사가 아니다.

`npm run build`, game typecheck와321 canonical source 보존을 별도로 확인한다. 기존 `tests/rest-journey.mjs`는1장 interlude의 옛 배열 전제로 실패한다. 고정 기준 master의 rest-journey.js로 교체해 같은 `actual=[] / old expected arrival` 불일치를 재현했으므로 이 긴급 수정에서 관련 없는1막/전체30장 검사를 고치지 않는다. 실제 전후 화면은 `_local/reports/rest-scenery-hotfix/`에 저장해 직접 확인한다. 공개 브라우저/Pages 결과와 Library ID는 발행 후 별도 결과로 보고한다.
