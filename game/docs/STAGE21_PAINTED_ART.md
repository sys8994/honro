# Stage21 승인 회화·벡터 혼합 시범

2026-10-18 사용자 승인 범위는 Stage21 환경 미술이다. 캐릭터와 HUD는 원래 렌더러를 유지한다. 실제 지형·oneWay·구출/방어/진출·초기 26적/정예5·유한 증원·저장 이벤트는 수정하지 않는다.

승인 시안: `libfile_2af54b6333c88191913f28c61eb1800e`. 분리 원경: `libfile_a93e2070e394819192b020069277c8cd`, 투명 건축 atlas: `libfile_dcad615ed3dc819186fa4ca5f339a79f`, 암반: `libfile_eb051213649081919a8eb09b25a94c8e`.

## 공통 소스

- `shared/assets/environment/stage21/painted.json`: 승인 이미지 파일, 개별 alpha crop과 월드 부착 좌표, 실제 지붕선에 맞춘 스트립 매핑. 배치 대상은 기존 `eup21:` 에셋 ID다. 지붕만 변형하고 처마 아래 창호·문은 곧게 유지한다.
- `shared/runtime/stage21-painted-art.js`: 후경, 건축 스프라이트 캐시, 실제 foundation polygon 안의 암반 재질. 이미지 완료 세대가 월드/화면 캐시 키에 포함되어 초기 fallback이 남지 않는다. 미완료/실패한 이미지는 기존 벡터로 안전하게 표시한다.
- `shared/build.mjs`와 `shared/web-build.mjs`: Game/Workshop/Playtest 공통 모듈과 외부 콘텐츠 해시 이미지. 기존 두 distinct 이전 세대 보존 정책을 사용한다. HTML에 래스터를 넣지 않는다.
- `tools/map-forge/stage21-eupseong-art.mjs`: 기존 SVG fallback과 얇은 발판·기단·연결부. 캠페인 생성기를 다시 실행해 지형을 바꾸지 않는다.
- `tools/map-forge/stage21-painted-assets.py`: 보관 원본 4개 중 3개에서 런타임 WebP와 alpha crop/지붕 매핑을 재현한다. 원본은 `shared/assets/environment/stage21-painted/source/`에 보존한다. 2048×683 원경, 1774×887 투명 atlas, 1152×768 암반과 작은 목재 패치의 합은 약800KB다. 낮은 alpha의 붉은 추출 테두리만 제거하며 새 이미지를 생성하지 않는다.

건축물은 스프라이트별 1536px 상한으로 한 번 준비하고 기존 월드 타일 캐시가 배율별로 재사용한다. 지붕 매핑은 source alpha 상단과 실제 oneWay contour를 연결하고 발은 기존 지면에 고정한다. 성문은 필요한 통로를 별도로 투명하게 잘라낸다. 암반은 서로 다른 crop·크기·회전·불규칙 위치를 가진 세 개의 feathered 카드를 월드 좌표에서 겹쳐 사용하며, 깊이별 어둠도 월드 높이에 고정한다. 실제 단일 지형의 확장 polygon이 미술 클립이며 별도 skirt나 dummy는 없다.

미술은 저장된 landmark의 안정된 에셋 ID로 해석하므로 기존 live snapshot의 벡터 payload도 새 미술을 받을 수 있다. 기하 변경이 없어 map revision을 올리지 않으며 성장·SP·장착·전투 진행을 초기화하지 않는다. 다른 장은 활성 조건 밖이다.

## 집중 확인

Game/Workshop 공통 분리 빌드와 실제 Chromium Game/Workshop Playtest 실행 통과. 기본 .55배율, 최대 축소, 관아 근접1.1배율, 모바일844×390 화면을 `_local/reports/stage21-painted/`에 저장하고 승인 원화와 나란히 비교했다. 기존 캐릭터/HUD를 사용하며, 문루·초가·작업칸·관아·천막·담장과 암반 이미지가 실제로 표시되는 것을 확인했다. 정상 자원 완주 검사는 이번 미술 변경의 근거로 주장하지 않는다.

원 master `993f9df`와 캠페인 바이트/생성 Stage21 데이터 해시(`52fd0e61e73c2dcc9822b5b706e1cc5a53474d7fd1dbcf47ba00efed4e0a5ff9`)가 동일하고 컴파일된 초기26적·정예5·목표ID3개·revision20을 확인했다. 렌더 전후 units/terrain/진행 state 보존, 이미지 미로딩 fallback, 완료 후 월드 캐시 키 갱신, 세 화면비의 극단 팬6위치에서 원경 네 모서리 불투명 coverage를 확인했다. 전체 verify와 다른 장 검사는 실행하지 않았다.

Library 전송 호스트의 CONNECT 403은 원본을 보관한 `ef902f4` Git 커밋을 받아 해결했다. 최종 화면은 Library에 저장했다: 원화 비교 `libfile_80a004aa182c81919588e3888265a62d`, 기본 `libfile_aa622e8b7db081918f1bd1406a0e0576`, 축소 `libfile_5e7719ef8b30819185c29590dedc7009`, 확대 `libfile_0186407652388191aecd8213690a87f2`, 모바일 `libfile_00bd78b07a6c819183702c1aa44c7b49`, Workshop `libfile_13a3110ee880819190b2f2e8f36898e3`.

### 네 미술 항목 마감

대칭 반복을 겹치는 월드 고정 암반 카드와 깊이별 넓은 명암으로 교체했다. 소형 항아리·수레·장작은 기존 vector 경로별 명암/재질을 유지하며 관아는 얕은 석조 cap, 같은 월드 암반의 하부, 측면·접촉 그림자로 연결한다. 원경은 한 번 만든 낮은 대비/채도의 더 넓은 sky canvas로 축소해 물린다. 기하·전투·다른 장은 바꾸지 않았다. 같은 기본/확대 두 화면과 최종 빌드만 다시 확인했다. Library의 기본·확대·원화 비교 항목을 같은 ID의 새 버전으로 교체했다. 앞선 축소/모바일/Workshop 캡처는 이전 미술 revision의 역사 기록이다.
