# 8장 상여 개편의 저장·역사 경계

기준 커밋은 `bf8b108eb1f27110b2363e6c9211af2f98828c07`, tree는 `a14f5e985a85361a372750065e35d0713c101e00`이다. `tests/fixtures/stage8-bier/history-before.json`, `before-stage8.json`, `entry-ledger.json`은 변경 전 입력이다. 신규 검수 시 이 세 파일이나 이전31개 동결 입력을 다시 만들지 않는다.

## 정확한 투영

`tests/stage8-bier-history-helpers.mjs`는 새8장 전체를 확인한 뒤 기존 `23 → 12 → 30 → 18` 검사 계층 앞으로 연결한다. 이전 helper·golden·assertion은 유지하고, 역사 검사의 import만 새 외곽 경계로 연결한다.

- 기존29장 전체, 기존580개 라이브러리의 ID·순서·내용, 기존130개 런타임의 membership·내용을 검사한다.
- 신규8장 지도·배우·이벤트·장식과 신규 자산의 전체 검토본을 정확히 비교한 뒤8장만 원본으로 돌린다. revision이나 asset prefix만 보고 데이터를 삭제하지 않는다.
- 런타임 신규 파일은 `stage8-bier.js`, `stage8-bier-art.js` 두 개다. 기존 변경은 공통 모델/렌더 manifest 두 등록, Stage8 전용 readability 호출, 선택적인 balance8 초기 수10/28뿐이다. 공통 목표·물리·기예·성장·스토리·미션 소스를 수정하지 않는다.
- 별도 승인된23장 기단 석재 미술 커밋 `274c1a518bad1db2c4c989d59ca9b37165e5068c`는 추가 고정 경계다. 유일한 production 파일 `shared/runtime/stage23-escort-art.js`의 전 SHA `10ad7bbaaa48acc121d556a97688400bae204a6adbe2b3a2be7a58d7393fb6e7`와 후 SHA `309607319dde8b97ca6b8acc95ce87fab925c794e9322c0699bb004713dc4970`만 허용한다. 새 검토본은 실제 현재 byte를 보관하고, 기존23장 validator에 전달하기 전에 동결한 bf8 전체 source로 역투영한다. 기준130개 목록이나 이전 fixture를 새 기준으로 바꾸지 않는다.
- 저작 원본145개는 기준 tree의 고정 SHA-256 목록으로 보호한다. 신규 저작은 Stage8 생성기·geometry·art·far SVG 네 개다. 기존 저작자 예외는 `apply-act1.mjs`의 정확한 canonical 호출과 `act1-scene-composition.mjs`의 revision1인8장에만 적용되는 한 줄 skip이다.
- 과거 JavaScript 문자열은 SHA/byte 증거일 뿐 실행하지 않는다. 역사 지도·balance/content/plan 행을 잠시 교체한 검사도 현재 production Engine을 실행한다. 캡처된 plan closure가 같은 행을 보며 예외 종료 뒤에도 원래 전역 참조를 복원한다.

## 새 검토본 기록

지도·생성기·런타임·미술이 실제 검토된 안정 단위일 때만 다음을 실행한다.

```sh
node tools/map-forge/record-stage8-bier-history.mjs --label <검토된-단위>
node tests/stage8-bier-history-audit.mjs
node tests/stage8-bier-old-save.mjs
```

기록기는 원본 입력·소스 범위를 먼저 검사하고, 생성기가 canonical project의 모든 byte를 재현하며 공통 runtime bundle의 project와도 일치하는지 확인한다. 그 후 raw-model·temple fingerprint를8장 이전으로 되돌려 기존 불변 fingerprint와 대조한다. 결과는 오직 신규 `history-reviewed.json`에 기록한다. `--check-only`는 기록하지 않는다. 알 수 없는 변경을 현재 기준으로 흡수하지 않는다.

## 저장 검사 범위

옛8장의 동결된 전투 payload 직접 import 및 현재 App으로 만든 옛 지도 전투에서 export → 실제 file-import handler → Continue → 반복 mount를 검사한다. 직렬화된 전투의 모든 필드를 비교하므로 새 revision, 지형, 배우, 목표, 성장 장부, 대화 커서가 은근히 추가되거나 사라지면 실패한다.

부분 봉인·대화, 지급된 전투XP의 중복 지급 방지, 담허 단독 사망의 기존 비실패 조건, 전원 사망을 별도로 검사한다. 전원 사망 뒤 명시적인 retry만 새8장으로 진입한다. 그 새 전투는 일반28+보스1, cap37, 기존 일반 개체HP0.6 정확히1회, 원본 보스HP2578을 확인하고 반복 Continue에서 재튜닝하지 않는지 검사한다.

옛1–7/9/10/11/12/16/17/18/30/23은 별도의 격리 probe로 검사한다.12/18/23/30은 해당 개편 이전의 불변 지도 입력을 사용한다. 나머지는8장 기준 커밋의 정확한 지도를 사용한다.

DOM·Canvas·오디오·저장소·다운로드·시계는 test double이다. 부분 봉인과 사망, 적 처치, 대화 시작은 명시적인 저장 경계 fixture다. 다른 장의 probe profile은 정상 입장 자원 증거가 아니다. 이 검사만으로 정상 전투 완주, 전체 캠페인 실플레이, 브라우저나 시각 합격을 주장하지 않는다.

## 현재 렌더러 fallback 격리

`node tests/stage8-bier-renderer-isolation.mjs`는 현재 production render manifest에서8장 모듈 바로 직전/직후의 실제 함수 참조를 비교한다. `terrain`, `background`, `terrainHealth`를 대상으로 옛8/11/12/16/17/18/23/30 및 custom8·미지원 revision2의 가로/세로와 반복 cache pass를 비교한다. 원래 readability hook도 전후가 섞이지 않도록 이전 호출 동안 신규8 export만 제외한다.

기존 asset runtime/SVG는 읽기만 하고 party/monster/actor 생성기를 실행하지 않는다. 두 비교에 같은 승인23 석재 renderer를 적용한다. RGBA, 기존 함수 대비 Canvas context, clipping 해제 및 직렬화 battle의 모든 필드를 확인하고, 별도의 명시적 활성8 재질 fixture는 실제 pixel 변화가 있음을 확인한다. 이 검사는 새8 지도나 미술 구도의 최종 승인·브라우저·완전한 호스트 화면·FPS 검사에 해당하지 않는다. 새8의 wrapper가 달라지면 재실행한다.

## 준비 저장점의 한계

2026-10-09 정적 역사 경계와29개 import-only 연결을 먼저 WIP로 저장했다. 아직 canonical8 교체/최종 지형·미술 검토본이 없으므로 `history-reviewed.json`은 생성하지 않았다. 이 단계에서 해당 검토본을 요구하는 전체 역사/old-save 검사는 대기 또는 의도적인 거부 상태다. 선언된 runtime/authoring 범위·JS 문법과 동결 옛8 payload의 실제 파일 가져오기/Continue smoke만 확인했으며, 이 준비 저장점을 전체회귀 합격으로 취급하지 않는다.
