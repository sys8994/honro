# r27–r30 체크포인트 — 미술 FAIL

기준 브랜치 `art/vector-art-correction-v2`, 이전 원격 체크포인트 `973087cd9bf6824dfb08dff124d1b76f9eb5367e`에서 이어진 미승인 실험이다. 사용자가 실제로 본 r25의 작은 암반 창문과 빈 흙 전경 거절은 유지한다. 모듈을 각 한 번만 써야 한다는 제한은 잘못된 자체 해석이었다. 재사용은 가능하지만 반복과 과대 크기는 허용되지 않는다.

r27은 전체 원본 모듈을 전경에 놓았으나 사각 끝과 반복된 내부 홈이 드러났다. r28은 여섯 직접 그린 판이 줄을 이루고 중간 띠가 비었다. r29는 겹침을 늘려 빈 부분을 줄였으나 같은 여섯 형태의 카펫이 되었다. r30은 반복 템플릿 대신 새 전체 장면 참조에서 네이티브 경로를 도출했다. 실제 화면에서 큰 색 조각과 거친 포스터화가 보이며, 왼쪽 가장자리 확장은 띠가 된다. 네 후보 모두 FAIL이다.

현재 런타임은 첫 프레임부터 9개의 compound Path2D를 준비한다. 기존 월드 타일 캐시를 사용하며 근경 raster image 참조·SVG image·필터·새 idle RAF는 없다. 새 PNG는 이미지 생성 도구로 만든 **미승인 오프라인 저작 참조**이며 실제 게임 자산으로 로드하지 않는다. 이 실험은 고품질 수작업 벡터 설계의 완성이 아니다. 경계 단순화에 의존한 10,713노드는 품질 근거가 아니다.

`foreground.svg`와 런타임 `foreground.json`은 저장된 derive 도구로 재생성했을 때 바이트가 동일했다. source-edge 확대는 중앙 최소 줌의 외곽만 덮으며 최대 팬 도메인 전체에 자연스러운 지형을 저작한 것은 아니다. 실제 게임 최소 줌은 이번 wide 캡처부터 사용했다(1440/6800 ≈ 0.21176470588235294). 이전 wide .24를 최대 줌아웃의 증거로 삼지 않는다.

| 자산 | raw bytes | gzip bytes |
| --- | ---: | ---: |
| `shared/assets/environment/ferry-scene/foreground.svg` | 89,689 | 36,281 |
| `shared/assets/environment/ferry-scene/foreground.json` | 89,092 | 36,093 |
| `shared/assets/environment/vector-campaign-parts.json` | 193,819 | 44,294 |
| `shared/assets/environment/quiet-layered/far.webp` | 952,722 | 952,878 |
| `game/art-studies/ferry-foreground-authoring/reference.png` | 2,490,627 | 2,447,725 |

위 두 foreground 파일은 같은 기하의 편집/실행 표현이다. gzip은 표준 gzip, mtime=0으로 실제 측정했다. 기존 공통 파트 라이브러리를 포함한 최종 번들 크기와 혼동하지 않는다. 보존된 원경도 별도 표기했다.

실제 화면:

- `evidence/ferry-native-field-r30/stage03-normal.png`
- `evidence/ferry-native-field-r30/stage03-wide.png`
- `evidence/ferry-native-field-r30-mobile/stage03-mobile.png`

촬영 전후 소스 hash: `sha256:941bd61226a4cc1b9c4a48dea42ec63f44e5ca3c0b5d1064a80b3eeb549abd3d`. 모든 캡처 page errors 0, 비미술 상태 불변(pure true), 소스 안정. 원본 receipt와 불변 snapshot이 manifest에 연결되어 있다. preflight `ferry-native-field-r30-state.json`에는 캡처가 없으며 검토 차수로 세지 않는다.

Stage1 반복 대형 암석/평면 수관, Stage18 빈 전경, Stage21 주변 지형 문제도 해결되지 않았다. 다른 장으로 확장하지 않았다. 최종 검수와 부모의 실제 픽셀 승인은 없다. `manifest.final`은 null이며 배포 게이트는 차단 상태로 남는다. master 통합 및 Pages 배포는 실행하지 않았다.
