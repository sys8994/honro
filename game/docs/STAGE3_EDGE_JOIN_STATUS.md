# 3장 외곽·접합 독립 검수

공통 TERRAIN_EDGE_JOIN_AUDIT_SOP 기준. 사용자 저장과 기존 전투/브라우저는 접근하지 않는다. 공개 UI 미검수.

## 대상과 범위
최종 production build는 legacy stage03-body-candidate를 act1-site:3 지형·랜드마크 등으로 교체한다. 실제 stage 폭5730.02/높이3035.01, 물리지형8개이며 모두 breakable=false. legacy source의9개 지형 또는 후보 BODY bounds를 현재 공개판 원인으로 혼동하면 안 된다.

`HONRO_AUDIT_STAGE=3 HONRO_AUDIT_LABEL=production node tools/act1-vector-production/capture-stage-independent-audit.mjs`로 최종 stage 기준 8접점×3화면비와 최소줌5곳, 총29뷰 실행. 모든 뷰에서 render 전후 battle 불변, terrain/units SHA ffc24474914706d8e6bc588be4e2ef49741130b4728612fae1f14f7103c7395b. 실제 보행/착지/기믹·UI 가림/재진입이나 공개 모바일 합격은 아니다.

## 결함 후보
정상 zoomLimits(1331)의 최소줌을 적용한 하단 모서리에서 지형 좌우·하단의 직사각형 단절과 배경 노출을 확인했다. production author의 collage 확장은 좌우 약390~400 source, 하단380 source이고 카메라 노출 영역을 덮지 못한다. 외곽 확장과 모서리 합성 원인을 조사 중이며 아직 수정 완료 아님.

초기 진단이 legacy source 위치와 최소줌보다 작은 줌을 사용한 것을 확인해 폐기하고 위 production 기준으로 재실행했다. legacy BODY metadata 변경은 효과가 없어 원복했으며 원격에 올리지 않았다. 혼동된 초기 캡처는 최종 검수 근거로 사용하지 않는다.

master7d238d20 불변. 후보 브랜치 fix/stage3-art-bounds-20261117에 재현 도구와 중간 기록만 보존. 신규 미술·충돌·카메라·저장 변경 또는 Pages 배포 없음.
