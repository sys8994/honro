# 3·4장 공유 건축 보완

제작 기준은 [SOP v1.0](STAGE_PRODUCTION_SOP.md)이다. 0964be9e의 창고/피란문 임시 뼈대를 보완한다. 이번 변경은 단계 2의 건축 표시와 단계 7의 해당 접점 확인이다. 단계 1/3/4/5/6의 기존 충돌·동선·인물·적·이벤트·대사는 보존한다. 원본 그림을 다시 얹지 않는다.

## 단계 0 — 보존할 설계 카드

| 항목 | 3장 나루의 남은 장부 | 4장 문 밖에 남은 사람들 |
|---|---|---|
| 전후 연결 | 2장 행렬 엄호 → 나루 장부 회수 → 피란문 | 나루의 장부 → 피란문 방어 → 폭포 틈 |
| 기존 목표·전투 질문 | 홍만의 움막에서 장부를 회수하며 나루/창고의 높이차와 접근로 사용 | 피란문을 지키며 마당과 동쪽 높은 사격점 사용 |
| 승패 조건 | 기존 objectives·quest target·stage controller 유지 | 방어 대상 objective 및 기존 방어 controller 유지 |
| 참가 인물 | 기존 설오·담허·휘겸/NPC 및 적 편성 유지 | 기존 설오·담허·휘겸·춘례·피란문 및 적 편성 유지 |
| 크기·수직성 | 4276.8×1779.8, 낮은 나루 → 산비탈 창고 | 3420.8×1177.6, 피란문 마당 → 동쪽 감시루 |
| 주요 접점 | warehouse-roof x3399–4004/y526–656, ledger x3630/y840, cargo-step-2 x3949–4114/y814–843 | gate-roof x395–717/y349–421, objective x584/y571, east-watch x2874–3117/y299–366 |
| 반드시 보존 | ferry-ground, dock-west/mid/east, cargo-step-1/2, warehouse-roof, ledger, 전도 물, 나루 NPC·사격점 | gate-basin, gate-threshold, gate-roof, west-shoulder, burned-gallery, east-rock-low/high, east-step-1, east-watch, objective·습격 이벤트 |
| 변경 범위 | 경사 위 창고 몸체·장부 앞 마루·지붕 처마·접지 기둥·잔교/계단 받침 | 닫힌 피란문 몸체·문간 접지·처마·서쪽 바위턱 받침·탄 회랑·동쪽 감시루/계단 받침 |

## 조립 원칙

- 지붕과 계단의 상단은 기존 one-way 다각형에서 읽는다. 독립적인 새 지붕을 다른 높이에 놓지 않는다.
- 공유 기둥·보·처마·석축을 사용하고 필요한 벽·문·잔교 부재만 공통 registry에 추가한다. 길이를 맞추기 위해 부품을 비균등 확대하지 않는다.
- 앞면의 벽·기둥·받침은 기존 바닥/지붕을 잇고, 출입구와 높은 사격점에는 열린 공간과 마루의 용도를 드러낸다. 장부/피란문 목표는 기존 앞쪽 표시와 위치를 유지한다.
- 탄 회랑은 파괴된 뒤 연결된 받침/난간도 남지 않게 한다. 물 모션·전도 영역은 유지한다.
- 검수는 두 장의 접점·목표 가시성·주변 접근, 정상/넓은 시야와 변경 관련 파괴 표시만 한다. 30장 전수·전체 verify·무관한 전투/스킬 검사는 하지 않는다.

[수정 전 보존 입력](../../review/stage34-shared-architecture/baseline.json)

## 구현 결과

