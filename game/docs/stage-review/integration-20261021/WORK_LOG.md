# 2026-10-21 통합 검수 진행 기록

지정 후보 원본 소스만 별도 integration/reviewed-candidates-20261021에 병합한다. master/Pages는 변경하지 않는다. 정확한 후보 tip은 sources.json이다. 11/12장 및 엔딩 후보는 제외한다.

카메라 후보는 지시의 "이미 bafc275c 포함"과 실제 Git 조상이 달랐다. 0573cac0는 bafc275c 이후 merge를 포함한 별도 후보여서 승인된 소스 차이를 명시적으로 병합했다.

원본 병합 단위: 372b310c(2장),2441029f(카메라/음악),59ccde29(담허/축지),31be375f(공중/근접),fd254f6f(5장). 각 단위마다 원격 push했다. 후보별 생성 HTML/web/hash는 버리고 기준 master 생성물을 유지한 뒤 통합 소스에서 공통 빌드를 다시 실행했다. Engine.face+gateResolution, gateSource+migrateBeastSkills/접지 import, Engine.fire/tick의 신규 근접 hook과 기존 도술, flightRegion과 일반 짐승 AI 분기를 모두 보존했다. campaign JSON은 stage2와 stage5만 교체하고 revision2=8/revision5=3을 결합했다.

통합 타입검사에서 점선 Prediction에 secondaryRadius가 없는 경우의 TS2339를 발견해 속성 존재 guard를 추가했다. 렌더 출력/범위를 바꾸지 않는 타입 안전 수정이며 이후 typecheck 통과.

초기 관련 native 검사에서 입력/충전/S13/AP01/담허 피해·범위·SP/축지/공중·근접/넉백/대기비행/23장 저장/형방어 저장/카메라프레임/음악/web-split이 통과했다. stage2-road의 다른29장 보존은 승인된5장 변경 때문에, stage5-positioning의 옛HP/2장revision은 승인된 공중HP/2장 변경 때문에 실패했다. 통합 allowlist와 계산을 별도 검사할 예정이다. 기존 stage5-refinement의 과거 단순 도보 경로 기대도 실패했고, stage2-layered-save는 이전6revision 파일 부재라 아직 완료 아님이다. 이런 실패를 통과로 표시하지 않는다.

최신 통합으로 새2장 정상 브라우저 호송1회를 실행해 R16 승리·상여1700·설오376·유한 적0·이벤트5·출구4100을 확인했다. 원래 후보의 R15 승리를 새 증거로 재사용하지 않았다.5장 fresh 정상 App 입력 run과 짧은 정상 checkpoint/두 사선·근접 응답, 합성 브라우저 입력/카메라/음악20전환/게이트 및 저장 보정 순서 검수는 진행 중이다. 현재 기록은 부모 최종 검수용 PASS 보고서가 아니다.

후속 확인:5장 새 정상 실행은 R9 승리(18체 중17체 생존, 주박목 정상 파괴, 강제 제거0)이며 보통 난이도 유한 회복 아이템1개를 사용했다. 이전 후보 R8/회복0과 다른 실제 결과다. 짧은 fresh 비교에서는 상부/하부 각각 일반 이동/점프 후 실탄67/63, 진 서쪽 M11 1회 반사64, 동쪽 M03 실제100을 확인했다. 양쪽 진 active 유지. 실제 준비 근접 브라우저·gate28항목·camera28화면·music20전환·입력대표19항목도 통과했다.

통합 전용 검사 `reviewed-integration-20261021.mjs`가 다른28장/라이브러리 및 지정2장/5장 원본 동일성, 두 author 멱등,5난이도 공중HP의 난이도→종→HP60 rounding, 성장예산/각성/상한/5장금지marker, 실제 이전R2 저장의 SP/air/map6순열×3반복과 전체profile 동일성, HP비율과 App2회 export/import 불변을 통과했다. 구전투 폐기 시 아직 profile에 persist되지 않은 전투장부를 version4로 승격·보존하는 기존 동작은 정상이며, 초기 검사 fixture의 "profile version3도 그대로" 기대를 바로잡았다. 생산 마이그레이션을 바꾸지 않았다.

