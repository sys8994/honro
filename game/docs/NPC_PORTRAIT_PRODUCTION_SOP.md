# 혼로 NPC·주요 적 초상화 SOP v1.2 · 최소 8종 적용

기준일 2026-10-23. 현재 대본 aa4b7ab. 기존 PORTRAIT_PRODUCTION_SOP v1.0의 승인된 설오 7번 및 주연 4명 화풍을 계승하는 NPC 확장안이다. 승인된 평범한 v2 8종을 명시 매핑으로 연결한다. 종지기 시안은 적용하지 않는다.

## 1. 현재 적용 범위
- 승인 v2는 8종이다: 연실 전용 / 장년 노동자 / 청년 노동자 / 장년 여성 / 노년 남성 / 노승 / 젊은 승려 / 수비병 악귀.
- 덕수는 worker_mature, 석공은 man_elder, 길찬은 worker_young을 사용한다. 이름별로 전용 5종을 새로 만드는 최초 초안은 이번 실행안에서 사용하지 않는다. 같은 사람의 재등장에는 같은 얼굴을 유지한다.
- 월이·칠복은 활성 7장 구조 인물이며 woman_mature/man_elder로 구별한다. 일반 ‘주민’은 rowId·scene·검증된 배우로만 연결한다. 템플릿 공유가 동일 인물 설정을 뜻하지 않는다.
- 종지기는 별도 설정·시안 검토 보류다. 기존 표현을 유지하며 이번 8종에 포함하지 않는다. 3막 익명 존재, 서술·기록·안내에는 얼굴을 붙이지 않는다.
- 승인 원본은 art/portraits/npc-plain-v2, 실행 매핑은 game/config/npc-portraits.json이다. 최초 미남형 시안은 사용하지 않는다. 연령·성별이 원문에 없는 템플릿 배역은 시각 제안이며 새 설정 확정이 아니다.

## 2. 화자와 배우 연결
- 표시 이름만으로 초상을 선택하지 않는다. 고유 actorId 또는 sceneId + rowId + portraitId로 연결한다.
- ‘주민’이라는 이름으로 서로 다른 장의 사람을 한 인물로 만들지 않는다. 같은 템플릿 재사용과 동일 인물 설정은 별개다.
- 구조 전/후 덕수, 13·20장 석공, 14·20장 길찬은 같은 정체를 보존한다.
- 미공개 이름은 얼굴을 추가해도 이름 공개 타이밍을 변경하지 않는다.
- 서술·기록·안내에는 인물 얼굴을 붙이지 않는다.
- config에만 남은 문탁·백산·복만 등은 현행 소비 경로를 검증하여 분류한다. 월이·칠복은 최신 7장 rescue 마커와 동적 증언 소비 경로가 확인되므로 공용 주민형으로 커버한다. config의 legacyOnly 표기는 현행 마커와 불일치하며 구현 시 바로잡아야 한다. 데이터의 존재만으로 새 전용 초상을 만들지 않는다.

## 3. 그림 규격
- 세로 1024×1536 투명 PNG 원본, 상반신/허리까지. 머리·두건·어깨를 자르지 않는다.
- 설오 7번의 중간 밀도 회화적 2D 게임 그림체를 따른다. 얼굴만 실사, 옷만 만화가 되면 불합격.
- 한국형 얼굴. 주민은 아이돌형 미화 금지, 주요 인물도 개성과 나이·생활감이 우선. 모든 인물을 같은 얼굴로 만들지 않는다.
- 큰/중간 명암면, 선택한 주름과 머리카락 덩어리로 표현한다. 단색으로 평평하게 만들지는 않는다.
- 모공, 반복 직물결, 종이노이즈, 잔점, 규칙적 해칭, 무의미한 미세 흠집 금지.
- 참조는 화풍용과 정체용을 구분한다. 주인공 참조의 얼굴·흉터·무기를 NPC에 복제하지 않는다.
- 인게임 복장/실루엣 우선. 종지기는 외지 법사이며, 현재 회녹색 작업복·두건·대각띠·갈색 앞치마·목제 타격구·쇠사슬을 따른다. 보라 뾰족 두건 마법사나 승려로 되돌리지 않는다.
- 연령·구체적인 얼굴·무확정 의복 선택은 미술 제안으로 표시한다. 대사의 정보를 새로 꾸며 확정하지 않는다.

