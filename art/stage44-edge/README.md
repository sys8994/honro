# 44장 귀림 외곽 연속화 후보

기준: 2847341 (33장 8292843와 42장 통합 후보를 포함한 로컬 기준). 별도 브랜치이며 현재 미배포.

보존: 6800 월드 폭, 기존 root-floor/root-road 충돌, 두 갈래 통과·합류, 대사/배우/목표/저장/revision. 미술 외곽만 변경.

관찰: 기존 공통 act5-edge-art prepare가 원본 경계 1px을 늘리고 그라데이션으로 흐림 처리. Native 서쪽 화면에서 왼쪽 외곽에 늘어난 검은/회색 띠 확인. 실제 브라우저 미검증.

시안: 기존 근경을 구조 참조, stage21-concept를 화풍 참조로 첨부하고 좌우 및 하단으로 뿌리/지질을 이어 생성. 정측면·원본 보행면·구멍·계단 보존, 블러/반복/신규 경로 금지. 원본 중앙을 그대로 교체하지 않고 외곽만 사용.

Inkscape 1.4 실제 색16·alpha 추적. 최초 raw 전체 최적화는 alpha clip 보호 때문에 감량하지 못했음. 의미 외곽을 실제 Inkscape intersection으로 추출 후 별도 최적화. 좌표는 템플릿 상관에 의한 scale 0.75, x+263, y+3를 출발점으로 하며 실제 Scene에서 접합 확인 후만 채택.

현재 후보/제작 중이며 시각 합격·실플레이·성능·배포를 주장하지 않음.

## 재현

`LD_PRELOAD=/tmp/honro-inkscape-headless-init.so python tools/environment/trace-compact-native.py art/stage44-edge/extended-root-concept.png NEW_TRACE_DIRECTORY /usr/bin/inkscape 16 4 true` (초기화 보조가 필요한 실행 환경에만 사용). 실제 원본은 native-raw.svg 보존.
`extract-exterior.py`는 native-color/alpha 추적에서 의미 외곽을 Boolean intersection한다. 그 결과에 `tools/terrain-node-optimizer/optimize_svg.py --epsilon 1.2 --render-widths 1280` 적용. 최적화 후보는 9374→9153 segments, 534731→403348 bytes, 형상 오차 게이트 통과. raw 전체 초기 최적화는 clip 때문에 감량하지 못했으며 이는 별도 실패 기록이다.
`import-native-clip.py COLOR ALPHA --config art/stage44-edge/config.json --output shared/assets/environment/act5/stage44-root-exterior.json` 다음 `finish-exterior.py`로 흰 alpha 매트 억제 및 의미 외곽 범위 적용. 런타임은 원본 보행/나무를 보존하고 원본 사각 종료 암면의 하단만 자연 면 방향으로 절개해 연결한다.

## BODY 연속화 재검수 후보

앞선 외곽만 덧대는 후보는 서쪽 수직/삼각형 접합과 동쪽 직각 절단으로 불합격. 최신은 원본 상부/얇은 서쪽 보행 접촉면을 보존하면서 하부 BODY를 한 장의 연속된 뿌리로 교체한다. 원본 색 경로는 수정하지 않고 `upper-alpha-raw.svg`의 실제 Inkscape Boolean 교차로 상부 alpha만 준비. runtime의 추가 concave clip은 native Canvas에서 회색 배경을 만들었으므로 중첩 clip을 제거했다.

재현 순서: trace 원본 → `register-west.py` → `extract-body.py` → BODY optimizer epsilon1.2 → native clip adapter → `finish-body.py`. 서쪽 등록은 생성된 뿌리 실루엣의 높이 단차를 원본좌표16(생성좌표12)만큼 내리고 x700까지 smoothstep으로0에 수렴시킨다. 새로운 윤곽/충돌을 만들지 않고 기존 trace의 좌표를 보정하며, alpha도 동일 등록한다. 반올림0.001 생성좌표. 실제 Inkscape Boolean 추출 뒤 최적화한 최종 파일을 별도 보존.

상부는 `extract-upper-alpha.py` → optimizer epsilon0.4. 최종 d는 기존 단일 clip 한도60000 이내로 어댑트한다. 처음 시도한 원본 색경로14개 전체 Boolean 교차는 불필요한 노드 증가/예산 초과로 폐기, 원본 경로는 그대로 유지했다. 전체 clip/collision/asset 예산은 완화하지 않았다.

