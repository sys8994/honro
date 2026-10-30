# 5장 제한 교정 — 암면과 진 동쪽 간격

부모가 ab36c34c 원본 전체 화면을 검토한 뒤 요청한 두 항목만 교정했다. 승인 master bafc275c 조이스틱을 da431780으로 병합하고, 교정 코드는7b099cce다. 별도 candidate/stage05-positioning에만 반영한다. 미승인 광범위 밸런스는 가져오지 않았고 master/Pages는 부모 검토 전 보류한다.

## 1. 단일 판과 단색 지면

기존 상부는 단일 granite-ledge-neck에 의존하고, 아래 valley-floor는 과거 폭포용 넓은 두 색면을 계속 사용했다. 새 전용 도형을 저작하지 않고 **원래 공통 act1 drawTerrainMaterial + 승인 공통 granite-ledge-neck2/밑동 granite-foundation1/진 암반1**을 조합한다. 서로 다른 역할·부착 위치의 소수 자산이며 native scale 범위(.65–1)를 지킨다. 새 자산/이미지/소나무/작은 노이즈는 없다. 공통 렌더러·자산 자체도 이번 교정에서 바꾸지 않았다.

위쪽은 왼쪽 암턱, 중앙의 원래 큰 암면, 오른쪽 뿌리 어깨로 분리되고, 아래 지면은 같은 계열의 넓은 화강암 밑동과 원래 암면으로 이어진다. 어깨·밑동은 canonical solid 내부에만 칠해 아래 통로를 rear 자산으로 막아 보이게 하지 않는다. 기존 실제 보행 rim을 마지막에 그린다. 새 물리선·충돌·외곽 지형·통로 형상은 없다. 큰 명암면으로 연결을 개선했으며 물리 실루엣 자체의 긴 직선과 큰 덩어리는 남아 있다. 부모 미술 최종 통과를 대신 선언하지 않는다.

## 2. 담허/사슴 간격

사슴(foe-5)의 기존 발1758/2698.63을 **1778/2686**으로20만 옮겼다. 큰 오른쪽 이동을 시도했을 때 뿌리 쪽에서 되밀리는 제약이 있어 채택하지 않았다. 최종1778은 fresh와 정상 R2까지 같은 발 위치로 유지됐다. 나머지11체·역할·정예·각성·증원·HP·XP는 동일하다. 권장 진 동쪽 정지점은1690/2704에서 **1640/2674**로 당겼다. 이는 범위 경계 대신 같은 봉우리의 동쪽 경사면을 쓰는 안내 앵커이며 강제 위치나 행동 제한이 아니다. 진1590/2710의 x±125/y±80은 그대로다.

같은 정상4레벨 보상 ledger profile로 짧은 방향키/방어/E 입력만 수행했다. 체력/좌표/이동력을 바꾸지 않았다. 새로 처음부터 전체 완주를 실행하지 않았다.

|정상 R2 비교|담허 실제 발|사슴 실제 발|가로 몸체 간격(중심 차−r22−r38)|
|---|---|---|---:|
|이전 동쪽 checkpoint|1689.46/2703.68|1758/2698.63|8.54|
|교정 동쪽 checkpoint|1639.97/2673.98|1778/2686|78.03|

서쪽1489.15/2768.10에서 동쪽까지 추가 보행215.62, 진 active 유지. 동쪽에 도착한 후 실제 M03을 사슴에 발사해84, 다음 적 대응 후에도 몸체 간격56.68과 진 유지가 남았다. 서쪽 M11은 실제 암반 접촉→1회 반사→foe-4에72였다. 범위기 다중 명중이나 피해 통계 우월성은 주장하지 않는다. 현 엔진 적 대응은 기존 projectile AI이며 **병행 실제 근접 공격 통합 후 접근/접촉은 아직 미실행**이다. 그 비교를 위해 이동 로그·R2 정상 전투 snapshot·R3 적 대응 후 snapshot을 원본 압축 JSON으로 보존한다. 새 밸런스 난이도는 fresh 짧은 입력을 재생해 확인해야 하며 옛 HP가 담긴 저장을 새 난이도 증거로 쓰지 않는다.

## 집중 검수3회와 최종 종합

