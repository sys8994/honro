# 초상화 32종 연결

부모가 제작·검수해 `84487786677e9f3b979f52d21ba410d0d53fec34`에 보존한 PNG32종을 연결했다. 기준은 `e975a63646af0e55f1a5c2edc01a5cca22cbe8c9`. 주연20종·NPC12종이며 휘겸 염려는 갓 여백을 확보한 concern-v2다. 새 그림 생성·그림 내용 수정·대사/태그/rowId/진행/맵/저장 변경은 없다. 공개 master/Pages 반영과 공개 화면 검수는 부모 담당이며 아래는 로컬 기술 검수다.

기존 두 registry에 manifest의 identity/expression을 정확히 등록했다. 기존 인코더의 `--v2` 경로를 사용하며 768×1152, WebP Q94/alpha100/smartSubsample/effort6를 유지했다. 원본32장 PNG SHA와 프롬프트는 불변이다. 현행 NPC 게임톤 원본/승인 주연 원본의 참조 SHA도 검사한다. 표시용 얼굴 좌표와 crop top/maxHeight만 지정했으며 원본 픽셀은 수정하지 않았다. 기존13개 기본형과12개 변형의 config/런타임 이미지 바이트는 기준과 같다.

PNG 합계60,714,071B, WebP합계5,550,148B다. 배포 파생본 RGB는 손실 인코딩이며 원본 픽셀 동일을 주장하지 않는다. alpha는 기존768 resize 결과와 exact다. 생성물·전체 활성 그래프 크기와 첫 화면 실제 이미지 요청은 서로 다른 수치다. 활성354→386파일, 34,604,849→40,184,609B. 제목에서 portrait 요청0이며32장을 선로드하지 않는다. 기존 캐시/observer/prefetch/예산/오류 경로의 제품 코드는 변경하지 않았다.

현재770행 중688행이 태그 대상,82행 제외다. 고정행 ready485→672, pending202→15, 동적 맥락1행이다. 이번32조합이187행을 추가로 커버한다. 남은5항목은 동생의 혼/base2행, 언니의 혼/base2행, 종 안의 혼/base1행, 이름 없는 혼/base2행, 서술/미지정8행이다. 서술을 새 인물 이미지로 채우지 않았다. 기존 편집 감사42개는 기준과 exact이며 이번 범위 밖이다. 옛173행/32조합 또는769행/41개 수치를 현재 수요로 재사용하지 않는다.

native `node tests/portrait-variants32.mjs`, 신규32종 실제 mount, 별도 새 컨텍스트의 `--v2 --consumers-only`, 기존12종 `--mount-audit`, `npm run build`, `node tests/web-split.mjs`가 통과했다. 최초 통합 브라우저 실행은32종 mount를 마친 뒤 이전 장 fixture의 분할 진행/선택 로딩 상태 때문에 허공터 진입에서 멈췄다. 제품 코드를 바꾸지 않고 소비자 fixture를 새 컨텍스트/정식 선택 로딩으로 분리해 확인했다. 최종 검사는32종 mount와 소비자 검사가 별도 실행된 결과다. native 검사는 source/참조/기존 항목/alpha/대사 불변을 검사하고 실제 브라우저 mount와 구분한다. 브라우저는 새 저장 컨텍스트·현재 production App/rAF를 사용하고 원문 행과 장을 준비한다. 필요한 경우 표시 검사용으로만 fixture expression을 지정하며 제품 대본은 바꾸지 않는다. 이미지 readiness는 실제 mount/onload로 확인하며 검사 draw로 로딩을 강제하지 않는다. 반복 draw120회의 추가 request/decode/paint/clear0과 decoded byte 예산을 확인한다. 보호 bitmap 통계는 수명주기에서 달라질 수 있어 총 통계 객체의 동일성을 요구하지 않는다.

[브라우저 mount 근거](mount-audit.json) · [native 수요/보존](native.json) · [그래프 보존](graph.json). 기존49개 발행과 기준 활성 파일의 고유878개를 SHA/길이로 보존했고 후보를 성공 발행으로 등록하지 않았다. 이번 연결의 entry는 `game.56ce46dfdfbd8b0c.js`다. 전체30장/스킬/실기기/공개 Pages 플레이 검수는 하지 않았다.

모닥불5개/허공터4개 기본형이 ready이며 허공터5회 재열기에서 노드와request/decode/paint 수가 유지됐다. 실제 허공터 영웅 선택/적용 버튼과 유닛정보 초상 확대를 확인했다. 최대 decodedRgbaBytes는16,121,856으로 모바일16MiB 이내다.

대표 화면은 `screenshots/`의390×844 세로·844×390 가로다. 실제 원문/장면을 테스트 도구로 준비한 로컬 Chromium 캡처이며 정상 캠페인 연속 플레이나 실제 Android 검증으로 표현하지 않는다. 휘겸의 갓 전체, 설오의 겨누는 손·활, 담허의 펼친 손, 소단의 듣는 손, NPC 대화와 기존 모닥불/허공터 초상 소비자를 확인한다.
