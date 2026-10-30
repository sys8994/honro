# 공중 적·짐승 근접 검수 원본

기준 master `27efe8eb`, 구현 `536c663e`, 검수·빌드 `e52f510a`. 부모 픽셀 검수를 위한 보존본이며 **master/Pages는 보류**한다. 기능을 바꾸거나 브라우저/전체 검사를 새로 실행하지 않았다.

아래 PNG는 기존 실제 Chromium 캡처 원본이다. 준비된 skirmish에서 HP365/기력96의 일반 진입 아군과 실제 일반 생성 짐승을 사용했다. 피해 무적·피해 override는 없다. 장면은 준비된 교전이며 원본 캠페인 전체 완주를 뜻하지 않는다.

| 종 | 준비 | 접촉 | 회복 |
|---|---|---|---|
| 산개 | [![산개 준비](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/hound-approach-1-prepare.png)](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/hound-approach-1-prepare.png) | [![산개 접촉](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/hound-approach-2-contact.png)](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/hound-approach-2-contact.png) | [![산개 회복](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/hound-approach-3-recover.png)](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/hound-approach-3-recover.png) |
| 멧돼지 | [![멧돼지 준비](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/boar-charge-1-prepare.png)](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/boar-charge-1-prepare.png) | [![멧돼지 접촉](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/boar-charge-2-contact.png)](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/boar-charge-2-contact.png) | [![멧돼지 회복](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/boar-charge-3-recover.png)](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/boar-charge-3-recover.png) |
| 사슴 | [![사슴 준비](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/stag-approach-1-prepare.png)](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/stag-approach-1-prepare.png) | [![사슴 접촉](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/stag-approach-2-contact.png)](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/stag-approach-2-contact.png) | [![사슴 회복](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/stag-approach-3-recover.png)](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/stag-approach-3-recover.png) |

필수 9컷 외에도 원래 확보한 벽·상층·불가능 접근, 세 공중종 전후, 원본1장 대표 화면을 함께 보존했다. 전체19 PNG는 [보존 manifest](evidence/preservation-manifest.json)에 원래 위치·바이트 수·SHA256으로 연결된다. 복사본은 원본과 바이트 단위로 같으며 합성·재압축·추가 그림은 없다. 반복 빌드 로그는 넣지 않았다.

- [브라우저 summary](evidence/browser/summary.json): 초기 능력치, 실제 피해, 이동량, 오류0과 각 교전의 범위.
- 종별 전체 trace: [산개](evidence/browser/hound-approach-trace.json), [멧돼지](evidence/browser/boar-charge-trace.json), [사슴](evidence/browser/stag-approach-trace.json). 준비/접촉/회복 시간, 위치, moveLeft, struck latch, 실제 projectiles 수를 포함한다.
- 지형: [벽 PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/boar-wall.png)·[trace](evidence/browser/boar-wall-trace.json), [상층 PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/stag-upper.png)·[trace](evidence/browser/stag-upper-trace.json), [불가능 접근 PNG](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/hound-unreachable.png)·[trace](evidence/browser/hound-unreachable-trace.json). 상층은 점프로 같은 발판에 올라간 뒤 타격한 사례다.
- 공중 이동 trace: [박쥐](evidence/browser/bat-flight-trace.json), [까마귀](evidence/browser/crow-flight-trace.json), [등불](evidence/browser/lantern-flight-trace.json). 각 전후 PNG도 같은 폴더에 있다.
- 원본1장 대표 [화면](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/airborne-beast-melee/evidence/browser/canonical-stage1-enemy-turn.png)·[trace](evidence/browser/canonical-stage1-trace.json): 정상 이동/점프/대기와 근접 시도 관찰이다. 전체 완주나 실제 명중을 주장하지 않는다.
- [저장 이전 포함 집중검수 결과](evidence/summary.json): Continue/export/import3회, 생존 비율·사망·보스·qi/soul·성장 보존. DOM/storage double을 사용하는 App harness 결과와 실제 브라우저 증거를 구분한다.
- [최종 종합 검수](evidence/final-review.json): 구현 source hash, 통과한 관련 검사 목록, 기존 실패3개와 범위. 원래 `_local` 경로는 실행 당시 provenance로 유지하고 보존 manifest로 저장소 경로를 찾는다.
- [18 피해 계산](evidence/damage-calculation.json): 기존 production `effective()`/`hurt()`를 같은 진입 수치로 짧게 계산한 보충 자료. [현재 명세의 계산 설명](../../BEAST_MELEE_AIRBORNE_BALANCE.md#왜-세-종이-각각18-피해인가)과 연결된다.

## 기존 실패3개 — 통과 아님

[실패 summary](evidence/failures/summary.json)에 기준 master 전체 SHA, 종료 코드1, 수정 전후 동일한 검사 소스 SHA를 기록했다. 다음은 모두 **실패**다. 이번 보존 작업에서는 처음2개만 같은 원본에서 좁게 재현해 로그를 보충했고 stage2는 이미 확보한 수정 전 로그를 그대로 보존했다.

| 검사 | 수정 전 master의 실패 | 원본 재현 로그 |
|---|---|---|
| existence-damage | unclassified S14, line20 | [실패 로그](evidence/failures/existence-damage-baseline.txt) |
| existence-variety | 과거 attack delta fixture 차이, line8 | [실패 로그](evidence/failures/existence-variety-baseline.txt) |
| stage2-airborne | 역사 clone의 plan?.flightEscape, line40 | [실패 로그](evidence/failures/stage2-airborne-baseline.txt) |

stage2 로그 앞의 개별 PASS 출력은 최종 실패를 덮지 않는다. 이3개를 전체 통과로 분류하거나 무관한 기능을 수리하지 않았다.
