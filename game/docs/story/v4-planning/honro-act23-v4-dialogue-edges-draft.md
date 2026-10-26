# 혼로 2·3막 v4 — 공통·분기·쉼터·엔딩 보완 초안

## 결과

원본 I–V 전체, 현재 코드 감사, 양 막 최신 본편을 대조했다. **코드·저장소·배포를 변경하지 않았으며 Gemini 검수를 수행하지 않았다.**

행별 권위본은 `honro-act23-v4-dialogue-edges-draft.json`이다. 각 행에 stable 초안 ID, category, canonical_path/oldrowId, 화자, 발동 조건, oldtext/newtext, KEEP/REPLACE/RETIRE/NEW, 이유를 포함했다. 런타임에서 아직 확인하지 못한 조건은 `needs_mapping`으로 분리했다.

- 승인 `3ad587fc`의 **firstSpirit 7행을 정확히 KEEP**했다. “흐릿하게 보입니다”, “현형부로 모습을 드러내면 그때 치세요”를 바꾸지 않는다.
- 기존에 맞는 문구는 KEEP했다. 신규 보조 대사는 **검은 공간 문답 4행 + 구판 호환용 대체 5행**뿐이다. 호환행은 신판 본선에 덧붙이는 장면이 아니다.
- **부모 최종 결정 반영:** 신판 18장은 한정 구역의 고정 탄도 편향으로 일원화한다. 기존 첫 기본 화살 소실 사건 7행·20장 회상·조건 요약 총 9항목을 fresh RETIRE했다. 신규 `requiresBellWitness`나 소실 seen은 생성하지 않는다. 옛판의 실제 목격과 원문 snapshot은 compat에 보존한다.

## 대응 범위

| 표면 | 대응 | 처리 |
|---|---:|---|
| arrivals 11–30 | 20행 | 현재 위험과 눈에 보이는 물건 중심 |
| optional 11–30 | 103행 | split 25–28의 14행은 fresh 비활성/RETIRE, 구판 보존 |
| restEndings 20·30 | 10행 | 실제 완료와 짧은 휴식만 |
| routes 13·16·30 A/B | 6행 | 위치·handoff 보존, 본편 BRANCH와 한 번만 |
| firstSpirit | 7행 | 승인 문구 KEEP |
| 묵종 소실 관측 | 7행 | 부모 결정으로 fresh RETIRE |
| 묵종 음고 | 4행 | 실제 새 의식·음고·생존 가드의 매핑 필요 |
| 검은 공간 | 기존 8 + 신규 4행 | 기존 핵심 보존, 정체·보스 연결 없음 |
| witness 연결 | 4행 + 조건 저널 2개 | 소실 관련 fresh 퇴역, 검은 공간 실제 완료만 기록 |
| 막 엔딩 20·30 | 8문단 | 표시용 서술, 대사와 별도 |
| 실패 가드 | 20행 | 대표 문구 3행 + alias 16행, 19장은 RETIRE |

총 **268개 대응 항목**: REPLACE 135 / KEEP 84 / RETIRE 40 / NEW 9.

활성 대사 후보 **151개**에는 아직 조건 매핑이 필요한 음고 등이 포함된다. **RETIRE 40개**와 표시용 중복·동적 UI·저널·실패 재사용 77개는 별도다. 이 수치는 검수·구현·실행 완료 수가 아니다.

## 해결한 주요 충돌

1. **17장 쉼터의 칠십 년 조기 공개**를 인양축 확인으로 교체했다. 시간은 멈추지 않았으며, 20장 바깥에서 주막이 사라진 지 칠십 해가 넘었다는 사실을 처음 밝힌다.
2. **19장 “종지기를 기둥에 묶어 두었다”**를 주민 통로 확인으로 교체했다. 새판 사망도 구판 제압도 소급 주장하지 않는 공통 호환 접점이다.
3. **20장 미천도 옛 혼** 분기를 제거했다. 19장 천도 후 두드림이 끝났다는 본편 결과를 존중한다.
4. **16장 기록방·열쇠, 17장 일지, 29장 현묵의 글**을 fresh에서 퇴역시켰다. evidence 자동 확보·presenter·fallback·receipt도 같은 경계를 따라야 한다.
5. **26장 학살 전원 살해 확정**을 선조 증언·현장 물증 수준으로 낮췄다. 28장 증거 뒤에만 일부 고관의 승인, 대도사의 실행, 관리·봉문군의 은폐를 구별한다.
6. **30장 기록부터 펼치는 진입**을 나루 방어로 바꿨다. 실제 배 이동·하선 완료를 구판 완료자에게 소급하지 않는다.
7. **12장 도착 전 루프 횟수 확정, 14장 첫 목소리 이전 주민 소리, 15장 고정 편향과 혼동되는 왕복 물결, 16장 추가 이름 사건**을 줄였다.

## 검은 공간 통합안

기존 “너도 답을 들으러 왔느냐”, 앞선 방문자의 짧은 암시, “너는 아직 돌아갈 길이 있구나”를 유지한다. 마지막 행 직전에만 아래 네 행을 넣는다.

