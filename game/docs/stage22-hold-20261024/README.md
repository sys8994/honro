# 22장 기록 대조의 집계 준비 상태

기준 master78818166f6f385e833f9ecd83e212b7aedb258c1에서 수정했다. 사용자 사진의 실제 기록 보유자는 원본 세이브가 없어 확정하지 않는다. 별도 재현에서는 실제 소단/설오 상호작용으로 두 기록을 받은11턴 checkpoint를 준비했다.

원인은 표시 범위에 있는 인물과 실제 기록 보유자를 혼동하게 하는 HUD다. 일반 수비는 radius460,높이차<=150을 쓰지만 이 목표는 기존 물리 기록 두 개가 carry 상태이며 각 보유자가 지점과 거리<420/높이차<100, 서로 거리<180/높이차<100이어야 집계를 시작한다. 이 조건은 원래 존재했다. raw summary에는 설명이 있었으나 progressive HUD가 일반2턴 문구로 덮었다.

기준788의 실제 정상 App/rAF에서 두 보유자가 같은 바닥/표시 범위 안이고 간격240이면 두 적 턴이 실제 끝나도 progress0,guarded=false,contested=false였다. 하층 적은 점유 범위 밖이다. 수정은 기존 predicate를 그대로 읽는 comparisonState로 실제 보유자 이름과 집계 대기/중단/진행을 표시한다. 보유자 대신 원 안의 다른 인물을 이름으로 표시하지 않는다. 기록 회수가 필요하면 회수, 지점/보유자 근접이 부족하면 중앙/모으기를 안내한다. 기존 마커와 집결 지점은 유지했다.

유지 횟수는 충족했지만 기존 유한 증원 입장이 대기 중일 때0턴 더 기다리라고 하던 공통 hold 안내도 행동 종료/경고 확인으로 고쳤다.29장 담허 전용 유지가 일반 범위 문구에 담당자를 숨기던 같은 계약 오류는 담당자 이름을 보이게 했다.21/29장의 적 턴 집계도 확인했다. 원래 거리·높이의 strict/inclusive 경계,2회 조건,증원2명,3명 적 행동 제한,목표 순서/출구/지형/전투/보상/저장 규칙은 변경하지 않는다.

## 확인한 경로

- `node tests/stage22-hold-p0.mjs`: 실제 기록 수령과 준비 checkpoint, 원 안/소지자 간격 불일치, 원래420/180/100 경계 동치, 실제 보유자와 다른 화면 인물 구별, legacy non-field 조건, 라운드와 적 턴 구분/중복 방지, JSON 상태 및21/29 공통 계약.
- `HONRO_STAGE22_BASELINE=1 python tools/testing/stage22-hold-p0-browser.py`: git의 기준788 HTML만 로컬 request에 제공해 기준 immutable graph를 그대로 실행한다. 정상 App.frame에서 실제 방어 입력으로 두 적 턴 종료 후에도0이며 HUD는 일반2턴인 전후 원인을 확인했다.
- 기본 browser 실행: 준비11턴 Continue→실제 키보드/동행 선택으로 기록 모으기→기존 경고/행동 기회로 증원2명 입장→유효 적 턴1회→autosave/reload/Continue에서 같은1회/증원ID 유지→유효2회→실제 기존 출구 이동→클리어 모달→쉼터→23장 진입.14턴에 완료했고 하층8명과 표시 층 밖 등불2명이 남았다. 최초 증원 출현 중 조건이 끊긴 적 턴은 원래 계약대로 집계되지 않았다.
- `HONRO_STAGE22_PENDING=1` browser 실행:2회 완료/증원0인 과거 저장 상태를 초기 fixture로 준비하고11턴 Continue에서 진행을 유지했다.0턴 문구 대신 행동 종료/증원 확인을 표시하며 이후 실제 행동으로 기존 증원을 입장시켜 출구/클리어/23장까지 확인했다. 이 분기의2회는 준비된 저장값이며 새로 획득한2회라고 주장하지 않는다.

