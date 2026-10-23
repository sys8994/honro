# 승인 스킬 음향 연결 — 구현 중

기준edf36a5f, 승인 에셋 입력ccac4379는6523601a로 보존했다. 원본28개는 변경하지 않는다. 현재64개 플레이어 스킬의 명시 매핑과 실제 Engine 이벤트의 actor/skill/cast/phase 정보를 구현 중이다. 비행/충돌/피해·설치·소환 경계의 오디오 context는 엔진의 transient 필드이며 저장/수치/판정에는 넣지 않는다. 지정된 플레이어 경로의 옛 procedural 신호만 막고 몬스터/UI/스토리 신호는 유지한다.

중간 소스의 TypeScript transpile diagnostics0을 확인했다. 캐시 재생기/충전/실행 경로 통합 및 실제 Engine/브라우저 검사는 아직 남았다. 현재 중간 커밋은 미검증 WIP이며 배포 완료본이 아니다. 대본/19장/지형/미술/음원 생성은 범위 밖이다. 자동 결과는 _local/reports/skill-sfx-runtime-20261023에 둔다.
