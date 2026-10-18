# 5장 폭포 틈의 한 발 — 지형·회화, 2026-10-18

부모가 승인한 4장 쉼터 `272f3c4d`를 master `ecd7c5454e5fdd5bde54d17fece2c48703d0ee00`에 병합·push했다. [Pages run39151682699](https://github.com/sys8994/honro/actions/runs/39151682699)의 completed/success를 확인했다. 승인 tree와 병합 tree가 같아 그 단위의 빌드·검증을 반복하지 않았다. 이 문서의 5장 전투는 해당 master에서 분기한 `art/stage5-waterfall-location-paint-20261018`의 별도 검토 단위다. 아직 master 병합·배포하지 않았으며 5장 쉼터와 6장은 작업하지 않았다.

## 실제 장소와 지형

- production canonical 5300×5000, 기존 lakeRevision1의 동쪽 +900 좌표 계약을 유지한다. 거대한 오른쪽 절벽 위 물길→낙수→깊고 넓은 소가 하나로 읽히도록 배치했다. 주박목 `cliff-cleat`, `waterfall-veil`, `valley-floor`, headwater/plunge pool의 geometry는 이전 canonical과 정확히 같다. 최신 마감에서는 `waterfall-cliff`의 다섯 점 동굴 구멍을 24점의 불규칙한 암굴 경계로 다시 저작했다. 젖은 암반 입구와 안쪽의 어두운 암면은 같은 실제 경계에 맞추며 주박목과 사선을 가리지 않는다. 소를 건너는 발판을 추가하지 않았다.
- 서쪽 `west-overlook`은 소나무 실제 몸통에 붙는 wood one-way 가지다. 단순 공중 rock 사각판을 대체한다. 나무는 정적이며 바닥 경사에 맞춰 뿌리 아래만 늘려 매몰한다. 남은 장식 소나무와 중복 폭포 장식은 숨긴다.
- `ritual-overlook`은 y2520의 단단한 물길진 바위로, 몸체가 아래 지형에 닿도록 전체 polygon을 저작했다. 왼쪽 어깨에서 일반 도약으로 오르고 동쪽으로 내려가 x2120 사격턱에 접근한다. 진 표식, receiver/roost/basin/rest/habitat 지지점을 실제 면으로 옮겼다.
- 변경된 바위와 초기 복제 군집의 몸체가 겹치지 않도록 일부 원본 적 x와 해당 y/spawn점을 정렬했다. 적 ID·종류·수·HP·XP·행동·스킬·스토리·후속 증원은 보존한다. 초기 일반 적 20 + 목표 1이며 설오·담허만 등장한다.
- 저작 함수 `tools/map-forge/stage5-waterfall-paint.mjs`, 적용 CLI, `shared/data/campaign.json`이 원본이다. 원래 Stage5 저작기와 common build도 같은 함수를 호출하며 재적용은 idempotent다. 전역 revision20은 그대로이고 Stage5의 campaign map revision만 1이다. 이전 진행 중 5장만 입구에서 다시 시작하며 성장·SP·loadout·캠페인 완료 기록은 보존한다.

## 회화와 낙수

- `stage5-location-art.js`는 이 새 5장에서만 활성화된다. 공용 Stage21 paintRock를 바꾸지 않았다. 바닥과 물길진 어깨의 실제 polygon 합집합을 하나의 지질장으로 칠해 직사각형 청록 패치와 따로 붙은 대각 접합을 제거했다. 얇은 흙층, 불균일한 큰 암반 카드, 깊은 감쇠를 실제 지형 안에 그린다. 공통 마커의 집 모양만 억제하고 소굴 ID·기능과 기존 풀숲/둥지 흔적은 남긴다. 원경은 공유 wet-valley를 한 번 저채도·저대비 처리하고 act1BackdropFrame 계약으로 표시한다.
- 새 외부 WebP는 유한한 절벽 면 `cliff.webp` 1024×1536/616806 bytes와 낙수 소재 `water.webp` 512×1536/292272 bytes다. `tools/environment/stage5-assets.py`가 보존된 PNG source에서 재생성한다. 절벽은 큰 면 한 장을 단 한 번 배치하고 실제 동굴 polygon으로 잘라낸다. 그림에 가짜 동굴·발판을 그려 collision을 대체하지 않는다.
- 낙수는 원래 `HonroStage5WaterGeometry.closed/opened`와 같은 +900 offset을 쓴다. 두 상태의 곡면 물 소재를 고정 크기 Canvas 2장에 한 번 준비하고, 매 프레임은 해당 상태 카드와 4개 흐름선·2개 작은 포말·3개 파문·짧은 상류/수면 흔적만 표시한다. 소에는 캐시된 얕은 반사띠와 거리별 색 변화가 있고, 수중 사면은 깊은 물색으로 감쇠한다. 물리 경계는 그대로다. 모션 primitive는 22개다. 기존 단일 App RAF와 reduced-motion 시간 함수를 사용한다. 원경·소나무·절벽·물 소재의 필터는 총 4회 캐시 준비에만 쓰며 매 프레임 필터/노이즈/전체 화면 displacement는 없다.
- 닫힌 물은 기존 항력 물리대로 화살 속도를 잃게 하고 아래로 쓸어 내린다. 담허가 물길진에서 실제 ritual을 사용한 동안 열린 곡면과 collider가 함께 바뀌며 진을 벗어나면 닫힌다. 동굴 M09 도착 금지 정책은 그대로다.
- startup 최적화 `4d99ec4a`의 main/current-chapter loader와 web-build 원본은 변경하지 않았다. 새 cliff5/water5는 5장 요청에서만 각각 1회 가져왔다. 다른 장소 미술 요청은 없었다.

## 부모 화면 검토 후 마감 보완

초기 후보 `1a85aa39`의 물리 검증 결과는 보존했다. 부모가 지적한 평면 청록 동굴/서쪽 패치/집 마커/수면만 위와 같이 고쳤으며 새 에셋을 추가하지 않았다. 충돌 변경은 동굴의 경계뿐이다. map revision1은 배포 전 같은 작업 단위이므로 유지한다.

이번 재검증은 build, 같은 전체/서쪽 카메라 두 장(pageerror0, 렌더 battle JSON 불변), 수정 동굴의 동일 A01 30도/80% 닫힘0·열림191 피해/항력/물 solid impact0, M09 동굴 도착 실패, 기존 해안 일반 도약 최대 x2823.34뿐이다. 이전 이동·저장·완료·전체 스킬 검사는 다시 돌리지 않았다. 동굴 외 바닥/서쪽 지지면/목표/유체 충돌 및 다른 장 불변, 저작기 재적용 불변을 짧은 정적 비교로 확인했다. `finish-build.log`, `finish-render-checks.json`, `finish-local.mjs`, `finish-local-checks.json`에 이번 범위를 기록했다.

아래의 최초 3뷰/12프레임/저장·완료 기록은 초기 후보 당시의 검증이다. 모바일은 요청 범위에 따라 다시 캡처하지 않았으며 v0를 이전 후보 화면으로 보존한다.

## 최초 후보 확인 범위

`npm run build`, 원본(source/tools/docs)의 diff 공백 검사, renderer 구문 검사 통과. 생성된 web runtime wrapper의 마지막 빈 줄 경고는 빌더 출력 그대로이며 수동으로 편집하지 않았다. 전체 스킬/전체30장/전체 verify와 완전한 전투 플레이는 실행하지 않았다.

실제 브라우저: 1440×900 전체 폭포(닫힘), 서쪽 가지·물길진·사격 진입 구간, 390×844 열린 물길 3장을 직접 확인했다. 모바일은 담허를 진 위에 놓은 다음 production ritual interaction을 호출한 명시적 화면 fixture다. 정상 전투 완료의 증거로 사용하지 않는다. 페이지 오류 0, 정적 렌더의 battle JSON 불변, 물줄기 영역의 0→0.35초 픽셀 변화, 고정 카메라 12프레임의 캐시 수 불변(pictures2/paths3/far1/waterCards6/filterPasses4)을 확인했다.

Native production App/Engine 제한 확인:

- 적 없는 개별 이동 fixture에서 서쪽 가지 일반 도약 비용94, 물길진 일반 걷기·도약 비용436, 동쪽 사격턱 하강·걷기 비용377.61. 각 구간은 현재 배우 자신의 행동 예산 안이다. 전체 전투·연속 한 턴 경로를 주장하지 않는다.
- 초기 적 20마리의 몸체 샘플이 solid 지형 내부에 없는지 확인했다. 복제 군집 안전 배치 실패와 가파른 면에 묻히는 두 개체를 원본 위치 조정으로 해소했다.
- 실제 물길진 eligibility/use 후 열림과 x130 이탈 후 닫힘을 확인했다. 동일 A01 30도/80% 사격은 닫힘 피해0 + waterfallTouched + vx<2/vy>150, 열림 피해191. 물 진입 시 solid impact는 0이다.
- 기존 M09 두 진목 도착 fixture에서 동굴 진입 실패·배우 위치 불변. 마지막 마른 해안의 일반 도약이 도달한 최대 x2823.34로 동굴 x3970 이상에 닿지 않았다. 소 위 추가 one-way 없음.
- 명시적 목표 파괴 fixture는 같은 라운드 미완료, 다음 라운드 완료. 이전 실제 Stage5 canonical의 저장을 production App discard/Continue 경로로 불러와 성장 획득 XP+17·SP·loadout·clears 보존 및 revision1/x330 재시작을 확인했다.
- 최초 후보에서 Stage5 외 모든 canonical 장, 동쪽 네 핵심 terrain, 적 위치 외 능력 필드·이벤트 불변과 저작기 재적용 불변을 비교했다.

증거는 `_local/reports/stage5-waterfall-location-paint/`의 build.log, render-checks.json, local-checks.json, check-local.mjs에 있다. 실행 스크립트는 명시적 fixture 범위를 기록한다.

## Library 실제 화면

전체/서쪽은 최신 version1로 같은 ID를 교체했다. 모바일은 최초 후보 version0이며 이번 마감 화면이 아니다. 새 Library 항목은 만들지 않았다.

| 화면 | Library ID |
| --- | --- |
| 전체 폭포·깊은 소, 닫힌 낙수 v1 | `libfile_606d6a5fe64c8191af938804e3f9ccbf` |
| 서쪽 소나무 가지·물길진·사격 진입 v1 | `libfile_b0ac10cb82f081918e9dd8fed2c65a19` |
| 모바일 열린 물길 fixture, 이전 후보 v0 | `libfile_cbb0a85ed3148191b8418467417b7dfa` |

부모의 실제 화면 검토 후 배포 결정을 기다린다.