## 4. 표정과 재사용
- 공용 주민: 기본/경계/안도/애도 중 실제 필요한 것만. 매 장면 랜덤 얼굴 금지.
- 전용 NPC: 기본 + 사건상 필요한 표정 1~2. 덕수는 들림/회복, 종지기는 억제된 위압/동요를 얼굴이 변하지 않게 제작한다.
- 각 변형은 승인 원본과 독립 프롬프트에서 새로 생성한다. 변형→변형 누적 수정 금지. 확인하지 못한 ‘완전한 새 세션’ 격리는 보장하지 않는다.
- 주민과 주요 적의 차이는 화려한 장식량이 아니라 실루엣·얼굴·시선·자세·핵심 소품으로 만든다.

## 5. 표준 프롬프트
Use case: stylized-concept. Asset: HONRO Korean dark-fantasy game dialogue portrait.
Reference identity: {approved_target_master_or_new_design}. Style reference: approved Seoro score-7, STYLE ONLY, never copy his face, scars or costume.
Subject: {speaker_id, established_role, verified_costume, proposed_age_and_face_if_unspecified}.
Emotion and pose: {scene_specific_intent}; restrained, readable at mobile size.
Fresh independently rendered vertical 1024x1536 waist-up portrait, complete head and shoulders, near-front torso slightly facing right, consistent head scale. Medium-detail painted 2D game illustration across face, hands, hair and clothing. Broad and medium tonal planes, selected folds, grouped hair, restrained edges and muted palette. Distinct unidealized Korean face, credible hands, meaningful simple props.
Genuine alpha-transparent background. No backdrop, halo, vignette, fog, scenery, frame or text. No pores, repetitive microtexture, fabric weave, grain, stippling, hatch grids, fine noisy scratches, photo realism, plastic anime face, glamour retouch or invented ornate accessories.
Lock: {identity, age impression, silhouette, costume, palette, props, narrative reveal constraints}.

## 6. 최소 3회 집중 검수 + 종합
1. 설정/정체: 실제 대사와 배우/복장 대조, 나이·성별 추정 구분, 주인공 얼굴 복제·이름 선공개·보스 인격 날조 없음.
2. 미술: 주연 원본과 비교해 얼굴/옷 같은 밀도, 확대 미세결·손·실루엣 검사, 주민과 주요인물 구분.
3. 화면: 작은 모바일 얼굴 크기·어두운/밝은 바탕의 alpha 가장자리·실제 대화창 크롭·버튼/본문 간섭·불필요한 리렌더 확인.
4. 종합: 재사용 계획이 실제 장면에서 인물 혼동을 만들지 않는지, 전체 화풍이 맞는지 확인. 후보 이미지 검수와 게임 연결 검수를 구분한다. 코드 테스트를 미술 통과 근거로 대체하지 않는다.

## 7. 런타임 적용 원칙
- 승인 원본은 보존하고 배포용 WebP 파생본을 따로 만든다. 같은 초상을 장면마다 복제하지 않는다.
- portraitId별 단일 캐시, 필요한 장/장면에 맞춰 요청·decode. 모든 NPC를 인트로에 선로드하지 않는다.
- 새 이미지로 대체한 인물의 구 벡터 초상을 폴백용으로 병존시키지 않는다. 새 로더가 실패하면 이름·본문·다음 입력은 정상 표시하고, 중립 빈 초상 영역과 제한된 재시도만 사용한다. 게임 진입 무한 대기 금지. 이는 v1.0의 ‘기존 벡터 폴백’ 문구를 최신 사용자 원칙에 맞게 대체한다.
- 일반 주민/전용 NPC/미제작 인물은 명시 매핑, 문자열 유사성·클래스 추정으로 주연 얼굴 대입 금지.
- 전투 대화·쉼터·허공터 등 실제 사용처를 전수 대조. 스크린샷 시안 완료를 배포 완료라고 부르지 않는다.
