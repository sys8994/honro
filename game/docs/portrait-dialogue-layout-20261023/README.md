# 초상화 얼굴 정렬 · 돌출형 대사창 · 모바일 모닥불

부모가 전달한 사용자 승인(Hades 좌측 돌출 반신 + Pyre의 넓은 본문)을 적용했다. 원본/배포 초상화 이미지는 변경하지 않았다. 휘겸 얼굴 crop은 별도 소스 `893b2f003db8ce7d5f758ffaaaaba3faa78c9c00`, 새 대사창과 모바일 카드 배치는 그 다음 단위다. 최종 통합 SHA/검사 결과는 후속 검수 기록으로 확정한다.

## 실제 화면

- [14장 휘겸 휴식 대사 세로 전후](evidence/390-rest14-hwigyeom-before-after.jpg), [가로 전후](evidence/844-rest14-hwigyeom-before-after.jpg), [네 인물 실제 대사](evidence/390-four-dialogue.jpg). 왼쪽은 공개970b9647의 보존된 entry, 오른쪽은 새 빌드. 생산 원문/휴식 대화 흐름 그대로다.
- [320px 모닥불 전후](evidence/320-camp-before-after.jpg), [390px](evidence/390-camp-before-after.jpg), [가로](evidence/844-camp-before-after.jpg). 이전은 crop만 적용된893b2f00이며 새 화면은4열/사진 위·정보 아래다. 선택/미합류와 행동순서 로직은 별개다.
- 얼굴 crop만 비교: [모바일 허공터4인](evidence/mobile-training-cards-crop.jpg), [가로](evidence/landscape-training-cards-crop.jpg), [toolbar](evidence/mobile-toolbar-knight-crop.jpg), [가로 toolbar](evidence/landscape-toolbar-knight-crop.jpg), [요약](evidence/mobile-summary-knight-crop.jpg), [가로 요약](evidence/landscape-summary-knight-crop.jpg), [탭](evidence/mobile-camp-tabs-crop.jpg), [가로 탭](evidence/landscape-camp-tabs-crop.jpg). 이 자료는 새 창 구조와 구분한다.

## 경계

초상화를 대사 section의 앞 형제로 옮기고 같은 wrapper에서 애니메이션한다. 하단을 창 뒤에서 clip해 원본 직선 끝이 반투명 표면으로 비치지 않게 했다. 장소 행을 제거하고 이름/진행 번호를 한 행에 배치한다. 세로 본문은 전체 폭, 가로는 왼쪽 인물 여백을 둔다. 본문만 스크롤하는 기존 ResizeObserver와 투명 버튼 행을 유지한다. 프레임 루프·이미지 loader/cache·원고·장소/전투/순서 규칙은 바꾸지 않는다.

휘겸의 기존 전체 갓 bounds는 작은 icon/HUD에 유지하고, 공통 manifest의 bust 영역만 얼굴 중심으로 설정했다. 따라서 갓 바깥끝/상단 일부는 잘릴 수 있으며 눈/턱을 우선한다. 다른3명은 native 픽셀이 같다. 모닥불 모바일은CSS만4열로 바꿨다.

## 검수 진행 기록

crop 전후48표면에서 휘겸 bust10개만 변화, 다른3명과HUD exact·4request/4decode·눈/턱 안전영역을 확인했다. 새 레이아웃의 실제14장4인×4화면(320/360/390/844)16대화에서 뷰포트/얼굴 안전영역·인물 tap 무진행·이전/다음/넘기기를 확인했다. 긴 본문/등록NPC/text-only/서술32위치의 버튼 hit-test와 스크롤0/50/100% 겹침0, 열린 창3회 회전 및 투명 행을 확인했다. 카드4폭 선택/미합류 검사도 통과했다. [실제14장 작업중 실행](evidence/rest14-layout-working.json), [이전 실행](evidence/rest14-before.json), [crop 이전](evidence/crop-before.json), [crop 단위](evidence/crop-only.json), [카드 작업중 실행](evidence/camp-working.json). raw SHA는 실행 당시HEAD+미커밋 빌드를 뜻하며 후속 최종clean 실행과 구분한다.

Chromium headless touch/viewport 모사이며 물리 Android/Safari 검수가 아니다. 사용자 첨부1000047857.jpg의 정상Library materialize URL은 받았으나 다운로드가 proxy `Tunnel connection failed:403 Forbidden`으로 실패했다. 파일을 열거나 우회하지 않았고, 부모가 확인한 설명과 생산14장 화면을 기준으로 작업했다. master/Pages는 부모가 검토 후 반영한다.
