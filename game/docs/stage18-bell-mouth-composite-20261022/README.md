# 묵종 하부 합성 교정 후보

기준은 실제 공개 `dd878c9e58213b2737f72b4ad4476b18464db83f`다. SVG 단독이 아니라 같은 배포 생성물의 실제 Game UI→18장 입장 화면에서 사각형 잘림과 파편처럼 분리된 하부를 재현했다. 이번 수정은 종 본체 하부 합성에 한정한다. 미술 최종 승인·master/Pages 반영은 부모 담당이다.

- 브랜치: `fix/stage18-bell-mouth-composite-20261022`.
- 게임 소스/생성물: `16ec2afbe5764be42beb07507d873eeab938310b`.
- 마지막 clean 검사/전체 재캡처: `6545fe87956452a7af4759a3deeda63d12739c58` (추가 변경은 전체 실루엣 검사용 카메라 한 줄뿐).
- entry: `web/entries/game.d7d1123e12fa5671.js`.
- 18/19장 JSON은 기존 `chapter-18.e8c90b0b6584941a.json` / `chapter-19.e441ced6ddaabe7c.json` 그대로다. 종 Library와 렌더 모듈을 재빌드했다.

## 실제 원인과 수정

`stage18-bell-art.js`가 `soundWindow.interiorReveal`을 evenodd clip으로 빼면서 원래 타원 공동 안에 직사각형 배경 창을 만들고, 별도 frame/받침 overlay를 다시 그렸다. 그 앞의 실제 고정 `sb-inner-upper-turn` / `sb-inner-sound-stone`은 서로 다른 바위 패스로, `sb-east-gallery-sill`은 본체 뒤에서 그려져 연결이 끊겼다. 따라서 SVG 입구 자체보다 클립·레이어·서로 다른 재질의 합성이 결함이었다.

종은 타원 공동과 연속 청동 림을 한 번만 그린다. 사각형 subtraction과 overlay 재도색을 제거하고, 불필요한 `cast-sound-window-frame` 원본 경로도 삭제했다. 기존 입술의 오른쪽 접힘/아랫곡선을 완만하게 다듬고 실제 동쪽 주물 받침은 본체 청동 재질로 맞췄다. 상부·문양·원래 gradient 팔레트는 보존했다.

고정 내부 경사/기둥과 회랑 발판은 **실제 콜라이더**다. 지우거나 그림으로 메우지 않았다. 세 실제 polygon을 같은 차분한 석재로, 본체 뒤의 검은 공동 앞/배우 뒤에서 그리도록 정리했다. 경사에서 회랑 아래까지 가는 후면 지지 2개를 연결했다. 지지는 비충돌 세선이며 새 보행면·막힌 벽·가짜 통로를 만들지 않는다. 남아 있는 각진 경사는 실제 형상이며 청동 종의 고립 파편으로 삭제한 것이 아니다.

옛 campaign battle은 저장된 SVG·지형·모든 상태를 그대로 보존한다. 렌더 준비 시 같은 ID의 현행 청동 자산을 사용하며 battle을 치환하지 않는다. Workshop/custom origin은 자산을 대체하지 않는다. 그림과 발판은 기존 Path2D/벡터 경로를 사용하며 프레임 절차 생성이나 전역 렌더러 변경은 없다.

## 검수와 한계

| 회차 | 실제 픽셀 확인 / 발견·수정 |
| --- | --- |
| 집중1 — 확대·전체 | 배포 기준 사각형 잘림/독립 덧판을 직접 재현. 첫 교정에서 창은 사라졌지만 오른쪽 입술 접힘이 뾰족해 곡선으로 수정. 회랑·경사의 접합과 전체 종 몸체를 비교 |
| 집중2 — 상태·경로·인물 | 0/100/200 강제 렌더에서 연속 림, 고정 회랑과 움직이는 본체의 분리, 안전 안내 가림 확인. 실제 경사 위 법사 위치는 별도 명시한 pose fixture. 배우와 발판 경계 식별 가능 |
| 집중3 — 모바일·19·옛 저장 | 모바일 하부와 가로 확대, fresh19 공용 종, 실제 R22 Continue를 확인. 옛 SVG가 저장에 남고 화면만 교정되는 것을 source hash와 whole-battle equality로 구분 |
| 마지막 종합 | 위 clean SHA의 10장 전체를 직접 이미지 뷰어로 다시 열었다. 사각 배경 창·분리 덧립은 없음. 고립 파란 조각은 회랑과 같은 석재 및 지지로 연결. 용뉴까지 보이는 전체 실루엣 사진도 별도 포함 |

사진은 실제 production renderer/캐시/지형/overlay 합성이다. fresh18 입장은 UI로 했고, 검사용 카메라는 명시적으로 고정했다. 0/100/200은 기존 `HonroStage18BellRenderFixture`이며 자연 하강/정상 전투 증거가 아니다. route-pose는 복제 battle의 법사 한 명을 실제 경사 walk edge에 둔 시각 fixture다. fresh19는 production factory 렌더이며 정상18→19 전환을 뜻하지 않는다. 이번 작업에서 정상18 승리·19장 전환, 새 퀘스트 개편, FPS/ms는 검사·주장하지 않았다.

## 검사와 통합 경계

