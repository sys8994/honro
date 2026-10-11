# 2·3막 퀘스트·대사 개편 검수표

승인 범위: 11–30장 통합 서사안과 12→13,15→16,29→30 멀티패스안.
이 문서의 ‘저작’은 소스 반영을 뜻한다. 실제 브라우저에서 정상 자원으로 완주한 증거와 구별한다.

## 장별 저작 추적

| 장 | 승인된 변경과 보존 | 확인할 구현 위치 |
|---|---|---|
| 11 | 소단의 명시적 동행 수락은 앞 장에서 받고 이후 발언은 실제 본 일에 한정 | act2-drama, journey-content; 10장은 1막 담당 |
| 12 | 길표 발견 뒤 높은 작업굴 5체 국소 제압 OR 열린 내리막. 전체 소탕/4턴 제거. 짚신과 유한 경고 압박 보존 | act2-plan, map author route spec, story-direction; 공통 런타임 별도 |
| 13 | 같은 석공/빙의혼/문 증언, 구조→문 개방→이탈. 5턴/전체 소탕 제거. 두 진입과 같은 곡괭이 명단 재배치 | act2-drama, act2-plan, entry variants |
| 14 | 중층 주민/길찬 화자 구별, 손목 줄을 함부로 절단하지 않는 설명. 기존 고도·구조 군집 유지 | act2-drama, VerticalStage14Content snapshot |
| 15 | 수문 optional. 배수로 드러나는 실제 낮은 바닥 OR 무배수 고지. 마른 공통 관찰점의 오래된 쇠고리와 새 정 자국/손잡이 | map author, act2-plan, story-act23-art, CaveHangingClue |
| 16 | 구조→주변 네 위협 해결→그 자리에서 증언·열쇠→기록함. 원거리 NPC 대사/5턴 제거 | act2-drama witness/hall, act2-plan, map markers |
| 17 | 승려의 증언과 직접 축 관찰을 구별. 발견 전 녹/기름칠 단정 제거. 작업일지 3줄 | act2-drama, journey-content 17 source/interlude/optional |
| 18 | 실제 act2-keeper 대상. 종/사슬/붙은 혼 분리 장면 유지. 다음 장 가족을 부르는 연결 | story-direction, act2-drama |
| 19 | 같은 종 앞의 짧은 비전투 장례. 가족 둘 별도 actor/화자, 미상 혼을 창작 이름으로 메우지 않음. 세 분리/배웅 쌍 자유 순서, 3+3+4턴 제거 | act2-plan, map author quiet funeral, art |
| 20 | 출구 전은 ‘나갈 준비’. 길찬/석공 별도 시각 인물. 기존 보호 행렬과 실패 계약 유지 | journey-content, act2-drama, convoy member metadata; 시각 추종은 공통 |
| 21 | 살아 있는 주민과 이미 죽은 병사의 몸을 첫 병사 전투 전에 구별 | act3-content gate-resident, 공통 트리거 |
| 22 | 사건 보고와 호적을 짧게 직접 비교. 농가 호적만으로 저항 부재를 확정하지 않음 | act3-content, paired-records art |
| 23 | 실제 운반/호위 유지. 표찰 2줄과 생활 물품, 다음 장과 같은 문장 형상 | act3-content, cargo-tag art |
| 24 | 묘역/공방/물길/뒤뜰 약도 뒤 팀 분리. 선택 휴식이 청원 내용을 미리 알지 않음 | act3-content, act3-journey, folded-plan art |
| 25 | 이름표·살림의 같은 번호를 비교. 추가 숫자/인명/종틀 발명 없음 | act3-content, family-tags art |
| 26 | 대도사의 역할 소개, 조사문서 2줄. 수거량과 주조량은 ‘거의 같은 양’, 유골 용도 미상 유지 | act3-content, investigation/amounts art |
| 27 | 전체 가족명세 대신 세 칸과 맞는 표찰 한 곳. 옛 화재 카운트 안내 제거 | act3-content, objective-revision, family-manifest art |
| 28 | 합류에서 양 팀의 학살/금속량/미상 유골 정보를 실제 공유. 승인/살해/은폐 구별. 실제 12번째 적 턴 UI와 일치 | act3-content, shared-evidence/책임별 문서 art; fire clock 공통 |
| 29 | 봉인 2턴은 유지, 두 번째 퇴로 2턴은 제거. 글 3줄 뒤 높은 수문길 OR 실제 점검다리, 현묵 현상 미상 | act3-content, map route spec, signed-letter art |
| 30 | 같은 3체 초기 접촉 명단을 두 진입에서 재배치. 기록 위치도 진입 곁. 기존 나루 3턴/경고/행동 기회/안전 침몰/생존자 전원 집결 유지 | entry variants, act3-content, transport-map art; FerrySpec 그대로 |

