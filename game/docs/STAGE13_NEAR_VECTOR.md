# 13장 숨은 석문 — 근경 벡터 후보

## 보존 계약

- 8200×6600, Play Bounds 0…8200/0…6600, terrain domain x −6000…14200/y −24000…30600, 배우 높이92를 유지한다.
- 돌림진의 상·하 진입, 석공 분리·실제 안전 이동, 석문 위 작업 발판, 안쪽 빗장, 문 개방과 네 동행 통과의 기존 기하·이벤트·적·NPC를 바꾸지 않는다.
- `shared/build.mjs`의 Stage10 positioning 뒤 `applyStage13VectorFinish` 재적용을 유지한다. 기존 181개 stoneFinish plane, 네 건축/인양 장치 variant, 전술 발판과 목재 지지는 그대로다. 이 후보 hook은 그 뒤, runtime `projectAuthors` 앞에 배치할 대상이다. 공통 build/renderer/savecodec은 이 작업에서 수정하지 않는다.
- 원경 이미지는 별도 유지한다. 새 자산은 `act2-traced:stage13-*`, collision 빈 배열, anchor0, BODY/L1/prop 장식뿐이다.

## 시안과 레이어

한국 산지의 건조한 채석 암반과 낮은 동굴 입구에 맞춰 푸른 회색 슬레이트/화강암 색을 쓴다. 2장/10장 승인 참조의 각진 큰 면·절제된 평면 표현을 따르되 녹색 이끼를 강제하지 않는다. 시안에는 사람·원경·건축·기믹을 넣지 않는다.

최초9400/20200폭 시안은 정상 배율에서 암면이 커지거나, 지역 시안과의 사각 접합이 드러나 반려했다. 현재 후보는 다음으로 분리한다.

| 부품 | 월드 시안 범위 | 역할 |
|---|---|---|
| extension-v2 | −6000,2200,20200,8000 | 원래 단일 domain을 덮는 차분한 연속 지질. 근처 재질을 확대하는 용도가 아님 |
| west-v1 | −700,2650,3700,1900 | 서쪽 실제 배우 배율의 접지 재질 |
| middle-v1 | 2500,3250,3600,1900 | 석공·문 전후 접지 재질 |
| east-v1 | 5600,4100,3500,1900 | 내부 하강로·동굴 말단 접지 재질 |
| roof-v2 | 3700,−2100,10500,6100 | 기존 산체/동굴 천장. 실제 빈 통로를 canonical clip으로 보존 |
| west-shelves-v1 | 780,2820,1610,520 | 원본 서쪽 전술 발판 3개의 표면 재질만 변경 |
| inner-shelves-v1 | 4980,3870,1600,670 | 원본 안쪽 gallery/ramp 3개의 표면 재질만 변경 |

세 국소 재질의 어두운 밑색 두 레이어는 의미별 추적 레이어에서 제외한다. 첫 레이어만 뺀 중간 후보는 최소 줌에서 두 번째 밑색의 사각형이 드러나 반려했다. 최종 후보는 각진 중간/밝은 암면만 연속 지질 위에 얹는다. 따라서 이미지가 그린 불규칙한 암면 끝만 연속 지질 위에 놓이며 사각 배경을 덧씌우지 않는다. 새 충돌 dummy/skirt나 임의 미술 polygon은 만들지 않는다. 기존 전체 terrain polygon과 접지4단위 inset만 표시 clip으로 사용한다. 시안의 미세 정합 이동은 물리 지형·배우·카메라를 이동시키지 않는다.

## 검수 범위

`inspect-stage13-source.mjs`는 실제 production authoring 원본과 native 장면을 조사한다. `preview-stage13-art.mjs`는 동일 renderer의 시작·석공·문·내부·모바일·최소 줌 좌우 끝을 기록한다. `full-map-diagnostic`은 허용 최소 줌보다 작은 구조 참고 보기이며 실제 카메라 합격 근거가 아니다. 모바일 기본 배율은 실제 main의 .82, 가로 기본은 .94를 사용한다.

`test-stage13-candidate.mjs`는 hook 직전 raw sourceguard와 runtime author 이후 effective geometry/quest stage를 별도로 비교한다. geometry drift/중복 적용 차단, 다른 장·기존 library 불변, compiled collision·world terrain·배우 위치/높이 및 vector validator를 검사한다. 이는 브라우저, 정상 전투 완주, 저장매체, 공개 Pages 합격을 뜻하지 않는다. 최종 병합·공통 저장 연결·브라우저·배포는 통합 담당 범위다.

실제 Inkscape 누적 이진 추적 원본은 불변 보관한다. 팔레트 정합과 의미별 밑색 분리 후의 authored raw도 별도로 보존한다. 최적화는 원본을 매번 새로 읽고 1×/2× silhouette/색/보호 접지 픽셀을 확인한다. 실패 후보·OOM killed는 통과로 세지 않는다. 병렬 작업 중 대형 pixel compare/native 렌더는 `/tmp/honro-heavy-art.lock`으로 직렬화한다.

## 최종 후보 계측

불변 실제 Inkscape RAW 묶음612,297B → 최종 SVG414,635B, 32.282% 절감. 의미별 밑색을 분리한 authored RAW587,415B와 비교하면29.414%이며 두 기준을 모두 공개한다. `art/act2-near-vector-candidates/stage13-hidden-gate-v1/pack-report.json`에 부품별 원본/최종 바이트와 해시를 보관한다. 7부품 모두 실제 canonical clip/underpaint 합성의1×/2× 게이트를 통과했다. 원본 이미지의 사용되지 않는 clip 바깥 overdraw를 합격 영역으로 착각하지 않는다. 천장에만 실제로 적용된 기존1/255 RGB 양자화 보정은 alpha가 동일한2/4픽셀이고 원래/보정 뒤 수치를 함께 기록한다. 연속 바닥의 최종 alpha/보호 RGB는 두 배율에서 완전히 같다.

기본 모바일뿐 아니라 실제 HonroBounds 최소 배율과 좌·우·상·하 focus 끝의 세로 화면을 확인했다. 아래쪽은 같은 단색 기반으로 자연스럽게 이어지고, 국소 재질의 사각 밑판·흰 halo·공중 암석이 없다. native fixture의 기하 불변 및 화면 확인이며 실제 브라우저 전투/공개 배포 합격을 대신하지 않는다.
