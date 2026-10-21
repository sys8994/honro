# 부모 불합격 후 렌더 교정 — 부분 결과

부모는 b8db573f의 큰 암반 판, 직각 벽과 회색 발판을 미술 불합격으로 판단했다. 이전 REVIEW/FINAL_REVIEW는 그 후보의 역사 증거이며 미술 통과가 아니다. 이번 최종 소스는 `9ec228a5ca2d70f249fc142bbc246b4390c0ee5e`다. **재질·후면 연결은 보완했지만 판/직각 실루엣 제거는 미완이다. master 통합·배포를 하지 않는다.**

## 변경과 한계

- 중앙/서쪽 상부 암반: 전체 폭에 늘인 공통 도형과 얇은 장식 균열을 제거했다. 각 장소의 경사에 붙은 서로 다른 절리·선반·측면을 캐시된 벡터 패스로 저작했다. 하부는 깨진 면이 뒤쪽 모암과 이어지게 명암을 바꿨다. 실제 충돌 polygon의 바닥 외곽은 바꾸지 않았으므로 원래의 긴 변은 남아 있다. 실루엣 자체를 새로 만든 것으로 주장하지 않는다.
- 뒤쪽 지지: 기존 rear-only 모암 하나의 렌더를 불규칙한 기슭/받침으로 바꿨다. 기존 에셋 bounds 안에 유지하며 밑동은 전면의 실제 기반 안으로 겹쳐 접지했다. 밝은 보행선이나 새 장애물은 만들지 않는다. 그림은 후면이고 충돌은 아니다. 넓은 후면 암벽의 단순함은 일부 남는다.
- 오른쪽 벽/작은 발판: 같은 화강암 색면과 깊이로 바꾸고 뒤쪽 받침을 연결했다. 닫힌 통로의 긴 장벽도 무늬 없는 판 대신 분리된 돌 면으로 표현했다. 실제 통과/점프/사격 경계는 유지했다. 원본 자체가 직사각형인 작은 발판과 수직 변을 깎아 숨기지 않아 그 형태는 여전히 보인다.
- 충돌 판독: 공유 노출 경계의 동일한 Path2D를 사용한다. 실제 모든 외곽은 0.8px 잉크로 유지하고 실제 보행선은 기존 두께/밝기를 유지한다. 경계 경로·충돌·걸을 수 있는 변을 바꾼 것이 아니다. 후면 접촉선의 진한 테두리를 약하게 했다는 이유로 문제를 해결 처리하지 않는다.

이번 범위는 벡터 렌더 코드다. 지형·발판·캐릭터·적·사건·카메라·충돌 데이터와 author는 b8db573f에서 변경하지 않았다. 따라서 실제 실루엣까지 유기적으로 다듬는 다음 단계는 시각 선만 숨기는 방식으로 처리할 수 없다. 그 경우 바닥/측벽 polygon과 해당 이동·사격 경계를 함께 저작·검증해야 한다. 이번 코드 교정을 그 단계의 대체 완료로 삼지 않는다.

## 같은 카메라의 전후 원본

before는 b8db573f의 읽기 전용 worktree/별도 로컬 서버에서 직접 촬영했다. after는 위 최종 소스다. 합성/이미지 편집은 없고 5쌍을 모두 직접 열었다.

| 지점 | 이전 | 교정 후 |
| --- | --- | --- |
| 중앙 상부/하부 연결 | [before](evidence/correction-v2/before/stage12-north-face.png) | [after](evidence/correction-v2/final/stage12-north-face.png) |
| 서쪽 암반/기반 | [before](evidence/correction-v2/before/stage12-west-face.png) | [after](evidence/correction-v2/final/stage12-west-face.png) |
| 오른쪽 벽/닫힌 통로 | [before](evidence/correction-v2/before/stage12-right-wall.png) | [after](evidence/correction-v2/final/stage12-right-wall.png) |
| 서쪽 작은 발판 | [before](evidence/correction-v2/before/stage12-west-ledges.png) | [after](evidence/correction-v2/final/stage12-west-ledges.png) |
| 안쪽 연결 발판 | [before](evidence/correction-v2/before/stage12-inner-ledge.png) | [after](evidence/correction-v2/final/stage12-inner-ledge.png) |

큰 형태 검수는 focus1의 서/중앙/동 overview, 정상 거리 세부 검수는 detail-interim의5지점, 모바일/변화 상태는 최종 모바일3컷과 실제 저장의 닫힌 통로/개방 후 경사에서 수행했다. 중간에 넓은 면을 발견해 최종 소스에서 서로 다른 중간 규모 선반을 추가했다. 최종10컷과 실제 진행7컷을 별도로 모두 직접 열었다. before5 + final10 + progress7 =22개 원본의 경로/해시는 CORRECTION_V2.json에 있다. 검수 횟수나 기능 통과를 미술 합격으로 사용하지 않는다.

## 회귀와 보존

최종 원본 빌드와 렌더/후면 그림의 상태 불변·Canvas transform/alpha 복구·캐시/scene invalidation·opt-out 검사는 통과했다. 생성물 current248개와 retained 참조는 모두 존재한다. 수치는 checks/manifest.json에 보존한다.

정상 B출구 R11 승리 전체는 반복하지 않았다. 실제 terminal 저장의 Continue·2목표·보상/성장/중복 방지·13장 연결을 다시 통과했고, production 브라우저 실제 저장4개의 좌표/HP/focus/이동력 불변과 결과/쉼터/13장 UI 연결도 통과했다. browser errors0. 최종 그림으로 실제 개방 후 기사의 경사 이동/출구 위치를 확인했다. 전체 전투는 기존 native 입력 기록이며 브라우저 전체 재생이 아니다.

게임 데이터/충돌이 동일하므로 기존 상/하 출구8개 격리 이동 및 author2회 전체 동일성 결과를 보존했다. 변경 없는 29장 전체 플레이나 상부 출구 정상 전투 승리를 새로 실행했다고 주장하지 않는다. 공개403과 이전 Library 업로드 불명 상태를 재시도/우회하지 않았고 새 Library ID는 없다. 기능 회귀는 통과했으나 시각 목표 일부가 남아 있으므로 후속 설계 판단을 위해 원격 저장만 한다.
