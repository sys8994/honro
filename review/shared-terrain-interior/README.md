# 공통 지형 내부 미술 — 소스 분리 작업

**최신 보완:** [landforms-4 장소별 지질 군집과 두 카메라 비교](PLACED_GEOLOGY.md). 이전 [landforms-3](REFINEMENT.md) 및 아래 `after-*` 이미지는 각 revision의 기록이다.

기준: `1fb64610be98f9d6b4e7c273d08fc64b80c9d886` · 브랜치: `art/shared-terrain-interior`

SOP 2(공통 미술 구성), 7(이번 변경의 실행 확인)에 한정했다. 이 브랜치는 **공통 소스와 비교 증거만** 포함한다. master 통합, 정식 생성 번들 갱신, Pages 배포는 부모 작업에서 수행한다.

## 변경

- `shared/assets/environment/vector-kit/registry.mjs`: 흙 어깨, 침식 면, 젖은 퇴적 둔덕, 기반 암반, 동굴 버팀면, 나무 뿌리 사면, 석축 기초, 부분 매몰 암반의 8개 공통 벡터 부재. 기존 팔레트·재질 및 기존 자산은 유지한다. Path와 넓은 gradient만 사용하며 래스터·노이즈·미세 반복·필터는 추가하지 않는다.
- `shared/runtime/vector-campaign-art.js`: 다각형 bbox에 작은 장식 3개를 두던 방식 대신 노출된 경계, 연결된 내부 깊이, 실제 나무 밑동을 기준으로 배치한다. deterministic ID hash로 위치·선택을 고정하고 긴 면마다 후보를 제한한다. 지형 전체를 바위로 덮지 않고 흙/습지/도시/동굴 재질을 따른다.
- 같은 재질은 월드 좌표의 미술 구성을 공유하고 각 실제 다각형으로 clip한다. 인접 충돌 다각형에서 큰 사면 명암이 수직으로 잘리는 현상을 줄였다. 지형의 외곽/충돌/동선은 바꾸지 않는다.
- prepare는 revision당 캐시한다. 기존 Path2D·노드 bounds culling·월드 타일/화면 캐시를 재사용한다. 큰 부재 최대 30개, 중간 부재 최대 34개, 수목 뿌리 최대 5개로 제한한다(전체 예산 72 이하). 중간 부재는 타일 raster scale 0.45 미만에서 생략한다. 끝없이 확장된 지형 외곽에는 무제한 후보를 만들지 않는다.
- 퀘스트/장치/봉인 및 18·19장 특수 종, 30장 특수 나룻배 표현은 기존 renderer 위임을 유지한다.

`campaign.json`, `campaign.mjs`, `architecture.mjs`, loader, rest/journey, 생성 번들 및 활성 HTML은 수정하지 않았다.

## 실제 비교 화면

1440×960 Chromium 캡처. `before`는 기준 커밋의 정식 번들, `after`는 **같은 번들에 변경한 두 소스 entry만 브라우저 요청 시 임시 덮어쓴 것**이다. 저장소의 `web/` 생성물은 갱신하지 않았다. time=2의 정지 화면이며 플레이 전수 검사나 전투 완료 검사는 수행하지 않았다.

| 장 | 정상 기준 → 변경 | 광역 기준 → 변경 |
|---|---|---|
| 1 산림 | [기준](before-stage01-normal.png) → [변경](after-stage01-normal.png) | [기준](before-stage01-wide.png) → [변경](after-stage01-wide.png) |
| 3 나루 | [기준](before-stage03-normal.png) → [변경](after-stage03-normal.png) | [기준](before-stage03-wide.png) → [변경](after-stage03-wide.png) |
| 18 범종 동굴 | [기준](before-stage18-normal.png) → [변경](after-stage18-normal.png) | [기준](before-stage18-wide.png) → [변경](after-stage18-wide.png) |
| 27 지하 집하장 | [기준](before-stage27-normal.png) → [변경](after-stage27-normal.png) | [기준](before-stage27-wide.png) → [변경](after-stage27-wide.png) |

