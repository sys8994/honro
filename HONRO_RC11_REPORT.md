# HONRO Act I RC11 — 수정·검증 요약

## 가장 큰 버그

폴리곤 위에 정상적으로 서 있는 상태가 body penetration 후보로 다시 들어가면서 support polygon의 top/side edge와 자기 충돌하는 경우가 있었다. 이때 이동·점프·발사 상태가 동시에 막힐 수 있었다. RC11에서는 swept edge contact를 **실제로 polygon 내부로 들어가는 운동만 충돌**로 처리하고, 현재 support contact는 penetration에서 분리했다.

## 맵 수정

- Stage 2: **5600×3600**. RC10보다 넓고 낮게 재설계. 중간 절벽 roost 4개 표적을 기본 활 A01 탄도 스윕으로 모두 도달 가능 확인.
- Stage 3: 진행 필수 다리 2개를 **indestructible polygon terrain**으로 변경. 공격으로 부서지지 않는다.
- Stage 10: 점프로 못 오르던 단차를 없애고 전체 진행길을 continuous hill로 재작성. main slope 최대 **0.60**.
- Stage 7: **3600×5000** 수직형 지그재그 4층 구조. 8개 waypoint를 실제 locomotion으로 통과.
- 10개 world ratio: `2.00, 1.56, 3.17, 1.35, 0.93, 1.81, 0.72, 2.73, 1.06, 1.37`.

필수 progression geometry와 파괴 가능한 cover를 분리했다. Stage 1/3/4/5/6/8/9/10은 시작점부터 출구까지 실제 movement solver로 통과시켰고 Stage 7은 층별 route를 별도로 검사했다.

## 누적 수정 유지

- 비정상적으로 길던 박쥐/까마귀/수의귀 계열 사거리 완화.
- 데스크톱 E 상호작용 안내 복구.
- Stage 5 담허 의식 위치 유지 → 폭포 사격창 개방 → 설오 고리쇠 타격 기믹 유지.
- 포스터는 전체를 메인 배경으로 사용하지 않음. 메인은 혼로 로고 crop, Stage 1~10 진입은 각각의 poster panel crop.
- 미니맵은 각 world aspect ratio를 그대로 보존.

## 검증

- RC11 polygon/map physics: **12/12**
- Browser acceptance: **39 checks**, runtime exception **0**
- Impact/fall/knockback/safe-contact: **29**
- Audio audit: **19**
- Charge/tuning: **192 profiles + 12 actual launches**
- Party pacing: **9**

상세 내용은 ZIP 내부 `PATCH_NOTES_RC11.md`, `MAP_DESIGN_RC11.md`, `VALIDATION.json`에 있다. 실제 사람이 1막 전체를 장시간 완주하는 QA와 실물 모바일 장시간 QA는 별도 범위다.
