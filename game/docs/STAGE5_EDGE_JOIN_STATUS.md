# 5장 외곽·접합 독립 검수

공통 SOP, 실제 최종 production project/Engine/renderer를 사용한 Native 검수. 사용자 저장과 기존 전투/브라우저를 조작하지 않는다. 공개 UI·실기기·플레이 검수는 미완.

## 확정 결함과 등록 수정
floor 등록bounds는 실제 clip보다 좁아서 세로최소줌 좌하/우하 y571부터 색 단절이 발생했다. floor는 act1-traced:stage05-floor-v4로 교체되어 구 foundation의 lower-bank 보정 대상이 아님을 materialLandmarks에서 확인했다. floor bounds/reference.bounds를{x:-6000,y:1600,w:18400,h:26700}으로 보정한다.

cliff 최종자산 act1-traced:stage05-cliff-v1의 유효 중첩clip은 x4270..12400,y120..3450이다. bounds 우측10400은 정적 누락이지만 현재 표본에서 잘림은 미관측이다. width6400→8400으로 등록만 보완하고 다른 값은 유지한다. 중첩된 exposedCliff의 거대한 사각 전체로 확대하지 않는다. shoulder/cave/brow의 유효 clip은 기존bounds 내부다.

두 자산의 vector/viewBox/clip/색/충돌은 불변이며 tests/stage5-art-bounds.mjs 통과. 미술 재생성 없이 등록 오류만 수정한다.

## A/B 및 상태 범위
11개 물리지형 접점×3화면비33뷰, 최소줌5위치×3화면비15뷰 총48뷰. 수정전후 terrain/units SHA230ddae8f982fce6538b4c4617309b7e773d70ba37abde0562483828164ac8b9 동일. 45뷰 픽셀불변, 세로 좌하/우하 y571..695와 세로전체의 마지막 y695 한 줄만 달라져 하단 경계가 제거됐다. cliff 보완은 이번48뷰에서 별도 가시차를 만들지 않았다.

수관·동굴 접합 표본에서는 잘림 미관측. 파괴불가 지형만 보고 상태를 전부 N/A로 처리하지 않는다. waterfall-open은 정상 production setOpen을 별도 메모리 fixture에 호출한6뷰이며 열린 flag와 렌더 순수성을 확인했다. 실제 주박목 타격→폭포 전환 플레이 합격을 뜻하지 않는다. ritual active 3뷰와 cliff-cleat broken 3뷰도 독립 fixture로 완료했다. 데스크톱 직접 이미지 확인에서 ritual 효과는 하단 y724..762, 파괴된 cleat는 x427..842/y311..493 범위에 국한됐다. 실제 타격/전환·낙하 실행이 아닌 합성 상태 렌더 검사다. 파인 하단 발판 변위·실제 전투상태전환·저장 재진입은 미검수.

master/Pages 보류, fix/stage5-art-bounds-20261117 후보만 보존한다.

CI 44039006391은 코드 5beb2f5e1219754cdc700b71e5dce049250123af에서 success. 검수 표본은 play-area corner이며 실제 focus 최극단 팬은 아직 미검수다.
