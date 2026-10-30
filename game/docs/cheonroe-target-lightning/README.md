# 천뢰호 M05 — 모든 유효 적에게 개별 낙뢰

2026-10-22. `sys8994/honro`, 작업 브랜치 `feat/cheonroe-target-lightning`.
착수 시 `git fetch origin master`로 확인한 기준은 `be79826869c70ae68950eb8be8a4bd7d187600dc`였다. 검수 패키지 push 뒤 원격 master도 같은 SHA였다.

구현·집중 검사·로컬 실제 게임 캡처를 완료했다. **미술 최종 합격, master 통합, GitHub Pages 배포를 완료했다고 주장하지 않는다.** 이 세 단계는 부모 담당자의 최종 검수·통합 범위다.

## 커밋과 범위

| 변경 단위 | 원격에 push한 SHA |
| --- | --- |
| 런타임·머리 관절 연결·밸런스·집중 검사 | `b1ea007fea6a43170ce518f9dd0da9a5e3d3175c` |
| 최종 빌드·실제 게임 JPG·원본 검사 결과·브라우저 허용오차 수정 | `e1e345ad2637e5b1e2df5cc1a7d23ffe4227cee3` |

이 README는 위 검수 패키지를 설명하는 후속 문서 커밋이다. README 커밋 자체는 `git log -1 --format=%H -- game/docs/cheonroe-target-lightning/README.md`로 확인할 수 있다. 부모는 위 두 커밋을 함께 검토해야 한다.

수정 파일은 `shared/engine/src/{engine,skillMechanics,art,skillRedesignData,skillLore,skillNotes}.ts`, `shared/runtime/monster-vector.js`, 관련 검사와 생성 빌드다. 아이콘 소스·아이콘 이미지·몬스터 SVG/리그는 바꾸지 않았으며 이미지 생성도 사용하지 않았다. `shared/assets/actors/actors.runtime.js`의 변경은 빌더가 monster-vector.js를 입력 해시에 포함해 갱신한 `sourceSha256`뿐이다. actors의 실제 assets 객체는 기준과 동일하다.

## 판정과 좌표

1. 호리병의 기존 비행·충돌과 `gourdSky → skyWait` 전환을 유지한다. 착탄 뒤 **0.35초**에 발동한다.
2. 기존 `skyStrikePoint`를 그대로 호출한다. 시작점 `(impact.x, min(-170, impact.y-600))`에서 착탄점까지 반경 3의 지형 전용 projectileCollision을 수행하고, 첫 차폐 좌표를 원래 범위 피해 중심으로 쓴다.
3. 발동 순간 `blastUnitTargets`를 한 번 배열로 고정한다. 거리 기준은 기존 그대로 `d = hypot(unit.x-center.x, unit.y-unit.h*0.45-center.y)`, 포함 조건은 **`d < R + unit.r`**다. 정확한 경계는 제외한다. `R`·SP 성장·차폐·포획/방출 보호·`attackAllows`와 5장 고리쇠의 특수 지형 판정을 바꾸지 않았다.
4. 이 스냅샷에서 살아 있는 적(`side != projectile.side`, `side != 2`, `hp > 0`)마다 `lightningBolt`를 **한 개씩** 생성한다. 대표 적·거리순 일부 선택·10마리 상한이 없다. 적 0명은 줄기 0개다. 대기 중 죽거나 제거되거나 범위 밖으로 이동한 적은 새 스냅샷에 들어오지 않는다.
5. 벡터 몬스터는 실제 종 선택·머리 관절의 부모 변환·방향·몸체 배율을 공유하는 `HonroMonsterVisual.headPoint`를 쓴다. 관절이 없는 대상이나 미술 모듈 없는 엔진 검사는 `(unit.x, unit.y-unit.h)`로 대체한다. 좌표는 월드 좌표이며 viewport·줌·화면 안 여부로 대상을 제한하지 않는다.
6. 피해·넉백 전의 머리 좌표와 거리 스냅샷으로 줄기를 만들고, **같은 스냅샷으로 기존 blast를 딱 한 번** 실행한다. 줄기 자체는 `hurt`/`blast`를 실행하지 않는다. 치명타·방어·속성·넉백·지형 피해 등 기존 처리도 유지한다. 원래 직접 조준한 주탄의 아군/중립 범위 피해 허용 규칙은 보존하고, 적 이외에는 새 줄기를 표시하지 않는다.
7. 렌더러의 370개 장식 효과 예산이 유효 적의 낙뢰를 삭제하지 않게 했다. 줄기는 기존 0.9초 수명으로 소멸한다. 일반 폭발은 지연 generator를 사용해 기존 순차 판정 동작을 보존하고, M05만 명시적 스냅샷을 전달한다.

