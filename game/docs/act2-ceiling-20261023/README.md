# 2막 실제 천장 조사와 14장 후보

기준: 공개 `5987f6db1a500f7a7911880e9b84578b9cf37cb8`. Pages39883682247 성공(2026-10-23T01:25:17Z)은 부모 확인. master/Pages는 이 작업에서 수정하지 않는다.

## 조사 결과

생산 factory의 충돌 지형과 `HonroTerrainDomain.render`를 대조했다. `evidence/before-audit.json`은 장별 전체 ceiling polygon과 실제 목표 위치의 위쪽 투사체 충돌 probe다. 이 probe는 전투 완주나 미술 승인을 뜻하지 않는다. 같은 ID의 전체 월드 polygon을 그리고 playProjection으로 잘라 충돌시키며, 줌아웃이 천장 충돌을 끄지 않는다.

| 장 | 현행 실제 천장 | 입장 발바닥→천장 | 판정 |
|---|---|---:|---|
| 11 | 없음 | 없음 | 외문·산길·하부 피난처. 동굴 내부 전체를 구현한 장으로 볼 수 없음. 별도 지리 판단 필요 |
| 12 | sq-cave-roof/buttress | 외부 입장에는 없음 | 채석장→동굴 진입. 아래 출구의 실제 headroom 약446px |
| 13 | cave-roof | 열린 진입 | 함몰지→석문 회랑, gate1067/exit1530px |
| 14 | **없음** | 없음 | 수직 지형 author가 기존 천장을 제거하고 rooms.ceilingIds를 비움. 배경 암벽만 존재. 물리도 누락 |
| 15 | cave-roof | 744px | groove2089px 등 높이 차이가 있음 |
| 16 | cave-roof/undercroft-tooth | 1682px | monk2610/hall2993px. 천장 있음과 낮은 회랑은 구분 |
| 17 | cave-roof/service-vault-tooth | 1248px | repair1311/notes1229px, hoist2407px |
| 18 | cave-roof/lower-vault-tooth/east-gallery-roof | 2738px | 종 하부 leak6033/keeper6247px. 종 하부의 높은 대공동. 실제 천장 존재, 높이 조정 대상 아님 |
| 19 | 위와 같은 묵종 지리 | 6213px | 하부 목표 약6007–6153px. 묵종 하부의 높은 대공동. 실제 천장 존재, 높이 조정 대상 아님 |
| 20 | exit-overhang | 916px | 출구 초반 실제 덮개, escort-mid 이후 노천. '다시 하늘 아래' 외부 이탈 구간 |

11·12 야외 원경과 13~19 동굴/20 외부 이탈 구분은 `ACT2_SPATIAL_IMPLEMENTATION.md`, `ACT2_IMPLEMENTATION_NOTES.md` 및 활성 지형/목표의 근거다. 오래된 라운드·크기 수치는 현행 측정치로 인용하지 않았다. 모든 2막을 노천으로 간주하지 않는다. 천장 자체가 없는 장은 11/14 두 곳이며, 내부 마을인14의 누락을 우선 수정한다. 사용자 정정에 따라 18/19의 높은 공동을 결함으로 취급하지 않으며 높이 조정 대상에서 제외했다. 동굴마다 좁은 회랑/높은 공동의 차이를 보존한다.

카메라 focus는 기본 playBounds 좌우320/위1800/아래240까지 확장하며 viewport는 그 밖도 본다. 최소 줌은 가로6800px 전술 폭과 배우66px→3.75화소 조건으로 결정한다. 카메라·화면 밖 여부는 투사체 충돌 경계가 아니다. 실제 천장은 화면 밖이어도 충돌하고 전체 월드 암반은 카메라 바깥까지 이어진다.

사용자 첨부 `libfile_a91002e9521481919f1a28fa124df7ff`는 정식 Library materialize 다운로드에서 `download failed`로 실패했다(HTTP 상태 미제공). 우회하지 않았으며 부모의 직접 관찰과 동일 production14 화면을 사용했다.

## 최종 후보와 실제 화면

