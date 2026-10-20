# 1–3막 휴식터 공통 벡터 연결 (2026-10-20)

SOP v1.0의 단계 0/2/7에 해당하는 렌더 연결이다. 전투·장 전체 재설계나 미술 합격을 뜻하지 않는다. 기준 master는 1fb64610be98f9d6b4e7c273d08fc64b80c9d886이다.

## 보존과 구성

30개 장소명·대사·목적지·저장 ID·등장 동행·전투/퀘스트/승패 조건은 기존 콘텐츠를 그대로 사용한다. SOP 1/3/4/5/6의 지형·동선·인물 배치·적·이벤트·대사는 변경하지 않았다. rest-journey의 별도 인물 canvas, 1600×900/ground765, pan/zoom/클릭 처리와 모닥불·대화·다음 길·저장/배치 기능 경로를 유지한다.

근경은 rest.mjs의 장소별 조합을 통해 기존 registry의 소나무·암반·문·창·처마·기둥·말뚝을 사용한다. 건물/잔교/석축은 3·4장과 같은 compileArchitecture로 조립하며 휴식터용 지지면은 표시 데이터에만 존재한다. 문 높이는 실제 휴식터 인물의 약 1.24–1.41배다. stoneFootOffset은 수로 석축의 표면 배치 전용 선택값이며 기존 3·4장 건축 출력은 각각 20/22그룹 모두 기준과 동일하다.

최초 연결의 act1-far/act1-gorge/act3-far와 cavernBackdrop은 동기 SVG 벡터이며 독립 이미지 원경 연결로 볼 수 없다. 부모 미술 검토에서 21장 벡터 산맥은 불합격했다. 후속 브랜치는 직접 확인한 location-far의 기존 래스터 10계열을 장소별로 명시해 실제 외부 WebP로 연결한다. data-rest-backdrop의 기존 미세 시차를 유지하고 낮은 대비는 정적 회색 색막으로 만든다. 실시간 filter와 새 원화 제작은 없다. 일반 나무는 정적이며 기존 화로·물결·폭포 리본/포말·풀 모션만 재사용한다. 10장의 고유 뿌리 계단과 팽팽한 실은 기존 표현을 유지한다. 소단 주술목·묵종 전체 재설계는 제외했고 전투의 해당 표현은 변경하지 않았다.

## 30장 적용표

모든 행은 단계 2 연결 완료, 단계 1/3/4/5/6 변경 없음이다. 30장 검사는 매핑과 SVG 참조의 데이터 확인이며 전 장 플레이가 아니다.

| 장 | 기존 휴식터 | 공유 조합 | 교정 래스터 원경 |
|---|---|---|---|
| 1 | 고개 아래 주막 | inn | mountain-dusk |
| 2 | 능선 바위턱 | ridge | mountain-dusk |
| 3 | 나루로 내려가는 길 | ferry | mountain-wet-valley |
| 4 | 북문 바깥 길목 | gate | mountain-still-night |
| 5 | 폭포 아래 바위턱 | waterfall | mountain-wet-valley |
| 6 | 나무다리 위 길목 | bridge | mountain-wet-valley |
| 7 | 북문 쉼터 | village | mountain-dusk |
| 8 | 창고 앞 길목 | warehouse | mountain-still-night |
| 9 | 아랫마당 길목 | court | mountain-still-night |
| 10 | 윗마당 아래 계단 | guardian | mountain-still-night |
| 11 | 동쪽 외문 곁 | dawnGate | mountain-dusk |
| 12 | 채석장 앞 산길 | quarry | cave-entrance |
| 13 | 함몰지 돌계단 | stoneSteps | cave-entrance |
| 14 | 석문 안쪽 길목 | caveVillage | cave-settlement |
| 15 | 피난 다리 곁 | caveBridge | cave-waterwork |
| 16 | 법당 아래 계단 | caveTemple | cave-settlement |
| 17 | 잠운사 뒤편 길목 | workshop | cave-waterwork |
| 18 | 인양로 끝 | bellApproach | cave-bell-chamber |
| 19 | 묵종 곁 | bellApproach | cave-bell-chamber |
| 20 | 동굴 출구 안쪽 | caveExit | cave-entrance |
| 21 | 성문 앞 나루 | cityFerry | town-wall |
| 22 | 문서고 앞마당 | archive | town-wall |
| 23 | 지상 하역장 입구 | freight | town-river |
| 24 | 폐가 담장 밖 | mansion | town-wall |
| 25 | 수로 아래 첫 석대 | canal | underground-channel |
| 26 | 묘역 옆 지상길 | graveyard | town-river |
| 27 | 검은 집하장 입구 | depot | cave-waterwork |
| 28 | 불붙은 뒤뜰 양쪽 | courtyard | town-wall |
| 29 | 밤의 수문 앞 | sluice | town-wall |
| 30 | 읍성 밖 나루 | riverExit | town-river |