### 기존 천장 판정과 요구의 모호한 지점

기존 판정은 **적별 하늘 사선 검사**가 아니라 **호리병 위 중앙 열 하나의 첫 지형 충돌 → 그 지점의 범위 폭발**이다. 따라서 높은 두꺼운 지붕은 아래 적을 범위 밖으로 만들지만, 낮은 지붕의 윗면에서 폭발하면 아래 적까지 기존 범위 피해가 닿을 수 있다. 적별로 새 천장 면역을 추가하면 기존 유효 대상을 줄이므로 그렇게 바꾸지 않았다.

피해 중심과 유효 적은 이 기존 판정으로 결정한다. 줄기만 각 적의 머리에서 위로 지형 전용 collision을 조회해 **가장 가까운 천장 아랫면부터 머리까지** 표시한다. 이 시각 조회는 oneWay도 양면으로 다루어 발판을 관통하는 하늘 줄기를 그리지 않으며, 피해 판정에는 영향을 주지 않는다. `desktop-ceiling-lightning.jpg`는 지붕 위의 기존 폭발 원과 아래 머리의 짧은 줄기를 동시에 보여 준다.

## 피해 수식과 수치

기본 피해는 `112 → 128.8`, 정확히 **1.15배**다. 기존 LM05 NPC 사본의 기본 피해 `94`는 그대로다. 기존 플레이어 담허 계수 1.20 및 1.18도 그대로 유지했다.

플레이어 주탄은 다음과 같다. `A`는 공격력, `c`는 기존 저주 공격 감소, `J`는 기존 주천 강화다.

```text
n = clamp(SP-1, 0, 7)
G(SP) = 1 + min(2,n)*0.16 + max(0,n-2)*0.08
D_before = 112   * A * (1-c) * G(SP) * 1.20 * 1.18 * (1+J)
D_after  = 128.8 * A * (1-c) * G(SP) * 1.20 * 1.18 * (1+J)
F(d,R) = 0.42 + 0.58 * (1-clamp(d/R,0,1))
범위 피해 입력 = D * F(d,R)     # 적마다 한 번, 줄기 수를 곱하지 않음
R = 190 * 기존 skillRadiusFactor(SP) * 1.12
```

실제 엔진의 `A=2`, 저주/주천/방어/치명 보정 없음, 물리 크기 h80/r18, 바닥 착탄 시험값이다. 반경 3의 중앙 열 때문에 바닥 y1000의 피해 중심은 y997이며, 한 적의 몸통 거리 d는 33이다.

| SP | 주탄 D 전 → 후 | 실제 hurt 입력 전 → 후 | 정수 HP 감소 전 → 후 | 반경 R |
| --- | --- | --- | --- | --- |
| 1 | 317.184 → 364.7616 | 288.655326 → 331.953625 | 289 → 332 | 212.8 |
| 4 | 444.0576 → 510.66624 | 408.396758 → 469.656272 | 408 → 470 | 238.336 |
| 8 | 545.55648 → 627.389952 | 504.665381 → 580.365188 | 505 → 580 | 255.36 |

