# 혼로 벡터 제작 SOP v1 — 스켈레톤 → 시안 → Inkscape → 최적화

직선 비율의 측정 범위는 [미술 측정 v3.1](ART_MEASUREMENT_V3_1.md)을 우선 적용한다. 20% 목표/30% 상한은 유지하며 전체 고유 윤곽을 고정 물리척도로 측정한다. 개별 화면의 시각 검수는 계속 필수다.

착수·재시도 전 [시행착오 재발 방지](PILOT_FAILURE_PREVENTION.md)를 확인하고, 새 실패의 원인과 재검증 절차를 갱신한다.

2026-10-28 사용자 확정: 벡터 그래픽 디자인의 기본 제작 방식은 **좋은 시안 → 실제 Inkscape 벡터 제작/정리**다. 코드로 좌표를 상상해 그림을 새로 만드는 방식을 기본값으로 사용하지 않는다. 기존의 낮은 품질 게임 그림을 새 미술의 기준으로 고정하지 않는다. 사용자가 준 레퍼런스를 최우선으로 삼는다.

이 문서는 제작 계획과 현재 의무를 구분한다. 시안 재현 시험은 가능성을 확인했고 사용자가 방향을 채택했지만, 아래 모듈형 파이프라인·자동 변환기·성능 예산이 이미 구현·검증됐다는 뜻은 아니다. 기존 스토리·저장·충돌·공통 렌더러 계약은 보존한다.

## 1. 서로 다른 세 원본

1. **게임 지형 원본**: 월드 좌표, solid/one-way, 경사, 낙차, 점프 간격, 엄폐, 사선, 위험, 출입구, 퀘스트 면, support/pivot/socket. 이 데이터로 스켈레톤을 렌더한다.
2. **미술 원본**: 채택한 시안, 스타일 기준, Inkscape 편집 SVG. 부품·재질·깊이 의미로 레이어를 구성한다.
3. **배포 산출물**: 정규화·정리한 경로, 자산 메타데이터, 기존 Canvas 캐시용 데이터. 원본 SVG와 별도로 재생성한다.

생성 이미지에서 충돌을 자동 추정해 게임 원본을 덮어쓰지 않는다. 코드의 역할은 스켈레톤 생성·좌표 변환·자산 연결·검사·재생성이지, 레퍼런스 없는 즉흥 미술 저작이 아니다. 최종 그림 때문에 게임 구조를 바꾸고 싶으면 지형 원본을 명시적으로 고치고 해당 이동/사선을 다시 확인한다.

## 2. 제작 단위와 레이어

**전체 장 이미지 한 장을 통째로 자동 추적하는 방식은 충실도 실험용이다. 정식 장 제작의 기본 단위가 아니다.** 색별 추적 경로는 의미별 레이어가 아니므로, 나중에 색별 SVG를 자동으로 나무/바위/다리로 해석할 수 있다고 가정하지 않는다.

### 재사용 라이브러리

- 독립 장식: 바위, 갈대, 뿌리, 소나무, 표지판, 짐, 등불, 배 등. 원점·밑동·크기 범위·앞뒤 역할을 함께 정의한다.
- 구조 부품: 교각, 보, 잔교 접합부, 지붕/기단. 연결 socket과 지지면을 정의한다. 기둥을 제멋대로 늘려 접지를 흉내 내지 않는다.
- 지형 표면 모듈: 흙-암반 전이, 침식 모서리, 암면/층리, 뿌리 접합. 단순 반복 타일이 아니라 크기·방향·이웃 접합을 제한한 소수 변형을 만든다.
- 분위기 자산: 물/안개 등은 기존 공통 효과와 결합한다. 움직이는 물을 정적 벡터 사진처럼 구워 넣지 않는다.

### 장 고유 구성

- PLAY: 충돌, one-way, 위험, 이동/사선 기준. 미술 레이어와 별개인 정답 데이터.
- REAR: 캐릭터 뒤 지표·암벽·건물 뒤쪽. 실제 밑동은 지지면에 붙인다.
- SURFACE: 인물이 밟는 면과 깊이. 그림의 보행 경계와 실제 접촉선이 일치해야 한다.
- BODY: 이어진 흙/암반 전체. 큰 지질 흐름은 장 고유로 구성하고 공통 재질 모듈을 부분 사용한다.
- FORE: 인물 앞을 일부 가리는 돌·풀·근경. 얼굴, 조준, 출구, 필수 지지면을 가리지 않는다.
- FX / INTERACT: 물·안개와 퀘스트 사물/상태. 정적 배경과 분리한다.

