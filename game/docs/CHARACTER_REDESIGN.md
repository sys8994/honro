# 캐릭터 그래픽 개편 · 2026-10-14

기준은 master `3899a2f2550d8728811f96ec0c1c202956921291`이다. 원격 fetch로 외부 변경 없음을 확인했다. 당시 72행의 판정 전체를 `CHARACTER_REDESIGN_BASELINE.json`에 동결했다. 우선 개편 13행을 1차, 수정 권장 33행을 2차로 처리한다. 미사용 후보·유지 항목을 삭제하지 않는다. 네 주인공은 비교 기준으로만 사용한다.

## 1차: 구현·로컬 미술 검수 완료

소스 커밋 `2d6e64661bc44088b1c2b48eca95d175d82eeddb`, 원격 `character-redesign-20261014`에 guarded native git push 및 read-back 완료.

- 몬스터: ghost, shade, warden, lantern. 큰 삼베 면·결박 구조·목재 얼굴·빈 한지 등롱.
- 소환: summon_charger, summon_eater. 전방 중량과 비대칭 수직 입. 리그·성장·흡수 판정 보존.
- 직접 Canvas: resonance, echo, bellCluster, keeper. 종지기는 human/occultist 위임 제거, 사찰 작업 복식과 외부 타종 구조.
- 구형: legacy_mourner, legacy_knight, legacy_occultist. 상두꾼의 소단 오연결 제거, 현행 상두꾼 공유. 무사·주술사의 한국식 복식.

`tests/character-redesign-browser.py --phase 1 --hosts`: 64검사 통과, 브라우저 오류0. 기존 baseline HTML과 실제 Scene 비교, 13행 전체 변경, 180/90/35px, 5모션×2시점×양방향, 사망 시 숨김, 데이터 무변경. 네 주인공 각각10표본 픽셀 동일. Game/Workshop의 10/18/28장 desktop/mobile 화면. 독립 검토자가 13행 비교 및 모션 시트를 직접 확인했다. 정상 자원 완주·모든 기예·모든 과거 저장 검증은 아니다.

증거는 Git 제외 `_local/reports/character-redesign/phase1-qa/`의 `comparison-1.png`~`comparison-4.png`, 각 `*-motions.png`, `results.json`, `visual-review.json`에 있다. 원래 도감의 baseline31검사·1,386렌더 표본도 `before/`에 보존했다.

## 2차: 구현·로컬 미술 검수 완료

몬스터10, 소환·상여4, 직접 Canvas5, 구형12, 파괴 목표2. 상세 ID는 동결 JSON의 `phase2`가 기준이다. 소스 `20d86d69158d5a8d1434886f27e526f464a1a2ac`를 원격 저장했다. `phase2-qa/` 128검사·오류0, 33행 전체 전후·모션 시트를 독립 검토했다. 권양기는 고정180px 표본의 캔버스 높이만330→440으로 늘려 원래 큰 프레임의 잘림을 해결했다. 그림 크기·허용 오차는 바꾸지 않았다. 실제 8장 결박HP480/side1·18장 고정구HP240/side1과 Game/Workshop 화면을 확인했다. 목표의 실제 검·화살·잠금·저장 이어하기 집중 검사도 통과했다. `CHARACTER_REDESIGN_STATUS.json`에46행 각각의 구현/로컬검수 상태를 기록한다.

## 자료와 검수 제한

한국학중앙연구원 상원사 동종·불가사리, 국립중앙박물관 방상시 본문을 읽었다. 공식 이미지 링크는 찾았으나 AKS·박물관·서울시 이미지 서버의 CONNECT/HTTP403으로 이미지 픽셀 직접 관찰은 미완료다. `tools/character-catalog/references.json`에 정확한 접근 상태를 남긴다. 사진을 저장소에 넣거나 트레이스하지 않았다. 장승·방상시·장례 장식을 본래 악한 존재로 설명하지 않는다. 사천왕 도상은 이 작업에 억지로 적용하지 않았다.

기준 검사 알려진 실패는 `story/ACT23_REVISION_IMPLEMENTATION.md`의 목록을 유지한다. 전체 verify는 최종 master 배포 후 한 차례만 실행한다. baseline과 다른 실패를 기존 실패로 가리지 않으며 fixture를 완화하지 않는다. 과거 최소3배 앵커 규칙은 사용자 요청의 간결한 큰 면 설계와 충돌하므로, 개편 벡터만 명시적 상한350앵커/90경로/16색을 적용한다. baseline 자체와 그 무결성 검사는 보존한다.
