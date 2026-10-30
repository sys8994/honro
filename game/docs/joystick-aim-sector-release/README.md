# P0 조이스틱 조준 섹터 이탈 수정

- 기준 master: `275144983f93d0de66bbe6f44ede88a82ca36b56`
- 브랜치: `fix/joystick-aim-sector-release`
- **최종 실행 코드·빌드·테스트 SHA: `0459fe276057274129a154a7605e5f0555980ca1`**
- 아래 증거·이 문서·BUG_LOG만 후속 문서 커밋으로 추가한다. 해당 실행 SHA에서 빌드를 반복해 Git 차이가 없음을 확인했다.
- 이 브랜치만 커밋·원격 푸시한다. master 병합과 Pages 배포는 부모 검수 후 담당자가 수행한다.

## 원인과 변경

`joystickGesture`는 최초 유효 입력을 `aimOnly`/`moveAim`으로 한 번 분류한다. 이전 코드는 `aimOnly`라는 이유만으로 손을 뗄 때까지 수평 출력을 0으로 만들었다. 그래서 수직 ±20°를 벗어나 수평으로 밀어도 이동이 재개되지 않았다.

최초 분류는 그대로 유지하고, 수직 시작일 때의 이동 억제에 **현재 벡터가 수직 ±20° 안인가**를 추가했다. 안에서는 이동을 억제하고, 밖에서는 기존 수평 deadzone 출력을 전달하며, 재진입하면 다시 억제한다. 수평 시작은 수직 범위에 들어와도 새 잠금을 얻지 않는다. 매 프레임 최초 의도를 다시 분류하지 않는다.

섹터 진입/이탈에 별도 히스테리시스는 없다. 20° 포함 판정의 기존 float32 좌표 오차 허용치 0.001°만 보존한다. 단위 검사에서 20.01°도 네 방향 모두 즉시 이동 출력이 나옴을 확인했다. 기존 수평 deadzone .12/.10과 방향 전환 .60/.35 히스테리시스는 별개의 기존 규칙으로 유지한다.

실행 소스 변경은 공통 `math.ts`의 이동 허용 조건, 두 App의 기존 상태 라벨 조건, 실제 Game 조작 안내 문구뿐이다. `aimOnly`는 최초 수직 의도를 뜻하고, 밖에서 움직일 때 라벨은 기존 `MOVE-AIM`을 사용한다. 입력 소유권·reset·물리·밸런스·지형·화면 배치·아이콘 소스는 변경하지 않았다. `HONRO*.html`, `index.html`, `web/`은 공통 빌더의 생성물이며 오래된 해시 파일의 보관 세대 정리도 포함한다.

## 실제 확인 결과

| 검사 | 결과 |
| --- | --- |
| `node tests/joystick-intent.mjs` | 초기 입력/중앙 통과/재시작 120건 + 섹터 전환 380건, 5개 패드 반경 통과 |
| `npm --prefix game run typecheck` | 통과 |
| `npm run build` | Game/Workshop/embedded 공통 빌드 통과, 반복 빌드 차이 없음 |
| `node tests/charge-input.mjs` | 충전·취소·소유권·HUD 방어 126건 통과 |
| `node tests/combo-landing-turn.mjs` | S13 방향 전환/공중 제외 등 14건 통과 |
| `node tests/web-split.mjs` | 347개 생성 파일 해시/바이트·Game/embedded 진입·저장 보호 통과 |
| `python -X utf8 tests/joystick-intent-browser.py` | Chromium 154.0.8037.57, 371개 판정, 577개 상태, 698개 PointerEvent, 예외 0 |

브라우저는 실제 생성 `HONRO.html`을 로컬 HTTP로 열고 Chromium CDP touch로 trusted PointerEvent와 실제 포인터 캡처를 통과했다. 320×740, 360×800, 390×844, 844×390에서 초기 입력 상/하×좌/우 19/20/21/45°를 확인했다. 추가 390×844 검사는 같은 포인터를 유지한 채 `수직 → 19 → 20 → 21 → 20 → 19 → 21 → 수평 → 19°`를 상/하×좌/우 모두 실행했다. 이벤트 직후 축과 이후 실제 위치·이동력·이동 호출 수를 각각 확인했다. 최초 수평 좌/우 시작 후 상/하 21/20/19/0/19° 전환도 모두 통과했다.

상향·우측 사례의 실제 수치(위치는 월드 x, 이동력은 남은 예산):

