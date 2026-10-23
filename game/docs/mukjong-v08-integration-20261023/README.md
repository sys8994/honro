# 승인 묵종 v08 연결

기준 master4487dbac994f9b9d7014124fcdf7400b75d51615. 승인 원본은0652fe879710e117b9d821e18a0b805bcc860d62의 `art/environment/mukjong-v07-review/mukjong-vector-08.svg`이며 활성 `shared/assets/environment/stage18-hollow-bell.svg`와 바이트가 같다. 그림의 형상·색·장식·구멍 없는 측면을 수정하지 않았다.

기존 순수 벡터 Canvas 경로에 원본의 타원·변환 목록·로컬 path clip 지원만 추가했다. 타원은 동등한 두 SVG arc, 변환은 동등한 행렬로 컴파일한다. 이미지 로더/비동기 폴백은 신설하지 않았다. 기존 Path2D 캐시를 사용하며303노드로512런타임 상한 이내다. 종 한 에셋의 저작 상한만400으로 허용했다.

원본 바닥 중심600,1620을 기존 local0,0에 맞춰2.7배 균일 배치한다. 기존 bounds·anchor·충돌·플랫폼·18/19장 요소와 기믹 데이터는 그대로다. 18장 body는7200,6610, 19장은7200,6810이며 하강200을 보존한다. 승인본에는 옛 구멍 clip·청동 색 덧쓰기·지형 외피 그림·추가 외곽선을 적용하지 않는다. 구 저장 속 옛 에셋은 렌더할 때만 현재 승인본을 참조하며 저장 객체를 바꾸지 않는다. 이전 공개 클라이언트용 hashed 파일 보존과 새 실행의 옛 그림 폴백은 구분한다.

`node tests/mukjong-v08-integration.mjs` 통과: 승인 원본 exact, 프로젝트의 모든 장·다른 에셋 exact, 두 장의 전체 컴파일 전투가 그림 메타데이터 외 exact, 하강 후19 충돌/앵커 exact, 구 객체 무변경·옛 clip 우회, 컴파일 안전성. `node tests/vector-assets.mjs`의 기존9종 native vector/캐시/안전성, syntax/build/web-split 통과.

`python tools/testing/mukjong-v08-capture.py`로 실제 debug UI→여정첩→18장 진입, 생산 Scene 고정 검사 카메라의 전체/근경,19장 factory 진입을 캡처했다. 캡처 전후 전투 JSON exact, pageerror/HTTP실패0. 원본 SVG 대비 Canvas mean channel difference0.0006384/255(600×900, 가장자리 안티앨리어싱의 최대10). 이는 기계적 연결 동등성 검사이며 미술 재검토가 아니다. 실제 전투 완주·실기기 검사·새 공개 검증은 하지 않았다.

증거: `_local/reports/mukjong-v08-integration-20261023/`의 `stage18-full.jpg`, `stage18-near.jpg`, `stage19-full.jpg`, `capture.json`, `contracts.json`, `vector-assets.txt`, `build-final.txt`, `web-split.txt`. AGENTS에 따라 JPG는 Git에 추가하지 않는다. Library 전달 결과와 최종 커밋은 인계에 기록한다.

공개4487의 Pages39930831842 success09:20:11Z 및 실제 entry6958bfcc/카드 조작을 부모 확인 근거로 보호 이력에 등록했다. 기존261/0570/379를 포함한 공개 그래프를 보존한다. master/Pages 반영은 부모 담당이다.

실행 소스·생성물 커밋: `94882010` (`game.657ed893f86a30da.js`). 실제 캡처는 이 커밋 직전의 동일 소스/생성물이며 capture.json의 runtimeHashes로 식별한다. 최종 활성378파일·공개32그래프의11774파일 레코드 SHA/바이트 검증 통과.

Library 전달은 현재 환경에서 지원되는 prepared-upload helper로 위 JPG3개를 요청했으나 `library upload failed: hosted apps tools/list request failed: network`로 시작 단계에서 실패했다. Library ID는 없으며 재시도/별도 우회 업로드/이미지 Git 추가를 하지 않았다. 캡처는 로컬에 보존됐지만 부모 환경에는 해당 경로가 없으므로 전달 완료로 간주하지 않는다. 부모가 원격 후보를 통합·공개한 뒤 직접 캡처하거나 Library 연결이 복구되어야 사용자에게 실제 이미지를 전달할 수 있다.
