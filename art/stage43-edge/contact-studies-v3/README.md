# 43장 국소 연결 v3, 전체 외곽 완성 아님

동쪽 종단을 아래로 연결하고, 새 A/C 암면의 x2151 수직 시작선을 없앴다. central.svg는 보존된 v6의 합성용 복사본이며 curved-contact-12/13을 실제 Inkscape union으로 이웃 암면과 합쳤고14의 측면을 바꿨다. 원래 v6와 source.svg는 수정하지 않았다. 동쪽 v2 상부 접합3개도 그대로다. 최종 하부 변화는 y735 이후다.

bottom-contact.svg는 작은 군집 폭의 암색 기반을 원본 하부에 잇는 접촉그림자다. 실제 Inkscape intersection2회. 원본위 y700미만 변화0. x1811..1930,y709.67..738 범위에서 변화하며 화면 불변을 주장하지 않는다.

body.json은137경로/약33KB, joins.json은10경로/약3KB다. 중복 패널 바탕을 먼저 그린 후 색면을 그리도록 합성했다. 전면에는 원본 주변의 제한된 접점만 그린다. 모든 시험패널 바탕을 다시 전면에 그리면 사각 경계가 재발하므로 그렇게 하지 않는다.

Native Scene 일반배율에서 원본/충돌 상태순수 및 gameplay SHA5010609ff55f6623fa522911bf5e37970b9ef10ff1d683f56507eef784dba538 일치. ROOT에 시각 검수를 요청했다. 이는 x1808..2394의 작은 시험이고 전체 카메라/모바일 범위를 덮지 않는다. 왼쪽 미작업 수평절단 및 시험 범위 바깥은 남는다. Browser·master·Pages 미실행. production에 연결하지 않는다.

재현(저장소 루트):
HONRO_NATIVE_OUT=_local/reports/stage43-contact-v3 HONRO_BODY_FILE=art/stage43-edge/contact-studies-v3/body.json HONRO_CONTACT_JOIN_FILE=art/stage43-edge/contact-studies-v3/joins.json HONRO_VIEW=east node --expose-gc tools/stage43-edge/capture-native-contact-rear.mjs 43
