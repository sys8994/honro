# 수직22 현재 검증 경계

2026-10-10.14는 기존 후보가 공개되어 있고 새22는 작업 브랜치 검토 중이다. 이 문서는 통과한 작은 계약과 열린 품질 문제를 구분한다.

## 현재 소스 계약

`stage22-vertical-source-boundary.mjs`의 불변 기준은 최신14 목표 수/완료 이력 수정 `72cc20e9711df726aa8a01a03b5f9156fd62bb50`다. 해당 기준의 다른29장(14포함),기존608라이브러리 자산·순서,전역 project,128production 원본을 비교한다. 원래22의5목표/초기목표상태/파티 비배치 속성/유한 이벤트 trigger·종류·수·source를 보존한다. 허용 source delta는 shared/build의22등록 하나와 art-dark의 정확한 새22 현재면 opt-in뿐이며20부정변이를 직접 거부했다. 신규22 전용 runtime의 동작은 아래 계약이 따로 검사한다. 독립 검수에서 재저작이 raw canonical의 손상을 가릴 수 있는 구멍을 찾았으므로, 현재 원본 JSON의 encounter revision/cap/초기26·정예6/activation/entry 목록을 먼저 직접 검사한다. composition은 원본의 실제 gameplay 필드와 저작 결과를 exact 대조하며 적 좌표·activation 반경·증원 좌표 손상도 부정변이로 거부한다. 미술 elements/design만 이 gameplay 대조 범위 밖이고 별도 미술 불변 검사가 담당한다.

역사14 소스 경계 명령과 기존 golden fixture는 변경하지 않았다. 현재22가 활성화되면 과거14-only 전체 소스 경계가 실패하는 것이 맞다. `test:vertical-current:contracts`는 현재22 경계와 기존14 행동6개,22 composition/runtime/App/art-dispatch/actor-local/전체재생성 계약을 실행한다. `test:integration` 및 offline 목록은 이 현재 묶음을 사용하며, 원래 `test:stage14-vertical:contracts`는 역사14 범위 명령으로 남는다.22 traversal/fullplay/native와14의 장기 플레이·렌더는 별도 명시적 실행이며 fast aggregate에 숨겨 반복하지 않는다.

새 환경 직접 실행: wiring PASS; 현재14+22 작은 계약 PASS; 기존8장 encounter-density 계약7개 PASS. iteration6 미술을 canonical에 통합하면서 정확23개 새 자산ID만 명시적으로 허용했다. 기존608자산과 다른29장은 exact다. 전체재생성 검사는 raw canonical 전체를 gameplay+art 저작 결과와 대조하며 새 자산SVG/배치/지형페인트/적좌표의 손상을 거부한다.

## 실제 이동·저장·교전

- 기본 점프/몸 높이/낙하/회귀: 새84 traversal 결과와8개 gate/휘겸 필수 연결 통과. 정상 플레이가 모든 선택 경로를 사용했다는 뜻은 아니다.
- App 계약: 옛22·다른장·custom 비활성, warning→실제행동기회→원자 유한진입·점유 대기/대체점·죽음취소·구형/현행 Continue 등의22시나리오60왕복 통과.
- 새002 R29,새003 R28 정상자원 승리·전원생존·원래23 연결 통과. 실제 UI 방어 회복을 사용했으며 처음21장을 플레이한 연속 캠페인 증거가 아니라 합법적 진입 보상원장의 개별장 관측이다. 상세와 원본은 [정상자원 검수](VERTICAL_STAGE22_FULLPLAY.md).
-002 R25 먼 E층의 무발사2슬롯은 배우별 현지 자격 수정 후003에서 재발하지 않았다. 003 주경로에서 E3/E4 무행동은 사실이다. 별도 기본 FE 귀환+조건부R20 한 적팀 검사에서는 기존3슬롯이 E3/E4를 선택하고 실제 LS09 피해20/35를 확인했으므로 선택귀환 수비 역할을 유지한다. 정상분기완주나 접촉근접타격 증거는 아니다. D R7 세 무발사 슬롯은 초기 교전 효율 한계로 남기며 이후R13/14실효사격과 구분한다.

## 미술·생성물·배포