검사는 같은 조건에서 기존 strike 알고리즘/기존 저장 피해량과 대조해 타깃 수 동일·실수 피해 정확히 1.15배를 확인했다. HP 정수 반올림·방어·방호·잔여 HP 상한 때문에 화면 숫자가 매번 정확히 15% 커지는 것은 아니다. 이미 저장된 비행/대기 주탄의 damage를 재계산하지 않고, 다음 새 발사부터 새 기본 피해가 적용된다.

## 줄기 폭

`lightningBolt.size: 5 → 3.5`. 기존 공통 renderer의 배율을 바꾸지 않아 각 선층이 모두 70%가 된다. 뇌호 M04의 size2.8은 바꾸지 않았다.

| 선층 | 기존 월드 폭 | 변경 월드 폭 |
| --- | --- | --- |
| 외곽 청색 광휘 (`size*7`) | 35 | 24.5 |
| 내부 청색 광휘 (`size*3`) | 15 | 10.5 |
| 창백한 코어 (`size`) | 5 | 3.5 |
| 흰 중심 (`max(.8,size*.35)`) | 1.75 | 1.225 |

분기 선도 동일한 0.42 배율 아래에서 30% 얇아진다. 접점 발광 반경의 size 기여는 줄어들지만 기존 분기 개수·수명·불투명도·접점 방전 구조는 보존한다. 실제 화면 폭은 위 값에 카메라 줌이 곱해진다.

## 실행한 검사

AGENTS.md, 루트 README, BUGFIX_CONTEXT, BUG_LOG의 관련 맥락과 기존 빌드 명령을 확인했다. 최종 소스/생성물에서 다음 검사가 통과했다. 무관한 전체 verify는 실행하지 않았다.

| 명령 | 확인한 내용 |
| --- | --- |
| `npm --prefix game run typecheck` | 공통 엔진 TypeScript strict 검사 |
| `npm run test:cheonroe-target-lightning` | SP1/4/8 × 0/1/4/10, 엄격한 범위 경계, .349/.35초, 대기 중 사망·제거·포획·방출 보호·범위 이동, 천장 높이 3조건·oneWay, 치사 피해 뒤에도 남는 시각 스냅샷, 재시전, 저장된 대기 탄, 420명 무제한 줄기, 중복 피해 없음 |
| `npm run test:damheo-damage` | 담허 16기예 SP1/8, 실제 피해·후속탄·반사·설치·NPC/저장 범위 회귀 |
| `node tests/quest-hostile-targets.mjs` | 기존 퀘스트 적 표적 등록/보호 규칙 회귀 |
| `node tests/projectile-platforms.mjs` | 실제 발판 상부 진입·반사·천장·설치·예측·저장 비행 등 관련 6검사 묶음 |
| `npm run build` | Game/Workshop/직접 Playtest 공통 빌드, 콘텐츠 해시 파일 255개 |
| `node tests/web-split.mjs` | 현재 255개 파일의 바이트/해시, native/embedded 기본 진입·저장 보호·공통 데이터 일치 |
| `npm run test:cheonroe-target-lightning:browser` | 실제 Chromium의 1440×960, 360×800, 줌 .45/.66/1.15/1.4, 0/1/4/10, 확대 시 화면 밖 적 4명 포함 10줄기, 천장, 420줄기 보존과 0.9초 이후 소멸, 예외 0 |
| 브라우저 내부 DOMMatrix 대조 | 머리 관절이 있는 14종 × 방향2 × 키2 × 기본/피격 상태2 = 112조건. renderer의 계층 변환과 world headPoint 대조 |
| `git diff --check` | 공백/패치 형식 검사 |

검사 작성 중 바닥의 실제 충돌 중심(y997), LM05의 현행 기본값(94), 수련 모듈의 지연 로딩을 시험 설정에 반영했다. 머리 관절 DOMMatrix 비교는 브라우저 연산의 약 0.000002px 차이를 기존 1e-7 문턱이 실패 처리해 허용오차를 **1e-4 월드 px**로 고쳤다. 이 수정은 `e1e345ad`에 있으며, 최종 검사는 통과했다. 실패한 중간 검사를 미술 합격으로 대체하지 않았다.

