# 4장 휴식터 ‘북문 바깥 길목’ 회화 — 2026-10-18

기준 master는 승인 4장 전투까지 배포한 `ce39ef227c645d5a55b41340d5feb8347ebd5afe`다. 이번 단위는 4장 휴식터만 바꾸며 부모 실제 화면 검토 전 master/Pages에 반영하지 않는다. 5장은 미착수다.

## 구현과 보존

- journey-art.js의 stage4/surface만 paintedRest4()로 분기한다. 왼쪽 문루 일부·낮은 토석담, 흙길과 흙마당, 열린 산그늘, 오른쪽 정적 소나무 한 그루로 구성하고 불/동행 앞을 비운다. 전투의 적·목표 UI는 가져오지 않는다.
- 승인 gate4 원본1280×503을 전체 비례 그대로1150×451.9140625, x=-415에 놓아 왼쪽 panorama 밖으로 이어진 한쪽 문루가 보이게 한다. strip 변형이나 가운데 전체 문 복제는 없다. 문루/담은 y695 지면에 놓고 오른쪽 뿌리는 앞 지면으로 묻는다. 낮은 개별 돌/화덕만 사용하며 넓은 암반 카드를 바닥에 깔지 않는다.
- gate4/gateFar와 기존 forestSoil/forestRock(화덕만)/pineA/granite를 공유한다. 새 에셋/manifest 항목은 없다. 원경은 저채도/저대비와 어두운 값 보정으로 배포4장과 같은 산그늘로 맞춘다. 정적 SVG 문자열 캐시·기존 원경 시차·App 단일 불/불씨/인물 모션 루프를 사용하며 나무 새 모션/RAF/매 프레임 재구성은 없다.
- 기존1600×900 SVG·restGeometry/인물·불 앵커·양끝 패닝·.9~1.35 줌을 보존한다. 모바일 첫 mount만 zoom.94/x최대115px(화면/버튼 여유로 제한), bounds 안 y최대-55px로 시작한다. 실제390×844는 translate(115px,-17.6px)/scale.94다. 이후 resize/pan은 기존 상태를 유지한다.
- 버튼·대화/진행/저장/성장/SP·전투 지형/revision·current-chapter main/entry/loader/web-build는 미수정이다.1~3장 쉼터와 배포4장 전투 미술도 그대로다. 이미지 로드 뒤 restMarkup 재생성/카메라 리셋은 없다.

## 실제 확인

필요한 build, Chromium 데스크톱1440×900/모바일390×844 두 화면, 짧은 모바일 양끝 패닝/중앙 복귀와 실제 모닥불 클릭만 확인했다. 첫 화면의 모바일 처마 노출/오른쪽 뿌리를 보정한 뒤 같은 두 화면을 최종 갱신했다. 전투/기예/다른 쉼터/전체 verify는 실행하지 않았다.

- pageerror0, 패닝 전후 profile JSON 동일, 모닥불 클릭 후 camp 화면 확인.
- 모바일에 처마·기둥·담 일부와 설오/담허·불이 함께 보인다. 동행 버튼 x152.07~288.68, 불 버튼 x250.78~369.22/bottom702.06, 하단 버튼 top780으로 잘림/가림이 없다. 처마 끝은 screen x94.50, 담 끝은 x259.77이다.
- 일반 드래그로 world 양끝 도달 오차 .012px 이내, pine-crown hook0, 전투 UI0이다.
- 전투를 먼저 열지 않은 정상 쉼터 진입 fixture에서 gate4 요청은 진입 전0/진입 후1이다. watch4/burned4/rest1Inn/rest3Worktable 등 무관 구조 요청0이다.
- source 비교상 campaign/journey-content·startup·campaign-map-revision·Stage4 전투 미술은 기준 master와 같다.

증거: `_local/reports/rest-stage4-location-paint/checks.json`, 두 PNG와 `library.json`.

| 화면 | Library ID | 버전 |
|---|---|---|
| 데스크톱 | `libfile_35710b06ff888191a5f43fb18d5618f8` | v0 |
| 모바일 | `libfile_8c64b0aecf888191b6c91eaa62076c3c` | v0 |
