# 1막 외곽·접합 수정 후보 인덱스 (2026-11-17)

## 판정 경계
이 문서는 **후보와 독립 Native 검수**의 인덱스다. 1~10장 전체 SOP 합격, 공개 배포 완료 또는 게임플레이 합격을 뜻하지 않는다. 실제 사용자의 저장/기존 전투를 건드리지 않았고 GitHub 로그인도 요구하지 않았다. master는7d238d20으로 유지했으며 기존 Pages는 이 후보들을 포함하지 않는다.

1장 공개 데스크톱 표본에서 결함 미관측. 상세는 master의 ACT1_STAGE1_TERRAIN_REVIEW_20261117.md. 전체접점/모바일/파괴·재진입 등은 미완이다.

|장|후보 변경|최종 독립 캡처 수|후보 HEAD|확인한 CI|
|---|---|---|---|---|
|2|BODY/rear bounds|57|b0e2be13|44033988467 success|
|3|source합성 외곽/접합·raster영역·폐합3선|39|5d111652|44037694728 success|
|4|BODY bounds|42 + gallery broken3|4fd31554|44038227550 success|
|5|floor/cliff bounds|48 + 상태12|68b84596|44039671830 success|
|6|continuous BODY bounds|60|15b62cd0|44040640173 success|
|7|source합성 외곽/접합·raster영역·폐합3선|138 (focus12중복)|bf672d7f|44041840337 success|
|8|floor bounds|93 + 결박12|20db1177|44042562680 success|
|9|floor bounds|48 + 받이진18|6d9bab8e|44043364392 success|
|10|floor bounds·tree alpha검증|63 + 주박3|이 브랜치|등록 후 확인|

2~6,8~10 branch는 fix/stageN-art-bounds-20261117, 7장은 fix/stage7-art-edges-20261117. 각 branch game/docs/STAGEN_EDGE_JOIN_STATUS.md에 세부범위/원인/해시/한계를 보존했다. 7장 branch는 3장 최종5d111652의 후손으로, **3장+7장 공통 author/renderer 변경을 함께 포함**한다. 다른 장은 master7d238d20 기반 독립 후보다. 통합 때 capture-stage-independent-audit.mjs의 최신 marker/state/focus 지원을 보존하고3/7optimizer 등록을 둘 다 유지해야 한다. 무조건 전체 로컬 작업트리를 푸시하지 않는다.

## 완료한 독립 확인
- 2/4/5/6/8/9/10장은 bounds/reference 등록 보정. 원본vector·viewBox·clip·물리를 바꾸지 않았다.
- 3/7장은 원본source경로·발판·물리를 보존한 합성 확장. 실제alpha가 없는 소스끝을 그대로 확대하지 않고 source의 불투명행을 이어 접합을 확인했다. 미술 재생성이 아니라 기존source 합성 수정이다.
- 7장 이후 변경 상태에서도3장 pixel seam 회귀를 다시 통과했다.
- 10장 나무상부는 최종asset전체alpha가 등록범위 안에 있음을 재현스크립트로 확인했다.
- Native는 production project/compiler/Engine/renderer를 사용하되 브라우저/저장/실제입력과 완전히 구분했다. 합성 상태도 보고서에 명시한다.

## 남은 작업
- 모든 장의 실제 공개 UI, 실기기, 반복 진입/저장 경로 및 실제 상태전이. 후보를최종합격 또는배포완료로 표시하지 않는다.
- 1장의 전체 독립matrix 보완.2~5장의 실제 focus범위 별도확인 기록 및 모두 최대줌/전체 접점위치 행렬 보완. 현재각지형 중간접점+최소줌모서리 표본은 모든픽셀/모든위치 전수합격이 아니다.
- 2 운반대/가림,3 이벤트·재진입,4 실제gallery파괴/낙하,5 실제주박목·폭포·의식/파인발판변위,6 운반대·추격/가림,7 주민구출증원/계단,8 실제결박해제·상여이동/정착,9 실제받이진설치·소단staging,10 주박/협력6턴/퇴장문닫힘.
- 합성broken/활성flag검사는 실제공격/상호작용으로의 전환 성공이나 게임플레이 정량통과를 뜻하지 않는다.
- 최종 공개검수 조건이 충족되면 후보통합·CI·master/Pages·공개실물 확인.2막은 아직 시작하지 않았다.
