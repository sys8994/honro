# 15장 외곽·접합 독립 검수 후보

기준 master7d238d20, 후보는14장ad1dee06 후손이다. 기존 공개판·사용자 저장·전투에는 접근하지 않았다. Native Scene은 공개 UI나 실제 플레이 검수의 대체물이 아니다. master/Pages 배포 전 후보이며 최종 SOP 합격이 아니다.

## 범위와 결함
최종 compact5800×4200,source/battle12개 지형 모두 indestructible99999,파괴형 quest target0. 기본 상태에는 drained-ledge가 broken인 상태다. 접점12×3화면비36뷰,전체/모서리15뷰,focus극단12뷰 총63뷰. DPR1,desktop1331×763/portrait390×696/landscape844×390. 실제 카메라·물리SHA는 audits/stage15-native-20261117.json 참조.

outer-v1의 canonicalSolid/underpaint는 원본Y−24000..30000까지 이미 그려져 있으나 compact mapper가 구형 illustration bounds Y−500..8000으로 strip을 잘라 compact월드Y−2100..6400에서 큰 사각 경계를 만들었다. 바깥 procedural terrain이 드러나 원본 그림과 갑자기 바뀌었다. native 실제 자산 검사에서 필요한 하단 표본 alpha0으로 재현됐다.

## 1차 후보의 보존 범위
outer의 compact strip 및 bounds/viewBox/reference 등록만 기존 canonical 범위로 맞춘다. 원본 path·symbol·root transform·배치, 다른3개 미술 자산,source/stage/물리/퀘스트/저장계약은 보존한다. 새 형상이나 시안 재생성은 하지 않는다. 원본 최하단815/816px의 전폭alpha255와 RGB(40,59,70)는 기존 underpaint#283b46과 동일하다. 상단0/1px는7~25색이 있어 최종 A/B에서 별도 확인해야 한다.

기존 outer 최적화4paths와 주소는 보존하고 작은 terrain-path-registrations에 새 vector hash만 등록한다.3/7/12 등록도 보존한다. 이 변경은 미술 최적화 재작성이나 게임플레이 수치 조정이 아니다.

## 미검수
공개 Game 입력/실제 모바일/resize/핀치,전체 접점×최대줌×상태 행렬,수문/수위120변화와 드러난 ledge,두 도르래/낙하·ax36궤적,합류 혼령·깊은 두드림·상하분기 및 재진입/저장. 정적 렌더에서 해당없음인 지형 파괴를 상태 검사 성공으로 세지 않는다. Native와 실제 게임플레이 정량 확인은 구분한다.

1차 후보 A/B63뷰 완료. 큰 상·하 사각 경계는 제거됐고 직접 확인한 상단/하단/전체 표본의 원본 보행면은 유지됐다. 다만 상단 portrait1 y228 부근 암맥의 짧은 수평끝이 source canvas crop인지 추가 조사 중이다. 이를 전체 접합 해결로 표시하지 않는다. 원본 첫행 연장도 아직 수행하지 않았다. 물리 SHA4f2c018d634a37cee49300345da598ef10911a64b8859f3dc4170c9c890e8627 동일.

추가 읽기전용 분석: 상단 #38505b traced path segment335는 source(1322.4345,0)→(1372.9172,0), 다음곡선은(1422.45,0.8514)다. portrait1 screen x188..232,y227.56과 일치한다. runtime clip이 아닌 원본path 끝이며 canvas경계 흔적은 강하지만 의도된facet인지 확정할 근거가 없어 의도불명/미해결로 보존한다. 첫행늘이기는 수직띠 위험으로 적용하지 않았다.