| 현재 각도 | x 전 → 후 | 이동력 전 → 후 | 결과 |
| --- | --- | --- | --- |
| 19°, 20° | 340 → 340 | 1964 → 1964 | 조준, 이동 호출 없음 |
| 21° | 340 → 347.577 | 1964 → 1956.423 | 즉시 이동 |
| 다시 20°, 19° | 347.577 → 347.577 | 1956.423 → 1956.423 | 다시 조준만 |
| 다시 21° | 347.577 → 355.154 | 1956.423 → 1948.846 | 이동 재개 |
| 수평 90° | 355.154 → 387.029 | 1948.846 → 1916.971 | 수평 이동 |
| 다시 19° | 387.029 → 387.029 | 1916.971 → 1916.971 | 조준만, 같은 포인터 유지 |

pointerup/cancel/lost capture, blur, pause, 동행 교체, 방어/엔진 행동 종료, 두 번째 stick 터치의 소유권 불변, 발사·도약 멀티터치, 낙하·충격, 좌/우 방향 반사와 높낮이 보존, PC 방향키/A/D도 기존 검사에서 통과했다. 상세 결과와 실행 로그는 [evidence/results.json](evidence/results.json), [browser.txt](evidence/browser.txt), 나머지 `evidence/*.txt`에 보존한다.

## 짧은 실제 화면 JPG

모두 같은 최종 실행 빌드에서 실제 렌더러로 촬영한 390×844 원본 JPG다. 합성/주석/생성 이미지를 추가하지 않았다. 파일당 약 23 KB다.

| 수직 시작 | 밖으로 수평 이동 | 다시 안쪽 조준 | 수평 시작 후 19° 진입 |
| --- | --- | --- | --- |
| [01](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/joystick-aim-sector-release/evidence/01-vertical-start.jpg) | [02](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/joystick-aim-sector-release/evidence/02-outside-horizontal-movement.jpg) | [03](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/joystick-aim-sector-release/evidence/03-reentered-aim-only.jpg) | [04](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/joystick-aim-sector-release/evidence/04-horizontal-start-inside-sector.jpg) |

02→03에서 이동력은 같은 1917/1964 표시이고 라벨은 `MOVE-AIM`→`조준`으로 바뀐다. 정지 사진만으로 이동을 증명하지 않고 위 전후 수치 및 이벤트 기록과 함께 판정했다.

## 한계와 통합

Headless Chromium의 터치 에뮬레이션이다. 실제 휴대전화의 손가락 감각, Safari/iOS, OS 회전/실제 시스템 취소는 확인하지 않았다. 생산 App의 자동 RAF와 평소 렌더 호출은 테스트에서 멈추고, 생산 frame/120Hz 물리를 일정 간격 직접 진행했다. 증거 촬영 때 실제 렌더러를 호출했다. 동행 교체만 일반 동행 하나를 추가한 기존 fixture를 사용했다. 전체 전투 완주·성능 검사·전체 verify는 이번 범위가 아니다. 원시 전체 trace와 PNG는 `_local/reports/joystick-aim-sector-release/`에 있다. Pages 검증은 미실행이다.

검사 시 원격 master는 기준 SHA와 같고 `git merge-tree --write-tree`로 **충돌 없음**을 확인했다. master 반영은 아직 필요하다. 다른 작업의 최신 로컬 미푸시 변경은 볼 수 없다.

원격 `feat/stage-clear-report`의 `85ab56a93cb4502f9086ee8988cb63288c906338`과 읽기 전용 병합 시뮬레이션은 `BUG_LOG.md`, 루트 HTML/index, `web/manifest.json`과 해시 생성물에 충돌했다. `shared/runtime/main.js`는 자동 병합되었고 입력 소스 충돌은 없었다. 부모 통합 시 로그 항목을 모두 보존하고 생성물은 통합 소스에서 재빌드해야 한다. `fix/journey-book-desktop-expansion`의 `30dcbab59ebf7ff6e2cda9480a331cf90776c7db`와는 충돌이 없었다. 아이콘 캐시 작업의 미푸시 수정까지 검증했다는 뜻은 아니다. [병합 시뮬레이션 기록](evidence/merge-check.json).

재현은 위 명령을 저장소 루트에서 실행한다. 브라우저 출력 경로는 `HONRO_JOYSTICK_OUT=_local/reports/joystick-aim-sector-release`로 지정한다. master/Pages에는 직접 쓰지 않았다.
