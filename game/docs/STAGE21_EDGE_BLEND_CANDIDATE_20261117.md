# 21장 유한 암면 끝 합성 후보

기준은 공개 master 7d238d20과 기존 외곽 후보 통합 016b58e2다. 공개 기준선의 `act3-handoff:21:bedrock`은 원본 source x0..2172, 하단 y648에 유한한 색 경계가 있으며 이를 world x0..6400에 직접 그려 사각 끝이 드러났다. bounds는 실제 그림을 포함하므로 범위 확대나 support clip 해제는 하지 않았다.

## 변경
21장 자산에만 `blendFace:true`, `edgeFade:[[0,170],[6150,6400]]`를 추가했다. 원본 vector, contactMapping, bounds, 충돌과 다른 자산은 그대로다. 재생성 도구는 동일 결과와 멱등성을 검사한다.

첫 최소 후보는 Native canvas의 변환된 gradient 합성에서 대부분 strip의 암맥이 사라져 미합격이었다. v2는 21장만 device 좌표에서 source-y 역행렬 covector로 동일한 fade를 계산한다. 다른 장 분기는 원문 그대로다. 이 backend 문제는 Native에서 재현했으며 실제 브라우저에서도 동일하다고 주장하지 않는다.

## 확인한 범위
- portrait 극단 팬/중앙 5뷰와 desktop 좌하단 1뷰의 전후 비교: 물리, 카메라, 전투 상태 동일.
- 원본 vector SHA256 `1032fff44fd58103cb91b730d1d0cfd2e5c976033ba1657411653f0c681fd8cd` 불변.
- 물리 SHA256 `5107168418e8b1fa7cf51f0369ba7d9b6d48ab073a29f2dee86ea507c73e16c3` 동일 기록, 접지 mapping과 bounds 불변.
- 16 strips × 2 density × 15 probes의 affine source-y 등고선 동등성 검사 통과.
- 다른 9장 첫 strip × 2 density의 Native RGBA 동일. 전체 화면 전수 회귀 검사를 뜻하지 않는다.
- v2 직접 시각 확인에서 원본 암맥 누락은 없어지고 좌우·하단 하드컷이 부드럽게 연결된다.

## 잔여와 배포 구분
원본의 세밀한 암맥과 주변 넓은 면의 재질 밀도 차이는 남아 있다. 따라서 이 후보는 하드컷 완화이며 지형 미술 전체 합격이 아니다. 모든 화면비의 모든 팬, 동적 퀘스트, 공개 Game 입력과 실기기는 미검수다. 기존 전투와 사용자 저장은 접근하지 않았다. 원격 후보 보존 및 CI와 master/Pages 공개 배포를 구분한다. 최종 공개 검수 이전에는 배포 완료로 표시하지 않는다.
