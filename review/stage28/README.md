# 28장 「지운 이름과 남은 명령」 검수 후보

기준 커밋: `d7c1f8457dd33decda5481c7c3b57d8505f6f157`. 승인 전 독립 브랜치 자료다. master 병합·Pages 배포·미술 최종 승인은 하지 않았다.

## 공간 변경

U자 골짜기를 중앙의 낮고 넓은 관아 대청, 서쪽 서리 동선, 동쪽 수방 마당으로 바꾸었다. 봉쇄문 두 곳, 양측 출발, 각 제어의 직업/자유 순서, 행동 종료 시 네 명 합류, 12번째 적 턴 화재, 실제 기록함 구출과 후속 승인/은폐 증거 순서를 보존한다. 초기 적 11/정예 3, 네 군집, 동시 행동 상한 3과 무증원도 유지한다. 중앙 대청은 지면에 붙이고 두 낮은 툇마루는 실제 지지면과 왕복 가능한 경사로를 갖는다. 다른 29장과 네 주인공 그래픽은 수정하지 않는다.

새 지형에서 합류 허용 범위 440 안의 실제 물증 소유자가 이전의 별도 260 범위 때문에 대조에 빠지는 문제를 고쳤다. 새 맵에서만 합류와 동일한 sameFloor 판정을 사용해 기존 영수증을 가져오며, 이후 실제 걷기→바닥 전개→대조→재포장을 유지한다. 소유자 순서 반전으로 첫/마지막 목적지까지505/530px가 되는 경우를 재현했고, 새 28장 party-reunion 연출만 최대600px로 조정했다. 실제 지형에 선 +440/-430 소유자의 걷기·전개·재포장 회귀도 통과한다. 구 저장은 원래 지형과 판정을 유지한다.

## 직접 볼 이미지

- `before/stage-28-panorama.png` / `after/stage-28-panorama.png`: 같은 카메라의 Native 전체도.
- `before/stage-28-landmark.png` / `after/stage-28-landmark.png`: 같은 카메라의 중앙부 확대.
- `browser/desktop-overview.png`, `desktop-record-court.png`, `desktop-west-fire.png`, `desktop-water-yard.png`: 실제 브라우저 Canvas/HUD, 턴 배너/일시 toast 제거.
- `browser/mobile-record-court.png`, `mobile-west-fire.png`, `mobile-water-yard.png`: 390×844 실제 브라우저.
- `browser/*-normal-reunion-replay.png`: 정상 자원 Native 전투의 R6 원본 상태를 브라우저에 재렌더링. 브라우저 수동 완주 증거가 아니다.
- `browser/*-four-evidence-laid-fixture.png`: 소유자가 ±430/±290에 분산된 격리 fixture에서 실제 연출이 네 물건을 전개한 상태. HUD 목표는 fixture 원상태이며 정상 전투 장면으로 주장하지 않는다.
- `browser/workshop-stage-view.png`: Workshop Stage View. Playtest 직접 검수는 미실행.

## 실행 결과와 범위

`npm run build`, 환경 validator(30맵/오류0), stage28 contracts/fullplay/resume/browser, 기존 evidence-pickup-p0/field-evidence/act3-location-fire-sites 집중 검사 통과.

`normal-play/stage-28.json`: 정상 진입 성장 예산에서 자동 배분한 합법 장비로 실제 Engine 이동/발사/상호작용/행동 종료만 사용한 Native 전투. 숨은 회복·위치 이동·목표 강제완료 없이 R8/36행동 완료, 네 명 생존(설오45%, 담허58%, 휘겸97%, 소단97%). 정상 전투 기록은 DOM/Canvas/storage doubles를 쓰므로 브라우저 수동 전체 플레이나 연속 캠페인 완주로 간주하지 않는다. 적 피해와 전투 행동은 원본 로그에 있다.

`contracts.json`: 다른 29장 불변, 생성기 멱등성, 목표/편성 보존, 실제 유한 이동과 두 툇마루 왕복, 12턴 화재. 이동 경로 검사는 적 제거/승리 비활성 geometry fixture이며 정상 전투와 별개다.

`resume.json`: 명시된 분산 합류/물증 fixture의 실제 네 명 걷기·전개·재포장, 새 저장 및 개편 전 저장 Continue 보존. 사용자 저장은 열지 않았다.

`browser/report.json`: 독립 disposable PC/모바일 컨텍스트, 실재 적이 있는 신규 전투에서 Engine 이동 자원 소모, JS오류0. 키보드/터치 조작 전체 검증은 아니다.

전체 verify/migration/integration/performance는 이번 범위에서 재실행하지 않았다. 정식 encounter gate는 pending manifest로 실행했고 blocked다. 군집별 정식 관측 packet/독립 검수와 Workshop Playtest 및 최종 미술 승인이 남아 있으며, 원본 로그와 이미지는 검토용으로 제공한다. 최종 품질 완료를 주장하지 않는다.

## 참고와 제약

공식 관아 이미지 후보: [전주 동헌](https://tour.jeonju.go.kr/board/view.jeonju?boardId=BBS_0000016&dataSid=10059&menuCd=DOM_000000201009000000&paging=ok&startPage=1), [울산 동헌](https://www.junggu.ulsan.kr/board/view.ulsan?boardId=ATTRACTION&contentsSid=2166&dataSid=711540&menuCd=DOM_000002208004007000&paging=ok&startPage=1), [한국관광공사 대흥동헌](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=88219). 공식 이미지 다운로드는 프록시 403 또는 timeout/unsupported image type으로 막혔다. 이미지 검색 설명을 실제 사진 픽셀 검수로 취급하지 않았다. [UNESCO 낙안읍성 국가 제출 설명](https://whc.unesco.org/en/tentativelists/5598/)의 관아와 생활 시설 구분만 참고했다. 공식 사진 픽셀 조사는 미충족이다.

Library 업로드 도구가 없어 요청된 대체 방식인 이 review 디렉터리에 PNG와 설명을 넣었다. Library file ID는 없다.
