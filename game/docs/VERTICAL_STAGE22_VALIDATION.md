# 수직22 현재 검증 경계

2026-10-10.14는 기존 후보가 공개되어 있고 새22는 작업 브랜치 검토 중이다. 이 문서는 통과한 작은 계약과 열린 품질 문제를 구분한다.

## 현재 소스 계약

`stage22-vertical-source-boundary.mjs`의 불변 기준은 최신14 목표 수/완료 이력 수정 `72cc20e9711df726aa8a01a03b5f9156fd62bb50`다. 해당 기준의 다른29장(14포함),기존608라이브러리 자산·순서,전역 project,128production 원본을 비교한다. 원래22의5목표/초기목표상태/파티 비배치 속성/유한 이벤트 trigger·종류·수·source를 보존한다. 허용 source delta는 shared/build의22등록 하나와 art-dark의 정확한 새22 현재면 opt-in뿐이며20부정변이를 직접 거부했다. 신규22 전용 runtime의 동작은 아래 계약이 따로 검사한다. 독립 검수에서 재저작이 raw canonical의 손상을 가릴 수 있는 구멍을 찾았으므로, 현재 원본 JSON의 encounter revision/cap/초기26·정예6/activation/entry 목록을 먼저 직접 검사한다. composition은 원본의 실제 gameplay 필드와 저작 결과를 exact 대조하며 적 좌표·activation 반경·증원 좌표 손상도 부정변이로 거부한다. 미술 elements/design만 이 gameplay 대조 범위 밖이고 별도 미술 불변 검사가 담당한다.

역사14 소스 경계 명령과 기존 golden fixture는 변경하지 않았다. 현재22가 활성화되면 과거14-only 전체 소스 경계가 실패하는 것이 맞다. `test:vertical-current:contracts`는 현재22 경계와 기존14 행동6개,22 composition/runtime/App/art-dispatch/actor-local 계약을 실행한다. `test:integration` 및 offline 목록은 이 현재 묶음을 사용하며, 원래 `test:stage14-vertical:contracts`는 역사14 범위 명령으로 남는다.22 traversal/fullplay/native와14의 장기 플레이·렌더는 별도 명시적 실행이며 fast aggregate에 숨겨 반복하지 않는다.

새 환경 직접 실행: wiring PASS; 현재14+22 작은 계약 PASS; 기존8장 encounter-density 계약7개 PASS. 현재22에는 미술 자산이 아직 canonical 미통합이므로 새 자산 허용 목록은 빈 배열이다. 최종 통합 시 검토된 정확 ID만 별도 변경 단위로 허용해야 한다.

## 실제 이동·저장·교전

- 기본 점프/몸 높이/낙하/회귀: 새84 traversal 결과와8개 gate/휘겸 필수 연결 통과. 정상 플레이가 모든 선택 경로를 사용했다는 뜻은 아니다.
- App 계약: 옛22·다른장·custom 비활성, warning→실제행동기회→원자 유한진입·점유 대기/대체점·죽음취소·구형/현행 Continue 등의22시나리오60왕복 통과.
- 새002 R29,새003 R28 정상자원 승리·전원생존·원래23 연결 통과. 실제 UI 방어 회복을 사용했으며 처음21장을 플레이한 연속 캠페인 증거가 아니라 합법적 진입 보상원장의 개별장 관측이다. 상세와 원본은 [정상자원 검수](VERTICAL_STAGE22_FULLPLAY.md).
-002 R25 먼 E층의 무발사2슬롯은 배우별 현지 자격 수정 후003에서 재발하지 않았다. 그러나 E3/E4 무행동·미확인 근접역할과 D R7 세 무발사 슬롯은 열린 배치/교전 품질 관측이다. 완주만으로 완료하지 않는다.

## 미술·생성물·배포

F는 직교한옥동 뒤로 연속 경사 통행로를 분리하고 사람보다 낮은 수평 석축 코스로 마감한 방향을 검토 후보로 받았다. 반복감/과도하게 긴 기단은 알려진 한계이며 E/G 최소 연결과 전체줌 검토가 남았다. 현지 Native Canvas 실제 Scene 캡처는 브라우저나 Pages 화면이 아니다.

양 HTML은 공통 build만 사용한다. 새22 gameplay 후보의 build는 생성했지만 최종 미술 통합·정상/독립/전체 검수는 남았다. 현재 전체 `npm run verify` PASS를 주장하지 않는다. 최신14에서 직접 실행한 verify는 역사 project hash에서 중단되어 뒤 단계가 미도달이었다. 새22 최종 후보에서도 결과/미도달을 그대로 기록하고 golden을 덮지 않는다.

원격 master/14수정/22archive는 게시 담당의 실제 ref 검증으로만 갱신했다고 표시한다. 현재 API 쓰기 지연/미확정 때문에 source-only checkpoint와 완전 Git Library 복구 bundle을 분리 보존 중이다. source-only checkpoint는 generated HTML/campaign을 제외한 복구자료라 실행/배포 후보나 원본 exact tree가 아니다. Library의 증분 bundle은 공개 선행 두 commit이 필요하며 별도 clone에서 실제 복원 head/tree를 검증했다. 부모가 최종 반영 및 실제 Pages 확인을 이어간다.
