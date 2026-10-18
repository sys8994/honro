# 4장 피란문 방어 지형·회화 — 2026-10-18

기준 master는 승인 3장 쉼터까지 배포한 `8b7892c99a6208486b5596c4c20cd23b309ab69d`이다. 작업 브랜치는 `art/stage4-gate-defense-paint-20261018`이며 부모 미술 검토 전 master/Pages에 반영하지 않는다. 4장 휴식터와 5장 이후는 미착수다. 실행 환경의 일시적인 exec-server 연결 장애 뒤 실제 shell/파일 접근을 확인했고, 재생성 없이 보존 커밋 `c1e134b`를 먼저 push한 뒤 검증·마감을 이어갔다.

## 장소와 실제 지형

- production canonical의 4600×3500을 출발점으로 삼았다. content.js의 예전 기본 크기로 되돌리지 않는다. 문 앞 흙마당은 y2250, 중앙 배수로·불탄 마당은 최대 y2400, 동쪽 감시대 터는 y2210으로 저작해 과도한 V자 낙차를 완화했다. 실제 단일 확장 지형 polygon과 playProjection 시작점을 함께 갱신한다.
- 한국식 작은 문루·짧은 토석 담은 완전한 gate 이미지를 균일 축척900×353.671875로 표시한다. 실제 피란문 objective는 같은 문짝 중앙 x1030/y2250에 있고, 작은 옛 gate 유닛 그림을 중복으로 그리지 않는다. 공통 목표 이름/표식과 별도의 내구도 막대만 남긴다. 휘겸 메인 인체·대사/스토리·춘례·동행 원본은 그대로다.
- 옛 공중 rock one-way west-step-1/2는 제거하고 west-shoulder를 땅에 닿은 하나의 실제 solid 암반턱으로 다시 저작했다. 낮은 두 어깨를 경유하는 일반 점프 경로와 넓은 사격면이 있다. 새 입구 x690은 암반 오른쪽과 피란문 사이이며 주 방어마당으로 바로 연결된다.
- 동쪽에는 온전한 낮은 감시대420×316.640625를 배치했다. 몸체는 막힌 solid가 아니다. 이미지의 실제 판재층이 east-step-1, 측정한 지붕 곡선이 east-watch one-way다. 옛 east-step-2는 제거한다. 문루 지붕도 gate-roof one-way로 만들었다. 건축을 strip으로 늘이거나 예전 발판에 끼워 넣지 않는다.
- 불탄 마당에는 작은 온전한 붕괴 잔해와 실제 breakable burned-gallery/두 탄 목재 지지대를 둔다. gallery HP280은 유지한다. flank pine 한 그루의 실제 가지는 몸통 부근으로 옮긴다. 가까운 정적 소나무는 두 군락 중심 개체만 남기며 뿌리는 지지면으로 매몰한다.
- 중앙 짐승은 지상 저지선/탄 목재 발판에, 동쪽 사수는 감시대 판재층에, 까마귀는 지붕 위 열린 공중에 배치한다. 스탯·종류·ID·군집 역할과 수량 저작 로직은 보존한다. 기능 없는 옛 refugeeCarts/cliffFace/평면 건물·과밀 나무 시각만 숨긴다. habitat 두 ID/propId/증원 기능은 유지하고 집 glyph 대신 작은 고사목 흔적으로 표시한다. 실제 yard-stone collider는 같은 geometry 안에 그린다.

## 저작·재질·요청 범위

- authoritative 수정은 `tools/map-forge/stage4-gate-defense.mjs`, 적용 CLI와 `shared/data/campaign.json`에 있다. common build도 같은 저작 함수를 사용한다. 공통 ACT1 장면 저작기의 감시대 참조점만 새 4장일 때 터 x3500으로 분기한다. 다른 장 저작 순서는 바꾸지 않는다. 저작 함수 재적용은 idempotent다.
- `stage4-location-art.js`는 새 4장 design에만 opt-in한다. 실제 polygon 안의 흙과 얇은 젖은 상층·중앙 탄 마당·유한 암반턱/개별 돌을 구분하고 깊은 면은 어두운 덩어리로 감쇠한다. 전체 바닥에 같은 암반 카드 한 장을 펴지 않는다. 공용 Stage21 재질과 다른 장 미술은 변경하지 않는다.
- gate/watch/burned는 이미지 생성 도구로 만들고 실제 픽셀을 확인한 독립 한국식 구조다. 전체 비례를 유지한다. 원본 PNG·WebP·manifest는 `shared/assets/environment/stage4/`, 재현 도구는 `tools/environment/stage4-assets.py`에 있다. WebP는 각각1280×503/170,954bytes,1024×772/202,440bytes,1024×383/102,486bytes다.
- 원경은 승인 공유 source의 mountain-still-night를 WebP2048×683/18,634bytes로 준비했다. 낮은 대비를 통해 밤 원본의 어두운 값을 들어 올리고 채도/디테일을 낮춰 3장 뒤 갑작스러운 검은 밤 전환을 피한다. 약한 blur/톤 처리는 고정 원경 canvas에 한 번만 한다. 기존 act1BackdropFrame과 주변 동일 색막을 사용한다.
- 새 자산 네 URL은 4장 표시 때만 요청한다. 다른 장소 원경 전체나 미래 장 자산을 디코딩하지 않는다. App/카메라/물/날씨/캐릭터 모션 루프는 미수정이고 나무 새 모션도 없다. 현재 장 우선 main·entry·loader·web-build는 그대로다.
- campaign map revision은 4장만1로 추가하고 global revision20은 유지한다. 이전 4장 진행 전투만 기존 discard/preserveGrowth/Continue로 새 입구에서 재시작한다. 성장·SP·장착·완료 기록과 1~3장 결과는 유지한다.

