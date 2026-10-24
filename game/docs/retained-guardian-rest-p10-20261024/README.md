# P1.0 현행 휴식터 장식의 독립

기준 master `9dcca54e1f5b371d72b636cf19f5b930bab4b429`. 소스 보존 커밋 `3cd4be377a8a619df54652ecf1e91381a9dc5975` 후 생성물/검사를 마무리했다. 제품 수정은 journey-art.js, shared/build.mjs, tools/environment/rest-backdrop-assets.mjs 세 파일뿐이다. 다른 P1/P2는 대기다.

## 제거와 보존

현행1–30장은 REST_STYLES로 sharedRest를 사용하지만10장 장식은 paintedRest10 전체 SVG를 만든 뒤 두 그룹만 regex로 추출했다. 이 때문에 전체 pilots manifest/53이미지가 공급됐다. 이제 retainedGuardianLandmark(uri)가 원래 순서인 thread→roots 두 그룹만 만든다. 좌표·크기·경로·색·opacity와 원래 filter 제거 결과를 그대로 유지한다. 새 미술/경로/필터를 만들지 않았다.

paintedRest1–10 함수10개와 옛1–10 fallback dispatch, HONRO_PAINTED_PILOTS 전체 주입을 제거했다. 해당 함수 블록57,365B와 dispatch983B가 빠졌고 새 helper/키 교체를 포함한 journey-art 파일 순감소는58,113B(113,426→55,313B)다. source 이미지 폴더와 tests는 일괄 삭제하지 않았다. 남은 pilotsglobal 소스 참조는 실행 목록 밖 painted-pilots-art.js이며 보존했다. 활성 JS/JSON에는 pilotsglobal 참조0이다. 옛 실행 fallback을 두지 않았으며 발행된 immutable 파일만 기존 보존 정책으로 보호한다.

현행 asset owner는 기존 REST_BACKDROPS 데이터의 별도 `landmarks.guardianRootSteps`다. rest-stage10/root-stairs.webp를 readFile로 직접 읽고 base64에 넣으며 sharp resize/reencode를 거치지 않는다. 기존 raster images/revision1은 정확히 동일하다. sharedRest 키는 해당 stage10 URI 준비 여부와 기존 revision을 읽는다. Canvas/입력·pan/zoom·waterfall·generic/P0.3b 코드는 변경하지 않았다.

원본 root: **245,372B**, SHA256 `ae7a809006f010a43159367354212ec98b40afd8b717282108a546f9923a5c29`. Native data URI를 decode한 bytes와 web `web/graphics/honro_rest_backdrops-landmarks-guardianRootSteps.ae7a809006f010a4.webp` 모두 원본과 정확히 같다.

## 출력과 입력 확인

- `node tests/rest-shared-vector.mjs`: 현행30장 mapping/마크업·참조/ID·그대로인 fire/water hook·장식 준비 시 cache 갱신 통과. 세계 플레이순회가 아니다.
- `node tests/retained-guardian-rest.mjs`:6묶음 통과. 기존 backdrop revision/images exact, raw root bytes exact, **30장 전체 native data-URI SVG 문자열 exact**,10장 두 그룹 thread→roots exact/filter 없음, generic0/31/999/unknown exact. **30장 web SVG도 immutable 전체 이미지 SHA로 URL을 정규화하면 exact**다. 예전 구현은 Git 비교 입력으로만 읽으며 실행 fallback이 아니다.
- `python tools/testing/retained-rest-browser.py`: 실제 로컬 Chromium1280×900/390×844에서10장 그림/외부 root 이미지 완료와 live 캡처, wheel zoom·drag pan·시점 복귀 후 모닥불 진입/휴식터 왕복 통과. 두 그룹의 실제 DOM도 이미지 SHA 정규화 후 동일하며 pageerror/App.lastError 없음. 원래 App frame은 계속 실행했다.
- Native cleared9/rest10 fixture는 실제 일반 startup에서 rest9로 선택됐다. 제품 진행 코드를 고치지 않고 기존 검수 모드의 debug rest10 선택 상태로 준비해 같은 장·카메라를 비교했다. 처음에는 zoom/pan 상태의 모닥불이 고정 nav에 가려졌으므로 기존 시점 복귀 UI로 돌린 뒤 실제 탭했다. 검사 준비/입력 경로 조정이며 새 진행 규칙이나 입력 수리가 아니다.
- `node tests/optional-far-svg.mjs`: P0.3b 선택 SVG1500ms/실패 dedup·늦은 generic cache·현재 rest 관련5묶음을 유지했다. 기준 비교용 pilots는 보존된 Git 그래프에서만 읽고 current context는 새 owner를 사용한다. 전체 SVG browser7묶음/전장/스킬 순회는 반복하지 않았다.
- `npm run build`, `node tests/web-split.mjs` 통과. 기존 pure byte/hash/source preservation 감사로 공개42개 그래프836파일과 기존 메타데이터를 보호했다. source asset/map/engine/CSS/전투 데이터는 바뀌지 않았다.

## 소스·활성 graph·초기 HTTP의 구분

| 측정 | 전 | 후 | 감소 |
| --- | ---: | ---: | ---: |
| journey-art 소스 bytes | 113,426 | 55,313 | 58,113 |
| 활성 hash files | 408 | 354 | 54 |
| 활성 전체 bytes | 56,415,421 | 34,602,802 | 21,812,619 |
| cold title HTTP 응답 수 | 104 | 102 | 2 |
| cold title HTTP response body bytes | 10,343,687 | 10,280,724 | 62,963 |

초기 HTTP 차이는 pilots JSON/module8,224B와 compiled journey 포함 모듈54,683B·bootstrap226B 감소, 새 owner metadata/wrapper170B 증가를 합한62,963B다. 기존53개 pilots 이미지 출력은 cold title에서 요청되지 않았고 새 root도 휴식터10에서만 요청됐다. 따라서 활성 graph의 약21.8MB 감소를 초기 전송 절감으로 말하지 않는다.

수치는 새 컨텍스트·같은 로컬 비압축 HTTP의 ready+500ms Content-Length 합계다. Blob worker 스크립트 응답은 네트워크가 아니므로 제외했고 최초 포함 관측은 별도 including-blob JSON으로 보존했다. 압축된 공개 전송·실기기/FPS/기동 시간·메모리 성능을 측정한 것은 아니다. 현재30장 source markup 동치와 관련 UI만 확인했으며 정상 캠페인 전체 도달/미술 재승인도 주장하지 않는다.

## 발행 보존·산출물

부모 확인 P0.3b 발행 source9dcca54e, [Pages40061152181](https://github.com/sys8994/honro/actions/runs/40061152181), success2026-10-24T04:10:43Z를 기존 도구로 등록했다. 부모 공개 entry/title/기존 이어가기 버튼 확인을 계획표에 반영했다. 최근7일/최소2개·graph hash dedup은 그대로이며 이번 후보는 발행으로 등록하지 않았다. 이전 Workshop21장 실패는 반복/수리하지 않았다.

최종 entry `web/entries/game.9675f9baa1a8dba7.js`, manifest SHA256 `71cf5fb86d180677a83cd9aab2413eed524fe961e2dd4424b84f6ee608bed1b7`. 자동 PNG/JPG/JSON/log는 Git 제외 `_local/reports/retained-rest-p10/`에 있다. 실제 desktop/mobile 원본 캡처는 before/after-stage10-1280.jpg와 before/after-stage10-390.jpg 및 pan JPG다. 사용자 저장은 접근/삭제하지 않았으며 master/Pages는 부모 담당이다.