- 브랜치: `fix/act2-ceiling-stage14-20261023`. 실행·최종 빌드 입력 SHA: `925827fc76eb0aac7284a5824a8fa396213cf385` (승인 master9f7a 통합 포함). 이후 변경은 검사·문서·성공 발행 보존 이력·생성물이다.
- 생성 entry: `web/entries/game.776bd78fb65188a0.js`, chapter14: `web/data/chapter-14.e8764e31ee5270a1.json`.
- 천장 `6c950aeaff90b9c28577b7bfdaf7694d077db16c`, 인공 돌발판 `a3d8f4d8`는 별도 수정 단위다. 명암 면 보완은 `08778148`이다.

| 검수 화면 | 실제 JPG |
|---|---|
| 넓은 전체 조망 | [overview](screens/overview.jpg) |
| 모바일 실제 최소 줌(390/6800) | [portrait-max-zoom](screens/portrait-max-zoom.jpg) |
| 상층 전투 줌 / 중층 공동 | [upper-battle](screens/upper-battle.jpg), [middle-battle](screens/middle-battle.jpg) |
| 모바일 세로 / 가로 | [portrait](screens/portrait.jpg), [landscape](screens/landscape.jpg) |
| 준비된 하부 마당의 실제 점프 전→착지 | [before](screens/platform-before-jump.jpg), [after](screens/platform-after-jump.jpg) |
| 실제 새로고침→Continue | [continue](screens/continue.jpg) |

모든 JPG는1MB 미만이다. 신선한 일반 입장 레벨13 준비 profile과 카메라 이동으로 촬영했다. 일반 화면용 배우 위치는 수정하지 않았다. 점프 전후만 별도의 **처음 한 번 지지면에 휘겸을 배치한 full-roster 물리 fixture**이며, 이후 Engine.jump/tick만 사용했다. 사용자 R9 저장이나 정상 전투로 이곳까지 도달한 장면이라고 주장하지 않는다.

## 변경 내용과 보존

14장의 기존 암반/17경로/배치/목표/대사/미술은 보존하고 `v14-cavern-vault` 한 고체를 추가했다. 상층 진입→주민 집→중층/동쪽 능선의 굴곡을 따르며 중앙·하부의 큰 공동을 메우지 않는다. 전체 월드 polygon이 유일한 실루엣이며 playProjection 충돌과 같은 형상을 material plane으로 그린다. 보이지 않는 벽/먼 장식 덮개가 아니다. 원래 저작 recipe의 마지막에도 같은 순수 helper를 연결했다.

사용자 얇은 지붕은 `v14-family-roof-step`, x4140–4480/y6535–6570의35px 돌발판이다. 기존 `stone-lintel` solid이며 스토리/퍼즐 차단 역할이 없어 one-way로 변경했다. 목재 기둥은 비충돌 장식 그대로다. 투사체는 `projectileSolid:true`로 원래 아래/위/옆면 차단·반사를 유지한다. 몸체의 플랫폼 윗면 접촉을 투사체 정책과 분리했으며 이 opt-in은 해당 돌발판 한 곳뿐이다. 일반 one-way 다리의 기존 아래→위 투사체 통과는 보존했다.

11/12/13/15~20의 지형과 천장 높이는 바꾸지 않았다. 특히18/19 높은 공동은 허용되는 공간이며 묵종 신규 미술·부착혼40%는 미반영이다. O05/18장 짧은 퀘스트/카드 드래그/대사 UI/증원 카메라와 최신 스킬 이미지 전용 표시·목표 버튼 투명행은 승인9f7a 소스와 byte exact다.

## 검사와 한계

