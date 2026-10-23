# 초상화 얼굴 정렬 · 돌출형 대사창 · 모바일 모닥불

부모가 전달한 사용자 승인(Hades 좌측 돌출 반신 + Pyre의 넓은 본문)을 적용했다. 원본/배포 초상화 이미지는 변경하지 않았다. 휘겸 얼굴 crop은 별도 소스 `893b2f003db8ce7d5f758ffaaaaba3faa78c9c00`, 새 대사창과 모바일 카드 배치는 `e41735fb` 단위다. 최종 실행/공통 빌드 **`3719d8117fb197d7eaa3570967f17898f92b1c74`**는 최신 master **`e1e4b9aaa7e1d6013c4eb1e9c9245dbca2edb435`**의 행동순서 기능까지 보존한다. 이후 문서·검사 selector만 정리했으며 생산 소스/생성물은 같다. manifest SHA256 **`3e6cbb59891cebe5092d613fe799db3f31b3a238d409d6c101508ce346e3acae`**, entry **`game.de2411508cacb176.js`**, 직접 Playtest **`game.71e4f69d3265b5ad.html`**. [정확한 보존](evidence/preservation.json) · [build](evidence/build.txt).

## 실제 화면

- [14장 휘겸 휴식 대사 세로 전후](evidence/390-rest14-hwigyeom-before-after.jpg), [가로 전후](evidence/844-rest14-hwigyeom-before-after.jpg), [네 인물 세로 실제 대사](evidence/390-four-dialogue.jpg), [가로4인](evidence/844-four-dialogue.jpg). 왼쪽은 공개970b9647의 보존된 entry, 오른쪽은 새 빌드. 생산 원문/휴식 대화 흐름 그대로다.
- [320px 모닥불 전후](evidence/320-camp-before-after.jpg), [390px](evidence/390-camp-before-after.jpg), [가로](evidence/844-camp-before-after.jpg). 이전은 crop만 적용된893b2f00이며 새 화면은4열/사진 위·정보 아래다. 선택/미합류와 행동순서 로직은 별개다.
- 얼굴 crop만 비교: [모바일 허공터4인](evidence/mobile-training-cards-crop.jpg), [가로](evidence/landscape-training-cards-crop.jpg), [toolbar](evidence/mobile-toolbar-knight-crop.jpg), [가로 toolbar](evidence/landscape-toolbar-knight-crop.jpg), [요약](evidence/mobile-summary-knight-crop.jpg), [가로 요약](evidence/landscape-summary-knight-crop.jpg), [탭](evidence/mobile-camp-tabs-crop.jpg), [가로 탭](evidence/landscape-camp-tabs-crop.jpg). 이 자료는 새 창 구조와 구분한다.

## 경계

초상화를 대사 section의 앞 형제로 옮기고 같은 wrapper에서 애니메이션한다. 하단을 창 뒤에서 clip해 원본 직선 끝이 반투명 표면으로 비치지 않게 했다. 장소 행을 제거하고 이름/진행 번호를 한 행에 배치한다. 세로 본문은 전체 폭, 가로는 왼쪽 인물 여백을 둔다. 본문만 스크롤하는 기존 ResizeObserver와 투명 버튼 행을 유지한다. 프레임 루프·이미지 loader/cache·원고·장소/전투/순서 규칙은 바꾸지 않는다.

휘겸의 기존 전체 갓 bounds는 작은 icon/HUD에 유지하고, 공통 manifest의 bust 영역만 얼굴 중심으로 설정했다. 따라서 갓 바깥끝/상단 일부는 잘릴 수 있으며 눈/턱을 우선한다. 다른3명은 native 픽셀이 같다. 모닥불 모바일은CSS만4열로 바꿨다.

## 검수와 한계

crop 전후48표면에서 휘겸 bust10개만 변화, 다른3명과HUD exact·4request/4decode·눈/턱 안전영역을 확인했다. 새 레이아웃의 실제14장4인×4화면(320/360/390/844)16대화에서 뷰포트/얼굴 안전영역·인물 tap 무진행·이전/다음/넘기기를 확인했다. 긴 본문/등록NPC/text-only/서술32위치의 버튼 hit-test와 스크롤0/50/100% 겹침0, 열린 창3회 회전 및 투명 행을 확인했다. 카드4폭 선택/미합류 검사도 통과했다. [실제14장 작업중 실행](evidence/rest14-layout-working.json), [이전 실행](evidence/rest14-before.json), [crop 이전](evidence/crop-before.json), [crop 단위](evidence/crop-only.json), [카드 작업중 실행](evidence/camp-working.json). raw SHA는 실행 당시HEAD+미커밋 빌드를 뜻한다. 이 작업중 자료와 아래 최종 통합 실행을 구분한다.

