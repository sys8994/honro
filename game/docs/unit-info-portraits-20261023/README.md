# 유닛 정보 초상화와 확대 보기

기준cf2bd158, 카드 독립 완료b3339899, 중간 소스 보존64f92eae. 최종 UI 빌드 진입점은 `game.252b9b6bdb98c295.js`다. master/Pages는 부모가 반영한다.

정보창 이름 옆60×72px 초상화와 원본 비율 확대 보기를 추가했다. protagonist의 기존 승인 identity와 NPC의 장/actor ID 바인딩을 사용한다. 실제11장 `resident-4`의 유닛명은 “동굴 주민”, 대사 등록명은 “주민”이므로 공통 NPC resolver의 `forUnit`이 기존 actor 바인딩을 재사용한다. 클래스만으로 주인공/주민을 대신 고르지 않는다. 없는 이미지는 버튼을 숨기고, 승인 이미지의 실패는 기존 중립/유한 재시도 정책을 사용한다. 새 이미지/벡터 폴백은 없다.

확대는 기존 모달을 사용하여 전투 입력을 막고, 별도 retained section/canvas를 재사용한다. full 프레이밍은 같은 decoded asset 전체를 왜곡 없이 그린다. 닫기/Escape/배경 클릭은 확대만 닫고 원래 정보창과 초점으로 돌아간다. 다른 모달/유닛/화면으로 이동할 때 기존 open/close의 작은 cleanup hook이 waiter와 viewer를 정리한다. 턴 배너가 확대보다 앞서지 않도록 해당 모달만130 레이어를 쓴다. 대사/소리/원본/스킬/게임 규칙은 불변이다.

## 확인

- `tools/testing/unit-info-portraits-browser.py`: 실제 전장 클릭으로 주인공4명/18장 종지기/11장 실제 동굴 주민/초상 없는 일반 적을 확인했다. 작은→확대→원복, HP/유닛/활성/투사체 exact, 닫기 버튼과 키보드/배경, 초점 복원, 임의 전투 입력 없음, 다른 유닛 전환/모달 cleanup, 기존 portraitExpression 선택이 통과했다.
- 종지기 HP880/880, 형100/기95/혼82를 보존한다. 최초 준비 뒤 같은 확대12회에서 request11→11, decode11→11, paint14→14, vector/fallback0→0, DOM/canvas 동일. decoded16,121,856바이트로 모바일16MiB 예산 이하다. 처음부터 모든 인물 이미지를 무기한 보유한다는 뜻은 아니다.
-390×844/844×390에서 작은 초상/닫기/수치 공간·확대 비율·안전한 닫기 영역을 실제 화면으로 확인했다. 소단/담허 등 기존 대사와 카드 프레이밍은 변경하지 않았다.
- build 및 web-split381개 통과, eater-ui-boundaries 통과. 기존 player-turn-order도 최종 소스에서 통과한다.
- 기존 `tests/character-info.mjs`는 앞4항목 통과 뒤 Tab의 p0/mage-test 기대에서 실패한다. 기준cf2의 unit-info 소스를 동일 harness에서 실행해 같은 위치/값의 실패를 확인했다. 신규 초상 기능이 없는 기존 fixture 문제로 분리하고 고치지 않았다.

처음 시도한 NPC1장 fixture에는 실제 npc-woodcutter 유닛이 없었고, 처음 고른 미제작 적은 숨은 부착혼이라 클릭할 수 없었다. 실제 존재하는11장 동굴 주민과 보이는 일반 적으로 바꾸어 검사를 마쳤다. 제품 규칙을 바꾸어 검사를 통과시키지 않았다.

자동 결과/사진은 AGENTS에 따라 Git 제외 `_local/reports/unit-info-portraits-20261023/`의 `browser.json`, `build.txt`, `web-split.txt`, `player-order-native.txt`, `eater-ui.txt`, `390-keeper-small.jpg`, `390-keeper-large.jpg`, `844-keeper-small.jpg`, `844-keeper-large.jpg`, `390-npc-large.jpg`다. 준비된 장 진입/카메라, 정지 frame에서 실제 클릭한 검사이며 정상 장 완주·실기기·공개 배포 증거는 아니다. 최종 P0 수비 표시 단위와 함께 기준cf2 및 기존 공개33개 그래프의 보존을 다시 확인한다.
