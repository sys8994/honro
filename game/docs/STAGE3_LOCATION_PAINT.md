# 1막 3장 장소 회화 — 2026-10-18

기준은 최신1장 뿌리/가지 접합 및2장 흙길·암괴 구도가 배포된 master `866defa41e1ec674e37367833d7dbf17717fa682`다. 이번 작업은 3장만 적용하며 4장은 시작하지 않는다. 실제 화면을 부모에게 먼저 전달하고 master/Pages 반영은 후속 확인 뒤 결정한다.

## 구현

`shared/runtime/stage3-location-art.js`가 기존 공통 Scene에 3장만 opt-in한다. 1·2장 미술 모듈·캐릭터/적 미술·startup·motion demo를 수정하지 않는다.

- 원경: 2장의 `valleyFar`(mountain-wet-valley)를 공유 요청하고 별도 3장 캐시에서 넓은 강 쪽 프레임을 만든다. 원본 비율을 유지한 파노라마와 기존 `act1BackdropFrame`의 작은 시차를 사용하며, 월드 사각형 확대나 추가 먼 세부 요소는 없다.
- 지면: 실제 ferry-ground polygon 안에 흙과 진흙을 기본으로 그린다. 기존 scree/rock/gravel/stone-road surface 분포의 동쪽 구간에만 광물 재질을 섞는다. 서쪽/중앙을 거대한 암반 벽지로 채우지 않는다. 실제 granite 두 개는 원래 collider 안에서 각각 하나의 광물 면과 약한 자체 명암으로 그리며 깊은 지면 fade를 적용하지 않는다. 최신 마감은 흙 카드의 입자 크기를 줄이고 중앙 수면 주변만 별도의 낮은 대비 진흙층으로 처리해 제방·물가·암괴를 구분한다. 캐시를 만든 뒤 매 프레임 필터를 실행하지 않는다.
- 잔교: dock-west/mid/east와 side-gangway는 실제 윗면·아랫면 polygon에 맞춘 낡은 판재/가로보를 사용한다. 말뚝과 짧은 받침은 실제 ferry-ground에 붙는 얇은 장식이다. 잔교 사이 빈 틈을 메우지 않는다. cargo-step-1/2도 같은 판재로 읽히며 기존 oneWay/파괴 여부/HP를 유지한다.
- 중복 지지물: 기존 `supports()`에는 3장 새 painter가 준비됐을 때만 빠지는 guard를 넣었다. place3-*-dock-posts, side-gangway-rig, cargo-trestle의 낡은 중복 그림을 suppress하고 3장 지지물을 한 번만 그린다. 1·2장의 코드는 그대로다.
- 창고: 새 한국식 목조 창고 원본을 몸체와 기와 재질로 나누어 쓴다. 실제 warehouse-roof의 모든 윗면·아랫면은 그대로이며, 기와는 그 polygon 전체 안에 clip한다. 몸체 상단은 실제 지붕 아랫면에, 평평한 바닥은 기존 창고의 지지 높이1612에 맞추고 아래는 경사진 제방에 닿는 개별 목재 기둥·작은 돌 받침으로 잇고 지지대 사이 공간은 비워 둔다. 처마 끝은 실제 윗면을 유지하면서 그 아래 기와 끝만 자연스럽게 좁혀 수직 직사각형 잘림을 없앤다. 창고 앞 장부 marker는 원래 위치/상호작용이다.
- 건물/장식: 서쪽 workbay는 별도의 작은 하역 움막, waterShrine는 작은 목조 나루 제당, 출구 courtyard는 같은 재질 계열의 한국식 목문으로 표시한다. 비상호작용 ferry/brokenDock/refugeeCarts와 중복 reed/scree/옛 창고 그림은 표시만 생략한다. canonical 요소 ID를 삭제하거나 퀘스트 표적/실제 발판을 제거하지 않는다. 거대한 종이·장부 그림을 추가하지 않는다.
- 나무: 서쪽 두 그루와 창고 접근 소나무 한 그루만 남긴다. 몸통/수관과 가지 접합은 기존 support 중앙 anchor를 유지하고 source .855 아래 뿌리만 실제 지형의 여러 접점까지 늘인 뒤 support polygon으로 매몰 부분을 가린다. fc-choice-3-warehouse-side-pine은 1장의 최종 갈회색 수피와 한 단계 선명한 실제 윗면을 공유한다. 나무는 정적이다.