이 이름은 제작상 의미다. 별도의 엔진 레이어 7개를 새로 만들라는 뜻이 아니다. 현행 L1 back/prop/front, 환경 그룹/지지면, terrain-domain, 동적 pass에 매핑한다. 원경은 기존 이미지 공급과 시차를 유지한다. 새 벡터 SOP가 원경까지 벡터로 교체한다는 뜻은 아니다.

## 3. 게임 스켈레톤부터 고정

- 장의 핵심 행동 1–2개, 시작/목표/합류 위치, 주경로·대안 경로, 조준 각도 차이를 정한다. 모든 장에 다층 구조를 강제하지 않는다.
- 실제 캐릭터 크기·기본 점프/이동으로 회색 모형을 확인한다. 장 전체 overview와 대표 플레이 카메라를 함께 출력한다.
- 스켈레톤은 엔진/에디터의 실제 지형 데이터에서 출력한다. 장식 그림으로 점프 거리나 오버행 높이를 추측하지 않는다.
- 단순 실루엣 판, 접촉/금지 영역을 표시한 제작 판, 캐릭터 크기 표본을 준비한다. 표시용 색과 기호는 최종 미술에 남기지 않는다.
- 필수 앵커와 접촉선은 고정, 바위의 전면 굴곡·식생·내부 명암 등은 미술 자유 영역으로 구분한다.

## 4. 시안 제작 — 스타일과 구조를 따로 통제

먼저 대표 한 구간으로 **스타일 기준판**을 만든다. 지면·바위·갈대·목재·작은 건물·캐릭터 크기 표본을 한 조건에서 비교한다. 사용자가 채택한 그림을 기준으로 유지하며 프롬프트 문장만으로 일관성이 보장된다고 주장하지 않는다.

### 고정 스타일 블록

- 한국형 다크 판타지, 성숙한 형태, 손으로 정돈한 벡터 일러스트.
- 옆보기 중심, 보행면 뒤쪽의 제한된 폭. 깊이 방향의 길을 상하 이동 길로 혼동하지 않기.
- 큰 실루엣 → 중간 형태 → 2–4개 주요 명암면. 미세 노이즈·사진 질감·작은 균열 대신 읽히는 구조.
- 자산별 소수 기본색과 명암색. 필요한 색을 없애기 위한 전 장 공통 16색 강제는 하지 않기.
- 같은 광원 방향, 재질별 명도 범위, 전경/원경 대비와 세계 단위 크기.
- 막별 색채는 별도 팔레트 블록. 4막은 낮의 밝기가 남는 우중충한 푸른 안개. 시간 설정을 임의 변경하지 않기.

### 가변 블록

대상 자산/구간, 레이어, 실제 크기, 지지/접합 위치, 반드시 보존할 스켈레톤, 금지 가림 영역, 필요한 변형만 입력한다. 생성 모델에 이미지가 어떤 역할인지 구분해 전달한다: 구조 고정용 스켈레톤 / 미술 스타일용 기준판 / 개체 식별용 레퍼런스.

### 프롬프트 뼈대

> 첨부 스켈레톤의 보행 경계·단차·틈·필수 빈 공간을 보존해 [대상/레이어]의 시안을 만든다. [스타일 기준판]의 선명한 큰 색면·재질·광원을 따른다. 접지점 [목록]과 표시 크기 [값]을 지킨다. [공통 부품]은 새로 재해석하지 않는다. [금지 영역]을 메우지 않는다. 배경 없는 자산은 실제 투명 배경으로 만든다. 작은 텍스처·불필요한 반사·미세 그라데이션·그림에 섞인 글자/가이드는 넣지 않는다.

프롬프트만으로 픽셀/기하 고정이 보장되지는 않는다. 시안을 스켈레톤 위에 겹쳐 **실제** 윤곽·여백·앵커를 비교한다. 구조가 달라지면 해당 부분 재생성/편집하거나 채택하지 않는다. 회색 모형 통과와 미술 합격을 별도로 기록한다.

