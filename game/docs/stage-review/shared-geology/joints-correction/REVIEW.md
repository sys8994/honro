# 2장 접합 교정 — 부모 최종 화면 검수 대기

최종 실행 소스 f46a6dc3. **기능 검사 통과, 최종 미술은 미통과/부모 검수 대기다.** master/Pages에는 반영하지 않았다. 물리·시나리오·보상·카메라·스킬 UI는 수정하지 않았다. 기존 정상 자원21라운드 호위 승리 근거를 보존했으며 전투 전체를 다시 실행한 결과가 아니다.

## 네 항목의 변경

1. 실제 암턱은 공통 HonroGeologyArt.drawSurface에서 실제 collider polygon을 같은 화강암 팔레트와 해당 지지 모듈의 색면으로 채운다. 금속성 그라데이션과 전면 검은 윤곽을 제거하고 약1pixel 보행 rim을 남긴다. 카메라용 확장 cap에 새 단색 띠를 만들지 않는다. 전체 뒤 절벽은 실제 collider로 잘라내지 않으며 별도 dummy/skirt를 추가하지 않는다. 배경 복사만 하고 rim을 남겼던429045e4 중간 후보는 실제 고체 면이 흐려져 폐기했다.
2. wood:pine-wall-root는 기존 act1-scene:rooted-pine 밑동 형태를 분리하고 꺾임을 곡선으로 보완한 공통 구성품이다. 별도350×155 SVG/Library 자산이며 나무 전체를 복제하지 않았다.5개 실제 목재 발판의 내측 지지점 아래에 배치하고 오른쪽은 수평 반사한다. 보행면 위로 새 장애물을 그리지 않는다. wood/oneWay/파괴 판정은 그대로다.
3. geology:granite-vertical-cleft는 중앙 능선이 높고 어깨/중간 돌출부가 엇갈린 공통 변형이다. 동쪽 주 능선과 바깥 모듈의 배치/겹침/균일 배율을 다르게 했다. 원본 2,080×2,360, 배율.85–1.1이며 비균일 확대·랜덤 노이즈·거대 색면 덧칠은 없다.
4. 진입 wide 카메라까지 좌우 모듈을 연속 배치했다. 외곽도 같은 Library 자산이며 새 skirt가 아니다. navigation/entry-dialogue.png를 이전 ../navigation/entry-dialogue.png와 비교할 수 있다. 실제 캡처 카메라는 SOURCES.json에 기록한다.

공통 호출: build-geology-art.mjs → 활성 Library850개 → act1-scene-composition.mjs의 장식 인스턴스 → geology-art.js의 prepare/draw/drawSurface → 기존 Scene/VectorArt. stage2-layered-road-art.js에는 색면 좌표/새 경로 목록이 없다. terrain-readability.js는 이2장 암턱/목재의 중복 전면 윤곽만 생략하고 공통 재질의 실제 상면 rim을 사용한다. 도로와 다른 장의 판독선은 유지한다.

공식 동일 map revision Continue의 이전 장식 배치 v1은 현재 v2를 렌더 뷰에서 해석한다. 저장된 전투를 변경하지 않는다. Workshop 배치는 갱신하지 않는다. 실제12장 지도는 이번에도 변경하지 않았다.

## 실제 검수와 폐기한 후보

- review1: 전체·서/동 근접에서 재질/검은 윤곽 제거를 확인했다. 확장 cap의 어두운 단색 띠, 각진 뿌리 받침대가 보여 수정했다.
- review2: 원본 크기의 새 변형/곡선 뿌리와 근접 접합을 직접 확인했다. cap에 색면을 덧그린 직사각형 이음을 발견했다.
- review3: 전체·근접과 실제 Continue/진입 wide에서 연결을 확인했다. 배경 복사만으로 실제 cap 고체 면이 불분명해지는 문제를 발견해 통과시키지 않았다.
- review4/5: 실제 collider 면을 다시 명시하고, 최종적으로 해당 공통 지지 자산으로 면을 연결했다. 일반적인 금속 명암·전면 ink로 되돌리지 않았다. 양쪽 근접과 전체도를 직접 열었다.
- 별도 final: 고정한 f46a6dc3에서 일반·발판 근접·전체·모바일/가로13장과 실제 Continue/진입 대사/보상/쉼터/3장 연결5장. 부모 요청의 일반/근접/전체/진입wide/모바일을 직접 확인한다. 원본 PNG를 보존하며 이미지 생성/래스터 편집은 하지 않았다.

원본 source의2장은 이번 새 변형/뿌리 자산을 공통 Scene.landmark로 native .98/1배, 실제 인물 높이92 대비 렌더한 것이다. 기존3개 자산은 변경하지 않았다. 이전 원본·부모가 본 b0be715a 최종8장도 상위 경로에 그대로 남아 있다.

## 검사와 한계

build 및 web-split(30장/850 Library/생성 해시/실제 Game·embedded·Workshop), geology-modules(원본 등록 재실행/metadata/socket/collision0/기존30장·기존자산 보존), geology-composition(지지/배율/합성 재사용/장식 v1 Continue·Workshop 구분/스냅샷 불변), stage2-layered-art-invariants(fresh·실제R3·실제R21 렌더 불변/warm Path2D0/정지 cache 재사용/실제 고지 화살74damage/기존1장 Canvas pixels 동일)가 통과했다.

최종 브라우저에서 실제R3 Continue·기존 정상R21 승리 저장의 보상/담허 합류/쉼터/3장 진입을 확인했다. 기존 Damheo M06→LM06 정규화는 navigation.json에 그대로 명시하며 이번 렌더의 저장 변경으로 숨기지 않는다. 실제 전투 전체·다른29장 화면·공개 Pages 검증은 재실행하지 않았다.

남는 미술 한계: 근접에서 실제 암턱과 뒤 지지부 사이의 옅은 직사각형 경계가 남는다. 따라서1번 접합 교정은 완전히 해결했다고 보고하지 않는다. 실제 충돌 윤곽을 보존했으므로 일부 암턱 끝/목재 상면의 직선도 남는다. 원본 모듈을 공유하는 구성도 완전히 무반복이라고 할 수 없다. 기능 검사나 회차 수로 최종 미술 합격을 선언하지 않는다. 부모의 최종 실제 화면 판단 전 master/배포를 보류한다.
