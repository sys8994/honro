# 16장 외곽·접합 독립 표본 검수

기준master7d238d20. 후보는15장36ebd918 후손이며3/7/12/14/15 후보를 포함한다. 이 장 자체의 미술·runtime 변경은 없다. 공개 Game·실제 모바일·상태 전이 미검수로, 최종 SOP 합격 또는 Pages 배포가 아니다.

## 범위
최종 compact6400×4000,source26지형 접점×3화면비78뷰,전체/모서리15뷰,focus극단12뷰 총105뷰. 상세 위치·카메라·DPR1 및화면비는 audits/stage16-native-20261117.json 참조. 물리SHA817bf383c6dbdfd3a3c3b155c0f8e018db68f82bfa6d38600b7fd7cb5637258d,모든 렌더 전후 상태불변.

직접 본 portrait5개 전체/외곽 표본과desktop 전체·바닥·천장·사찰기단·회랑계단·아랫공간 접점에서 사각절단/접합공백 추가결함은 미관측이다. 이는 표본 범위의 관측이며 모든 픽셀 무결함보증은 아니다.

floor-west/under/east는 국소 traced 미술이며 하단의 나머지 넓은 암반은 기존 procedural domain이 담당한다. 국소asset의 bbox밖 alpha0을 전체 바닥누락으로 오인해 임의 확장하지 않는다. roof는 이미y−26500부터 등록되어 있고 실제 천장원형을 보존한다. 여러카메라 그림을 붙인 시트의 작은 계단모양은 독립이미지 경계였으며 단일 캡처에는 없다.

## 미검수
공개 입력·실기기·resize/팬/최대줌 전체행렬,장로 구출/회복,제자추출·회복,증언슬롯·작업장출구,반사/지붕보행 및 반복진입/저장. 독립 정적 렌더를 실제 플레이 성공/게임플레이 정량 검수 완료로 표현하지 않는다.

15장상단 source경계의 의도불명/미해결 항목은 별도 STAGE15_EDGE_JOIN_STATUS.md에 유지하며 이 장 검사가 앞선 후보의 최종합격을 뜻하지 않는다.

tests/stage16-edge-domain.mjs PASS: source/battle26개 모두 비파괴,파괴형 quest target0. 실제 procedural+native 합성 하단x−3720..10120,y6000..10307.69 및 실제 roof 상단y−7867.69..−3000 표본alpha255,source/battle 불변. tm-undercroft-tooth는 원본 stage16-temple.mjs부터6점 독립 plane으로 ceiling/비파괴/optional이 명시돼 있어 임의연장하지 않았다. 특정 반사기믹이라는 단정은 하지 않는다. 제자분리·두인물 호위/회복·안전접지·방어·증언 상태도 미검수다.
