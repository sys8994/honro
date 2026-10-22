# 14장 정상 입력 controller 수정과 완주 증거 · 2026-10-22

**동일한 e7fc8ce 게임에서 실제 R21 저장 재개는 총 R28, 수정 controller의 fresh 한 번은 R22에 자연 승리했다.** 두 실행 모두 동행/NPC 전원 생존, 실제6증원,4라운드 보호, 국소 위협 정리를 확인했다. fresh는 같은 실행의 결과→쉼터→15장 진입/Continue까지 통과했다.

## 고정 기준과 controller 변경

게임 기준은 `e7fc8ce8ed2563eb99ca3b0c73390459a402b486`이다. 이 후속 작업에서 game/runtime/campaign/narrative/generated/미술은 바꾸거나 빌드하지 않았다. 별도14장 미술 후보도 병합하지 않았다. 변경은 tests/입력 fixture/이 증거 문서뿐이다.

- 최초 재개 controller 커밋: `ebed6042cc88a1506d62089b46c06d69d6b37187`.
- VM 배열 단언 수정 및 실제 승리 저장 postflight, fresh 실행 커밋: `b2ecea1f03ed7937dafdcb9f8a9a694ccbb06d0e`.
- `stage14-goal-policy-helper.mjs`는 읽기 전용이다. bridge에서 기존 `east-shoulder/lower-house` 전수 우선 사격과 고정 마당 crossfire를 적용하지 않는다. 실제 `interactionThreats`의 반경360 대상과 현재 배우의 저작 경로 보행 구간180 이내 접근 위협만 대응한다.180은 controller의 국소 접근 판단 폭이며 새 게임 필수 조건이 아니다.
- 보호 중에는 실제 교란 반경과 보호 NPC의 기존 국소 위협 집합을 합쳐 대응한다. 마지막은 실제 `enemiesFor(clear-village)`를 사용한다. 경로/반경/선행 조건/정상 이동·사격·방어·구조 규칙과 기존 회복 정책/스킬 선택은 그대로다. 필수 구조 이전의 정책도 그대로다.

입장 조건은 plan13.8=실제 경지13/XP42,883, 보통,4동행, seed19388, rank1/능력치 수련6/4슬롯이다. 수련점15–18을 남기는 기존 build를 유지했고 추가 수련/장착 변경은 없다. 두 실행과 실제 R21 입력의 project/runtime hash가 일치한다. 최초 profile/battle도 fresh 고유 session·report attempt ID 네 경로를 제외하면 exact다. 이전13장 실제 플레이를 주장하지 않는 입장 fixture다.

## 실제 완료 흐름

| 단계 | 실제 R21에서 재개 | 새 controller fresh 한 번 |
|---|---:|---:|
| 상층 구조 | R5 | R5 |
| 중층 구조 | R8 | R8 |
| 하층 구조 | R15 | R15 |
| 다리 걸쇠 | R23 | R17 |
| 보호4라운드 완료 | R27 | R21 |
| 국소 정리/승리 | R28 | R22 |

재개 열의 첫 세 구조는 기존 controller로 진행한 앞선20라운드의 사실이다. **재개 R28에는 그20라운드를 포함**하며, 수정 controller는 R21부터만 사용했다. 이 재개 수치를 fresh 결과로 부르지 않는다. fresh R22는 새 정책의 별도 실행 결과이며 이전 controller의 진단 수치에 대한 직접 단축률로 해석하지 않는다. 두 실행 모두 R35 시작 안전 상한 이내에 끝났으며, 상한을 합격 기준으로 사용하지 않았다.

재개 후 bridge 사격은 g1/g2/g3 접근 위협을 향했다. 상부 e1 추적은 하지 않았다. 승리 때 선택적 잔적은 재개25명/fresh32명 살아 있었고 실제 최종 국소 위협 집합은0이었다. 전맵 소탕이나 목표 flag 강제 완료를 사용하지 않았다.

## 행동·자원·대기

| 측정 | 재개 전체(기존20 포함) | 재개 이후분(R21–28) | fresh |
|---|---:|---:|---:|
| 실제 동행 행동 | 109 | 29 | 86 |
| 사격/기예 | 95 | 26 | 76 |
| 상호작용 | 4 | 1 | 4 |
| 일반 방어 | 10 | 2 | 6 |
| 동행 피해 | 1722 | 299 | 1598 |

재개 전체는 이동+전투72/제자리 전투23/상호작용4/이동만6/제자리 방어4턴이다. fresh는 이동+전투62/제자리 전투14/제자리 상호작용3/이동+상호작용1/이동만4/제자리 방어2턴이다. 이동과 공격은 겹치므로 별도 라운드처럼 더하지 않는다. 재개 이후 방어2회는 사격을 못 찾은1회·보호 방어1회, fresh 방어6회는 유용한 사격을 못 찾은 경우였다. 보호 이벤트가 진행되는 동안 정상 교전·방어를 했으며4라운드 진행을 강제 증가시키지 않았다.