BODY 최적화9860→9627 segments; upper alpha6284→3465 segments. 각1280 render 오차/성장 게이트 합격. `tests/act5-edge-art.mjs`에44의 vector validation·source purity·늘임 캐시 미사용 검증 추가. `tests/act5-terrain-contact.mjs`의10장 등록 테스트 통과. 최신 Native Scene 및 실제 브라우저 시각 검수는 별도이며 아직 최종 배포 합격을 주장하지 않는다.

再검수 기록: west10의 대각선 마스크 후보는 패치처럼 보이므로 폐기, 현재 west9로 복귀. west9에서 서쪽 silhouette 단차와 하부 삼각형은 없어졌지만 원본 x0에 짧은 수직 색 경계가 남는다. 아직 시각 합격 아님. east9은 이전 보행면 아래 직각 절단이 제거됨. 위 최신 수치는 폐기한v5에 해당하며 현재v4 report를 정본으로 참조.

west11: 원본alpha와BODY의 하부 접합 경계를10 원본좌표 위로 올려 보행면 아래 검은 직사각 띠 제거. 원본 색 경로·게임 충돌·접촉선은 유지. 좌측 수직 색 경계는 아직 수정 중. 현재 artifacts report가 정본이며 현재 코드로 시각 합격/배포를 주장하지 않는다.

## 좁은 색면 접합과 통합 검수

west13의 넓은 최소색차 경계는 주요 원본 가지 silhouette를 훼손하여 폐기. west14는 y575 아래 x0..45의 같은 색면만 선택해 구멍 아래 원본 가지를 보존. east13은 원본 x2172 종료에서 최대49좌표 안쪽의 같은색면 seam으로 세로절단 제거. 양측 원본/생성 BODY에 정확히 같은 상보경계를 실제 Inkscape Boolean 적용. 새 색면·블러·그라데이션 추가 없음. 중앙/전체 Native에서도 원래 큰 나무, 상하 경로, 배우·접촉 보존을 확인. 원본과 생성부의 재질/색면 차이는 약간 남는 명시적 한계이며 완전 동일 원화를 주장하지 않는다.

부모가 west14/east13 검수 후 전체 회귀 및 공개 통합 검증 진행을 허용했다. 19 release-guard tests, production build, act5-edge-art(44 native budgets/source purity/stretch cache 미사용), act5-terrain-contact, stage42-edge-geology, stage33-coastal-art 통과. 과거와 현재 Native gameplay SHA-256은 5ac732c2711ae9a2f6a24288106da696972aad8ded4edcce11bb066eb26ac955로 동일. build가 제거한 이전 tracked cache6개 복원, 이전 manifest의 모든 참조 파일(중복 포함42736개) SHA 보존 확인.

로컬 실제 Chromium 연결은 localhost ERR_CONNECTION_REFUSED로 실패. 기존 공개 탭·저장은 보존했으며, Native를 실플레이라고 주장하지 않음. 최신 master66f10605cd1769ebea518f415f1a50d2d5b2b7f9를 공식 connector와 git fetch로 확인한 뒤 좁은 통합/공개 실제표시 검수를 진행한다. a6894e2 체크포인트는 별도 art 브랜치541ab3d에 전체 tree 일치로 원격 보존했다.

## 공개 최종 검수

master02ec392ea6f6739064aafaea2d470e169ad750a6 공개, Pages43833223425 build/report/deploy 모두 성공. HONRO.html, manifest, chapter44 payload, ordered-common18 runtime의 공개 바이트가 검증한 로컬 빌드와 모두 일치.

새 공개 Chromium 탭에서 UI로 격리 검수 여정(디버그·기록 분리)에 진입하여5막4장 대화·배우·지형 표시 확인. D 실제 이동으로 이동도1100→554, 도약 후 공중 상태/479, 다시 이동하고 원본 경사 발판 착지 후 이동·발사 가능/280을 확인했다. 미니맵은 캐릭터 도착이 아니라 카메라 검사로 사용해 양끝과 중앙을 확인, 휠 확대/축소도 정상. 최근200 console 항목에서 게임 origin warn/error 없음(확장프로그램 metadata 오류는 별개). 전체 장 클리어, Android, 실측FPS, 좁은 화면 검수는 주장하지 않는다. 원본/생성부 재질 차이는 위에 기록한 남은 미술 한계. 기존 일반 저장 및 기존 공개 탭 보존, 별도 검수 탭을 결과로 유지했다.
