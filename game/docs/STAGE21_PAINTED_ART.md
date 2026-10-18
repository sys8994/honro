# Stage21 승인 회화·벡터 혼합 시범

2026-10-18 사용자 승인 범위는 Stage21 환경 미술이다. 캐릭터와 HUD는 원래 렌더러를 유지한다. 실제 지형·oneWay·구출/방어/진출·초기 26적/정예5·유한 증원·저장 이벤트는 수정하지 않는다.

승인 시안: `libfile_2af54b6333c88191913f28c61eb1800e`. 분리 원경: `libfile_a93e2070e394819192b020069277c8cd`, 투명 건축 atlas: `libfile_dcad615ed3dc819186fa4ca5f339a79f`, 암반: `libfile_eb051213649081919a8eb09b25a94c8e`.

## 공통 소스

- `shared/assets/environment/stage21/painted.json`: 승인 이미지 파일, 개별 alpha crop과 월드 부착 좌표, 실제 지붕선에 맞춘 스트립 매핑. 배치 대상은 기존 `eup21:` 에셋 ID다.
- `shared/runtime/stage21-painted-art.js`: 후경, 건축 스프라이트 캐시, 실제 foundation polygon 안의 암반 재질. 이미지 완료 세대가 월드/화면 캐시 키에 포함되어 초기 fallback이 남지 않는다. 미완료/실패한 이미지는 기존 벡터로 안전하게 표시한다.
- `shared/build.mjs`와 `shared/web-build.mjs`: Game/Workshop/Playtest 공통 모듈과 외부 콘텐츠 해시 이미지. 기존 두 distinct 이전 세대 보존 정책을 사용한다. HTML에 래스터를 넣지 않는다.
- `tools/map-forge/stage21-eupseong-art.mjs`: 기존 SVG fallback과 얇은 발판·기단·연결부. 캠페인 생성기를 다시 실행해 지형을 바꾸지 않는다.

건축물은 스프라이트별 1536px 상한으로 한 번 준비하고 기존 월드 타일 캐시가 배율별로 재사용한다. 지붕 매핑은 source alpha 상단과 실제 oneWay contour를 연결하고 발은 기존 지면에 고정한다. 성문은 필요한 통로를 별도로 투명하게 잘라낸다. 암반은 한 번 만든 mirrored 패턴을 모든 타일이 같은 월드 원점으로 사용하며, 깊이별 어둠도 월드 높이에 고정한다. 실제 단일 지형의 확장 polygon이 미술 클립이며 별도 skirt나 dummy는 없다.

미술은 저장된 landmark의 안정된 에셋 ID로 해석하므로 기존 live snapshot의 벡터 payload도 새 미술을 받을 수 있다. 기하 변경이 없어 map revision을 올리지 않으며 성장·SP·장착·전투 진행을 초기화하지 않는다. 다른 장은 활성 조건 밖이다.

## 현재 확인과 차단

통합 코드 첫 빌드의 Game/Workshop 및 실제 Chromium Game Stage21 실행 통과. 원 master `993f9df`와 캠페인 바이트/생성 Stage21 데이터 해시가 동일하고 컴파일된 초기26적·정예5·목표ID3개·revision20을 확인했다. 전체 verify와 다른 장 검사는 실행하지 않았다.

이 실행 환경에서 Library가 발급한 승인 원본/세 에셋의 전송 호스트가 CONNECT 403을 반환했다. 아직 이미지 파일을 확보하지 못했으며 manifest는 빈 상태로 안전한 기존 미술을 사용한다. 실제 회화 적용·원화 비교·완성 화면 캡처·최종 Pages 배포는 에셋 전달 후 완료해야 한다. 코드 통합을 완성 미술 승인이나 배포 완료로 기록하지 않는다.
