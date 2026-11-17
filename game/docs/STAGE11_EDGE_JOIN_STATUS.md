# 11장 외곽·접합 독립 표본 검수

최종 production compact 지형을 검사했다. 48뷰 표본에서 확정 결함이 발견되지 않아 미술·runtime을 변경하지 않았다. 공개 UI·실기기·실제 상태 전이는 미검수이며 최종 SOP 합격이 아니다. 사용자 저장·기존 전투는 조작하지 않았다.

## 실제 적용 대상
구형 README의 31/33개 지형이 아니라 HonroStage11Compact.author가 stage11-compact-package.json으로 교체한 6200×3200, source7/battle7 지형이 최종판이다. 일반 지형7개 모두 indestructible99999이며 별도 파괴 표적이 없어 지형 파괴는 N/A다.

foundation의 실제 불투명 source1536×1024가 배치/변환 후 x−4500..12000,y1000..12000을 덮는다. authoredBody mask의 하단27200은 소스 그림의 끝이 아니다. 실제 최소줌과 최대 focus(-320,-1800)..(6520,3440)에서 필요한 x−3720..9920 및 최대하단9507.692를 실제 그림·등록 범위가 덮으므로 bounds를 불필요하게 확대하지 않았다. tests/stage11-edge-domain.mjs로 재현한다.

## 표본과 상부 나무
접점7개×3화면비21뷰, playcorner/전체15뷰, 실제focus극단12뷰 총48뷰. 물리 terrain/units SHA3417a52e2b6d2498aaae724f5533b27befb45d30335b083d38fc03988aa5679e, 렌더 중 상태 변이 없음. desktop/portrait 하단·우측·중앙 및 상부 표본에서 잘림·접합공백 미관측. 카메라와 위치별 결과는 audits/stage11-native-20261117.json에 보존한다.

compact11:upper-pine은 source clip의 내부좌표를 world bounds와 직접 비교하지 않고 실제 vector를 padding200 canvas에 그려 알파를 측정했다. local[1791,2050..3241,2438]은 등록[1650,1650..3350,2500] 내부이며 상부 여유400px. 두 배치는(0,0,1)/(2700,−620,1), 두번째 world[4491,1430..5941,1818]. check-stage11-tree-bounds.mjs에서 probe 자체 clipping 없음과 stage/asset/placement 불변을 검증한다. 미술 원본은 변경하지 않았다.

## 미검수
상여 엄폐·첫발 피격, 빙의 host→release/attached, north-warning과2명 증원, 저장/재진입, 실제 이동·가림·최대줌/전체 접점위치/모든 상태 조합 및 공개 UI. 정적 비파괴 계약과 표본 렌더를 실제 플레이·전체 미술 전수 합격으로 확대 해석하지 않는다.

master/Pages는 그대로이며 audit/stage11-edge-domain-20261117에 검사/기록만 보존한다.
