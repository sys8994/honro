# 45장 서낭고개 연속 지형 시안

기준 master 8cb12ce990fa3d07657e71352cc33ce9907bb9e4. art/stage45-continuity 독립 브랜치. 미배포 후보이며 시각 합격을 주장하지 않는다.

목표: 좌우 1px 늘림·그라데이션 블러 및 사각 하단을 제거하고 잘린 상부 거목 끝을 완성. 6400 world 폭, pass-road, start/exit, procession/tether/bier/turnback, 배우·목표·대사·저장·revision 보존. 원본 PROPS의 보행선·상여·밧줄은 그대로 사용하고 미술 BODY만 교체한다.

참조: 실제45 원본 source와 승인된 stage21-concept 스타일. built-in image generation으로 넓은 상하좌우 확장 시안 concept-v1, 이어 원본 소품을 중복시키지 않기 위한 body-concept 생성. 비트맵은 제작 참조만, 실제 runtime은 Inkscape1.4 native vector trace.

실제 Inkscape14색/alpha 추적 native-raw.svg 보존. 처음 단일 compound가60000 문자 한도를 넘으므로 기존 예산을 변경하지 않고 실제 Inkscape intersection으로 x0..540/540..1080/1080..1620 세 공간으로 나눈 뒤 optimizer epsilon1.2 적용. alpha epsilon0.4. 원본의 잘린 좌측 덤불은 같은 source PROPS의 완성된 작은 덤불을 단일 추출해 교체, 원본 돌담은 BODY alpha를 실제 Inkscape intersection해 보존. 새 길이나 소품을 코드로 그리지 않는다.

생성BODY 등록은 원본2172px PNG 기준 scale0.63, dx125,dy155. 원본벡터는1997x788. 각 부분 템플릿 매칭으로 검증했지만 작은구멍/중앙구멍/우측끝의 좁은 접촉 오차가 있어 native color와alpha에 동일한 국소 등록을 적용 중이다. 충돌선은 변경하지 않는다. 첫후보 흰alpha 매트 제거는 finish.py의 팔레트 교정이다.

원본 큰 나무 내부 색면은 확장 시안에 따라 달라지므로 동일 원화의 단순 외곽 확대라고 주장하지 않는다. 현재 한계와 품질검수는 후속 기록한다. 최초 Native Scene overview는137 메모리 종료, 좁은west Scene은성공. tests/act5-edge-art 통과는 시각/게임플레이 합격을 뜻하지 않는다.

## 열린 지층으로 재시안

첫 닫힌 외곽 후보는 root 검수에서 '허공의 섬'으로 불합격. 위의 닫힌 섬 산출물은 실패 이력이며 배포 대상이 아니다. 새 continuous-deep-concept와 continuous-deep-crown은 좌우/하단이 화면밖으로 이어지는 연속 지층이다. 후자는 잘린 윗가지 끝만 수정한 생성본. 원본 미술과 색면/뿌리의 세부 구성은 달라지지만 소품·동선·충돌은 그대로 보존.

정본 재현: continuous-deep-crown.png → 실제 Inkscape14색/alpha trace → register-deep.py(색/alpha 동일 좌표등록) → split-deep.py(실제 Inkscape 공간별 Boolean) → deep-optimized.svg epsilon1.2 및 deep-alpha-optimized.svg epsilon0.4 → import-native-clip.py, deep-config.json → finish.py. 원본 raw, 등록/분할 raw, optimizer reports 별도 보존. 첫 원본 등록은 PNG scale0.305 x+322 y+60. 비플레이 좌우 넓은 지층만 완만하게 벌리고 y400 아래 깊은 암반을1.3배 배치하여6개 화면의 focus/minZoom envelope를 포함. 1픽셀 늘림·반사·반복·gradient는 사용하지 않는다. 좁은 작은구멍 접촉만5 생성좌표 압축하고 같은변환을alpha에도 적용.

tests/stage45-continuity.mjs는1440×900,1920×1080,390×844,360×800,412×915,320×1200에서 현행 HonroBounds의 최소줌+최대focus+overscan 범위 좌우/하단을 모두 포함함을 검사. coverage.json은 이 수학적 검사의 결과이며 실제폰 플레이 또는 모든 가능한 화면비 검증은 아니다. Native Scene deep-overview에서 열린 지층·상부 실루엣 확인. 확대/극단팬/세로 및 공개브라우저는 진행 중.
