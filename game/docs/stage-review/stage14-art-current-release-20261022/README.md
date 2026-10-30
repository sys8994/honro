# 승인 14장 shape2 + 현재 공개 master 통합

**통합 코드·검사 SHA:** `a8b2d10798770b381391b9cdbbaee6e5eb1f92dc`. 현재 entry `web/entries/game.80058be2c7d5a3e3.js`. 승인 shape2와 새 구조 목표의 로컬 통합 검수 완료, 부모 최종 확인·master/Pages 반영 대기.

[통합 상층](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage14-art-current-release-20261022/review/stage14-integrated-upper.jpg) · [통합 중층](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage14-art-current-release-20261022/review/stage14-integrated-middle.jpg) · [통합 모바일](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage14-art-current-release-20261022/review/stage14-integrated-mobile.jpg)


기준 `6cbda400009206180d28c61e5fc14a0b6246809a`, 브랜치 `integration/stage14-art-current-release-20261022`. 부모가 직접 승인한 `a70efcdd818ebf87ca1eb4826d901cb3771cd1c3`의 shape2 저작/자료를 가져오고, 최신 campaign의 시각 필드와 기존 후벽 Library 한 개만 재적용한다. 미술 형태·게임플레이·대사 변경은 없다. master/Pages는 부모 최종 확인 뒤 반영한다.

빌드 전에 실제 성공 발행6cbda400/Pages39824368686/2026-10-22T17:40:00Z/공개 game.874093a9e07dc27c.js를 등록했다. Git 원본과 현재 immutable bytes 검증 성공, 복원0. 그래프 SHA256 `45467a11aba6ff3b6b5e1bad52b09a68fba18c5dd6ed996aaa4e83017426b820`. 최근7일 전체+최소2개 정책과 별도 중간2세대를 유지한다. 미발행 통합 후보는 등록하지 않는다.

검사 범위: 시각 필드 제외 최신 전체 campaign/17경로/충돌·배우·목표·대사·타29장 exact, 승인 shape2 재질·후벽 exact, 멱등성·정적 캐시·공통 build/typecheck, 기존 rescue-gates/retained-boundaries와 새 첫 목표/구 clear-middle Continue/대사 cursor. 기존 rescue-gates의 Library=옛1f 비교는 승인 후벽 한 자산의 의도된 변경만 허용하도록 좁혀 유지하고, 나머지 계약/predicate/저장 검사는 보존한다. 정상R22→15장과 전체30장 재실행은 하지 않는다.

통합 생성물의 실제 기본/상층 휠/중층 팬·모바일 기본·양 끝 팬을 직접 보고 새 구조 목표와 승인 미술이 함께 보이는 선택 사진만 추가한다. 옛 목표의 승인 사진은 기존 미술 기록으로만 가져온다.

## 시각 필드 재적용 보존점

승인 helper/opt-in 연결과 미술 검사·캡처·선택 사진·기록만 a70efcdd에서 가져왔다. `campaign.json`/manifest/generated는 가져오지 않고 현재6cb campaign에 helper를 실행했다. 빌드 전 전체 프로젝트를 시각 필드만 원복 정규화해6cb와 deep exact, 승인 shape2의 terrainPlanes/기존 rear Library 전체와 deep exact를 확인했다. 기존 rescue-gates의 Library 전체 비교는 승인 rear 한 개만 기대값에 넣도록 수정했고, 원래 gate/저장/predicate/현행 guide 검사는 보존했다. 통합 보존 검사에는 승인 저작 두 파일의 byte exact와6cb runtime/현재 catalogue·서사 guide 보존, 구934 chapter13 두 파일의 hash·길이 보호를 명시했다.

현재 보호 공개7그래프/고유 immutable446개. 구934 필수 두 파일: `web/data/chapter-13-assets.1387b6a1f088fc74.json`(24,657B), `web/data/chapter-13.516170b245a8b075.json`(57,580B). 등록 시 원본 Git hash/길이 및 현재 존재를 확인했다. 이후 build가 같은 공개 bytes를 보존하는지도 관련 검사에서 다시 확인한다.