브라우저는 App.frame을 끄거나 직접 tick을 돌리지 않는다. 원래 Scene.render 호출을 유지한다. 최초 준비된 prior-court clear/receipt/pose/11턴/카메라 외에 진행·좌표·HP·행동력·적 턴 값을 외부에서 쓰지 않는다. 앞선 구역의 응답은 이미 처리된 checkpoint로 준비해 늦게 재생하지 않는다. 실제 입력/모델 상태와 픽셀을 확인한 국소 재현이며 전체 캠페인 정상 자원 플레이나 실기기/공개 검증은 아니다. 사용자의 진행 데이터는 읽거나 삭제하지 않았다.

검사기는 한 차례 집계 후 출구 이동을 하지 않았고, 또 한 차례 정상 휴식터의 engine=null을 로그에서 잘못 읽었다. 유효한 기존 출구 이동과 null-safe 로그로 고쳐 최종 경로를 통과했다. 이는 게임 소프트락과 구분한다.

## 좁은 HUD 후속 확인

390폭의 긴 안내가 말줄임되는 부모 피드백에 따라22장 비교 목표의 문구만 줄였다. 간격 부족은 실제 이름+`를 모으세요`, 지점 밖은 이름+`를 중앙으로`, 준비 완료는 `수비 0/2`·`수비 1/2`다. 기록 회수/범위 안 적/증원 대기도 짧게 표시한다. 헤더 DOM/CSS와 판정·턴수는 그대로다.

`python tools/testing/stage22-hud-width-browser.py`에서360×844/390×844 touch의 정상 App.frame과 원래 Scene.render를 유지하고 각 상태60프레임 뒤 실제 Range 폭·clientWidth·scrollWidth와 네 장의 픽셀을 확인했다. `소단·설오를 모으세요`는83.98px/가용98px(360),122px(390), `수비 1/2`는32.72px/같은 가용 폭이다. scrollWidth=clientWidth이며 말줄임이 발생하지 않는다. 페이지/앱 오류0. 이 짧은 검사의1/2는 초기 저장 fixture이며 실제 획득이라고 주장하지 않는다. 실제 두 적 턴/중간 Continue/클리어/23장 증거는32d92f6b에서 통과한 위 경로를 재사용했다. 최신 문구 native 검사와 최종 build/web-split/762파일 보존을 다시 확인했고 긴 클리어를 의미 없이 반복하지 않았다.

## 빌드와 증거

최종 entry `web/entries/game.64a30efb63ac06fc.js`, 활성414파일, manifest SHA256 `8e28cecf1168e2f6e7852b60746233971d163268c0a56e42aa18732d664629a2`다. build/web-split 및 기준788 전체414파일/기존35개 발행 그래프를 포함한762파일 hash/bytes 검사가 통과했다. 기존 발행 메타데이터는 그대로이며788은 기준 그래프로 보존하고 발행 시간/Pages run을 만들지 않았다. engine·assets·map·data·CSS·main/story/audio·hold 판정 source와 신규 SFX/VFX는 기준과 동일하다.

[원격 선별 사진과 준비 조건](https://github.com/sys8994/honro/tree/review/stage22-hold-clear-20261024/game/docs/stage22-hold-20261024/screenshots)은 별도 review 브랜치에 있다. 자동 로그/전체 캡처는 `_local/reports/stage22-hold-20261024/`다.

사용자 Library libfile_1d73e6742c508191bd4d09387e7d2642의1000047907.jpg는 지원 prepare 성공 후 byte 전송이 download failed로 종료됐고 `/workspace/honro-stage22-user-evidence/1000047907.jpg`는 생성되지 않았다. 다른 환경 경로를 가정하거나 원본 픽셀을 보았다고 하지 않는다. 원본 사용자 세이브가 없어 사진 속 소지자/간격을 확정하지 않으며 위 재현과 구분한다. 공개403은 우회하지 않았고 master/Pages 반영은 부모가 한다.
