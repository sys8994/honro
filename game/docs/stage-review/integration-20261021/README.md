# 2026-10-21 후보 통합 검수 — 부모 최종 검수 대기

**별도 `integration/reviewed-candidates-20261021`에만 반영했다. master/Pages는 `bafc275c` 그대로다.** 최종 실행 소스는 `4d26b130`, 정확한 후보 전체 SHA는 [sources.json](sources.json)이다. 12장·이미지 미연결 엔딩 및 그 밖의 후보는 가져오지 않았다.

| 후보 | 반영 |
|---|---|
| 2장 `29f70e73` / 검증 runtime `499305b0` | 굴곡·얕은 물·긴 가지·flightRegion·map revision8 |
| 카메라/음악 `0573cac0` | 실제 Git에서 bafc의 조상이 아니어서 명시 병합. 부드러운 대사 카메라·중간 줌·9/10장05 우선·배경음 접두어 |
| 담허/축지 `4a82c907` | AP01 후속×.75·담허 기존 대비×1.18·범위/패시브/점선·도착 resolver220·SP revision2 |
| 공중/짐승 `4a80e5d7` | 일반 박쥐/까마귀 HP·form1.15 이전·일반3종 실제 근접·저장 latch |
| 5장 `8f4c21fa` | 새 지형/각성/초기12·유한6·사슴20이동·동쪽 권장1640·map revision3 |
| 11장 `8d786a91` / 구현 `0744c66f` | 기존 회귀 뿌리만 하부500 연장·map revision1/geometry7 |

후보별 생성 HTML/web/hash를 선택해 섞지 않고, 원본 소스 충돌을 해결한 뒤 공통 `npm run build`로 재생성했다. Engine.face와 gateResolution, constructor의 적 이전, fire/tick의 기존 도술·근접 hook, flightRegion과 짐승 경로가 함께 남아 있다. **원본 campaign의 변경은 승인된2/5/11장뿐이고 다른27장·Library는 bafc와 정확히 같다.** TS main/math/HUD 입력 소스도 bafc와 동일하다. 공통 암반은 아래 메타데이터 오류만 교정했다.

## 새 정상 실행 — 각 한 번, 무제한 자원/강제 적 제거 없음

| 장 | 이번 실제 통합 실행 | 후보 기록과 구분 |
|---|---|---|
| 2장 | **R16 승리**, 상여1700/설오376, 적0, 사건5, 상여4100. 실제 이동·drop·발사·방어·일반 자원. 공중 queue≤3, 모든 날개 clearance, 실제 뒤 절벽 마스크의 영역 opaque pixel0. 초기/복제/증원·이동 trace 포함 | 후보 R15를 재사용하지 않았다. 실제 브라우저+생산 Engine 정책이며 수동 키보드 완주는 아니다 |
| 5장 | **R9 승리**, 초기12→R3 사슴6 한 번(5일반+1정예), 종료17생존. 회복 아이템1/강제 제거0. 최종 설오293/455, 담허는 전투486 후 정상 레벨업518. 주박목520 정상 파괴 | 기존 후보 R8/회복0/설오339와 다른 실제 결과다. 동일 RNG 통제 통계나 최종 난이도 승인으로 확대하지 않는다. native App의 정상 입력·시계/DOM/렌더 doubles이며 브라우저 연속 전투가 아니다 |

2/5장 전체 정상 완주는 각각 한 번만 실행했다. 이후11장/preview/결과 저장 교정은 두 장의 Engine·SP·HP·지형·입력 frame 코드를 바꾸지 않아 전체 완주를 반복하지 않았다. 최종 생성 문서에서는 실제 정상 저장을 다시 그려 상태/캐시/배경 마스크 불변을 확인했고, 마지막 결과 guard는 실제 승리 저장과 브라우저 파일 왕복으로 따로 검증했다.

- [2장 실제 normal trace·snapshot·입력](evidence/stage2/combat.json.gz), [승리 profile](evidence/stage2/profile-terminal.json.gz), [실제 R16 모바일 캔버스](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/stage2/stage02-mobile-player.png), [신규 공중 적의 유료 이동](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/stage2/wave-moved-sniper-crow-35.png).
- [5장 전체 실제 normal trace·입력·profile](evidence/stage5/fullplay.json.gz), [새 승리 화면](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/stage5/final-review-won.png). 레벨업 회복을 전투 중 HP 주입으로 표현하지 않는다.

## 함께 확인한 경계

