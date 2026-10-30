# 최종 통합 — 부모 화면 검수 대기

`integration/final-endings-20261021`에 변경 단위별로 커밋·비강제 push했다. **master/Pages는 변경하지 않았다.** 원격 master는 `bafc275c10c7a256692425641d7f0e4f69c002ca`다. 부모가 아래 최종 원본 PNG를 확인한 뒤 master/Pages를 진행한다. 실행 차단이나 결과 불명인 원격 쓰기는 없다.

검수 대상 런타임·이미지는 **`283bc7994ba9842cfe68fb718d86e14e4e90343a`**, 최종 검사·새 정상 전투·증거 저장점은 **`123d33469c495aed065ec6edffa04735897a3c16`**이다. 이후 이 README/manifest 변경은 문서뿐이다. [PROVENANCE](PROVENANCE.json), [WORK_LOG](WORK_LOG.md)에 이전 실행과 새 실행을 구분했다.

## 통합과 이미지

- `1a87b16ff85e3fe72933683e2419a009572a67e1`의 승인 후보2/5/11장, 카메라/음악, 담허/축지, 공중/근접과 `05ea5b1de796922b1a13dee0e55a57d267d48da2`의 엔딩 소스를 명시 병합했다. **미완12장 후보는 포함하지 않았다.**
- `4d26b130`의 outcome 선행 done guard를 엔딩 preload/후일담 앞에 보존했다. 조이스틱 TS/main/math/HUD, Engine/AI, 카메라·음악, canonical campaign/공통 map은 기존 통합과 바이트 동일하다. shared/build에는 stage5-positioning과 sodan-withdrawal을 함께 유지한다. 생성 HTML/web은 소스에서 재빌드했고249개 자산/해시·Game/Workshop/embedded 연결을 검증했다.
- 부모가 저장소에 직접 공급한 version1 WebP 운반본3개만 decode했다. 모두1672×941, 지정 SHA256·크기458682/471910/560200과 일치했다. [정확한 값](evidence/image-integrity.json). 실제 공급 pixels를 직접 열어 붉은 매듭/거목/방울,녹청 묵종/석회 동굴,먹빛 기록/황토 강변을 확인했다. 생성/편집/재압축/공통 tint 추가는 없다. 반려version0은 사용하지 않았다.
- `shared/assets/endings/act-1.webp`~`act-3.webp`에 연결했다. 운반본은 정상 삭제했고05ea5b1d Git 이력에서 복구할 수 있다. **공급 원본 PNG는 부모 Library에 보존돼 있으며 이 환경에는 가져오지 않았다.** Library 다운로드나 다른 cloud task 비공개 환경에 접근·재시도·우회하지 않았다.

## 부모가 볼 최종 원본 PNG

아래는 모두 Chromium이 직접 저장한 PNG다. 합성·편집·재압축하지 않았다. `final-browser`는 세 집중 검수 후 별도 최종 종합 실행이다.

- 각 막 전체: [1막 붉은 매듭](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/focus1-act1-landscape.png), [2막 녹청 종](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/focus1-act2-landscape.png), [3막 강변·기록](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/focus1-act3-landscape.png).
- 대비/화면비: [3막 밝은 기록 위 긴 문구](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/focus2-act3-copy.png), [1막390px](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/focus3-act1-390x844.png), [2막390px](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/focus3-act2-390x844.png), [3막320px](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/focus3-act3-320x568.png), [844×390](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/focus3-act3-844x390.png).
- **새 정상22턴 저장에서 실제 이어간 화면**: [출구 모바일](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/checkpoint-exit-mobile.png), [안전 후일담 첫 줄](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/final-safe-outro-first.png), [끝 줄](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/final-safe-outro-last.png), [실제1막 엔딩](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/final-real-checkpoint-act1.png), [다음 막 제목](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/final-real-next-title.png), [소단 포함2막 휴식터](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/final-real-next-rest.png).
- [4막 준비중 경계](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/stage-review/final-integration-20261021/evidence/final-browser/act3-next-title.png). 실제4막 맵을 만들거나 진입시키지 않는다.

## 새 검사와 기존 증거 구분

