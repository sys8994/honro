# 캐릭터 도감

`tools/character-catalog.html`은 Game과 같은 공통 런타임으로 그림을 보여 주는
독립 HTML이다. 기존 Pages의 `/honro/tools/character-catalog.html`에 그대로 둘 수
있으며 외부 이미지·CDN·서버 API를 요구하지 않는다. 저장된 게임을 읽거나 쓰지 않는다.

## 범위와 수집

- 주요 그림 53개: 주인공 4, 몬스터 17, 동맹·소환·목표 벡터 23,
  2막 직접 Canvas 9. 전용 벡터 44개의 정의 클립 슬롯은 209개다.
- 현재 파괴 목표는 5개 유닛을 4개 그림으로 묶어 추가한다. 8장 상여 결박 두 개는
  한 그림이며, 주박목·바깥 주박·상부 사슬 고정구는 각각 별도 항목이다.
- 구형 호환 15개 **분기**를 별도 필터로 제공한다. 독립 원본 파일 15개라는 뜻은
  아니다. 미등록 소환혼은 구형 혼의 기본 도형을 공유하고 side=0 상두꾼은
  구형 human 경로에서 소단과 가림 면을 합성한다.
- `monkVessel`은 공명혼의 alias, 8장 빈 상여는 `bier_boss` 사용처다.
- 30개 fresh 장에서 `b.units`, `honroStaging.hidden`, `honroConvoyActors`를 수집하고
  프로젝트의 meta·metadata·encounters·initialState·events, 전투 맵/사건과
  `HonroAct2Plan`의 조건부 팩토리도 조사한다. 설정 경로 중복은 서로 다른 근거로
  보존하며 사용처 수를 고유 캐릭터 수나 정상 플레이 출현 횟수로 해석하지 않는다.
- 소환 사용처는 현재 선택 가능한 유효 `HONRO_CORE.SKILLS`와 소단 편성 장의
  교집합이다. 기예 습득·장착·발동 조건은 별도이며 생성 가능성과 정상 플레이
  관측을 구별한다. `summon_charger`의 `O99`는 과거 저장 투사체용 정의다.
  `summon_host`와 함께 구 저장·호환 팩토리 경로를 보존한다.
- 이름이 담허/소단인 동맹은 주인공 그림을 사용한다. 사용자 맵 label을 바꾸면
  `ally_daoist`/`ally_medium`이 사용된다. side=0 사용자 맵 몬스터는 실제
  `HonroUnits.create`의 출력으로 표본을 만든다. 섭혼된 몬스터의 최신 그림 경로와
  이 사용자 맵 팀 변경 경로는 다르다.

모든 개인 저장과 사용자 맵을 확보한 것은 아니다. 전역 미사용 확정은 0개이며,
미사용 후보 판정으로 자산을 삭제하지 않는다. `party.v006.runtime.js`는 현행
주인공 생성 입력이고 `shared/engine/src/art.ts`는 효과에도 쓰인다.

## 렌더링과 검수

`runtimeParts({app:false})`로 공통 런타임을 재사용한다. App·오디오 호스트·게임
iframe·물리 tick은 만들지 않는다. `HONRO_EMBEDDED=true`를 선행하며 저장 API를
호출하지 않는다. 빌드 때만 실제 월드/팩토리에서 메타데이터와 표본을 수집한다.

`adapter.js`는 표본 유닛과 필요한 전투 맥락을 복제해 `HonroScene.unit`을 호출한다.
정의 클립 모드는 기존 주인공 리그와 Monster/Actor 벡터 렌더러를 직접 호출한다.
게임이 읽지 않는 점프 클립 등은 정의 클립에서 볼 수 있다. 상태 보간은 미리보기이며
실제 이동·명중·승리 조건을 실행하지 않는다. HP·정예 표시도 실제 분기의 출력이다.
목표는 원래 terrain/narrative 그림 분기를 사용하되 주변 환경 전체를 그리지 않는다.

검수 기록은 `reviews.json`에 있다. Chromium으로 전체 contact sheet와 개별 전신을
직접 보고 판정했으며 소스 코드만 읽어 픽셀 검수를 대신하지 않았다. 주인공 4명은
개편 대상에서 제외하고 기준으로 표시한다. 큰 실루엣·재질·절제된 면을 우선하며
미세 선이나 노드 수를 품질의 대용으로 삼지 않는다. 종지기는 기존 보라색 뾰족
두건/원형 지팡이 몸체에 띠를 더하는 경로여서 우선 개편으로 판단했다.

