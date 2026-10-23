# 2막 시간 원고와 19장 비전투 후보

## 최신 스킬 음원 master 통합

최신 master `71cb1fa92205b3790d87f85fa31f14e7eb12afac`를 통합했다. SkillAudioPlayer·이벤트 context·소스 음원은 그대로 유지하고, Engine.fire의 context 진입 전과 private fireAction에도19장 차단을 적용했다. App은 startCharge 전에 거절하며 release/cancel의 기존 stopCharge는 유지한다. 일반64기예의180스텝 전체 전투/저장/RNG 동일성 및 나머지 SFX 실제 동작 검사72개와 player7묶음이 통과했다.19장 별도 실제 Chromium에서는 승인 은행7자산이 준비된 상태에서도 키보드/강제 fire 포인터/직접 beginCharge의 charge 호출·chargeStarts·skill source starts가 모두0이고,20장에서는 충전/실제 발사음이 정상 시작함을 확인했다.

통합 game entry는 `game.e144943bcec1fca2.js`, 활성413파일, manifest SHA256은 `5655b8129952ab24f51489d99b7642c1d2c4ae1d9ee743025c5972bd56503648`다. 공개 edf/기존33개의 발행 사실34개를 보존하고, 최신 master의 `game.bf9e42f5d682c70c.js`411파일 그래프와 기준cf2도 원본 그대로 보존했다. 중복제외754파일을 길이/hash로 검사했다. 새 master의 Pages 성공 시각/근거를 받기 전에는 이를 새 성공 발행으로 꾸미지 않고 별도 기준 그래프로 보존한다.

