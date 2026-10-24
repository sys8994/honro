# 25·27장 반복 도착 안내

기준 master `def07505f5608f3b192d7e1361df3adce3c5767d`. 제품 소스 변경은 `shared/runtime/act3-objectives.js` 한 파일이다. 새 대사를 쓰거나 기존 원문/rowId/지형/적/스킬/HP/자원/목표 조건을 편집하지 않았다. 19~22·24장 및 새 서사 설정은 범위 밖이다.

현재 catalogue revision1·waterworks revision3의 실제 crossing ID에만 완료 표시를 구분한다. 25장 도착2/4/5는 대화나 검사 포즈를 새로 시작하지 않으며 generic 완료 서술도 만들지 않는다. 27장 도착1~4도 HUD 진행만 갱신한다. 완료/evidence/cargo/checkpoint 처리 뒤 표시만 생략하므로 단계 삭제·원격 획득·도착 조건 완화는 없다. 25장의 조용한 물증은 기존 검사 애니메이션의 마지막 표시 상태만 즉시 반영한다. 이 처리가 없으면 마지막 획득 화물이 progress0 조건 때문에 화면에서 숨겨지는 기존 미술 의존이 있었다. 물리 완료 이전에는 이 표시 처리도 실행하지 않는다.

25장 첫 살림 번호 관찰·세 번째 물방울 이상·마지막 가족 번호/물품/이름 결론의 모든 행과 메타데이터는 그대로다. household-tally는 마지막 도착 뒤 한 번만 나온다. 기존 대화 bundle/queue/cursor는 수정하지 않으며 새 저장 필드나 마이그레이션도 없다. 진행 중 도착2 대화를 Continue하면 기존 본문과 커서를 그대로 읽는다. 옛 저작/수로 버전의 완료 표시도 보존한다.

| 집중 비교 구간 | 기준 대화 중단 | 변경 후 |
|---|---:|---:|
| 25장 도착1~5 + household-tally | 6 | 3 |
| 27장 도착1~4 | 4 | 0 |

입장·다른 필수 사건·명세 대화·마지막 대화는 위 집계에 포함하지 않는다. 특히 27장 beforeManifest/RESOLVED guard와 수동 명세 상호작용은 그대로다. 담허만 먼저 오면 명세를 얻지 못하고, 설오가 합류해 필수 조우를 마쳐도 명세는 별도 상호작용으로 확보해야 한다.

검사 결과:

- `tests/stake-arrival-dialogues.mjs`: production 목표/엔진의 명시적 도착 checkpoint에서 기준/현재 비교. 물리 통과 provenance,25장 두 동행 같은 층, 남긴 원문·메타데이터, evidence 끝 상태·cargo·자원·보상 입력·checkpoint·직렬화와 반복 완료가 동일하다. 옛 catalogue/수로 표시도 동일하다. [native](native.json).
- `tests/stake-arrival-save-guard.mjs`: 생산 App의 기존 대화 Continue 본문/cursor 보존, 실제 조우 skip-return을 통한 RESOLVED, 전/후 수동 명세 guard,28장 화물 소유·proof/origin 인계. [저장·guard](save-guard.json).
- `tests/stake-arrival-clear-compare.mjs`: 도착/출구 checkpoint fixture에서 두 장의 기존 mission 조건으로 won을 만들고 생산 App outcome의 보상·cargo를 기준과 대조. 반복 outcome 보상 중복 없음. native harness는 DOM/프레임 스케줄링 대역이며 실제 전투 완주로 표현하지 않는다. [완료](clear.json).
- 기존 `tests/stake-crossing-flexible.mjs` 통과: 접지·공중 통과 불가·되돌아가기·사망 checkpoint·직렬화/XP 계약 유지. `npm run build`, `node tests/web-split.mjs`, 변경 JS/Python 문법·diff 검사 통과. 전체30장 플레이나 전 스킬 검사는 하지 않았다.
- 기존 `tests/act3-void-runtime.mjs`는 별도 기준e975와 후보 모두 첫 카메라 객체 전체 비교에서 cameraToken/cameraIntent 추가 필드를 기대하지 않아 실패한다. 이를 통과로 기록하거나 무관한 카메라 테스트/제품 코드를 고치지 않았다. 필수 guard는 위의 집중 검사에서 독립 확인했다.

모바일390×844 Chromium은 정상 App frame/rAF를 유지했다. 선행 목표와 각 도착 위치/통과 인덱스는 테스트 도구로 준비했고, 목표 tick·실제 대화 넘기기·조우 넘기기·명세 E 입력을 확인했다. 적/자원은 그대로지만 수로 이동/전투 전체를 직접 완주한 근거는 아니다. [브라우저 흐름](browser.json), [캡처6장](screenshots/). 첫25장 관찰은 유지되고 도착2는 플레이 HUD, 도착5는 바로 기존 결론이다. 27장 도착2/4에는 추가 대화가 없으며 이후 명세는 수동으로 열린다. 사진 픽셀을 직접 확인했으며27장 도착2는 entry fixture의 턴 타이머를 지우지 않고 정상 종료된 뒤 캡처했다.

초상화 후보def07505의 실제 Pages40141088595 success2026-10-24T23:04:48Z와 부모 공개 휘겸 염려 확인을 기존 발행 보존 도구에 등록했다. 후보 자체를 발행으로 등록하지 않았다. 기존50개 성공 그래프/고유913개 파일의 길이·SHA를 확인했다. [그래프](graph.json). 새 entry는 `game.973451a86a8a0fae.js`, 활성 파일386개다. master/Pages 반영과 공개 검수는 부모 담당이다.
