# 2장 전면 호위로 + 뒤쪽 절벽 후보 검수

기준 master ee73add57bc27357abdbe2d1c606c9017e393351. 실행 소스0f2635e8d470e48c82719aa99e5384df0196dbed. 뒤의 증거 커밋에는 게임 소스 변경이 없다. 부모 실제 화면 확인 전 master/Pages 미반영이다. 12장72679f45는 보존하고 가져오지 않았다.

## 실제 수정

상여는 왼쪽180,y2860에서 출발해 같은 높이의 전면 도로를 따라 오른쪽4100까지 이동한다. 설오는 왼쪽 높은 턱290,y588.53에서 출발한다. 두 뒤 절벽은 시각용 암면이며 도로를 막지 않는다. 실제 충돌은 도로와7개 암턱/5개 one-way가지뿐이다. 서쪽의 교차 하강로는 고지→중간 사격턱→전면 도로로 합류한다. 밝은 실제 지면 테두리와 후면의 낮은 대비, 따뜻한 전면 도로/후면 접점으로 두 층을 구분했다. 기존 이미지 원경·배우/대사 순서·이벤트ID·유한2+2증원·초기12명·공중4명·행동상한3·능력치/보상은 보존한다.

## 집중 실화면 검수3회와 별도 최종 종합

1. `evidence/review1`: 전체 구조/연속성/지지. 상여 왼쪽 시작과 독립된 도로, 고지와 절벽 접점을 확인했다. 단순 직선 발판 바닥과 넓은 후면 단색 면을 보완 대상으로 찾았다.
2. `evidence/review2`: 근접 재질/판독. 암턱 밑면의 비대칭 파단과 큰 절리 면을 추가하고 공중 복제의 작성 위치를 겹침 없는 곳으로 옮겼다. 물리 검사에서 하부 암턱 밑 보행자의 머리 여유가 부족함을 찾아 턱 전체를120 높였다. 그림만으로 통과를 만들지 않았다.
3. `evidence/review3`: 정상/근접/1920최대축소/세로 모바일, 도로 양 끝과 하강/합류 여유를 직접 열었다. 작은 장식을 반복해 채우지 않고 실제 통로와 접촉면이 읽히는지 확인했다.
4. `evidence/final`: 최종 실행 소스에서 별도8장(일반/전체/도로 양 끝/모바일/둥지/가로 구도)을 다시 촬영하고 모두 직접 열었다. `navigation` 도입은 설오 고지와 왼쪽 상여가 한 화면에 보인다. 정상 진행의 하강 장면/도로 합류/상여 도착과 실제 Continue·결과·쉼터·3장 화면도 직접 열었다. 회수 자체를 자동 미술 합격으로 삼지 않는다.

남는 조형 한계: 뒤 암벽은 큰 절리 면 위주로 단순화했고 공통 벡터의 긴 가지/짧은 암턱 윤곽이 남아 있다. 이번 후보는 전후 구조와 실제 연결성을 확인한 것이며 사실적 암벽 미술 완성이나 전30장 합격 선언이 아니다. 부모의 미술 판단은 아직 미기록이다.

## 실행 검증

- build 및 `tests/web-split.mjs`: 생성 hash/byte,30장845자산 재구성, Game/embedded/Workshop 진입 통과.
- `tests/stage2-layered-road.mjs`: 단일 author 재현/재실행 안전, raw 다른29장/라이브러리 동일, 실제 Engine의 고지→하강→도로4100 및 도로180→4100 경로 모두 피해/점프0, 초기 고지의 실제 A01 명중, 전원 초기 몸/날개 여유, 초기12/상한3 통과. 격리 경로/사격이며 정상 전투 증거와 구분한다.
- `tools/testing/stage2-layered-browser.py`: 실제 production browser Engine move/drop/fire/defend와 missionTick으로 정상 자원 호위21라운드 승리. 설오376/376, 상여1700/1700, 도착4100, 기본 화살10회, 방어11회. 실제1장 클리어 보상에 맞춘 합법 입장 fixture이며1장부터 연속 완주/사람 키보드 플레이 주장은 아니다. 위치·체력·기력·이동량·아이템·목표를 조작하지 않았다. 가속 Engine 진행이라 원본 combat PNG의 타격 수치가 누적될 수 있으며, 깨끗한 실제 저장 재개 화면은 navigation에 있다.
- `tests/stage2-layered-play-evidence.mjs`: 실제 첫 고지 화살 피해,7개 하강 목표와 원래5개 이벤트 완료,10개 실제 상태의 몸/날개 및 증원 여유, 공중4명 모두 적 턴 좌표 이동과queue≤3 확인. 모든 프레임을 전수 픽셀 검사한 주장은 아니다.
- `tests/stage2-wave-opportunity.mjs`: 기존 도로/공중2+2 증원의 경고·새 응답 기회·안전 경계·점유 대기·단일 진입·Continue 통과.
- `tests/stage2-layered-save.mjs`: 실제 기준 master의29장 전투와 세션 외 정확히 동일. 기준 master의 실제 Stage2 revision6 저장만 폐기→새7/왼쪽180 시작, XP/SP단련/장착/성장장부/캠페인/설정 보존. 현재 초기 snapshot은 전부 정확히 Continue, Workshop 제외. 실제 브라우저 승리 저장에서 보상 중복 없음·담허 동행·3장4revision 진입 확인.
- `tools/testing/stage2-layered-navigation.py`: 실제 브라우저 도입 구도·진행R3 저장 Continue·승리/보상·다음 쉼터 버튼·3장 버튼 진입 통과, pageerror0.

## 기존 동작과 한계

진행 R3의 Continue에서 담허의 자동장착 `M06`과 rank가 `LM06`으로 정규화됐다. 같은 전투 중 skill snapshot을 변경 전 ee73add5의 실제 맵 저장에 얹어 기존 `Engine.migrateEnemySkills`가 동일하게 바꾸는 것을 재현했다(`checks/baseline-legacy-normalization.txt`). 위치/HP/기력/이동량/지형/턴/목표/정책은 그대로다. 이 알려진 정규화만 명시적으로 비교에 반영했고 이번 지형 작업에서 전역 스킬 코드를 고치지 않았다. 진행 저장의 모든 필드가 무조건 byte 동일하다고 주장하지 않는다.

검증은 로컬 HTTP8870/Chromium과 native App harness다. 공개403 재시도/우회, Pages 설정API, master/Pages 쓰기를 하지 않았다. Library는 이전 불확실한 업로드를 재시도하지 않고 원본을 원격 브랜치에 보존한다. 새 library_file_id는 없다.

`evidence/SOURCES.json`에 원본·렌더·컨트롤러 SHA256과 캡처 목록이 있다. 초기 두 회차는 미커밋 중간 상태라는 capture metadata를 그대로 보존했다. 최종/정상 진행/내비게이션은 모두 위 실행 소스다. 기존 역사 지형을 고정한 테스트를 새 지형에 맞춰 느슨하게 바꾸거나 부모 통과/manifest 승인을 만들지 않았다.

재현: ee73add5 별도 worktree에서 현재 `tools/testing/stage2-layered-baseline.mjs`를 실행해 `/tmp/stage2-layered-baseline`을 만든 뒤 현재 브랜치의 save 검사를 실행한다. 실제 combat 재생성은 HTTP 실행 후 layered-browser, navigation 순서다. 과거 승리 전체를 불필요하게 다시 실행할 필요는 없다.
