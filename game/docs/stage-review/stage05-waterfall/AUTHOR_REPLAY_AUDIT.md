# Stage5 author replay safety — follow-up

기준509ed75a의 별도 worktree에서 `node tests/stage5-lake.mjs`를 실행해 동일한 `Canonical author is idempotent` 실패를 재현했다. 기준/교정 후 원본에 기존 author를 실행한 결과는 모두5장에만 동일47개 차이였다. 1~4장·나머지 장·library는 변경되지 않았다.

원인은 `authorStage5Waterfall()` 마지막의 무조건적인 `applyStage5WaterfallPaint()` 호출이다. 퇴역 이미지 지형 실험이 서쪽 발판을 가지로, 물길진의 one-way 발판을 solid 바위로 바꾸고, 동굴 윤곽을45→64점으로 재저작했다. 담허의 진 높이2710→2523.125, 적 위치, 장식, paint revision도 바뀌었다. `apply-stage5-waterfall.mjs`는 다른 장 변경만 금지했기 때문에 이5장 덮어쓰기는 그대로 저장될 위험이 있었다. 이전 보고에서 단순 기존 검사 실패로 남긴 것은 부족했다.

수정:
- 현행 vector/lake author에서 퇴역 paint 호출 제거. 원본 재생성은 그대로 수행하며 테스트/비교를 생략하거나 현재본을 바로 반환하는 우회를 넣지 않았다.
- 명시적인 옛 paint CLI도 쓰기 전에 오류를 내도록 중단. 과거 pure helper는 역사 증거용으로 남겼다.
- 현행 CLI는 의미상 변화가 없으면 파일을 다시 쓰지 않는다. 실제 실행해 campaign.json의 바이트 불변 확인. 내용이 같은 파일을 거대 pretty-print 변경으로 만드는 문제도 방지.

기존 검사 수정 없이 `stage5-lake.mjs`37개 이동/연못복귀/축지제한, `stage5-waterfall-authoring.mjs` 전체 원본 재생성/적 수치/다른 장 보존/Game·Workshop·import 검사를 통과했다. 새 `stage5-author-replay-safety.mjs`는 원본과 실제 런타임 프로젝트 각각 두 번 재저작해 모든30장/library/project 정확 일치, 입력 무변경, 퇴역 CLI의 비정상 종료와 파일 무변경을 검사한다. 이번 수정은 tools/tests/docs만 변경하고 캠페인·런타임·배포 HTML은 be830a46과 동일하다.

## 35라운드의 의미

`HonroObjectives`에는5장35라운드 하한이 없다(`minimumRound=1`, 주박목 파괴 후 안정화1라운드). `HonroMission`의 물길진 유지 조건은 생존한 담허와 중심에서 가로125/세로80 이내이며, 실제 닫힌 물살 감속과 열린 물살 명중은 검증됐다.

성공 정책은 진 중심1590보다 약125px 서쪽에서 즉시 상호작용해 작은 피격 이동에도 유지 경계를 벗어나기 쉬웠다. 대상 사격은7/8/9/12/13/34라운드, 재상호작용11회였다. 이를 고정35라운드 기믹으로 해석하면 안 된다. 중앙까지 접근하는 별도 정상 자원 정책도 실행했으나 설오가 쓰러져40라운드 미완(주박목329HP, 담허312HP)이었다. 정책 변경이 곧 쉬운 승리를 보장하지 않으며, 이 결과도 합격으로 계산하지 않는다.

기본 기믹의 불가능/강제35턴 결함은 확인되지 않았다. 기존20명 압박과 사선 점유가 엄격하다는 관측은 남으며 모든 기예/전술의 균형을 인증하지 않는다. 자동 정책 한두 개에 맞춰 적이나 피해량을 바꾸지 않았다. 근거는 evidence/author-audit에 보존했다.