## 공통·분기 계약의 책임 경계

- 맵 저작은 authorAct23QuestRedesign(project)가 담당한다. 12/14 전용 본문 override도 같은 신본문으로 갱신한다. 반복 실행은 멱등이다.
- OR 판정, 선택의 원자적 저장/인계, old-save snapshot, any-alive 도착, NPC 보호/직업 실패, XP 상한은 공통 런타임 통합 검수 대상이다.
- 12A는 sq-g1…sq-g5만 요구한다. 12B에 G 소탕 조건이 없다. 입구 경비의 추격 범위는 honroRouteGuard로 저작한다.
- 15A는 sluice 완료와 fc15-drained-ledge의 실제 활성까지 필요하다. B는 sluice를 전혀 요구하지 않으며 초기 broken 상태를 유지한 채 통과한다.
- 13/16/30 변주에서는 초기 적의 ID/종류/정예/HP/총원을 바꾸지 않는다. 19장만 승인된 비전투 예외다.
- 출구 선택 때문에 보호 NPC를 추가하거나, 12/15/29에 생존 전원 도착을 요구하지 않는다. 30장의 기존 allHeroes만 남긴다.
- story-act23-art는 읽기 전용 world pass다. 문서 획득 클릭/목표/게임 시계/피해/파동을 추가하지 않는다. 팀 공유 그림은 28장 합류 후에만 나타난다.

## 검사와 남은 수락 증거

- [x] 정적 본문/지식 순서/문서 1–3줄: tests/act23-narrative-redesign.mjs
- [x] 맵 author 멱등성, 1막 보존, 초기 적 보존, 서로 다른 두 출구, 장례/침몰 spec: tests/act23-quest-redesign-author.mjs
- [x] 실제 marker에 묶인 미술, 게임 상태 비변경, 합류 전 공유 그림 없음: tests/act23-evidence-art.mjs
- [x] 17/19 interlude source와 실제 본문의 일치: tests/journey-content.mjs. tests/natural-dialogue의 해당 두 기대값만 새 인과로 갱신.
- [x] 별도 실제 물리 probe: 13/16/30 전체 배우 유지한 24개 진입 좌표가 sanitize 전후 동일. 19장 배우도 동일.
- [x] 별도 실제 물리 probe: 15 A/B × 네 직업의 보행/기본 도약 피해 0. 적 제거·이동 자원 보충을 사용한 **기하 검사**이며 전투 난이도 증거가 아니다.
- [ ] 통합 최종 source hash로 tests/act23-route-geometry.mjs 전체 재실행(15/29 네 직업, exact entries).
- [ ] 12/15/29 각 C+A/C+B/공통 전 미완료/동시 도착/경로 변경을 실제 공통 판정으로 확인.
- [ ] 분기 직전 저장, 승리 후 재개, 다음 장 재시작, 앞 장 재플레이, 구저장 유지 확인.
- [ ] Game/Workshop 실제 화면에서 두 출구 프레이밍, 지지면 활성, 단서/화자/카메라와 읽기 크기 확인.
- [ ] 정상 자원 전투로 양 경로의 행동 수·피해·사선·차폐를 확인하고 30장 침몰을 양 진입에서 재검증.

기하 검사 실패를 거리 허용 확대나 지형 접촉 검사 제거로 통과시키지 않았다. 15장 아치 하부 머리 공간, 고지 하강 경사, 겹치는 진입 배우를 실제 소스에서 수정했다.
