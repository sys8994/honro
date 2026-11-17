# 29장 실제 Chrome 왼쪽 외곽 접합 후보

Native의 내부 strip 누락은 실제 production tile/Scene의 Chrome 비교에서 재현되지 않아 수정 대상에서 제외했다. 그러나 독립 Chrome 초기 Scene의 화면 x665.5에 남는 왼쪽 외곽 수직 이음은 별개다. 첫 source u0이 world x0에 대응하고 `edgeFade:[null,[3770,4150]]`라 왼쪽은 불투명하게 시작한다. 실제 terrain은 왼쪽으로 계속 이어진다.

후보는 `edgeFade[0]` 한 곳만 `[0,170]`으로 변경한다. 약33px 폭의 기존 정상 브라우저 fade를 재사용한다. 원본 vector·접지 mapping·bounds·collision·오른쪽 fade를 보존하며 범위 확대나 원본 늘이기를 하지 않는다. 재생성/멱등성·원본 환원 hash 검사 통과. Native 렌더는 알려진 backend 차이 때문에 이번 시각 판정 근거로 사용하지 않는다.

실제 Chrome A/B에서 왼쪽 이음과 함께 상단 돌·독립 보행 rim이 유지되는지 확인하기 전에는 미술 합격으로 처리하지 않는다. CI는 app:false 일회성 초기 Scene이며 사용자 전투/저장, 정상 입력이나 공개 UI 검수를 뜻하지 않는다. storage/CSP/image 오류 0, 물리·카메라 불변을 검사하고 PNG를 보존한다. 최종 공개 배포와는 별개 후보다.
