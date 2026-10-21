# 2장 전략 지형 복원 후보

런타임 기준은 **499305b051278e25538b3f606c11e1bb7479104e**, 브랜치는 `stage/act1-ch02-road-strategy`다. 부모 화면 검수 전 master/Pages에는 반영하지 않는다. 이후 master `bafc275c10c7a256692425641d7f0e4f69c002ca`의 P0 조이스틱(Engine.face 및 runtime/TS main 입력)을 보존해 통합하고 원본에서 재빌드해야 한다. 이번 검증에는 그 후속 입력 변경을 포함하지 않았다.

기존 승인 범위를 다시 평가했다. 앞길/뒤 절벽 분리와 암턱 접합만 확인하고 수평 도로·물 삭제·긴 가지의 역할 손실을 놓친 것은 전략 지형 완료로 볼 수 없다. 원본 ee73add5의 `stage02-positioning/evidence/review1/stage02-overview.png`를 직접 열었고, ee73add5와 직전 배포 27efe8eb의 실제 체크아웃을 로컬로 실행해 **동일한 카메라**로 비교 캡처했다. 원본 참고 이미지의 과거 진단 fit 줌과 혼동하지 않도록 새 비교 전체도는 둘 다 현행 최소 줌 .2117647059, x2150/y1650이다. 일반도는 x1000/y800/.65다. 출처 SHA/URL은 각 capture.json에 있다.

| 요소 | 직전 배포 | 이번 후보와 확인 범위 |
|---|---|---|
| 앞 호위로 | y2860 수평 사각형, 물 없음 | 원래 canonical recipe의 둔덕·분지·동쪽 경사를 평활 연결. 실제 conductive 얕은 물 최대35, 양쪽 물가가 지면과 접합. 상여 x180→4100 유지 |
| 왼쪽 사격 위치 | 짧은 하강 발판 위주 | 서로 다른 높이/곡률의 긴 가지 두 개, 나무·중간 암반·하강/합류 복원. 기존 공통 rooted-pine·pine-wall-root·granite 모듈 사용 |
| 오른쪽 | 반복 하강턱, 하부 턱 접근 불가 | 가지 길이/방향과 비대칭 윤곽 복원. 한 개의 짧은 비스듬한 뿌리로 하부 뒤 암턱을 선택 접근: 실제 점프2/무피해 이동/대공 화살 명중 |
| 절벽 | 두꺼운 공통 덩어리가 가지를 가림 | 큰 모체 암반은 원래 유기적 뒤 절벽 윤곽 안에 구성. 실제 암턱 연결 소켓은 유지. 상부 사각 돌출은 소켓 배치로 접합 |
| 공중 적 | 일부 원본/복제 위치가 시각 절벽과 불일치 | 초기2+복제2를 중앙 열린 공중에 배치. 증원2까지 실제 출현/이동 확인. 전체 날개가 월드 flightRegion 안에 머무름 |
| 저장/사건 | revision7 | revision8로 옛2장 전투만 재시작. 성장/SP/장착/완료 기록, 이벤트5개·담허 합류·보상·3장 연결 유지 |

공중 안전 영역은 projectile/ground solid가 아니다. 데이터가 있는2장에만 적용하는 선택적 월드 영역이며 공통 flight clearance가 순찰·유료 예비 접근·재위치·피격 반동의 전체 날개를 검사한다. 각성/경고·응답 기회와 공격 상한3은 보존했다. 실제 공통 뒤 절벽을 1px/world로 렌더한 마스크에서 영역 전체의 opaque pixel이0이고, 양쪽 절벽의 alpha255 대조점도 확인했다. 초기/복제/증원 및 여러 적 턴의 좌표·awake·queue·이동 예산은 trace/summary에 남겼다. 조준 중 예약 비행 정지와 현재 Continue도 통과했다.

최종 소스에서 **새 정상 자원 브라우저 호송 15라운드 승리**, 상여HP1700/영웅HP376/이벤트5개/적0/출구4100을 기록했다. 왼쪽 두 가지에서 실제 사격 후 하강·합류하는 생산 Engine move/drop/fire/defend 정책이다. HP/좌표/아이템/목표를 고쳐 승리시킨 실행이 아니며 이전21라운드 승리는 재사용하지 않았다. 수동 키보드·조이스틱 완주를 뜻하지 않는다. 중간18라운드 승리는 오른쪽 접근로 추가 전 기록이다.

별도 isolated 검사는 적/NPC를 제거한 경로/사격 fixture로, 정상 완주와 구분한다. 왼쪽 상단 가지(1595,781)와 두 번째 가지(1446,1117)는 같은 초기 까마귀에 각각 다른 각도/이동비용으로 실제74 피해를 준다. 상단 접근 이동비용1323, 두 번째2165다. 전체 앞길은 점프 없이 무피해 이동했다. 오른쪽 하부 턱(3438,2477)도 실제74 대공 피해를 확인했다. 초기 x290 정지 위치의 A01 직접 명중은 확인하지 못했고 긴 가지 끝으로 이동해야 검증한 사선이 열린다. 오른쪽 정상 전체 등정과 모든 전술 정책 비교는 확인하지 않았다.

집중 검수1은 전체 윤곽/지지/연속성(review1), 2는 가지 곡률·두꺼운 판 인상과 암턱 접합(review2), 3은 확대·동쪽 가지·물가·모바일/가로와 실제 이동 상태(review3)였다. 이후 발견한 물가 끝선과 오른쪽 접근 실패를 고치고 east-root-review의 일반/근접/모바일/가로, east-isolated-route의 실제 발밑 접합을 추가로 직접 열었다. 최종 동일 소스의 전체·일반·모바일·물가, 실제 R3/승리와 공중 증원 화면을 별도로 열었다. 횟수나 테스트 통과로 미술 완벽/전략 다양성 합격을 대신하지 않는다. 공통 암반의 큰 면 분절 인상은 원본보다 강하며 부모의 최종 미술 판단 대상으로 남긴다.

실행 검사는 build, stage2-road-strategy(원본/다른29장 보존·author 재현·무피해3경로·실탄3위치), stage2-layered-save --stage2-only(실제 옛 revision6/7, 현행 Continue, 성장/보상/담허/3장), airborne-waiting-motion, flying-knockback, web-split, 생산 브라우저 navigation/render/east-route다. fresh·실제R3·승리 저장의 Scene 상태 불변과 warm 캐시 재사용도 통과했다. web-split의30장 수치는 생성 데이터 재구성 검사이며 전30장 플레이/화면 검수를 실행한 것이 아니다. 세부 결과는 checks/results.json, 보존 해시는 checks/preservation.json과 SOURCES.json에 있다.

대표 원본은 `evidence/final/stage02-overview.png`, `stage02-normal.png`, `stage02-mobile.png`, `stage02-water-close.png`; 실제 진행은 `evidence/render/actual-r3.png`, `actual-win.png`와 `evidence/combat/route-2.png`, `air-turn-4.png`, `wave-entry-*.png`, `wave-moved-*.png`다. 최종 원본 trace/profile/outcome은 evidence/combat에 보존한다. 비교 원본은 evidence/comparison에 있다.

Library는 중간 후보 PNG4개의 승인된 upload URL로 CLI PUT을 시도했으나 `Forbidden`이었다. 전송 worker를 중단했고 확인된 전송0/4, finalize 미호출, 확인된 Library ID 없음이다. 재시도/대체 경로를 사용하지 않았다. 원본은 이 원격 브랜치에 보존한다. 정확한 제한은 checks/library-upload-status.json에 있다. 이번 후보는 배포하지 않았으며 공개 Pages 검증도 하지 않았다.
