# 종지기·장승·등불의 현재 조형 기준

2026-10-16, 원격 master `1cc2eb9e59194d9d0a9433315dadccd7d533dfe4`에서 시작한 첫 소규모 보완이다. 도감의 과거 `유지`/구현 완료 판정은 새 작업의 품질 근거로 재사용하지 않았다. 현재 실제 그림에서 아래 부족점만 판단했다. 한국식 성인 다크 판타지를 목표로 삼되 장승·불교 법구 자체가 악하다는 설명은 하지 않는다.

| 대상 | 보존한 장점 / 남은 부족점 | 현재 조형과 소유 원본 |
|---|---|---|
| 종지기 keeper | 교차 깃·앞치마·긴 다리·외부 타종 도구는 유지. 이전 손은 작은 덩어리이고 큰 봉이 팔과 분리돼 하중이 없었다. 얼굴·목도 평평했다. | `shared/runtime/act2-art.js`의 keeper 전용 retained Path2D. 머리싸개 매듭·관자/코/턱·목, 좁힌 겹깃·어깨띠·허리끈·가죽 앞치마, 종 고리를 잡는 손과 타종봉을 쥔 손·굽힌 팔꿈치를 연결한다. 손·팔·봉은 기존 회전 pivot을 함께 따른다. 휴대 청동 종은 기존 설정이며 실제 대종을 들고 다닌다는 고증 주장이 아니다. |
| 장승 warden | 긴 목주·뿌리·좌우 다른 가지·금줄/부적은 유지. 검은 눈구멍이 붙인 얼룩처럼 읽히고 코/입의 절삭 깊이가 부족했다. | `tools/monster-forge/redesign.mjs`와 `material-depth.mjs`. 눈썹 경사면→안와 안쪽→쐐기 코의 밝은 면/그늘→입홈의 안쪽을 연결한다. 관모/심재는 목재 결 방향으로 벌어지고 가지 끝에는 밝은 절단면이 드러난다. 새 무작위 균열이나 반복 결 무늬는 넣지 않는다. |
| 등불 lantern | 기존 비대칭 초롱·쇠고리·흐르는 꼬리는 유지. 한지 구멍과 불꽃이 같은 앞면에 붙어 깊이가 얕았다. | 같은 monster-forge 원본. 휜 쇠고리·상하테의 윗면/아랫면·휜 살·결구, 뒤쪽 틀→어두운 내부→혼불→앞으로 말린 한지의 겹침을 구분한다. 찢김 안쪽에만 좁은 밝은 가장자리를 둔다. |

`shared/assets/monsters/{warden,lantern}.svg`와 `monsters.runtime.js`는 생성물이다. 원본을 수정하고 빌드한다. 같은 기본 그림을 쓰는 variant/정예/`HonroLegacyVisual`의 `legacy_warden`, `legacy_lantern`은 기존 dispatch를 통해 함께 바뀐다. 별도 소환 자산 `summon_warden`, `summon_lantern`은 이 기본 자산을 공유하지 않으며, 이미 구분되는 수호 목주/청홍 등롱을 갖춰 이번에 다시 그리지 않았다. 사용하지 않는 legacy 전체도 재작성하지 않는다.

네 주인공은 스타일 참고이며 자산을 변경하지 않았다. h/r·피해·AI·판정·저장·스킬·motion duration/track keys·bind pivot·baseHeight·viewBox를 변경하지 않는다. 공중 접근 AI와 실제 회복 ring 변경도 기준 master 그대로다. keeper는 종·손의 표현 위치와 도구 조형만 조정하며 기존 attack/step 시간식을 사용한다.

## 참고자료와 접근 구분

- 종지기: [비암사 백제대제 실제 타종 사진 출처](https://www.sjsori.com/news/articleView.html?idxno=740), [가사와 장삼 설명](https://www.ibulgyo.com/news/articleView.html?idxno=84194). 검색 결과에서 타종 사진·복식 설명·출처를 찾았다. 원문은 403, 사진 직접 다운로드는 CONNECT403, 웹의 GIF 응답은 unsupported content-type이므로 원본 픽셀을 직접 봤다고 주장하지 않는다. 교차 깃과 작업복/앞치마는 창작이며 의식용 법복의 정확한 재현이 아니다. 기존 종의 용뉴·음통/외부 타격 도상은 [한국학중앙연구원 종 항목](https://encykorea.aks.ac.kr/Article/E0027239) 참고 기록도 보존한다.
- 장승: [국립민속박물관 장승동산](https://www.nfm.go.kr/kids/user/content.do?pageId=PAGE_000000000000015)의 공식 본문을 직접 읽어 목장승·사모·수호/경계 역할을 확인했다. [추령장승촌 사진 출처](https://www.welfarehello.com/community/hometownNews/d3f65c5c-cd50-44a8-9c91-c78e67e1f268)도 찾았다. 공식 사진 웹 응답 timeout, 추령 사진 다운로드 CONNECT403으로 원본 픽셀 관찰은 미완료다.
- 등불: [노리프렌즈 전통 종이 청사초롱 제작 사진](https://norifriends.com/product/전통-종이-청사초롱등-만들기/2472/). 현대 교육용 제작물의 상하테·고리·분리된 종이 면 구조를 조사했다. 역사 유물이나 한국 등의 유일한 정형을 입증하는 자료가 아니다. 검색 결과와 이미지 URL은 확인했으나 실행환경 CONNECT403 및 웹에서 관찰 가능한 픽셀 미전달로 원본 직접 관찰은 미완료다.

접근 제한은 우회하지 않았다. 외부 사진의 저장소 복제·트레이싱 없이 코드로 벡터를 저작했다. 사진 원본 직접 관찰을 끝낸 고증으로 이 보완을 설명하면 안 된다. 다음 담당자가 참고 사진을 합법적으로 열 수 있을 때 고증을 보완할 여지는 남는다.

## 국소 검수 범위

- `_local/reports/character-trio/before-after.png`: 실제 생산 Scene 렌더러, 세 종류의 기준/수정 280px·90px 동일 배율 비교 한 장. 구현자가 직접 관찰했다.
- `motions.png`: 세 종류 idle/move/attack/hit/jump_fall의 양방향 표본 한 장. 손/도구 분리·가장자리 잘림 없음. hit의 밝은 flash는 기존 반응이다.
- `checks.json`: 프로젝트/스킬·모든 도감 유닛/context·네 주인공·기타 monster/actor 자산 동일성, 두 대상의 리그/clip 동일성, 공유 dispatch 확인. 현재 전체 검사를 추가한 것이 아니라 작업 범위 안의 일회성 비교 결과다.
- `build.log`: 두 HTML 빌드 통과. Chromium에서 Workshop 기본 실행 통과. 최초 Game boot 항목은 타이틀에 canvas가 있어야 한다는 부정확한 조건으로 실패했고 그대로 보관한다. `boot-corrected.json`에서 실제 타이틀→‘길을 열다’→첫 쉼터의 기본 실행·pageerror 없음으로 정정 확인했다. 비교 이미지는 재생성하지 않았다.
- 요청대로 전체 verify·전30장/전투·전체 스킬·성능 sweep·새 회귀 테스트는 실행/추가하지 않았다. 이전 실패를 이번 미완료 작업으로 재분류하지 않는다. 근거는 국소 시각/기본 실행이며 사용자 미술 승인과 다르다.

공개 Pages는 실행환경 직접 접속 CONNECT403으로 차단됐다. master 반영과 Pages workflow 성공은 별도로 확인하고 공개 화면을 직접 봤다고 주장하지 않는다. 배포 결과·최종 SHA는 발행 저널과 최종 보고가 소유한다.