## 코드·생성물·검사 보존

- `e33c05ae`: 실제 성공6cb 발행을 빌드 전 등록.
- `42eb5b6f`: 승인 저작/opt-in·관련 검사·캡처·선택 사진·기록을 가져오고 현재 campaign에 시각 필드만 재적용. 공통 build/typecheck의 소스 입력 SHA다.
- `a8b2d10798770b381391b9cdbbaee6e5eb1f92dc`: 그 source의 공통 생성물을 보존한 **최종 코드·생성물·검사 SHA**.42eb 이후 소스 입력 변경 없음. 이후 최종 인계 커밋은 문서/선택 사진뿐이다.
- 진입 `web/entries/game.80058be2c7d5a3e3.js`, 직접 Playtest `web/entries/game.e4172a40b5d088ee.html`, 현재 chapter14 `web/data/chapter-14.373b0d1f21c73951.json`, 후벽 포함 자산 `web/data/chapter-14-assets.037286760c32019e.json`.

아래 관련 검사는 모두 통과했다. 자동 결과는 Git 제외 `_local`에 두고 이 표는 수행 범위만 기록한다.

| 검사 | 실제 확인과 실행 SHA |
| --- | --- |
| `npm run build` / `npm --prefix game run typecheck` |42eb 소스 입력에서 공통 Game/Workshop/직접 Playtest build 및 tsc 통과. 결과를 a8b에 보존했다. |
| `node tests/stage14-vector-finish.mjs` |a8b. 허용한 시각 필드만6cb 값으로 원복한 전체 campaign deep exact/SHA256 `1245e7bedf95181b7b0c5bc35de57c5dd89934bd6060a341468ddc87d17e1764`.17경로·충돌·배우/NPC·적·목표·3구조/은퇴 gate·저장 관련 초기 계약·현재 대사·타29장·다른 Library 보존. 승인 a70의 재질/후벽 전체·shape metadata exact, 저작 helper/opt-in byte exact, 현재 shared/game source 및 catalogue/guide byte 보존. |
| 정적 렌더 부분 |같은 a8b 검사. 현재 생성물과 canonical 재질/후벽 exact, 저작 재현/멱등성, prepare/SVG 객체 재사용, 반복 draw 새Path2D0, 렌더 battle JSON·Canvas 상태 보존, sceneVersion 무효화. draw 비용0/동적 FPS 개선 주장은 아니다. |
| `node tests/stage14-rescue-gates.mjs` |a8b. 현재6목표·은퇴2gate·3구조 순서/기존 full author chain·guide 계약, 구8목표 prefix0–7의 R20 업그레이드/반복 export·Continue 전투 전체 exact, 자원/NPC HP/완료 사실 보존, 대사2쪽 원문/cursor·정지, 미지원/종료 제외·현행 구조/방어/local 조건. 기존 검사 중 Library=옛1f 기대만 승인 후벽 한 개로 좁혀 바꿨고 다른 계약/assertion은 보존했다. |
| `node tests/stage14-rescue-retained-boundaries.mjs` |a8b. 기존 읽기 전용 다리 선행/주변 위협·보호4/유한6·1050×600 local·보호 NPC 실패 predicate. 준비된 terminal-save의 보상1회/결과→쉼터→15장/정상 새 장 자원/whole-battle Continue fixture. 정상 완주 근거와 구분한다. |
| `python tests/stage14-rescue-gates-browser.py` |a8b. 통합 생성물390×844 fresh 첫 목표 `family-upper`/`상층 주민 구조`, 구 clear-middle R20 Continue→`family-mid`/`중층 주민 구조`의 배우·자원·완료 사실 exact, 저장 대사 index1(2/3쪽) 원문/cursor exact 및 tick 중 진행 없음. JS·HTTP 오류0. |
| 공개 immutable |a8b. 최근7일/최신2개 최소 정책의 실제 공개7그래프446고유파일 hash·길이 exact. 구934 chapter13 두 파일도 명시적으로 보호 목록/실제 bytes 확인. 현재6cb의 원본 활성 파일은 전부 보호 그래프에 포함돼 삭제/변조0. 통합 후보를 발행 이력에 넣지 않았다. |

