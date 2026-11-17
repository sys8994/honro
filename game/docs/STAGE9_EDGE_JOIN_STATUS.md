# 9장 외곽·접합 독립 검수 후보

최종 production project/compiler/Engine/renderer Native 검수다. 공개 UI·실기기·실제 전투 검수는 미완이며 사용자 저장과 기존 전투에 접근하지 않았다. master/Pages 보류.

## 확정 결함 및 최소 수정
최종 floor act1-traced:stage09-floor-v3의 bounds 하단6500은 실제 canonicalSolid/contactInset 하단27500보다 좁았다. 세로 좌하/우하 y617부터 색이 끊기는 현상은 타일8192 누락으로 348+(8192−3500)*390/6800=617.1에 발생한다. bounds/reference만{x:-6000,y:1500,w:15600,h:26000}으로 수정했다. 원본 vector SHA194565c28c6aa13c81fa2425fc7a0e32c267863089a04665735debd0abe47b6a·viewBox·clip·collision 불변, build stage SHA3d44b3259ef469c9701524be69a5ad4db80c8df610e620c8dcdf6510a2a6d71a 불변. 나머지 rear/ledges 유효clip은 등록범위 내부다. tests/stage9-art-bounds.mjs 로컬 PASS.

## A/B 범위
source7/battle7 접점×3화면비21뷰, playcorner/전체15뷰, 실제focus(-320,-1800)..(3920,3740) 극단12뷰 총48뷰 비교.44뷰 픽셀불변, 세로 playcorner좌하/우하 y617..695 및 focus좌하/우하 y603..695의4뷰만 복원. 물리 SHA2a54863573ccc3ff29b0a3ebc477f3b931ae4ce770092a3bb7299ce720ae1c72 불변.

일반지형7개 모두 indestructible99999이고 파괴가능 questtarget이 없어 지형파괴N/A. 받이진0/1/2 활성은 별도메모리fixture의 collected flag를 설정한 렌더검사로 구분한다. yard-floor중심 보행배율에서는 활성표식이 화면밖일 수 있어 그6뷰만으로 활성표시의 시각합격을 주장하지 않는다. 실제marker2위치×3화면비×0/1/2상태18뷰를 추가했다. Engine 이후 collected수0/1/2 유지, 렌더순수성·물리불변 확인. 데스크톱6뷰 비교에서 서쪽만 황금표시→양쪽 황금표시로 바뀌고 연결선 색/처짐이 함께 바뀜을 직접 확인했다.

실제 설치 입력/전환, 소단 staging 숨김·표시·가림, 재진입·최대줌 전체행렬·공개UI는 미검수다.