> 무명 목소리: 너희 쪽에는 얼마나 지났느냐.  
> 설오: 언제부터 말씀이십니까?  
> 무명 목소리: 종은 아직 우느냐.  
> 설오: 잠운사의 종은 멎었습니다.

설오는 시작 시점을 모르므로 숫자로 답하지 않는다. 존재의 정체, 대도사·한태록 연결, 얼굴, 보상은 없다. 복귀 때 상세 문답을 담허에게 전달하지 않는다. 담허는 목소리를 듣지 못했다고 답한다.

현재 원문의 “팔을 낚아챘다”는 기존 물리 행동을 보존했다. 3막 작성자의 “멈칫함만 보았다”안과 충돌하면 부모가 하나를 고른다. 이 안과 본편 대체 7행을 이중 재생하지 않는다. 정확한 중복은 JSON `duplicate_mapping`에 있다.

## 저장 호환

- 구판 18장의 `subdued`/`cleared`는 사망 증거가 아니다. 과거 이력을 지우거나 새 death witness로 바꾸지 않는다.
- 신판 사망 증거 없이 19장에 진입하면 중립 arrival와 `optional.19.knight`를 쓴다. 본편 19·20의 사망 전제도 동일한 provenance 분기를 따라야 한다.
- 구판 30장 재생·보류 엔딩은 새 한태록 격파·진목 잔영·배 호송을 경험했다고 말하지 않는 COMPAT 대체를 사용한다.
- 변경된 20·30 엔딩과 해당 쉼터 cursor만 판본·rowId에 대응하거나 장면 처음으로 안전 재정렬한다. 전체 seen/talked·진행·보상은 지우지 않는다.

## 남은 매핑

| ID | 필요한 확인 |
|---|---|
| NM.COMPAT_PROVENANCE | 구판18 완료와 신판 사망 증거를 구분하는 실제 저장 필드·migration 판정 확정. 죽음 사실은 신판18 death proof 뒤에만. cleared18/defeat만으로 사망을 합성하지 않음. 새19/20 대사는 공통 중립 문구 또는 별도 판본 분기. 구판30 완료도 새 보스·잔영·배호송을 목격했다고 하지 않음. |
| NM.SPLIT_REST | 선택 쉼터14행은 fresh 기본재생에서 RETIRE. 기존 저장·debug 프리뷰 자료로 남기더라도 활성 검수수에 합산하지 않음. arrival는 direct interlude/seen 처리에서 정확히1회; 첫 진입/재개/실패/이전장 선택에서 확인. |
| NM.BELL_ANOMALY | 신판 anomaly 7행·20회상·조건요약 모두 fresh RETIRE. requiresBellWitness/소실 seen을 새로 만들지 않음. 편향을 소실 witness로 기록하지 않음. legacy의 실제 관측 원문과 snapshot은 compat에 보존. 기존 author의 소실 opt-in이 신판에 역류하지 않게 확인. |
| NM.PITCH | 신판18 의식/죽음 흐름에 살아 있는 실제 음고 상승을 매핑. 원고 때문에 의식횟수·무적단계 추가 금지. 새 ritual이 없으면 fresh RETIRE. 사망·전투종료 pending 폐기. |
| NM.BELL_MOTION | 실제 이동phase·쓸림면·안전영역·점유·다음목표 확정 후 경고별 source를 바인딩. 허용범위 밖 이동/종 아래 생존자/미확인 사망에 성공문을 붙이지 않음. 4라운드/clear-wards/retaliation 등 구 source가 fresh로 역류하지 않게 구분. BELL.WARNING/SETTLED의 KEEP는 compat 전용이며 fresh 기본 비활성. NM.MOTION_TEXT_LEGACY_ONLY 참조. |
| NM.FERRY_ACTOR | 실제 연실/배/승선 주민/도착 상태를 확정한 뒤 마지막 배 출항 문구를 소비. 기존 정착배는 별도 지형이면 기술경고 KEEP; 같은 배로 바꾸면 source별 문구도 함께 대체. 구판완료자 fallback 적용. FERRY.WARNING/SETTLED의 KEEP는 기존 정적 장치 compat 전용이며 연실 이동배로 연결하지 않음. fresh는 기본 비활성. |
| NM.JOURNAL_OWNERS | 아래 owner_summary_map의 합의 원문을 중앙 storySummary와 실제 event별 journal에 대응. 한 장 여러 journal을 한 storySummary로 합칠 때 판정시점 앞당기지 않음. |
| NM.EVIDENCE_RETIRE | 16/17/29 퇴역 evidence ID를 fresh필수에서 제외.23/25/26/27는 현장물증+구조에 재매핑하고 구 cargo completion이 새 목격/잔영 완료로 승격하지 않음. 기존 legacy 데이터는 보존. |
| NM.VOID_OWNER_MERGE | 중복 묶음은 둘 다 실행하지 않음. 기존 무명질문·답변/복귀, 시간·종 질문, 담허 비청취를 한 장면으로 통합. 신분/대도사/한태록 인과 확정 금지. witness는 실제복귀완료 뒤에만; 중단복구 READY에서는 아직 미목격. |
| NM.ROW_CURSOR | 변경된20/30 엔딩·해당쉼터 cursor만 판본/rowId 대응 또는 안전시작 재정렬. all seen/talked 삭제 금지. 기존 rowId/direction/revealName/portrait/afterAction/witness는 텍스트 교체와 함께 확인. |
| NM.SPEAKER_GUARDS | 화자·청자가 실제 출연/생존할 때만. 19장 NPC역할 전환을 profile unrecruit로 오해하지 않음. split 지상팀에 설오 개인 조우 지식 부여 금지. |
| NM.RETIRED_BEATS | 메인 작성자 migration map에서 beat별 KEEP/REPLACE/RETIRE 명시. old beats를 canonical overlay 누락으로 부활시키지 않음. RETIRE는 적용대사/검수통과행 수에 합산하지 않음. |
| NM.MAGE_ABSENT_12 | 신판 본편은 담허가 진목조정하므로실제로 가까이 있을때만.직접오게할지 기존 원격설명대체를살릴지 확정. 새 텍스트에 old string 검사 의존하지않음; 본편대사 추가 재작성은담당자에위임. |
| NM.FAILURE_SPEAKER | 각 행에 지정된 실제 화자(25/27은 담허, 나머지는 휘겸)가 출연·생존할 때만 발화. 사망/부재/전멸이면 owner 실패 UI만. 문구는 failure_review_groups 대표별1회 검수; alias는 발동가드만 별도 확인. |
| NM.PLACE_STAGEID | stageId로조회해수정.빈restDescription(예:12)은새로채워중복발화하지않음.필요한 arrival만사용. |
| NM.MOTION_TEXT_LEGACY_ONLY | 새18 부분인양/재안착과 새30 연실 이동배의 ID·상태가 확정되기 전 4개 old callsite 문구를 fresh에서 발화하지 않음. 정적 배 지형이 별도 유지되어도 이동배와 구분되는 실제 장치 ID 및 호출 상태를 확인한 뒤에만 해당 정적 장치에 적용. 같은 source 이름이나 status settled만으로 완료를 공유하지 않음. |