검사 원자료: `_local/reports/stage14-art-current-release/preservation.json`, `_local/reports/stage14-rescue-gates-20261022/{contracts,retained-boundaries}.json`, 그 하위 `browser/result.json`. 콘솔은 `/tmp/stage14-integration-{build,typecheck,preservation,rescue,boundaries,save-browser}.log`. contracts/retained/browser의 checkedCommit은 모두 a8b2d107이다.

## 새 목표가 보이는 실제 통합 UI

`tools/testing/stage14-vector-finish-capture.py`가 fresh debug UI의 여정첩→2막14장→휴식터→입장→도입 넘기기를 실제 클릭했다. 새 첫 목표 `family-upper`와 현재6개 순서 및 HUD의 `상층 주민 구조`를 assert한 뒤 캡처한다. `integration-ui`4장과 `integration-camera`8장은 a8b의 **clean 작업 트리**에서 촬영했고 sourceHashes/카메라·목표 문자열을 함께 기록했다. 부모가 승인한 미술 사진은 별도 예전 기록이며 통합 화면으로 부르지 않는다.

실제 기본뷰·휠2회 상층 최소줌·중층 팬·모바일 자동 기본뷰·좌/우 끝 팬의 여섯 장을 **직접 열었다**. 목표 라벨은 새 상층 주민을 가리키고, 승인 shape2 파단면/비대칭 후벽·배우/탄도·보행선 및 외곽 연속성이 유지된다. 미술 형태를 새로 바꾸지 않았다. 구 저장 Continue/대사 cursor의 실제 두 사진도 직접 열었다. 모든 선택 JPG는1MB 미만이다.

- [기본 입장·새 첫 목표](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage14-art-current-release-20261022/review/stage14-integrated-entry.jpg)
- [상층 줌아웃·새 구조 목표](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage14-art-current-release-20261022/review/stage14-integrated-upper.jpg)
- [중층 팬·승인 재질](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage14-art-current-release-20261022/review/stage14-integrated-middle.jpg)
- [실제 모바일 기본뷰](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage14-art-current-release-20261022/review/stage14-integrated-mobile.jpg)
- [좌측 끝 팬](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage14-art-current-release-20261022/review/stage14-integrated-left-pan.jpg), [우측 끝 팬](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage14-art-current-release-20261022/review/stage14-integrated-right-pan.jpg)
- [구 clear-middle R20 Continue의 새 중층 목표](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage14-art-current-release-20261022/review/stage14-integrated-continue-middle.jpg)
- [저장 대사2/3쪽 cursor](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/stage14-art-current-release-20261022/review/stage14-integrated-dialogue-cursor.jpg)

현재 목표 순서 `family-upper → family-mid → family-lower → bridge → hold-refuge → clear-village`를 보존한다.3주민 조건,4라운드 보호·유한6, 마지막 국소1050/600, 보상·저장 이행·원문/guide를 새로 편집하지 않았다. 큰 주층리/중앙 후벽 여백 등 부모 승인 때 기록한 미술 한계도 그대로다.

부모가6cb에서 검증한 정상 fresh R22→15장 완주는 재실행하지 않았다. 이번 저장 검사는 명시적인 호환/predicate/terminal fixture이며 새 정상 완주·사람 평균 페이싱·실기기/동적 FPS를 주장하지 않는다. 전체30장·전역 verify·무관한 옛 실패 검사는 실행하지 않았다. 실제 UI는 로컬 공통 production build이며 새 공개 배포 검수가 아니다. master/Pages는 변경하지 않았고, 부모의 최종 통합 확인·배포 후 공개 검수는 남는다.
