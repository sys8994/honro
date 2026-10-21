# 11장 최종 종합 화면 검수

최종 렌더 소스 `ba61515be8b3b92db51f488e610708eed27c68fc`. 초기 집중 검수 3회와 별도로 이 커밋의 일반·근접·최대 확대/축소·모바일·외곽 16화면, 실제 정상 진행 저장 및 결과/쉼터/12장 진입 8화면을 모두 직접 열었다. 원본 PNG 24개와 SHA256은 `FINAL_REVIEW.json`에 있다. 합성·이미지 편집·이미지 생성은 하지 않았다.

## 마지막 보완과 평가

직전 cfb1372d 종합 화면에서 연결 암벽의 작은 꺾인 층리/밝은 무늬가 반복되는 인상을 확인했다. 주요 연결 암반에 한해 그 두 무늬를 제거하고 부차 음영을 0.68로 낮췄다. 기존 큰 면·깊은 절리·지형별 노출면, 작은 돌과 목재 미술은 유지했다. 비교 원본은 `evidence/final-correction-before/`에 별도로 보존했다.

- 서쪽 아치/수관, 중앙 보호 터, 하부 주민 터, 동쪽 경사와 북쪽 흔적의 연결을 최대 축소에서 확인했다. 새 구멍·빈 화면·이미지 원경의 날카로운 끝은 확인하지 못했다. 지지 암벽과 그 위 보행 테두리가 연결돼 있다.
- 일반/근접에서 밝은 보행 경계와 어두운 후면 절벽, 목재 뿌리, 원경 안개의 차이를 확인했다. 실제 Stage11의 물 배열은 비어 있으며 청록 면은 고체 암벽이다. 물이나 새 통과 가능 지형을 추가하지 않았다.
- 세로 390×844의 중앙/주민 터와 가로 844×390의 하강 연결부에서 목표와 발판이 읽힌다. 데스크톱 실제 최소 줌 0.2117647059, 최대 줌 1.65를 촬영했다. 모바일 0.55 화면을 모바일 최소 줌 검사로 부풀리지 않는다.
- 이전 독립 돌 외곽과 작은 반복 무늬는 줄었다. 다만 공통된 각진 암면 구성과 넓은 색면은 여전히 보인다. 모든 면의 독창성이나 전체 미술 합격을 선언하지 않으며 부모가 이 후보의 적합성을 판단한다.
- R33 동쪽 매듭 앞 아군 겹침은 보존된 입력 정책이 같은 목표 좌표로 모였던 상태다. R41 보호 후와 R47 하강 전의 분산 위치 및 지지면을 함께 확인했다. 지형을 고쳐 이 겹침을 숨기지 않았다.

## 정상 진행 증거와 확인 범위

기존 59라운드 정상 자원 승리(6/6목표, 보호 4턴, 네 동행 생존, 주민 HP801)를 그대로 재사용했다. 전체 전투를 다시 실행하지 않았다. production Continue로 실제 저장 5개를 열어 좌표/HP/focus/이동력/사망 상태 불변을 확인했고 실제 결과·쉼터·12장 버튼 진입을 수행했다. 브라우저 오류는 0이다.

`evidence/final-progress/stage12-entry.png`는 12장 초기 대사/UI 진입 증거다. 캡처 도구가 frame loop를 동결하므로 이 한 장의 어두운 canvas를 12장 지형 검수나 정상 렌더 완료 증거로 사용하지 않는다. 다른 29장의 실제 완주/픽셀 검수도 수행하지 않았다.

최종 렌더 수정의 빌드와 `stage11-landscape-art` purity/cache/opt-out 검사는 통과했다. 최종 생성물 current248/retained8개가 모두 존재한다. 기존 author 2회 전체 데이터 동일성, main/root-return 8경로, 실제 승리 저장의 성장/보상/중복 방지/12장 연결 검증은 게임 데이터와 동작 변경이 없어 앞선 결과를 보존했다. 원본 로그는 `evidence/checks/`에 있다.

역사 `stage11-ravine-authoring`의 raw canonical 대 후처리 runtime 계약 실패는 남아 있다. author 재생성 위험은 수정됐지만 현재 6목표를 옛 계약에 맞춰 바꾸거나 테스트를 완화하지 않았다. 정확한 기준/후보 실패 로그를 보존했다.

## 대표 원본

- 전체: `evidence/final/stage11-court-overview.png`
- 일반: `evidence/final/stage11-court-normal.png`
- 하부: `evidence/final/stage11-lower-overview.png`
- 근접/최대 확대: `evidence/final/stage11-court-maxzoom.png`
- 모바일: `evidence/final/stage11-mobile-refuge.png`
- 실제 보호 완료: `evidence/final-progress/protection-complete.png`
- 실제 하강 전: `evidence/final-progress/descent-before.png`
- 실제 승리: `evidence/final-progress/trace-victory.png`

원본은 작업 브랜치에 저장하며 master/Pages에는 아직 반영하지 않는다. 새 Library 파일 ID는 없고 기존 업로드 결과 불명 상태를 재시도하지 않았다. 공개 Pages403 제한은 우회하지 않았으며 이번 확인은 로컬 실행이다.