| 항목 | 결과/범위 |
|---|---|
| 빌드/타입/공유 문서 | PASS. Game·Workshop·embedded248 자산 해시·바이트·실제 canonical 재구성·저장 격리·직접 iframe 연결 |
| 입력/AP01/담허 | 순수 입력120조합·충전126·S13 14·AP01 피해/기력/시간·담허16기예 SP1/8·범위/패시브 PASS. 실제 브라우저 입력 대표19판정, 멀티터치/PC 포함 |
| 축지 | native10묶음 및 실제 UI28판정 PASS. 실제 새5장 경사 도착·pointer/E·천장/점유/실패/저장 잠금. 진 x±125/y±80 및 기존 lakeRevision1의 x>2380 또는 y>3000 금지를 유지 |
| 공중/근접 | 생산 native 저장/형방어/넉백/대기비행, 브라우저10장면 PASS. 일반3종 준비/접촉/회복·한 번의 실제18피해·투사체0. 5장 실제 하부 경로에서 멧돼지40피해, 새 전체 run에서도 HBM01/HBM03의 정상 공격 기록 |
| 5장 위치 선택 | 같은 합법 level4 fresh에서 상부1097/2250·하부1199/2790, 실탄67/63·피격61/40으로 다른 표적/위협. 진 서쪽1486/2772의 M11 암반→1회 반사64, 동쪽1636/2672의 M03 사슴100. 두 곳 진 유지. [fresh checkpoints/실탄/적 대응](evidence/stage5/ritual-actions.json.gz) |
| 5장 근접 접근/몸체 | 두 정상 R2 checkpoint에서 일반 방어6입력만 관찰해 R5·queue≤4·짐승 투사체0·진 유지. 권장 동쪽 사슴 몸체 간격 최소81.76. 이 창에서는 진의 사슴/들개 직접 접촉은 선택되지 않았으므로 이를 무적/모든 적 접근 성공으로 주장하지 않는다. 맵 내 실제 타격은 위 하부/전체 run과 분리. [전체 trace](evidence/stage5/contact-trace.json.gz) |
| 카메라/음악 | 2/10장 실제28화면·retarget/resize/Continue·overflow/pageerror0. 실제 MP3 스트림20전환과 반복update/unlock/visibility/재시도·Continue, 9/10장05 우선·제목 접두어 PASS. 전체 곡 청취나 실기기 음질 판정이 아님 |
| 저장/SP/보상 | 5장 이전 정상R2의 HP 비율과 SP/air/map6순열×3반복 전체profile 동일, 신규5난이도HP 계산 한 번, 실제 App 반복 export/import 불변. 23장 SP/보상 회귀도 PASS. 실제2/5장 승리 저장의 결과 반복+실제 브라우저 다운로드/파일 입력2×2에서 XP/SP/장착/방문수/장부 불변 |
| 11장 | 원래 **explorer** 서/동 실패 저장을 새 뿌리 geometry만 재적용하는 명시적 테스트 어댑터로 검사. 각각 R59→62/R61→64, 기본 점프2, HP692/기력247/적37 보존. 오래된 SP의245→247, 공중HP 비율, HBR→HBM을 migrationChanges에 분리. 일반 Continue는 구판본을 새11장R1에서 재시작하며 성장/SP/장비/보상을 보존. 같은 판본/Workshop 제외/6순열도 PASS. 59턴 전체를 새로 완주하지 않음 |

새5장 일반 공중 HP는 박쥐145/까마귀166, form1.15다. 기존182/209를 다시 무작정×.8한 값이 아니라 **원본 난이도 정수화→종별 정수화→기존 HP60 정수화**를 한 번 적용한 결과다. 다섯 난이도에서 원본 combatBaseHp로 계산을 대조했다. 기존 저장은 남은 HP 비율을 보존하고 marker로 재보정하지 않는다. SP revision2와 map2=8/5=3/11=1은 별개로 멱등이다.

## 발견·교정한 사항

1. `skillVisuals.ts` 점선의 optional secondaryRadius 접근 TS2339: 속성 guard만 보강, 출력/범위는 동일.
2. 새2장 좌표가 옛3370/1010 author 검사에서 빠져 기본 Stage View/Playtest가 경고 정책 opt-in을 잃음: 명시된 승인 strategy revision2/flightRegion/roost만 인식. 무판본 import는 제외. **실제 Workshop iframe도 active=true·cap3·initial12·새영역·Engine.face로 진입**.
3. 기존 geology ledge의 physical .65–1과 background .85–1.1이 불일치해 실제 Playtest가 validator에서 막힘: background 상한을1로만 정합화. 검증기를 완화하거나 형상/배치/충돌을 바꾸지 않음.
4. 기존 완료 outcome의 done guard가 outro 뒤에 있어 재호출 시 terminal snapshot이 다시 저장되고 재import 방문수가 증가: guard를 먼저 검사. XP 중복은 없었지만 방문수/terminal save 문제를 실제 다운로드/파일 입력 회귀로 고쳤음.