1. **전체 구조**: [1440×900](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage05-positioning/refinement/review1-overview.png). 한 판에 몰린 명암을 여러 큰 암면으로 나누고, 오른쪽 어깨→뿌리→아래 밑동의 팔레트와 방향을 연결했다. 아래 열린 공간과 기존 이미지 원경/연못/폭포를 확인했다. 기반 지면의 넓은 면과 긴 실루엣은 그대로이며 미세 패턴으로 덮지 않았다.
2. **일반 거리·접합·몸체**: [오른쪽 지지 접합](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage05-positioning/refinement/review2-junction.png), [하부 통로](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage05-positioning/refinement/review2-lower.png), [진 서쪽](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage05-positioning/refinement/review2-ritual-west.png), [진 동쪽](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage05-positioning/refinement/review2-ritual-east.png)을 직접 열었다. 진과 통로를 막는 rear 칠이 없고, 동쪽 담허와 사슴은 실루엣이 분리된다. 양쪽의 차폐 방향과 실제 반사는 기존 물리로 유지된다.
3. **모바일과 상태 변화**: [390×844 동쪽](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage05-positioning/refinement/review3-mobile-ritual.png), [정상 적 대응 후R3](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage05-positioning/refinement/review3-mobile-ritual-response.png), [844×390 공중 위협 포함](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage05-positioning/refinement/review3-mobile-air.png)을 직접 열었다. 동쪽 두 몸체를 구별할 수 있고 MOVE/AIM 조이스틱이 보인다. 상부 공중 적은 통상 줌에서 여전히 화면 밖으로 이동할 수 있어 별도 줌아웃 프레이밍으로 보여 준다. 자동 카메라는 바꾸지 않았다.

**최종 종합**: 최종 source/data 빌드의 전체·하부·진 동쪽/R3·가로 공중 프레임을 다시 열어 접합/빈 공간/충돌 rim·몸체 분리·HUD를 확인했다. 미술은 원본 비교가 가능한 개선 후보이며 부모 최종 판정 대기다. 최초8R 승리와 동굴 프레임은 상태를 그대로 재렌더했을 뿐 새 승리로 세지 않는다. refinement 폴더에는 바뀐 구간11장만 보존했다.

## 검증과 보존 범위

* 모든5장 terrains는 ab36c34c와 완전히 동일하다. 다른29장·라이브러리도 동일하다. Stage5 data 차이는 사슴1체 x/y/spawn, 권장 ritualEast 앵커/경로 지점, 공통 미술 composition v2뿐이다. cap4/20·initial12·finite6·보상·이야기·승리조건은 보존했다.
* 같은 map revision3을 유지한다. 이번에는 진행 전투를 재시작하지 않는다. 기존 Continue의 적 위치/HP를 옮기지 않으며 미술만 현재 composition v2로 해석한다. 재사용한 옛 상/하부 checkpoint는 기존 적 위치를 그대로 가진다. 신규 배치 검수는 별도의 새 정상 R2/R3 checkpoint다.
* approved master bafc275c의6개 입력/엔진/CSS 소스가 byte 동일하고 joystick-intent 검사 통과. build, 후보 author/12체/HP rounding/성장/저장 계약, web-split 통과. 실제 Chromium14프레임 pageerror0, 렌더 전후 serialized battle 동일, 세 실제 지형의 common geology 호출을 계측했다. 테스트 기대값은 바꾸지 않았다.
* 전체 verify/다른 장 플레이/새 전체5장 완주/미통합 근접 공격·밸런스 검수는 실행하지 않았다. 이전8R 정상 승리 기록은 역사 증거로 유지한다.

원본 PNG와 수치는 [refinement/](refinement/)에 있다. `ritual-checkpoints.json.gz`는 기본 profile+정상 SP 학습과 App 이동/E/방어의 짧은 기록, `ritual-actions.json.gz`는 그 상태를 Continue한 실제 발사/적 대응 기록이다. tools/testing/stage5-refinement-checkpoints.mjs → stage5-refinement-actions.mjs → stage5-positioning-material-review.py로 재현한다. 상하부 원본은 기존 evidence/probes.json.gz를 _local/reports/stage5-positioning/probes.json으로, 기존 fullplay.json.gz도 해당 경로로 해제한다. 정상 profile은 기존 evidence/entry-profile.json에 있다.

이번 교정의 실행·커밋·후보 push 차단은 없다. 원래 사용자 첨부의 Library 다운로드 실패와 원본 픽셀 비교 미완료는 기존 REPORT.md의 한계를 유지하며 우회하지 않았다. master/배포와 최종 미술 판정은 부모 검토 대기다.