- 3장: 지붕 one-way의 실제 윗선을 따라 창고 지붕·연결 처마를 만들고, 그 아래 경사 지면까지 벽과 세 기둥을 연결했다. 장부 위치의 높은 문간/마루, 동쪽 디딤대의 받침을 추가했다. 나루 접근 잔교·서쪽/중간/동쪽 잔교에는 말뚝과 실제 보에 닿는 장선을 붙였다. 창고 높은 사격점, 장부 marker, 전도 물과 기존 배치는 유지한다.
- 4장: 피란문에는 흙벽 두 칸·목재 문간·기둥·처마·문지방 석축을 연결했다. 기존 방어 대상의 소형 전각 몸체만 `hanok.door.closed`로 표시해 중첩 지붕을 제거했다. 대상 ID/종류/위치/피격 범위/체력/실패 조건은 바꾸지 않고 기존 unitBody 바깥의 UI를 유지한다. 서쪽 바위턱 받침, 탄 회랑 받침/장선, 동쪽 2층 감시루와 발코니·바위 계단 몸체를 연결했다.
- 공통 registry에는 긴 기둥, 벽칸, 열린 판문, 연결 처마, 말뚝, 장선, 닫힌 판문 7종을 추가했다. `architecture.mjs`가 기존 지형 ID에서 지붕·바닥 접점을 읽어 공통 부품을 조립한다. 면은 지도 접점으로 생성하고 재질/장식 경로는 공유 원본을 참조한다. 장별 그림 경로 복사·래스터·비균등 부품 확대는 없다.
- 건축은 기존 static world tile 캐시에 포함되며 sceneVersion/공통 버전별로 컴파일한다. 연결 처마와 지붕은 기존 one-way의 실제 윗선을 유지하고, 천장/벽의 새 충돌을 만들지 않는다. 배경의 열린 문간과 벽 앞 공간은 기존 경로대로 통과한다.

## 단계별 확인과 범위

| 단계 | 이번 상태 |
|---|---|
| 0 설계 카드 | 위 두 카드와 수정 전 입력 기록 |
| 1 지형/동선 | 충돌/크기/routes 원본 동일. 기존 접근면에 둔 실제 Engine.jump/move fixture로 주변 접근 확인 |
| 2 공통 미술 | 창고·잔교·피란문·감시루의 정상/넓은 시야, 접지와 목표 가시성 확인 |
| 3 아군/NPC | 기존 units 입력 동일. 인물 리그/초기 배치 변경 없음 |
| 4 적 | 기존 편성/위치/수량 입력 동일. 새 교전 설계 없음 |
| 5 이벤트 | 기존 events/markers/objectives/initialState 동일. 탄 회랑 파괴 시 관련 건축 group 0개 확인 |
| 6 대사/씬 | 변경 없음 |
| 7 통합 | 정식 빌드 성공. 두 장만 확인. 전체 30장/verify/스킬/완료 플레이 미실행 |

두 장의 렌더 전후 지형·유닛·이벤트·목표는 동일하며 page/HTTP 오류는 0이다. 창고/문 지붕의 낙하 접지 오차는 모두 0 world다. 실제 엔진의 기존 접근면 fixture에서는 3장 `cargo-step-2 → warehouse-roof`, 4장 `west-shoulder → gate-roof`, `east-step-1 → east-watch` 점프가 모두 착지 오차 0으로 통과했다. 탄 회랑 아래 기존 지상 길도 약 79.8 world 이동했다. 이는 변경 주변의 접근 확인이며 두 장 전체 전투·장부 회수·방어 완료를 다시 플레이했다는 뜻이 아니다.

첫 화면에서 발견한 장선 끝의 뜬 접합과 방어 대상의 중첩 소형 지붕을 한 번 보완했다. 기존 지붕 윤곽의 각짐과 일부 넓은 흙 사면/고유 소품의 단순화는 남아 있다. 이번 완료는 두 장소의 건축 연결이며 전체 미술 승인이나 다른 장소의 완성을 뜻하지 않는다.

[확인 기록](../../review/stage34-shared-architecture/checks.json) · [입력 보존/접근 기록](../../review/stage34-shared-architecture/access.json)

- [3장 창고·장부 마루](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage34-shared-architecture/stage03-warehouse.png)
- [3장 잔교](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage34-shared-architecture/stage03-wharf.png) · [넓은 시야](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage34-shared-architecture/stage03-wide.png)
- [4장 피란문·방어 대상](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage34-shared-architecture/stage04-gate.png)
- [4장 감시루·탄 회랑](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage34-shared-architecture/stage04-watch.png) · [넓은 시야](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage34-shared-architecture/stage04-wide.png)
