# 공통 화강암 /2장 검토 후보

판정: **공통 자산 구현·기능 보존 검사 완료, 미술 통과 아님. master 미반영·미배포.**

원본 자산 단위 cc1d6b6af7cfd4c05a4dbcc6449cf99f13f75753, 최종 실행 소스03388581abe65f11b3b5d6f3339455b6bc7258f1. 이후 ea5db15ed8af647ca606a8f640eb8c60faa8456e는 최신 master edf712e910a08d73dd4490dfe017060308bcfa0f의 저장 테스트/문서만 병합했다. 런타임/생성 빌드는03388581과 같다. 최종 증거 커밋은 별도이며 SOURCES.json에 소스/원본 PNG 해시를 기록한다.

## 구현과 실제 경로

- 원본3종: shared/assets/environment/geology-granite-{vertical,foundation,ledge-neck}.svg. 특정 장의 좌표·캐릭터·나무·실제 발판·래스터 이미지가 없다. metadata/foot/socket/배율 범위는 [ASSETS.md](ASSETS.md).
- tools/environment/build-geology-art.mjs → shared/build.mjs의 applyGeologyArt → 활성 Library848개(기존845+3) → shared/runtime/geology-art.js의 prepare/draw → Scene.landmark(canonical-element) → HonroVectorArt.draw.
- tools/environment/act1-scene-composition.mjs의2장 design.geologyComposition은 인스턴스/지지점만 정의한다. 수직4/하부4/암턱 연결7. 뒤 장식용 rearDatum은 화면 외곽 기반이며 실제 보행/충돌 면을 뜻하지 않는다. 공유 코드에2장 절대좌표 도형/색면 목록이 없다.
- 2장 rooted-pine3개는 승인1장51e0b2b와 같은 SVG 원본/공통 assetId를 사용한다. 기존 Continue의 ravinePine도 그 공통 자산으로 그린다.
- 실제12장 지도는 수정하지 않았다. tests/geology-composition.mjs의12장 크기/좌표 예시는 **합성 단위 검사**로, 동일 자산의 좌표 독립성만 검증한다.12장 적용/플레이 완료 근거가 아니다.

## 직접 연 검수 화면

원본 source-review는 초기 검수, source-final은 최종6장이다. .98/1배 전체와 상/하부1배, 실제 영웅 높이92 대비 지지/연결 및 승인 화강암을 직접 열었다. 첫 원본의 밝은 상면 반복을 발견해 부분 상면으로 줄였고, 배치 검수 후에는8개를 더 제거하고 동쪽 돌출부 높이를 엇갈리게 했다.

1. stage02-review/round1: 전체 형태·지지 연결4장. 기존 거대 직사각형 면을 대체했으나 반복 상면과 화면 가장자리의 기존 평평한 암면 이음을 발견했다.
2. stage02-review/round2: 같은 카메라4장. 선택적인 상면과 공통 외곽 모듈 배치로 반복 띠/내측 이음을 줄였다. 실제 암턱과 뒤 연결부의 재질 차이는 남았다.
3. stage02-review/round3: 일반·전체·고지 근접·동쪽 연결·모바일6장. 도로 연속성/상여 실루엣을 확인했다. 기존 암턱의 판 형태와 덩어리 쌓임 인상은 남는다.

별도 최종: stage02-final의8장 + landscape의 가로 도로/가로 축소/세로 고지/실제 영웅4장. 모두03388581 소스이며 일반/전체/근접/모바일/가로 화면을 직접 열었다. navigation의 진입 대사, 실제3라운드 Continue, 결과/쉼터/3장 진입5장도 직접 확인했다. 테스트 숫자나3회 횟수를 미술 합격으로 해석하지 않는다.

동일 카메라 전후: 이전 stage02-layered-road/common-v3/final/stage02-overview.png 및 stage02-road-start.png ↔ 이번 stage02-final의 동명 PNG. 카메라/viewport는 capture.json 참조. source-final과 비교 그림은 원본 런타임 캡처이며 이미지 생성·편집은 하지 않았다.

## 통과한 관련 검사 / 보존 범위

- npm run build, tests/web-split.mjs: 생성 해시/byte수,30장 데이터·848 Library 재구성, 실제 Game/embedded/Workshop 연결 통과.
- tests/geology-modules.mjs:3개 원본 등록 재실행 안전·bounds/socket·collision0, 기존30장과 기존 Library 내용 보존.
- tests/geology-composition.mjs: 허용 배율·지지/socket 연결·평행 이동 재사용·draw view 캐시·battle JSON 불변. 잘못된2배 확대는 거부.
- tests/stage2-layered-art-invariants.mjs: 실제 fresh/기존R3/기존R21 저장의 전체 Scene 렌더 불변, warm Path2D 생성0, 정지 cache 재사용, 실제 고지 화살74damage, 기존1장 Canvas pixels 일치. 캠페인 원본 전체/Stage2 물리·공중AI·map revision 소스는 ddb32fa0와 동일.
- tools/testing/stage2-layered-navigation.py: 새 시작 x290/y588.529, 상여 x180/y2860, 실제R3 Continue 상태, 기존 정상R21 승리 저장의 보상/담허 합류/쉼터/3장 연결 통과. 브라우저 오류0.
- 기존 정상 자원21라운드 호위 승리 실행은 재사용했다. 이번 작업에서 전투21라운드를 다시 진행한 것이 아니다. 기존 Damheo M06→LM06 정규화는 ee73add5에서도 재현한 기존 동작이며 navigation.json에 명시했다. 신규 렌더의 저장 변경으로 처리하지 않는다.
- 최신 master 스킬UI/미리보기/인트로/카메라/저장 구현을 보존했다. 전체30장 실제 화면/완주·공중AI 전체 회귀는 이번에 반복하지 않았다. 공개 사이트 접근/Pages 설정 호출도 하지 않았다.

## 남은 미술 문제

1. 최종 근접에서 기존 물리 암턱의 높은 대비/판 같은 외곽과 새 연결 암반의 넓은 면이 아직 다른 재질처럼 읽힌다.
2. 수직 모듈의 둥근 돌출부가 일부 구간에서 쌓인 덩어리로 읽히며, 같은 원본을 양쪽에 쓰는 반복성이 남는다. 무작위 삼각형이나 작은 바위 격자로 메우지는 않았다.
3. navigation/entry-dialogue.png처럼 진입 대사 카메라가 왼쪽 세계 바깥까지 크게 펼쳐지면 새 공통 암반 밖의 기존 평평한 암면이 보인다. 일반 전체도보다 범위가 넓다. 카메라를 바꾸거나 이를 숨겨 통과시키지 않았다.

따라서 기능 통과와 별개로 이번 미술을 최종 합격/전장 완성으로 보고하지 않는다. 부모 실제 픽셀 판단 전 master 반영/배포하지 않는다. 대표 Library 파일은 LIBRARY.json에 기록한다.
