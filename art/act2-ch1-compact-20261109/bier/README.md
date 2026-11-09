# 폐상여 자산 제작 후보

선택본은 `optimized-v5/final.svg`와 `runtime-v5/final.json`이다. 원본은 부모 에이전트가 imagegen으로 만든 `source-v1.png`이며 실제 크기는 **1254×1254**다. 1280으로 가정하거나 재샘플하지 않았다. 월드 `[850,2280,320,320]`에 균등 배치하고, 기존 상여 지붕 접촉선 `x910..1110/y2354.8888889`만 맞췄다. 손잡이·천·다리는 그림이며 새 충돌체가 아니다.

실제 Inkscape 1.4.4 native16/smooth/speckle4 색 추적과 별도 native alpha를 사용했다. 원본 source와 native RAW는 보존했다. 전체 추적에서 국화 꽃잎의 내부선이 소실되어 원본 RGB를 유지한 작은 꽃문양을 따로 native16 추적했다. 원본 금색 재질 마스크의 닫힘·최대 연결 성분·구멍 채우기는 문양 영역을 선택하는 절차이며 꽃 모양을 새로 그리지 않았다. 넓은 직사각 ROI의 색 이음, 흰 trace 배경 fringe, 연결된 금색 틀 선을 제외하는 꽃 crop 높이52px 보정은 중간 후보에서 발견해 해결하고 해당 후보를 보존했다.

접촉 교정은 원본 alpha를 가진 내부 그룹 뒤에 41 source px 목재 띠를 놓고 **새 외부 그룹**을 실제 Inkscape로 잘라 등록했다. 원본의 아래 천·다리·손잡이 alpha는 source y335 아래에서 변한 픽셀이 0개다. 밝은 실제 천은 재색칠하지 않았다. 정확한 trace 배경 사각형만 목재/금색 underpaint로 바꿨다. 이 변경들과 원본 추적 손실은 최적화 오차에 포함하지 않고 별도 기록했다.

선택 SVG는 1,190,901B, 엔진 자산은 1,197,234B다. 65 paint nodes/5 clip paths, 최대 paint compound 116,915문자로 기존 한도 안이다. raster image는 없다. 앞선 native Simplify 후보는 품질이 실패하거나 커졌으며 채택하지 않았다. 최종본은 precision6 정리만 적용하고 기하 세그먼트 축소를 주장하지 않는다.

기존 엔진의 320/528/640px RAW→FINAL 비교는 전부 통과했다. 보호 실루엣·alpha 오차는 0px, RGB MAE 최대 0.00000359이고 기존 벡터/환경 validator 오류는 0이다. 원본 SVG 렌더러→엔진 RAW의 AA/clip 가장자리 차이는 보호 기준을 **통과하지 못했다**. 이 결과는 최적화 통과와 분리해 남겼고 한도를 완화하지 않았다. 원본→native RGB MAE 2.1847, floral ROI 의도 편집 0.04207, 접촉 의도 편집 0.42409도 별도 기록했다.

실제 엔진 일반 크기와 200%, 원본/전체추적/문양복원 비교를 직접 관찰했다. 낡은 목재·붉은 금색 장식·찢어진 천·운반 손잡이의 의미는 유지했다. **현재 REAR/L1-back은 후보 배치다.** 정규 바닥에 천과 다리를 묻히는 정도, 전후 레이어, 실제 플레이·저장·브라우저·성능·배포는 부모의 통합 검수 대상이다. 미술 승인이나 사용자 승인, 전투 완료를 의미하지 않는다.

자동 자료는 `_local/reports/act2-redesign-20261109/bier/`, 실패·중간 그림 후보는 `_local/archive/act2-redesign-20261109/bier/`에 있다. `RELOCATION.json`에서 이전 경로를 찾을 수 있다. 주요 기록은 `production-loss.json`, `optimized-v5/optimization.json`, `runtime-v5/comparison.json`이다. 원본·guide·제작 입력·불변 native/authored RAW·final·config·재현 코드는 이 폴더에 보존했다.

재현 시 기존 RAW를 덮어쓰지 않고 새 출력 이름을 사용한다. 선택된 불변 native 입력에서 재저작하는 예:

```powershell
$ink = "_local/tools/inkscape-1.4.4/portable-complete/inkscape/bin/inkscape.com"
$asset = "art/act2-ch1-compact-20261109/bier"
python "$asset/author-bier.py" authored-repro $ink flower16-tight
python "$asset/optimize-bier.py" "$asset/authored-repro/contact-authored.svg" "$asset/optimized-repro" $ink --precision-only
python "$asset/export-asset.py" "$asset/optimized-repro/raw-authored.svg" "$asset/runtime-repro/raw"
python "$asset/export-asset.py" "$asset/optimized-repro/final.svg" "$asset/runtime-repro/final"
python "$asset/verify-runtime.py" runtime-repro optimized-repro
```

전체 native 재추적 인자는 `trace-bier.py SOURCE OUT EXE 16 4 true`(본체), `16 0 false`(꽃)다. 꽃의 원본 선택 입력은 `prepare-flower-rois.py`로 재현하고, 선택한 중앙은 `roi-flower-tight-sources/center.png`, 서·동은 alpha가 동일한 `roi-flower-sources/{west,east}.png`이다. 실제 native 설정과 원본 hash는 보고서의 각 trace.json 및 `DELIVERY.json`에 있다.
