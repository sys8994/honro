# 혼로 초상화 제작 표준 v1.0

2026-10-22 승인: 설오 7번, 화풍 통일본 담허·휘겸·소단. 기준 원화는 art/portraits/approved-v1/에 보존한다. 얼굴 미형은 승인 이미지의 6~7 수준이며 수치보다 실제 얼굴 형상이 우선이다. 설오 7번을 공통 화풍·세부 밀도 기준으로 삼는다.

## 고정 사항
- 얼굴 골격, 눈 크기·간격, 코·입·턱, 피부색, 나이 인상, 흉터·수염·머리를 보존한다. 표정을 바꾸며 미화하거나 어려지게 하지 않는다.
- 얼굴·손·옷 모두 같은 중간 밀도의 회화적 2D 게임 일러스트. 얼굴만 사진적이거나 옷만 셀 채색, 소단만 만화적 얼굴이 되면 불합격이다.
- 큰 형태와 중간 명암면, 선택한 머리카락 덩어리와 옷 주름으로 묘사한다. 모공·직물 격자·종이 노이즈·반복 잔결·점묘·미세 스크래치 금지. 디테일을 줄인다고 밋밋한 단색으로 만들지는 않는다.
- 한국형 다크 판타지의 절제된 색. 서양 모델형 얼굴·아이돌 보정·새 화려한 장식·추가 보석 금지.
- 기존 상반신 세로 구도, 머리 크기와 위치, 몸/얼굴 방향을 보존한다. 머리·휘겸의 갓 윗부분과 양끝을 자르지 않는다.

## 의상 잠금
- 설오: 짙은 회녹색 겉옷, 아이보리 깃·소매, 갈색 가죽 띠·손목 보호대, 적갈색 허리천, 묶은 검은 머리, 뺨 흉터, 활·화살통.
- 담허: 회올리브/먹색 겉옷, 따뜻한 아이보리 안옷, 단순 갈색 가죽 허리띠, 희끗한 머리/수염, 갈라진 나무 지팡이·호리병. 갈색 화려한 도포로 변경하지 않는다.
- 휘겸: 검은 갓, 청회색 겉옷, 어두운 소매, 아이보리 깃, 대각선 갈색 가죽 띠/사각 황동 버클, 붉은 허리띠, 검. 붉은 겉옷으로 변경하지 않는다.
- 소단: 어깨/겉소매까지 아이보리, 옅은 보라는 안깃·안감·소맷단·솔기에만, 평평한 붉은 허리띠·머리 리본, 단순 황동 방울. 보라 겉조끼나 큰 장식 매듭 금지.

## 첫 표정·동작 범위
기본 4장 + 인물당 두 변형, 총 12장.
- 설오: 경계/걱정, 활을 가까이 들고 급히 경고하는 자세.
- 담허: 걱정하며 살피는 표정, 손바닥을 들어 진을 붙드는 힘든 자세.
- 휘겸: 억제된 분노/의심, 검 손잡이에 손을 대고 앞을 막는 자세.
- 소단: 불안하고 방어적인 표정, 방울을 쥐고 손을 내밀어 멈추라는 자세.
후속 웃음·울음·부상 등은 필요에 따라 확장한다. 감정은 얼굴과 몸에 나타나되 만화식 과장 기호로 대신하지 않는다.

## 표준 프롬프트
Use case: stylized-concept, identity-preserving game dialogue portrait.
Reference 1: approved character master, sole authority for identity, age, costume and palette.
Reference 2 when supplied: approved Seoro score-7 master, authority ONLY for painterly style and detail density, never for target character identity.
Create a fresh independently rendered portrait of the SAME character, not a filtered repaint of a prior variant. Match the approved medium-detail 2D painted game style across face, hands, hair and clothing. Coherent broad and medium tonal planes, restrained edges, natural facial anatomy, selected folds, grouped hair locks. Preserve face proportions, hairstyle, age, scars/beard, construction and colors of clothing and accessories. Do not beautify or de-age.
Variant: {expression_and_pose}.
Vertical 1024x1536 upper body, comparable head scale/position and crop, same slight three-quarter direction, readable face, complete hair/hat, no extra props. Match lighting direction and restrained contrast.
Genuine transparent background and clean silhouette. No background, vignette, fog, halo, text or frame.
Avoid photo pores, gritty speckles, microtexture, fabric weave, stippling, paper grain, hatch grids, over-sharpened tiny details, plastic anime face, oversized eyes, flat cel-shaded clothing, glossy beauty retouching and elaborate new decoration.

## 생성·검수 SOP
1. 승인 원본과 인게임 의상 규격을 먼저 본다. 모든 변형은 승인 원본에서 독립적으로 생성한다. 변형본→다음 변형본으로 누적 편집하지 않는다. 별도 요청으로 생성하되 실제 확인 못한 새 세션 격리를 보장한다고 말하지 않는다.
2. 고정 얼굴/복장, 얼굴·옷의 화풍 일치, 작은 초상 크기에서 감정 식별성을 집중 확인한다.
3. 확대해서 반복 잔결, 손가락 오류, 흉터 이동, 의상 변경, 잘린 갓, 배경 잔류를 확인한다.
4. 네 기본형과 변형을 나란히 비교한다. 다른 캐릭터처럼 보이거나 화풍이 갈라지면 재생성한다.
5. 실제 대사창과 작은 아군 UI에서 크롭·가독성·배경·로딩을 확인한다. 이미지 생성 완료와 코드 연결/배포 완료를 구분한다.
6. 생성 결과마다 원본·프롬프트·참조 SHA·검수 상태를 즉시 보존한다. 승인 기준 원본을 덮어쓰지 않는다.

## 런타임 표준
- 기준 원본과 별도로 배포용 인코딩 파생본을 만든다. native 비율/얼굴·모자 안전영역을 manifest에 둔다.
- 네 주인공은 명확한 인물 ID로 선택한다. 같은 클래스의 적/NPC에 주인공 얼굴을 쓰지 않는다. 소단의 동료 전 대사도 동일 인물이지만 이름 공개 조건은 유지한다.
- 이미지는 필요 시 한 번 요청/decode하고 재사용. 버튼 클릭/대사 한 줄마다 src·DOM·원본 canvas를 재생성하지 않는다.
- NPC 확장 범위는 NPC_PORTRAIT_PRODUCTION_SOP.md v1.2를 우선한다. 새 이미지로 대체한 NPC는 loading/error/timeout에서 벡터로 돌아가지 않고 중립 영역·제한 재시도를 사용한다. 아래 기존 벡터 폴백 문장은 이번 NPC 범위에 적용하지 않는다.
- 정상 로딩에서 벡터→이미지 전환이 반복되지 않게 한다. 이미지 실패는 기존 벡터 폴백으로 처리하고 게임 시작을 차단하지 않는다. 모든 변형을 인트로에 선로드하지 않는다.
- 기본형 먼저 연결. 표정/동작은 명시적인 scene/row 태그로 선택하고 한국어 문장 검색으로 추정하지 않는다. 태그 없으면 기본형.
- 새 표정은 인물 ID/표정 ID/원본 SHA/프롬프트/파일/검수 상태로 추가한다. 기본 얼굴·의상 변경은 별도 승인 후 SOP 버전을 갱신한다.