## 5. Inkscape 벡터 제작

- 가능한 한 하나의 의미 있는 부품/레이어를 하나의 시안으로 만든 뒤 변환한다. 전체 장에서 부품을 분리하는 것보다 처음부터 분리 제작하는 편이 낫다.
- Inkscape의 실제 색 추적·곡선/노드·합치기/빼기·클립·레이어 도구로 작업한다. 도구 사용 후 결과를 직접 본다. 손으로 새 좌표 목록을 만든 뒤 Inkscape에서 열기만 한 것은 이 SOP 수행이 아니다.
- 색 수, Stack, Smooth, speckle, optimize를 비교한다. 최소 색 수가 목표가 아니라 주요 형태·표정·재질 보존이 목표다. 설정값은 자산별로 기록한다.
- 자동 추적은 시작점이다. 경계 번짐, 필요 없는 작은 섬, 색면 중복, 의도하지 않은 구멍, 서로 붙은 부품을 정리한다.
- source SVG에는 레퍼런스 이미지 레이어를 보관할 수 있으나 **최종 벡터 산출물에는 image 요소/외부 bitmap 의존을 남기지 않는다**.
- 기하와 미술 원본을 같은 좌표/원점으로 연결한다. 불필요한 전체 fit/crop 후 위치를 눈대중으로 맞추지 않는다.

## 6. 최적화 — 순서와 금지

1. **시안에서 줄인다**: 미세 그라데이션·노이즈를 줄이고 그림을 부품 단위로 만든다. 불필요한 디테일을 벡터화한 뒤 되돌리는 비용을 피한다.
2. **의미 없는 경로 제거**: 숨은 완전 중복, 극소 노이즈, 배경 잔여, 화면에서 안 보이는 마감만 제거. 얼굴·활시위·접합부 같은 작은 중요 형태는 면적만으로 삭제하지 않는다.
3. **경로 정리**: 실제 Inkscape 단순화/곡선 편집. 코너·눈/입·접지·socket·지붕 끝 보호. 전부 같은 threshold로 Simplify하지 않는다.
4. **표현 정규화**: 불필요한 transform 중첩, stroke-to-path 필요 여부, 지원 명령/clip/gradient, 좌표 정밀도를 정리한다. 메타데이터 제거·gzip은 전송 최적화이며 렌더 경로 수 감소와 다르다.
5. **재사용/캐시**: assetId+revision+팔레트 키로 공유한다. 정적 지형은 기존 world-fixed tile/Path2D 캐시에 연결하고 매 프레임 파싱·전체 경로 재생성을 피한다. 같은 원본을 각 인스턴스에 복제 저장하지 않는다.

노드 수, SVG path 요소 수, **compound path 안의 subpath와 명령 수**, fill overdraw, 디코드 메모리, 전송량을 따로 센다. '48 paths'가 가볍다는 뜻이 아니다. 이번 지형 시험은 48 compound paths / 55,121 path commands / 2,962,637 bytes였다.

### 품질/성능 예산의 결정 방법

- 기본/확대/최소 줌의 표시 크기를 먼저 정하고, 작은 잎/틈의 허용 오차를 화면 픽셀 기준으로 정한다. 움직이는 접촉선·얼굴·주요 외곽은 일반 내부 명암보다 엄격히 보호한다.
- 고품질 원본, 균형 후보, 저비용 후보를 비교해 가장 가벼운 **합격** 버전을 고른다. 용량 목표를 맞추려고 얼굴/실루엣을 망가뜨리지 않는다.
- 전 장 공통 임의 노드 상한을 먼저 박지 않는다. 대표 부품과 대표 구간의 실제 모바일 카메라에서 첫 로딩·첫 그림·팬/줌·p95 프레임·캐시 메모리를 측정해 부품 등급별 예산을 정한다. 측정 전 수치는 제안으로만 표시한다.
- 원본 벡터 보존과 런타임 캐시는 구분한다. 캐시 이미지 사용은 가능하나 원경/장식까지 통째로 정적 이미지 지형으로 교체하지 않는다. raster/atlas 배포 전환은 별도 결정이다.

