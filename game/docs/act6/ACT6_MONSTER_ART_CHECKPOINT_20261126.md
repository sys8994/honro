# 6막 신규 몬스터 벡터 재제작: 실험 체크포인트
2026-11-26. 기준 master: `29793bee12a199e53bd8c0509ced68b827e09e1e`.

이 디렉터리는 제작 도구 및 재현 자료이며 게임 빌드와 분리되어 있다. 기존 배포본의 자산이나 스탯은 바꾸지 않았다. 현재 8종의 정지 벡터 초안과 1종(거꾸로 매달린 상주)의 관절 실험을 재현한다.

## 원본
승인 시안 두 장을 실행 폴더의 `sources/`에 둔다. 원화 파일은 배포 파일에 넣지 않는다.
- 외부: `exec-05c85a45-d3a6-45eb-86ec-10067bcac662.png`, SHA-256 `1e7a512f07db4e90a84548a859f8d469bf421bc1db7b5cd3f9ade27bd64bb8c1`.
- 내부: `exec-f3040e46-962f-4923-b0bd-fc35abde703d.png`, SHA-256 `0907c066706a59f911cb6466acb1502fafa4b702821015a89604b29f036c71af`.

## 재현
실험 폴더에서 Python 3, Pillow, NumPy, SciPy, svgpathtools, Inkscape 1.4 사용. 헤드리스 초기화가 필요한 컴퓨터에서는 저장소의 `tools/stage43/honro-inkscape-headless-init.cpp`를 shared library로 빌드하고 해당 실행에만 LD_PRELOAD를 지정한다. Inkscape 설정·캐시는 쓰기 가능한 별도 작업 폴더를 지정한다.

```sh
python3 extract-concepts.py
python3 trace-runtime-palette.py cutouts/boss_daedosa.png color-probe-v2/boss_daedosa boss_daedosa
python3 prepare-rig-probe.py
for part in garment farReach face nearReach; do
  python3 trace-runtime-palette.py rig-parts/grot_hanging/$part.png rig-parts/grot_hanging/$part 6
done
node assemble-hanging-probe.mjs
HONRO_ROOT=/path/to/honro node render-hanging-probe.mjs
```

별도 브라우저 설치를 쓰려면 HONRO_CHROMIUM_BINARY, HONRO_QA_PLAYWRIGHT에 해당 실행파일·Playwright ESM 진입점 경로를 지정한다. 색상 레시피는 종 ID를 인자로 받으며 숫자를 주면 자동 팔레트 비교본을 만든다. 원근용 디테일 등급은 아직 붙이지 않았다.

## 실제 근거와 한계
- 11색 원본 추적 8종은 임베디드 래스터 없이 복원했다. 8색 비교 방식은 본체 윤곽과 물감 패스를 각각 Inkscape로 추적해 clipPath/transform 없이 게임이 받는 절대 M/L/C/Q/Z 경로를 만들었으며 합계 약 1.04 MB다. 단청과 금실, 매듭의 색이 눌려 최종 채택하지 않았다.
- 수동 팔레트 비교 시 미세 색 띠가 전부 제거된 경우 Inkscape가 페이지 바탕을 반환하는 것을 발견했다. 빈 마스크를 건너뛰고 페이지 전체를 덮는 경로는 오류 처리했다.
- 상주는 옷, 뒤팔, 얼굴, 앞팔 4개 파트. 원형 마스크 점유 픽셀의 99.78%를 파트에 배정했다. 실제 앱의 actor-vector.js와 monster-vector.js를 로드한 브라우저 격리 화면에서 64/140/270 px, 대기/예고/공격/피격, 양 방향 총 12회 그리기를 확인했다. 이 검사는 게임 스테이지 진입이나 캐릭터 직접 조작을 증명하지 않는다. 큰 배율에서 손 관절과 외곽의 미세한 밝은 선, 과한 잔무늬가 남는다.
- 앱의 액터 빌드에 아직 연결하지 않았다. 옛 도사와 기존 괴이 노드 허용치가 새 디자인 대비 낮으므로 전역 제한을 푸는 대신, 종별 실제 노드·경로와 전투 14체 렌더 비용을 측정해 필요한 종만 예산을 분리한다.

## 다음 실행 순서
1. 대도사는 색 보존을 고른 뒤 아래 옷자락을 실제로 연장하고 봉합한다. 몸통·양팔·얼굴·관 장식은 서로 다른 피벗을 쓴다. 걸치는 경계에 같은 재질의 밑면을 넣고 전환 프레임을 본다. 상주는 기존 본체 색 층을 합치고 팔·머리는 개별 유지한다.
2. 배치를 바꾸지 않고 새 몸체의 필요 치수를 확인한다. 58장 `spawnGrot`의 기존 h/r은 상주 150/30, 천수귀 140/30, 문짝 150/36. 체급을 과감히 벌리되 몸통과 팔다리의 실루엣 차이를 기준으로 피격 폭을 설정한다. 높은 천장·측벽 또는 포격 사선과 충돌하는 배율은 안전 자리부터 찾는다. 59장은 실제 선봉·증원 모두 종류에 맞춰 넘쳐온 원혼과 맺힌 원혼을 별도 그림으로 연결한다. 앞발, 문턱 꼭두는 지지면·퇴각로를 가리지 않는 크기와 패턴을 검증한다.
3. 상주의 실제 예고는 `honroDrop`이며 일반 `honroMonsterWindup`이 아니다. 임의 상태를 넘긴 렌더 캡처를 실전 연동의 근거로 사용하지 않는다. 기존 이벤트와 모션 연결 후 58/59장의 실제 카메라 및 피격, 목표 달성에 영향이 없는지 핵심 경로를 확인한다. 대사·지형이나 이미 진행 중인 저장은 이번 수정에서 건드리지 않는다.
