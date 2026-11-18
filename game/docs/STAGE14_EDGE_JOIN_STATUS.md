# 14장 외곽·접합 독립 검수와 폐합선 수정 후보

기준 master 7d238d20, 후보는13장6eb31111의 후손이다. 기존 공개판·사용자 저장·전투에는 접근하지 않았다. Native Scene은 공개 UI나 실제 플레이 검수의 대체물이 아니며 master/Pages 배포 전 후보다.

## 범위와 원인
최종 compact source/battle4지형은 모두 indestructible99999, 파괴형 quest target0. 파괴는 N/A지만 퀘스트 상태는 미검수다. upper-hamlet/east-crown-road/refuge-ground/cavern-vault 접점×3화면비12뷰, 전체/모서리15뷰, 실제focus극단12뷰 총39뷰를 전후 대조했다. DPR1, desktop1331×763/portrait390×696/landscape844×390의 실제 카메라와 물리 SHA는 audits/stage14-native-20261117.json 참조.

최저줌 portrait 하단에서 y5640,x0..4800의 가짜 가로 rim이 관측됐다. 벡터 자산에는 선이 없고, terrainReadability 목록도 비어 있다. 실제 원인은 HonroAct2SpatialArt.surfaceEdges가 압축 전 edgeIndices를 압축 후 polygon에 적용하면서 index13의 시뮬레이션 폐합선을 보행 rim으로 그리는 것이었다.

## 최소 수정과 보존
shared/runtime/act2-spatial-art.js에서 compact14 refuge + terrain-domain projection에만 해당하는 가로 폐합선 한 개를 제외한다. 전체 procedural terrain를 지우지 않으며 원본 미술·충돌·카메라·퀘스트·저장/asset ID는 변경하지 않는다. 등록/합성 오류이므로 새 시안이나 재추적은 불필요하다.

tests/stage14-art-rim.mjs는11~20장의 실제251개 지형을 이전 함수와 비교해 이 선1개만 제외되고 다른 모든 edge의 순서/좌표가 동일함을 확인했다. 비compact·다른 stage guard 및 source/battle 불변 확인 PASS. tests/stage14-edge-domain.mjs는20world-unit/pixel 표본으로 실제 low/vault 자산의 하단x−3720..8520,y6000..11707.69 및 상단y−7867.69..−1000의 alpha255를 확인했다. 전픽셀/전배율 보증은 아니다.

초기 closure-candidate 라벨은 최종 projection 참조 수정 전의 중간 후보이며 최종 증거로 사용하지 않는다. final-closure-candidate 라벨만 최종 A/B로 구분한다.

## 미검수
공개 Game 입력, 실제 모바일/resize/핀치, 모든 접점·최대줌·연속 팬, 문 개방, 최면 피격·이동·분리, 길찬 피난처 호위/안전 도착, 가족 구출/피난처 방어, 반복 진입/저장. Native 정적 표본을 최종 SOP 합격·미감 승인·게임플레이 정량 검수 완료로 표현하지 않는다.

최종39뷰 중24뷰는 픽셀 완전 동일,15뷰는 해당 폐합 rim 주변만 변경됐다. portrait 하단 변화 bbox는 좌(195,361)-(390,364),우(0,361)-(195,364),focus 좌(213,347)-(390,350),우(0,347)-(177,350)이다. 네 전후 비교를 직접 확인하여 가짜 가로선 제거와 실제 보행선 보존을 확인했다. 물리 SHA1e8d0b83385565a4cd9db19a8952e0946b693abe2eb847e6ee3adda5af642d2a는 모든 렌더 전후 동일하다.
