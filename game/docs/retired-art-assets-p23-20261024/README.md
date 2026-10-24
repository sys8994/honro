# P2.3 퇴역 이미지 지형 데이터·도구 정리 — 2026-10-24

기준 master는 `c8b6a3606353269e40188229227436d3d70fd389`다. 부모가 확정한 **112파일·101,954,246B**의 현재 blob이 조사값과 모두 같음을 확인한 뒤 그 목록만 삭제했다. [inventory.json](inventory.json)에 삭제 경로/blob/bytes와 고정 역사 commit5154의 열 수 있는 원본 링크, 명시적 보존 예외10개의 blob을 기록했다. 과거 문서의 backtick 경로·도구는 이 역사 자료를 가리킨다. 실제 상대 Markdown 링크로 삭제 대상에 연결된 문서는 찾지 못했고, 기존 source-preservation.json/hash 증거는 재작성하지 않았다.

rest-stage10 전체·root 원본/가공본/도구, 예외 원경과 현재 입력, 나머지 location-far/source 및 campaign-far, 캐릭터/초상화/승인 variation, fixtures/migration, 보호된 web 파일은 보존했다. 승인 에셋을 재인코딩하거나 덮어쓰지 않았다. 런타임/맵/서사/수치/미술은 변경하지 않았다.

역사 검사의 pilots manifest와 이미지 binary, old web JSON은 고정 기준 `9dcca54e1f5b371d72b636cf19f5b930bab4b429`의 Git blob에서 읽는다. 상대 경로는 posix.normalize하며 binary는 Buffer→base64로 처리한다. 현재 rest/root 데이터는 현재 파일에서 읽는다. 기존 모든 assertion은 유지했다.

혼합 제작 도구3개에는 지정된 원경6개 처리만 남겼다. resize/thumbnail/LANCZOS/색상mode/quality/method를 유지했다. `--output-dir` 옵션은 검증 시 임시 출력용이며 기본 출력 경로는 같다. atlas/near/rest/옛 manifest와 geometry 처리는 제거했다. stage21-eupseong-art.mjs는 낡은 runtime 설명 주석만 수정했다.

검사:

- `python3 tests/retired-art-assets-p23.py`: 삭제112개 Git blob/bytes, 보존 예외10개 blob, 삭제 집합 exact, 나머지 asset/game source·입력 불변 확인. 남은 입력으로 도구를 임시 폴더에서 실행했고 출력6개 모두 승인 파일과 byte-exact였다(Pillow12.3.0). 현재 승인 파일에는 쓰지 않았다.
- `node tests/retained-guardian-rest.mjs`: 삭제 전/후 모두 통과. 30장 native/full SVG 및 image-SHA 정규화 web SVG exact, generic0/unknown/custom, thread→roots/filter 없음, root245,372B/SHA256 `ae7a809006f010a43159367354212ec98b40afd8b717282108a546f9923a5c29`/URI 확인. 이는 markup 비교이며 30장 플레이 순회가 아니다.
- `npm run build`, `node tests/web-split.mjs`, `node tests/retired-art-assets-web-p23.mjs`: 통과. **manifest.files 경로/bytes/SHA 전체, common/entry와 HTML3개가 기준과 exact**다. 활성354파일/34,594,315B이며 현재 배포 크기·로딩 절감은 없다. manifest에는 P2.2의 실제 성공 발행만 등록했다. 실제 공개47그래프/중복 제외855파일 SHA·bytes·기존 metadata를 보존했다. 새 후보는 발행으로 등록하지 않았다.
- 실제 로컬 Chromium의 fresh storage context에서 Game 제목→휴식터(도입 skip), Workshop API/프로젝트 UI 진입: JS/HTTP 오류0. 기본 진입 범위이며 전체 플레이/미술 검수/공개 배포/실기기 검증은 아니다.

기존 P2.2의 shared/assets 불변 assertion은 당시 단위의 범위 검사다. 이번 명시 삭제에서는 그 검사를 거짓으로 통과시키거나 완화하지 않았다. 이번 단위는 위 삭제 집합·나머지 자산 불변·활성 graph exact 계약으로 검사했다. 전체 verify/무관 검사는 실행하지 않았다.

entry는 그대로 `web/entries/game.313759e6ffc706a1.js`, Workshop은 `web/entries/workshop.28ac6e40301490fd.js`다. 발행 기록이 추가된 manifest SHA256은 `f12cbdeff5db2068752d3ca264fe198e3654e7bcf59505132be0a8f7d0d19b65`다.

원시 결과/캡처는 `_local/reports/retired-art-assets-p23/`와 기존 rest 검사 경로에 있다. README/ARCHITECTURE는 바꾸지 않았다. master/Pages 반영은 부모 담당이다.
