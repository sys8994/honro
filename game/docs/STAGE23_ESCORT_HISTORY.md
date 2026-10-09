# 23장 하역장: 역사 경계와 진행 저장

## 첫 작업 체크포인트 상태

`stage23-wip-first-runtime-geometry-art-held-fullplay-unverified`는 첫 구현을 보존하는 WIP 체크포인트다. 경로112건·NPC·실탄·runtime·옛 저장 검사는 각 별도 보고서 범위의 증거다. active-v2 미술은 검토에서 보류되었으며 이 정확한 역사 캡처가 미술의 production 승인을 뜻하지 않는다. 정상 fullplay는 아직 미검수다. 미술 revision2는 이 저장 지점 다음의 별도 변경 단위로 다룬다.

## 변경 경계

원본은 commit `7df220ba9de5a0eeee3432091f92cf285cbc86f6`, tree `2d961adc788f5d6cc17884b13c81f9ab6a0fcb96`이다. `stage23-escort-history-before.json`, `stage23-escort-history-stage23.json`, `stage23-escort-history-entry-ledger.json`은 이 시점의 동결 자료이며 갱신하지 않는다. before manifest는 30개 지도, 기존 573개 에셋, 128개 runtime/data/build 파일과 기존 역사 fixture 22개의 해시를 담는다.

새 `stage23-escort-history-reviewed.json`은 별개의 명시적 작업 체크포인트다. 생성기의 현재 출력, 공통 production bundle의 지도, 관련 저작 소스와 두 model fingerprint를 검사한 뒤에만 기록한다. 이 파일이 있다는 사실이나 label은 정상 플레이·미술·브라우저 승인을 뜻하지 않는다.

`tests/stage23-escort-history-helpers.mjs`는 다음 순서로 검사한다.

1. current23의 전체 지도, globals, stage ID/순서, 모든 기존 에셋 값/ID/순서, 새 에셋의 정확한 값/멤버십/순서를 검증한다.
2. 모든 runtime 파일의 멤버십과 바이트를 검사한다. 공용 소스 변경은 모델·렌더 등록 각 하나, scoped readability hook 하나, balance23.initialEnemies의 22 또는 28만 허용한다. 기존 maxAlive, active, XP, 기예·기본점프·전투 수치는 그대로다.
3. 검증한 current23만 원본23으로 되돌린 복사본을 만든다. 정확한 original project SHA256은 `ee31bb22ff0c4ab6f24893b150e2e05bfe0487a60b14b908d0fd559d976211fa`다.
4. 변경하지 않은 Stage12 → Stage30 → Stage18 역사 helper에 그 복사본을 전달한다. 역사 JavaScript 문자열은 해시 증거로만 취급하고 실행하지 않는다. 테스트에는 현재 Engine을 사용한다.

namespace/revision 존재만으로 항목을 지우거나 허용하지 않는다. full30 및 Act12 범위의 투영은 순수 함수이며 반복 적용에서 같은 값이다. 임시 runtime wrapper는 캡처된 실제 content/plan 배열의 검증된 행만 바꾸고 callback이 예외를 던져도 기존 객체 참조를 복원한다.

## 보존되는 계약

- 원래 네 목표의 순서·문구·kind·NPC target 및 150px 층차, 65px 선행, 950px 동행 판정은 유지한다.
- 현재 23장만 9800×6200이며 나머지 29개 지도는 전체 해시가 원본과 같다.
- 원본22/정예5, 비교22/정예6, 후보28/정예6을 각각 이름 있는 편성으로 구분한다. 동시 행동 상한3, 유한3+2+3, 인구상한30 또는36은 서로 다른 수치다.
- 유한 증원의 ID, 수, 종류, 정예, once는 원본 그대로다. 마지막3명의 trigger만 명시적으로 `{objectiveDone:'dock-mid', after:'act3-response-23-1'}`를 사용한다. 고지의 동료가 먼저 x4250을 넘어도 짐꾼의 석교 도착을 건너뛰어 증원을 부르지 않는다. 새 입구는 maxDistance0의 실제 지지점과 점유 검사에 연결한다.
- 주민 속성은 원본과 같으며 배치 좌표만 변경한다. 새 동료 자원·기예·성장 override나 적의 공격/HP override를 저작 허용 범위에 넣지 않는다.
- 기존23 저장에는 새 revision, cargo 상태, activation, 지도·배치·에셋을 주입하지 않는다. 명시적 재시도/새 입장만 새 지도를 받는다.

## 재현 명령

현재 생산·저작 소스를 검토하고 고정한 뒤 새 작업 체크포인트를 기록한다.

```sh
node tools/map-forge/record-stage23-escort-history.mjs --label <reviewed-checkpoint>
node tests/stage23-escort-history-audit.mjs
node tests/stage23-escort-old-save.mjs
node tests/stage12-quarry-history-audit.mjs
node tests/stage30-ferry-history-audit.mjs
node tests/stage18-bell-history.mjs
```

기존 history 소비자의 import만 새 최상위 wrapper로 연결한다. 기존 helper/fixture의 assertion, golden, 소스 문자열은 완화하거나 덮어쓰지 않는다.

## 저장 검사와 한계

`stage23-escort-old-save.mjs`는 production App의 export → 실제 file-import handler → Continue를 사용한다. 각 재개 다음에는 mount도 반복한다. 다음 일곱 경우를 검사한다.

- 구23 동료가 뒤에 있어 짐꾼이 기다리는 상태: 3회 왕복
- 구23 실제 escortTick으로13px 이동한 짐꾼과 원본 대화1쪽: 3회 왕복
- 구23 production 피해/처치가 지급한 XP94: 4회 왕복과 rewardKill 재호출 시 무복제
- 구23 짐꾼 사망/패배 상태: 2회 왕복 뒤 실제 retry 클릭으로만 새 revision1 지도에 입장
- 원본12·18·30: 각각2회 왕복, 전장52필드와 새23 상태 미주입

합계18회 왕복·18회 mount이며 구23 원본 weight33.6, 시작75748·종료83635·총7887·전투3155 XP 한도를 보존한다. 결과는 `_local/reports/stage23-escort/old-save/summary.json`에 모든 관련 소스 SHA256, 각 시나리오 및 실패를 기록한다. 시작/종료에 소스 해시가 달라지면 검사 자체를 실패시킨다.

이 검사의 DOM·Canvas·오디오·저장/다운로드·시계는 대역이다. 옛 지도/대사, 22장까지의 입장 보상장부, 완료된 두 선행목표, 한 명의 지지면상 선행 위치와 치명 피해는 명시적 fixture다. 정상 도착·전투 승리·전체 캠페인 완주·실제 브라우저·시각 검수의 증거가 아니다. history audit 또한 보존 범위와 부정변이 검사의 증거이며 플레이 품질 승인을 대신하지 않는다.
