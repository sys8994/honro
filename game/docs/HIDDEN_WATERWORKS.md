# 지하 집하장 1차 제작 계약

25장은 설오·담허가 단절된 첫 석대를 축지진목으로 횡단한다. 27장은 같은 두 동행이 상부 석대→하부 하역대→봉인 창고의 세 단절부를 순서대로 건넌다. 두 인물의 직접 M09 사용을 확인하는 런타임과 연계 중이다. 일반 점프 길을 따로 놓지 않는다.

배경은 저문골에서 수거한 물품의 은폐 집하장이다. 무명사의 대종 주조소를 옮기는 설정이 아니다. 물품 묶음에는 숟가락·놋그릇·농기구·이름표가 같은 가족 번호로 묶이며 지상 희생자 명단과 대조한다. 최종 목적, 저편의 정체, 현묵의 현재 운명은 확정하지 않는다.

- 소스: `tools/map-forge/act3-hidden-waterworks.mjs`
- 임시 프로젝트 생성: `node tools/map-forge/act3-hidden-waterworks.mjs`
- 실제 공통 렌더러 캡처: `node --expose-gc tools/environment/capture-hidden-waterworks.mjs --project _local/reports/hidden-waterworks/project.json --stages 25,27 --out _local/reports/hidden-waterworks/review-v2`
- 현재 단계는 대표 지형·미술 초안이다. 활성 campaign은 아직 변경하지 않았다. 런타임 횡단·미션·브라우저 입력·일반 캠페인 완주는 별도 검증 대상이다.

## 구조 참고

국립문화유산연구원 한국고고학사전의 수원성 설명에서 화홍문의 홍예와 물살을 가르는 다듬은 석재를 참고했다. 실제 유산을 그대로 재현하지 않고 인공 수리시설의 조형 근거로 삼았다.
https://portal.nrich.go.kr/kor/archeologyUsrView.do?idx=8861&menuIdx=567

## 인터페이스

`stage.design.act3.crossings[]`는 `id/from/fromZone/to/landing/checkpoint/markerId`를 담는다. fromZone과 landing은 `{left,right,y}`, 지점은 `{x,y}`다. landing은 석대 전체이며 출발 구간의 저장 지점은 안전면에 둔다. map compiler의 `honroMap.act3`로 전달한다. 25/27의 party는 archer/mage, 동시 행동 상한은2다. 각 목표는 단계별 한 줄이다.
