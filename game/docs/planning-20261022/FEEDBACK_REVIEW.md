# 외부 기술·전투·서사·오디오 피드백 검토

2026-10-22, 기준 f37530094b3f83d33991162243b7a2722c8fd8f9. 정적 소스와 공식 문서 대조이며 장애·Safari 크래시·재미·성능을 실기기로 재현한 결과가 아니다. 아래는 수정 후보이지 구현 승인/완료 보고가 아니다. 별도 진행 중인 이미지 여정첩/설정 개편과 구분한다.

## 이미 대응했거나 전제가 잘못된 내용

- aria-busy 자체는 로딩/클릭 차단 기능이 아니다. index에는 단계/n-total 표시, 재시도, 첫 그림1.2초 상한이 있다.
- 일반 플레이는 현재 stage를 ensureStage로 지연 로딩한다. full/embedded 경로와 구분한다. 모든 막의 모든 이미지·오디오를 기다리는 구조라는 진단은 부정확하다.
- BGM은 HTMLAudioElement current/outgoing 스트림이며 이전 src를 제거하고 정리한다. 장별 AudioBuffer 무한 축적이 아니다. SFX는 고정26종 합성 캐시와20voice 상한이 있다.
- 원경3개LRU와 렌더 캐시 상한/축소가 이미 있다. 모든 텍스처가 무한 누적된다는 일반화는 근거가 없다.
- 사용자 제스처의 오디오 활성화와 복귀 처리가 있다. 모든 브라우저에서 첫 클릭 전 반드시 suspended라는 단정은 과하다.
- 휘겸은 순수 근접이 아니라 검술/돌격/검기다. 도약·낙하·검기와 특정 고비용 기술의 착지 추가타가 있다. 1막 전체에4인 콤보를 요구하면 합류 순서와 맞지 않는다.
- 묵종의 현재 목표는 타종이 아니라 공명 억제, 고정구 해제, 안전 하강과 혼의 수습이다. 타종→보호막 해제는 현재 서사와 충돌한다.
- 3막 휘겸의 문서 분류/모순 대조와 지상 조사는 이미 있다. 기록실 개방·주민/기록함 구출·회수에 증거가 연동된다.
- 칠십 년 언급은 종의 이송 기록이다. 이를70~100년 전 저문골 참사의 확정 연대로 취급하지 않는다.

## 우선 검증·수정 후보

1. 무응답 로딩 복구: shared/web-loader.js의 fetch, shared/web-build.mjs의 CSS Promise/import에 자체 timeout이 없는 경로가 있다. 명시적 오류가 아니라 계속 pending인 경우 진행이 막힐 수 있다. 404/offline/endless delay를 각각 재현한다. 재시도 시 오래된 응답이 새 UI/프로필을 오염시키지 않도록 소유권 검사를 유지한다.
2. 필수/비필수 분리: 그림·소리 fallback과 필수 규칙/장 데이터의 안전 실패를 구분한다.5~8초 뒤 무조건 불완전 전투에 진입시키지 않는다.
3. 메모리 계측: 요청/방문 stage/library/assets 보존과 환경 이미지/경로 캐시를 측정한다. 유한 콘텐츠 보존은 곧바로 누수가 아니다. 필요하면 소유권을 확인한 eviction/scene.dispose를 도입한다. 공유 자산을 무조건 null하거나 Image/canvas에 ImageBitmap.close를 적용하지 않는다.
4. 모바일 오디오: 실제 iOS/Android의 제스처, 음소거, 백그라운드/OS 중단 복귀, 오래된 cue 부활을 검수한다.
5. 전술/조사 인지성: 검술 중심 빌드의 실제 dead turn,18장 원거리/근접 고정구 대안,3막 각 조사에서 확인한 사실과 아직 모르는 사실이 사용자에게 전달되는지 검증한다.

현재 읽기 검토만으로 재현된 P0 차단 결함은 없다. 위 위험을 실제 검증한 뒤 심각도를 확정한다. 기존37개 JS 항목 감사도 별도 미완료다.

## 제한된 연출 실험 후보

- 한 곳의 낙하 후 짧은 취약 상태. 자동 추가 턴보다 다음 정상 행동의 기회로 시험한다. 원거리/근거리 모두 합리적인 대안으로 남겨야 한다.
- 명시적 근접 파괴 장치를 한 곳에 제한해 시험한다. 모든 지형을 기본 검격으로 파괴 가능하게 바꾸지 않는다.
- 묵종 타종 대신 억제·장력·하강 상태가 소리로 읽히도록 작은 청취 시안을 만든다.
- 시작 전용 효과는 오디오 wake 전체가 아니라 실제 시작 확정 이벤트에1회만 연결한다. 이어하기/실패/음소거/오래된 cue를 구분한다.
- 무기별 음색과 짧은 반복 SFX의 .95~1.05 pitch 후보는 청취 후 판단한다. 속도/길이도 변하므로 대사나 정확한 타이밍 cue는 제외한다.
- 필터/reverb는 신규 오디오 그래프와 비용 검증이 필요하다.200~300Hz는 시험값이지 보편 정답이 아니다.27장 의도된 무음을 침범하지 않는다.

보류: 범용 자동 추격/추가 턴, 전 장 강제4인 콤보, 성벽 전반 파괴,3막 대규모 재작성, 타종에 따른 방호 해제, 미확인 연대 고정.

## 검증 기준

동일 장·성장·장착·아이템에서 정상 행동 수/자원/피해/회복 비용/실패 위험을 함께 비교한다. 콤보 없는 해법도 유지한다. 초견 사용자가 원인과 후속 이득을 설명할 수 있어야 한다. 다중 타격·소환·저장 재개로 보상이 중복되지 않아야 한다.

메모리는1→11→21→30→타이틀→재진입 왕복에서 JS heap뿐 아니라 관측 가능한 canvas/process 메모리, 캐시 항목 수, 탭 재로드 증거를 구분한다. 실제 기기 시험 없이 Safari 고정 메모리 한도를 단정하지 않는다.

## 근거

저장소: shared/web-loader.js, shared/web-build.mjs, shared/engine/src/bgm.ts, sound-design.ts, warriorData.ts, warriorMechanics.ts, shared/runtime/authored-far-art.js, renderer.js, main.js, stage18-bell.js, act2-content.js, act3-content.js, evidence-quests.js, split-campaign.js.

- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy
- https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
- https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap/close
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management
- https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode
- https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode
- https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/playbackRate
