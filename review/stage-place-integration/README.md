# 22·24·26장 통합 검수 인계

기준 master: d7c1f8457dd33decda5481c7c3b57d8505f6f157. 런타임/맵 소스 통합 checkpoint: 2314ee6a2ad53606c2e150b2c8c087f54de1af32. 이후 변경은 계약·검수 자료다. master 병합은 부모 통합 조율을 기다리며 이 브랜치에서 Pages 배포를 실행하지 않았다. 기존 사용자 저장은 읽거나 변경하지 않았다.

## 구현

- 22: 반복 벽돌 전면을 얕은 석재 기단·넓은 암면으로 정리, F 서쪽 선택 경로 중간 마당과 왕복 접점/하단 외곽 개선. E 큰 서고의 실제 기와 외곽을 oneWay 지붕 경로로 연결. G 대조 평탄부·2턴 방어·동측 증원·두 실제 장부 소유자 정책 보존.
- 24: 가문 대청·뒤뜰·선조 사당·두 실제 입구로 장소 구성. 불교 사찰 오브젝트 대신 가문 공간. 다섯 건물 지붕과 낮은 처마 발판을 기존 점프/하강 정책으로 연결. 궁수+법사 및 기사+술사의 개별115범위 방문과 Continue 래치 보존. 기존 등불이 증원 첫 진입점을 점유하던 문제는 같은 사당 평탄부의 저작 진입점 이동으로 해결.
- 26: 낮은 기록실·손상된 공방·상부 작업로·주민 피신처·짧은 귀환. 실제 주민/구조자 위치에서 증거 인계, 옛x4800카운터 조사 없음. 기사/술사 기본 점프와 지붕 하강, 공방/초가 실내 통과 보존. 거대한 종 주조를 암시하는 새 설비나 새 이야기는 추가하지 않음.
- 공통 엔진 변경 없음. 지붕만 oneWay이며 집 내부/지상 길을 새 solid로 막지 않는다. 기존 발판의 상향 탄 통과·하향 탄 충돌과 점프/내려가기 정책을 재사용한다.

## 검수 범위

- Game desktop/mobile 전후 PNG, 실제 지붕 jump/drop, Workshop Stage View/Playtest 확인. 22/26의 mobile jump/drop은 터치이며 22 수평 접근은 키보드를 사용한 격리 실험이다. 전체 모바일 조이스틱 정상 완주로 표시하지 않는다.
- 22 네 체형 전체 지붕 왕복·실내 보행·탄 양방향·App 저장8경계, old/new HTML 실제 Continue 지형/내장 에셋/목표 exact보존.
- 24 네 체형 지붕20조건, 실제 내려가기2회·두 입구 방문/Continue, Workshop Stop 원본 보존.
- 26 두 체형 공방/초가 지붕, 기본 필수 경로·위 작업로 양방향, 실제 버튼8조건, 주민 인계/Continue.
- P048행 및 field-evidence는 통합본에서 통과. 개별 장 branch의 other29불변 검사는 그 branch 전용이다. 통합본에는 변경3장과 나머지27장 exact 계약을 적용한다. 통합에서 독립24검사를 그대로 실행한 첫 시도는137종료했고 통과로 세지 않았다.
- 22 최신 normal-input-roof:39라운드,22처치,네 생존,5Continue. 24 통합 normal-trace:9라운드41행동,네 생존. 26 통합 normal-input-observed:5라운드8행동,두 생존. 모두 준비된 개별 장 진입의 production Native App 입력이며 연속 캠페인/실제 브라우저 전투 완주는 아니다. 각각 provenance에 적힌 source/runtime 해시에 귀속한다.

## 남은 완료 차단과 한계

- 24 마지막 증원은 실제 발사2회지만 피해·전술적 회피/위치 선택의 효과가 입증되지 않았다. 초기5군집·앞선2파동은 실제 피해 추적으로 확인했다. 이 마지막 파동을 전술 합격으로 처리하지 않는다.
- 22 장부/등불 파동은 실제 피해를 확인했지만 명시적 플레이어 대응 기록은 비어 있다. 지붕을 사용한 정상 전투 선택 역시 이번 trace에서 입증하지 못했다. 국소 경로/조작 검수와 구별한다.
- 26 모든4군집 실피해는 확인했으나 finishAction hook 중복 호출과 일부 대응 인과 한계가 있다. 행동 횟수를 과대 해석하지 않는다.
- 독립 보고서는 각 review/stageXX의 *independent-review.md. 최종 encounter gate의 필수 전술 항목이 남아 있으므로 전체 교전 검수/최종 배포 완료로 보고하지 않는다.
- 공식 한국 건축 참고 페이지 텍스트는 읽었으나 원본 사진 픽셀은403/이미지 전송 오류로 확보하지 못했다. 실제 게임 PNG는 원격 브랜치에 보존했다. Library ID 발급 완료를 주장하지 않는다.
- 전체 verify는 이번 차례에 반복하지 않았다. 기존 binding-detail/migration/integration baseline 실패는 통과로 바꾸지 않았고 fixture를 완화하지 않았다.
- 기존 Pages run38713643508은 이전 배포 기록이다. 이번 GitHub Actions readback은403으로 실패했으며 다른 경로로 재시도하지 않았다. 공개 Pages 검수는 부모 인계 사항이다.

## 통합 HTML 바이트

- HONRO.html: 14512348 bytes / SHA256 8dfa33c75cd843286e98ea075d65ca79ea7c570f464730b556a2744bff9e722a
- HONRO_WORKSHOP.html: 14623122 bytes / SHA256 caf7e8d66f91139a43cd24c548180785612b28da3da414112b03dd7aec076265
- tools/character-catalog.html (미변경): 11864191 bytes / SHA256 aeac3443d8917c6e8ea71dfcc49b7bedc4717a8fd25298a3852f6842c02faa2b

최종 formal encounter gate 실행 결과는 이 executor의 `_local/reports/stage-place-integration/encounter-gate.json`에 별도로 보존한다. 미확인 전술 항목을 observed로 채우지 않으며, 이 결과는 코드 회귀 검사와 구별한다. `review/stage-place-integration/contracts.json`과 contract 로그는 새 outer exact 계약의 실제 표준 실행 결과다.

최종 표준 계약3개 모두 통과: current-runtime(168소스·9변형·양HTML·새negative25개), current-campaign(새inverse negative30개와 이전생성기재현), act3-place-regeneration(새3장·사용에셋·나머지27장exact). 현재667개/이전640개 에셋을 구별해 고정했다. 동결fixture 변경 없음. 검사 메모리상한768MB를 적용했으며 진단 preload 없이 통과했다.
