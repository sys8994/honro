# P2.1 도달 불가 옛 캠페인 초기화 제거 — 2026-10-24

기준 master는 `936f2629cfd1ff1e0e6df527df02aaa2e3562caf`다. closure-private makeLegacyWorld를 initializeTrainingBattle로 명명하고 도달하지 않는 nontraining stage 지형·옛 campaign enemy·objective actor/seal/marker 분기 및 그 전용 mk만 제거했다. training ternary는 실제 practice/2400×1380/vertical=false/wind7/party=[cls]/x280 값으로 단순화했다.

public makeWorld(st,p,training,cls,skill)와 HonroWorld.build의 6번째 callback 위치는 그대로다. initializer의 사용하지 않는 세 번째 인자는 `_training`으로 남았고 world.trainingWorld는 여전히 true positional 인자를 넘긴다. world.js는 변경하지 않았다. C.createBattle(1,clone(p),'practice',{party:[cls],distance:900}), 초기 terrain2개, topAt, hero/applyHero/loadout/ranks, 임시 dummy5개, 공통 필드·session·sceneVersion은 보존했다. 최종 trainingWorld가 seed 일부를 덮는 기존 동작도 그대로다. BASE 및 다른 metadata 초기화는 보존했고 fallback은 남기지 않았다.

함수217→70행으로147행/8,617바이트 감소했다. callback 이름 변경까지 포함한 main.js 전체 순감소는147행/8,608바이트다. 다른 provider/hooks/자산 퇴역은 하지 않았다. 실행 속도·FPS·네트워크 개선을 주장하지 않는다.

## 관련 검사

- `node tests/training-initializer-p21.mjs`: app-regression-helpers로 production main을 평가하고 HONRO_TOOLS.makeWorld(...,true,...)를 호출했다. training-layout의 자체 initializer는 사용하지 않았다. world.build의 실제 production callback을 감싸 덮어쓰기 전 seed도 관측했다.
- 4클래스 각각 basic/ordinary(rank3)/ordinary(rank0→1)/ultimate/skill 생략 기존 loadout 총20경우에서 기준/현재 seed 전체 JSON, 최종 battle 전체 JSON 및 profile 전체가 exact였다. Date.now=1792818000000과 Math.random=.246813579를 고정했고 training 결과에서 삭제/정규화한 필드는 없다. 각 생성 전후 입력 profile도 불변이었다.
- seed practice/2400×1380/vertical=false/wind7, hero x280/y1010, 초기 terrain2개·임시dummy5개 및 step 위 dummy y850, 선택 loadout/ranks/hero ranks 동기화·session을 확인했다. sceneVersion은 seed12/최종13이다. 최종 training은 기존6000×2300/hero1+적20이다.
- 정상 canonical1장과 실제 HONRO_SPLIT_V1 25장+version1 profile에 호출 즉시 throw하는 training callback을 넘겼다. 둘 다 콜백을 호출하지 않고 HonroMaps.createBattle로 갔으며 실제 선택 map의 객체 identity도 확인했다. 24장은 frozen v1 map 목록에 없으므로 진짜 v1인25장으로 검사했다. 캠페인 전체 battle JSON 동치나 플레이 완주는 주장하지 않는다.
- initializer 앞과 public makeWorld 이후 main 소스는 callback 이름 교체를 제외하고 exact다. 전투/지형/enemy/스킬/밸런스/대사 코드는 범위 밖 수정이 없다.
- `python3 tests/training-initializer-browser-p21.py`: 로컬 Chromium154,390×844 touch, 새 storage context, 정상 App/rAF에서 실제 UI의 제목→휴식터(도입 skip)→허공터→설정 닫기→리셋→일시정지→휴식터를 클릭했다. seed/session 재생성, 같은 궁수/A01·적20, 성장/장착/조율/완료 기록 불변, frame59·JS error0 확인. 이 브라우저 경로는 궁수 기본기1개이며 다른 클래스/선택은 위 native 동치 범위다. 실기기/공개 배포 검증은 아니다.
- `npm run build`, `node tests/web-split.mjs`, `node tests/profile-store-p01-preservation.mjs` 통과. 활성354파일/실제 공개45그래프/중복 제외849파일 SHA·bytes·기존 metadata 보존. web-split의30장 입력 데이터 비교는 플레이 순회가 아니다. 이전 P1.1b 성공 발행만 기존 도구로 등록했고 새 후보는 발행으로 등록하지 않았다.

entry `web/entries/game.85cf3d655e3f0db0.js`, manifest SHA256 `a0adf76629b2b03b900c5fa08ab82868803101a87ded33f696e750a316ffd609`.

원시 결과/캡처는 `_local/reports/training-initializer-p21/`에 보관했다. 사용자 저장을 검사에 사용하지 않았다. master/Pages 반영은 부모 담당이고 다른 P1/P2 단위는 대기한다.
