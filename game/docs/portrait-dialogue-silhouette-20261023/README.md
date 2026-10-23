# 큰 대사 반신 실루엣 보완

부모의 실제 이미지 검토에서40900188 돌출형을 거절했다. 작은 카드용 휘겸 얼굴 crop이 큰 대사에도 적용돼 갓 윗부분/양끝이 잘렸고, 가로는 인물이 창 위에만 떠 왼쪽 본문 여백이 비었다. 이전 통과 수치는 이 시각 결함을 합격시키는 근거가 아니다.

공통 portrait 목적을 `dialogue`와 기존 `bust`/`icon`으로 구분했다. 큰 대사는 네 이미지의 눈·턱을 포함한 명시적 얼굴 영역 높이를 기준으로 축척을 맞추되 원본 좌우 전체폭+64px와 상단32px 여백을 보존한다. 사각 칸을 채우려고 모자/머리/어깨를 확대 crop하지 않는다. 원본/배포 이미지는 불변이다. 기존 카드의 얼굴 정렬과 작은HUD는 유지한다.

세로는 하단을 창 뒤에 가리고 본문 전체폭을 쓴다. 가로는 인물이 창 왼쪽 영역을 실제로 채우며 하단은 viewport 아래로 이어져 직선 crop이 화면 위에 뜨지 않는다. 본문/버튼은 인물 오른쪽의 분리된 영역에 두고 pointer-events:none을 유지한다. 프레임 루프·loader/timeout·surface/cache를 새로 만들지 않는다.

[390 휘겸 거절본/보완본](evidence/390-hwigyeom-rejected-revised.jpg) · [844 가로](evidence/844-hwigyeom-rejected-revised.jpg) · [네 인물 세로](evidence/390-four-dialogue.jpg) · [가로](evidence/844-four-dialogue.jpg). 실제14장 휴식 대사이며 원고는 변경하지 않았다. 새 디자인은 부모의 최종 시각 검토 대상이다.

작업중 검수:320/360/390/844 실제14장16대화에서 모자/머리 안전영역·인물 터치 무진행·이전/다음/넘기기 통과.390의 네 얼굴 기준 영역은 모두60.84px,844는64px다. 세로 본문337px, 가로454.09px이며 가로 인물 영역과 본문/버튼은 분리된다. 긴대사/NPC/text-only/서술32위치·scroll0/50/100% 및3회 회전의 겹침0, cold4request/4decode·12개폐 추가paint0, 준비/실패/timeout120회 target repaint0을 확인했다. [대사](evidence/rest-working.json), [본문](evidence/reading-working.json), [공유 cache](evidence/consumers-working.json), [반복draw](evidence/repaint-working.json). rawHEAD40900188+미커밋 source/build 실행이며 최종 통합 실행과 구분한다.

모닥불4열CSS는 보존하되 표시순서=행동순서 및 길게눌러 드래그는 별도 담당 작업이다. 이 작업은 카드 로직/고정순서를 수정하지 않는다. 구 보고서의 ‘카드순서와 행동순서는 별개’는 당시 구현 설명이며 최신 사용자 요구로 대체됐다. e1e4b9aa Pages39878187459 success2026-10-23T00:29:18Z/공개game.7d28f8236e93eef3.js를 부모 확인 사실로 보존했다. 이후 카메라 master d1963a0b 통합/검사 결과는 다음 기록에서 확정하며 아직 성공발행으로 등록하지 않는다.

Chromium headless viewport/touch 모사이며 실기기/Safari/FPS 검사가 아니다. 새 이미지 생성·배경 제거·원고/스테이지/전투·묵종/부착혼40%조건 변경은 없다. master/Pages는 부모 담당이다.
