# 360/390폭 최종 HUD 후속 — 2026-10-24

최종 병합 후보 `8037a13efeaaa6ec6149b573cb1f624895c45812`, entry `game.64a30efb63ac06fc.js`. 부모의 말줄임 피드백에 따라22장 문구만 간결하게 했다. 실제 보유자 간격 부족은 `소단·설오를 모으세요`, 준비 후 진행은 `수비 1/2`다. 헤더 DOM/CSS·지형·판정·턴수·SFX/VFX는 바꾸지 않았다.

새 네 장은 로컬 Chromium touch의 정상 App.frame/원래 Scene.render 60프레임 이후 캡처다. round11·기록 보유자·위치·카메라는 준비 저장 상태이며, defense-1의1/2도 초기 fixture다. 아래 앞선 실제 입력 클리어/Continue/23장 증거를 재사용하며 이번 짧은 캡처가 새로 두 적 턴을 획득했다는 뜻은 아니다. 원본 사용자 세이브·실기기·공개 검증과 구분한다.

Range 실제 글자 폭을 clientWidth와 비교했고 scrollWidth=clientWidth, 페이지/앱 오류0이며 네 장의 실제 픽셀을 확인했다. 공통 ellipsis CSS는 그대로지만 아래 문구는 말줄임되지 않는다.

| 새 캡처 | 문구 | 실제 글자 폭 | 가용 폭 |
| --- | --- | ---: | ---: |
| [compact-360-blocked.jpg](compact-360-blocked.jpg) | 소단·설오를 모으세요 | 83.98px | 98px |
| [compact-360-defense-1.jpg](compact-360-defense-1.jpg) | 수비 1/2 | 32.72px | 98px |
| [compact-390-blocked.jpg](compact-390-blocked.jpg) | 소단·설오를 모으세요 | 83.98px | 122px |
| [compact-390-defense-1.jpg](compact-390-defense-1.jpg) | 수비 1/2 | 32.72px | 122px |

최종 build/native/web-split와 기준788 활성414파일·기존35개 공개 그래프762파일의 bytes/hash 보존 검사가 통과했다. master/Pages는 부모 담당이다. 자동 세부 로그는 `_local/reports/stage22-hold-20261024/hud-width.json`에 유지한다.

| 새 파일 | bytes | SHA256 |
| --- | ---: | --- |
| compact-360-blocked.jpg | 45734 | 67a2895ec0e19e6625bd697a9b4fd02fae2a54068c03376236a1df6397bedb80 |
| compact-360-defense-1.jpg | 45020 | 6e9d6692d5f57558a7e4d18ac9193176746067905915c8aa419f42a573f0551d |
| compact-390-blocked.jpg | 48509 | fc7cfe765c15d93cb226036bf565ce5c3ae433b8d934bac92a85eff4d7966620 |
| compact-390-defense-1.jpg | 47550 | 9380550923a82f50ed5ec3ce51dc1d596376edd5df5409dcb7373615aa0be7f4 |

---

# 22장 기록 대조: 실제 브라우저 전후와23장 진입

부모 요청에 따른 선별7장이다. 자동 로그/나머지는 `_local`에 유지한다. 앞선 클리어 검증 후보32d92f6b91fc55562056258e155585864fec5b19, build game.a0095a2a051df30e.js. 기준 master78818166의 build game.43758b5ea28cc2fd.js와 비교했다. 실제 로컬 Chromium390×844 touch의 정상 App.frame/원래 Scene.render를 계속 실행했다. 초기11턴 checkpoint/실제 기록 수령/앞선 구역 정리/접근 위치/카메라만 준비했으며 이후 실제 키보드 이동·동행 선택·방어·읽기·autosave Continue를 썼다. 원본 사용자 세이브·실기기·공개 배포 증거가 아니다.

- before-blocked.jpg: 두 실제 기록 보유자가 원 안에 있지만 서로 가까이 있지 않다. 기존 HUD는2턴만 안내한다. 실제 두 적 턴 종료 후에도 progress0,guarded=false,contested=false였다.
- fixed-blocked.jpg: 실제 소지 데이터의 소단/설오와 집계 대기/나란히 모으기를 보인다. 사용자 사진의 두 인물이 실제 보유자인지는 원본 세이브가 없어 미확인이다.
- fixed-records-together.jpg: 실제 이동 후 집계 중 상태와 실제 보유자다.
- fixed-one-enemy-end.jpg: 실제 유효1회 집계. autosave/reload/Continue에서 같은1회/증원ID2개를 보존했다.
- pending-two-counts-warning.jpg: 별도로 준비한 과거2회 완료/증원0 저장의11턴 Continue다. 유지 횟수 완료와 증원 대기/행동 종료 안내를 표시하며, 이후 실제 기존 입장/출구/클리어/23장까지 통과했다. 이2회는 준비한 저장값이며 새로 획득했다고 주장하지 않는다.
- fixed-clear-modal.jpg: 기본 경로에서 실제2회 획득과 기존 관창 출구 이동 후 클리어 모달이다. 하층8명과 층 밖 등불2명이 남아 있어도 원래 목표대로 완료된다.
- fixed-stage23.jpg: 클리어 모달→쉼터→실제 다음 장 버튼으로 들어간23장,4명 파티다.

조건·거리·높이·턴·유한 증원·지형·UI 스타일·신규 SFX/VFX를 바꾸지 않았다. 이름/대기/중단/진행과 실제 선행조건만 정확히 안내한다. [원인·조건·검사·범위](../README.md)를 함께 확인한다. 최종 생성물/웹 실행/762파일 보존 검사는 통과했고 master/Pages는 부모 담당이다.

사용자 Library1000047907.jpg(libfile_1d73e6742c508191bd4d09387e7d2642)는 지원 전송이 download failed로 종료돼 이 환경에 JPEG가 생기지 않았고 원본 픽셀을 직접 보지 못했다. 위 사진은 별도 실제 게임 재현이며 합성/이미지 편집은 하지 않았다.

| 파일 | bytes | SHA256 |
| --- | ---: | --- |
| before-blocked.jpg | 44732 | 5087e58fd024fc9b6e6998be5632e9af57307cc4bc0aef15586bd2c5add9b3ab |
| fixed-blocked.jpg | 44667 | 116c46b1ba0becec1df9b463da9120f6d3786dc9f66a71eff5931718f41e58d2 |
| fixed-records-together.jpg | 44057 | 3501aa9b674b235ff705df0bf9337b0c4e4db3056da4368458e57a54a52af24e |
| fixed-one-enemy-end.jpg | 37564 | a0111ecd4b4d24d5f32612cc7ec4806f50db14dc4139a5a134ce3042c2480113 |
| pending-two-counts-warning.jpg | 44208 | 0dd1da3119e9156e544cc8b05bed77489eeb7779cb5416205fe7693d93a42e78 |
| fixed-clear-modal.jpg | 42638 | 97f3fef9e54883466a35ed90296bc73dec6f653239fda8583d46353042e69525 |
| fixed-stage23.jpg | 35294 | 78deb781f1664b0e6a5851e9444ae2c0fe326d4401dec160d0eed637aac0df43 |