## 최소 확인과 한계

- 통과: 정식 빌드, node tests/rest-shared-vector.mjs(30개 매핑·SVG 참조·인물 대비 문 크기·정적 나무·화로/물 훅), node tests/journey-art.mjs.
- 실제 Chromium 1440×900 및 390×844에서 1/12/14/16/21/25장 각각 접지·인물 크기 캡처와 pan·휠/터치 줌·모닥불·다음 장 진입 통과. 1장 선택 대화도 PC/모바일에서 확인했다. 콘솔 오류 0. 석축/잔교 보완 후 영향받은 21/25장만 다시 확인했다.
- 5장 폭포 리본/포말 훅과 PC/모바일 결과 이미지를 확인했다. 10장 고유 랜드마크는 가벼운 마크업 확인만 수행했다.
- 근거: _local/reports/rest-shared-vector/{mapping.json,browser.json,browser-corrected.json}, pc-N.png/mobile-N.png, pc-5-water.png/mobile-5-water.png. 캡처는 로컬 보고서이며 생성물과 함께 커밋하지 않는다.
- 미실행: 전체 verify, 30장 전투 재플레이, 무관한 기예/전투 검사, 별도 검수자, master 병합, Pages 배포/공개 확인. 저장/배치 버튼 내부 기능의 재검사는 하지 않았다(해당 코드 불변).
- 부모 통합: tools/environment/vector-kit-runtime.mjs의 rest.mjs 포함/노출 변경이 필요하다. registry.mjs 및 vector-campaign-art.js는 수정하지 않았다. 생성물 통합·master 반영은 부모가 지정한다.

## 부모 지정 통합 (2026-10-20)

초기 소스 완료 이후 부모 승인으로 master 2014aa4c의 로딩 개선에 이 휴식터 브랜치만 병합했다. BUG_LOG의 두 항목을 모두 유지했고 shared/web-build.mjs/shared/web-loader.js는 master와 동일하다. 통합 빌드 1회와 대표 21장 PC·모바일의 기본 렌더만 확인했으며 기존 6곳의 상호작용 검사를 반복하지 않았다. Library 첨부는 파일 생성 전 네트워크 연결 오류로 실패하여 승인된 대안 [저장소 캡처](../../review/rest-shared-vector/README.md)에 PC/모바일 각 한 장을 보존했다. 생성물도 함께 통합하며 master 원격 반영과 Pages 결과는 최종 보고에서 구분한다.

## 원경 미술 검토 후 교정 — master 통합 대기

21장 town-wall(성문/성벽), 23/26/30장 town-river(나루), 25장 underground-channel(수로), 27장 cave-waterwork(목조 작업굴)를 사용한다. underground-deep-draft는 부적합한 초안으로 활성화하지 않는다. stage21/far.webp도 실제 비교했으며 더 낮은 대비의 town-wall을 21장에 선택했다. 다른 장소는 산지 황혼/밤, 동굴 입구/마을/작업굴/종 공동의 기존 래스터로 명시했다. 원본 PNG는 그대로 두며 빌드 시 2048px WebP 인코딩만 수행한다. 전체 10계열의 URL 메타데이터를 로드하지만 이미지 요청/디코드는 해당 휴식터가 보일 때만 발생한다. 기존 로더와 startup prefetch 코드는 수정하지 않았다.

21장 근경 건축만 같은 공간 안에서 x+340으로 옮겨 모바일 최초 프레임에 건축 일부가 보이게 했다. 인물 canvas·ground765·카메라/pan/zoom·버튼 영역과 기능은 불변이다. 원경 교정 빌드 1회, 30개 데이터 매핑/실제 파일 참조 검사, 21/25장 PC·모바일의 결과 이미지·래스터 decode·독립 pan만 확인했다. 실시간 filter0·console pageerror0·시작 시 원경 그림 요청0이며 방문한 두 원경만 요청됐다. 다른 장의 실제 화면/상호작용과 master/생성물 통합·배포는 미실행이다. [부모가 볼 수 있는 교정 캡처](../../review/rest-shared-vector/README.md). 기능 연결과 미술 승인은 구분한다.
