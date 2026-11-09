# 사격암대 제작 후보 — B-open

최종 후보: `optimized-v2/final.svg`(24,198B), `runtime-v2/final.json`(25,818B). 사용자 승인·장면 통합 완료가 아니다. `DELIVERY.json`에 선택 파일과 해시·검증 범위를 고정했다.

## 출처와 제작

기본 image_gen 도구에 실제 충돌 가이드와 style-board-v1/overview-v3를 참조로 전달했다. `prompt-v1/v2/v3.txt`, source-v1/source-v2/vector-ready-v3, references.json을 보존한다. source 관찰과 guide pixel/world 변환은 placement-contract.json에 있다. 세계영역은 left350/top2130, source1536×1024, 3pixels/world이다. low tread=(410,2290)..(500,2290), upper=(500,2190)..(800,2190), baseline2390. 기존 oneWay-top 정책이며 BODY는 L1-back 후면 암대다. 정면 solid 벽을 통과하는 구조가 아니다.

실제 Inkscape1.4.4 색/alpha 추적을 실행했다. native-v3의8색은 잡티와582k자 경로로 거절했다. native-v4-6smooth32는6색/smooth/색speckle32이며 별도 alpha는speckle0으로 보존했다. 원본 raw는 불변이다. 같은 명암 역할의 인접 회색만 native path-union으로 합쳤다. 생성 원본의 접촉 오정합은 native alpha union과 외부 contact clip으로 교정했다. authored-v1/v2는 clip 덮어쓰기 실패로 명시 거절, authored-v3에서 중첩 group을 바로잡았다. authored-v4는 정확한 full-canvas trace 배경사각형만 native fill로 회색 underpaint로 교정해 흰 테두리를 줄였다. 흰 하이라이트를 임의로 삭제하지 않았다.

## 검증과 한계

source→native trace 손실, palette/contact/underpaint 의도 저작 손실은 source-authoring-loss.json과 authored-v4/underpaint-loss.json에 따로 기록했다. source→native RGB MAE2.445/255, palette 교정.495/255, contact 교정1.595/255이며 contact는 원본 오정합19source px를 의도적으로 바로잡았다. 작은 moss 색 역할은6색 추적에서 합쳐져 보존되지 않았다.

최적화의 RAW는 이 접촉·palette 저작을 마친 원본이다. 독립 Simplify/소수점 후보는1px AA silhouette 변동으로 거절했고 한도를 넓히지 않았다. 무손실 XML 정리만1×/최대1.65×/2×에서 RGB·alpha·보호면 오차0으로 통과했다. 경로7개(clip 포함), subpath11, segment582, max path8426자, embedded image0. 기하 단순화 성공으로 부르지 않는다.

기존 HonroVectorArt/HonroEnvironment 검증0오류, 동일 엔진 RAW→FINAL은512/845/1024px에서 모든 오차0이다. SVG reference→engine RAW는1px AA/프레임/접촉 경계 차이가 남아 기존 픽셀 제한에 미달한다. 이 미통과를 최적화 통과로 덮지 않는다. source/native/palette/contact 전체와200% low tread/joint/end, 실제 엔진512·1024px를 직접 확인했다. 장면 안에서 앞길과 뒷암대가 구분되는지, 배우 보행·모바일·최저줌·브라우저 성능과 사용자 취향 승인은 미검증이다.

자동 렌더·비교·검사 보고서는 `_local/reports/act2-redesign-20261109/firing-rock/`에 있으며, 실패/구버전 후보는 `_local/archive/act2-redesign-20261109/firing-rock/`에 보존했다. 과거 중간 경로의 정확한 이동표는 `RELOCATION.json`을 따른다. art에는 원본/가이드/프롬프트, actual native RAW, 저작 SVG, 선택 final SVG/asset, 설정과 재현 script를 남겼다.