- `tests/stage18-bell-mouth-composite.mjs`: 종 자산 한 개의 `vector` / `params.nodeCount`를 제외한 전체 프로젝트 deep-equal. 모든 stage·바닥/천장 미술·다른 Library·충돌·경로·배우·목표·대사·하강/저장 데이터 exact. 자산 bounds/anchor/physical aperture metadata·상부 문양/팔레트 보존, 저작 재현/멱등 통과.
- 초기/중간/안착/fresh19/실제R22의 반복 draw 3회 신규 Path2D **0**, 캐시 identity 재사용, sceneVersion/vertices source 무효화, 전체 battle 렌더 순수성 통과. 옛 사각 reveal 위치는 투명 구멍 대신 원래 어두운 공동 픽셀 `[27,36,41,255]`. 자동 수치가 미술 승인 근거는 아니다.
- `tests/stage18-bell-refinement.mjs`: 18 하강200과19 안착의 실제 충돌/world 지형·본체 위치 exact. 과거 overlay 형상 고정 assertion은 이번 결함의 제거된 덧판을 강제하므로 물리 aperture/metadata 보존과 새 합성 계약으로 갱신했다.
- `tests/authored-rock-planes-preservation.mjs`: 15–17 승인 출력/17 교정 anchor·재현·멱등 통과. `npm run build`, game typecheck 통과.
- `tests/stage18-bell-traversal.mjs --route=inner-sound-gallery --class=archer`: initial 1개 국소 이동 fixture 통과, jump3/damage0. 다른 배우 제거/이동 보충을 쓰는 기존 검사이며 정상 전투나 전27경로 검사로 부르지 않는다.
- production 브라우저의 실제 R22/R29 Continue→export whole-battle exact와 렌더 순수성 통과. 저장 미술을 새 미술로 덮지 않았다. 추가 R22 확대에서도 저장 원본 SVG hash와 화면의 현재 SVG hash가 다르고 전체 저장이 exact임을 확인했다. JS/HTTP 오류0.
- 빌드 전에 실제 dd878 발행 Pages39864363155 / `2026-10-22T22:24:21Z`를 등록했다. 빌드/미술 검사 당시 보호 **12개 실제 공개 그래프/485 immutable 파일** 전부 hash·길이 통과, 구934 chapter13 JSON 두 개 포함. 후보는 성공 발행으로 등록하지 않았다.

**병행 퀘스트 개편과 통합할 때 campaign 전체를 복사하지 않는다.** 최신 프로젝트에 `refineStage18BellArt(project)`를 적용하면 Library `stage18:bell-hollow-body.vector`와 `params.nodeCount`만 갱신된다. 그 외 원본 SVG, `shared/runtime/stage18-bell-art.js`, 관련 검사·도구·기록을 가져오고 생성물은 통합 소스에서 재생성한다. 저작 CLI는 입력의 compact/pretty JSON 형식을 보존하도록 했다. marker/unit/목표 등은 이번 수정 대상이 아니다.

작업 말미 부모가 `424c0e6b0a616f33ca4413bc21eb4f74d22896da`의 실제 공개 성공(Pages39867259534 / `2026-10-22T22:48:07Z`, `game.74763a1df7b30b4e.js`)을 알렸다. 이 버전의 `shared/runtime/portraits.js` imageCrop 축소는 **최종 통합에서 반드시 보존**한다. 현재 미술 후보에 중간 병합하지 않았으며, 현재 entry는 dd878 기준 미술 후보이지 424c 통합 배포본이 아니다. 관련 종 소스/Library 원본은 424c와 dd878 사이 차이가 없었다.

이 성공 사실은 제출 전에 보호 이력/manifest에 추가하고 원본 immutable bytes를 복원했다. 이제 **13개 실제 공개 그래프/489파일** 전체 hash·길이가 통과하며 dd878/424c 모두 포함한다. 이후 변경은 보호 metadata·발행 원본 파일·이 문서뿐이고 게임 소스/현재 entry는 위 최종 캡처와 동일하다. 새 빌드나 미술 재개편은 하지 않았다.

## 전달 사진과 원자료

선택 JPG 12장 모두 직접 열었으며 각 1MB 미만이다. 전후 mouth/whole/mobile은 같은 카메라다. `silhouette`는 용뉴까지 담기 위한 별도 `.13` 카메라다.

- [전 확대](review/before-mouth.jpg) / [후 확대](review/final-mouth.jpg), [전 전체](review/before-whole.jpg) / [후 전체](review/final-whole.jpg), [최종 완전 실루엣](review/final-silhouette.jpg).
- [전 모바일](review/before-mobile-mouth.jpg) / [후 모바일](review/final-mobile-mouth.jpg).
- [하강100 fixture](review/final-state-lowering.jpg), [안착200 fixture](review/final-state-settled.jpg), [내부 경사 pose fixture](review/final-route-pose.jpg).
- [19장 공용 종](review/final-stage19-mouth.jpg), [실제 R22 옛 저장](review/final-old-r22-mouth.jpg).

자동 원자료는 `_local/reports/stage18-bell-mouth/{before,focus1,focus2,focus3,final-clean}/capture.json`, `contracts.json`, `_local/reports/stage18-integration/browser/result.json`이다. 마지막 capture.json은 clean SHA와 카메라·상태·저장/paint SVG hash·오류0을 담는다. 검사 로그는 `/tmp/bell-mouth-{build-final,qa-contracts,refinement,rock-preservation,type,route,final-actual-saves,final-clean}.log`에 있다. 현재 권한/도구 차단은 없다. 부모 최종 미술·공개 확인 대기다.
