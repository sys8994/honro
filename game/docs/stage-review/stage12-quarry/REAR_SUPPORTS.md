# 12장 후방 지지 연속성 교정 후보

소스 `fdddaf84acad950488357a4bc6c09470ecd1eab0`, 브랜치 `stage/act2-ch12-rear-supports`. 비교 기준은 부모가 직접 확인한97bcf602다. 이번 판정은 **지지 연속성 개선 확인, 최종 미술은 부모 검수 대기**다. 장 전체 미술 합격·정상전투 신규 완주·배포 완료가 아니다. master/Pages/13장은 실행하지 않았다.

## 바뀐 공간과 그림 순서

상부/서쪽 mass와 아래 지형 사이의 하늘이 끊김 없이 보여 공중 발판처럼 보이던 문제를 교정했다. 실제 solid union에만 그림을 가두는 전면 부착과 별도로, 기존 공통 foundation/vertical **3개**를 L1의 뒤쪽 지지로 구성했다. 새 삼각 면·거대 반투명 polygon·새 소나무·자산 원본을 만들지 않았다.

| 후방 인스턴스 | 실제 공통 assetId | 지지점 | scale / socket | 실제 모듈 원점 |
|---|---|---|---|---|
| quarry-rear-west-foot | geology:granite-foundation | sq-lower-ground x4130, y5002.549 | .9 / foot, +50 매립 | 4130,5052.549 |
| quarry-rear-north-root | geology:granite-vertical | sq-lower-ground x7800, y5617.826 | .9 / lower-rear | 7665,6103.826 |
| quarry-rear-north-foot | geology:granite-foundation | 같은 x7800 지지점 | 1.1 / foot, +60 매립 | 7800,5677.826 |

북쪽 뿌리는 lower-rear socket을 실제 하부 표면에 맞추므로 발은 아래 solid에 묻히고, 위쪽은 기존 상부 mass 뒤로 들어간다. 서쪽은 높이 차가 낮아 밑동 모듈만 썼다. 중앙 x6000,y4550 부근의 하늘/공중 여백을 남기며 모든 허공을 채우지 않았다. 동굴 입구와 우측 바깥 하늘도 남는다. 서쪽 전면에는 동일한 공통 foundation 하나를 기존 solid 안에 부착해 이전 독립 색면을 연결했다(전면 총10개). 기존 전면 clip·보행 rim 보호는 그대로다.

데이터는 `tools/environment/stage12-quarry-art.mjs:QUARRY_REAR_GEOLOGY` → design.geologyComposition에 있다. 실제 원본 `HonroGeologyArt.prepare/draw`가 support terrain/foot/socket으로 위치를 계산한다. 새 공통 `shared/runtime/geology-rear-support.js`는 renderLayer='back'인 조합만 기존 _landmarkLayer의 back 시작에 그린다. 그 뒤 기존 장식, 실제 terrain/rim, 인물, 조준선, 표식을 원래 순서로 그린다. 장 번호/지형 ID 분기·새 collider·walk edge·rim은 없다.

월드 투영은 L1 그대로이며 색만 기존 visualDepth L2와 brightness .74로 뒤쪽을 구분한다. 불투명 원본 모듈을 썼고 alpha로 거대 면을 씌우지 않았다. Canvas filter는 save/restore 안에서 적용한다. 기존 월드 타일 cache를 사용하고 새 거대 bitmap cache는 만들지 않는다. 조합 version/brightness/depth를 월드 cache key에 포함했다. 공통 준비 결과도 같은 battle에서 재사용한다.

## 공통 원본 동기화와 통합 주의

작업 시작 당시 master는edf712e9였고 2장 후보는d03ca76c였다. 작업 중2장 publication이 확정된 **master27efe8ebdab24e147494196a515641e0629e4656**를 확인한 뒤 공통 builder/renderer를 그대로 동기화했다. SVG5개는 이미 그 master와 동일했다. 원본7파일은 모두 master와 byte exact이며 REAR_SUPPORTS.json에 SHA256이 있다. 공통 파일을 경쟁 수정하지 않았다.

2장의 campaign/map/배치·전용 renderer·전체 브랜치는 가져오지 않았다. 따라서 이 후보는 최신 master 전체를 병합한 브랜치가 아니다. 부모가 통합할 때 최신 master의 2장 데이터와 스킬 UI를 보존하고12장 데이터/시각 연결만 합쳐 생성물을 재빌드해야 한다. 기존 register-geology-art의 backgroundRange 교집합 어댑터는 유지했다. 원본5개 정의의 등록 metadata만 현행 master에 맞춰 갱신했고 다른 Library 정의는 동일하다.

## 실제 검수와 남은 한계

`evidence/rear-supports/`에 원본 PNG45장을 저장했다. before14/focus1 4/focus2 4/focus3 5/final14/actual-save4다. 집중3회와 별도 최종 검수를 수행했다. before의 핵심4컷, 각 focus 전부, final14컷과 actual-save4컷을 직접 열었다. 같은 카메라14개 rows가 일치하며 final은 깨끗한fdddaf84에서 촬영했다. 초기 focus는 미커밋 변경을 capture.json에 기록했다. 자동 검사나 회차 수를 미술 합격 근거로 쓰지 않는다.

