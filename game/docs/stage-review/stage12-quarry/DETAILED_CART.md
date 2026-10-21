# 12장 버려진 수레 — 기존 공통 rc18Cart의 단일 빈 수레 연결

구현 `886189f8c1412f49409de63f6975a3111a9ac905`, 브랜치 `stage/act2-ch12-detailed-cart`. 기준은 부모가 확인한030902fb다. **큰 갈색 판과 단색 바퀴 결함은 일반/모바일/근접에서 교정 확인했다.** 부모 최종 미술 판정 전 master/Pages는 보류하며13장도 시작하지 않았다. 큰 암면이 있다는 이유로 별도 지형 실패를 다시 선언하거나 전체 재작업하지 않았다.

## 기존 공통 표현의 실제 재사용

단순 Library `cart`를 기존 `shared/runtime/art-dark.js:rc18Cart` 기반의 공통 `builtin:singleRefugeeCart`로 교체했다. `tools/environment/common-cart-art.mjs`는 이 native painter의 정확한 metadata만 등록한다. 12장 파일에는 수레 도형을 만들지 않았고 적 수레 unit도 생성하지 않았다.

실제 원본 rc18Cart는 몸체 한 면·두 바퀴·살·손잡이·짐 덮개로 구성됐다. 첫 연결에서 덮개만 빼자 여전히 판처럼 보여, **공통 empty 옵션 안에서만** 기존 짐칸에 얕은 안쪽/옆면, 테두리·차대·나무 연결과 바퀴 중심을 보완했다. 기본 refugeeCarts의 두 대 호출과 적재 표현은 유지했다. 단일 옵션의 wheel rim/spoke는 원래 공통 stroke를 재질 선으로 보존하며 기존 L1 색 처리는 따른다. 다른 장식의 stroke 정책이나 역할을 바꾸지 않았고 수레를 gameplay 객체로 잘못 분류하지 않았다.

호출은 `applyCommonCartArt` → campaign.library / 공통 build →12장 assetId 참조 → compiler의 native landmark `singleRefugeeCart` → 기존 공통 rc18Cart(empty)다. Game/Workshop/Playtest는 같은 shared/build 목록을 사용한다. 기존 cart와 builtin:refugeeCarts 정의는 수정하지 않았다. 공통 원본 geology/SVG, 후방 지지, 소나무, 스킬 UI도 그대로다.

## 접지와 허용된 국소 이동

새 실제 bounds는 `{x:-60,y:-59,w:168,h:79}`, foot는 `(0,20)`이다. wheel center는 기존 rc18Cart의 -37/36, outer radius20이며 새 규모1.6과 원래 회전0.504165961479153을 유지한다. 이 reference와 회전으로 실제 foot를 다시 맞췄다.

두 바퀴의 접점이 같은 경사 구간에 놓이도록 **장식 부착점만 x7730→7750(+20world)** 옮겼다. 이는 기능 좌표 이동이 아니다. 원래 지지점은 stage12CartSourceSupport에 보존해 author 재실행 때 누적 이동하지 않는다. 현재 지지점은 `(7750,3343.103448275862)`, native 원점은 `(7765.458474973163,3315.0849623870045)`다. 잔석은 원래 지지점을 참조하게 유지하여8030 위치/그림도 바뀌지 않았다. 임무·상호작용·출구·배우·보상·실제 terrain 좌표는 모두 동일하다.

회전된 두 wheel circle의 접점 오차는0과4.55e-13world다. 각 원주720개 표본도 지형에 묻히지 않는다. 최종 화면에서 바퀴·살·차대·빈 짐칸·손잡이를 확인했다. 위 old-road가 뒤 테두리 일부를 가리지만 빈 안쪽과 앞 몸체/두 바퀴/손잡이가 읽힌다. 원래 back 레이어를 유지했으며 무조건 전경으로 올리지 않았다.

## 실제 화면과 판정

`evidence/detailed-cart/`에 before/focus/focus2/final 각7컷, 원본 PNG28장을 보관했다. before의 수레3컷, 두 focus의 수레3컷씩, 별도 final7컷을 직접 열었다. 작업 중 캡처는 capture.json에 미커밋 상태를 기록했다. final은 깨끗한886189f8에서 촬영했으며 pageerror0이다. 소스/원본 PNG 해시와 직접 열어 본 목록은 DETAILED_CART.json에 있다.

| 구도 | 카메라 x,y / 배율 | viewport |
|---|---|---|
| carrier-normal |7850,3550 / .65|1440×900|
| carrier-mobile |7800,3500 / .55|390×844|
| cart-close |7750,3310 /1.2|1440×900|
| center-overview |6500,4200 / 실제 최소 .21176470588235294|1440×900|
| sign-mobile |6520,4800 / .55|390×844|
| west-normal |4300,4670 / .65|1440×900|
| root-joint |7300,4700 / .55|1440×900|

파일명은 `stage12-{구도}.png`다. before/final의7개 카메라 rows가 정확히 같다. 첫 focus는 원본 빈 표현이 여전히 판처럼 보여 실패했고, 공통 empty bed 보완 후 focus2와 final에서 공간을 가진 빈 수레를 확인했다. 최종 길표 모바일/서쪽/상하 접합3화면은 before와 **PNG 바이트 동일**이다(unchanged-views.json). 실제 표식·보행 rim·앞뒤 지지 구조와 인물 가독성의 기존 판정을 보존했다. 이 제한된 소품 교정을 전체 장 재설계나 신규 정상전투 완료라고 부르지 않는다.

## 관련 검사와 저장

- 기존 기본2대 refugeeCarts는 raw/native와 실제 L1 장식 경로,3개 크기/회전 조합의 총6개 픽셀 해시가 수정 전과 같다. 기본2대의 적재물/위치/크기/그림을 보존했다.
- 단일 새 native는 outer wheel arc2개만 출력한다. 기존 rc18Cart를 재사용하며 타장·unit·collision을 추가하지 않았다. 새 asset1개 외 Library 전체 동일, 다른29장 canonical 전체 동일이다.
- 12장은 cart 장식과 그 asset 출처목록만 허용해 비교했고 나머지 canonical 전체가 같다. 컴파일 terrain/worldTerrain/units/heroes/items/markers/기믹/route/상태/revision이 같다. 새 수레 이외의 landmark/element 배열도 동일하다.
- wheel 접점/원주 비매립, Canvas transform/filter/alpha와 battle JSON purity, author2회 동일성과 build가 통과했다.
- 실제 기존 상/하 정상승리 terminal Continue의 terrain/worldTerrain/units/heroes/items/state/route/revision뿐 아니라 **landmarks/elements까지** 그대로다. 성장·SP·장비·기존 전투를 재작성하지 않았다. 구전투의 옛 cart 그림을 강제 이관하지 않는다. 새 자원·발사·적 삭제·승리는 만들지 않았다.

원본 checks.json·author.txt·save.txt·save-checks.json과 build 로그를 함께 보관한다. 저장/렌더 검사가 미술 승인을 대신하지 않는다. 현재 요청 범위의 구체 수레 결함은 교정했으며 전체 stage12 최종 미술/통합은 부모 검수 대기다. 후보에는 이미 master27efe8eb 공통 geology와 스킬 UI 보존 맥락이 있으나 최신 master 전체 merge는 아니므로 통합 시2장 데이터와 생성물 재빌드를 보존해야 한다. 접근 거부나 결과 불명 쓰기는 없다.
