# 승인 스킬 이미지 전용 표시 · 복구

5987f6db 공개 보존 entry에 실제 이미지 응답 지연을 주면 사용자와 같은 설오 절명트리 급소시/관통시/회기시/정심/절명시의 옛SVG가 나타났다. 이는 로딩중SVG를기본으로넣는icons.ts와 실패후SVG를남기는CSS/loader의 직접결과다. 원래로더는8초timeout이 없고3회실패후cache가영구error로남을수있으며, retained error노드는온라인이벤트외재관찰이없었다. 공개이미지84개가전역삭제됐다는증거는아니다. Library1000047863.jpg는정상전송도구의download failed로파일이생기지않아직접픽셀을열지못했다. 우회하지않고부모가확인한설명과생산UI로재현했다.

[실제캠프 이전벡터/지연중중립/완료이미지](evidence/camp-before-placeholder-ready.jpg). 원본기예그림은변경하지않았다.84스킬ID의생성markup에SVG자체가없으며중립프레임과img만있다. loading/error/timeout에서크기는같고옛벡터로바뀌지않는다.전용REDESIGN_PATHS/GOURD/STAKE/skillPath및미사용24범용path를source/새activegraph에서제거했다.공용직업/지도/아이템/조작36기호와crest는기존출력과같다.상호작용없는standalone의2skill표시caller도ID경로로바꿔별도s.icon분기를남기지않았다.플레이/저장/밸런스데이터는불변이다.

공유cache84/예약4개를유지하며8초timeout은큐를풀고기존이미지리스너는늦은성공을받는다.오류는연결된노드에한해750/1500ms간격으로최대3회자동시도하고이후재진입으로다시유한시도한다.요청중/준비된URL은공유하고재시도timer/분리노드구독을정리한다.화면patch의같은skill하위DOM을유지하고error/timeout을재관찰한다.매frame루프는추가하지않았다.타임아웃후재진입은기존pending요청을정리해중복job을쌓지않는다.준비된이미지는반복src설정하지않는다.

정상/slow/일시503/404후재진입/8초timeout후late success의5조건×10소비표본(4인캠프의tree/slot/passive,active/passive상세,slot목록,허공터picker,toolbar/HUD,실제HUD클릭)에서실이미지와SVG0개를확인했다.모든조건최종cache84/decoded84/targets0.정상·slow·timeout은84요청,503은5대상각2회로89,404는5대상자동3회+재진입1회로99였다.timeout의A14는동일1요청늦은완료로복구됐다.20회camp갱신/12회HUD실제클릭의이미지노드유지·추가request/decode/srcWrites0.이숫자는브라우저전체paint/GPU/FPS계측이아니다. [5조건/50표본](evidence/after.json), [이전재현](evidence/before.json), [timeout중립](evidence/timeout-placeholder.jpg), [404중립](evidence/404-placeholder.jpg).

실행rawHEAD는5987f6db+이단위미커밋소스/빌드다. [실행source해시](evidence/executed-source-sha256.json), [build](evidence/build.txt), [84원본/이름·효과보존](evidence/native.txt), [SVG제거/36일반기호exact](evidence/vector-removal.txt).기존5개browser도구의옛SVG합격assert를새중립계약으로수정했지만그도구들의무관한전체시나리오는다시돌리지않았다.현재전용probe의초기준비변수참조와중단된route정리오류는harness문제였고실행을수정했다.

과거hashed자산은삭제하지않는다.성공발행5987f6db Pages39883682247/2026-10-23T01:25:17Z 및부모가직접확인한모닥불마우스드래그(소단→설오→담허→휘겸,설오선택유지)를보존한다.새activeUI의벡터미사용과과거클라이언트보존을구분한다.5987카드drag/c8초상/d196카메라원문은보존한다.목표안내버튼행은다음독립수정이며최종통합검수는후속기록으로확정한다.master/Pages는부모담당이다.Chromium headless/touch모사이며실기기/Safari·전체캠페인·원경로더개편은미실행이다.