gate 브라우저의 옛 진 중심±5 지지 탐색과 probe의1690 안내는 **검사 fixture만** 실제 새 진 상향 지지/권장1640으로 바꿨다. 구판본 테스트의 누락6revision profile은 저장소에 보존된 실제 원본을 사용했다. 구판본 폐기가 아직 profile에 persist되지 않은 전투 장부를 version4로 회수하는 것은 보존 동작이며, 이를 version3 그대로라고 기대했던 초기 fixture를 바로잡았다.

## 실패를 통과로 바꾸지 않은 항목

- `existence-damage`: 기존 unclassified S14. `existence-variety`: 과거 exact attack delta fixture. 원래 공중/근접 후보가 보존한 기준 master 실패와 같다.
- `stage2-airborne`: 새 preview 누락을 교정한 뒤 앞의 경고/기회/상한/기본 preview/import 항목은 통과하지만 **역사 clone의 plan?.flightEscape**는 기존처럼 실패. 통과로 기록하지 않는다.
- `current-runtime-contracts`: 기존 승인 해시의 shared/build.mjs 불일치. 관련 live web-split 및 통합 보존 검사는 별도 PASS.
- 원본 단독 `stage2-road-strategy`의 다른29장 동일, `stage5-positioning`의 옛182/209 HP·2장revision7 기대는 이번 명시 승인 조합과 충돌한다. 원본 검사를 무조건 완화하지 않고 통합 전용의 **다른27장/정확한 세 후보/HP 계산**으로 따로 검증했다.
- 과거 `stage5-refinement`의 하부1817→2120 직접 경로 기대는 미통합5장8f4c21fa에서도 같은 pose에서 실패한다([기준선 로그](evidence/failures/stage5-refinement-baseline.txt)). 새 두 경로/새 정상완주와 다르며 이를 새 통합 softlock으로 꾸미거나 지형을 뜯어 통과시키지 않았다.

초기 실패·교정 전후 로그는 [evidence/failures](evidence/failures), 통과 로그는 [evidence/checks](evidence/checks)에 분리했다. [WORK_LOG](WORK_LOG.md)는 진행 이력이며 위 표가 최종 상태다.

## 원본 화면/trace와 한계

- [5장 동쪽 진 모바일](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/stage5/review3-mobile-ritual.png) · [실제 다음 적 대응](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/stage5/review3-mobile-ritual-response.png) · [상부](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/stage5/review2-upper.png) / [하부](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/stage5/review2-lower.png)
- [산개](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/beasts/hound-approach-2-contact.png) · [멧돼지](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/beasts/boar-charge-2-contact.png) · [사슴](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/beasts/stag-approach-2-contact.png): 같은 폴더에 각각 원본3프레임과 trace
- [10장 카메라](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/camera/defense-mobile-03.png) · [10장 음악](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/music/stage10-mobile.png) · [축지 천장 우회](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/gate/ceiling-390-after.png)
- [11장 모바일 접점](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/stage11/focus3-mobile-contact.png) · [실제 Ctrl 하부 점프](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/stage11/keyboard-lower-jump.png) / [상부 점프](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/integration-20261021/evidence/stage11/keyboard-upper-jump.png) · [11장 migration/회귀 trace](evidence/stage11/summary.json)
- [최종 결합 계약](evidence/checks/combined-contracts.json) · [입력 trace](evidence/input/joystick-trace.json) · [실제 파일 왕복](evidence/save/browser-checks.json)

PNG는 Chromium 원본이며 합성/재압축/이미지 생성을 하지 않았다. 일부는 **390×844 viewport의 캔버스 영역만** 캡처한 원본이다. JSON gzip은 lossless이며 [MANIFEST](evidence/MANIFEST.json)에 원본 SHA256·압축물 SHA256·출처 경로가 있다. 정상 run은 앞서 기록한 소스에서 한 번씩 수행했고, 이후 좁은11장/preview/메타데이터/완료 guard 변경과 당시 소스/최종 소스의 관계는 provenance에 구분한다.

실기기 터치·Safari·모든 전술/빌드·전체 캠페인/공개 Pages는 미검증이다. 5장 회복 소모 증가와 권장 진의 적 선택 관찰 범위는 부모 난이도/화면 판단 대상으로 남긴다. 부모 최종 검수 전 master/Pages를 변경하지 않는다.
