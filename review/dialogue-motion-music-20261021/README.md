# 대사 카메라 이동·9/10장 음악 검수

최신 통합: [조이스틱 master 호환 검수](integration/README.md). 소스 `3e97e1df6fb3985a98fb4442c40d4894d7aa4c8a`, master `bafc275c…` 보존, 원본 compositor115프레임 재확인. 아래 최초 집중 검수의 출처도 그대로 남겼다.

기준 master `27efe8ebdab24e147494196a515641e0629e4656`, 런타임 `df588060967274224bf7ae35a446e42aef3b9db2`, 재빌드 `4a39f3c07d5a68ddaee8565c2db53e8738eceac0`. 부모 검수 전 master/Pages 미반영이다. `source-context.json`에 캡처 시점의 미커밋 상태와 현재 원본 해시를 구분했다.

전체 원본 Library ZIP: `libfile_2ce48e13127c8191927cc79ffa20f87c` (최신 통합 추가본 포함, v1), 저장 성공.

[화면·네이티브 연속 프레임 재생](index.html), [카메라 시계열 CSV](camera-timeline.csv), [전체 정책 CSV](policy-catalog.csv), [정책 원본](policy-catalog.json).

## 수정

목표 fitting과 현재 화면을 분리하고 중심/로그 줌을 하나의 임계 감쇠 응답으로 보간한다. 빠른 다음/이전은 현재 위치와 속도로 재지정하며 대기열이 없다. legacy focus/resize zoom/경계 clamp의 경쟁을 막고 reduced motion을 존중한다. 유형별 최대 배율은 인물.82/대화.78/사물.8/상황·목표.72이며 실제 대상 union이 크면 더 넓게 fitting한다. 10장은 멀리 남은 동행과 양옆 진을 한꺼번에 잡던 구도를 동쪽 위협 소개와 소단 주변 실제 근접 수비 집단으로 나눴다. 지형·대사 원문·물리·성장·main.ts는 수정하지 않았다.

9/10장의 새 전투 playlist/session 경계에서05를 먼저 선택하고 이후02→03→04→05 순환한다. 반복 프레임·pause·unlock에서는 같은 스트림/seek를 유지한다. 저장 Continue의 새 플레이어는05로 시작하며 재로드 전 음악 seek를 저장하는 기능을 새로 만들지는 않았다. 제목 메타데이터는 `산 자와 남은 자` 그대로이며 표시만 `배경음 - 제목`이다.

## 집중 검수 3회와 최종 종합

1. 이동 연속성: 실제 Chromium80화면/2,976 rAF 표본, 빠른 다음·이전의 입력 순간 좌표 불변, resize·reduced motion·Continue·넘기기 복귀 통과.30px 이상 정지 대상40전환의99.5% 접근266.6–316.7ms(중앙300ms). 별도2장4/11→5/11의 원본 compositor 프레임109개와 실제 타임스탬프를 보존했다. 재생 화면은 원본 JPEG를 순서대로 보여 주며 합성/편집 이미지가 아니다.
2. 구도 가독성:1장 수레·실제 설명,2장 절벽/리버스샷,10장 동쪽 위협과 소단 주변 집단,19/28장 대화를 desktop/mobile에서 직접 확인했다. 집단12화면은 세 동행을 실제 지지면에 놓은 검사 fixture다. 원래 멀리 있는 동행은 camera group에 끌어오지 않는다.80+12화면의 대상 포함/overflow/누락/pageerror0. 숫자 통과를 모든 화면의 미술 합격으로 확대하지 않는다.
3. 음악 상태: 실제 MP3 스트림20전환과120회 반복 update/unlock·visibility pause/resume·retry·Continue, 일반3장의05순환·타이틀 복귀·우하단 정확한 제목/390px 폭을 확인했다. ended/visibility는 경계 검사 합성 이벤트이며 전체 곡 청취나 실기기 음질 판정이 아니다.
4. 최종 종합: 위 수정 이후 원본 재빌드/248개 생성파일 계약, 실제 witness 보행→방어/행동 경계→설명20초 유지·한 입력 한 페이지·이전·Continue·넘기기·중복 방지, 수동 설명/대화 조작·정지 피드백 회귀 통과. 연속 프레임의 초기 구간/중간/종료도 직접 확인했다. 중간 exec 연결 단절로 빈 응답을 보낸 로컬 서버는 복구했고 최종 검사 오류0이다.

