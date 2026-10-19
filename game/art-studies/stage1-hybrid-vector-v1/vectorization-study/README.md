# 승인 원화 벡터화 표본: 24 / 48색

승인 `game/docs/art-references/stage1-balanced-20261019/balanced.png` 하나에만 적용한 통제된 오프라인 실험이다. 새 이미지 생성, 기존 맵 결합, UI·본게임 변경은 없다. **두 후보 모두 용량·복잡도 부적합으로 판정했으며 추가 조합은 실행하지 않았다.**

[실제 Chromium 비교 PNG](comparison.png)는 원본·24색·48색 전체를 같은 0.5배로, 고목/흙길의 동일 원본 영역을 같은 1:1 배율로 함께 보여준다. 원본의 투명 외곽은 SVG에서도 투명하며, PNG의 가장자리 픽셀별 중간 alpha는 벡터 면의 coverage로 바뀐다. 근경 SVG에 래스터 삽입은 없다.

| 후보 | 실제 색 수 | Path 수 | Cubic 구간 | raw bytes | gzip-9 bytes | 래스터 참조 |
|---|---:|---:|---:|---:|---:|---:|
| [24색](balanced-24.svg) | 24 | 2,939 | 129,882 | 3,508,599 | 1,154,584 | 0 |
| [48색](balanced-48.svg) | 48 | 3,119 | 129,374 | 3,437,814 | 1,136,532 | 0 |

줄기·뿌리·암반의 중간 형태는 수작업 도형 시안보다 원화에 가깝게 남는다. 24색은 명암과 색 뭉침이 더 두드러지고 48색은 돌과 흙의 분리가 조금 낫지만, 둘 다 잔질감을 과도한 cubic 구간으로 보존하고 일부 부유 조각도 남으므로 현재 결과를 통합 가능한 자산이나 미술 완료로 보지 않는다.

## 재현

[공식 프로젝트 README](https://github.com/visioncortex/vtracer/blob/master/README.md)와 [공식 PyPI 패키지](https://pypi.org/project/vtracer/0.6.15/)를 참고했다. 실제 설치된 `vtracer==0.6.15` Python signature를 읽고 그 API만 사용했다. 최신 CLI 전용 `--max-colors`·`--simplify`를 이 Python API에 전달하지 않았다.

```sh
python -m pip install --target /tmp/honro-vectorization-tools vtracer==0.6.15
PYTHONPATH=/tmp/honro-vectorization-tools python game/art-studies/stage1-hybrid-vector-v1/vectorization-study/convert.py
python game/art-studies/stage1-hybrid-vector-v1/vectorization-study/render_comparison.py
```

Pillow·numpy·Playwright·Chromium은 기존 실행 환경의 저작 도구를 사용했다. 런타임 의존성·package.json·lockfile에 추가하지 않았다. `convert.py`는 24색·48색 두 번만 변환한다. palette는 투명 픽셀을 제외한 MEDIANCUT 학습과 무디더링 양자화를 사용하고 최종 fill도 같은 palette로 제한한다. 두 후보에 동일한 `filter_speckle=14`, `mode=spline`, `length_threshold=10`, `max_iterations=10`, `path_precision=1` 등을 적용했다. **이 버전의 spline fitting/subdivision 제어는 최신 엔진의 post-fit `--simplify`와 다르며, 그 단순화 기능을 실행했다고 주장하지 않는다.**

설정·실제 API·원본 해시·버전·바이트·경로 수·브라우저 기록은 [results.json](results.json)에 있다. 각 SVG는 몇 MB라서 그 결과를 부적합으로 보존하고 실험을 끝냈다. 게임/저장/전투 검사나 벤치마크는 실행하지 않았다.
