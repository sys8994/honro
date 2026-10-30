# 반복 모티프 집중 보완 — landforms-3

부모가 지적한 두 화면만 같은 카메라로 다시 확인했다. 기준은 이전 `bf9b83ae`의 `after-*` 이미지다. 공통 소스 변경은 registry/renderer 두 파일에 한정하며 다른 장 데이터, 건축, 로더, 최종 번들은 변경하지 않았다.

| 화면 | 수정 전 | 집중 보완 |
|---|---|---|
| 3장 광역 (2100,1450,0.24) | [이전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/shared-terrain-interior/after-stage03-wide.png) | [현재](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/shared-terrain-interior/refined-stage03-wide.png) |
| 18장 정상 (1200,6200,0.5) | [이전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/shared-terrain-interior/after-stage18-normal.png) | [현재](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/shared-terrain-interior/refined-stage18-normal.png) |

- 깊은 전경에 별도로 두던 어깨 배치를 제거했다. 흙은 실제 상향 노출면에서만 시작하며 도메인 외곽/하단은 미술의 근거로 쓰지 않는다.
- 3장의 동일한 큰 둔덕 6개를 서로 다른 주 퇴적면/보조 침식면 2개로 바꿨다. 지표에 상단을 물리고 내려오는 곡면과 둥근 끝단으로 이어져 하단의 독립 덩어리와 반복 쐐기를 없앴다. 넓은 흙 여백은 남겼다.
- 동굴의 거대한 세로 버팀면 반복을 중단했다. 큰 바닥에서는 낮고 비대칭인 주 어깨를 성기게 두고, 좁은 발판에는 중간 크기 매몰석만 둔다. 18장 전체의 큰 부재는 30→3개, 중간 부재는 0→23개다. 지정 정상 화면에서는 한쪽 어깨와 맞물린 작은 매몰석이 표면 가까이 보이며, 깊은 전경은 넓은 어두운 gradient로 조용하게 남긴다. 캐릭터 크기/카메라는 그대로다.
- 새로운 미세결·노이즈·래스터·필터·반복 타일은 추가하지 않았다. 최대 예산과 Path2D/prepare/타일 캐시, bounds culling 및 중간 부재 줌 LOD를 유지한다.

[실제 실행 기록](refined-checks.json): 두 화면 page error 0, terrain/units/markers/events/objectives 렌더 전후 동일, prepare 1회, 동일 포즈 반복 렌더의 tile builds 증가 0. 3장 광역은 21,300,480B, 18장 정상은 15,975,360B의 기존 bounded 타일 캐시다. 기존 8개 화면의 `after-checks.json`은 이전 revision 증거이며 현재 revision의 전 장 검증을 의미하지 않는다. 추가 전체 검사/별도 검수자는 실행하지 않았다.

현재 소스 용량 (byte, gzip mtime=0):

| 소스 | raw | gzip |
|---|---:|---:|
| registry.mjs | 71,451 | 29,738 |
| vector-campaign-art.js | 18,518 | 7,211 |

master 병합·정식 번들 갱신·Pages 배포는 수행하지 않았다. 부모 통합 지시 대기. 바닥/플랫폼의 기존 직선 외곽과 장 전체 구성은 이번 수정 범위에 포함하지 않았다.