## 실제 확인과 한계

필요한 build와 Chromium 실제 전체 구도/방어마당1440×900·모바일 대표390×844 세 화면을 확인했다. 모바일 캡처는 resize가 기존 가로 시야를 보존한 뒤 수동 대표 카메라 x980/y2100/scale.55를 적용한다. 카메라 런타임 계약은 바꾸지 않았다. 9턴 전체 플레이·전체 verify·무관 기예/다른 장 순회는 실행하지 않았다.

- pageerror0, 렌더 전후 전투 JSON 동일. 새 자산 요청4개, 그림/실제 지붕과 판재층 one-way를 확인했다. 정적 카메라12프레임 동안 picture6·soilCards3·farCanvas1·준비 filterPasses10으로 그대로다. 매 프레임 재질 필터나 증가하는 미술 cache가 없다.
- 적을 제외한 국소 이동 fixture에서 서쪽 x690→두 일반 점프→x466 암반 사격면에 도달했다. 동쪽 x3420 지면→판재층→지붕도 일반 점프 두 번으로 도달했다. 이동 비용은 각각392.412/270.134, HP·기력은 동일하다. 전 맵을 한 턴에 건넜다는 증거는 아니다.
- 초기 적 몸체와 기존 runtime 저작이 보정한 두 습격8개체의 스폰을 해당 장에서만 확인했다. 처음 까마귀 한 개체의 one-way 지붕 겹침을 발견해 siege-1에 기존 requireFlightClearance 옵션만 opt-in하고 maxDistance640으로 제한했다. 수정 뒤 지붕 포함 body sample 끼임0이다. 공용 스폰 정책은 미수정이다.
- canonical siege-0/1의 ID·3/7턴·hound/crow·n2와 campaign-goal 의미를 유지한다. 기존 런타임 수량 보정은 그대로여서 국소 spawn 확인에서는 각4개체다. 실제 holdRounds9, round8 미완료/round9 완료 판정, 피란문 사망 시 실패를 직접 조건 fixture로 확인했다. 목표 HP3600과 초기 적→목표의 막히지 않은 지상 사선을 확인했다.
- 실제 이전 canonical4장으로 만든 저장을 production App에 로드해 revision0 전투만 폐기되는지 확인했다. 그 전투에서 추가한 XP17과 SP/장착/완료 기록을 보존하고 Continue가 새 x690/revision1에서 시작했다. 현재 revision 전투는 obsolete가 아니다. 다른 canonical 장 데이터는 이전 파일과 같고, 1~3장 미술/쉼터·startup 소스도 기준 master와 같다.

증거는 `_local/reports/stage4-gate-defense/`의 `render-checks.json`, `local-checks.json`, 세 PNG 및 `library.json`이다. 국소 경로 도구는 같은 폴더 `check-local.mjs`이며 App/DOM harness의 화면 부분은 double, 이동/목표/저장 로직은 production이다. 실제 미술 증거는 별도 Chromium PNG다.

| 화면 | Library ID | 버전 |
|---|---|---|
| 전체 구도 | `libfile_eb1bbee7dbd481919c132215e91c1bcf` | v1 |
| 피란문 방어마당 | `libfile_53d39b781d748191830efe3ec45f7c4c` | v0 |
| 모바일 대표 | `libfile_a52cbd59c5848191be9f7e6cb4290a2b` | v0 |

## 부모 검토 후 줌아웃 지하 질감 조각 제거

같은 전체 줌아웃의 오른쪽 아래 y약720에 남은 작은 삼각형 두 개만 수정했다. 해당 영역의 그리기 pass를 분리해 보니 오래된 장식/스커트가 아니라 gate-basin 재질의 깊이 음영 아래 드러난 soil-card였다. 경사진 각 span의 음영 사각형을 shear할 때 왼쪽 y0만으로 높이를 계산해, 가파른 외곽 오르막의 오른쪽 하단이 타일 아래쪽을 덮지 못했다. 칠 높이를 `bottom - min(y0,y1) + 20`으로 계산하고4장 미술 캐시 키만 갱신했다.

필요한 build와 동일1440×900/x2300/y2050/scale.285 전체 줌아웃 한 장만 확인했다. 문제 영역(1380,700)~(1440,740)의 밝은 질감 픽셀은35→0, pageerror0·렌더 전후 전투 JSON 동일·전투 revision1이다. 화면에서도 두 조각이 사라졌다. 지형/적 배치·다른 구도·기존 이동/스폰 검증은 변경하거나 반복하지 않았다. 전체 구도 Library만 같은 ID의 v1로 replace했고 다른 두 화면은 v0을 유지한다. 증거는 `fragment-pass-diagnosis.json`, `fragment-fix-checks.json`, `fragment-library-update.json` 및 같은 전체 구도 PNG다. master/Pages는 미반영이다.
