# 대사 원칙 v2 · 부모 원고 통합 — 2026-10-22

부모 검토용 `integration/narrative-voice-v2-release-20261022`다. master/Pages는 변경하지 않았다. 초상화·13장 미술 작업은 포함하지 않았다.

## 정확한 코드·생성물

- 기준 master: `934fcabd74767d662aee3830585ba807234934cc`.
- 검토 입력: `caaa25e204a44a122cbf9e3d565cdfb9ab8cc48f`. 부모 원고/연결은 ce9028d1, 실제 10장 안전 퇴장 보완은 caaa25e2 기록을 따른다.
- 최종 코드·정상 재빌드 HTML/web/도감·대표 사진: **`2633e2b45fc48ed105d4ed8ae34263935d5cd0f7`**. 검사는 merge 진행 중 통합 작업 트리에서 수행했고 검증된 바이트를 이 커밋에 저장했다. 이후 변경은 문서뿐이다.
- `narrative-current.json` SHA256: `2a6e97153c37b3f6e6be5e10417b8344ec3899d280ec390d5082e80464bed2bd`. 입력 브랜치와 byte 단위로 같다. 새 대사를 창작하거나 다시 쓰지 않았다.
- `web/manifest.json` SHA256: `035f6cd7900aefdfab313931c5b12d7c9f7091a410756cfccbb05c1f3d064bdf`.
- Game HTML SHA256: `0047365b7706a9be3aead39244df8a2f92699a8b7e2824001d67ea921007e56c`.
- Workshop HTML SHA256: `40ff9ef9d6f516d3c99028e459c91b65065d1416d3f699705fe5b4f8b985c257`.

현재 원고는 narrative-current 단일 원천, 옛 저장은 narrative-compat-v1/V0/split-v1/waterworks-v2의 명시 경계다. 제거한 current contentFor 래퍼 및 act2-drama/act2-plan 모듈은 파일/공통 빌드 목록에 재유입되지 않았다. 필요한 Act2Plan.forStage API와 옛 resolver/저장 snapshot은 보존했다. 생성물은 이전 결과를 채택하지 않고 공통 build와 도감 빌더로 다시 생성했다.

## 통과한 검사

- build, 타입 검사, web-split: 356개 웹 자산 hash/byte, 30장·851 library 재조립, native/embedded 진입·저장 보호·Workshop 문서 연결.
- narrative-catalogue-parity: 30개 비서사 기계 계약·기술 guide/goal 불변, 40개 V0/revision1/stored/split-v1/waterworks-v2 선택과 원본 저장 불변.
- narrative-editorial-v2: 부모 원고 190개 장면/값 그룹, 30장 effective snapshot·도입·요약, 선택 대화·문서/이름 공개/목격 조건, 6개 A/B 경로, Workshop 원문 경계.
- narrative-integration-boundaries, narrative-catalogue-save: Act2 wave API/미개봉 옛 staging, 현행/구 저장의 원문·cursor·HP/MP·쿨다운·quest marker와 prologue v7 경계.
- **narrative-row-metadata**: 30장 111개 신규 진입 행의 row ID, 문구를 빈 fixture로 바꿔도 연출/카메라 결정 동일, 바인딩 전후 전투·퀘스트·자원 불변. 생산 원고는 변경하지 않는다.
- act3-void-runtime 및 stage-clear-report-data/app/carry: 공허 상태·입력/저장/안전 복귀, 정산 데이터/실제 App lifecycle·이월 경계.
- 실제 Chromium narrative-voice-browser: 390×844/1280×900의 18개 원고/메타데이터/UI 확인, 27장 5컷/긴 넷째 줄과 배우 영역 겹침0·skip 뒤 3줄 복귀. 페이지 오류0.
- 실제 **10장 safe outro 390×844**: 정상 finale 동맹 전환 후 여섯 방어 라운드 완료 상태만 fixture로 설정, 실제 supported exit→withdrawal→frame→won/worldOutro2. 지형 위 네 명·부모 원고16줄·안전 카메라 확인, 마지막 cursor15 Continue/전투 동결, ending→rest→실제 report 버튼과 정산1회 보존. 앞선 여섯 라운드를 플레이한 검사가 아니다.
- act-ending-replay-browser `--mode completion`: 10/20/30 완료·반복 fixture에서 엔딩 lifecycle·보고서/방문·프로필/저장 경계 통과.