## 실제 실행 증거

모든 JPG는 실제 로컬 `HONRO.html`의 production App/Engine/Scene을 Chromium으로 실행해 얻은 화면이다. **선언된 진단 arena**를 주입하고 RAF를 멈춘 뒤 결정적인 시간 간격으로 진행했다. 합성·리페인트·이미지 생성은 하지 않았다.

10마리 데스크톱/모바일 장면은 `Engine.fire(57°, 52.5%)`로 발사한 실제 탄을 `Engine.tick(1/120)`으로 비행시켜 자연 충돌·대기·낙뢰까지 실행했다. 이 경로는 시험용 impact 호출로 착탄을 대체하지 않는다. 나머지 경계/천장/개수 진단은 의도적으로 위치·상태를 고정하고 production impact/strike를 직접 호출한다. 일반 캠페인 완주나 손 조작 플레이 증거는 아니다.

| 화면 | 발사 직후 | 착탄 대기 | 실제 낙뢰 프레임 | 효과 종료 후 |
| --- | --- | --- | --- | --- |
| 1440×960, 적10 | [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-target-lightning/evidence/desktop-10-before.jpg) | [대기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-target-lightning/evidence/desktop-10-wait.jpg) | [10줄기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-target-lightning/evidence/desktop-10-lightning.jpg) | [후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-target-lightning/evidence/desktop-10-after.jpg) |
| 360×800 세로, 적10 | [전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-target-lightning/evidence/mobile-10-before.jpg) | [대기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-target-lightning/evidence/mobile-10-wait.jpg) | [10줄기](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-target-lightning/evidence/mobile-10-lightning.jpg) | [후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-target-lightning/evidence/mobile-10-after.jpg) |

천장 사례: [천장 아래의 실제 낙뢰](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/cheonroe-target-lightning/evidence/desktop-ceiling-lightning.jpg).
JPG 9개의 파일 크기는 각각 28,024–160,493 bytes로 모두 1MB 미만이다.

검수자가 원본 수치도 볼 수 있게 [엔진 결과](evidence/engine-results.json)와 [브라우저 결과](evidence/browser-results.json)를 함께 커밋했다. 브라우저 결과에는 시나리오별 타깃 HP, 줄기 시작/끝 월드 좌표, 실제 보존 줄기 수, 화면 밖 줄기 수, 발사 각도/힘, 예외 목록이 들어 있다. 축약된 성공 문구만 제공하지 않는다.

## 남은 제한과 부모 검수 항목

- 이 보고서는 기능/회귀 통과와 실제 렌더 관찰을 기록한다. 최종 미술 승인이나 Pages 검증은 부모 담당자가 해야 한다. master 병합·배포는 수행하지 않았다.
- 10마리가 좁게 모이면 기존 분기 선·접점 광휘가 겹친다. 360px에서는 피해 숫자도 겹친다. 모든 대상 줄기를 유지한 실제 JPG를 남겼으며, 이를 자동 검사 통과만으로 미술 합격 처리하지 않았다.
- 머리 관절은 공격·피격 등 현재 유닛 상태와 동일한 리그 변환을 쓰지만 idle 시간은 0을 샘플한다. 지속 idle 흔들림의 작은 차이는 남는다. 관절 없는 특수 적/보스는 물리 몸체 상단으로 대체한다. 줄기는 발동 순간의 타격점에 고정되며 이후 이동을 추적하지 않는다.
- 420명 시험은 대상 상한/장식 예산 누락이 없고 효과가 만료되는지 확인한 스트레스 진단이다. 420명 실제 전투의 프레임 성능 또는 모든 모바일 실기기 성능을 인증하지 않는다.
- 기존 천장 판정은 위 설명처럼 중앙 열 기준 범위 폭발이다. 이를 적별 하늘 차폐 규칙으로 재설계하는 작업은 포함하지 않았다.