부모가 바로 열 수 있는 [선별4장과 준비 조건](https://github.com/sys8994/honro/tree/333a62b53efcb2cb1620265145bf47bd11e2d3f7/game/docs/act2-time-farewell-20261023/screenshots)을 별도 review 브랜치에 전달했다. 이 사진은 음원 통합 전55d0476d의 같은19장 시각 소스다. Library 공식 prepared upload는 도구 목록 조회의 network 실패로 시작되지 않았고 반환 파일 ID는 없다. 사용자 명시 요청에 따른 선별 전달본만 Git에 두며 자동 결과/추가 캡처는 계속 `_local`에 둔다. 최종 통합 소스에서도 모바일/가로/저장/읽기/20장 복구 화면을 재검사했다. 미술 판정과 공개 검증은 부모에게 남긴다.

기준은 공개 master `edf36a5fe8ff3b928918b4f5e8567a7dedac1d69`이며 부모 입력의 최종 원본은 `72da2a5179aa0eb075453ea1d2fd6a3780fbacb5`다. 두 입력 커밋을 별도 worktree로 가져왔고 patch v3의19행 교체·5곳 삽입·8장면·valueReplacements7개를 정확히 적용했다. 재사용 rowId와 기존 메타데이터를 보존하고, 새 행에는 같은 장면의 storyId/storyTitle이 있는 경우 함께 복사한다. 새 원고나 음원은 작성하지 않았다.

19장 시작부터 같은 ID의 설오/휘겸을 현장 NPC로 두고, 기존 route 상호작용을 담허가 완료하면 담허도 NPC로 두며 소단만 조작한다. 기존 프로필의4명 파티·성장·갖춘 기예·턴 순서와 HP/기력은 삭제하거나 초기화하지 않는다. 기존19장 Continue도 같은 지역 역할을 적용하되 저장 원고·커서·목표·좌표·자원을 보존한다. 이미 지불한 공격 자원은 되돌리지 않으며 진행 중이던 공격/검토는 비전투 이동으로 정리한다. 스테이지20은 기존 새 전투 생성으로4명과 공격을 복구한다.

Engine.fire는 AI 호출까지 거절하고 predict는 계산 전에 빈 결과를 반환한다. 공통 predictionGuide와 게임 Scene에서도 예상선/조준 표시를 건너뛴다. 충전·기예 선택·방어 입력을 막고,19장 HUD의 공격/기예/이동력 소모 표시는 숨긴다. 이동/도약과 대화는 기존 지형 충돌을 사용하며 이동력과 턴 소진으로 대기하지 않는다.19장만 main BGM을 선택한다. 오디오 엔진·묵종 duck·스킬음원은 수정하지 않았다.

기존 세 혼의 표시 장소·가족·단계를 유지하고 표시용 고정 alias로 새 화자를 연결한다. 전투 유닛이나 마커를 추가하지 않았다. 부모의 두 SVG 원본 경로/색을 공통 빌드에서 읽어 Path2D24개를 공유한다. 세 작별이 끝난 뒤 기존 old-soul 받침에서 선두의 손은 열린 길 쪽을 향하고 몸은 최대28world만큼 반대로 흐른다. 낮은 alpha의 두 형체는 서로 다른 방향을 향하며 reduced-motion에서는 동일한 정지 구도를 쓴다. 별도 타이머·대기·입자·blur·gradient는 없다. 기존 다음/이전/넘기기는 유지한다. 휘겸은 승인된 새 행에서 기존 바닥을 실제로 걸어 세 번째 그릇 곁에 도착한다. 받침 표식 행은 같은 단서를 물리적인 각인 확대 표현으로 보인다.

11–20장의 생성 프로젝트 JSON과 지형·목표 원본은 기준과 동일하다. 변경된 위치는 대본이 요구하는19장 NPC의 실제 보행과 표시용 혼의 제한된 움직임뿐이다. 전역 기록 퀘스트는 바꾸지 않았다.

검사:

- `node tests/act2-time-farewell-text.mjs`: 부모 patch 전체 정확 비교·기존 메타데이터/rowId·7값.
- `node tests/stage19-farewell.mjs`: 역할 전/후, 모든 기예의 Engine fire/predict 차단, 이동력/턴 소진 없음,8목표 각각 중간/완료 Continue, 구 검토 저장의 좌표/HP/기력/원고/진행 보존, 반복/이전/skip 중복 방지,20장4명/실제 발사.
- `python tools/testing/stage19-farewell-browser.py`: 실제 local Chromium390×844 touch/844×390, 키보드·터치 이동, 실제 상호작용/읽기/중간 reload, NPC 초상과 본문 비겹침, 혼의 방향/유한 움직임·감소 모션, 결과→쉼터→20장 실제 UI·4명·전투 BGM·발사 복구. pageerror/HTTP실패0.
- typecheck/build/web-split 및 종지기 보스 회귀. `tests/act2-time-farewell-preservation.mjs`는 공개 edf와 기존33개 및 기준cf2의 원본 파일/hash를 확인한다. edf 발행은 부모가 확인한 Pages run39994219540/2026-10-23T17:22:42Z로 등록하며 후보를 발행 이력에 넣지 않는다.

준비한 prior-clear 저장과 마커 접근 좌표를 사용했다. 정상 캠페인 연속 완주·실기기·주관적 청취·공개 브라우저 검증이 아니다. 공개 Pages는 이 환경의 프록시 CONNECT403으로 열리지 않았고 우회하지 않았다. 부모의 공개 HTTP entry 확인과 화면 검증은 구분한다. 미술 합격 및 master/Pages 배포는 부모 담당이다.

로컬 자동 결과와 실제 화면은 `_local/reports/act2-time-farewell-20261023/`에 있다. 주요 사진은 천도 전 `390-before-ritual.jpg`, 소단 단독 `390-sodan-alone.jpg`, 세 가족 `390-brother-family.jpg`/`390-sister-continue.jpg`/`390-hwigyeom-npc.jpg`, 무명사 혼 `390-old-souls.jpg`/`844-old-souls.jpg`, 받침 각인 `390-physical-inscription.jpg`/`844-physical-inscription.jpg`,20장 복구 `390-stage20-restored.jpg`다. 미술 판정 대신 실제 캡처를 전달한다.