새 원본 PNG는 `shared/assets/environment/stage3/source/`, 외부 WebP와 alpha/roof metadata는 같은 stage3 폴더다. `tools/environment/stage3-location-assets.py`가 크롭·해상도·WebP·manifest를 재현하고, `painted-pilot-assets.py`가 공통 manifest에 연결한다. 실제 원본 픽셀을 확인했다. warehouse1536×409/246,758bytes, shrine512×413/57,850bytes, workbay1024×455/146,858bytes다. 3장에서 필요한 이미지만 요청하고 보정/정적 지형은 기존 bounded world tile/screen cache를 사용한다. 매 프레임 filter/노이즈/이미지 생성은 없다.

## 보존과 최소 확인

canonical `shared/data/campaign.json`은 master와 동일하다. ferry-ground, dock-west/mid/east, cargo-step-1/2, warehouse-roof, ferry-side-gangway, fc-choice-3-warehouse-side-pine의 geometry·oneWay·파괴 여부, marker ledger·홍만 장부 상호작용·대사/퀘스트·휘겸/나루장승/적·mapRevision20·성장/SP/저장 계약을 유지한다.

ferry-water의 실제 surface는 `(1900,2435)→(3000,2435)`이며 기존 물리/수면 renderer를 그대로 호출한다. 독립 motion demo를 게임에 통합하지 않았다. 렌더 전후 전체 전투 JSON이 동일하므로 지형·이벤트·물 범위가 그림 때문에 수정되지 않았다.

필요한 수정 뒤 빌드하고 실제 Chromium 대표 세 화면만 확인했다. pageerror0이다.

| 화면 | viewport | x/y/scale |
|---|---|---|
| 나루 중심·세 잔교·작은 제당 | 1440×900 | 2450 / 2040 / .48 |
| 창고 몸체와 실제 지붕·화물 접근 | 1440×900 | 5300 / 1450 / .70 |
| 모바일 소나무/발판 접근부 | 480×900 | 4450 / 1650 / .50 |

이 화면은 지정 카메라의 실제 production renderer이며 정상 전투 완주 증거는 아니다. 전체 verify·전체 기예/전투·다른 장 순회는 실행하지 않았다. `act1-spatial-art.js`의 변경은 3장 support 중복만 막는 guard이며 1·2장 미술 소스는 미수정이다.

증거는 `_local/reports/stage3-location-paint/checks.json`과 실제 PNG3개에 있다. 기존 Library ID를 replace했으며 나루/창고는 v2, 모바일은 v1이다. v0는 초기 WIP 화면으로 보존된다.

- 나루 중심: `libfile_14a1d8a4b7608191911e5402e5f486b5`
- 창고/지붕: `libfile_4502fd1baff88191878a68a2ded967f8`
- 모바일 접근부: `libfile_30a50d03689c8191b82c79c30aff79ef`

작업 브랜치만 commit/push하며 master 병합·Pages 배포는 아직 진행하지 않는다.

최신 master와 보존 WIP c9eef567를 같은 계보로 합쳤다. 1장 painted-pilots/stage1 모듈·2장 location/airborne 모듈·canonical campaign·startup/main/web-build·motion demo는 최신 master와 동일하다. 겹친 문서 기록을 모두 보존하고 빌드 생성물 충돌은 합친 소스에서 재생성했다. 이 마감에서 실제 Chromium 나루/창고/모바일 세 화면만 확인했으며 전체 전투·기예/다른 장 검사는 반복하지 않았다.

부모의 두 가지 후속 지적만 마감했다. 청록색 선 집은 기능성 `hauntHabitat`의 기본 building fallback이었으므로 해당 ID/출현 기능은 그대로 두고3장 그림만 작은 식생 흔적으로 바꿨다. 나루와 창고 두 카메라만 갱신했으며 최신 결과는 `eave-footing-checks.json`에 있다. 실제 지붕 윗면/충돌·marker ID·mission/성장 원본은 미수정이다.
