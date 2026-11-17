# 8장 외곽·접합 독립 검수 후보

Native 최종 production project/compiler/Engine/renderer 검수이며 공개 UI·실기기·실제 전투 검수는 아니다. 사용자 저장 및 기존 전투를 조작하지 않는다. master/Pages 보류.

## 원인과 최소 수정
floor act1-traced:stage08-floor-v1의 bounds 하단7800이 실제 canonicalSolid/contactInset 하단29500보다 작아 타일8192부터 누락됐다. 세로 좌하 y502 색단절은 348+(8192−5500)*390/6800=502.39와 일치한다. bounds/reference만{x:-6000,y:1800,w:21600,h:27700}으로 확대하고 vector/viewBox/clip/충돌은 그대로 유지했다. 나머지5개 자산의 유효 clip은 기존bounds 내부다.

vector SHA567bca69c2ce81871e74758a5fab170ace4500570217fb8775d0b24d992c2d6d 불변. build stage 계약 d2b17bd7746cede48776fc7608c69d7b5f0f64972fc87e70c96433468a401daf 불변. tests/stage8-art-bounds.mjs 로컬 통과, 실제 materialLandmarks에서 보정된 bounds 반영도 확인.

## 범위
source22개 접점×3화면비66뷰, 최소줌 playcorner/전체15뷰, 실제focus(-320,-1800)..(9920,5740) 극단12뷰 총93뷰 수정전 확보, 수정후 재검사 진행 중. 물리 terrain/units SHA34ba9c574158fae754ce64b815722f557b4debf0548a0c89d6e42b05024d85bf 기준.

source22개 중 battle일반지형20개는 파괴불가다. 나머지 bier-knot-0/1은 각480HP 파괴가능 questtarget이므로 파괴를 전부N/A로 처리하지 않는다. 각 결박broken 독립 fixture 렌더를 추가한다. 실제 공격·해제·상여 이동/정착·가림·재진입·공개 UI는 미검수. 최소줌/접점 중간 보행배율 표본이며 모든 위치×최대줌×모든 상태의 전체행렬 완료를 의미하지 않는다.
