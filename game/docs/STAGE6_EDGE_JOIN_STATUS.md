# 6장 외곽·접합 독립 검수 후보

실제 final production project/compiler/Engine/renderer의 Native 검수다. 공개 UI·실기기·실제 전투 검수와 구분하며 사용자 저장/기존 전투는 접근하지 않았다. master/Pages 반영은 보류한다.

## 결함과 최소 수정
최종 BODY는 legacy traced가 아닌 stage06-prototype:continuous-body-v1이다. 기존 bounds의 하단7000으로 인해 실제 road clip 하단27800까지 그려진 벡터가 조기 culling됐다. 세로 좌하 표본 y600 색 단절은 첫 누락 tile8192가 화면599.89px에 위치하는 것과 일치한다.

bounds/reference.bounds만 {x:-6000,y:1500,w:18600,h:26300}으로 확대했다. vector.viewBox는 기존[-4000,1500,14600,5500]을 유지하며 vector SHA fe6f15ea32b3ba6e1550d6c49d3dcad4d2b615fc76baa86b5e62b025a61a3136 불변이다. integrated-preview의 정확한 소스 SHA 가드는 삭제하지 않고 변경된 author bytes로 갱신했다. 전체 stage 계약 SHA538bdd2ff5f3e6ce5234c5ef8a0841850c4b448c2578d3ac3afae7b961689c64 불변. tests/stage6-art-bounds.mjs 로컬 통과.

## 범위와 미검수
source terrain11개, asset collision에서 추가된 place6-east-rock:collision:0을 포함한 battle terrain12개다. 11개 접점×3화면비33뷰 및 playcorner/전체15뷰가 수정전 표본이다. 모든 battle terrain은 indestructible=true로 실시간 지형파괴 N/A이며 다리 파손은 정적 미술이다.

수정후 동일48뷰 및 HonroBounds.focus [-320,-1800]..[6920,4040] 최극단4팬×3화면비12뷰를 검증 중이다. focus-baseline이라는 로컬 디렉터리는 이름과 달리 수정후 캡처이므로 A/B 수정전 증거로 취급하지 않는다. 12뷰 이미지 모음에서 새 하단 단절은 미관측.

운반대 이동·후방 추격 발생·유닛가림의 상태전이, 저장/재진입, 실제 공개 UI는 미검수다. 독립 렌더 합격이 실제 플레이나 최종 미술 합격을 의미하지 않는다.
