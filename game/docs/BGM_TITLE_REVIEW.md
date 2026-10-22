# BGM 표시 제목 — 2026-10-22

사용자의 새 첨부 파일명에서 대괄호 분류 뒤의 곡명을 표시 제목으로 사용한다. battle 6의 여분 `]`는 표시 제목에서 제거했다. MP3 ID3·음량·원본 바이트는 편집하지 않는다.

| 원본 첨부 파일명 | 현행 파일 | 첨부 Git blob |
|---|---|---|
| [main theme] 혼로.mp3 | `main.mp3` | `12fa25bef170b60de432272743efe44b16bdd50d` |
| [battle 1] 장막 너머의 음.mp3 | `battle-1.mp3` | `2b3ff078d462f90e305254a331c1b1f4e68abc36` |
| [battle 2] 하늘의 그림자.mp3 | `battle-2.mp3` | `051618688414ba24857652d56a7e5998acc713ac` |
| [battle 3] 산 자와 남은 자.mp3 | `battle-3.mp3` | `9453899607e80e5582b5b16a06f82d427baa4f7d` |
| [battle 4] 불길의 춤.mp3 | `battle-4.mp3` | `60a45c9b9be5a45fe3a24477ce57c18310122083` |
| [battle 5] 암막.mp3 | `battle-5.mp3` | `6dda465e00296d8d45735d9b684080d01da72816` |
| [battle 6] ]불완전한 의식.mp3 | `battle-6.mp3` | `9f72159db7d34b1845c8e3f0a526986653ea46c7` |

파일·막별 매핑과 최종 검증 범위는 [현행 BGM 목록](../../assets/bgm/README.md)에 있다. [청취 페이지](../../tools/bgm-title-review.html)는 같은 JSON의 7개 제목과 경로를 읽고 preload=none으로 곡별 사용자 재생만 요청한다. 한 곡을 재생하면 다른 곡을 정지한다.

전송 실패는 부모가 첨부 원본 바이트를 Git으로 전달한 `9de282ea`에서 해결됐다. 개인 Library ID는 현행 메타데이터에서 제거했다. 원본 출처는 이 표의 파일명과 해시로 식별한다.

7개 전체 decode·메타데이터 확인과 브라우저의 짧은 실제 스트리밍 검사를 전곡 청취·악기/선율 판단·정상 캠페인 완주와 구분한다. 과거 5곡 분석·검수는 Git 이력과 2026-10-21 evidence의 역사 기록이다.
