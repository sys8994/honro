# 3장 외곽·접합 독립 검수

공통 TERRAIN_EDGE_JOIN_AUDIT_SOP 기준. 사용자 저장과 기존 전투/브라우저는 접근하지 않는다. 공개 UI 미검수.

## 대상과 범위
최종 production build는 legacy stage03-body-candidate를 act1-site:3 지형·랜드마크 등으로 교체한다. 실제 stage 폭5730.02/높이3035.01, 물리지형8개이며 모두 breakable=false. legacy source의9개 지형 또는 후보 BODY bounds를 현재 공개판 원인으로 혼동하면 안 된다.

`HONRO_AUDIT_STAGE=3 HONRO_AUDIT_LABEL=production node tools/act1-vector-production/capture-stage-independent-audit.mjs`로 최종 stage 기준 8접점×3화면비와 최소줌5곳, 총29뷰 실행. 모든 뷰에서 render 전후 battle 불변, terrain/units SHA ffc24474914706d8e6bc588be4e2ef49741130b4728612fae1f14f7103c7395b. 실제 보행/착지/기믹·UI 가림/재진입이나 공개 모바일 합격은 아니다.

## 결함 후보
정상 zoomLimits(1331)의 최소줌을 적용한 하단 모서리에서 지형 좌우·하단의 직사각형 단절과 배경 노출을 확인했다. production author의 collage 확장은 좌우 약390~400 source, 하단380 source이고 카메라 노출 영역을 덮지 못한다. 외곽 확장과 모서리 합성 원인을 조사 중이며 아직 수정 완료 아님.

초기 진단이 legacy source 위치와 최소줌보다 작은 줌을 사용한 것을 확인해 폐기하고 위 production 기준으로 재실행했다. legacy BODY metadata 변경은 효과가 없어 원복했으며 원격에 올리지 않았다. 혼동된 초기 캡처는 최종 검수 근거로 사용하지 않는다.

master7d238d20 불변. 후보 브랜치 fix/stage3-art-bounds-20261117에 재현 도구와 중간 기록만 보존. 신규 미술·충돌·카메라·저장 변경 또는 Pages 배포 없음.


## 독립 수정 후보와 잔여 검수

후보 a525d62b의 CI44035942742는 성공했다. source vector/11개 최적화 경로는 보존하고 합성 경계 strip을 확장, 렌더 타일영역만 그림 bounds까지 확대, 3장 painted ferry-ground의 인위적 폐합선3개만 제외했다. 보행 rim 배열은 수정전과 완전 동일하고 다른 장/비painted 음성검사 및 물리 SHA 불변검사가 통과했다. 그림 등록 hash는 작은 terrain-path-registrations.json에 두고 원래 대형 최적화표 baseline hash와 최종 source hash 둘 다 검증한다. 최적화 검증을 끄거나 완화하지 않았다.

아주 얇은 0.076px 원본 strip을 확대했을 때 Native 타일에서 alpha0이 발생했다. 1px 내부 strip으로 바꾼 후 해당 하단 타일 direct/vector/landmark 모두 alpha255이고 배경 노출은 사라졌다. 원본 그림 끝이 투명하다고 단정하지 않는다. pixelSnapClip 및 소스0.75px 이내 합성 underlap으로 경계 AA를 보정 중이다.

최소줌의 데스크톱/세로/가로15뷰와 8개 물리지형의 세 화면비24뷰 총39뷰를 생성했다. 전체 상태행렬·실제입력·공개모바일은 여전히 미검수. 중간39뷰에서 하단 사각 배경노출은 해결됐으나 일부 극단 화면에 얇은 접합선이 남아 마지막 보정/검증 중이다. 잔선을 무시하거나 장 전체 완료로 보고하지 않는다. master/Pages 미반영, 다음장 미착수.


## 접합선 보정 후 후보 보존

타일 재샘플 경계에서 발생하던 선을 source strip의 1~2px 안전한 겹침으로 보정했다. 독립 직접벡터에서는 선이 없고 production 타일 경로에서만 나타나던 현상이다. 데스크톱 하단과 세로 하단의 밝은 선 및 하단 수직접점에 픽셀 회귀검사를 추가했다. source path/색과 기존11개 최적화 경로는 불변이다. 기존 본문 그림을 이동하지 않고 경계 확장 합성의 clip/transform만 조정한다.

정적·Native 후보 검증과 최종 공개 검수는 분리한다. 기존 공개 전투를 건드리지 않으므로 master·Pages는 보류하고 후보/CI만 보존한다. 부모 지시에 따라 4장 독립 검수를 이어가며, 3장 전체 플레이/공개 UI 미검수 상태를 유지한다.
