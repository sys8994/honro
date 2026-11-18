# 2막 외곽·접합 독립 검수 진행

공개 UI·실제 전투·최종 SOP 합격 또는 배포 완료가 아닌 독립 검사/후보 기록이다. 미검수는 각 장 문서에 명시한다. master/Pages는 유지한다.

|장|독립 범위|결과/후보|CI|
|---|---|---|---|
|11|48뷰, foundation 실제paint범위, tree alpha2배치|미술 변경 없음; audit/stage11-edge-domain-20261117 @9f50e36d|44045816613 success|
|12|63뷰 A/B, tree5배치 alpha, 원본/물리/optimizer 보존|둘째재질 사각 하단 접합 수정; fix/stage12-ground-skirt-20261117 @f1c1e93b|44048658513 success|
|13|66뷰, 최종floor 불투명 표본/roof alpha·물리 대응|미술 변경 없음; audit/stage13-edge-domain-20261117 @6eb31111|44049730367 success|
|14|39뷰 A/B, 상·하단 alpha, 잘못된 폐합 rim 회귀|fix/stage14-closure-rim-20261117 @ad1dee06, 공개 미검수|44051912290 success|
|15|63뷰 A/B, 실제paint 상하 alpha/불변SHA|outer strip 수정 @36ebd918; 상단source 무늬끝 의도불명/미해결|44053317299 success|
|16|105뷰, 하단합성/상단roof 실제alpha|미술 변경없음; audit/stage16-edge-domain-20261117|등록 후 확인|

11장 상부tree는2배치,12장 pine은5배치다.14장은 하단 인공 폐합선 수정 후보를 보존했다.15장은1차후보 검수 중,16장 독립검사까지 기록,17~20장은 이 문서 시점 미착수. 각 STAGEN_EDGE_JOIN_STATUS.md의 범위가 판정 기준이다.

12장 branch는3/7장 후보 bf672d7f의 후손이다. 3/7/12의 작은 optimizer 등록을 모두 보존하고, 최신 capture 도구의 immutable evidence label·synthetic-state assertions·receiver views·focus views를 유지한다. 11장 검사파일/문서는 별도 branch에 보존되어 있다.

13장 branch는12장 후보의 후손으로3/7/12 코드를 포함한다.11장 검사파일/문서는 계속 별도 branch에 보존되어 있다.
