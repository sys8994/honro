# 보존 지점 r26 — 미술 미승인

연결 중단 알림 뒤 실제 로컬 파일·명령·원격 읽기 성공을 확인했고 유실 없이 같은 브랜치에서 이어갔다. 서버 로그 접근은 없어 중단 원인을 단정하지 않는다. 보안·네트워크 설정 변경 없음.

나루: 원본 16차 `2d432127c7c3f16dd8cb748048853601c99fdc37`의 A/B/C SVG를 각각 한 번만 쓰고 103.5/80 배율을 유지했다. 실제 native path를 절리와 매몰 경계로 clip하며 C를 두 암반 아래 겹쳤다. 옆 흙 둔덕과 앞 퇴적면으로 사각 발을 덮고, 길의 표면 띠는 가변 폭으로 줄였다. 회청색 면은 회갈색 계열로 보정했다. 근경 래스터·필터·새 엔진/프레임워크 없음.

- [나루 정상](evidence/ferry-outcrop-r25/stage03-normal.png) · [광역](evidence/ferry-outcrop-r25/stage03-wide.png) · [모바일](evidence/ferry-outcrop-r25-mobile/stage03-mobile.png)
- [성문 정상](evidence/ferry-city-r24/stage21-normal.png) · [광역](evidence/ferry-city-r24/stage21-wide.png)
- [숲 정상](evidence/bearing-canopy-r26/stage01-normal.png) · [광역](evidence/bearing-canopy-r26/stage01-wide.png) · [수관 정상 배율](evidence/bearing-canopy-r26-crown/stage01-normal.png)

성문: 실제 gate:collision:0 polygon에만 받침돌 15개·홍예돌 11개·국소 접촉/측면을 그린다. 원래 홍예 개구·계단·보행 지붕을 보존했다. 숲: 수관 5개를 각 5곡면과 일부 열린 아래 가지 공간으로 바꾸고 지지 가지를 추가했다. 줄기·뿌리의 기존 경사 기준은 보존했다.

판정은 미달이다. 나루 큰 전경은 비어 있고 일부 암반 끝은 균일한 톱니로 읽힌다. 숲은 반복 거석과 단순한 긴 줄기·수관이 남는다. 도시 전체 전경은 판상이며 성문 재질도 회화 기준에 못 미친다. 이전 후보 r22의 큰 초승달형 흙 면, r23의 흩어진 돌·수풀, r24의 일부 청록색 잔류는 실패 근거와 함께 보존했다. 숫자나 회차를 미술 pass로 바꾸지 않는다.

[각 sourceState·capture receipt·판정 manifest](manifest.json)와 원본 PNG를 연결했고 final=null을 유지했다. r25 나루와 r26 숲은 서로 다른 sourceHash의 집중 검수다. 동일 최종 빌드 전체 검수로 합산하지 않는다. 해당 촬영은 오류0, 전후 sourceHash 동일, terrain/units/markers/events/objectives 불변이다. 공개 gate의 현재 차단은 `Separate final holistic pixel review is missing`이며 접근 거부나 자동 승인 거부가 아니다. 공개 HTML 생성·master 통합·Pages 배포를 수행하지 않았다.

[raw/gzip/sha256 실제 용량](evidence/bearing-canopy-r26/sizes.json). 공통 벡터 데이터 193,819B / gzip44,294B, 나루 소스 7,629B / gzip3,865B, 숲 18,381B / gzip8,972B, 성문 7,483B / gzip3,418B. 별도 quiet-layered 원경 952,722B는 보존했다. 원본 SVG A18,348B/B21,604B/C20,411B이며 해당 데이터는 공통 JSON에 native path로 들어간다. 중복 저장된 저작 원본과 런타임 데이터는 배포 합계로 이중 계산하지 않는다.