### 오차 제한 자동 최적화와 필수 시각 검수 — 2026-10-28 추가

사용자 명시 요구: raw vector를 보존하고 오차 상한 안에서 노드·곡선·불필요한 도형을 줄인다. 자동 수치 검사를 통과해도 중요한 작은 형상이 손실될 수 있으므로 최종 직접 시각 검수는 반드시 수행한다.

1. **불변 기준**: raw SVG를 따로 보존한다. 모든 후보는 동일 raw에서 생성하며 누적 Simplify로 오차를 감추지 않는다. 시안→raw의 추적 오차와 raw→최적화의 단순화 오차를 따로 기록한다.
2. **중요 영역 지정**: 캐릭터 눈·눈썹·코·입·손·활시위/손잡이·관절 접합, 지형 접촉선·발판 끝·출입구·연결점 등을 path ID 또는 영역/마스크로 지정한다. 작거나 면적이 적다는 이유로 제거하지 않는다. 중요 영역 지정은 자동 면적 규칙의 대체물이 아니다.
3. **후보 생성**: 단순화 허용치, 작은 도형 정리, 좌표 정밀도 등을 단계적으로 바꾼다. 정점/명령/하위 경로/바이트/엔진 한도를 기록한다. 한도에 맞출 때까지 품질 오차를 무제한 올리는 방식은 금지한다.
4. **오차 측정**: 실제 일반 표시 크기와 최대 확대 크기에서 raw와 후보를 렌더한다. 전체 색 오차뿐 아니라 알파/윤곽 차이, 중요 영역의 국소 색/윤곽 차이, 구멍·좁은 틈·선의 소실을 별도로 검사한다. 평균 오차 하나로 합격시키지 않는다. 단위·비교 크기·허용치를 기록한다.
5. **선정**: 품질 제한과 엔진 한도를 동시에 통과한 후보 중 복잡도가 가장 낮은 후보를 고른다. 임계값과 결과가 항상 단조롭다고 가정하지 않는다. 후보가 없으면 의미별 분리/시안 정리 또는 측정에 근거한 엔진 정책 검토로 돌아간다.
6. **시각 검수 필수**: 수치 통과는 `candidate`일 뿐이다. 원본/후보의 전체, 실제 표시 크기, 중요 부분 확대, 해당 상태·모션을 직접 열어 본다. 눈·입·손·지지면 등 의미가 달라졌으면 수치가 좋아도 불합격이다.
7. **부분 복원/재검증**: 문제 부위는 원본으로 복원하거나 더 보수적으로 처리하고 나머지는 최적화한 상태를 유지한다. 수정 후 관련 수치와 해당 확대/일반 화면을 다시 확인한다.
8. **최종 연결 검수**: 편집기 SVG가 아니라 실제 게임에 가져온 최종 자산까지 비교한다. 최종 승인에는 검수한 파일 해시·카메라/배율·상태·확인한 중요 부위·남은 한계를 기록한다. 자동 스크립트가 `visualApproved=true`를 만들지 않는다.

## 7. 게임 연결과 완료 판정

현재 renderer가 SVG의 모든 기능을 지원한다고 가정하지 않는다. 이번 설오 시험에서도 상대 명령/arc와 원본 bounds 파서의 지원 차이가 있어 정규화가 필요했다. 원본 SVG, 변환된 엔진 자산, 실제 화면 세 결과를 비교한다.

- 메타데이터: id, revision, semantic layer, viewBox, world size, foot/pivot, support/socket, palette, bounds, reference/source lineage, collision link.
- 지형: 물리 원본과 미술 배치를 연결하고 실제 이동·사선·지지면·구역 상태·외곽을 확인한다. 단일 terrain-domain을 유지한다.
- 캐릭터: 먼저 참조 이미지 충실도, 이후 머리/몸/상하완/손/허벅지/종아리/옷자락/무기 등 의미별 분해와 가려진 면 보완, 마지막으로 rig/socket/동작을 연결한다. 색별 trace 결과에 뼈만 붙이면 된다고 가정하지 않는다.
- 장식: 앞/뒤/상태 변형, 접지·크기·가림·재사용 변형을 확인한다.
- 기존 SOP의 서로 다른 3회 미술 검수와 최종 종합 검수는 유지한다. 변경과 무관한 전수 검사는 추가하지 않는다.

