# 50장 연속 암벽 제작 중

기준 master `a088669bbecad0024a165a37cdf9ae960e2cccfe`, tree `8b03e6e14068443fc99444bd90af1ac7314cc255`와 같은 로컬 tree에서 작업한다. 50장만 변경한다. 원본·다른 장·충돌·저장·카메라 정책을 보존한다.

## 제작 원본 보존

- `near-import.json` 50장 원본 1774×887은 불변이며 산문, 모든 석계단과 난간, 중앙 아치를 보호한다.
- 생성 시안 v2 PNG SHA256 `6a33ea44a43e99538990cb59b7b8b69020e4cfcb7af66bac87ad91418d7f3625`, 1254×1254, 1,343,210 bytes. 로컬 원본 및 소유자 Library에 원본 그대로 보존한다. 현재 GitHub 문자열 전송 경로의 지원 크기 안에서 이 PNG를 직접 보존할 수 없어 Git에는 포함하지 않는다. 분할/인코딩 우회는 하지 않는다. 재추적에는 보존된 원본 PNG를 `source/concept-v2.png`에 두어야 한다.
- `source/trace-v2/color-raw.svg`, `alpha-raw.svg`는 실제 Inkscape 1.4 추적 결과다. 8색, nativealpha 50% 기준. raw는 불변이다.
- raw→epsilon0.35 최적화: 30,320→15,194 세그먼트, 436,554→228,146 bytes. 890 subpaths 보존. 640/1280px 실제 Inkscape 비교 통과. 수치는 미술 승인이나 FPS 증거가 아니다.
- 넓은 첫 시안과 처음 두 등록 방식은 사각 접합/맞지 않는 축척 때문에 반려했다. 로컬 시안·캡처는 보존하며 배포하지 않았다.

## 상태

현재 시각 접합 검수 중. master 통합·CI·Pages·실제 공개 입력 검수 미완료. 원본 데이터/보행/아치/6개 화면비 bounds 검사와 실제 이미지 품질을 구분한다.
