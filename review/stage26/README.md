# 26장 지상에 남은 증언 — 미술 검수 초안

기준 master: `d7c1f8457dd33decda5481c7c3b57d8505f6f157`. 이 브랜치는 26장 전용 검수본이다. 10월16일 이미지별 사전승인 대기는 해제됐고, master 병합·Pages 배포는 부모 통합 조율 전까지 하지 않는다. 정상 브라우저 전투, 군집별 실제 행동/효과 추적, 독립 교전 acceptance gate는 미완료다. 완성/품질 승인으로 해석하지 않는다.

묘역 비탈 안쪽 낮은 기록실, 아래로 열린 불탄 작업마당, 양끝에서 기본 점프로 오르고 반대끝으로 내려오는 작업로, 동쪽 주민 초가/퇴칸, 짧은 귀환 둑을 구별했다. 맵 크기·목표 순서·두 동행 분할·필수 증언·획득 정책은 그대로다. 종 거푸집이나 이곳에서 대종을 주조했다는 새 이야기는 없다. 아래/위 길의 사격/은폐 관계와 긴 목재 작업로의 미관은 추가 사람 검수 대상이다.

## 실제 이미지

`before-desktop-overview.png` / `after-desktop-overview.png`를 먼저 비교하고 `record-room`, `workshop`, `refuge`, `entry` 확대를 본다. `before-mobile-*.png` / `after-mobile-*.png`는 390×844 터치 프로필이다. 총 20개는 실제 Game 브라우저 캡처이며 생성 목업이 아니다. 별도 `after-workshop-stage-view.png`, `after-workshop-playtest.png`도 있다. `browser.json`은 요청/실제 카메라 x/y/zoom을 기록한다. storyTween을 비우고 전후 동일 실제 카메라를 확인했다. 준비한 단독 진입 기록을 사용했고 실제 사용자 저장에는 접근하지 않았다.

Library 업로드는 부모 전달 담당에게 맡기고 이 worker가 직접 실행하지 않았다. 사용자 지시에 따라 PNG를 브랜치 `review/stage26/`에 보존했다. 부모가 브랜치를 push하면 해당 PNG를 다운로드할 수 있다.

## 검사와 경계

- `node tests/stage26-place.mjs`: 다른 29장·기존 라이브러리 asset 객체 정확 보존, 생성기 재현, 같은 5개 목표, knight+occultist 각각 아래 주동선 왕복과 위 작업로 양방향 점프 진입/반대끝 지상 복귀 8경로 통과. 유한 기본 이동·점프·대기를 쓰지만 지형 격리를 위해 다른 배우를 제거하고 승리검사를 비활성화한 실험이다. 정상 전투가 아니다. 통제 좌표 fixture로 조사 원본 240 거리 획득/NPC 실제 이전/반복 목표 비중복도 확인했다.
- `node tests/evidence-pickup-p0.mjs`: 기존 수집 P0 48항목 통과. `node tests/field-evidence.mjs`: 실제 소유자/비원격 획득/구조 주민 이전/합류물 보존 통과. 기존 fixture를 완화하지 않았다.
- `HONRO_BOT_ACTION_LIMIT=100 node tests/act3-playthrough.mjs 26`: 현재 production App/Engine의 준비된 정상 경지·합법 자동배분 진입 save, 실제 이동/발사/상호작용만으로 8라운드 14행동(발사 8) 승리. 적/HP/좌표/목표/자원 주입 없음. 두 동행 생존, 실제 피해 발생, 아이템 미소모. `native-normal.json`. Canvas/menu/storage doubles이므로 실제 브라우저 정상 전투나 이전 막부터의 연속 완주가 아니다. 총원/완주는 군집별 실효성 증거를 대신하지 않는다.
- 현행 26장 authored events/hold waves는 0이며 그대로 보존. 구형 `act3-reinforcements`의 workshop-brace/2턴 장부 방어를 되살리지 않았다.
- `python tests/stage26-place-browser.py`: 실제 desktop/mobile 장면과 reload→Continue의 지형/목표 동일성, Workshop stage view/Playtest 동일 revision 통과. 정상 브라우저 전투 완료는 미검증.
- `npm run build`: Game/Workshop 재생성. 전체 verify는 실행하지 않았고 기존 baseline binding-detail/migration/integration fixture를 변경하지 않았다. 승인된 history contract layer는 부모 지시대로 아직 연결하지 않았으며 exact source/build delta는 `delta.json`에만 보존했다.

## 위치와 저장

hidden-latch (780,2392.86), investigation-record (1440,2400), artisan-resident/NPC (4760,2150), casting-tally 표시 (4860,2150), exit (6680,2250). casting-tally는 마커 클릭을 요구하지 않고 기존 구조 배우와 NPC 실제 위치에서 자동 이전한다. 작은 표시와 실제 출처를 같은 마당에 두되 출처 판정은 기존 P0와 같다. 새 입장만 새 데이터; 진행 중 저장은 직렬화된 원 지형/배우/진행을 유지한다.

## 참고 자료 한계

공식 국가유산 디지털서비스의 [낙안읍성 뙤창집](https://digital.khs.go.kr/heri/heriDetail.do?ctptNo=1483600940000&ctptUid=13898859685796301707) 설명에서 안마당·개방 전면·툇마루·토담의 공간관계를 참고했다. 사진 다운로드는 executor 프록시 403으로 거부되어 우회/재시도하지 않았다. 이 worker는 해당 공식 사진의 실제 픽셀을 확인하지 못했다. 기존 공식 참고 기반 한국 건축 벡터를 재사용했으며 사진을 게임에 복사하지 않았다. 외부 참고 픽셀 검수 요구는 아직 충족되지 않았다고 명시한다.

## 10월16일 지붕 동선 후속

보존 커밋 `53844a40769c25641b7e2df85a054ad6e73acacf` 이후, 26장의 공방/초가 지붕과 작업로/양끝 경사 총5개 새 asset을 기존 `open-structures.json` 정책에 등록했다. 엔진·탄도·다른 장의 지붕은 수정하지 않았다. 지붕 충돌은 기존 그림의 실제 지붕 polygon이며 실내 벽/지상에 고체 블록을 만들지 않았다. 새 입장 place revision2에만 새 데이터가 들어간다.

`tests/stage26-roof-routes.mjs`와 `roof-routes.json`: 두 동행 각각 공방 지상→처마 점프통과/착지→위 작업로 점프→기존 하강으로 실제 지붕→지붕 보행→실내 바닥 하강, 초가 지상→지붕→보행→실내 하강을 검증했다. 기본 jump/move/drop만 사용한다. 한 번의 시작 포즈/다른 배우 제거/승리 비활성화로 지형을 격리했으며 이후 좌표/자원은 주입하지 않았다. 하강시 HP·기력·이동·라운드 동일, 기존 방향성 one-way 발사체 충돌도 확인했다.

`tests/stage26-roof-browser.py`와 `roof-browser.json`: 실제 desktop/mobile에서 휘겸/소단 × 공방/초가 총8개 case의 점프·하강 버튼 입력, 지붕 착지·지상 복귀·HP 보존을 검사했다. `roof-*.png` 8장은 이 실제 지붕 위 동행의 화면이다. 통제된 시작 포즈를 둔 UI 검사이며 정상 전투 완료를 의미하지 않는다.

후속 공통정책 회귀: `node tests/platform-drop-save.mjs`의 네 동행28개 하강 save 경계와 `node tests/projectile-platforms.mjs`의6개 발사체 정책군도 통과했다. 전체 캠페인 verify는 실행하지 않았다.
