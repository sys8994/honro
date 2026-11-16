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

## 전경/비보행 거목 분리 (최신 미배포 후보)

연속 BODY만 사용한 후보는 보행면의 양 끝이 얇은 판처럼 보이고 큰 뿌리 상단이 발판처럼 읽혀 반려됐다. 전체 연속 자산을 기존 L3 시각 문맥의 어두운 BACK으로 유지하고, 같은 색면의 보행면 아래 부분만 BODY로 합성한다. 원본 pass-road 충돌·배우·목표를 바꾸지 않는다. 원본 돌담/상여/밧줄/보행면은 별도 PROPS로 보존한다. 잘린 원본 서쪽 덤불의 완성본 교체 외에 접합을 숨기는 덤불은 추가하지 않는다.

외곽 분리는 임의의 긴 직선 대신 deep-registered-color.svg의 기존 native Bézier 색면 경계를 사용한다. split-depth.py → natural-depth-edge.py는 실제 Inkscape Boolean 결과를 보존하며, 최종 내부 구간의 동일 사각 alpha 교집합 비교는 다른 픽셀0이다. 전체 compound 문맥의 AA 변화는 별도 보고서에 분리한다. 자연 경계의 접속 부동소수 오차로 별도 M이 삽입돼 사선으로 닫혔던 중간 실패는 단일 연속 subpath 직렬화로 수정했다. depth-natural2 Native Scene가 수정 후 검수본이며 depth-natural은 실패 이력이다.

현재 실제 열어 본 최신 Native Scene: 전체 구조, 서쪽/동쪽0.45, 390×844 서쪽/동쪽0.7. 거목은 뒤쪽 비보행 구조로 낮은 대비, 전경 BODY는 밝은 지질면, 보행면은 원본 황토색으로 식별된다. 동쪽 마지막 발판 바깥의 작은 계단형 경계와 얇은 AA 윤곽은 추가 진단 중이다. 자동 테스트 통과를 최종 미술/실제 브라우저/배포 완료로 표시하지 않는다. 생성부와 원본 소품의 재질 크기·색면 차이는 남아 있다.

동쪽 두 색면 사이의 짧은 수직 alpha 연결은 정상 세로 배율에서도 계단처럼 보여 보정했다. 게임 범위 밖14 native단위에서 원래 보행선 접선을 기존 p6 색면 곡선으로 연결하는 짧은 곡선 마스크로 바꿨다. 원본 color/alpha/terrain은 불변이며 내부 alpha 재검사0픽셀 차이를 유지한다. 이는 원화 색면 수정이 아닌 전경/배경의 국소 alpha 접속 편집이다.

### Alpha 합성 원인 분리

동일 deep clip을 쌓인 각 색면에 적용하면 AA 경계가 반복 누적되어 점선 같은 밝은 윤곽이 생겼다. 원본 색면을 먼저 현재 타일/뷰포트의 제한된 임시 surface에 합성하고 alpha를1회 적용하는 방식으로 수정한다. 전체맵 bitmap 자산으로 바꾸거나 거대한 고정 cache를 추가하지 않는다. 이 과정에서 Native @napi Canvas가 큰 transformed Path2D의 destination-in fill을 일부 타일에서 전부 투명하게 만드는 오류를 별도로 재현했다. 동일 크기의 임시 mask surface에 source-over로 먼저 그린 뒤 identity destination-in drawImage를 사용하는 표준 합성 방식으로 검사한다. 중간 final-east/final-overview는 이 Native 오류가 남은 실패 캡처이며 최종 검수 증거가 아니다.

2surface 합성 후 동쪽390×844/0.7 Native를 직접 확인했다. BODY 명도가 정상으로 복원되고 인공 점선과 짧은2계단 경계가 사라졌다. 원본 보행면 외곽의 매우 가는 선과 원본/생성 재질 차이는 남지만, 검수한 배율에서 발판과 비보행 거목의 구분·접지가 유지된다. tests/act5-depth-composite는 두 surface의최대1024²제한·해제, V.context palette, transform/opacity/destination clip, 예외 복원 및 실제516²타일좌표에서 foreground 보존을 검사한다. 단일합성 reference와2채널값 이내 raster AA 차이이며 기존 중첩clip은404441채널이달랐다. 브라우저입력/성능/Pages검수는후속이다.