- 천장 충돌 형상의 17경로×4직업=68 유한 Engine move/jump/wait 검사 통과(6c950 소스). 초기 한 번의 경로 시작 pose/전투 배우 격리/열린 다리 선행 fixture이며, 진행 중 좌표·HP·이동도·recover 보정 없음. 최종 one-way 변경 후 영향을 받는 CF 경로4직업을 다시 통과했다. 천장 명암 보완과 master9f7a 통합은 이 충돌 형상/경로를 바꾸지 않는다.
- 생산 factory51배우 모두 천장 매몰 없음,2초 idle 위치/HP exact. 기존 지형·배우·퀘스트를 허용한 두 변경만 되돌려 전체 campaign deep-equal 확인.
- 실제 발사: 입장 설오 A01 15°/30%는 원래 바닥까지,75°/90%는 천장에 충돌. 합법 C.train 레벨13 담허 M11 90°/100%는 천장 반사→바닥 접촉으로 종료. 예측/실제 종점 일치. 공격력·기력·적HP를 보정하지 않았다. 적을 격리한 물리 검사이며 정상 전투 완주 증거가 아니다.
- 네 직업 모두 x4300/y6750에서 실제 점프로 y6535에 착지, HP exact/이동도75 사용/추가1초 안정. M09는 실제 C.train→80°/50% 발사로 상부 진목을 설치하고, 설오의 정상 이동→E로 x4176.066/y6535 합법 접촉 착지. 가짜 진목/강제 축지 좌표 없음. 적 격리 fixture다.
- 실제 production 브라우저에서는 전체51배우를 유지한 준비 시나리오에서 휘겸 점프/착지를 확인했다. 저장은 실제 export→페이지 새로고침→Continue **전투 전체 exact**. 그림과 목표/다음 행동 표시를 직접 보았다.
- 타입/공통 Game·Workshop·직접 Playtest 빌드 통과. 최신 UI/O05/18장 모듈 보존, 성공 발행 전체 그래프와934의13장 두JSON hash/길이를 확인했다. 성공9f7a(Pages39886957929,02:00:19Z)는 부모 확인 범위 그대로 보존 이력에 등록했다.

### 기존 저장 정책

`AGENTS.md`와 SOP의 지형 revision 규칙에 따라14의 map revision을1로 올렸다. **구14 진행 전투는 그 장 입구에서 재시작한다.** 성장/SP/장착/캠페인 완료/행동 순서는 보존하며 전체 저장을 초기화하지 않는다. 실제 과거 정상 입력 R21 저장으로 이 정책을 확인했다. 준비한 R9 revision fixture도 같은 경로를 확인했지만 사용자 R9 원본은 전달받지 않아 직접 확인하지 않았다. 구R9의 위치/HP/턴/진목을 그대로 유지하는 in-place 이행을 구현했다고 말하지 않는다. 새 revision의 저장은 위치·HP·행동·진목을 포함한 동일 상태 Continue를 사용한다. 18장 지리는 revision 변경 대상이 아니다.

### 집중 미술3회 + 별도 종합

1. 전체 구조: 기존 열린 화면과 첫 후보 전체/상층을 직접 열어 이어진 천장/기존 수직 공동을 비교했다. 첫 후보의 평행한 명암 띠를 발견해 불규칙한 큰 암반 면으로 보완했다. 첫 검수 사진은 review1/에 보존했다.
2. 디테일/가독성: 최종 상층·중층 전투 화면을 직접 열어 명암/두께·집/NPC/비행 적의 여유와 통로를 확인했다. 충돌선을 장식으로 가리지 않았다.
3. 모바일/상태: 최종390×844/844×390과 실제 점프 전후/Continue를 직접 열어 천장 연결, 인공 발판 구분, 목표와 조작 가독성을 확인했다.
4. 별도 최종 종합: 최종 모바일 실제 최대 축소에서 상층 암반부터 피난 다리·하부 바닥까지 한 화면으로 직접 확인하고, 물리/저장/비대상 소스·성공 발행 자산 보존 결과와 대조했다. 높은 중앙 공동은 의도적으로 유지했다.

### 미실행·기존 검사 제한

새14장 전체 정상 전투 완주/기존 사용자 R9 원본/전체30장/전역 verify/실제 Pages 배포는 실행하지 않았다. 기존 `one-way-platforms.mjs`는 오래된 전체 소스 목록 고정 조건에서 물리 검사 전에 실패했다. `stage14-rescue-retained-boundaries.mjs`는 이미 배포된 주변 적 interaction gate 제거와 반대로 다리의 근처 적 존재 시 거절을 기대해 실패했다. 이번 지형 변경의 새 게임 실패로 해석하거나 그 옛 조건을 되살리지 않았다. 관련 직접 물리·현재 저장 검사는 별도로 통과했다.
