# 8·22·23장 후속 진행 점검

착수 기준은 당시 최신 원격 master **`9cb849a5`**, 작업 브랜치는 `fix/act1-act3-pacing-20261022`다. 앞 네 장의 `f05549659e28a68aa5f475c83da3f77d9a3b19c2`는 변경하지 않았다. AGENTS.md와 환경 스킬, STAGE_PRODUCTION_SOP, ENCOUNTER_PLACEMENT/ACCEPTANCE를 따른다. 공통 성능·엔딩·초상화·11/14/17/18장은 작업 범위 밖이다.

부모의 최신 master `e7fbff647c387f092f51215e9d867d664906d9bd`에는 작업 도중2막 개선이 통합됐다. 이 브랜치의 기준을 바꿔 기존 측정을 다시 만들지 않는다. **부모가 소스 변경을 통합하고 최신 master에서 HTML/web을 재빌드해야 한다.** 이전 기준에서 생성된 manifest를 최신 공개 배포에 그대로 덮어쓰지 않는다. master 병합·Pages 배포는 부모 담당이다.

## 장별 설계 카드와 판정

| 장 | 보존할 장소·사건·역할 | 현재 최종 런타임 확인 | 판정 |
|---|---|---|---|
|8 / 1막8|3인 파티, 양끝 두 결박, 동쪽 빈 상여→중앙 아래뜰 이동, 높은 가지/아래길/측면 사격점|현재 목표는 두 결박과 상여 제압. 주변 적 전멸이나 전원 중앙 집결은 요구하지 않는다. 동행을 동쪽에 둔 완료 조건 fixture에서 선택 적36체를 남기고 완료 판정. 상여 이동은 기존 사건이며 보존한다.|추가 변경 근거를 재현하지 못해 **코드·지도·편성 변경 없음**. 과거37R를 현재 사람 시간으로 사용하지 않음.|
|22 / 3막2|하층 봉인/문, 중층 보고 기록/문, 상층 호적, 최고층 대조·출구. 층별 사선과 서쪽 선택로|현행 필수 상승 AB→BC→CE→EF→FG→GH를 경지16 네 클래스가 모두 실제 move/jump/wait/tick으로 통과. 각각 기본 점프5회·이동 갱신4회, 이동 소모7211–7215, 피해0·회복0·착지 실패0. 두 문은 구간 세팅에서 개방했다. 두 기록의 운반·대조와2턴 보호는 그대로다.|이번 조건에서 추가 빈 왕복/착지 병목이 재현되지 않아 **코드·지도·편성 변경 없음**. 상승 높이4100과 선택 접근로를 덜어내지 않음. 과거39R를 현행 시간으로 사용하지 않음.|
|23 / 3막3|연속 운반길, 낮은 호송 전위/높은 창고 지원, 석교, 화물 이동, 짐꾼 생존, 운송 기록과 도착|같은 연속 운반길에서 앞선 동행이380/577거리 안에 있어도 경사로 높이 차가150을 넘으면 NPC walk가 전혀 호출되지 않았다. 적/지형 막힘이 없는 짧은 구간에서도 반복됨.|**경사 동행 판정만 수정**. 실제 낮은 운반길·석교 위에 접지했고 저장된 연속 윤곽을 따라950보행거리 안에 있는 동행은 선도 가능. 다른 층과 먼 동행에는 확장하지 않음.|

세 장의 지형 polygon·지도 크기·그림·배경·장식·적 편성/HP/공격·유한 증원·클래스 이동량을 변경하지 않았다. 23장 초기40 및 유한4/5/5 증원과 안전한 등장/화물 쓸림면/실제 충돌을 유지한다. 중복 증원을 줄일 근거 없이 전투 수치를 바꾸지 않았다.

## 23장 변경과 구간 전후 비교

`stage23-escort.js`의 읽기 전용 `canLead`를 `act3-objectives.js`의 선도자 선택 한 곳에서 선택적으로 사용한다. 기존 같은 층 판정에 해당하면 기존 결과를 유지한다. 그 밖의 경우는 다음 조건을 모두 확인한다.

- 현재23장 관창 맵 계약이며 NPC와 동행이 접지되어 있다.
- 두 발이 실제 `sy-ground`/`sy-stone-bridge`에 있고, 저장된 `honroMap.act3.primaryContour`의 보행면에 맞는다.
- 윤곽의 꺾임을 합한 거리가950 이하다. 다른 창고 층/공중/먼 지점에는 새 선도 권한을 주지 않는다.

NPC 속도260, 원래 walk·physics, 전방65거리, 도착 조건170/동행540, 피해/실패/보상 규칙은 그대로다. 위치를 순간 이동하거나 이동량/HP를 채우지 않는다. 새 저장 필드·스키마·지도 revision도 추가하지 않는다. 오래된 맵에 연속 윤곽 자료가 없으면 기존 판정이 유지된다.

