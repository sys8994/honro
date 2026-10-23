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
| 18 | cave-roof/lower-vault-tooth/east-gallery-roof | 2738px | 종 하부 leak6033/keeper6247px. 존재하나 하부 전투의 외곽 천장은 매우 높음 |
| 19 | 위와 같은 묵종 지리 | 6213px | 하부 목표 약6007–6153px. 존재하나 낮은 탄도 제한으로 볼 수 없음 |
| 20 | exit-overhang | 916px | 출구 초반 실제 덮개, escort-mid 이후 노천. '다시 하늘 아래' 외부 이탈 구간 |

11·12 야외 원경과 13~19 동굴/20 외부 이탈 구분은 `ACT2_SPATIAL_IMPLEMENTATION.md`, `ACT2_IMPLEMENTATION_NOTES.md` 및 활성 지형/목표의 근거다. 오래된 라운드·크기 수치는 현행 측정치로 인용하지 않았다. 모든 2막을 노천으로 간주하지 않는다. 천장 자체가 없는 장은 11/14 두 곳이며, 내부 마을인14의 누락을 우선 수정한다. 18/19의 높은 하부 공간은 별도 후속 판단 항목이다.

카메라 focus는 기본 playBounds 좌우320/위1800/아래240까지 확장하며 viewport는 그 밖도 본다. 최소 줌은 가로6800px 전술 폭과 배우66px→3.75화소 조건으로 결정한다. 카메라·화면 밖 여부는 투사체 충돌 경계가 아니다. 실제 천장은 화면 밖이어도 충돌하고 전체 월드 암반은 카메라 바깥까지 이어진다.

사용자 첨부 `libfile_a91002e9521481919f1a28fa124df7ff`는 정식 Library materialize 다운로드에서 `download failed`로 실패했다(HTTP 상태 미제공). 우회하지 않았으며 부모의 직접 관찰과 동일 production14 화면을 사용했다.

## 구현·검수 상태

14장 상층 진입→주민→중층/동쪽 능선의 굴곡을 따르는 실제 암반 천장을 작성 중이다. 기존17경로·배치·퀘스트·대사·승인 미술을 보존한다. 사진과 물리/저장 결과는 최종 검수 후 아래에 기록한다. 아직 배포/미술 합격/정상 전투 완주를 주장하지 않는다.