| 범위 | 이번 결과와 한계 |
|---|---|
| 집중1 | `evidence/browser/focus1-*`3개 전체구도를 직접 열어 장소·색조·전체 contain을 확인 |
| 집중2 | 일반 플레이 거리 하단 plain text/긴3컷 문구,3막 밝은 종이 위 대비 확인. 박스/다음버튼/초상 없음 |
| 집중3 | 390×844/320×568/844×390의 여백·줄바꿈·잘림,실제 touch/compatibility click·Enter/Space·reduced motion·pending 재개 확인 |
| 별도 최종 종합 | `final-browser`의 세 막4컷→제목→휴식터,각2컷 reload·실제 download/file import,반복outcome,XP/SP/장비/보상장부/방문수 불변,완료재접속 미재생. **pageerror0/HTTP실패0**,제목에서 엔딩이미지요청0. [결과](evidence/final-browser/summary.json), [trace](evidence/final-browser/checkpoint-traversal.json) |
| 정상 checkpoint 우선 | 기존21턴 escape 저장에 생산 SP/HP/근접 migration→native 두번째 Continue exact→실제브라우저Tab+D 출구→4인철수→현재형후일담→이미지. [native](evidence/checkpoint-native.json), [browser](evidence/browser/checkpoint-traversal.json). 기존 전체21턴 완주를 이번 새 완주로 표시하지 않음 |
| 새 정상10장 **단1회** | 실제9장 승리 profile로 생산 App/Engine 입력. **22턴 승리**,16턴Continue exact,62발/피해141회,회복약3,방어6턴→휘겸4847.30/2904.34출구→소단포함4인철수,적26생존. 외부unit/resource쓰기0·강제복구0. [결과](evidence/normal10/result.json), [전체combat](evidence/normal10/combat.json.gz), [최종실제checkpoint](evidence/normal10/round-22.json), [승리profile](evidence/normal10/victory-profile.json.gz) |
| 정상 전투 범위 | 위 전체22턴은 DOM/시계/오디오/엔딩presentation double이며 수동 브라우저 전체전투가 아님. 소단HP552/영웅HP423·634·1214는 보상레벨업 후 값. 실제브라우저는 저장된22턴부터 철수·대사·엔딩·휴식터를 정상입력으로 별도 확인. [검사로그](evidence/checks/normal10.txt) |
| 이전2/5장 승리 | 이전 정상승리 trace는 그대로 유지,전체전투 반복0. 이번runtime에서 실제승리저장의 outcome반복+브라우저 download/fileinput2×2로 XP/SP/장비/성장/장부/방문수 및 terminal save없음 새 확인. [native](evidence/checks/prior-normal-rewards.txt), [browser](evidence/save/browser-checks.json) |
| 구전투/성장 | 같은10장판본 exact Continue,구판본10장만재시작/미동기XP·장착·진척 보존,9장불변. 기존 통합의27장/library·정확2/5/11소스,SP/air/map6순열×3반복·HP비율·전체profile/보상 멱등 새 PASS. [결과목록](evidence/checks/results.json) |
| 입력/연결 | 조이스틱120,충전126,typecheck,web-split PASS. 실제CDP touch/생산frame 대표19판정·오류0. [입력trace](evidence/input/input-trace.json), [로그](evidence/checks/joystick-browser.txt) |

새 전체10장은 새 스킬/근접AI의 방어 구간 영향 확인을 위해 한 번만 실행했다. 과거 엔딩 후보21턴/58발/회복3과 이번22턴/62발/회복3은 다른 실행이다. 같은 정책의 단일 결과이며 모든 전략/난이도 통계나 난이도 승인을 뜻하지 않는다. 이전2/5장 전체완주와11장59턴 전체플레이를 반복하지 않았다.

재현은 `node tests/final-stage10-checkpoint.mjs`와 로컬8000 서버에서 `HONRO_ENDING_OUT=<별도출력폴더> HONRO_ENDING_CHECKPOINT=game/docs/stage-review/final-integration-20261021/evidence/normal10/round-22.json python tests/final-act-endings-browser.py`를 사용한다. 전체 정상 전투를 증거 확인만을 위해 다시 돌릴 필요는 없다. gzip은 손실 없으며 [원본hash](evidence/normal10/gzip-manifest.json), 모든 원본PNG/증거파일 해시는 [MANIFEST](evidence/MANIFEST.json)에 있다.

## 실패·미실행·남은 경계

이번 검사 초기에 실제 저장 active=archer를 knight로 가정한 browser/native fixture가 실패했다. 실제Tab/selectHero 입력으로 바로잡았다. native 철수presentation도STEP=1/120에서100frame=.833초만 기다린 검사오류여서200frame으로 교정했다. 게임코드 변경 없이 해당항목 재검사PASS. [실패원문](evidence/failures). 초기 npm 기본캐시 쓰기 실패는 허용된/tmp 캐시로 정상설치했다. 승인 거부나 우회는 없었다.

**기존 실패는 해결했다고 표시하지 않는다.** 이전 통합의 existence-damage(S14),existence-variety(exact delta),stage2-airborne(역사clone flightEscape),current-runtime-contracts(과거build승인hash),과거stage5-refinement 직접경로 기대와 개별후보의 다른29장/옛HP fixture는 [기존 보고서](../integration-20261021/README.md#실패를-통과로-바꾸지-않은-항목)에 남아 있다. 엔딩 후보의 story-direction은 관련 연출/30장진입 후 무관1장나무꾼x기대3178/실제3154에서 중단한 [기존 기록](../act-endings/evidence/README.md)이며 이번 재실행/수리를 하지 않았다.

실기기 터치/Safari/전체캠페인 전술·모든빌드/수동전체전투/공개Pages는 미검증이다. 실행 차단·미확인 쓰기 결과는 없으며 남은 단계는 **부모의 최종 화면 판단과 master/Pages 승인**이다. 원격브랜치push 성공을 master반영이나 Pages배포 성공으로 표현하지 않는다.
