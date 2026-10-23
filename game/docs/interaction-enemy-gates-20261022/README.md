# 상호작용 주변 적 전멸 제약 제거

검토·배포 후보는 `fix/interaction-nearby-enemy-gates-20261022`. 코드+정상 생성물 커밋은 **54230a959f0f11cf4a1f5bad3497bc516cfcddd3**이다. 최신 master **970b9647a0ee01ed216bc32181ff5b1ee12c54e0**를 병합했다. master/Pages는 변경하지 않았으며 부모가 통합한다. 최종 문서 커밋은 이 실행 코드를 변경하지 않는다.

사용자는12장으로 표현했지만 부모가 실제 첨부 상단을 확인한 대상은 **13장 숨은 석문/R4/석문 빗장 열기**다. 자식 실행기는 첨부 원본을 열지 않았고 부모의 정확한 UI 설명과 현재 생산 화면으로 재현했다. 사진은 첨부 원본이 아닌 준비한 R4 저장 fixture의 실제 Chromium이다. 수정 전 동일 입력은 ‘주변 들림을 먼저 제압하세요’로 실패했다. 최종본은 문 너머 살아 있는 수레3개를 그대로 둔 채 열린다.

## 최종 수정 범위

- `act2.js`의360거리, `act3-objectives.js`의220거리 일반 적 존재 gate, 공통/옛11장 차단 wrapper·안내를 제거했다. 유한 휴식 물자도 적 존재만으로 막지 않는다.
- 저장된2막 단계의 읽기 전용 실행 뷰에서, 일반 clear/pacing-secure 연속 구간 뒤가 실제 interact/rescue/evidence인 경우만 제외한다. 직접 장소 접촉·담당 인물·선행 기계 단계는 요구한다. optional/명시 target/독립 전투·보스·호송·방어·이동 목표는 보존한다. `40bd2b8d`의 넓은 중간 필터는 최종본이 아니며 이 좁은 규칙으로 대체했다.
- 폐지한 처치 단계 뒤 자동 증거는 직전 실제 단계 완료와 **원래 증언/기록 위치·살아 있는 지정 인물 접근**을 함께 요구한다. 멀리서 구조 사실만 얻고 증언을 받는 새 경로를 만들지 않았다. 기존16장 hall→record 자동 전달과26장 기록실 현장 수거는 그대로다. 새 E 클릭을 추가하지 않는다.
- 거리·층·살아 있는 actor/대상·필요 역할·보상 중복 방지를 유지한다. 기존 snapshot/원고/배우 좌표/HP/처치 사실/XP를 교정하지 않는다. 옛 저장도 같은 runtime view로 적용하며 재시작이 필요하지 않다. 이미 열린 옛 JS는 원격 수정되지 않으므로 배포 후 새로고침하고 같은 저장을 Continue한다.

[1~30장 전수 목록·저장 경계·각 전멸 단계의 동선 근거](AUDIT.md), [사용자 판단이 남은 특정 부착혼 조건](EXCEPTIONS_PENDING.md)을 구분한다. 후보는11·13·14·16장6개 구조 대상의 연결된 혼 약화/분리이며, 일반 주변 적 gate가 아니다. **HP40%를 서사 필수로 승인받았다고 처리하지 않았다.** 명시적 독립 전투 목표도 새 서사 필수 승인으로 표현하지 않는다.

## 실제 확인과 한계

