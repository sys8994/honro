# 숲길 하이브리드 벡터 시안 01

[시안 열기](https://sys8994.github.io/honro/game/art-studies/stage1-hybrid-vector-v1/) · [전체 구도](https://sys8994.github.io/honro/game/art-studies/stage1-hybrid-vector-v1/?view=overview)

6000 × 3000 world의 독립 미술 시안이다. 낮은 입구 숲길 → 고목 뿌리 옆 골 → 불규칙 암반 어깨 → 높은 오른쪽 능선으로 이어진다. 본게임 지형·캠페인·전투·퀘스트·저장·활성 렌더러는 변경하지 않는다. 고목 오른쪽 가지의 선택 높이는 윤곽선 토글에서만 예정 접촉선으로 표시한다. 게임 충돌/이동 검증이나 최종 미술 승인을 뜻하지 않는다.

`game/docs/art-references/stage1-balanced-20261019/balanced.png`의 실제 픽셀에서 한국 산림의 색과 재질·접지 관계를 참고했다. 그림 삽입·자동 트레이싱·기존 지형 윤곽 복제는 사용하지 않았다. 결과는 회화 참고보다 단순하고 그래픽적인 벡터 표현이다.

## 소스와 기법

- `foreground.svg`: 편집 가능한 근경 원본. 흙 사면, 화강암 면, 나무·뿌리·수관·수풀·돌 모두 저작 SVG Path다. 552개 Path 정의. 주요 수관은 개별 곡선 윤곽과 면으로 저작하며 `<use>`는 주로 동일 윤곽의 clip 참조에 사용한다. 근경 `<image>` 0, SVG 필터 0.
- `index.html`: 첫 HTML 페인트부터 지형이 보이도록 같은 벡터를 인라인한다. 원경 로드/디코드 성공을 기다리지 않는다. `build.mjs`가 근경 원본을 인라인하므로 두 군데를 따로 편집하지 않는다.
- `study.js` / `study.css`: 이벤트 발생 시에만 SVG viewBox를 바꾸는 독립 카메라. 드래그/터치 팬, 포인터 중심 휠 줌, 두 손가락 핀치, 전체/근경/예정 접촉선. idle RAF나 거대한 전체 맵 Canvas 재생성이 없다. 키보드 화살표, +/−도 지원한다.
- 원경만 기존 `../../../shared/assets/environment/quiet-layered/far.webp`를 그대로 참조한다. CSS opacity와 배경 혼합으로 대비를 낮추며 실시간 픽셀 필터는 없다.
- 광원은 왼쪽 위. 큰 곡면 그라디언트, 바위당 3–5개의 큰 면, 제한된 긴 균열, 국소 접촉 그림자를 사용한다. 지형은 하나의 연속된 몸체로 최대 카메라의 좌우/하단까지 이어진다. 하단 alpha fade는 없으며 전면 흙 사면과 큰 암반의 겹침은 낮은 대비로 남는다.
- `seol-o-scale.svg`: 저장소 승인 `HONRO_PARTY.seol_o`와 `HonroVectorRig.poseSVG(..., 'idle', 0)`로 생성한 정지 벡터 포즈. 사람 크기 비교만을 위한 표시다. 실제 visible bbox y=11.97595…479, 높이 467.02405를 측정해 world H=103.5로 맞췄고 발을 예정 보행면에 둔다. 새 캐릭터/모션을 저작하지 않았다.

의존성 설치 없이 저장소 루트에서 `node game/art-studies/stage1-hybrid-vector-v1/build.mjs`로 이 디렉터리의 인라인 SVG와 정지 포즈만 갱신한다. 저장소 루트의 정적 HTTP 서버에서 `game/art-studies/stage1-hybrid-vector-v1/`를 연다. 게임 빌드는 실행하지 않는다.

## 실제 확인과 용량

보강본은 정상 배율 1440×960과 최대 줌아웃 1440×960 두 화면을 갱신해 이전 180c5555 픽셀과 비교했다. 고목의 개별 수관·가지 갈라짐·긴 수피 면·매듭, 암반별 곡면·좁은 틈·흙 가림, 돌 사이 골과 뿌리 접지를 보강하고 원경 혼합을 차갑게 낮췄다. JS page error와 요청 HTTP 오류는 0이다. 카메라 기능·사람 H는 그대로이며 새 기능·게임·스킬·저장 검사는 실행하지 않았다. `mobile.png`와 기존 팬/핀치/토글 결과는 180c5555의 이전 증거로 보존했으며 이번 보강본의 모바일 재검수로 표시하지 않는다.

실제 결과는 여전히 단순화한 벡터 일러스트로 읽힌다. 특히 작은 소나무와 일부 수풀·암반, 하단의 넓은 흙 면은 승인 회화의 자연스러운 형태 밀도에 못 미치므로 최종 미술 품질이 승인됐다고 기록하지 않는다.

| 파일 | raw bytes | gzip-9 bytes |
|---|---:|---:|
| foreground.svg | 169,363 | 58,374 |
| index.html (근경 인라인 포함) | 170,227 | 59,130 |
| study.js | 4,099 | 1,601 |
| study.css | 1,716 | 778 |
| seol-o-scale.svg | 18,771 | 5,823 |
| 기존 far.webp | 952,722 | 952,878 |

gzip 값은 `gzip.compress(..., compresslevel=9, mtime=0)` 실측이다. foreground.svg는 편집 원본으로 보존하며 페이지에서는 다시 요청하지 않는다. 배포 서버가 실제 gzip을 적용하는지는 이 수치와 별개다. 원경 파일은 재압축/복사하지 않았다.

- [정상 배율](evidence/normal.png)
- [최대 줌아웃](evidence/overview.png)
- [이전 180c5555 모바일](evidence/mobile.png)
- [최소 확인 및 바이트 기록](evidence/checks.json)
