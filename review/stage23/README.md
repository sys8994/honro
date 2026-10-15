# Stage 23 검수 후보 — 사라진 짐

기준: d7c1f8457dd33decda5481c7c3b57d8505f6f157. `review/stage23-rebuild` 전용이며 master/Pages 승인본이 아닙니다.

## 바뀐 모습

다층 사각 석축을 뒤쪽 흙비탈/암면과 낮은 창고 기단으로 정리했습니다. 화물 하강면은 두 운반 레일과 횡목, 비탈에 박힌 삼각 받침으로 구분합니다. 짐꾼 옆 계량대, 동쪽 낮은 선별대와 지게, 상부 권양 구조가 운송 장소를 설명합니다. 뒤 풍경의 외곽선은 제거하고 실제 보행면/몸체 외곽은 유지했습니다.

`terrains`, `units`, `initialState`, `objectives`, `markers`, 환경과 기존 이야기 장식은 기준과 정확히 같습니다. 40체/정예10, 유한 증원4·5·5, 낮은 호송로와 상부 엄호로, 화물 이동/카메라/반응은 변경하지 않습니다. `dispatch-bundle`은 살아 있는 짐꾼 대상이며 carrier-start는 자동 evidence입니다. 기존 저장을 이 미술로 이관하지 않습니다.

## 화면 종류

`before/after-1440-*`, `before/after-390-*`: 실제 Chromium의 생성 HONRO.html, 같은 현재 목표/배우 상태에서 미술만 기준/후보로 바꾼 비교. 장 진입은 격리된 테스트 프로필, 카메라는 검수 위치로 설정했습니다. 정상 플레이 완주 캡처가 아닙니다. `overview`는 전장 전체를 보여주는 검수 줌, 나머지는 일반 크기입니다. `browser.json`은 PC/모바일 App.continue에서 직렬화 전투 완전 동일 확인을 포함합니다.

## 검증과 차단

- `node tests/stage23-refinement.mjs`: 게임플레이 모든 필드, 다른29장, 이야기 장식 보존 및 overlay 재적용 동일 통과.
- `python tests/stage23-refinement-browser.py`: PC/모바일 실제 게임 캡처와 정확한 Continue 통과.
- 정상 자원 native 입력 검사는 최신 살아 있는 짐꾼 위치를 따라가도록 오래된 시험 정책만 수정했습니다. 이전 검사는 옛 장부석1080에 머물렀습니다. 수정된 검사에서 묶음 해제→자동 호송 시작→실제 전투가 진행됩니다. 현재 완주 증거는 아직 없습니다.
- 기존 old-save: waiting/midway/paid/old12/old18/old30 통과. death-retry reward ledger 동일성 실패는 기준 d7c1f84 캠페인을 재주입해도 재현했습니다.
- `npm run verify`: release guard/build/title까지 진행, quest-space-reference-repair의 역사 JSON exact-after 해시에서 실패. 후보 미술의 새 이력 핀은 아직 통합하지 않았습니다.
- 기존 cargo-sweep/bridge-seams는 오래된 author와 현재 marker/hash 계약의 차이에서 중단. route-seam/런타임/tactics도 실패했으며 통과로 보고하지 않습니다. 범위 밖 기존 검사 전체를 수정하지 않았습니다.
- 공식 자료: 국립해양유산연구소 https://www.seamuse.go.kr/research/jounchang_research 의 조운창/창고/운송 설명 및 사진 링크를 확보했습니다. 사진 `https://www.seamuse.go.kr/images/nrimch/kr/page/img_jounchang01.jpg`의 실제 픽셀은 proxy403/웹 반환 불가로 열람하지 못했습니다. 공식 사진을 보고 고증 완료했다고 주장하지 않습니다.
- 정상 브라우저 완주, 모든 군집/파동 실효성 및 전체 gate 완료 전입니다. 이 후보는 미술/구현 검토용이며 전체 승인 준비 완료가 아닙니다.

독립 검수: Stage28 담당이 전후 PC/모바일 픽셀을 열어 운반 레일의 공중 주춧돌을 지적했고, 지면에 박힌 삼각 받침으로 수정했습니다. 실제 최종 게임 PNG를 root가 다시 열어 계량/선별 공간 및 모바일 크롭을 확인했습니다.

### 후속 관측
현재 지형으로 별도 보행 검사를 실행했습니다. 공중 등불귀를 지상 접지 검사에서 제외한 뒤 NPC stored/settled 호송 전 구간, 설오 기본보행의 필수4경로와 서쪽 상부 왕복을 통과했습니다. stored D-E-return은 화물 왼쪽4565에서 기본 자동점프 정책이 시간초과했습니다. 보행/점프 조작의 실패를 숨기거나 지형을 바꾸지 않았습니다. 세부 log와 geometry.json을 포함합니다. 정상 자원 Native 관측은 normal-input-summary/observation.json에 해당 시점만 보존하며, 전투 지속/미완주입니다. 이 관측은 마지막 작은 미술 추가 이전의 동일한 지형·규칙에서 시작했으므로 최종 미술 완주 증거로 쓰지 않습니다.