| 검사 | 실제 실행 범위와 결과 |
|---|---|
| 수정 전·후13장 | 동일 준비R4 fixture. production App/실제 E에서 열림·출구 목표·checkpoint1회·적/성장 보존 통과. 수레 접근은 실제 Engine walk/충돌로 준비. |
| 최종54230a95 실제 Chromium |390×844 터치,1180×757 KeyE. 닫힌 문 앞 입력→열림→저장→reload→Continue→진행 중 대화의 실제 넘기기→입력 재개 통과. 버튼 화면 안, JS오류/HTTP실패0. manifest SHA256 `896fef8cc99768c471a0801c4f37a48c9cf9ffc4ef68fa424a18d0822b35ad40`. |
| 세 집중 표본 |58236daa 빌드에서3장 장부/17장 버팀목/24장 문장 실제 모바일 터치 통과. 근처 살아 있는 적의 HP/처치 불변. 최종 검수에서 사진을 직접 열어 확인했고, 최종542의 빗장·16장 실제 이동 검사를 별도로 했다. |
| 최종16장 현장 접촉 |54230a95에서 구조 완료·멀리 있는 영웅은 증언/기록 없음. 실제 D 이동으로 원래 노승 곁에 접근하여 증언 자동 획득, 기록은 hall 전 미획득, clear 처치 사실 없음, 적 HP 불변. |
| 현재/옛 predicate |현재30장50개 조작에 살아 있는 일반 적 추가 전후 eligibility 동일. 거리/층/죽은 actor·대상/HP0/필수 역할/중복 음성 검사. raw/effective/objectiveLegacy/canonPrior, Act2 revision1, splitV1/waterworksV2 메타데이터 조사. |
| 실제 App 표본/기계 조건 |16hall·17brace·20escort 일반 적 생존 상태 입력,16증언 거리/기록실 선행,26현장 수거,독립 clear-pass/clear-village,저장 배열·완료 사실 보존 검사 통과. 8장 유한 물자 실제 접근·1회 회복 통과. |
| 통합 검사 |정상 `npm run build`, `tests/web-split.mjs`, `tests/web-build-retention.mjs` 통과.18장 단축 계약의5개 기존 snapshot/반복 Continue 보존은 중간 통합에서 통과했고 최신 전용 모듈 바이트도970과 동일하다. 무관한 전체 검사는 반복하지 않았다. |

세 집중 표본은 준비한 저장 상태의 실제 조작이며 각 장 전투 완주가 아니다. 전수 목록은 predicate/계약 조사이지30장 완주가 아니다. 실제 사용자 저장 JSON은 없으며, 앞선 구조 사실·선택 영웅 위치를 준비한 fixture를 사용했다. 수정 자체가 적 처치·좌표·완료 플래그를 덮는 해결책은 아니다. 초기 browser harness의 reload마다 fixture를 덮던 설정은 최초1회 설치로 고쳤으며, 최종 성공은 실제 저장과 재개 대화를 사용했다.

- [수정 전 모바일 /424c 기준](review/before-mobile-gate.jpg)
- [최종 열림·저장 재개 모바일](review/after-mobile-opened-resume.jpg)
- [최종 열림·저장 재개 가로](review/after-landscape-opened-resume.jpg)
- [최종16장 실제 이동 후 증언·기록실 목표](review/focus-contact-stage16.jpg)

## 통합·발행 보호

정상 build 입력과 최종 소스에서 최신 UI/NPC·BASE4, BGM7곡, 승인11·13장 미술,18장 단축/저장 호환, O05 엔진·skill-preview와 렌더 최적화를 보존했다. `shared/build.mjs`, campaign/narrative-current,18장 모듈, O05 엔진·preview, UI runtime/CSS가970과 바이트 동일함을 확인했다. 승인 대기 묵종v04나 별도 대사 후보는 포함하지 않았다.

부모가 확인한 성공 발행 dd878/424c/a0b/3b/970을 기존 이력에 등록했다. 최종970은 Pages39873923478/2026-10-22T23:48:32Z이다.7일 실제 성공 전체+최신2개 정책을 바꾸지 않았고, 중간 후보를 발행으로 기록하지 않았다. 현재354개 활성 파일과16개 실제 발행 그래프의 합집합521파일을 원본 manifest/hash/바이트로 검증했다.934의 `chapter-13.516170b245a8b075.json`, `chapter-13-assets.1387b6a1f088fc74.json`은 원래 Git blob 바이트와 같다. 보존 자산은 초기 활성 경로에 연결하지 않는다.

970과 최종542를 별도 cold Chromium/context/390×844/타이틀 ready+2초로 비교했다. 요청98개,JS/JSON72개,manifest 요청0으로 동일. JS/JSON 응답 본문은4,432,086→4,431,815B(-271B)다. 로컬 HTTP의 디코딩 본문 측정이며 공개 압축 전송량이나 전체 전투 성능이 아니다. 새 전체 다운로드/프리로드는 추가하지 않았다.

재현 입력/도구는 `tests/interaction-nearby-fixtures.mjs`, `interaction-nearby-enemies.mjs`, `interaction-clearance-steps.mjs`, `interaction-eligibility-audit.mjs`, `interaction-supply-access.mjs`, `interaction-enemy-gates-browser.py`, `interaction-representative-browser.py`, `interaction-witness-contact-browser.py`에 있다. 자동 원자료·네트워크·상세 로그는 Git 제외 `_local/reports/interaction-enemy-gates/`에 두었다. 위 수동 검토용 JPG만 명시 인계 산출물로 남긴다.
