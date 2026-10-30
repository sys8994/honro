# 캐릭터 기준 1장 · 세 고유 구간 실제 화면

[시작 정상](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-reviews/stage1-sections-20261019/stage1-entry-normal.webp) · [첫 접합 정상](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-reviews/stage1-sections-20261019/stage1-seam-entry-normal.webp) · [고목 정상](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-reviews/stage1-sections-20261019/stage1-middle-normal.webp) · [둘째 접합/출구 정상](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-reviews/stage1-sections-20261019/stage1-seam-exit-normal.webp) · [전체](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-reviews/stage1-sections-20261019/stage1-three-overview.webp) · [모바일 현재 최대](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-reviews/stage1-sections-20261019/stage1-three-mobile-normal.webp) · [모바일 최소](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-reviews/stage1-sections-20261019/stage1-three-mobile-minimum.webp)

1774×887의 고유 시작/승인 중간/고유 출구를 각각1.23배로 배치한다. 전체6000×3000과 캐릭터 원본/물리는 그대로이며, 설오 실제 신체 H103.5world(정상.6에서62.1CSSpx)를 기준으로 맞췄다. 단일 원화를6000world로 늘렸던3.382배와 구분한다. 그림 전체 반복/반전/타일 채우기·새 모션·떠 있는 벡터 발판은 없다. 실제 접촉은 보이는 길/뿌리/큰 가지/돌 상부에 맞췄다.1장만revision4다.

실제 Chromium1440×960 정상.6/전체.24,390×844 현재 최대.1625/실제pinch최소.05735294다. 시작은 그대로 새 전투이며, 다른 카메라 검수는 Native 이동으로 도달한 hero 좌표만 사용했다. 원래8적은 유지했다. 전체 전투를 진행한 화면이라는 주장은 아니다. 경계의 깊은 면은 접합부 world 높이가 같게 정적 감쇠하며 잘린 상단 수관만 작은 둥근 alpha contour로 처리했다. 원본 이미지 픽셀은 불변이고 근경 추가 톤 필터도 없다.

[브라우저](browser.json)에는 요청4개(quietFar+3근경)/console0와 같은카메라3프레임 필터1·근경3·scratch/전투데이터 안정이 있다. [Native](native.json)는 원래8적/cap2·능력/이벤트 의미 보존, 초기 접촉, 적을 뺀 주 경로/출구·일반점프의 뿌리/고목/돌/출구바위 접근, 이전revision3 전투만 재시작하고 성장/SP·장착/완료를 보존하는1사례다. [생성물](build-integrity.json)은 필요한 파일 존재·다른장 payload/선택 모듈 계약 동일 확인이다. 전체verify/다른장/기예/전체전투는 미실행이다.

쉼터 공통배율 소스15ec4bd도 최종 빌드에 포함했고 부모가 전달한 별도 검증을 반복하지 않았다. 다른29장과 개별 쉼터 건물 비율은 후속 범위다. Library 전달 도구가 이 실행 환경에 없어 이 저장소 파일을 전달본으로 보존한다. Pages 발행/접속 상태는 최종 작업 보고와 구분한다.


## 짝 배치 교정

부모 실제 검수에서 발견한 같은 높이의 새/개 두 마리 짝 배치를 좌표만 교정했다. [교정 중간 화면](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-reviews/stage1-sections-20261019/roster-scatter-middle.webp) · [전체 배치](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-reviews/stage1-sections-20261019/roster-scatter-overview.webp) · [국소 근거](roster-scatter.json). 위 최초 화면과 JSON은60fa9eb의 이력이며 이 절의 화면/좌표가 후속 교정이다.

공중 새는 x1328.4/y1981.3과 x3077.49/y1695.4568의 서로 다른 빈 공중 공간에 놓았다. 지상6마리는 x950/1830/3270/4080/4710/5490.78의 각기 다른 어깨와 상부 돌에 놓았다. 원본과 clone ID를 가까이 붙이는 기준을 없앴다. 초기8명·능력/HP·XP·행동상한2·지형/그림배율·목표·revision4는 유지한다. 기존 진행 중 전투는 저장 좌표를 유지하며 새 진입/재시도에만 새 배치가 적용된다.

확인은 새 배치의 공중 body 여유/지상 접지와 지상2초 물리, 이미 도달한5820world 체크포인트에서 최종 목표 접근, 실제 중간/전체 배치 두 화면뿐이다. Runtime/외부 chapter의8개 좌표 일치·콘솔0. 전체 build/검사/모바일/캐시 검사를 반복하지 않고 해당 chapter와 의존 해시6개 및 진입 HTML/manifest만 갱신했다.212개 다른 활성 생성물은 동일하다. 공개60fa9eb의 화면은 부모 환경에서 확인됐으며, 이 교정 작업에서는 공개 접속 실패 해결을 재시도하지 않는다.
