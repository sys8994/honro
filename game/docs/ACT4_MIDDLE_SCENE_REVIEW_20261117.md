# Act4 34·37·38장 실제 Chrome 독립 진단 (2026-11-17)

## 기준과 결과
- 진단 커밋 e77e84ea2977a61b81bc93c9f1e5a94d342215cb, CI 44133903296 성공.
- 생산 소스는 clean396bac7909d7750cfdd85bc7ff98d3739a00d8d7. 32·33장 미술 후보를 섞지 않았다. 이 커밋의 진단 파일 외 생산 변경은 없다.
- HeadlessChrome157, DPR1, 1331×763, 장별 지정 카메라 한 곳, 초기 합성 전투. 저장 접근/오류/위반 0. 사용자 기존 전투·공개 UI를 조작하지 않았다.
- 34: x≈903 세로선과 y≈685 하부 L자 외곽선이 암반 실루엣과 별도로 남는다. Native 전용 현상으로 철회할 수 없다. physics/asset 원인은 아직 분리 중.
- 37: 본체 하부와 하단 암반의 긴 얇은 접합 윤곽이 실제 Chrome에서도 남는다. 구조·보행선과 관련된 원본을 함부로 삭제하지 않는다. 원인 분리 중.
- 38: 상부 다각선·하부 윤곽을 같은 화면에서 확인했으나 원본 구조선인지 합성 흔적인지 아직 판정하지 않는다.
- 이 증거만으로 장 전체 합격이나 공개 게임플레이 검수 완료를 선언하지 않는다. 새 생산 수정·master/Pages 배포 없음.

## 상태 불변성
34·38장은 4프레임 전체 battle JSON 동일.
37장은 실제 Scene 연결이 liveWater 표시 조건이다. 첫 프레임의 공식 초기화 observed={} 및 signalExposure=0만 명시적 계약으로 확인했다. 첫 프레임 renderPure=false, 이후 3프레임 전체 상태 동일. 다른 값·배열·receipt·clock·physics 변경은 부정 테스트로 거부한다. 첫 프레임까지 순수했다고 표현하지 않는다.
정상 App 입력, 동적 수위/파괴, 실제 모바일, DPR2, 정량 프레임 성능은 미검수다.

## 무손실 증거
art/act4-middle-scene-20261117/chrome-baseline-evidence.zip
- Artifact14352115671, 2,704,216 bytes
- ZIP SHA256 6fdd4e6d18dd8d39b219a92e709baed13b8448ea7b325baa167f15d0fdbb6015
- Git blob dc0d3dd154764023aa4a63e14b3cb0029661ec6a (로컬 git hash-object와 일치)
- stage34-focus-desktop-3.png SHA256 58748898e6baa2b9195fb57ab0eb7124c1185f7f74dda7bb1732aee3472248bc
- stage37-edge-detail.png SHA256 5cb99bdfa77b55b88556a8ab3fdeee8c1cde6a6b595736d530cc2cab53c744b8
- stage38-edge-desktop-4.png SHA256 c17557c5bdd3e618f10fd5fa8f3566d12b3dd5cdd398c5db30fb5b30773a429e
각 PNG에 같은 이름 JSON(카메라·물리·runtime 해시·상태·오류 기록)이 동봉되어 있다. ZIP CRC와 PNG 해시 및 실제 픽셀을 확인했다.
