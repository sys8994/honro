# Stage26 정상 입력 관측 — 통합 소스

2314ee6a2ad53606c2e150b2c8c087f54de1af32 통합 checkout에서 실행했다. 전용 `tests/stage26-normal-trace.mjs`는 기존 Stage26 `act3-playthrough.mjs`의 입력/스킬 선택/프로필 준비/예산을 그대로 복사하고 인스턴스 관측 wrapper만 추가한다. 런타임, 군집, 파동, 목표, HP/위치/자원은 수정하지 않는다. prepared profile은 25장까지 실제 연속 플레이 증거가 아니다. Native App/Engine, DOM/Canvas/storage doubles이며 실제 브라우저 검수가 아니다.

5라운드 won, 8개 기록 action, 9개 movement 호출, 19개 실제 HP 감소, 13개 성공 fire 호출, 10명 awake 관측. 이전 standalone 결과(8라운드/14action)와 통합 결과가 다르므로 동일 결과라고 주장하지 않는다. 같은 통합 빌드의 비관측 대조 실행은 아직 하지 않았다. 정확한 파일/HTML SHA는 provenance.json 및 결과 source에 고정했다.

`trace.damage`는 frame/round/turn/goal, owner ID와 위치, target 피해 전후 위치/HP, amount/skill/shot을 보존한다. `fires`는 실제 성공한 발사와 발사 위치를 기록한다. `activations`는 첫 awake 관측이다(첫 적 행동과 다름). `movement`는 플레이어 move 호출의 실제 from/to, 목적지와 frame 범위다. cell은 ID 접두사/숫자 접미사를 제거해 읽기 좋게 만든 분류이며 initial의 원본 actor 전체를 함께 보존했다.

## 실효 관측

아래 아군 피해는 owner.side=1,target.side=0의 실제 HP 감소다. 플레이어→군집 피해는 반대 방향으로 집계했다. 예측치는 포함하지 않는다.

| 군집 | 아군 피해 건수 / 합 | 첫 피해 round / frame | 플레이어→군집 실제 피해 |
|---|---:|---:|---:|
| record-room-remnants | 2 / 87 | 1 / 939 | 0 |
| casting-yard-tools | 3 / 112 | 2 / 1702 | 315 |
| tally-store-remnants | 2 / 63 | 3 / 3052 | 216 |
| surface-exit-remnants | 1 / 26 | 4 / 3899 | 181 |

네 군집 모두 아군에게 실제 피해를 주므로 이 실행에서 무기능 군집으로 분류하지 않는다. record-room을 향한 첫 O03 입력은 적 HP 감소가 없고 아군 knight136/occultist83 피해를 낳았다. 첫 발사를 성공적 제압으로 판정하면 안 된다. casting/tally/exit에는 플레이어의 실제 HP 감소 효과가 관측됐다. 최종 완주와 이 수치만으로 각 군집의 전술 품질을 승인하지 않는다.

## 남은 한계 / gate 상태

- `enemyActions`는 finishAction **호출** 관측 16행이다. 같은 행동에 여러 번 호출될 수 있어 독립 적 턴/행동 수가 아니다. actor/after는 호출 직전/직후 위치이며 그 턴 전체 이동 from/to가 아니다. 적 전체 이동 궤적/행동 시작점은 별도 계측 필요하다.
- player movement는 목적지와 실제 이동을 연결하지만 회피·위치 선점의 인과를 기록하지 않는다. 현재 단순 controller의 목표 접근·발사 정책을 사람의 전술 선택으로 해석하지 않는다. 표적 fire와 실제 damage는 ID/shot으로 연결할 수 있으나 사유의 독립 검증은 미완료다.
- source/profile가 다른 이전 실행과 피해·행동 수가 달라지는 이유를 관측 hook 효과로 단정하지 않는다. 같은 통합 source에서 원본 controller 대조가 필요하면 별도 실행한다.
- authored response0 / committed0 / units0 / pending[]이다. 현행26 유한 반응 파동이 없으므로 파동 실효는 N/A이며 이번 검수를 위해 새 파동을 만들지 않았다.
- 정상 브라우저 전투와 독립 raw 검토, 최종 encounter gate는 미완료다. 이번 단위는 실제 영향의 관측 자료 보강이며 디자인/배포 승인이 아니다.
