# 41장 접합 색면·단일 coverage 수정

기준: `f20e8f4a39470ed632f01c9237cb95d4501c6eb0`. 기존 근경 원본·접촉·충돌·게임플레이와 다른 장은 보존한다.

## 채택 범위

- 원본 `near-import`의 a/b 색면에 내부 alpha와 외부 ownership clip이 반복 적용되면서 밝은 수평선·지그재그가 누적됐다. `compose-source-coverage.py`는 **기존 alpha와 기존 외부 clip의 교집합만** 실제 Inkscape에서 계산한다. 각 원본 branch는 변경하지 않은 path/transform을 복제해 최종 coverage를 한 번 적용한다.
- source와 west의 서로 배타적인 영역은 독립 source-over 합성 시 가장자리 coverage가 0.5+0.5=0.75로 남았다. 두 영역과 기존 하부 사각 바탕을 bounded 임시 surface에서 premultiplied coverage 합산하고, 겹치는 east/deep/원본 overlay는 source-over로 유지한다. 새 도형·윤곽선·덧칠을 추가하지 않는다.
- 서쪽 기존 암영 노드 하나의 `#47372c`를 기존 공통 암영 `#3a3029`로 조정했다. `shadow-original.svg` → `shadow-native-edited.svg`는 실제 Inkscape fill-only 편집이며 path 문자열은 같다. 런타임 JSON은 이 색상 토큰 하나 외의 바이트가 같다.
- 원본 벡터/충돌, 천막·계단·발판·바위의 경로좌표와 모든41~50장 stage/content는 바꾸지 않는다. AA와 서쪽 암영 색상이 바뀌므로 전체 픽셀 불변을 주장하지 않는다.

## native/최적화

`source-coverage.json`만 활성화한다. 실제 Inkscape Boolean 뒤 epsilon0.01,951/1902px 동일 rasterizer 검사에서 main-a178→178, main-b1899→1609, overlay-a44→44, overlay-b172→146 segments. 네 후보 모두 기존 오차 한도 내 통과했다. 원본 path를 줄인 수치가 아니라 **파생 coverage mask** 최적화 수치다. 기존 벡터 색상만 편집했으므로 새 그림의 raster 추적은 수행하지 않았다.

`source-coverage-proof.json`, `shadow-edit-proof.json`은 native 입력/출력·불변 근거다. 테스트는 내부 경계에서0.05source-unit 이내 점을 제외하고394,049점의 기존 coverage 의미가 같음을 확인한다.

## 반려·미사용

`ownership-mask.json` 및 `upper-*`, `west-final-*`, `source-main-final-*`은 native 암괴 소유권 확장 실험이다. 가시 원본 비보행면3758source-pixel을 바꾸고 실제 주요 절단을 해결하지 못해 **반려했다. 활성 로더/런타임에서 사용하지 않는다.** 기존 `source-main-original-native.svg`만 원래 ownership 교집합 입력으로 재사용한다.

생성 접합 시안은 표시용 데이터만 반환되어 지원되는 로컬 파일 경로를 확보하지 못했다. 저장 경로를 추측하거나 대형 데이터를 분할하지 않았으며 프로젝트/배포에 사용하지 않는다.

## 검수 범위

- 원본vector·기존 path/clip/충돌 및 다른 장의 데이터 보존 확인.
- 실제 renderer 분기와 독립 합성 oracle, clip/transform/opacity, asset 불변, 예외시 scratch 해제 회귀.
- Native 실제 Scene의 서·동·전체·390×844세로 화면 및 렌더 상태 불변 확인. Native는 실제 브라우저/모바일 기기 검수가 아니다.
- 공식 CI, master/Pages, 공개 UI와 짧은 이동 검수는 최종 배포 기록을 참조한다. 전체 미션 완주나 정량 게임플레이 재검수는 이 미술 수정 범위가 아니다.
