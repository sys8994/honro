# 22장 옛 장부 — 미술 검수 초안

기준 master: d7c1f8457dd33decda5481c7c3b57d8505f6f157.
승인 대기 브랜치: codex/stage22-place-review. master/Pages에 반영하지 않았습니다.

## 실제 이미지

- `before/after-overview.png` / `after/after-overview.png`: 같은 카메라 Native Canvas 전체 전후. before 폴더의 파일명 after는 캡처 도구의 출력 이름이며 실제 데이터는 기준 커밋입니다.
- `before/after-register-ascent.png` / `after/after-register-ascent.png`: 같은 카메라 호적각 확대.
- `browser/before-desktop-west-court.png` / `browser/after-desktop-west-court.png`: 실제 Game 데스크톱.
- `browser/before-mobile-west-court.png` / `browser/after-mobile-west-court.png`: 실제 Game 모바일. storyTween을 해제한 카메라 검수이며 실제 좌표는 browser/report.json.
- browser 폴더에는 시작마당·상부 대조마당도 있습니다. 적을 제거하지 않았으나, 카메라만 이동한 화면을 정상 전투 완주나 그곳까지 이동한 증거로 주장하지 않습니다.

## 변경과 보존

반복된 전체면 벽돌과 층을 관통하는 긴 목재 지주를 줄이고, 짧은 석재 기단과 뒤쪽 암산으로 구분했습니다. F 서측 선택 경사에 폭100 중간 마당을 두고 왕복 접점을 조정했습니다. F/G 하단 외곽을 큰 굴곡으로 분절했습니다. 필수 동측 경로, 5개 목표/순서, 배우, 초기 상태, 유한 사건과 두 문은 exact 보존합니다. G 평탄부와 2턴 방어, 동쪽 증원 지지면은 유지합니다. 다른29장 JSON은 exact 불변입니다. 기록함 소유자·거리 정책과 최근 P0 런타임은 변경하지 않았습니다.

## 검증 상태

- 빌드 성공. 실제 desktop/mobile 전후12장, Native 전후16장 생성.
- evidence-pickup-p0:48행 통과. field-evidence 통과.
- 서측 접근/귀환 및 headroom: 국소 경로 검사. 최신 결과는 route-df/route-fd 및 독립 검토 참조.
- 정상 자원 Native App 전투 시도 진행 중. 브라우저 정상 완주·모든 파동 실효·최종 미술 승인·전체 계약 통합은 미완료입니다. 완료 판정이나 배포용 승인본이 아닙니다.
- 기존 동결 fixture는 완화하지 않았습니다. 변경 파일 바이트와 정확 campaign delta 목록은 delta.json. 기존 history 계약 체인에 새 미술을 승인본으로 등록하는 것은 아직 하지 않았습니다.
- 실제 사용자 저장은 사용/변경하지 않았습니다. 캡처는 독립 브라우저 fixture profile입니다.

## 참고/전달 제한

공식 참고 페이지 https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=94415 및 https://whc.unesco.org/en/list/817/gallery/ 확인. 사진 전송은 executor proxy403 또는 이미지 형식 오류로 실패했고 우회하지 않았습니다. 공식 사진의 실제 픽셀 검토 완료를 주장하지 않습니다.

Library 준비 요청은 로컬 경로를 직접 수신하지 못했고, 현재 cloud skill/helper가 제공되지 않아 전송·finalize를 하지 않았습니다. Library ID는 발급 완료되지 않았습니다. 사용자 요청에 따라 이 브랜치의 PNG를 원격 검수 원본으로 보존합니다. signed URL이나 세션/개인 기록은 이 폴더에 넣지 않았습니다.