## 8. 최초 적용 실험의 설계 (역사 기록; 실제 확대는 10절)

1. 4막의 지면/암반/갈대/목재 4종으로 작은 스타일 기준판을 만든다.
2. 실제 엔진에서 한 교전 구간 스켈레톤과 두 경로의 의미를 확정한다.
3. 공통 부품 3–5개 + 해당 구간 BODY/REAR/SURFACE 고유 형상을 분리 시안으로 만든다.
4. 각 시안을 벡터화·정리하고 하나의 실제 구간으로 조립한다.
5. 같은 부품을 지형이 다른 둘째 작은 구간에도 배치해 재사용성과 부자연스러운 반복 여부를 검증한다.
6. 최적화 후보의 실제 화면·성능과 수정 용이성을 비교한 뒤 장 전체로 확장한다. 10장 일괄 생성은 하지 않는다.

이후의 자동화 도구는 이 작은 실제 제작에서 반복이 확인된 연결·검사만 만든다. 미술 문제를 풀기 전에 거대한 자체 에디터를 새로 만드는 방향으로 돌아가지 않는다.

## 9. 실제 참고 사례와 근거

벡터풍 외관, 벡터 저작 원본, 런타임 벡터 렌더링은 서로 다르다. 아래는 개발자 직접 설명이며 HONRO의 선택 자체를 입증하는 자료는 아니다.

