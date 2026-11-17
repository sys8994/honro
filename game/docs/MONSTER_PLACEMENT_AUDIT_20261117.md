# 몬스터 배치 감사 · 2026-11-17

## 사용자 지침
등간격 일렬/한쪽 머릿수 채우기 금지. 장소·지형·오브젝트와 전투 역할에 이유 있는 크기가 다른 군집, 단독, 빈 연결 공간을 저작한다. 전50장을 조사하며 4·5막 우선. 현재 다른 담당의 지형 수정과 별도 후보로 보존한다.

## 40장 확인 및 후보
기존 author revision2는 초기42체 모두 x560~3120(폭6656 중 왼쪽47% 안)에 둔다. dock-stair7체의 간격85~100, departure-upper5체75~80. 그룹명/목적 설명만으로 실제 열 배치가 해결되지 않았다.

후보는 기존42개의 ID·종류(후속 diversity 교체 포함)·HP/공격/보스·행동상한6·승리조건·파티·주민·조수·물리·미술을 유지한다. 15체를 동쪽 굽이/상층 감시/배 도착 계단/안전지역 위 후위로 옮긴다. 16개의 전투 장소는 개별 활성화 셀이며 동시42공격이 아니다. 상부 이동과 배 도착 이후 양쪽 경로가 이유를 갖는다. 안전 집결면4500..5100,1750..2200과 승선 갑판은 비운다. 여러 계단을 전부 적으로 채우지 않고 상단/하단 사이 빈 구간을 둔다.

`shared/act4-stage40-placement.mjs`는 새 source authoring만 적용한다. 기존 진행중 battle snapshot의 저장 좌표·HP·경과 상태를 재작성하지 않는다. 원래 stage ID 및 finalDefenseRevision2를 유지하여 조수/보스/기존 이벤트를 바꾸지 않는다.

## 검증 경계
정적 계약은42ID/종류/수치,16장소,동쪽15명,실제저작 지지면,초기 몸 겹침,안전집결 비점유,지형/목표/주민 보존을 확인한다. 이는 실제 공격·호송·정상 플레이를 대신하지 않는다. 별도 실제Chrome 초기Scene A/B와 전체50장 최종 컴파일좌표 감사, 공식빌드를 CI에 구성한다. 후보/미검수이며 공개배포 아님. 배치 수/그룹 수는 이번 저작 결과이지 보편 합격선이 아니다.

다음: 실제 초기Scene 시각 검토 →8초 자연물리 접지/겹침/활성화→바뀐 동쪽 군집 사선/접근/호송 경로의 짧은 실제엔진 검사. 전체진행·난이도는 별도 미검수.

### Chrome review iteration
The first candidate A/B Chrome render passed storage isolation/render purity, but visual review still found an almost continuous seven-unit dock stair. Rejected that arrangement: four remain as foot/head pairs with a wide middle gap; three become a lone road scout and a two-unit upper ridge entry guard. Candidate now has 16 places and 15 enemies east of x3600, unchanged42 identities. Actual local-support activation diagnostics added; this remains distinct from traversed-route/full gameplay acceptance. The initial all50 generator logged Act4 initialization errors; corrected initialization and now fail the step on any stage error.

### 실제 지지면 보정 원인
실제 생성 좌표 대조에서 dock-stair-2 궁수가 저작 계단(1990,2690)에서 아래 부두(1990,2856.77)로 이동했다. 실제충돌 진단에서1990..2110 계단에 서면 머리/몸이 approved40-west-rock 아래면에 침투,1950은전위몸체와중첩했다. 지형을변형하거나sanitize를우회하지않고 해당궁수를실제부두지지면에명시저작하여 계단진입전위+부두사격지원이라는같은지역군집으로수정. 그룹활성지지면에두표면을명시하고41지상개체의실제접지==저작태그회귀검증추가.

### 후위 사선 후속
실제 Canvas 예고 관측과 원본 wait 대응 뒤 고지 사격대의 다음 행동295피해를 확인. 반면 동쪽후위 궁수5690은두행동연속사선없음·방어로 남아 미합격. 같은 후위군집의낮은굽이5260으로이동해 다시검사한다. 국소진단에도공식coast.attachCoast의진입제한·물·조수·활성화래퍼를붙여 실제이동제약을반영한다. 준비된영웅접근점/단일적슬롯이라는범위는그대로이며정상호송/완주증거는아니다.
