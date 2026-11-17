# 32장 비보행 하부 전이 시안

## 범위

생산 d18b9ff9를 바꾸지 않는 독립 Chrome fixture 시안이다. 원본 25개 path·순서·fill rule·물리·전체 전투 JSON·저장 무접근 계약을 보존한다. 원본 BODY를 그대로 렌더하고 source y780=world1716 아래만 별도의 하부 채색 결과로 게시한다. 실제 최하단 보행면 world1342 및 world1700 위 픽셀은 완전히 보존해야 한다. 하부 pale/green의 원래 색 기여 일부를 기존 암면 재질로 바꾸는 것이며 모든 원본 색을 보존한다고 주장하지 않는다.

원본 끝은 source pale903~904/green898~903이다. 해당 선은 metadata/apron 잘림이 아니므로 bounds만 늘리는 것은 해결이 아니다. 원본 아치·도로·풀·기하 삭제나 blur filter는 사용하지 않았다.

## 실패를 보존한 과정

- b1bb8418 / CI44158036267: 큰 source rect로 나눈 색 전이. 실제 하단 선은 개선됐으나 보호 상부30/86픽셀, 최대3/4 단계 차이. 실패, 미채택.
- 9ca7d163 / CI44159075900: 정수 tile clip으로 바꿨으나 보호 상부419픽셀 차이로 실패. 허용오차를 늘리지 않았다.
- 81bd241c / CI44159884796: 원본 BODY와 대체 하부 게시 분리 시도. fixture instrumentation이 일반 runtime 여러 블록과 충돌하여 생성 단계 실패. Chrome 미실행.
- 244558376597b56bec4a087bae5bcf687b11d4b8 / CI44160306756: unique helper block으로 범위 제한. 네 이미지 생성·정착, 원본 candidate PNG 이전 SHA 일치, source/physics/battle/camera 동일, world1700 위 RGBA 변경0 통과.

## 직접 화면 확인

24455837의 lower/left 원본과 시안을 직접 관찰했다. 하부 수평 밝은/녹색 끝선은 크게 줄었다. 더 위쪽 암면 내부의 미세 녹색 선은 일부 남으며 이 시안이 고쳤다고 세지 않는다. 기존 실제 풀/도로를 지우거나 보호 범위를 확대 재색칠하여 그 선을 숨기지 않는다. 장 전체 미술 합격·공개 입력·실기기·게임플레이 정량 합격은 아니다.

변경 lower20,856픽셀 bbox(0,270)-(1330,434), left7,924픽셀 bbox(499,420)-(1330,582). 보호 world1700 위 변경0. 이는 수정범위 기록이지 미술 점수나 허용오차가 아니다.

## 비용과 다음 단계

단일 CI의 cache 구축 표본은 lower 원래145ms/시안605ms, left84.6ms/415.2ms였다. 통제된 반복 benchmark나 프레임 p50/p95는 아니지만 추가 중복 BODY 렌더와 canvas 합성의 비용 신호다. 이 상태를 생산 최적화 완료로 채택하지 않는다. 경계 tile만 중복 렌더하고 상부/하부 전용 tile은 단일 패스로 처리하는 후속 f48d3a75를 별도 검사한다. 추가 buffer 실제 heap·모바일·팬/줌 성능은 미검수.

최적화 alias 관련 naive relative-m 선택 마스크 문제는 별개로 남아 있다. raw source와 optimized source를 혼동하지 않으며 Native parser exact 진단이 Chrome 원본 동등성이나 안전한 생산 mask를 증명하지 않는다. 단순 alias 적용 금지.

원격 artifact14362319251, ZIP SHA256 bcd645f25fce5c037610f7f154428a82d55cea71c1ed854b45c3fb2b791ede57, 1,879,222바이트. 만료2027-02-15로 영구 아카이브라고 부르지 않는다. 생산 helper 변경·master 병합·Pages 배포 없음.