준비된 경지16 구간에서180tick=1.5초 동안 동행이90tick 실제 `Engine.move`를 입력하고 나머지는 정상 tick/mission tick을 진행했다. 초기에 NPC/동행 위치와 이전 호송 단계만 준비하며 그 뒤 외부 좌표·HP·자원·이동량 보정이 없다. 경로만 분리하려고 다른 배우를 제외한 구간이며 전체 정상 전투/완주가 아니다.

| 구간 | 수정 전 NPC 수평 이동 | 수정 후 NPC 수평 이동 | 동행 이동 소모 전/후 |
|---|---:|---:|---:|
|내리막: NPC(2640,4720), 동행(2980,4890)|0|348.827|285 / 285|
|오르막: NPC(4520,4833.33), 동행(5000,4513.33)|0|324.500|285 / 285|
|먼 동행980거리|0|0|0 / 0|
|다른 층|0|0|0 / 0|
|석교 서단|286.771|286.771|0 / 0|
|석교 동단|276.321|276.321|0 / 0|

별도 제외 조건 검사로 직선 약858거리의 가까운 상층 창고 동행도 실제 NPC 이동0을 확인했다. 단순 반경 증가가 아니다. 석교 양끝은 현행에서 이미 통과하므로 기존 이음 지형을 다시 바꾸지 않았다.

근처에 적을 둔 대조는 전후 똑같이205.833 이동했다. **현재 NPC는 근처 적만으로 자동 정지하지 않는다.** 이 검사는 피해를 주입하거나 적을 실제 제압한 증거가 아니다. 적 위협·선도 거리·지형/이음 문제를 같은 정지 원인으로 묶지 않는다. 이번 작업에서 NPC 충돌/피해/전투 AI를 새로 고치지 않았다.

## 저장·보상·일관성 및 관련 검사

통과한 범위:

- 현재 전체40체를 원래 위치/HP에 남긴 별도 경사 입력: 판정 함수가 전투를 수정하지 않음, 실제 이동/tick 진행, 전체 전투 Continue 일치, 중간 내보내기→Continue 후 나머지 입력이 무중단 입력과 일치, 아이템 불변.
- 별도의 도착 fixture에서 기존23장 완료·첫 보상과 재완료의 중복 방지를 확인. 이것을 새 진입 완주라고 부르지 않는다.
- 기존 `stage23-escort-old-save.mjs`의 waiting/midway/paid 및 old12/18/30 보존 사례는 통과했다. death-retry는 프로필 원장의 NPC 피해 snapshot HP0→1450 차이로 실패했다. 이 경로는 새 선도 판정이 적용되지 않는 옛 맵/시작 전 retry 경계이며 이번에 수리하지 않았다.
- 기존 `stage23-escort-growth-resume.mjs`의 역사적 Lv17 fixture에는 현재 지도 stamp가 없다. 첫 Continue에서 기존 지도 revision 재시작 정책이 동작해 과거 전체 snapshot 일치 가정에 실패했다. 새 선도 입력 이전의 실패이며 수리/통과 처리하지 않았다.
- 원본 campaign과 생성기는 수정하지 않았다. [일관성 기록](evidence/consistency.json)에서 기준 campaign·생성기 불변, 최종 런타임 전체30장 불변, 원본과 활성 chapter 일치 및 런타임 배우·지형·이벤트·설계 일치를 확인했다. 기존 런타임의 서사/증거 메타데이터 이관은 원본 JSON과 별도로 적용된다. 같은 공통 번들이 Game/Stage View/Playtest에 연결된다.

```
node tools/testing/act1-act3-pacing-probe.mjs
HONRO_PACING_PHASE=after node tools/testing/act1-act3-pacing-probe.mjs 23
node tests/stage23-road-lead-resume.mjs
node tests/stage23-escort-old-save.mjs
node tests/stage23-escort-growth-resume.mjs
node game/build.mjs
python tools/testing/act1-act3-pacing-capture.py 8 22 23
```

원래 baseline 구간은9cb849a5에서 수정 전 실행했다. 향후 구 판정 대조가 필요하면 `HONRO_PACING_LEGACY=1`로 새 선도 함수만 VM 내에서 비활성화할 수 있다. 이는 검사 도구의 대조 조건이며 제품 옵션이 아니다. [측정 기록](evidence/measurements.json)에서 실제 baseline과 후속 판정의 출처/범위를 구분한다.

