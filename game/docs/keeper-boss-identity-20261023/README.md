# 종지기 2막 보스 정체성

실제 신규 종지기는 honroAct2Boss=true/honroNonlethal=true, HP880, elite=false다. 정보창은 전용 보스 플래그를 읽지 않아 “적군”만 표시했다. 먹귀는 이미 해당 플래그로 제외했지만 섭혼은 numeric boss/midboss/elite만 검사해 이 실제 종지기를 제외하지 못했다. 초기 코드 읽기에서 elite도 있다고 가정했던 판단은 실제 데이터를 보고 정정했다.

정보창을 “적군 · 2막 우두머리”와 황금 강조로 표시하고 기존 초상화를 유지한다. 섭혼의 제외 predicate에 기존 honroAct2Boss만 더한다. 구형 numeric boss는 장갑/AI/보상에 별도 의미가 있어 부여하지 않는다. HP/공격/장갑/기예/의식/턴/반격/스토리/보상은 변경하지 않는다. 새 일반 면역이나 elite 판정 확대는 없다.

`tests/keeper-boss-identity.mjs` 통과: 실제880 신규/Continue unit exact, 섭혼 거부, 기존 먹귀 거부, 보스 플래그만 없앤 negative control은 이전 predicate를 통과함을 확인했다. 실제 큰 피해 후 비살상HP1/생존/제압side2와 그 Continue 정체성도 보존한다. 기존 데이터/후속 이야기/19장 소스는 불변이다. 정상18→19 완주를 새로 검사한 것으로 표현하지 않는다.

`tools/testing/keeper-boss-identity-browser.py` 통과: 실제18장 종지기 클릭/초상/확대복귀/HP880/보스 라벨 및 일반 적과 차이,390×844/844×390. 준비된 진입/카메라 검사다. 결과/사진은 `_local/reports/keeper-boss-identity-20261023/`의 native/browser JSON과 `390-boss-info.jpg`, `844-boss-info.jpg`다. 최종 생성물과 공개 그래프 검사는 이어지는 작은 UI/음향 단위와 함께 확인한다. master/Pages는 부모가 담당한다.
