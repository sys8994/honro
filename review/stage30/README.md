# 30장 「남겨진 길」 검수 브랜치 후보

기준: d7c1f8457dd33decda5481c7c3b57d8505f6f157. 장별 검수 브랜치. 사용자 개별 이미지 승인 대기는 해제됐으며 master 통합·Pages는 부모의 단일 조정 대상이다.

## 변경

- 선창의 거대한 벽돌 세 단을 마모된 상부 돌쌓기와 하부 자연 암반으로 나눴다.
- 기존 상부 널마루 아래에 접지 목구조·가새·계류 밧줄 호롱을 그려 작업 선창의 기능을 드러냈다.
- 한 척의 낮은 짐배에 갑판 경사를 따르는 덮개 화물칸과 보관된 노를 보강했다. 움직이는 배 자체·충돌 윗면은 그대로다.
- 독립 검수에서 지적된 큰 부유 암반 인상을 줄이려고, 좁은 후면 아치/교각 대신 실제 여울·동쪽 강둑의 지지점을 측정한 넓은 암반 뿌리를 그렸다. 배경 면에는 윤곽을 두지 않고 낮은 대비로 후퇴시켰다. 원래 보행면·사선·점프 간격을 가리지 않는다.
- 장식/발판/적 숫자나 맵 크기를 늘리지 않았다. 새 벡터 하나는 이미 있는 널마루의 작업 구조이며 충돌은 없다.

## 실제 이미지

- `desktop-overview.png`: 실제 Chromium 게임 렌더러의 전체도. 편집용 축소 카메라다.
- `desktop-quay.png`, `mobile-quay.png`: 실제 초기 적 배치 상태의 선창 카메라 확대.
- `desktop-settled-ferry.png`, `mobile-settled-ferry.png`: 정착 상태를 명시적으로 설정한 미술 검수 fixture. 정상 플레이 완료 장면으로 주장하지 않는다.
- `desktop-entry-hud.png`, `mobile-entry-hud.png`: 독립 프로필의 실제 App 시작과 HUD. 검수용 카메라를 사용한다.
- `baseline/`: 변경 전 동일 런타임 Native Canvas 렌더. 브라우저 캡처와 구분한다.

부모 `/root`가 전후 선창 및 모바일 배 화면을 직접 검수했다. 첫 검수의 부유 암반 지적을 보완한 뒤 검수 브랜치 후보로 전달 가능하다는 결과를 받았다. 사용자 미술 승인이 아니다.

## 보존 및 검사

`preservation.json`: 다른 29장과 공유 자산 불변. 30장은 서쪽 지붕과 그 지붕에 지지되는 초기 적/증원 y의 +40 보정을 제외한 모든 물리·목표·적·사건·경로 필드가 기준과 동일하다. 현재 물리 stage SHA-256 `96ca1afd96378ba9dea01573054fcba6d3a00a66b96e174db7ba89cc915ef523`. 이전 미술 전용 커밋의 해시는 `75b45257ae483b36ac1d359d7fc8c5134e5fb3341fcd014ea28932389a766351`였다.

- 첫 목표는 현장 대조 reach/radius260. 옛 종이 클릭을 되살리지 않았다.
- 초기 적40/정예10, 사건 증원4/5/4와 방어 산개3, 방어3회/540/contest230, 생존한 동행 전원 same-floor 옛길 집결440 유지.
- `stage30-ferry.js`, objective revision, physics 소스 그대로. 경고 뒤 다음 플레이어 행동·안전경계·빈 쓸림 영역·0.8초 정착·점유중 기다림을 변경하지 않았다. 배는 배우를 운반하지 않는다.
- 두 HTML 최신 빌드 성공. `stage30-ferry-art.mjs` 통과: 다른 장/물리 불변, 재생성 반복 일치, 실제 지지면·선체 일치, cache 재사용·렌더 순수성.
- `stage30-ferry-traversal.mjs` 48 조건(4명×12경로) 통과. 이 검사는 지형/경로 fixture이며 정상 전투와 구분한다.
- `stage30-review-browser.py`: Chromium PC1440×900/모바일390×844 별도 프로필, 실제 App.launch/Continue 지형·유닛·목표·상태 보존 및 페이지 오류0. 이미지 renderer 캡처는 HUD 캡처와 구분한다.
- 정상 자원 native App/Engine 입력: conservative-rank1 합법 배분·실제 비용·소모품0, R11 승리, 전원 생존, 피해1178, 방어3/정착1, Continue2. `evidence/result.json`, `trace.json`, `wait-analysis.json`, `shot-evidence.json`. 이전1–29장은 보상 원장 fixture이며 플레이 완료를 주장하지 않는다. 브라우저/사람 플레이 완주도 아니다. 서쪽 지붕 보정 전의 역사적 실행이다. 변경 후 정상자원 검사는 아래 별도로 구분한다.

## 미해결·범위