Chromium headless touch/viewport 모사이며 물리 Android/Safari 검수가 아니다. 사용자 첨부1000047857.jpg의 정상Library materialize URL은 받았으나 다운로드가 proxy `Tunnel connection failed:403 Forbidden`으로 실패했다. 파일을 열거나 우회하지 않았고, 부모가 확인한 설명과 생산14장 화면을 기준으로 작업했다. master/Pages는 부모가 검토 후 반영한다.


최종3719d811에서3회 집중 검수 범위를 완료했다.

1. **표시/픽셀**:48개 실제 소비 표면을 다시 확인했다. 휘겸 bust10개만 native RGBA가 바뀌며 다른3명/HUD는 이전과 exact다. crop 단위에서는box 크기도 같았으나 승인된 새 창/모닥불 layout은 의도적으로 달라 `allSizesPreserved:false`다. [48표면](evidence/surfaces-final.json). 네 얼굴/눈/턱을 실제 사진으로 비교했고 휘겸의 큰 갓 바깥끝은 얼굴 가독성 우선으로 일부 crop됨을 확인했다.
2. **배치/입력/저장**:실제14장 휴식4인×320/360/390/844의16대화에서 상단클립/얼굴영역·번호위치·초상화 tap 무진행·이전/다음/넘기기 통과.390 세로 본문폭337px,844 가로593px이며 본문폭이 기존보다 줄지 않았다.32개 기본/긴본문/등록NPC/text-only/서술 표본의0/50/100% 스크롤과3회 살아있는 창 회전에서 글자-버튼 겹침0·투명행·활성버튼 hit-test 통과. [실제14장](evidence/rest14-final.json), [본문/버튼](evidence/reading-final.json), [가로 긴 문장](evidence/landscape-long-final.jpg), [인물없는 긴 문장](evidence/text-only-long-final.jpg). 모닥불320/360/390/844에서4열/사진위·정보아래·선택과 미합류 숨김 통과. [카드](evidence/camp-final.json), [전체 모닥불](evidence/camp-full-final.jpg).
3. **수명/반복**:cold 이미지 보류 때 vector flash0, 모든 소비경로4request/4decode/4entries,12회 열닫기 같은 canvas·추가paint/request/decode0, 강제 실패도12회 개폐 후 추가fallback/vectorBuild0. 준비/실패/8초timeout 후120회 draw 각각 target drawImage/clearRect0, resize는1회만 paint. [소비12항목](evidence/consumers-final.json), [120회3상태](evidence/repaint-final.json). 실제11장 주민 rescue 생산 경로는 fixture 선행조건/18턴/근접/위협진정/부착혼HP30%로 **대사만 분리 재현**했고, 실제actor vector pixels exact·4뷰 버튼 접근·열린 대사 저장/reload/Continue의 원문/index/배우 복원9항목 통과. 정상18턴 플레이를 주장하지 않는다. [주민 사진](evidence/resident-final.jpg), [저장 검사](evidence/npc-save-final.json). 이 전제 조작은 검사 입력이며 생산 퀘스트/HP조건을 수정하지 않았다.

별도 최종 종합에서 source syntax·native NPC identity·Game/embedded title/저장 분리·Workshop direct iframe·해시검사와 retention 검사가 통과했다. [identity](evidence/identity.txt), [Game/Workshop](evidence/web.txt), [retention](evidence/retention.txt). 추가 실제 사진에서 얼굴/목·하단가림·본문폭·단색 잔류 및 투명 행을 직접 확인했다. 비교 JPG는 실제 screenshots를 리사이즈 없이 나란히 놓은 자료다.

최신e1e4b9aa 대비 생산 변경은 **story-portraits.json / presentation.css / portraits.js / story.js**4곳뿐이다. 원본art·배포WebP·main/ui-bridge·행동순서 module/engine/store·맵/원고/스킬/공통 builder는 최신master와 byte-identical이다. 통합 충돌은 생성HTML/manifest, 동일befca 발행사실 문구와 BUG_LOG였고 canonical 발행기록·양쪽BUG_LOG를 보존해 공통 build했다. 정상발행17개 distinct graph의6019개 파일 hash를 확인했으며970/befca의 성공 발행을 유지했다. 새 UI 후보나e1행동순서를 임의로 성공발행으로 등록하지 않았다.

기존NPC probe가 대사가 끝나기 전에 다음목표trace가 존재한다고 가정해 처음에는null 접근/목표assert로 중단됐다. 현재는 생산 대사/UI·actor·save만 검증하도록 경계를 좁혀 통과했다. quest 진행을 고치거나 통과로 세지 않는다. 새 heading의 이름+번호 때문에 기존 story-framing probe의 이름 selector만 이름span으로 보정했고, 그 전체캠페인 검사는 실행하지 않았다. 전체30장·장별완주·실기기/Safari·FPS 성능 검사는 미실행이다. 원본 스샷 다운로드403 외 남은 작업 차단은 없다. master/Pages는 변경하지 않았다.
