# 30장 후면 수면·유한 암면 끝 후보

## 원인과 최소 변경
후면 `stage30:ferry-distant-channel`의 첫 path는 world y7100에서 끝나 관측 화면의 수평 원경 노출과 일치했다. 저작기 `distantRiver(stage)`의 첫 path 하단만 기존 domain 하단31200으로 연장하고 bounds/reference.bounds/viewBox/source를 함께 재생성했다. 수면 윗선, 다른 두 path, gradient와 실제 물·배 동작은 그대로다. 전체 campaign에서 이 library 자산 한 개 외에는 변경하지 않았으며 22장 기초 메타데이터도 보존했다. 지형/roster 전체를 다시 만드는 apply-stage30 도구는 실행하지 않았다.

`sf-east-outer-grade`, `sf-old-road-gather`는 기존 depth2600에서 유한 ROCK_FORMS의 끝이 각각 world y7668/y7290에 닫혀 직각 단면을 만들었다. 두 ID만 정규화 y1000~1100의 깊은 그림 끝을 기존 바탕으로 합성한다. 원본 forms·색·배율·상부 좌표·strata·masonry·배 이벤트는 유지한다. 다른 지형은 원래 분기로 그린다.

## 검증
- source 자산을 이전 하단값으로 재생성해 환원하면 22장 후보 campaign 전체 hash와 동일.
- 단일 자산 생성기 재현·멱등성, 다른 path/gradient 불변, bounds/source 정합 검사 통과.
- runtime 새 제한 분기를 제거하면 기존 원문과 동일.
- Native mask는 상부 alpha 유지, y1000~1100 fade 및 대상 ID 한정 검사 통과.
- Native portrait 전체/팬 5뷰와 필터에 함께 포함된 상부 ledge 1뷰, 총6뷰 상태 불변. 5개 overview의 전후 카메라·물리 동일.
- 직접 비교에서 수면 아래 원경 띠가 없어지고 우측 두 암면의 직각 하단이 완화됨을 확인. 물리 SHA256 `c727cab616ba601587bdc2728fdeec76f6685f9d7bd1959354bc419396411fd8` 유지.

## 한계
암면 tile은 정규화1000×1150 RGBA로 한 개 약4.6MB, 두 대상 최대 약9.2MB이며 terrain cache의 source/version과 style key에 연결된다. domain 높이31200으로 canvas를 만들지 않는다. 상부 vector 형태·색·배율 보존이 상부 픽셀 완전 동일을 뜻하지 않는다. 고배율 재샘플링/AA 및 연속 줌은 아직 확인하지 않았으므로 최종 배포 전에 별도 확인이 필요하다.

깊은 암면과 바탕의 재질 밀도 차이는 남아 있다. 하드컷 후보이며 미술 전체 합격이 아니다. 공개 UI·실기기·배/붕괴 상태는 미검수다. 사용자 저장/기존 전투를 접근하거나 변환하지 않았다. 원격 보존·CI와 master/Pages 배포는 구분한다.

22장 이전 전체 campaign fingerprint 검사는 이번 수면 자산의 정확한 승인 SHA만 이전 자산으로 환원한 별도 복사본으로 대조한다. 다른 임의 변경은 허용하지 않으며 기존 두 기초 메타/마스크/원문 검출력은 유지한다.
