# 부모 피드백 반영 — 26장 지상 원경 / 대화 없는 추가 캡처

30장 이미지 연결 완료와 미술 세부 보완을 구분한다. 이번 변경은 26장 원경 한 장과 검수 캡처 도구뿐이다. **master/Pages 미반영, 부모 미술 판단 대기.**

이전 225컷은 당시 빌드의 증거로 보존한다. 그중 26장 동굴 원경은 잘못된 후보이며 이 폴더의 지상 원경으로 대체한다. `skyVisible:false`/`hiddenWaterworks`는 동굴 서사 근거가 아니다. `shared/runtime/act3-content.js`는 장소를 ‘묘역 기록실과 불탄 공방’, 서술을 ‘휘겸과 소단은 지상에 남았다’로 명시한다. `act3-journey.js`도 ‘묘역 옆 지상길’과 지상 공방을 명시한다. 새 회화는 묘역, 소나무 숲, 낮은 기록실과 불탄 공방이다. 기존 지형·scene 플래그·충돌·캐릭터·배치는 수정하지 않았다.

일반 빌드 통과. 재사용 캡처 도구로 7/22/26/12/13/20만 실행했다. 게임 ‘대화 넘기기’ 동작으로 대화를 닫고 턴 배너가 만료된 뒤 이전과 같은 시작 카메라 위치로 촬영했다. 42개 표준 화면 + 중심 6컷 + 전환 9컷 =57컷. JS 오류0, 42뷰 원경 준비·coverage·render battle 불변 검사 통과. 전환 9컷은 기존 천장 좌표 기준 실외/중간/실내(alpha 0/.5/1)를 기록한다. 실제 보행 전 구간 완주 검사는 아니다.

6장의 normal/wide/mobile 일반·축소를 묶어 직접 확인했고, 26장 확대·중심 및 12/13/20 전환 9컷도 직접 확인했다. 26장의 거대 종유 동굴은 사라졌고 지상 마당의 장소와 연결된다. 22장 기존 구조 가림은 보존했다. 12/13/20은 원경 전환 시 잘린 수직 이미지 경계가 없지만, 중간 단계의 두 회화 중첩과 기존 암반 가림에 대한 미술 판단은 남는다.

실행 코드 `913299720502080dfb3ecffb90553ca1ddceb022`, 빌드 `game.5089b8b7fda5695d.html`.

|장|대화 없는 화면|
|---|---|
|7|[normal](stage07-1440-normal.png) · [wide](stage07-1920-normal.png) · [mobile](stage07-390-normal.png) · [축소](stage07-1440-max-out.png) · [확대](stage07-1440-max-in.png)|
|22|[normal](stage22-1440-normal.png) · [wide](stage22-1920-normal.png) · [mobile](stage22-390-normal.png) · [축소](stage22-1440-max-out.png) · [확대](stage22-1440-max-in.png)|
|26|[normal](stage26-1440-normal.png) · [wide](stage26-1920-normal.png) · [mobile](stage26-390-normal.png) · [축소](stage26-1440-max-out.png) · [확대](stage26-1440-max-in.png)|
|12|[normal](stage12-1440-normal.png) · [wide](stage12-1920-normal.png) · [mobile](stage12-390-normal.png) · [축소](stage12-1440-max-out.png) · [확대](stage12-1440-max-in.png)|
|13|[normal](stage13-1440-normal.png) · [wide](stage13-1920-normal.png) · [mobile](stage13-390-normal.png) · [축소](stage13-1440-max-out.png) · [확대](stage13-1440-max-in.png)|
|20|[normal](stage20-1440-normal.png) · [wide](stage20-1920-normal.png) · [mobile](stage20-390-normal.png) · [축소](stage20-1440-max-out.png) · [확대](stage20-1440-max-in.png)|

|전환부|실외 → 중간 → 실내|
|---|---|
|12|[0](stage12-transition-0.png) · [0.5](stage12-transition-0.5.png) · [1](stage12-transition-1.png)|
|13|[0](stage13-transition-0.png) · [0.5](stage13-transition-0.5.png) · [1](stage13-transition-1.png)|
|20|[0](stage20-transition-0.png) · [0.5](stage20-transition-0.5.png) · [1](stage20-transition-1.png)|