F는 직교한옥동 뒤로 연속 경사 통행로를 분리하고 사람보다 낮은 수평 석축 코스로 마감한 방향을 검토 후보로 받았다. 반복감/과도하게 긴 기단은 알려진 한계다. E/G도 같은 수평 석축으로 최소 연결했고 전체줌의 자료를 부모 검수에 전달했다. 전체/상승/보고접점/대조당의 같은카메라 전후8컷을 새로 촬영했고 실제16개 gameplay필드·배우·지형과608원래자산 불변을 확인했다. 현지 Native Canvas 실제 Scene 캡처는 브라우저나 Pages 화면이 아니다.

양 HTML은 공통 build만 사용한다. 새22 iteration6 미술 통합 후보의 공통 build를 생성했다. 정상003과의 차이는 미술이며 실제16개gameplay필드는 exact다. E의 조건부 선택귀환 압박은 확인했지만 정상분기 전체완주는 미검증이며, 실제 브라우저/성능/Pages와 전체 aggregate 검수는 남았다. 현재 전체 `npm run verify` PASS를 주장하지 않는다. 새22 미술통합후보에서 직접 실행한 verify는 build/typecheck 뒤 rc20-map-audit→stage12-redesign 역사 project hash에서 중단됐다. actual d369e6f0acc142a212a0fa9cb0567646f205618d5acc9abee557fc780a89a54b, expected4e6862fce73a458b6ca04566d898fb0531822a95934059eb981585eaf2469722다. 뒤 integration/performance와 기존 village-cavern floor-main 검사는 미도달이다. golden을 덮지 않았다.

원격 master/14수정/22archive는 게시 담당의 실제 ref 검증으로만 갱신했다고 표시한다. 현재 API 쓰기 지연/미확정 때문에 source-only checkpoint와 완전 Git Library 복구 bundle을 분리 보존 중이다. source-only checkpoint는 generated HTML/campaign을 제외한 복구자료라 실행/배포 후보나 원본 exact tree가 아니다. Library의 증분 bundle은 공개 선행 두 commit이 필요하며 별도 clone에서 실제 복원 head/tree를 검증했다. 부모가 최종 반영 및 실제 Pages 확인을 이어간다.


## 동결 인수인계와 원격 대기

미술 통합 production 후보는 `efbfbf0b245bf2b61c0de347cb0599618a5af113` / tree `49ba6a3cee2296ae47f17fa8fef23d49c277a783`다. 후속 `2790e77b2f67e5130bb1123397bebb6d186ef969`은 조건부 귀환 테스트/문서만 추가했다. 다른28장을 두 장 개편 이전 안정판 `eba695acee00ae8c23a4951e82dd85956d0d9928`과도 직접 비교해28장·586원래asset·project전역 exact를 확인했다. 최종asset631은586원본+14추가22+22추가23이다.

공개 master는 `ca0bddc6269ceed2f0b49d721c3a983eb685c5ca`, 원래22archive는 `62ed8e8cf8bd4724674dbc51576554f14026220d`다.14표시수정 source branch는 `880f67b51f45e7db664a79daa4107fd79ba05e67`까지만 확인됐다. 최신22의 별도 source-only 복구는 `e7a48b84aa0988e0c9f7465dfa2a5308390adb03`까지이며 local fe1f9e2의 작은소스에 대응할 뿐 전체tree동일 후보가 아니다. 뒤 create_tree가 명시적으로 취소되어 같은원격행동/다른경로 재시도를 보류하고 사용자 재개응답을 기다린다. 로컬 전체Git/원자료와 이미 승인된 Library 버전백업은 유지한다.

최종 관측 packet은 `_local/reports/vertical-stages/stage22-candidate-review-20261010T0512Z/`, 독립 읽기검토는 `_local/reports/vertical-stages/stage22-independent-review-20261010T0515Z.json`에 기록한다. gate의 증거 형식/미충족 목록은 현재 JSON 결과를 기준으로 읽고, 그것을 재미·브라우저·사용자 최종 미술승인이나 배포성공으로 바꾸어 해석하지 않는다. 재개 후 이정확후보의 master/Pages 및공개바이트/실제Game·Workshop·저장·표시·화면을검수해야한다.
