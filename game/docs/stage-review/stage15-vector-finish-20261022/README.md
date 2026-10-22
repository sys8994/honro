# 15장 바닥·천장 벡터 재질 보완

기준 공개 master d55b6c6876a79ce041bf7473ba43b50a10389543, 브랜치 art/stage15-vector-finish-20261022. 같은 지형 미술 세션을 재사용한다. 아직 설계·변경 전 기준 확인 단계이며 미술 완료가 아니다.

## SOP 설계·보존 카드

2막5장 「물 아래의 길」,8000×6000. 입구/수문→서쪽 비대칭 석조 아치·고지 사격점→물골/마른 관찰점→동쪽 아치·출구. 필수 groove→route-exit, 선택 sluice. 현재 데이터의 A배수 아랫길/B고지 경로와 수문 전후 fc15-drained-ledge의 실제 활성/경계·머리 공간을 보존한다.12충돌지형과 기존44planes 중 비대칭 아치·고지·물가의 기존 구성은 미술 교체 대상이 아니다.

변경은 act2-floor/cave-roof의 전체 solid 안의 정적 재질과 필요한 시각 접합뿐이다. 큰 명암→중간 파단→일부 짧은 절리/돌턱을 공유 경계로 연결한다.14장 반려 후보처럼 긴 평행 색 띠·희미한 세로선만 늘리지 않는다. 격자/동일 쐐기 스탬프/미세반복·가짜 구멍·의도된 들림 메우기는 하지 않는다. 천장/바닥/아치의 명도를 구분하고 젖은 접촉은 기존 팔레트/물효과를 보존한다.

전체 polygon/충돌·플레이/카메라·12지형·기존 아치/shoulder/crown-return·dry-ledge/A·B/배우/NPC/적/HP/목표/밸런스/원고/보상/저장·모든 Library/이미지 원경·물효과와 타29장은 불변이다. 전역 renderer/main/UI·별도 프레임 renderer·매프레임 geometry/texture 생성은 변경하지 않는다. 시각 저작 단계만 수행하며 별도15장 기계적 진단 후보는 병합하지 않는다.

## 기준 픽셀·발행 보존

부모 Library libfile_c6cd145ff30081918cbe7b2dd0c94aeb의 stage15-before-center.png를 지원 prepare/materialize helper로 한 번 시도했으나 `library file transfer failed: download failed`. 소비 실행환경의 실제 경로 `_local/reports/stage15-vector-finish/reference/stage15-before-center.png` 존재 false를 확인했다. 원본을 봤다고 주장하지 않으며 임의 URL/우회 인증·부모 로컬 경로를 사용하지 않았다.

대신 같은 d55 생성물 entry80058be2c7d5a3e3의 실제 UI로15장 입장→대화 넘기기→휠2회→가로 중앙 팬을 직접 촬영하고 [기준 중앙](review/before-center.jpg)과 [기준 전체](review/before-overview.jpg)를 직접 열었다. 가운데 비대칭 아치는 보존할 특징이며, 바닥/천장의 거대 저밀도 면과 몇 개의 스탬프 같은 면이 지배하는 것을 확인했다. 자동 원자료는_local/reports/stage15-vector-finish/baseline에만 둔다.

빌드 전에 실제 성공 d55/Pages39828457605/2026-10-22T18:08:34Z를 등록했다. 공개 그래프 SHA256 c864a87b28e8f88476e2339229e3c58cdaa9ecaa2a8c29eeed118e3c3d7f57d9, 원본/현재 immutable 검증 성공·복원0. 최근7일 전체+최소2개 및 별도 중간2세대를 유지한다. 구934 chapter13 두 리소스의 hash/길이도 관련 검사에 포함하며 후보를 발행 성공으로 넣지 않는다.

집중1은 입구/공동/물골/출구·천장/바닥 전체 연결, 집중2는 아치·물가·발판·배우/탄도·수문 전후, 집중3은 모바일 기본/최소줌/양끝·아래 팬이다. 각 발견·수정·남은 특징을 실제 캡처로 기록하고 최종 동일 소스의 별도 종합을 직접 연다. 상태 fixture는 정상 전투/배수 완주 근거와 구분한다. 변경 관련 불변/재현/멱등/정적 캐시/공통 build만 실행하며 전체30장·전체verify는 하지 않는다. 각 단위commit/push, master/Pages는 부모 담당이다.
