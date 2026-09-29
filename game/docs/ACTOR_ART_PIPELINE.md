# 동맹·소환귀·목표물 벡터 제작

현재 제작 원본은 `tools/actor-forge/`, 생성물은 `shared/assets/actors/`다. 기존 네 동행 v008과 일반 몬스터 11종을 스타일 기준으로 삼는다. 과거 서양식 마법사·기사·유령 그림은 전후 비교와 앵커 측정에만 사용한다.

## 조사 범위와 배정

| 실제 개체 | 새 디자인 | 식별과 보존 |
|---|---|---|
| 상여꾼·호위·궁수·치료사·의식승·도사·무당·척후병 | `ally_*` 8종 | `honroAlly`/`allyRole`; 기존 역할 수치·AI 유지 |
| 1장 나무꾼 | `woodcutter` | 이름 또는 `npc-woodcutter`; 도끼와 지게 |
| 7장 덕수·월이·칠복, 편집기 주민 | `civilian` | 구조 주민을 치료사 마법사 그림과 분리 |
| 배회령·등불귀·돌격귀·수호령·문지기귀 | `summon_*` 5종 | 소환 여부를 직업보다 먼저 판단; 소단으로 오인하지 않음 |
| 2장 홍만의 상여 / 8장 빈 상여 | `bier` / `bier_boss` | 닫힌 상여와 열린 빈 상여를 구분 |
| 6장 부상자 운반대 | `stretcher` | 기존 civilian 타입 유지; 누운 부상자와 운반대로 표현 |
| 4장 피란문 | `gate` | 기와 처마·목주·문살 |
| 구 저장/작성 맵의 숫자 boss | `colossus` | 봉인 목판과 뿌리; 기존 보스 능력 보존 |
| 설오·담허·휘겸·소단, 이름 있는 동맹, 적/협력 소단 | 기존 party v008 | 별도 디자인으로 덮어쓰지 않음 |
| 일반 적 11종·그 중간보스 | 기존 monster | 3배 앵커 개선판 보존 |

`actor-vector.js`의 분기만 표시 에셋을 선택한다. 캠페인 10장의 실제 생성 유닛, 편집기 카탈로그, 실제 소환 생성 경로를 검증한다. 일반 몬스터 11종을 편집기에서 아군/중립으로 배치해도 해당 종의 개선된 외형을 재사용한다. 미등록 사용자 타입의 옛 fallback까지 임의의 역할로 치환하지 않는다. 배경 소품·효과·UI 아이콘은 이번 캐릭터 전수조사의 범위 밖이다.

## 비율과 미술 기준

1. 승인된 네 동행과 **동일한 표시 높이**로 비교한다. 큰 머리, 넓은 눈, 짧은 팔다리, 둥글고 밝은 덩어리를 피한다. 사람의 얼굴 원형을 0.68배로 다시 작성하고 어깨/허리 아래를 길게 조정한다. 이는 제작 시 좌표 수정이며 애니메이션 중 머리를 늘이거나 줄이지 않는다.
2. 턱·목·옷깃을 하나의 연결로 본다. 머리 축소 후 길어진 목을 그대로 두지 않는다. 얼굴·손·발·어깨를 함께 비교한다.
3. 복식은 겹친 옷깃·포·넓은 소매·가사·전립을 큰 면으로 표현한다. 역할은 활, 목탁, 불자, 부채/방울, 지게, 약낭으로 구분한다. 서양의 뾰족 마법사 모자·수정 지팡이·판금 어깨갑옷·방패는 쓰지 않는다.
4. 소환귀는 수의와 풀린 머리, 사각 행등, 목탈과 몽둥이, 금줄 장승, 창호 문짝의 서로 다른 실루엣을 갖는다. 밝은 청색 테두리나 고르게 웃는 입 대신 어두운 목재·균열·불규칙한 조각을 사용한다.
5. 먹빛·마른 삼베·바랜 청록·갈색이 기본이다. 붉은 끈과 부적, 무당의 탁한 보라를 제한적으로 남긴다. 빛나는 혼의 면적도 제한한다.
6. 256/128px에서 얼굴과 연결, 96/64px에서 실루엣과 도구를 본다. 작은 얼굴의 눈코입까지 선명하게 보이도록 머리를 확대하지 않는다.

이는 한국식 다크 판타지 창작물이며 특정 시기 복식의 고증 복원은 아니다. 모든 인물을 똑같은 시대/신분으로 설정하지 않는다.

## 입력과 제작 구조