정산 **직전** 동행 HP는 재개319/560/949/893, fresh492/437/733/984(설오/담허/휘겸/소단 순)다. 보호 NPC는1665/1900·1699/1900HP로 생존했다. 결과 정산에 따른 경지 상승/능력치 재계산과 새 장 자원 회복은 production 경로이며, 완주 근거에는 정산 직전 자원을 따로 보존했다.

무적·좌표/HP/기력/이동도 보정·적 삭제/HP 감소·목표/승리 강제 조작은 없다. 두 실행의 외부 배우 쓰기0/강제 recover0/경로 실패0, 아이템 보존을 확인했다. 정상 방어·라운드 회복·정산과 쉼터의 정상 회복은 받았다.

## 최초 재개의 검증 코드 오류와 처리

최초 실행은 실제 승리·정산·export까지 끝냈지만 완료 ID 배열을 Node와 VM 사이에서 `deepStrictEqual` 비교해 prototype 차이로 종료코드1이 됐다. 실제 ID 여섯 개는 같았으며 게임 실패가 아니다. 원본 `result.json`의 validationFailure와 로그를 지우거나 PASS로 덮어쓰지 않았다.

단언의 VM 배열을 `plain()`으로 정규화했다. 전투를 재연하거나 승리를 준비하지 않고, 이미 실제 내보낸 승리 profile과 final-battle을 읽어 완료·국소0·보호4/6증원·전원생존·실제 정산1회를 다시 확인했다. 정산 반복 검사는 실제 지급된 battle의 clone에서만 했다. profile에는 정상적으로 `honroBattle:null`, cleared14 `{visits:1,rounds:28}`가 있었다. 그 실제 profile을 정상 Continue→쉼터→15장으로 이어 받아 자원/성장 상속과 whole-battle Continue를 확인했다.

따라서 재개 실행의 **같은 프로세스 result-continue**는 최초 단언 때문에 미실행이고, 실제 저장 재시작 경로로 확인했다. fresh 실행에서는 수정된 단언과 같은 프로세스 결과→쉼터→15장까지 종료코드0/validationFailure null로 통과했다. 두 사실을 구분한다.

## 재현과 보존 자료

실제 정상 입력으로 도달한 R21 원 저장은 [checkpoint gzip](../../../tests/fixtures/stage14-rescue-r21-checkpoint-20261022.json.gz)에 바이트 그대로 압축 보존했다. 테스트용으로 새로 만든 승리/중간 목표 상태가 아니다. 재개 전 production Continue의 전투 전체 exact 일치를 확인했다.

```sh
node tests/stage14-goal-policy.mjs
HONRO_FULLPLAY_CURRENT_AUDIT=1 HONRO_FULLPLAY_GOAL_LOCAL=1 \
HONRO_FULLPLAY_GAME_SOURCE=e7fc8ce8ed2563eb99ca3b0c73390459a402b486 \
HONRO_FULLPLAY_CONTINUE=tests/fixtures/stage14-rescue-r21-checkpoint-20261022.json.gz \
HONRO_FULLPLAY_OUT=_local/reports/stage14-goal-local-20261022/resume \
node tests/stage14-vertical-fullplay.mjs
```

fresh는 위 CONTINUE를 빼고 OUT을 `/fresh`로 바꾼 **한 번**이다. 이전 진단의20라운드 모드는 남겼고, 이번 opt-in `GOAL_LOCAL`만 R35 시작 상한을 사용한다. `stage14-goal-local-postflight.mjs`는 원본 첫 실행의 실제 R28 승리 저장만 대상으로 한다. 결과/원본 로그를 보존한 채 이 후속 확인을 별도 기록한다.

[evidence.json](evidence.json)은 두 실행의 checkpoint/실제 입력·위협 집합·탄별 피해/정산 전 자원·성장/15장/원본 SHA256과 첫 단언 오류를 담는다. raw는 `_local/reports/stage14-goal-local-20261022/{resume,fresh}/`다. 게임/UI는 [기존 후보와 실제 JPG](../stage14-rescue-gates-20261022/README.md) 그대로이며 이번에는 브라우저·빌드·전체 verify·30장·추가 경로 최적화 실행을 하지 않았다.

Native production App/Engine에서 DOM/렌더/저장매체/시계를 double로 사용했다. 사람 평균·최적 전략·실제 브라우저 완주·성능·미술 품질의 증거는 아니다. 현재게임 e7의 정상 완료/저장 연결은 확인됐으며, 별도 미술 통합 뒤의 최종 소스와 공개 Pages는 부모의 후속 검수 대상이다. master/Pages에는 쓰지 않았다.