- 1차: 전체/서쪽/상하 연결/모바일에서 서쪽 밑동과 중앙 동쪽 뿌리가 실제 아래 지형으로 이어지는 것을 확인했다. 중앙 여백은 남았지만 서쪽 전경의 옛 큰 면이 따로 보여 동일 foundation 전면을 연결했다.
- 2차: 길표/수레/하부 접점/상부 발치를 확인했다. 뒤쪽 암반은 더 어둡고 rim이 없으며 실제 보행면·인물·표식이 앞에 남는다. 수레 가림은 후방 지지가 새로 만든 문제가 아니었다.
- 3차: 일반 모바일3곳, 뿌리 모바일, 확대를 확인했다. 사각 bitmap clip 경계나 규칙적인 기둥 복제는 보이지 않았다. 단, 좁은 모바일에서 기존 전면의 큰 면은 여전히 지배한다.
- 최종: 전체/일반/최대축소/확대/서쪽/상하/길표/수레/모바일14컷을 별도 확인했다. 지지 연속성은 개선됐으나 기존 큰 면, 길표의 돌출 덩어리 인상, turning-veil의 실제 직사각 외곽과 수레/일부 소나무 가림은 남는다. 전면/후방 구별과 장 전체 미술의 최종 수용은 부모 픽셀 판정이 필요하다.

기존11개 구도는 GEOLOGY_ATTACHMENTS.md와 같다. 추가 구도는 west-normal(4300,4670,.65,1440×900), root-joint(7300,4700,.55,1440×900), root-mobile(7350,4650,.4,390×844)다. 전체는6500,4200/실제 최소 .21176470588235294다. 원본 파일명은 `stage12-{구도}.png`; 정확한 카메라와 해시는 각 capture.json/REAR_SUPPORTS.json에 있다.

## 관련 검사·실제 저장·사선

`checks.json`은97bcf602와 비교해 새 시각 조합/부착/출처목록 외12장 canonical 전체, 다른29장 canonical 전체, terrain/worldTerrain/배우/자원/markers/기믹/보상/revision 동일을 확인한다. 기존 수레·잔석·rooted-pine과 모든 기능 좌표도 그대로다. 실제 공통 painter3개 호출, foot/socket 접점, rear rim stroke0, battle/Canvas purity와 준비 cache 재사용을 검사했다.

원래 물리 밖인4130,4800과7600,4500에 불투명 공통 암반이 보이되 collider는 없고, 중앙6000,4550은 alpha0이다. 이 수치는 구조 연결과 열린 여백 확인이며 전체 공간 미술의 자동 합격이 아니다. 전면 검사 front-checks.txt는 새 서쪽 부착을 포함해 실제 solid 밖 sample0, walk 보호118점, 기존 매립 cache 재사용/16MiB 한도와 대표 정적 픽셀 회귀를 확인했다. Library 비교는 최신 공통 등록을 적용한 정의를 기대값으로 한다. author2회·build 및 기존 V3 상하 terminal Continue도 통과했다.

추가로 **실제 정상 플레이의 상·하 gate-open 저장**을 production browser Continue로 열고 위치/HP/자원/전투 상태를 바꾸지 않은4컷을 남겼다. 현재 선택된 A01/원래 각도·위력의 prediction을 후방 조합 삭제 사본과 비교해 완전히 같음을 확인했다. 하부 예측 끝점8074.055,5813.355, 상부7296.013,4633.725다. render/predict 전후 battle JSON도 동일하다. 새 발사·강제 자원·적 삭제·새 승리·전체 재완주는 없다.

이 구전투는 자기 전면/랜드마크를 보존하므로 actual-save 화면은 신규 전면 미술 판정용이 아니다. 후방 조합만 canonical draw view로 비파괴 참조한다. 인물과 조준선이 뒤쪽 지지 앞에 보이는 것을 확인했다. legacy 저장의 모바일 카메라는 기존 framing이 .1083333으로 맞췄으며 실제 값과 cache bytes를 actual-save/checks.json에 기록했다. 신규 전면의 모바일 비교는 final/root-mobile 등 별도 캡처를 사용한다. 이 browser 저장 화면들의 pageerror는0이다.

수레 회전 후 두 바퀴 최소 표면 간격은3.753539/0world다. 접지/가림 표본에서 몸체206/1675점만 old-road에 가리고 바퀴·후속 잔석 가림은0이었다. 잔석은 수레/상호작용 표지를 새로 가리지 않으므로 옮기지 않았다. 원본 진단은 contact-diagnostic.json, 이전 정상 저장 Continue는 terminal-save-checks.json에 있다.

현재 접근 거부·결과 불명 쓰기는 없다. 시작 시 옛 로컬 서버8873의 empty-response는 새8874 서버로 복구했다. master/Pages는 부모의 보류 지시에 따라 미실행이다.