- 공식 사진 조사: 국가유산청 마도1호선 복원보고서 https://www.cha.go.kr/cop/bbs/selectBoardArticle.do?bbsId=BBSMSTR_1021&nttId=32264 및 국립해양유산연구소 https://www.seamuse.go.kr/images/nrimch/kr/page/img_jounchang01.jpg (부모가 확인한 순천 해룡창지) 를 확보했으나 web/HTTP 프록시403으로 **실제 공식 사진 픽셀 검수 미충족**. 복제 사진은 게임에 포함하지 않았다.
- 기존 `stage30-ferry-contracts`/`runtime`는 과거 transport-map interact/26명 fixture 때문에 첫 비교에서 실패. 기준 d7c1f84 별도 worktree에서도 같은 실패 재현. `tactics` 역시 과거 성장원장45103≠46235로 기준에서도 실패. 원본 fixture/임계치를 완화하지 않았다.
- 전체 캠페인 verify/성능/모든 개별 군집의 실효 교전 승인 검사는 이번에 완료하지 않았다. encounter gate는 pending cluster/wave/check 항목으로 BLOCKED이며 정상 완주를 이 gate 통과나 전투 품질 승인으로 보고하지 않는다.
- Library 미전송. 사용자 검수 PNG와 설명은 이 브랜치에 보존한다. 사용자의 저장/비밀정보는 없다.

## 고지 철수 추가 검수

최종 후면 암반 수정본에서 `HONRO_FULLPLAY_BUILD=conservative-rank1 HONRO_FULLPLAY_ROUTE=high`로 정상자원 입력을 별도 실행했다. R11 승리, 방어3/정착1, Continue2, 받은 피해1015, 소모품0. 생존 동행 네 명 모두 `sf-granite-cape`와 `sf-bank-inner`를 실제로 지나 높은 철수로를 완료했다. `evidence/high/`에 원본 입력/피격/증원/자원 trace와 결과를 보존한다.

`desktop-normal-play-hold-replay.png`, `mobile-normal-play-hold-replay.png`는 이 실행의 R9 방어 완료 저장을 수정하지 않고 실제 Chromium App.continue로 복구한 HUD 포함 화면이다. 카메라만 검수 위치로 옮겼다. 브라우저 입력으로 완주했다는 뜻이 아니다.

군집 단위 한계: auto 경로의 escape-flank는 실제 피해149/행동2, high 경로에서는 우회했다. cape-watch는 두 실행 모두 행동/피해/플레이어 사격0으로, 이 두 경로만으로 해당 선택 고지 군집의 실효성을 입증하지 못했다. 원래 적 배치/활성 계약은 그대로이며 전투 품질 완료 판정은 보류한다.

## 선택 곶 접근 원본 결과와 Workshop

기존에 시작해 둔 `HONRO_FULLPLAY_APPROACH=cape` 실행은 완료되어 있었으며 재시작하지 않았다. R17 승리, 생존3명 집결, 방어3/정착1/Continue2. cape-watch는 실제 행동3/발사3, 아군에게 피해109, 아군에게 받은 피해1560, 플레이어 표적 사격4회로 선택 접근 경로에서 실효 교전했다. 다른 두 경로의 행동0은 우회 결과이며 군집 자체의 불능을 재현하지 않았다. 설오는 R10에 소단 O04의 아군 오사577로 사망했다. 이 실행은 전원 생존 성공으로 보고하지 않는다. 원본은 `evidence/cape/`에 보존한다.

실제 Workshop PC/모바일 Stage View→Playtest iframe→Stop 검사도 완료했다. 지형·미술 요소 동일, 현장 대조 reach260 유지, Stop 뒤 프로젝트 원본 보존, 페이지 오류0. `workshop-results.json`과 `tests/stage30-review-workshop.py`를 본다. 정상 전투 완주 검사는 아니다.

## 기본 점프 가능한 선창 지붕

서쪽 기존 oneWay 목재 지붕은 지면보다230~250 높아 미훈련 기본 점프217.8로 올라갈 수 없었다. 지붕을40 낮춰190~210 간격으로 만들고, 해당 지붕 지지 초기 적과 이름이 일치하는 증원 좌표만40 내렸다. 동쪽 지붕·선박·목표·기존 발판 탄 판정과 물리 엔진은 변경하지 않았다. 지붕은 충돌 윗면 그대로 회색 지붕결을 입혔으며 목구조/내부에는 solid 충돌을 넣지 않았다.

`stage30-roof-access.mjs`의 네 주인공×양쪽 지붕8사례에서 아래에서 머리 관통, 기본 점프 착지, 아래점프와 지상 복귀, 서쪽 하부 보행을 확인했다. 초기 위치와 고립된 배우를 사용하는 지형 fixture이며 정상 전투 완주가 아니다. `roof-access.json`과 `roof/`의 실제 Chromium PC/모바일 under/rising/landed/drop-return8PNG가 증거다. `roof/browser.json`에는 옛 정상실행R9 저장의 지붕5220과 전체 지형을 그대로 Continue한 대조도 있다. 저작 도구는 새 맵만 수정하며 runtime/Continue에서는 호출하지 않는다.

`desktop-normal-play-hold-replay.png`와 모바일 동명 그림은 **보정 전 저장의 옛 지형**에 현재 지붕 미술을 적용한 복구 화면이다. 다른 신규 시작/지붕 PNG와 혼동하지 않는다. 최신 build, 미술 순수성/재생성, 물리 변경 경계, Workshop PC/모바일 재검사 통과. 변경 후 정상자원1회 실행은 진행 중이며 완료 결과를 별도 보존한다.