전체 verify·30장 정상 전투 완주·실기기는 미실행이다. 이전 작업에서 기록한 무관한 기존 실패를 이번에 고쳤다고 하지 않는다. 부모 통합 순서에 따라 master와 공개 Pages는 보류한다.

## 전 대사 정책 목록 범위

276등록 시퀀스 중 현행 맵과 분할 버전이 다른 구형24/27장2개는 제외했다. 현행274시퀀스769페이지의 카메라 지정·유형·실제 대상·배율 상한을 목록 검사했다. 이번에 전수1,538화면을 재촬영하지 않았다. Git에는 아래 핵심 화면과 시계열/정책/검사 원본을, 전체80화면·12집단 화면 등 원본은 Library ZIP에 제공한다.

|장|시퀀스|정책 페이지|유형별 페이지|
|---|---:|---:|---|
|1|6|20|portrait:5, object-introduction:11, objective:1, situation:3|
|2|9|40|situation:7, portrait:6, object-introduction:5, conversation:21, objective:1|
|3|10|45|object-introduction:5, situation:4, conversation:29, portrait:6, objective:1|
|4|6|20|situation:2, object-introduction:7, conversation:9, objective:1, portrait:1|
|5|8|20|situation:4, object-introduction:7, conversation:8, objective:1|
|6|7|22|situation:4, object-introduction:2, conversation:11, objective:1, portrait:4|
|7|7|26|situation:3, object-introduction:1, conversation:14, objective:2, portrait:6|
|8|5|16|situation:5, object-introduction:6, objective:1, conversation:4|
|9|8|37|situation:12, object-introduction:6, objective:1, conversation:11, portrait:7|
|10|13|53|situation:17, conversation:14, object-introduction:2, portrait:18, objective:2|
|11|17|42|situation:13, conversation:16, objective:3, portrait:3, object-introduction:7|
|12|6|18|situation:5, conversation:8, objective:1, portrait:1, object-introduction:3|
|13|7|24|situation:6, object-introduction:3, portrait:10, conversation:4, objective:1|
|14|11|29|situation:9, conversation:6, objective:1, portrait:13|
|15|6|16|situation:6, object-introduction:5, objective:1, conversation:3, portrait:1|
|16|9|26|situation:6, object-introduction:4, objective:1, conversation:12, portrait:3|
|17|12|24|situation:10, object-introduction:4, conversation:6, objective:1, portrait:3|
|18|14|52|situation:10, object-introduction:6, portrait:11, conversation:23, objective:2|
|19|11|27|situation:8, object-introduction:2, conversation:14, objective:1, portrait:2|
|20|8|23|situation:8, conversation:9, portrait:4, objective:1, object-introduction:1|
|21|7|14|situation:5, object-introduction:1, conversation:5, objective:1, portrait:2|
|22|10|16|situation:6, object-introduction:2, objective:1, conversation:6, portrait:1|
|23|11|20|situation:11, conversation:2, object-introduction:2, objective:1, portrait:4|
|24|10|28|situation:17, object-introduction:8, objective:1, conversation:2|
|25|10|19|situation:8, object-introduction:2, conversation:7, objective:1, portrait:1|
|26|7|14|situation:6, object-introduction:2, objective:1, conversation:2, portrait:3|
|27|10|20|situation:7, object-introduction:2, conversation:9, objective:1, portrait:1|
|28|10|23|situation:11, object-introduction:5, objective:1, portrait:4, conversation:2|
|29|8|16|situation:8, object-introduction:2, conversation:4, objective:1, portrait:1|
|30|11|19|situation:9, object-introduction:2, objective:1, conversation:5, portrait:2|