- 비교 원본: `tests/fixtures/actor-art-dark-baseline.js`, `actor-renderer-baseline.js`, 두 파일 SHA와 개체별 기존 앵커를 담은 `actor-baseline.json`. 기존 경로 끝점과 사각형 꼭짓점을 앵커로 세고 arc/ellipse 같은 곡선 primitive는 별도로 기록한다. 이 값은 재측정으로 덮어쓰지 않는다.
- 스타일 원본: `shared/assets/party/party.runtime.js` v008, `shared/assets/monsters/monsters.runtime.js`. 공방의 같은 높이 비교는 실제 출하 렌더러를 사용한다. 네 동행의 PNG 시트·SHA·얼굴 crop은 `tools/party-forge/references.json`에 있다.
- 한국식 구조 참고: [국립진주박물관의 두정갑 설명](https://jinju.museum.go.kr/kor/html/sub02/020101.html), [Brooklyn Museum 투구](https://www.brooklynmuseum.org/objects/121878), [Smithsonian의 망건·탕건 자료](https://asia.si.edu/interactives/korean-treasures/chaekgado/shelf-3-back.html), [국립민속박물관 무복 사진](https://folkency.nfm.go.kr/upload2/img/20170318/2017031800002400.jpg). 참고 사진은 전체 구성을 관찰하며 복사/추적하지 않았다. `tools/actor-forge/references.json`에 다운로드 URL·SHA·관찰 범위가 있다. 실제 참고 사진은 로컬 `style-references/`에 둔다. Brooklyn 사진은 투구 뒷면이며 몸통 갑옷 사진으로 해석하지 않는다.
- 이번 신규 인물은 기존 PNG 얼굴을 추적하지 않은 독립 벡터다. 따라서 래스터 segmentation mask는 없다. `parts[].paths`가 실제 파트 마스크이며 `parts[].pivot/parent`가 관절·가림 순서를 명시한다. `root → body → sleeve → hand → tool`, `body → neck → head`, `root → leg → foot`가 기본이다. 넓은 소매에 가려진 팔은 어깨 중심의 강체로 근사하며 손과 도구의 접점을 공유한다.
- `anatomy.mjs`는 사람의 성인 비율과 톤, 소환귀의 비율을 제작 단계에서 적용한다. `humans.mjs`, `spirits.mjs`, `objects.mjs`가 형태의 수정 원본이다. 생성 SVG를 직접 고치지 않는다.

## 복잡도와 런타임

신규 에셋은 **기존 앵커의 3.15배 이하**, 하한 없음. 노드를 채우는 자동 분할은 하지 않는다. 현재 20종 52~287앵커, 기존 대비 0.70~2.40배다. 상한은 기존 몬스터의 약 3배 제한에서 가져온 안전장치이며, 새 작업에 3배 증량을 목표로 요구하는 규칙이 아니다.

SVG·rig JSON·animation JSON·runtime은 한 레시피에서 함께 생성한다. 정점/색/경로/LOD·원본/최적화 SVG bytes·리그/동작 bytes는 `_local/reports/actor-forge/metrics.json`에서 확인한다. 에셋 runtime 148,868 bytes, adapter 2,301 bytes(초기 확정본). 생성 HTML 크기 증가는 함께 진행 중인 다른 작업을 포함할 수 있으므로 캐릭터 번들 증가량과 구별한다.

몬스터의 retained `Path2D` 렌더러를 `HonroVectorParts.create()`로 공유한다. draw 때 좌표를 새로 복제하지 않는다. `shared/build.mjs` 하나가 Game·Stage View·Playtest에 같은 에셋/렌더러를 넣는다. `actor-vector.js`는 `moving/anim/hurt/airborne`과 실제 동맹 턴의 행동 확인 단계만 읽는다. 물리 이동을 중복 적용하지 않으며 h/r·충돌·스킬·턴·저장 스키마를 수정하지 않는다.

## 검수 절차

```powershell
npm.cmd run build
npm.cmd run test:actors
npm.cmd run verify
```

공방: `_local/reports/actor-forge/index.html`. 선택·5동작·재생·스크럽·좌우 반전·실루엣/벡터선·밝은 배경·256/128/96/64px를 확인한다. 비교 갤러리의 옛 그림은 스타일 목표가 아니다. `style-comparison.png`가 기존 승인작과의 비율/톤 비교다.

브라우저 검사는 20종 × 5동작 × 5시점 × 2방향, 강체 관절·정지 발, SVG/Canvas 일치, 실제 캠페인 디자인 누락, 실제 소환 턴/피해, 동맹 행동, 세 호스트 픽셀 일치·상태/저장 보존을 검사한다. 공방 결과와 20종 동작 시트를 사람이 시각적으로 검토해야 한다. 36개 동시 렌더 p95 성능 검사는 다른 브라우저 부하 없이 실행한다.

한계: 일반 NPC의 팔은 네 동행의 팔꿈치 IK보다 간단한 강체 리그다. 고정 문에는 보행/점프 동작을 만들지 않는다. 64px의 눈·코·손가락은 생략되거나 합쳐진다. 미술 품질은 자동 검사의 통과만으로 승인되지 않는다. 회차별 발견과 수정은 `_local/reports/actor-forge/VISUAL_REVIEW.md`에 남긴다.
