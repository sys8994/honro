# 1막 3장 온전한 한옥과 실제 지형 — 2026-10-18

기준 master는 현재 장 우선 로딩/진입 게이트가 포함된 `4d99ec4`다. 3장 창고 고지의 그림·실제 지형을 함께 개편한다. 휴식터 `b33e2cd5f44efd78231e41cc3c086aaa55f0c67a`는 별도 브랜치에 보존하고 포함하지 않는다. 부모 미술 검토 전 master/Pages에 반영하지 않는다.

## 구조와 저작 원본

이전 구현은 warehouse.webp의 중앙 기와/벽을 세로 strip으로 잘라 기존 지붕/벽체 높이에 맞췄다. 이제 그 경로와 별도 인공 기초를 제거하고, 온전한 한국식 건물 원본1536×409를 단일 균일 축척으로 표시한다. 원본 처마·기와·기둥·문간·주춧돌 비례를 유지하며 그림을 잘라 늘이지 않는다.

- 건물: x4850 / y1368.46875 / width1200 / height319.53125. 원본 종횡비3.75550122249와 동일하다. 기존 `ferryHall` WebP를 그대로 공유하며 새 이미지를 생성하지 않았다. 한 번 보정한 그림을 전체 경계를 가진 장식 레이어에서 그려 정적 world tile의 하단 잘림을 막는다.
- 지붕: 원본 주요 능선/처마 전환15점을 세계 좌표로 변환한 `warehouse-roof` one-way. 두께24인 발판이며 벽체 전체를 solid로 막지 않는다. 미세한 끝 뿔은 장식으로 두고 충돌을 고밀도로 추적하지 않는다. 기존 debugTerrainOutline의 노란 윗면이 실제 주 곡선을 따른다.
- 지면: 기존 ferry-ground의 x4350~6220만 완만한 사면과 창고 한 동의 터로 다시 저작했다. 약x4920~6020의 터는 y1684~1678의 완만한 배수 구배이며, 양옆은 자연스러운 사면으로 잇는다. 여러 계단식 테라스·검은 직사각형 기초·긴 공중 말뚝을 추가하지 않는다. 그림의 원래 돌 주춧돌이 이 지반에 닿는다.
- 접근: cargo-step-1은 x4450~4690/y1796~1807, cargo-step-2는 x4680~4920/y1620~1635로 다시 저작했다. 기존 나무 발판은 유지한다. 기본 이동/점프만으로 지붕에 오르며, 장부는 지상 문간에서 접근한다.
- 접지: ledger ID/x5650은 유지하고 y1682.7223에 놓는다. 주변 지상 적2명의 y/spawnY, rest/sector/서식 marker 높이, material surface/bottom, 장식 support/anchor를 새 지면에 맞췄다. 비기능 출구 문 그림은 기존 출구 근처의 평탄한 x6320으로 옮겨 사면 위 공중 밑동을 피했다. 적의 역할/HP/기예/XP·이벤트/대사·휘겸 그림은 바꾸지 않는다.

`tools/map-forge/stage3-hanok-terrain.mjs`가 저작 원본이다. `apply-stage3-hanok.mjs`로 canonical `shared/data/campaign.json`을 갱신하고 공통 `shared/build.mjs`에서도 같은 author를 적용한다. source에 재적용해도 동일한 idempotent 결과다. Game/Workshop/Playtest는 같은 데이터다. 생성 web/data만 고치거나 렌더 좌표만 이동하지 않는다.

다른 장 canonical 데이터, 나루 중심 dock-west/mid/east·ferry-side-gangway·ferry-water, 소굴 기능 및 사건 ID는 그대로다. `main.js`, `campaign-entry.js`, `web-loader.js`, `web-build.mjs`의 현재 장 로딩/진입 계약도 미수정이다.

## 진행 중 저장

`campaign-map-revision.js`에 3장 revision1을 추가했다. 글로벌 campaign/schema revision20과21~30의 기존 장별 revision은 유지한다. 이전3장 전투만 기존 obsolete→preserveGrowth→discard→Continue/restart 경로로 폐기하고 같은 장 입구에서 새로 시작한다. 획득 XP·SP/배분·장착·클리어 기록은 보존한다. 같은 revision3장과 Workshop 보호 기록은 이 폐기 대상이 아니다.

## 필요한 확인과 한계

- 최종 build 성공. 실제 Chromium1440×900의 창고 화면과 동일 카메라 debugTerrainOutline 화면만 확인했다. pageerror0·렌더 전후 전투 JSON 동일·원본 종횡비 동일이다. 타일 경계에서 하단이 잘리는 표시 문제 수정 후 이 두 화면만 갱신했다.
- 일반 stage3 entry 경지/기본 랭크의 적 없는 국소 fixture에서 접근지면x4705→일반 점프→cargo-step-2→일반 점프→warehouse-roof→장부 위 지붕→일반 내려가기→지상 장부 상호작용을 확인했다. 이동력1172 중1105.813 사용, HP/기력 유지, ledger 획득 true다. 특수 스킬은 사용하지 않았다. 이는 해당 구간의 물리/접근성 확인이며 전체 전투 완주 증거는 아니다.
- 이전 master의 실제 canonical3장 지형으로 만든 campaign save(revision0)를 production App 로드/Continue에 통과시켰다. 전투가 폐기되고 x330 입구/revision1로 재시작했으며 battle에 획득한 XP17과 기존 SP·배분·장착·전체 클리어 기록을 보존했다. 검사 대역은 DOM/스토리지/프레임만 대체하고 기존 새 bootstrap을 노출하는 국소 harness를 사용했다. loader/진입 코드는 수정하지 않았다.
- 다른29장 데이터와3장 물/잔교/이벤트의 source 불변을 비교했다. 다른 장 전투·전체 verify·기예 전체·반복 캠페인 검사는 실행하지 않았다.

증거: `_local/reports/stage3-hanok-terrain/route-save-checks.json`, `render-checks.json`, 실제 PNG2개.

| 화면 | Library ID | 버전 |
|---|---|---|
| 온전한 한옥·새 창고 터 | `libfile_4502fd1baff88191878a68a2ded967f8` | v3 |
| 동일 카메라 지붕/지반 debug 윤곽 | `libfile_85f25bca0d84819199997790dddddffd` | v0 |

앞선 나루/모바일 그림은 해당 시점의 역사 자료다. 이번 검토용 최신 창고 그림은 위 v3이며, 새 모바일/나루 장면을 추가로 검수한 것으로 표현하지 않는다.