## 본편과 중복을 피하는 인계

- story/outro/beats를 전면 재작성하지 않았다. 18장 음고와 20·28·29장 witness 경계만 기존 rowId로 대응했다.
- 2막 BRANCH 13·16, 3막 ROUTE_A/B 30, REST 묶음, 27장 VOID/RETURN은 `duplicate_mapping` 36묶음에서 대응한다. 둘 다 붙이지 않는다.
- `A3.S30.ENDING.01~03`은 현장 outro 후보다. actEndings나 쉼터에서 같은 세 행을 다시 말시키지 않는다.
- 양 막 저널은 `owner_summary_map`에 원작성자 ID·원문·발동 조건을 연결했다. 보완 원고의 새 독립 버전으로 중복 검수하지 않는다.

## 자체 확인 범위

JSON 파싱, ID 유일성, 필수 필드, KEEP 원문 동일, RETIRE의 `newtext=null`, firstSpirit 7행 전부 KEEP, arrivals 20/optional 103/restEndings 10/routes 6 전수 대응 수를 확인했다. 1막과 4–6막 구현, frozen 구판 원본은 건드리지 않았다. 실제 런타임 재생·세이브 이관·브라우저·Gemini 검수는 수행하지 않았다.

## 부모 최종 점검 반영 — 파일 고정

- `BELL.WARNING/SETTLED`와 `FERRY.WARNING/SETTLED`의 KEEP는 **기존 장치의 compat 원문 보존만** 뜻한다. 신판에서는 기본 비활성이다. 각 JSON 행의 `verified_old_contract`에 실제 goal ID·config·source·status 전환·callsite를 기록했다.
- 기존 `bell-descent`의 `warning` 및 `bell-settled`는 +200 하강·옛 통로 개방 계약이다. 신판 부분 인양/재안착에 그대로 연결하지 않는다.
- 기존 `ferry-hold`의 `warned` 및 `ferry-settled`는 정적 배 지형을 여울로 내리는 계약이다. 연실 이동배의 승선·출항·하선 완료가 아니다. 신판에 정적 장치를 별도 유지하려면 이동배와 다른 실제 ID·호출 상태를 먼저 확인해야 한다.
- 25·27장 실패 대사를 담허의 **“이대로는 더 버티기 어렵네. 온 길로 물러나세.”**로 교체했다. 단서를 수장한다는 문서 릴레이 표현과 모든 실패를 발판 탓으로 돌리는 단정을 없앴다.
- 실패 20표면은 **19장 RETIRE 1 + 대표 3문구 + alias 16행**이다. `failure_review_groups`의 대표만 문구 검수하며, 각 alias의 화자 생존·출연·실패 가드는 별도 확인한다. 25·27의 화자 가드는 휘겸이 아니라 실제 화자인 담허다.
- 이 최종 보완 외 범위는 늘리지 않았다. 코드·실행·Gemini 검수 없이 초안 파일을 고정했다.
