# 종지기 주술형 기능 후보

브랜치 `fix/keeper-ritual-20261023`. 게임 코드/최종 정상입력 검사 SHA **41a435f1f44ee292df3efe4e45167fd23447f170**, 생성 entry **game.de5847d56ea944fa.js**. P0 67022와 NPC379 포함. master/Pages는 변경하지 않았다.

부모 승인25문구 exact, 나머지 전체 narrative metadata/text 및19·20 보존. 긴 먹색 겹옷·검은 끈·손끝 봉음판3개의 retained Canvas 유닛, 약해진 손→휘겸 마지막 명령 후 놓음→outro 포박을 rowId로 연결했다. 현재 NPC 통일 로더에 종지기1종만 추가하고 cache cap13, 기존 영웅/NPC8 crop·이미지 계약은 그대로다. **부모가 새 게임톤 종지기 초상 원본/SHA를 준비 중이므로 현재 연결된 승인 ritual-v1 초상은 최종 교체 대기다.** 새 묵종은 포함하지 않았다.

봉음은 보이는16×180 국소 투사체 면, 되울림은 방향성1발 반환, 결박은250×28 발밑 예고다. 캐릭터 충돌 지형을 만들지 않으며 walk/jump/각도 우회와36×36 법구 연결 타격/190px 근접 압박 중단이 가능하다. 연결은 추가 배우·HP바·필수 목표가 아니다. 스킬 고유 귀환/소환 및 O05/몸체 반환은 제외한다. 반환은 피해 편차 재추첨 없이 종지기 소유/진영/기여 귀속으로 전환한다. 기존 아군 오사격30%는 유지하며 종지기가 되돌린 적대 공격에는 적용하지 않는다.

예고 후 실제 이동 가능한 아군 입력 기회를 확인한다. S13 후속처럼 이동 불가능한 입력은 회피 기회로 세지 않는다. 결박에는 경고 타깃의 이동 가능한 선택 기회도 필요하다. 한 턴 안에 기회가 없으면 무조건 타격하는 대신 예고가 만료한다. 기존 bound를 덮지 않고 새 소유권만 기록하며 다른 ice/bind/frost 갱신은 소유권을 인계한다. 타 원인의 동일 bound=1도 종지기 정리로 지우지 않는다. 일반 행동/턴·사망/종료·Continue의 소유 상태를 검사했다.

## 정상 입력 결과

현행 v4 최소 필수 보상 ledger의 합법 입장 fixture, normal/seed19388/4동행, 능력치수련6회+실제 `C.train` 최저 합법 rank/슬롯순 고정 배분, 기존 유한 사격 탐색/전진 정책. 설오16/담허11/휘겸13/소단14이며 점수·장착은 [summary.json](evidence/summary.json)에 있다. 설오 잔여3SP는 장착 기예 rank 상한으로 남았다. 입장 이후 좌표/HP/기력/이동도/목표 강제 쓰기·소모품 없음.

**R10 비살상 완료, 4인 생존**(888/785/1438/1039HP), 적 사망7명+고정구 파괴1개(종지기는 살아 있는 비살상 완료 상태)·유한증원2명, 종 하강1회. R1 억제진, R2 보호, R3 하강, R4~8 누출혼 이동/진행, R9~10 종지기. 정상 실행에서 봉음1회와 근접 중단을 확인했다. 되울림/결박 전체 패턴은 별도 준비 fixture 검증이며 이 정상 실행에서 모두 맞았다고 주장하지 않는다. 실제 완료 대사→단일정산→19장 진입·성장보존·Continue 통과,19장 전투 미실행.

사전1~17장 ledger는 준비 입력이며 그 장들을 다시 플레이하지 않았다. 이 한 고정 컨트롤러 사례는 사람 평균/최적/난이도 전반의 증거가 아니다. 초기 f8c57cb2에서도 R10을 얻었으나 최종 보고 수치는41a435f1의 별도 재검사다. 원자료 initial/readiness/trace/result/실제 terminal/19장 저장은 evidence/*.json.gz로 보존했다.

## 집중 검수와 경계

1. 실제 PC 유닛/법구/캐스팅·봉음/방향 예고를 픽셀 확인: [시전](evidence/first-cast.jpg), [봉음](evidence/seal-active.jpg), [결박](evidence/binding-active.jpg). 준비한 위치/적 큐/패턴에서 production enemyAction→tick→select/defend를 실행한 fixture이며 정상 전투 도달 증거가 아니다.
2. 실제 R10 저장의 production 브라우저 Continue whole-battle exact, 보고서 final이 있는 마지막 명령 cursor의 반복 Continue exact. 손은 명령까지 약해진 잡기 상태, outro에서 포박·바닥 법구 확인: [마지막 명령](evidence/actual-last-command.jpg), [포박](evidence/actual-bound-outro.jpg).
3. 모바일390×844/844×390에서 머리·손/법구·대사·다음 버튼을 직접 확인: [세로](evidence/actual-mobile-portrait.jpg), [가로](evidence/actual-mobile-landscape.jpg). 현재 사진의 초상은 게임톤 교체 전 승인 원본이다.
4. 별도 종합: 실제 R10 브라우저 완료대사 전부→[정산](evidence/actual-result.jpg)→19장 진입/성장 exact/중복정산 방지. render60회 battle exact/새 Path2D 할당0. 일반 카메라/배치/지형·대사 framing을 변경하지 않았다.

검사 통과: typecheck/build; keeper-ritual narrative/mechanics/app/preservation/browser; NPC row/dynamic 구조 매핑; S13 defend-lock 및 실제 App Continue/export/import; projectile friendly-fire 관련 회귀. 현재 캠페인 전체 JSON은379와 exact이며17장 소형 법구는 비충돌 렌더만 추가했다. 기존 5개 R12/R22/R29/R45/R54 저장의 몸체/자원/턴/RNG/대사/성장/완료 사실 및 반복 Continue 보존.

기존 `stage18-short-contracts.mjs`는 dd878 대비 모든 장이 같아야 한다는 옛 전제에서 승인14 천장 변경으로 실패한다. 원본은 수정하지 않았다. `keeper-ritual-preservation.mjs`에서 비교 기준만 승인379로 바꾸고 기존 fresh18 조건·5개 구 저장 검사를 재사용해 통과했다. 이 실패를 게임 회귀나 통과로 기록하지 않는다. 전체30장/전체verify/다른 난이도/유저 실제 저장/실시간 사람 플레이는 미검사다.

## 발행 보존

실제 성공67022(Pages39904197636,05:14:52Z),379(Pages39905501232,05:26:09Z) 포함 최근7일29개 공개 그래프616파일 전부 hash exact, 최소2개 정책 및 구934의13장 JSON/asset 그래프 유지. 미발행 후보를 성공 이력에 등록하지 않았다. 상세 [retention.json](evidence/retention.json).
