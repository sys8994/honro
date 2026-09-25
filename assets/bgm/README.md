# HONRO BGM Integration Task

`assets/bgm/`의 MP3 5개를 현재 HONRO 게임 소스에 통합한다. **파일명은 추측하지 말고 실제 폴더를 확인한 뒤 숫자 prefix 01~05 순서로 식별**한다.

## 역할
- **01** Main Theme: 메인 화면, 월드맵, 스킬/설정 등 비전투 상태
- **02~04** Battle Theme A/B/C: 일반 전투 playlist
- **05** Boss Theme: 보스 등장 이후 전투

## 재생 규칙
1. 일반 전투는 `02 → 03 → 04 → 02 ...` 순차 재생.
2. 스테이지가 바뀌어도 battle playlist index를 유지해 특정 곡만 반복되지 않게 한다.
3. 보스 등장 시 현재 battle BGM을 짧게 fade-out/crossfade하고 05로 전환한다.
4. 비전투 UI 사이에서는 01을 매번 처음부터 재시작하지 말고 계속 유지한다.
5. 전투 종료 후 비전투 상태로 돌아오면 01로 자연스럽게 복귀한다.

## 구현 원칙
- **backend 없는 standalone static web game** 구조 유지.
- MP3를 HTML에 base64로 넣지 말고 `assets/bgm/` 외부 asset으로 참조.
- 긴 BGM은 `AudioBuffer`에 전부 decode하지 말고 **HTMLAudioElement 기반**으로 재생.
- 첫 로딩에 모든 BGM을 강제 preload하지 않는다. 현재 곡과 필요 시 다음 곡 정도만 준비.
- 브라우저 autoplay 제한을 고려해 **최초 사용자 입력 후 playback을 unlock**.
- 기존 사운드/설정 시스템이 있으면 새 시스템을 중복 생성하지 말고 통합.
- 곡 전환 시 클릭/끊김이 없도록 짧은 fade/crossfade 적용.
- 파일 누락/재생 실패가 게임 진행을 막지 않도록 fallback 처리.

## 검증
데스크톱/모바일에서 직접 테스트:
- 최초 입력 후 정상 재생
- 비전투에서 01 유지
- 일반 전투에서 02~04 순차 반복
- 스테이지 변경 후 playlist index 유지
- 보스 등장 시 05로 자연스럽게 전환
- 전투 종료 후 01 복귀
- BGM 중복 재생 없음
- BGM 로딩 때문에 렌더링/입력이 지연되지 않음

기존 게임 구조를 최대한 보존하고 필요한 범위만 최소 수정한다.