공식 문화 자료는 `references.json`의 링크로만 제공한다. 자동 열람 제한이 있는
페이지는 표시하며 사진·도안을 복제하거나 트레이스하지 않는다. 방상시·처용·꼭두·
사천왕을 본래 악귀로 설명하지 않는다.

## 재생성 및 집중 검사

```sh
# 기존 game/package-lock.json에 고정된 TypeScript 의존성이 필요하다.
npm --prefix game ci --ignore-scripts --cache /tmp/honro-npm-cache
node tools/character-catalog/build.mjs
# Python Playwright와 /usr/bin/chromium 필요; 검사 자체가 임시 localhost 서버를 열고 닫는다.
python3 tests/character-catalog-browser.py
# 수동 브라우저 확인이 필요할 때만:
python3 -m http.server 8765 --bind 127.0.0.1
```

빌더는 원본 파일과 근거 토큰을 검증하고 공통 런타임 SHA-256 및 기준 Git commit을
HTML에 기록한다. `--ui-only`는 같은 작업에서 UI를 반복 검수할 때만 허용한다.
이 옵션은 `_local`의 이전 수집 결과를 재사용하므로 런타임·캠페인·inventory 변경 후
또는 최종 통합에서는 반드시 옵션 없이 새로 빌드해야 한다. 자동 캐시 갱신은 없다.

Game/Workshop 빌드 목록을 바꾸지 않기 위해 별도 빌드로 둔다. 스토리 통합 후
`npm run build`와 함께 위 도감 빌더를 실행하고 생성 HTML도 커밋한다.
검수 메모는 자동 생성하지 않으므로 그림이 바뀌면 실제 픽셀을 다시 보고 갱신한다.
기준 commit은 빌드 시점 `HEAD`다. 미통합 스토리 브랜치도 그 commit의 근거를
가리키며, 미커밋 런타임 변경이 있으면 화면에 별도 표시한다. 런타임 SHA-256이
실제 그림의 정확한 스냅샷 식별자다. 출처 링크를 정확히 고정하려면 스토리 소스를
먼저 커밋하고 도감을 빌드한다.

브라우저 검사는 72개 항목/모든 정의 모션의 Scene·클립 샘플, 캔버스 가장자리,
실제 재생·정지·스크럽·방향, 한글 검색/필터, 모달, 숨은 혼, 저장 API 무접근,
1440×1000 및 390×844·333×667·667×333 화면을 확인한다. PNG와 JSON 결과는
`_local/reports/character-catalog/`에 남기며 Git에 넣지 않는다.

이 검사는 캠페인 정상 완주·모든 과거 저장·브라우저 전체 성능·공개 Pages 검수를
대신하지 않는다. 전체 `verify`와 Game/Workshop/Pages 검수는 스토리와 함께
최종 통합·배포하는 단일 발행자가 한 번 수행한다. 도감 작업에서는 master 병합이나
공개 배포를 하지 않는다.

## 스토리 개정과 최종 통합

원본 도감 `36cbc1c`를 스토리 개정과 병합한 소스 `84afafc6ef926bc084aec2088c77674220b5d8f4`에서 `--ui-only` 없이 전체 수집·재빌드했다. 런타임 SHA256은 `539901883ea9f0f75a2c4ec721f6b455e6b5a790e13ec19f1281f9ead560cfef`, sourceDirty는 비어 있다. 주요53·호환15·목표4·전용벡터44·클립209 계약이 유지되며 통합본에서도 31개 실제 Chromium 검사와 1,386 렌더 표본 검사가 통과했다.

`HONRO_BASE_URL=https://sys8994.github.io/honro HONRO_CATALOG_REPORT=_local/reports/character-catalog-public python -X utf8 tests/character-catalog-browser.py`로 공개 사이트에 같은 검사를 적용한다. HTTP 응답 SHA256을 체크아웃 산출물과 대조하고 실제 URL·sourceCommit을 결과에 기록한다. 로컬 통합 증거는 `_local/reports/character-catalog-integrated/`이며 공개 배포 검수와 구분한다.