처음 보인 부유하는 얇은 흙 조각과 젖은 흙 위 파란 돌 장식을 제거했다. 암반 몸체는 불투명한 큰 면과 제한된 파단면으로 정리하고 깊은 중첩을 줄였다. 실제 화면에서 캐릭터/발판/범종/물길과 기존 큰 구조물이 유지되는 것을 확인했다.

## 최소 확인 결과

[기준 기록](before-checks.json), [변경 기록](after-checks.json)에 포즈와 원시 cache stats를 보관한다.

| 장 | 큰 부재 | 중간 부재(뿌리 포함) | prepare 횟수 | 정상 / 광역 타일 bytes |
|---|---:|---:|---:|---:|
| 1 | 8 | 3 | 1 | 12,780,288 / 34,080,768 |
| 3 | 6 | 0 | 1 | 12,780,288 / 34,080,768 |
| 18 | 30 | 0 | 1 | 15,975,360 / 51,121,152 |
| 27 | 24 | 0 | 1 | 12,780,288 / 50,056,128 |

- 8개 포즈 모두 JS page error 0. 해당 장의 terrain/units/markers/events/objectives 직렬화가 렌더 전후 동일하다.
- 정상 raster scale=0.625, 광역=0.3125. 동일 포즈 첫/둘째/셋째 렌더의 domainTileBuilds가 같고, 화면 캐시가 데워진 뒤 screenHits가 증가한다. 타일 bytes는 기준과 동일하다. 18장 광역은 누적 55회 생성이지만 보유 캐시는 기존 48개 한도 안이다.
- 전체 verify, 전 장 순회, 스킬/저장 검사, 별도 검수자는 실행하지 않았다. 이는 소스 연결/관련 화면 확인이며 전체 미술 승인이나 30장 품질 보증이 아니다.

## 용량

UTF-8 raw / gzip(mtime=0), byte 기준. gzip은 실제 소스 바이트를 압축한 값이며 배포 번들의 추가 비용과 같지는 않다.

| 소스 | 기준 raw / gzip | 변경 raw / gzip |
|---|---:|---:|
| registry.mjs | 62,414 / 25,924 | 72,555 / 30,238 |
| vector-campaign-art.js | 11,944 / 4,781 | 17,884 / 7,003 |

근경 래스터 추가 0, 외부 의존성 추가 0. 8개 새 자산은 수십 개의 저작 Path로 구성하며 미세 잎/점/잔디 노드를 생성하지 않는다.

## 남은 한계와 통합

- 야외 큰 흙 면은 의도적으로 조용하지만, 1·3장 광역에서 유사한 어깨 형태와 단순한 큰 면이 여전히 읽힌다. 자연 지형의 개별 미술 완성/최종 승인을 의미하지 않는다. 18장 깊은 전경에도 겹치는 큰 암반 형상이 남아 있다.
- 기존 지형 polygon의 직선 플랫폼 외곽, 미세한 공통 경계선, 기존 건축/원경/물/뿌리 외 표현은 이번 작업에서 설계 변경하지 않았다. 부모 소유의 건축·캠페인 개편과 합친 뒤 그 변경 구간만 확인해야 한다.
- master/생성 번들/Pages는 부모의 통합 지시 대기 상태다. 이 브랜치 자체의 공개 배포 URL은 없다.

재현이 필요할 때만 저장소 루트에서 `python -m http.server 8840 --bind 127.0.0.1`을 켠다. `node review/shared-terrain-interior/source-overlay.mjs`로 /tmp 아래 두 entry overlay를 만든 뒤 `python review/shared-terrain-interior/capture.py after`를 실행한다. `before` 인자는 변경 없는 현재 정식 번들을 사용한다. Python Playwright와 `/usr/bin/chromium`이 필요하다.
