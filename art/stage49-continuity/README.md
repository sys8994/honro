# 49장 연속 암벽 후보 7

기준 master `1228a52223fe69fadf03baf0de1ad8ced1be9fc0`와 동일 tree `818a77470123c324482ecc6be8efc2e686d540b6`에서 작업했다. 50/41장은 변경하지 않는다.

## 범위와 원본 보존

- 원본 `near-import.json` 49장, 모든 stage/content, 다른 장 asset, 충돌·행위자·목표·저장·카메라 정책을 보존한다.
- 좌우/하단 1px 늘림과 그라데이션을 별도 생성한 실제 벡터 암면으로 교체한다. 원본 계단·난간·다리·두 아치 내부를 보호한다.
- 원본 색 경계에 따른 외측/하단 분할과 8개 보행 폴리라인 주변 폭 52 source-unit의 보호 영역을 Inkscape Boolean으로 합친다. 마지막 다리 아래의 비보행 암반만 심부와 연결한다.
- 외벽과 원본 각각을 임시 캔버스에 먼저 합성하고 최종 coverage를 한 번 적용한다. 임시 면은 1024² 이하, 성공·예외 모두 해제한다.
- source bounds `[-1100,-3300,3300,7900]`, world bounds `[-4400,-13200,8800,18400]`. 기존 6개 화면비의 실제 최소 줌·팬 범위를 포함한다. 전체 1440×900 진단 구도는 전체 세로 구조를 보기 위한 별도 축척이며 실제 landscape 최소 줌으로 주장하지 않는다.

## 제작과 최적화

`source/concept-v1.png`는 원본 Native 이미지 참조로 제작한 지형 시안이다. `trace-v1/*-raw.svg`는 실제 Inkscape 1.4 color/alpha trace다. 원본은 불변이다.

색상은 8색 trace, epsilon 0.3의 형상 보존 최적화 후 Inkscape로 분할한다. 최적화 전 167,476 → 후 86,509 세그먼트, 2,406,983 → 1,320,418 bytes. Inkscape 916/1832px 렌더의 평균 premultiplied 채널 오차 0.00008632 / 0.00007204, >16/255 변화 픽셀 비율 0.00006867 / 0.00013368. subpath 5,327개는 그대로다. 이는 FPS 향상이나 미술 승인 수치가 아니다. 새 황토색 상면은 암면 중간색으로 낮춰 가짜 발판 오인을 줄였다.

`tools/stage49-continuity/build-art.sh`로 재현한다. trace wrapper/렌더 미리보기와 Boolean 입력 임시는 `_local/stage49/art-temporary/`에 보존했으며 재생성 가능하다. 실제 raw/final SVG와 최적화 보고서는 여기 보존한다. 고정 path/vector/clip 예산을 늘리지 않는다.

## 검수 상태

- 원본 전체 데이터 불변, 보호 접촉 2,022점, 두 아치 내부 1,661점, 6개 실제 카메라 범위 통과.
- 전후 Native Scene 카메라 캡처 및 후보 7 전체/동쪽/하단/390×844/320×1200 상·하 팬 검수. 캡처 중 게임 상태 불변. 초기 후보의 사각 접합·가짜 상면·하단 굴곡은 반려·수정했다.
- 합성 회귀: single-alpha oracle 픽셀 동일, 중복/중첩 alpha 결함 검출, 입력 불변·외부 clip·transform·opacity·예외 해제 확인.
- Game/Workshop production build와 기존 asset 보존 회귀 통과. 정식 CI, master 반영, Pages, 실제 공개 입력은 아직 미완료다. Native 캡처는 브라우저 플레이나 미션 완주가 아니다.

한계: 외벽이 원본 내부보다 더 각진 색면이며 비보행 심부의 질감 방향은 원본과 완전히 같지 않다. 원본 보호 구역 밖 암반 색면은 재설계했다. 보행 지형이나 저장 수치를 바꾸지 않았다.

Native 분할 전후 Inkscape 916px 평균 premultiplied 채널 오차 0.00002363, >16/255 변화 픽셀 0. 최대 채널 오차 0.02353.
