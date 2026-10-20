# 나루 실제 결합 검수 — 미승인

암반 원본은 `2d432127c7c3f16dd8cb748048853601c99fdc37`의 16차 SVG 세 종이다. 각 한 번 사용했고 H=80을 성인 H=103.5 world에 맞춘 1.29375배를 유지했다. B는 20% 어둡게 뒤로, C는 낮은 전경으로 배치했다. 래스터 근경·새 게임 로직은 없다.

[일반 배율](stage03-normal.png) · [광역](stage03-wide.png)

미달: A/B가 선 아래 띠처럼 읽힘, B/C의 절단 윤곽과 약한 토양 가림, 큰 빈 전면 사면. 3종 내부 암질·중간 형태는 이전 둥근 돌보다 구분되나 장면 통합은 fail이다. `manifest.json`에 실제 판단·sourceState·원본 receipt를 연결했다. 최종 pass나 부모 pass를 기록하지 않았다.

독립 항목: [문루 일반 화면](../independent-forest-city-r19/stage21-normal.png), [쉼터21](../independent-city-rest-r19/stage21-rest.png), [숲 광역](../independent-forest-city-r19/stage01-wide.png). 문루는 기둥·주초·문·공포·처마를 보완했고 원래 홍예/계단/충돌을 보존했다. 숲은 경사에 맞춘 짧은 지지근으로 늘어진 뿌리를 줄였으나 수관·줄기의 단순한 면은 미해결이다. 독립 화면은 해당 폴더 receipt의 r19 소스 상태에 대응하며 최종 공통 빌드 검수로 대신하지 않는다.

오류 0, 정상·광역 모두 비미술 전투 상태 불변. 공개 빌드는 최종 미술 검수 부재로 차단. master/Pages 미변경.
