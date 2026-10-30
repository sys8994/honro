# 17장 승인 미술·복귀 경로 통합 후보

`integration/stage17-art-route-release-20261022`. 최신 공개6544 위 진단/정책 비교와 실제 R29/R17 저장을 보존하고, 승인 미술4c2dbe53의 저작 helper·15/16 동일 출력 refactor·opt-in·검사/기록만 선택 적용했다. 현재 campaign에 시각 필드만 재적용했으며 옛 campaign/manifest/generated를 복사하지 않았다.

| 구분 | SHA / entry |
| --- | --- |
| 통합 게임 소스 | `8942bb8a83e7c8c7197f5e9677d780d7a6d390cf` |
| 생성물·실제 브라우저 검사 | `16c9aee4ea694d5077d7da04e494730cad4e797e` |
| 승인 미술 HEAD / 소스 | `4c2dbe53899c7daabae7a51ac744302db4f01f33` / `5438c7318faeffe0454097239d46177da2850ceb` |
| 승인 한 anchor | `5be0be1106aedb977847651c338b681a12d07eca` |
| 생성 chapter anchor 추가 assertion·최종 native 검사 | `eda72fd88e8ccc08b81f250df08bafe1147f0c23` |
| 실제 entry | `web/entries/game.4fd156b0f594da4a.js` |
| 실제 chapter17 | `web/data/chapter-17.8fcafe7194de2d9d.json` |

[전체 검사·캡처 원자료](evidence.json) · [기존 동일게임 R29/R17 비교](../stage17-route-and-pacing-check-20261022/README.md)

## 보존과 관련 검사

- 승인 미술의 terrainPlanes/metadata exact, 교정 anchor 전체 exact를 별도로 assert했다. 그 시각 필드와 **east-upper-return의 anchors[3] 한 개만**6544로 되돌리면 전체 프로젝트 deep-equal이다. 다른 route/anchor를 통째로 정규화하지 않는다. 충돌41개·7경로의 다른 점·배우/배치·퀘스트·스토리·밸런스·기계 동작은 불변이다.
- 원본 stage17 recipe가 교정 경로를 재현하고 두 순수 author helper가 멱등이다. 공유 author의15/16은 승인6544 전체 campaign JSON 바이트를 각각 재현하며 현재15/16도 exact다.
- 공통 build/typecheck PASS. 생성 chapter17의 승인 미술과 교정 anchor도 source exact다. 새 유한 면의 기존 solid 포함·공통 clip·목재/작은 발판 보존을 확인했다.
- prepare 캐시·sceneVersion 무효화·반복 draw 새Path2D0·battle/Canvas 순수성 PASS. 같은 경로 입력에서 시각 전후 production repair clone 상태가 exact이며 문 열린 fixture의 배우 보존·캐시/렌더 순수성도 PASS다. 강제 선행조건을 준비한 문 렌더 fixture이며 정상 전투로 주장하지 않는다. 최종 브라우저에서는 fresh 중앙/모바일을 별도로 확인했다.
- 전체 격리 경로36/36 PASS. upper-hoist-route 네 체형의 피해1은 이전 원자료와 동일하고 나머지32건은0이다. 이전 요약의 무피해 표기를 정정했다. 적 제거/문 개방/이동도 충전이 있는 기하 fixture다. 별도4클래스는 합법 성장·유한 예산으로 교정 점프→상부 바위7040±8 부분 복귀를 통과했고 실행 중 자원 재충전·좌표 보정0, HP/MP/행동권 exact다. 전체 전투 증거와 분리한다.
- 빌드 전 실제6544 성공 이력을 중복 없이 재확인했다. 공개10그래프473파일과 활성/중간 포함491파일의 SHA256·길이를 확인했다. 구934 `chapter-13-assets.1387b6a1f088fc74.json`, `chapter-13.516170b245a8b075.json` 보존. 정리된 중간 파일은 현재/중간/실제 발행 보호목록 밖이며 미발행 후보를 성공 발행으로 등록하지 않았다.

## 실제 저장·완료 연결과 사진

기존 정상 입력 R17 저장을 최종 생성물에서 production Continue했다. **whole-battle exact**, 검수 렌더 후에도 exact다. snapshot 안의 옛 미술/route까지 그대로 보존하며 별도 이행/초기화는 없다. 일반 완료 흐름에서 남아 있던 보호/기록 표시와 완료 대사를 실제 UI로 넘기고 단일 정산,18장 도착/성장 보존, 실제 export→Continue의18장 whole-battle exact를 확인했다. JS/HTTP 오류0.

| 직접 연 최종 JPG | 조건 |
| --- | --- |
| [새 미술 중앙](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage17-art-route-release-20261022/review/fresh-center.jpg) | fresh 디버그 UI 입장→실제 휠/중앙 팬,1180×757 |
| [새 미술 모바일](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage17-art-route-release-20261022/review/fresh-mobile.jpg) | fresh 디버그 UI,390×844 실제 휠/중앙 팬; 실기기 아님 |
| [실제 R17 저장](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage17-art-route-release-20261022/review/actual-r17-continue.jpg) | 기존 R17 won snapshot 복원·명시적 검수 카메라; 옛 미술/route 유지 |
| [실제 완료 흐름](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage17-art-route-release-20261022/review/actual-r17-completion-dialogue.jpg) | 복원 후 일반 outcome의 보호/기록/완료 대사 흐름; 상태 강제완료 없음 |

사진은 모두16c9aee4 생성물이며 각각1MB 미만이다. 중앙의 인양기/목재 연결·앞길/뒤 암면 구분과 모바일의 기존 목표/HUD·바닥 재질을 직접 확인했다. 실제R17에서는 담허 전투불능·설오347HP 등 저장 상태를 유지한다.

## 한계·미실행

기존 R29와 R17은 같은6544 게임·XP·기예·seed의 입력 정책 비교다. R17이3인 생존이어도 사망자가 다르고 남은 HP가 낮으므로 밸런스/퀘스트 단축 성과나 사람 평균·최적 전략으로 쓰지 않는다. 통합 미술/경로에서 새 전투 완주를 재실행하지 않았다. 기존 R29/R17 저장 파일도 변경하지 않았다.

새 미술의 fresh UI와 옛 저장 화면을 구분한다. 정상17장 전투/보호 재연·새 정책 탐색·신규v4 평균 성장·FPS·전체30장/전역verify·다음 장 작업·master/Pages 발행은 미실행이다. 최종 원격 HEAD와 clean 여부는 인계 메시지에서 제공하며 부모가 배포한다.