전체 verify, 무관한 검사 수리, 세 장의 새 진입 전체 완주, 사람 벽시계 시간 추정은 하지 않았다. 과거37/39/40라운드나 자동 정책의 막힌 시간을 현재 맵 소요로 포장하지 않는다.

## 집중3회와 별도 실제 화면 검수

로컬 최종 빌드의 Chromium 실제 픽셀이다. 준비된 카메라/진행/보스 위치와 실제 키보드 구간을 구분한다. 세 장에서 실제 ArrowRight+production App.frame20회를 입력했고,23장에서는 경사 NPC도2643.88→2721.39로 움직였다. 이후 추가 정상 프레임에서 호송이 이어지는 화면을 별도 확인했다. 준비된 짧은 구간이 전체 장 연속 플레이를 대신하지 않는다.

| 장 | 집중1: 구조 | 집중2: 디테일/접지 | 집중3: 모바일/상태 | 별도 종합 |
|---|---|---|---|---|
|8|[양끝 결박·중앙·높은 길](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/8-focus1-overview.jpg)|[동쪽 결박·상여·사격점](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/8-focus2-east-binding.jpg)|[390×844 중앙](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/8-focus3-mobile-court.jpg)|[중앙에 멎은 상여 준비 상태](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/8-final-central-bier.jpg)|
|22|[다층 서고·두 접근선](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/22-focus1-overview.jpg)|[보고 기록과 계단](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/22-focus2-report-court.jpg)|[390×844 호적층/최상층](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/22-focus3-mobile-register.jpg)|[대조 단계 준비 상태](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/22-final-comparison.jpg)|
|23|[운반길·상부 선택로·석교](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/23-focus1-overview.jpg)|[경사 동행의 실제 화면](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/23-focus2-ramp-follow.jpg)|[390×844 석교](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/23-focus3-mobile-bridge.jpg)|[정상 프레임 이후 경사 진행](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/23-final-ramp-progress.jpg)|

12장을 직접 열어 높이차·연속된 지지면·서로 다른 사격점·지붕/창고/고목의 장소 특색과 접지를 확인했다. 8장 중앙 상여는 실제 완료 플레이가 아닌 위치/사건 상태 fixture다. 22장 상층 대조도 이전 목표를 준비한 화면이며 기록 운반 완주 증거가 아니다. 23장 키 입력과 NPC 이동은 실제 엔진에 반영됐다. 화면 오류0, JPG 각1MB 미만. 최초 집중 화면은9cb849a5 위의 두 런타임 파일 변경 트리에서 실행했다. 정확한 커밋 소스의 별도 종합 기록은 최종 항목에 덧붙인다.

## 부모 통합 주의

공용 변경은 `act3-objectives.js`의 선도자 predicate 선택 **한 곳**이다. 전용 함수는23장 관창 계약에서만 값을 반환하고 다른 장에는 null을 반환해 기존 sameFloor 경로를 쓴다. 새 공통 이동/물리/렌더 루프는 만들지 않았다. `stage23-escort.js`와 함께 반영해야 한다. 공통 성능·엔딩·초상화와 앞 네 장 소스는 변경하지 않았다.

생성 HTML/web은 착수 기준 master의 빌드다. 부모는 최신 master의2막 개선을 보존해 소스를 통합한 뒤 **새로 빌드**하고 Pages를 검증한다. 이 하위 작업은 master를 병합하거나 공개 배포하지 않는다.

## 최종 실행 소스와 인계

구현·생성물·관련 검사 입력을 저장한 실행 소스는 **`677ffe8d4afa0d1e37d3cd3de51ded146e2a9302`**다. 이 커밋을 원격 브랜치에 push한 뒤 별도 Chromium 세션에서 세 장 최종 화면을 다시 캡처하고 모두 직접 열었다. [최종 브라우저 기록](evidence/final-browser.json)의 source가 해당 SHA이며 실제 키 입력·NPC 진행·오류0을 보존한다. 활성 Playtest는 `web/entries/game.71983cbe88856f07.html?embedded=1`이다. 뒤이은 커밋은 이 최종 기록과 JPG/문서만 추가하므로 실행 소스는 같다.

최종 화면에서도8장의 중앙 고목·하층 연결길,22장의 높은 서고와 연결 계단,23장의 연속 낮은 운반길과 상층 창고 선택로가 유지된다. 지형·그림/디테일·사격점·접지를 바꾸지 않았다. 최종 JPG를 포함한12장 모두1MB 미만이다. 변경 전후의 짧은 실제 엔진 구간, 전체40체 저장 회귀와 준비된 도착 보상 검증까지 확인했으며, 새 진입 전체 전투 완주·사람 소요시간·공개 Pages 검증은 이 하위 작업의 결과에 포함하지 않는다. 관련 역사적 검사 두 건의 실패는 위에 원인과 경계를 남겼다. 남은 작업은 부모의 최신 master 소스 통합·재빌드·Pages 확인이며 접근/권한 차단은 없다.

