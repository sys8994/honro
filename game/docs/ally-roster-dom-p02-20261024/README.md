# P0.2 동맹 목록의 DOM 수명

기준 master `4cd877f0d488030f75f89be7ee4a74dc4ab42d23`. 게임 소스 변경은 `shared/runtime/main.js` 동맹 목록 분기1행뿐이다. App 전역의 `this.allySig`를 제거하고 `#allied-roster` 노드의 `_allySignature`로 비교/기록한다. 기존 이름·순서·HP 반올림·maxHP·dead 필터·HTML·클릭/레이아웃과 selected skill·턴·전투·저장 동작은 그대로다. force 플래그로 무조건 쓰지 않으며 일반 캐시 체계를 만들지 않았다. P0.1 코드와 부모 배포 결과를 유지하고 다른 P0/P1은 착수하지 않았다.

## 기준 재현과 수정 확인

`tools/testing/ally-roster-lifetime-browser.py`는 기존 browser_support의 로컬 서버/Chromium을 재사용한다. Production Native App으로1장 완료 fixture→2장 진입/도입 완료→stopBattle 저장을 준비했다. fixture가 없으면 같은 검사기에서 Native App 준비를 자동 수행하며 `--prepare-only`로 준비만 할 수도 있다. 브라우저390×844 touch에서 실제 Continue를 누르고 원래 App.frame/rAF를 계속 실행한다. 제목 반환은 App.showTitle API를 호출한 테스트 경계이고 재진입은 실제 title Continue 버튼이다. 사용자 세이브·실기기·공개 배포·전체 캠페인 플레이를 주장하지 않는다.

| 확인 | 결과 |
| --- | --- |
| 기준 `--before`, game.66fcb6346e75df3e.js | 복만/백산/담허/연실4명과387/529/494/324 HP 표시. 같은 ID/name/HP/maxHP로 재진입하면 새 root가0명이고 roster 쓰기 횟수는 첫1회 그대로였다. 정상 frame 54→122에도 복구되지 않았다. |
| 수정 `web/entries/game.d89af9c13535e2a5.js` | 같은4명/HP/HTML로 재진입. root는 실제 새 노드이고 새 root를 채우는 쓰기는1회. 정상 frame 59→126. App에 allySig 속성이 남지 않는다. |
| 변함없는120회 updateHUD | force=true/false를 섞어도 roster innerHTML 쓰기0, MutationObserver0, 자식 노드 동일, 선택 스킬 유지. 정상 frame에서도 추가 쓰기 없음. |
| HP/maxHP/사망/동맹 없음/원상 복원 | 각 변화마다1회만 쓰며 기존 템플릿의 순서·이름·HP·bar 출력과 정확히 일치. 빈 상태120회는 쓰기0. 변경 전후 동기 updateHUD의 units/terrain/heroes/projectiles/round/teamEnds/side/phase/선택 스킬은 동일. HP/death/empty는 별도 명시 fixture로 조작하고 원래 배우를 복원했다. |

브라우저 예외0, App.lastError 없음. 전후 캡처의 실제 픽셀에서도 기준의 빈 동맹 영역과 수정 후4개 칩을 확인했다. 자동 fixture/JSON/JPG는 `_local/reports/ally-roster-p02/`에 유지한다. 실행 코드에 frame 정지·강제 매프레임 roster 쓰기는 없다.

## 빌드와 발행 보존

`npm run build`, `node tests/web-split.mjs` 통과. 보존 확인은 기존 `node tests/profile-store-p01-preservation.mjs`의 순수 immutable bytes/hash/source 감사만 재사용했다. 저장 보호 UI/예외 전체 검사나 전30장 플레이는 다시 실행하지 않았다. 결과를 ally-roster-p02/preservation.json에도 복사했다. 활성414파일, 기준 활성 및39개 공개 그래프의781파일 bytes/SHA256이 맞고 기존35개 발행 메타데이터도 그대로다. engine/assets/map/data/CSS/22장/audio/VFX 소스는 바뀌지 않았다.

부모가 직접 success/공개 entry를 확인한 아래4건이 manifest에서 누락돼 기존 `retain-published-web.mjs --history`로 등록했다. 도구의 graph hash 중복 제거와 최근7일/최소2개 정책을 그대로 썼다. 새 P0.2 후보는 발행으로 등록하지 않았다.

| 성공 발행 | UTC | Pages run |
| --- | --- | --- |
| 78818166f6f385e833f9ecd83e212b7aedb258c1 | 2026-10-23T23:52:16Z | [40041810648](https://github.com/sys8994/honro/actions/runs/40041810648) |
| 8037a13efeaaa6ec6149b573cb1f624895c45812 | 2026-10-24T01:25:27Z | [40049555396](https://github.com/sys8994/honro/actions/runs/40049555396) |
| 18c15e9aaae3c48eaa235e4a059bad3580584328 | 2026-10-24T01:45:40Z | [40051037582](https://github.com/sys8994/honro/actions/runs/40051037582) |
| 4cd877f0d488030f75f89be7ee4a74dc4ab42d23 | 2026-10-24T03:24:28Z | [40058013225](https://github.com/sys8994/honro/actions/runs/40058013225) |

최종 entry `web/entries/game.d89af9c13535e2a5.js`, manifest SHA256 `02882fa34ae116044ed2c417ed9184e18bc02a6e80d469c9356f08bcffc556d5`. master/Pages는 부모가 담당한다. 부모의 P0.1 공개 새 여정→주막 대사2/11→reload→같은2/11 확인은 진행표에 부모 증거로 구분해 반영했다.
