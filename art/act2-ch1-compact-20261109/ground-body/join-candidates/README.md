# nearBODY–foundation 접합 후보 B

부모가 전체 시안 대조 후 선택한 B의 통합 후보는 `final.asset.json`과 `final.svg`다. **저작 RAW fallback**이며 최적화로 줄였다고 표시하지 않는다. 근경 원본·native RAW·기존 final과 foundation 원본은 수정하지 않았다. 새 충돌·외곽 dummy·카메라 제한·공통 렌더러 변경은 없다.

기존 큰 U판 하연은 원본의 어두운 기반면까지 한 창으로 자른 데서 생겼다. A는 실제 보이는 광물면의 native union clip만 남겼지만 큰 암면·균열의 의미가 약해져 제외했다. B는 원본 8색 stack을 실제 Inkscape의 union/difference로 **보이는 비중첩 영역**으로 분리하고, 기존 `vector.gradients`의 원본 색별 alpha로 아래 foundation과 연결한다. 새 자연 암면을 코드로 그리지 않았다.

첫 B는 원래 전체 alpha의 직사각 옆면을 되살려 제외했다. 다음 B는 기존 composition alpha를 유지했으나, Boolean 분해가 원래 stack의 AA 겹침까지 제거해 보행면 보호 검사를 통과하지 못했다. 선택 B-v3는 **world y2580 위를 원래 stack 그대로 보존**하고 그 아래 접합부에만 비중첩 색면과 fade를 쓴다. 최고 바닥 y2530보다 50world 아래에서 합성한다. 두 상보적 `pixelSnapClip` 사각 창은 그리기 구간을 나누는 기존 합성 기능이며 그려지는 사각형이나 지형이 아니다.

접합 끝은 원본 색 역할에 따라 world y2900~2980이다. 원본 광물면의 형태를 따라 연속된 색이 내려가다가 foundation으로 이어진다. 새 U 실루엣은 그리지 않았다. 화면상 큰 U/직사각 하연은 사라졌지만, 동쪽 확대에서는 하부 Boolean 경계에 아주 가는 AA 윤곽이 남는다. foundation의 큰 면 크기·대비·확장 노출은 부모의 별도 작업이다.

`import-join.py`는 **이 자산에 한정한 명시 매핑**이다. 일반 SVG importer는 gradient/clip를 여전히 거부한다. 이 도구는 그 importer로 모든 solid path와 예산을 검사하고, 기존 schema의 clip·명시적인 `userSpaceOnUse` linear-gradient 좌표/stop·두 사각 창의 기존 pixelSnapClip만 복원한다. native Inkscape가 만든 href/clip 이름 alias는 원래 정의와 좌표·stop·도형이 정확히 일치할 때만 정규화한다. gradientTransform·filter·mask·group opacity는 지원하지 않고 거부한다. 엔진에 SVG 기능을 추가하지 않았다.

자체 중간 SVG의 clip 자식 path가 부모 clipPath와 같은 editor id를 가졌던 문제도 실제 Inkscape 재실행에서 발견해 수정했다. 자식 id만 제거했으며 모든 도형·색·transform·참조는 같다는 대조를 남겼다. 잘못된 중간본과 거부 로그는 보존했다.

선택 자산은 327,637B, SVG는 325,542B다. 26 nodes/16 paint paths/4 clips/7 gradients, 최대 paint compound 55,007문자, 최대 clip 2,100문자로 기존 한도 안이며 image는 0개다. 실제 native Simplify 1e-5/5e-5는 하부 fade의 전체 alpha 실루엣 오차가 기존 한도를 넘어 제외했다. 하부 precision6은 1x/2x 오차 0이지만 엔진 자산 bytes가 줄지 않아 RAW를 유지했다. clip/gradient/원본 색 역할은 모든 평가에서 보존했다.

검사는 분리했다.

- **원래 엔진 그림→새 저작 엔진 그림:** 하부 alpha 변경은 의도한 저작이므로 전체 그림 동일성은 실패로 남긴다. 보행면 보호부는 1774/3548px에서 실루엣 0px, 보호 변경 비율 0, RGB MAE 최대 0.000174로 기존 기준 안이다. 추가 clip의 AA 때문에 상부 전체 픽셀의 문자 그대로 동일함은 주장하지 않는다.
- **저작 RAW→최종 엔진 자산:** 1774/3548px의 색·alpha·보호 오차 모두 0, vector도 정확히 같다. 기존 runtime/environment validator 오류는 0이다.
- **SVG raster backend→Canvas 엔진:** 1774px의 전체 RGB MAE 0.03273, 보호 RGB 3.2483/실루엣 1px로 보호 gate를 **통과하지 못했다**. 이것을 RAW→FINAL 성공에 섞지 않았고 한도를 바꾸지 않았다.
- **직접 관찰:** 공통 HonroScene의 overview/normal0.94/200%1.88/east/portrait-down을 확인했다. 이는 오프라인 진단 editorView이며 브라우저 실제 입력·전투·저장·성능·배포 검수가 아니다. 부모의 최신 foundation 1.1 배치 통합 후에는 다시 확인해야 한다.

불변 선택 RAW는 `optimization-v2/authored-raw.svg`와 `.asset.json`이다. `DELIVERY.json`에 선택 파일·hash·범위를 적었다. 자동 PNG·검사·로그·profile은 `_local/reports/act2-redesign-20261109/ground-body-join/`, 실패·중간 벡터는 `_local/archive/act2-redesign-20261109/ground-body-join/`에 있다. `RELOCATION.json`으로 이전 경로를 찾는다.

선택 RAW에서 자산 재현 및 검증:

```powershell
$join = "art/act2-ch1-compact-20261109/ground-body/join-candidates"
python "$join/import-join.py" "$join/optimization-v2/authored-raw.svg" "$join/reproduced.asset.json"
python "$join/verify-join.py"
node "$join/capture-final.mjs" "$join/final.asset.json" final-recheck
```

전체 기하 재현 순서는 `native-visible.py` → `make-candidates.py` → `preserve-contact.py` → `optimize-join.py`다. 실제 Inkscape 실행 파일을 인자로 받는다. 기존 native/저작 RAW를 덮어쓰지 않게 새 출력 버전을 사용한다. `native-visible/`의 8개 visible SVG는 실제 native Boolean 출력 원본이다. native 명령은 보고서의 `native-visible/derivation.json`과 각 로그에 있다. 최적화는 이미 기록된 두 native 후보만 실행했으며 실패 후보의 gate를 완화해 반복 탐색하지 않았다.
