# 1장 장소 회화 적용 — 2026-10-18

승인된 중간 밀도 원경과 정교한 근경을 1장에만 적용한다. 원경 라이브러리 `22954b692d6cb3ca5e9fcc4bce0abbde25a780f0`를 cherry-pick했고, 첫 접속 최적화/독립 모션 데모가 포함된 master `b8a11270297d8e1db1d75066d5c6f3a921c45e56`를 작업 브랜치에 병합했다. master 배포는 부모의 화면 확인 뒤 별도로 결정한다.

## 구현과 보존

- `shared/runtime/stage1-location-art.js`: 실제 terrain polygon 안에만 암반·젖은 흙을 그린다. 작은 서로 다른 암반 카드, 지표를 따르는 흙 전이, 얇은 이끼 군락, 깊은 어두운 덩어리를 사용한다. 실제 boulder-a/b도 원래 collision polygon으로 그린다. 공용 Stage21 `paintRock`는 변경하지 않는다.
- `shared/runtime/painted-pilots-art.js`: mountain-dusk 원경을 한 번 저채도·저대비·약한 blur/veil 처리해 캐시하고 기존 `act1BackdropFrame`으로 합성한다. 나무 11그루 중 6그루를 표시하고, 원본 atlas의 잘린 가지/이웃 잔가지를 정리한 투명 스프라이트를 사용한다. 실제 발판은 선명한 독립 목재 재질이다. 장식 바위 3개는 생략하며 풀·뿌리는 7개를 몇 군락으로 집중한다. 출구의 old-pass-gate는 같은 화풍의 작은 한국식 목문으로 표시한다.
- `tools/environment/painted-pilot-assets.py`와 manifest가 재현 가능한 에셋 제작 경로다. 승인 참고는 설계 참고만 하며 전체 그림을 레벨로 깔지 않는다. 새 근경 소재/정리된 나무/목문 원본은 `painted-pilots/source/stage1-*`, 런타임은 적정 크기의 외부 WebP다.
- 1장만 필요한 이미지를 요청한다. 나머지 장소군 source PNG는 런타임 manifest에 추가하지 않았다. Stage1은 Stage21 bedrock에 의존하지 않으며 Stage21 이미지 선로드를 복구하지 않는다. 정적 근경은 기존 bounded world tile/screen cache를 사용한다. 나무는 정지하며 새 모션은 없다. 물/날씨는 기존 renderer에 맡긴다.
- `shared/data/campaign.json`, 모든 지형/경로/적/목표/이벤트/HP/XP/스토리, mapRevision20 및 저장 정책을 그대로 둔다. 버려진 수레를 복구하지 않는다. 기존 visual debug overlay를 유지한다. 2장 이후 미술, 묵종 미병합안, 독립 모션 데모, 타이틀/첫접속 소스를 수정하지 않는다.

## 한정 검증

`npm run build`, HTTP 서버 위 `python tests/stage1-location-art.py`를 사용한다. 실제 Chromium의 기본 카메라(1440×900, .94), 고목·개울(.68), 줌아웃(.30), 동쪽 출구, 모바일 viewport(480×900, .56)를 확인한다. 이 화면들은 지정 카메라 진단이며 정상 전투 완주 증거는 아니다.

- 렌더 전후 전투 JSON 동일. 24 정적 프레임의 Canvas filter 실행 0회, 화면 캐시 재사용, world tile 32개 유지/상한48, 추가 world build 없음.
- SKY 3화면비 × 좌우 외곽4위치 × 상하2위치 =24경우 coverage 확인. 화면비별 원경은 같은 SKY 계약이며 큰 world 사각형 확대를 사용하지 않는다.
- 실제 엔진 fixture에서 기본 보행 x250→394.99와 접지, x2101의 지면→low-pine-root 점프/착지 y1406.728을 확인한다. 두 기존 가지는 oneWay와 HP340을 유지한다. 출구 좌표 x5210/y693.413도 동일하다. fixture 배치는 정상 전투 전체 이동과 구분한다.
- 1장 요청 후 Stage21 이미지 요청0, 다른 pilot 장 이미지 요청0을 확인한다. debug overlay on/off가 월드 캐시 키/전투를 바꾸지 않는다. pageerror0.
- 캐릭터/적 미술과 물/날씨 코드는 불변이다. 다른 장 순회·기예 검사·전체 verify·정상 전투 완주는 실행하지 않는다.

증거와 실제 PNG: `_local/reports/stage1-location-paint/`. 기본/고목·개울/모바일 3장은 Library에 저장한다. 줌아웃과 출구 화면도 로컬에 보존한다.

## 최종 화면 Library 저장

2026-10-18 실제 Chromium PNG 세 개를 새 Library 파일로 저장했다(모두 v0).

| 화면 | Library ID | 로컬 증거 |
|---|---|---|
| 정상 기본 카메라 | `libfile_ee50d53eea1481918af17558ea3cd35e` | `stage1-default.png` |
| 중앙 고목·개울 | `libfile_ccb9a3b0a5e881918000d3e73323f5a6` | `stage1-great-pine-creek.png` |
| 모바일 480×900 / .56 진단 카메라 | `libfile_e7b670df4bd88191a1cb3a6b5d5a76ea` | `stage1-mobile.png` |