명령은 위 이름의 `node tests/*.mjs`, `npm --prefix game run typecheck`, `npm run build`, `node tools/character-catalog/build.mjs`, `python tests/narrative-safe-outro-browser.py`, `python tests/narrative-voice-browser.py`, `python tests/act-ending-replay-browser.py --mode completion --out _local/reports/narrative-voice-v2-integration/act-ending`, `node tests/web-split.mjs`다. 상세 로그·JSON은 `_local/reports/narrative-voice-v2-integration/`에 보관한다. 부모 입력 브랜치의 기존 보고서/증거와 이번 실행을 구분한다.

## 남은 검사 실패와 시작 전송량 증가

**전체 검사가 모두 통과한 것은 아니다.** 기존 `tests/story-direction.mjs`는 첫 assertion에서 `1/entry/설오/접힌 쪽지`를 찾으며 실패했다. 이 규칙은 이제 compat에 보존된 옛 문구이고 부모의 새 1장 원문에는 없다. 해당 파일은 삭제하거나 억지로 통과시키지 않았으며 뒤의 case는 이 실행에서 미실행이다. 통합 production 소스와 해당 검사 파일은 검토 입력 caaa25e2 그대로다. 위 신규 row metadata 검사는 현재 원고의 연출·카메라/퀘스트 분리를 별도로 확인했다.

캐시를 끈 새 Chromium context, 같은 로컬 **비압축 HTTP**, 타이틀 ready+400ms·사용자 입력 전의 시작 자료를 기준 master와 비교했다. 오디오/이미지는 아래 JS/JSON 합계에서 제외한다.

| 시작 자료 | master934 | 통합 |
|---|---:|---:|
| JS/JSON 요청 | 73 | 78 |
| encoded body bytes | 4,185,192 | 4,946,860 |
| transfer bytes | 4,207,092 | 4,970,260 |

**동일 URL 중복 요청은 0개지만 초기 body 전송량은 +761,668B(+18.2%), 요청은 +5개 늘었다.** 새 필수 JSON은 current 194,823B·compat 709,143B·stage-contracts 30,578B이며 각각 한 번 요청한다. 세 자료는 초기 순차 데이터 barrier에서 await되고, 현재 계약과 legacy author/resolver가 사용한다. 따라서 이 refactor가 초기 필수 로딩을 줄였다고 주장하지 않는다. 승인된 호환 경계를 임의 삭제하거나 새로운 점진 로딩 설계를 추가하지 않고 이 증가를 부모의 발행 판단에 명시한다. 실제 Pages 압축 전송량/지연·동적 FPS를 측정한 결과는 아니다. 정확한 요청 목록은 master934-network.json/integrated-network.json이다.

## 보존 항목과 대표 사진

renderer/party-rig/portraits/combat/HUD CSS·11장 승인 campaign/재질·BGM 7곡/채널·막 엔딩/보고서 소스는 기준 master와 byte 단위 일치한다. main.js의 유일한 변경은 완료 요약의 catalogue 호출이며 HUD 무변화 캐시·paused dirty는 그대로다. occlusion 개선도 renderer 동일 해시로 보존했다.

[2장 새 원고 · 좁은 화면](https://github.com/sys8994/honro/blob/2633e2b45fc48ed105d4ed8ae34263935d5cd0f7/review/narrative-voice-v2-release-20261022/stage2-name-390x844.jpg) · [10장 실제 안전 퇴장](https://github.com/sys8994/honro/blob/2633e2b45fc48ed105d4ed8ae34263935d5cd0f7/review/narrative-voice-v2-release-20261022/stage10-safe-outro-390x844.jpg) · [27장 공허](https://github.com/sys8994/honro/blob/2633e2b45fc48ed105d4ed8ae34263935d5cd0f7/review/narrative-voice-v2-release-20261022/stage27-void-390x844.jpg). 이번 통합으로 다시 촬영한 사진이며 10장/27장 JPG를 직접 열어 확인했다.

전체 정상 전투 완주·모든 대사 화면 순회·실기기 성능·Pages 검수는 수행하지 않았다. master 반영과 Pages 확인은 부모가 별도로 수행한다.