## 2026-10-22 최신 master 통합·배포 인계 갱신

부모의 후속 위임에 따라 `integration/stage23-pacing-release-20261022`에서 원격 master **`e7fbff647c387f092f51215e9d867d664906d9bd`**와 `a615812afb83d43c4a639cd377382dd08873ad56`를 병합했다. 앞의 “부모가 통합/배포” 표기는 최초 작업 인계 시점이며 이번 위임이 이를 갱신한다. master가 지정 SHA와 같음을 원격에서 확인했으며 성능 아키텍처·초상화 브랜치는 포함하지 않았다.

소스 diff는 최신 master 대비 기존23장 런타임 두 파일뿐이다. 2막 pacing·지도 원본·생성기·전투/이동 수치는 그대로 보존했다. BUG_LOG는 두 작업 항목을 모두 남겼고 생성 HTML/web 충돌은 최신 master 생성물을 출발점으로 통합 소스에서 재생성했다. 활성 Playtest는 `web/entries/game.709586d408ff33dd.html?embedded=1`이다.

선별 검증은 `stage23-road-lead-resume.mjs`, 23장8가지 짧은 구간의 구 predicate/현 predicate 대조, `act2-pacing-state.mjs`, `web-split.mjs` 모두 통과했다. [통합 구간/저장 결과](evidence/integrated/boundary-and-resume.json), [23장 회귀](evidence/integrated/road-resume.log), [2막 상태](evidence/integrated/act2-state.log), [번들 일치](evidence/integrated/bundle.log)를 보존한다. 23장1.5초 이동0→348.827/324.500과 자원285불변, 먼/상층 동행의 정지 및 석교의 기존 이동을 다시 확인했다. 기존 역사 검사2건은 미수리·미통과로 남기며8/22장 집중 검수와 전체 플레이는 반복하지 않았다. 통합으로 새 게임 로직을 추가하지 않았으므로 생성물·연결·기존 회귀만 선별했다.

Pages 설정 및 Actions 목록의 CLI 읽기는 HTTP `Forbidden`으로 거절됐다. 해당 요청은 반복하지 않았다. master 쓰기와 배포 실행의 상태는 이후 기록에서 별도로 구분한다.

통합 최종 런타임/검증 소스는 **`5ceba2c114ed1851abcfe7aeb25d233be5376d39`**다. 이 커밋에서23장만 별도 Chromium 실제 화면을 캡처해 직접 확인했다. [대표 JPG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/act1-act3-pacing-20261022/evidence/integrated/23-final-ramp-progress.jpg)와 [브라우저 입력/소스 기록](evidence/integrated/final-browser.json): 실제 ArrowRight20프레임에서 동행3220→3333.294, 이동1640→1513.333, NPC2640→2717.517, 오류0. 기존 상층 선택로·연속 경사·서로 다른 사격점·접지를 보존했다. 사진은1MB 미만이며 초기 위치/이전 단계 준비와 실제 입력 구간을 구분한다. 이후 문서·증거 커밋은 런타임을 바꾸지 않는다.

master는 원격이 여전히 지정 기준임을 확인한 뒤 `e7fbff647c387f092f51215e9d867d664906d9bd`→**`ee878017147d391aa126916efa199bfbd4544a46`**로 비강제 fast-forward push했고 원격 조회로 성공을 확인했다. 통합 브랜치도 같은 커밋이다. 이 항목을 덧붙이는 후속 커밋은 문서만 바꾸며 실행 소스는5ceba2c1 그대로다.

**배포 검증 차단:** `gh api repos/sys8994/honro/pages`와 `gh run list --repo sys8994/honro`는 HTTP `Forbidden`, 공개 `https://sys8994.github.io/honro/web/manifest.json` 읽기는 `Tunnel connection failed: 403 Forbidden`으로 거절됐다. 연결된 GitHub의 commit workflow 도구는 이 SHA에 빈 목록만 반환했고, 해당 도구는 PR 실행만 조회하는 제한이 있어 Pages run 근거로 삼지 않았다. 이 조회 요청들은 반복/우회하지 않았다. master push는 성공했지만 Pages 자동 실행의 시작·run 번호·결과 및 공개 파일 갱신은 **미확인**이다. 공개 브라우저 검수는 부모에게 인계하며 이 환경에서는 배포 성공을 주장하지 않는다. 별도의 배포 재실행/설정 변경은 보내지 않았다. 로컬 빌드·회귀·실제23장 픽셀 검수는 통과했고 남은 차단은 배포 읽기 확인뿐이다.
