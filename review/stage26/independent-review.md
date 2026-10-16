# Stage26 독립 검수 — 2026-10-15

판정: 사용자 미술 검토용 초안으로 제시 가능. 정상 전투 및 미술 승인 아님.

검수자는 Stage26 구현에 참여하지 않았다. stage26-witness-place.mjs, stage26-place.mjs, focused.json을 읽고 아래 전후 PNG 실제 픽셀을 확인했다. 이 보고서만 작성했으며 새 전투·브라우저 실행은 하지 않았다.

## 확인 결과

- 기록실의 묘역 지붕, 낮아진 작업마당, 높은 주민 피난처로 공간의 기능이 구분된다. 22장의 수직 기록고 반복과는 다른 지면 중심 구조다.
- 작업마당의 상단 통로는 국소적인 선택 경로이며 하단 작업 공간과 분리된다. 화면에서 두 층의 적과 접근 사면이 읽힌다.
- 피난처는 소규모 초가와 주민으로 표현됐다. 공방에 거대한 종 거푸집은 보이지 않는다. 생성기에도 종 주조 역사 결론이나 새 선택 문서 UI는 추가되지 않았다.
- 기록실과 공방의 모바일 이미지는 해당 위치를 보여 준다. 현재 목표가 화면 밖에 있다는 안내가 남은 수동 카메라 검수이며, 실제 조작 캐릭터의 도착 사진은 아니다.
- 기존 목표 배열 보존 검사가 있고 실제 NPC와 casting-tally 마커는 같은 피난처 평탄부로 이동한다. 집중 검사에서 NPC 부근의 실제 actor 소유 기록과 반복 tick의 목표 불변을 확인하는 구성이 있다. 제어된 위치 설정을 이용한 검사이므로 정상 이동 중 습득의 증거와 구분된다.

## 발견한 보완점과 남은 제한

- 최초 focused.json/테스트는 knight만 검사했고, 상단 양방향 경로가 반대쪽 경사 위에서 종료되어 지면으로 실제 이탈하는 데까지 입증하지 않았다. 담당자에게 occultist 포함 및 반대편 지면 이탈 검사를 요청했다. 아래 재검토 기록에 최종 증거 상태를 덧붙인다.
- 상단 길은 길고 얇은 직선 판으로 읽힌다. 공방 하부 기능은 개선됐지만, 이 길이 전술적으로 과도한 고지 이점을 주는지는 실제 정상 자원 전투의 군집·파동별 기록으로 판단해야 한다.
- 지형 전면은 큰 단색 면이 많고 새 피난처의 측면 벽은 단순한 사다리꼴 형태다. 개선 초안이지 미술 완성을 독립적으로 승인한 것은 아니다.
- 기존보다 작업마당이 깊어져 접근 사선과 적 행동이 달라진다. 적 수량·목표 불변만으로 군집 역할이나 증원 실효성을 보존했다고 볼 수 없다.
- 세이브/Continue, 두 동행의 정상 자원 전체 완주, 각 파동의 첫 실효 행동, 최고점 장거리 정리 가능성은 이 검수에서 판정하지 않았다. 사용자 미술 승인 대기 상태다.

## 직접 확인한 PNG SHA-256

- [before-desktop-overview.png](before-desktop-overview.png): `f9c7e75a76a627004835a776986d73d176f92b8604ed09cf75ec70c440295b1e`
- [after-desktop-overview.png](after-desktop-overview.png): `1d2f3c7abaa4d4433afcb17557446eb87224cd1b5faf973d929eb131eeefd03e`
- [after-desktop-workshop.png](after-desktop-workshop.png): `f4b3bf436368f79b2a1ea772df3d9934ec0feaa572860530f2a566eccc2a476c`
- [after-mobile-workshop.png](after-mobile-workshop.png): `3be7e78915a0aa258028f0105e8bcc1bb501b2a5688ec4f97394f0a9e5e1d033`
- [after-desktop-record-room.png](after-desktop-record-room.png): `dddf10ba023085f4182658dcdb2527e330b5dddd17d9542aad98dd9a160c04b3`
- [after-desktop-refuge.png](after-desktop-refuge.png): `c353fe7406276aea934745918951ecfa8c0c7015617ffe4237584ac08c411d67`
- [before-mobile-record-room.png](before-mobile-record-room.png): `2a46494918f9d7a43aa99c8054eadc3c08d1fdad955af5a41acf0bf5b5ccfc25`
- [after-mobile-record-room.png](after-mobile-record-room.png): `e5aea1a4c44cadc55bf3f60def6f5bac3db7dd0306855aa312148f6e138a5911`

생성기 SHA-256: `07c1394d19915cad6c84ec16fa9365425da27fe2076d3c2f5ac048e42c55175e`
