# 깊은 지형 몸체 보완

기준 공개 배포 소스: `de286f945376553e159c5f4c8a4a9d5063b3e4a3`. 이전 `712dc8b` 군집은 이 기준에 이미 포함되어 있으며 중복 적용하지 않았다. SOP 2/7, `.agents/skills/honro-environment/SKILL.md`, RELEASE_OPERATION_GUARD를 따른다.

## 실제 전후

같은 Chromium 1440×960, time=2, 실제 정식 번들. 표면의 승인된 군집과 캐릭터/카메라를 유지했다.

| 구간/카메라 | 전 | 후 |
|---|---|---|
| 3장 잔교~오른쪽 창고, (2100,1450,0.24) | [기준](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/terrain-depth-volumes/before-stage03-wide.png) | [개선](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/terrain-depth-volumes/after-stage03-wide.png) |
| 18장 시작점 아래, (1200,6200,0.5) | [기준](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/terrain-depth-volumes/before-stage18-normal.png) | [개선](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/terrain-depth-volumes/after-stage18-normal.png) |

## 개선 범위

- `vector-campaign-art.js`에 캐시되는 깊은 지질 구성을 더했다. 큰 자연 지형의 지표/천장 경계에서 시작한 비대칭 곡면을 실제 도메인 하단/상단까지 닫는다. 몸체 자체는 canonical polygon으로 clip되며, alpha fade로 공중에서 끝나지 않는다.
- 3장은 잔교 아래 퇴적층에서 이어지는 흙 덩어리와 우측 비탈 배수·퇴적 흐름에 공통 부재 6개를 배치했다. 18장은 시작점 아래부터 더 깊은 면까지 어깨/세운 돌/비스듬한 암반/낮은 매몰암 10개를 비대칭 군집으로 배치했다. 기존 부품의 보통 돌 크기를 유지하고 거대 암반 스프라이트로 확대하지 않는다.
- 두 장에 각각 5개 작은 돌 머리를 연속된 전면의 경계에서 부분 노출시켰다. 전면 경계의 실제 Path를 가림 마스크로 쓰며 독립적인 받침을 추가하지 않는다.
- `registry.mjs`에는 깊은 곳의 색 대비를 낮춘 `wet-depth`, `cave-depth` 팔레트만 추가했다. 새 돌의 몸체 opacity는 1이며, 대비를 낮추기 위해 개별 돌을 투명하게 만들지 않는다. 넓은 몸체 그늘은 별도 명암 레이어다.
- 새 노이즈/미세 잎/반복 텍스처/실시간 필터/래스터/엔진은 없다. 원래 공통 지질 Path를 재사용하며 prepare/Path2D/노드 bounds culling과 기존 제한된 월드 타일·화면 캐시에 남긴다. 거대 전체 맵 Canvas를 매번 다시 그리지 않는다.
- 도시/재·목재/물/oneWay/퀘스트 장치에는 깊은 자연지질 패스를 강제로 적용하지 않는다. 다른 큰 자연 몸체에는 제한된 공통 저대비 곡면을 쓴다. 구체적인 중간 부재 배치의 실제 미술 확인은 이번 두 장에 한정한다.

## 필요한 확인

[전 기록](before-checks.json), [후 기록](after-checks.json), [빌드 자산 보존](preserved-assets.json).

- 두 화면 page error 0. terrain/units/markers/events/objectives 렌더 전후 동일. source campaign/충돌·이동·몬스터·이벤트/카메라 데이터는 수정하지 않았다.
- prepare 1회, 동일 포즈 반복 렌더의 타일 생성 증가 0. 3장 타일 bytes 21,300,480, 18장 15,975,360으로 기준과 같다.
- 추가 구성: 3장 연결 면 3/중간 부재 6/부분 매몰석 5, 18장 연결 면 5(천장 포함)/중간 부재 10/부분 매몰석 5. 기존 표면 군집 포함 부재는 27/55개이며 새 배치를 격자로 무한 생성하지 않는다.
- 정식 `npm run build`, 변경 JS/MJS 구문, 두 카메라 실제 실행을 확인했다. source 기준의 활성 data82/graphics91/styles14 해시가 모두 동일하다. 최신 master 통합 뒤의 별도 보존 결과는 `integration-assets.json`에 남긴다.
- 전체 verify·전 장 순회·스킬/저장/전투 완주 검사·별도 미술 검수자는 실행하지 않았다. 독립 배포 경로 확인만 병렬로 수행했다.

| 소스 | raw bytes | gzip bytes (mtime=0) |
|---|---:|---:|
| registry.mjs | 80,481 | 32,862 |
| vector-campaign-art.js | 31,526 | 11,534 |

## 한계

깊은 흙 렌즈와 넓은 면은 여전히 양식화되어 있으며, 일부 부재의 경계와 일반 돌 형상 재사용이 읽힌다. 이는 두 장의 깊은 몸체를 보완한 증분이며 모든 장의 최종 미술 승인이나 전면 지형 재설계 완료를 뜻하지 않는다. 아주 깊은 도메인 외곽은 부재를 무한 반복하지 않고 저대비 큰 면으로 연결한다. 기존 지형의 직선 외곽과 동선은 보존한다.

배포 SHA/Pages 실행과 공개 화면 확인 상태는 최종 보고에서 구분한다. 공개 화면 접속이 차단되면 재시도하지 않고 정확한 오류를 보고한다.

재현이 필요할 때만 루트 HTTP 서버를 8841에 켜고 `python review/terrain-depth-volumes/capture.py after`를 실행한다. `HONRO_CAPTURE_URL`로 공개 URL을 지정할 수 있다. 현재 두 카메라만 실행하며 새 전체 검사는 포함하지 않는다.