- **Guacamelee!**: DrinkBox 개발자 포스트모템은 Flash 애니메이션을 animated geometry로 가져오고 전통적인 sprite sheet를 피했다고 설명한다. 콘셉트 영상→전투 데모→작은 완성 구간→본제작의 진행도 확인된다. [개발자 포스트모템](https://www.gamedeveloper.com/business/postmortem-drinkbox-studios-i-guacamelee-i-). 별도 인터뷰에 환경은 3DS Max/Photoshop, 애니메이션은 Flash로 설명되므로 게임 전체가 SVG였다고 말하지 않는다. [인터뷰](https://www.gamedeveloper.com/design/road-to-the-igf-em-guacamelee-em-).
- **Castle Crashers / Alien Hominid**: 개발자 Mike Welsh의 직접 답변은 SWF 아트/애니메이션을 게임 로드 시 rasterize한 방식이라고 설명한다. 편집 벡터와 실행 캐시를 분리할 수 있다는 사례다. HONRO를 즉시 sprite atlas로 바꾸라는 결론은 아니다. [개발자 답변](https://www.newgrounds.com/bbs/topic/1034102).
- **Don’t Starve**: Klei 개발자 인터뷰는 대부분의 아트를 Flash에서 만들고 자체 애니메이션 형식으로 export했다고 설명한다. 최종 렌더링이 벡터라는 근거로 확대하지 않는다. 부품 이름·원점·레이어·export 계약의 중요성을 참고한다. [개발자 인터뷰](https://www.gamedeveloper.com/design/road-to-the-igf-klei-entertainment-s-i-don-t-starve-i-).
- **Inkscape**: 컬러 추적은 색별 객체를 만들며 100% 복제가 아니고 이후 편집이 복잡해질 수 있다. [추적 안내](https://inkscape-manuals.readthedocs.io/en/latest/tracing-an-image.html). Simplify는 오차 허용치 안에서 곡선을 근사하는 절충이다. [공식 코드 설명](https://inkscape.gitlab.io/inkscape/doxygen/classPath.html).
- **도구 설계 참고**: [Unity SpriteShape Controller](https://docs.unity3d.com/Packages/com.unity.2d.spriteshape@10.0/manual/SSController.html)의 spline/렌더/충돌 구분, [Godot Polygon2D](https://docs.godotengine.org/en/stable/classes/class_polygon2d.html)와 [CollisionPolygon2D](https://docs.godotengine.org/en/stable/classes/class_collisionpolygon2d.html)의 분리. 출시 게임 사례가 아니라 편집 구조의 참고다. 이번 계획은 엔진 이전을 요구하지 않는다.

## 10. 실제 제작에서 확인한 연결·최적화 규칙 — 2026-10-29

사용자의 4막 전체 제작 지시에 따라 31·35의 검증된 제작 요소를 다른 장에 확장한다. 장별 공식 형상·기믹을 읽고 개별 완성도를 검수한다는 원칙은 유지한다. 한 장의 대형 SVG를 다른 장 전체에 그대로 덮는 방식으로 확대하지 않는다.

- **구조 보존과 미술 편집을 구분한다.** 추적의 미세 그라데이션 노이즈를 실제 Inkscape에서 지우거나 팔레트를 정리할 때 raw를 보존하고 편집 path ID/사유를 기록한다. 이것을 raw 대비 무손실 자동 최적화라고 부르지 않는다.
- **곡선을 먼저 살린다.** 선택 path의 독립 Simplify와 절대 좌표 정밀도 조절을 우선한다. 그래도 한도를 넘는 compound만 화면 오차보다 충분히 작은 허용치로 평탄화한다. 구멍·자기 교차·nonzero/evenodd winding을 보존해 Boolean 분할하고 최종 픽셀을 다시 측정한다. 전체 곡선을 무조건 다각형으로 바꿔 노드를 늘리지 않는다.
- **측정 해상도를 오차 단위와 맞춘다.** 0.5 화면 픽셀 상한을 1× 이진 윤곽만으로 판정하면 양자화에 따른 1픽셀 점프가 생긴다. 지정 중요 영역은 8× 등 충분한 해상도로 재측정한다. 사라진 색 양자화 섬과 실제 눈·줄기·접촉선의 이동을 구분하며, 최초 실패 보고서를 없애거나 상한을 몰래 높이지 않는다.
- **내부 재사용은 표현 중복만 줄인다.** `vector.symbols`와 내부 `use`는 동일 형상 저장/컴파일 중복을 줄인다. 참조 확장 후 512노드·깊이24·경로60000자 한도는 그대로 적용한다. 외부 참조·순환·누락된 정의는 금지한다. 반복 그리기 비용까지 줄었다고 주장하지 않는다.
- **분할 사각형의 이음선은 알파 합성을 검사한다.** 직사각형 partition에만 검증된 `pixelSnapClip`을 사용할 수 있다. 실제 지형 마스크는 그대로 유지한다. 일반/최대/최소 줌에서 틈·밝은 선·겹친 색을 직접 확인한다.
- **FORE는 실제 전면 합성이다.** 기존 `front`는 배우보다 먼저 그려지므로 이름만 바꾸어 근경이라고 하지 않는다. 비충돌 `semanticLayer: FORE`를 배우를 그린 다음 합성하는 별도 전면 pass에 넣되 배우·목표 가독성을 보호하고 조준선/탄/필수 UI는 위에 유지한다. 모바일 버퍼 한도와 카메라 이동 시 해제를 검증한다.
- **근경도 뿌리를 둔다.** 갈대·대나무의 뿌리가 절벽 중간에 붙인 스티커처럼 보이거나, 바위 밑판이 공중에서 일자로 잘리면 반려한다. 필요한 경우 별도의 시안→Inkscape 근경 흙둑을 만들고 공통 식생을 그 면에 접지한다. 모든 장에 근경을 강제로 넣지는 않는다.
- **충돌 동일성만으로 가독성을 승인하지 않는다.** 담장 미술이 실제 collider보다 낮으면 보이지 않는 벽이 된다. 실제 접촉 상단/하단을 맞추고 서기·낮은 사격을 확인한다. 원래 배치 자체가 공중에 떠 있으면 승인된 범위의 위치 교정으로 명시하고 영향받는 플레이를 재검증한다.
- **검수 화면은 실제 실행 설정과 같아야 한다.** 검사기만 원경·기후·카메라를 몰래 교체하지 않는다. Act4 실제 준비 과정과 이미지 decode 완료를 반영한다. Native Scene, 실제 Chromium UI, 공개 Pages 확인을 각각 구분한다. 모바일 에뮬레이션을 실기기 성능으로 말하지 않는다.


## 11. 재사용·저장·최종 증거의 제작 규칙

- **시안의 전체 캔버스가 아니라 실제 그림 경계로 맞춘다.** 투명 여백을 포함한 fit은 배·바위 크기와 발밑을 틀리게 만든다. 실제 ink bounds, foot, pivot, deck/socket을 기록한다. 같은 배라도31장 갑판은 local−50,40장은 local−60이므로 그림만 보정하고 사건의 원래 ID·물리 위치·접촉선은 보존한다.
- **공통 정의를 전역 덮어쓰지 않는다.** 장별 교체는 scoped asset ID 또는 명시적인 그림 선택자를 사용한다.36장 문 교체가32장의 `a4:door`를 바꾸지 않아야 한다. 같은 의미·크기 계약의 부품은 정의 하나를 여러 인스턴스에서 재사용한다. 기존 나쁜 배치를 그대로 유지해 뜬 기단·지붕 위 배·목표를 가리는 바위를 만들지 않는다. 비충돌 장식의 접지 교정과 물리 재설계를 구분해 기록한다.
- **저장 데이터에 정적 벡터를 중복 복사하지 않는다.** 공식 캠페인의 원본과 완전히 같은 자산만 ID+서명 참조로 저장하며, 수정된 자산·사용자 맵은 보존한다. 실제 지연 로딩이 끝난 뒤 서명을 검사하고 전체 참조가 맞을 때만 원자적으로 복원한다. 실패하면 원본 저장을 유지하고 알린다. 장 진입·Continue·스키마 이행·한도 초과를 직접 확인한다. 명시적5MiB 테스트와 실제 브라우저 저장 검증은 구분한다.
- **안전 한도 통과와 가벼움을 혼동하지 않는다.** 확장 노드·경로 한도 외에 최종 막 전체 JSON/gzip 전송량, 고유 경로, 중복 정의와 첫 로딩을 별도로 기록한다. 정확한 내부 재사용으로 저장량이60% 줄어도 막 전체 전송이 수MB 이상일 수 있다. 더 작은 시안·동일 부품 공유·장별 로딩을 검토하며, 실제 모바일 확인 없이 성능 합격을 붙이지 않는다.
- **증거는 검수한 버전에 묶는다.** 지형·자산·검사기·런타임 해시를 구분한다. 미술만 바꾼 뒤 예전 완주 결과의 해시를 새 것으로 고쳐 적지 않는다. 변경 관련 충돌 동일성과 새 화면 검수를 추가하고 기존 완주 기록의 범위를 명시한다.31·35처럼 승인 범위의 재설계 후보는 공식 맵과 달라진 모든 지형/접지 변경을 목록화하고 제작 스켈레톤·실제 입력 검사와 연결한다.
- **중간 파일과 출시 상태를 분리한다.** raw/편집/최적화 원본 및 재조립 도구를 저장하되, 후보 패키지를 만드는 스크립트가 자동으로 미술·브라우저·배포 합격을 생성해서는 안 된다. 로컬 커밋, 원격 반영, master 반영, Pages 실행 확인은 각각 실제 결과로 보고한다.

## 12. 화면 역할별 밀도 우선 — 2026-10-29 수정

사용자가 지적한 배경 과밀·플레이 요소 단순화 불균형을 수정한다. 개별 원본 충실도와 안전 한도만으로 미술을 승인하지 않는다. `game/docs/VISUAL_DENSITY_STANDARD.md`의 역할별 시각 밀도·대비·표시 크기·재저작 순서를 적용한다. 기존 4막 후보는 재검수 대상이다. 배경을 조용하게 만들면서 실제 접촉면/발판 구조/상호작용을 더 선명하게 하고, 같은 카메라의 전체 화면으로 비교한다.


### 2026-10-29 보완: 실제 인스턴스·카메라 경계 검수
- 자산 정의만 검사하지 않는다. 실제 스테이지 인스턴스·배경 배치·전체 자산을 함께 public `HonroMaps.validate`로 검사하고, 브라우저의 정상 importer 진입까지 확인한다. Native Canvas의 compile 성공은 public importer 통과가 아니다.
- 추적 자산의 임시 `scaleRange:[1,1]`를 실제 배치 배율과 혼동하지 않는다. 최종 선언은 기존 의도 범위와 실제 저작된 배율만 포함한다. 범위 수정 전후 벡터·충돌·인스턴스가 동일함을 기록하고 검증기를 느슨하게 하지 않는다.
- 고해상도 플레이 지형과 저해상도 외곽 연장이 만나는 곳은 실루엣뿐 아니라 내부 색면 깊이도 이어져야 한다. BODY 역할·실제 terrain 연결이 같더라도 경계 수직 색면 절단은 발생할 수 있다. 최소 줌과 양쪽 카메라 끝의 실제 화면을 본다.
- 모든 장의 최종 source freeze 후 사용하지 않는 런타임 정의만 참조 폐쇄 검사로 제거한다. 실제 단계·동적 상태·runtime literal/computed selector를 보수적으로 보존하며 시안·raw trace·기각한 실험 소스는 삭제하지 않는다. 원시/gzip 용량, 저장 path 명령 수, use 전개 후 path/node 수를 별도로 기록한다. 이를 FPS나 미술 합격으로 표현하지 않는다.
- 실제 지리 교체는 캠페인 map revision 계약을 갱신한다. 이전 전투 스냅샷은 같은 장 입구로 되돌리되 성장·SP·장착·완료 기록·이미 저장된 퀘스트 사실은 보존한다. 실제 기존 migration의 Continue와 사용자 안내를 확인한 뒤 최종 런타임 해시를 고정한다.

### Act4 map-revision3 save preservation

Before an obsolete official Act4 battle is migrated and its primary browser save can be overwritten, ProfileStore preserves the exact original raw profile text under immutable `honro-first-act-profile-1-act4-before-map-revision-3-` archive keys. Exact-byte equality deduplicates; a differing occupied key is retained and a separate key is used. Read-back verification is mandatory. Read, quota or verification failures retain the primary original and lock normal progression/persist behind the existing recovery UI; retry must actually verify the archive. Starting a download is never proof of successful file storage or an unlock condition.

Settings → 기록·관리 lists each local archive with stage/map revision and offers exact-original JSON export. Metadata is escaped as untrusted display text. This is local storage only, not cloud backup: browser data deletion can remove every archive, quota can block migration, and older static asset references may require the corresponding old build. There is no automatic deletion or old-battle restoration into new geometry. The revised chapter restarts at its entrance; existing earned-growth/equipment/completed-chapter/fact preservation semantics remain unchanged.

### Walk-only escort contours

Pinning route endpoints is not sufficient. Every source-derived designated walking corridor must pass the actual intended actor's locomotion envelope along the entire route—not just hero jump/shot tests, endpoint support checks, or visual error metrics. Stage39 exposed sub-body-scale traced spikes between protected anchors: a live r22/h92 resident stopped because the actual walker rejects grades above1.35. Its local correction uses measured safety margin1.10, not a universal art slope rule. Preserve large-scale natural contour and protected event anchors; fit the native vector's surface and interior layers to the corrected gameplay skeleton and check any grounded decoration. Record such changes as intentional gameplay shape corrections, never lossless optimization. Regress old failure, single route probe at its real step size, ordinary fixed-step convoy walking with real clearance/waiting, then require genuine full objective completion and direct visual review.


## 원본 SVG의 중복 참조 이미지 보관

시안 PNG가 이미 같은 자산 폴더에 있는 경우, native Inkscape SVG는 동일 PNG의 상대 경로 `href`를 사용해 내부 base64 중복을 피한다. 시안 PNG를 제거하거나 경로를 임의 변경하지 않는다. 공유·이동·백업은 **SVG 하나가 아니라 연결된 시안 PNG를 포함한 자산 폴더 전체**로 한다. 단독 SVG 제출이 필요한 경우 전달용 복사본에만 이미지를 다시 포함하고 원본 폴더는 유지한다. 기존 정확한 source-file SHA를 기록한 검수 증거는 소급 변경하지 않으며, 해당 원본은 별도 검토 없이 변환하지 않는다.

2026-10-30 변환은 [파일별 이전/이후 SHA 및 PNG 연결 목록](asset-archive-20261030/linked-svg-references.json)을 따른다. 이미지 href 외 XML·path·좌표·레이어·속성은 바꾸지 않았고, 시안의 decoded bytes와 현재 PNG가 동일함을 검증했다. runtime에 이미지 참조를 삽입하는 변경이 아니다.
