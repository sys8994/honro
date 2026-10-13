# 조건부 파동 미입장 증거 계약

이 문서는 `ENCOUNTER_ACCEPTANCE.md`의 파동 관측 계약을 보완한다. `observed` 파동의 기존 출생 ID, 예고/입장 경계, 첫 실효 행동/플레이어 반응과 효과 요구는 유지한다. 조건부 미입장은 전투 효과를 관측했다는 뜻이 아니다. 알려진 무효과 파동을 완료로 바꾸는 면제도 아니다.

## 허용 범위

현재 검토된 verifier는 새 5장(`honroStage5WaterfallRevision:1`)의 `habitat-5-0`, `habitat-5-1`뿐이다. `lower-beasts`나 다른 장은 같은 설명 문자열을 붙여도 통과하지 않는다. 현재 `mission.reinforceHold`, objective 계산과 5장 경고 정책의 원문 digest를 고정한다. 해당 계약이 바뀌면 adapter와 회귀를 다시 검토해야 하며 자동으로 예전 판정을 적용하지 않는다. 원본 trace의 runtime/campaign digest도 현재 실제 번들과 대조한다.

manifest wave 및 observation row의 `status`는 `observed`를 유지한다. 이는 미입장 사유를 관측했다는 의미다. 해당 phase는 다음 구조를 사용한다.

```json
{
  "id": "habitat-5-0:normal-run",
  "disposition": "condition-not-met",
  "spawnedIds": "N/A",
  "entry": "N/A",
  "firstEffect": "N/A",
  "actions": [],
  "playerResponses": [],
  "effects": "N/A",
  "nonEntry": {
    "verifier": "stage5-habitat/v1",
    "tracePath": "_local/reports/example/trace.json",
    "reason": "원본 전체 기록에서 생존 적 하한이 5 이상이어서 보충 조건 미충족",
    "terminal": {"frame": 9361, "round": 17, "phase": "won"}
  }
}
```

`tracePath`는 해시 검증된 manifest evidence이면서 observation의 `rawEvidencePaths`여야 한다. runtime inventory의 `sourcePaths`는 `shared/runtime/mission.js`, `shared/runtime/objectives.js`, `shared/runtime/stage5-waterfall-geometry.js`를 모두 해시 검증하여 연결한다. 일반 관측 phase는 disposition을 생략하거나 `observed`로 적는다.

## 조건 미충족: condition-not-met

단순한 최종 적 수로는 통과하지 않는다. 원본 전체 초기/종료 battle, 모든 whole-state snapshot, 라운드별 전체 관측, 매 프레임 입력의 연속성, actor frame, 상태변경, 피해 ledger, 출생, 실제 행동, Continue 일치가 필요하다. 파동 출생은 ledger뿐 아니라 전체 상태의 `honroSpawnSource`에서도 검사한다. 출생했으면 기존 관측·효과 계약으로 돌아가야 한다.

adapter는 초기 적 중 모든 피해량을 누적해도 살아 있고, 마지막 HP와 피해 ledger가 정확히 일치하며, 모든 actor/whole-state sample의 HP와 side가 해당 ledger와 일치하는 적의 하한을 계산한다. 최소 5체를 증명해야 한다. 피해 기록이 빠지거나 부활/치유/삭제 등으로 이 보수적 증명이 성립하지 않으면 최종 적 수가 많아도 차단한다. 이 경로는 모든 미발생 원인의 일반적인 증명법이 아니다.

검토된 실제 `reinforceHold` 함수와 현재 `HonroObjectives.state`를 원본 전체 상태에서 다시 실행한다. 목표 안정화 중의 원조건에 생존 하한을 대입한 보수적 추가 검사도 수행한다. 원본 출생·실효 효과를 만들어내거나 전투 상태를 수정하지 않는다. 종료 frame/round/phase와 원래 1라운드 안정화의 목표 완료도 별도로 확인한다.

## 목표 선제 완료: objective-preempted

원조건이 충족됐지만 같은 라운드에 처음 예고돼 실제 입장이 다음 라운드까지 지연되고, 그 전에 원래 목표가 완료되는 경우다. 이 경우 위의 일반 sparse trace만으로는 통과할 수 없다.

원본 trace에 모든 App.frame의 mission.tick 직전 전체 battle과 실제 안전 경계를 보존한 `missionFrames`가 필요하다: `{frame, boundary, battle}`. frame 1부터 종료 frame까지 하나도 빠지면 차단한다. boundary는 선언값을 믿지 않고 실제 phase/projectile/Engine.settleBusy와 대조한다. 실제 objective·reinforceHold·5장 경고 wrapper를 실행하여 아래를 모두 확인한다.

- 경고 지연을 제거했을 때 실제 원조건 요청이 존재한다
- 실제 경고 wrapper를 적용하면 승리 전 허용된 출생 요청이 단 한 번도 없다
- 원조건 요청 다음 라운드가 실제 승리 라운드다
- 원래 objectiveReadyRound+1의 안정화가 유지된다
- 출생·원본 증거·종료 시점에 모순이 없다

이 richer capture가 없는 정상 입력 trace에 선제 완료 라벨만 추가하는 것은 실패한다. 이미 이전 라운드에 예고돼 입장 가능했던 파동을 생성하지 못한 결함도 실패한다.

## 검증과 한계

`node --test tests/encounter-evidence-gate.mjs tests/encounter-conditional-wave-dispositions.mjs`는 기존 관측 계약, 조건충족 누락, 출생했으나 효과 없는 경우, 누락/변조 증거, 원본과 모순된 종료, 이전 예고 후 실제 trigger, 허위 boundary, 타 장 무검증 면제를 회귀 검사한다. 합성 fixture는 실제 맵 품질이나 정상 플레이 증거가 아니다.

이 adapter는 전체 게임 프레임의 결정론적 재현기가 아니다. 원본 기록이 정직하게 수집됐는지, hook가 모든 상태변경을 기록했는지, 실제 품질·가독성·전술적 의미·독립 검토자의 열람은 여전히 원본 수집 코드와 증거를 직접 검토해야 한다. gate 성공은 증거 형식과 제한된 원조건 증명의 충족이며 브라우저/Pages/디자인 승인으로 바뀌지 않는다.