축지 브라우저의 옛 진 중심 높이±5 support 탐색은 새5장 봉우리에서 null이었다. 테스트 fixture만 실제 진 위100px까지 상향 지지를 찾게 바꿨으며 resolver/물리/금지구역은 바꾸지 않았다. 경로 probe의 옛1690 안내도 현재 authored ritualEast=1640을 읽도록 수정했다. 이전6판본 입력 파일은 저장소의 보존 원본으로 제공해2장 저장검사도 통과했다.

추가 부모 승인으로11장 lower-route 후보도 이어 통합한다.12장 및 이미지 미연결 엔딩은 계속 제외한다. 이 단위까지의2/5장 정상완주를 반복할 계획은 없다.

11장 추가 통합: 원본8d786a91a05c13647f001d5f47d1d72163dee83d를9292a135로 병합했다. 2=8/5=3/11=1을 보존했고 캠페인 source는 지정2/5/11장만 바뀌어 다른27장과 Library가 정확히 동일하다. 새 통합의 실제 explorer 실패저장 두 경우에서 기본점프2회로 각각R59→62/R61→64 복귀, HP692/기력247/적37 유지. 옛 기력245→247과 공중HP/적기술 HBR→HBM은 생산 SP/적 이전의 결과이며 별도migrationChanges에 남겼다. 테스트전용 새뿌리 geometry adapter를 사용한 사실과 일반 Continue의 구판본 재시작을 구분한다. 브라우저4프레임·실제 키보드2접점도 통과했다.

추가 발견과 해결:
- 새2장 배치가 옛3370/1010 좌표 author 판정에서 빠져 기본 Stage View/Playtest가 경고 정책 opt-in을 잃었다. 명시된 승인 전략지형 revision2/flightRegion/shelf-roost의 opt-in만 추가했다. 캠페인의 기존 정책·자원·배치는 바꾸지 않았다. 기본 preview/campaign 동일 배우, 무판본 import 제외, 실제 Workshop iframe의 active=true/cap3/initial12/새flightRegion/Engine.face를 확인했다. 기존 stage2-airborne 검사는 이 새 실패를 해소한 뒤 원래의 역사 clone flightEscape 실패로 돌아왔으며 통과로 기록하지 않는다.
- 실제 Playtest는 기존 geology:granite-ledge-neck의 physical scaleRange .65–1와 backgroundRange .85–1.1 불일치로 검증 단계에서 막혔다. 변경 전bafc의 builder도 같은 메타데이터였다. backgroundRange를 기존 physical 범위 안으로만 자르는 공통 builder 교정을 했고(.85–1), 형상·배치·충돌·이미지는 동일하다. 환경 validator는 완화하지 않았다. 실제 Workshop2장 진입을 다시 확인했다.
- 최종 통합 전용 검사는11장까지 SP/air/map6순열×3반복에서 전체profile/보상장부가 같음을 확인했다. 구판본 폐기 시 아직persist되지 않은 최신 전투장부 version4가 profile에 회수되는 것은 보존 동작이다.

실제 두 정상 승리 profile의 완료 처리 반복/내보내기/가져오기에서 기존 `outcome()`의 done guard가 outro 시작 뒤에 있어, 완료 상태에서 반복 호출하면 outro가 다시 열리고 terminal battle이 profile에 재저장되는 것을 발견했다. 다음 import에서 XP는 추가되지 않아도 cleared.visits가 증가할 수 있었다. guard를 outro보다 먼저 두는 좁은 수정 후2장/5장 실제 승리 profile의2회 반복 결과/전체 XP·SP·장착·장부·방문 수와 terminal save 부재를 확인했다. 새 전투를 강제로 승리 처리하거나 결과 수치를 보정하지 않았다.
