# 16장 승인 미술·진단 통합 후보

브랜치 `integration/stage16-art-release-20261022`. 승인 미술 `71c70e32` 전체 후손 위에 진단 `4f344bb7`의 테스트/보고서·실제R9/R19 저장만 병합했다. 충돌은 동일19d 성공 발행 근거 문구 한 곳이며 같은 사실을1개로 유지했다. master/Pages는 변경하지 않았다.

| 구분 | 정확한 SHA/entry |
| --- | --- |
| 승인 미술 HEAD | `71c70e32dbeb65fed0ba395797147203ce8d37d1` |
| 승인 소스·생성물 | `3d902a9c83c128267de6a6bad83bffb146bc5dc0` |
| 가져온 진단 | `4f344bb7ed30aa6f27ea2c04e5a3de3e4124cd7a` |
| 통합/미술·타입·브라우저 검사 | `0ae34a2212d5506164220f858f678bceb5a00036` |
| 완료 장면·17장 연결 재검사 | `3785d2dce8835bae569df64626c75bee2c0ea143` |
| 그대로 사용한 생성 entry | `web/entries/game.d6bc5a0aa4362948.js` |

이후 변경은 이 기록과 선택 JPG뿐이다. [전체 증거](evidence.json).

## 빌드·게임 불변·발행 보존

승인3d902a9c와 비교해 모든 runtime/data/style/build 입력 및 HTML·web 생성물이 byte exact다. 달라진 파일은 테스트/캡처 도구·문서뿐이므로 **재빌드하지 않았다**. 승인 생성물을 옛 campaign/manifest로 덮지 않았으며 파일 세대를 회전시키지 않았다.

`stage16-vector-finish.mjs` PASS: 허용한 미술 필드/비충돌 후면 자산·요소만 정규화하면 기준 공개19d의 전체 프로젝트와 deep equal다.26충돌 지형·7경로·배우·배치·목표·스토리·밸런스·저장 판정·타29장과 기존 Library는 불변이다. helper 재현/멱등, 정적 Path2D/cache 재사용·렌더 순수성·sceneVersion 무효화와 현재 chapter16 생성물 일치도 통과했다. `npm --prefix game run typecheck` PASS.

실제 공개9그래프 **465파일**, 활성/중간까지 합친487파일을 읽어 SHA256·길이를 확인했다. 구934의 `chapter-13-assets.1387b6a1f088fc74.json`/`chapter-13.516170b245a8b075.json`도 보호 목록과 바이트가 일치한다.19d/Pages39842840879/부모 확인 updated_at `2026-10-22T19:47:40Z`는 성공 이력에 정확히1개다. 미발행 미술·진단·통합 후보는 성공 발행 이력에 넣지 않았다.

## 최종 생성물 확인 조건

| 증거 | 실제 수행·직접 본 내용 |
| --- | --- |
| [fresh 중앙 UI](review/fresh-center.jpg) | 최종 entry의1180×757 실제 UI에서16장 입장→대화 넘기기→휠2회→중앙 팬. 승인된 불규칙 바닥/천장 재질과 어두운 후면 기단 지지, 앞 통로·배우의 구분을 직접 확인했다. debug 초기 경지1의 **미술 검사**이며 정상 전투 성장 조건으로 사용하지 않는다. |
| [실제 R19 저장](review/actual-r19.jpg) | 이전 정상 입력으로 얻은 R19 종료 저장을 최종 HTML의 production Continue로 열었다. 전투 JSON 전체 exact·검수 render 순수성, JS/HTTP 오류0. (5650,4150,.4)의 명시적 고정 검수 카메라로 실제2생존/목표 완료 상태를 직접 확인했다. 배우나 저장 데이터를 사진용으로 교체하지 않았다. |

두 JPG는 각각1MB 미만이다. **R19 snapshot은 옛 시각 payload(기존 terrainPlanes80개·기존 요소)도 exact로 유지한다.** 따라서 이 사진은 기존 저장/완료 상태 연결의 증거이며, 새 미술 적용의 증거는 별도 fresh 중앙 UI다. 시각 snapshot 이행을 새로 만들지 않았다. 두 캡처의 manifest는 최종 승인 생성물과 같은 SHA256이다.

## 실제 종료 저장→완료 장면→17장

`stage16-art-release-handoff.mjs`는 보존한 실제R19 gzip을 production Continue로 읽고 기존 outcome 검사 전체를 재사용한다. 추가 완료 플래그·보상·좌표를 주입하지 않았다.

1. R19 입력은 `phase=won`/목표 완료이며 hall·record가 storyQueue에 순서대로 남아 있다.
2. production outcome이 **휘겸 hall 한 줄→record 이송 기록→작업굴로 향하는 outro** 순서로 표시한다. 일반 장면 finish만으로 방문1회가 확정된다. `outcome(true)` 직접 fallback으로 건너뛰지 않는다.
3. 재정산 호출에 보상/방문 중복이 없고, production result→rest→17장 진입의 실제 성장 보존과17장 export→Continue 전투 전체 exact가 통과했다.

이것은 최종 미술 소스에서 실제 저장의 연결을 검사한 것이며 **새로16장19턴을 전투 완주한 기록이 아니다**. 기존 [진단 R19](../stage16-current-pacing-20261022/README.md)는 게임플레이 입력·조건 byte exact를 근거로 재사용한다. R9 재개를 포함한 구v3 ledger XP36,313·경지13·합법27SP 사용 사례이고 설오·담허가 전투불능이었다는 조건을 유지한다.

신규v4 성장 평균·전투 역할별 전진 정책·사람 평균 턴수/난이도는 추가 검증하지 않았다. 이번에 게임 수치/퀘스트/맵/원고를 바꾸거나 전체30장/전역verify/긴 전투를 다시 실행하지 않았다. 실기기 모바일·최종 공개 배포는 미실행이며 부모가 master/Pages 최종 검토·반영을 담당한다.
