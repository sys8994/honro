# 8장 쉼터 — 창고 앞 길목

2026-10-18. 승인8장 전투 v2 `6b3a970bfafc6be8047b84b94d20c97018eb6621`을 최신 master `967bf02273f7991510df8d065ca8a00ecf804b3f`에 병합·push했다. 승인 tree와 같아 build/전투 검증은 반복하지 않았다. [Pages39165814713](https://github.com/sys8994/honro/actions/runs/39165814713)은 해당 master SHA/completed/success다. 공개 실제 화면은 부모가 확인한다.

이 master에서 `art/rest-stage8-location-paint-20261018`을 분기해8장 쉼터만 작업했다. 부모 실제 화면 검토 전 쉼터는 master에 반영하지 않는다.9장은 미착수다.

## 구도와 보존 계약

- journey-content의 주민들이 빠져나간 뒤 빈 상여가 있는 창고로 들어가기 전이다. 전투 완료 장면·상여 boss·큰 결박·새 NPC 군중을 넣지 않았다.
- 전투와 같은 창고 WebP를 원래1536:580 비율 그대로1500×566.40625, x-880/foot725에 배치했다. 실제 화면에는 닫힌 오른쪽 문·처마·모퉁이가 보이고 열린 가운데 칸은 왼쪽 화면 밖이다. 낮은 돌기초와 흙길이 중앙 모닥불 마당으로 이어진다. 반대쪽은 낮은 바위턱과 조용한 산 원경이며 전투의 큰 암굴을 복제하지 않는다.
- 새 이미지 자산 없이 bierStore8/forestRock/forestSoil/forestFar만 쓴다. 근거리 목재·돌은 전투와 같은 그림, 공유 mountain-dusk는 낮은 채도/대비다. SVG markup은 기존 cache에 한 항목으로 보존하며 새 RAF·모션은 없다. 기존 모닥불·배우 idle은 유지한다.
- SVG1600×900, fire anchor800/745/ground765, 동행과 모닥불 버튼/대사/성장/SP/진행 로직은 그대로다. 중앙 동행·모닥불·하단 버튼 주변을 비웠다.8장 surface scene 분기만 추가했다.
- 모바일 첫 framing은8장만 zoom.94/x최대85/y기존bounds로 제한한다. 창고 오른쪽 가장자리와 세 동행·모닥불이 함께 보인다. 이후 기존 패닝/중앙복귀/줌0.9~1.35는 그대로다. 현재 장 우선 loader와 전투 코드는 변경하지 않았다.

## 최소 확인

build, 실제 Chromium1440×900 데스크톱/390×844 모바일2뷰, 모바일 양끝 패닝·중앙복귀·줌·모닥불 클릭만 확인했다. pageerror0, pan 중 profile 불변, 모닥불 클릭은 기존 camp 화면으로 진입한다. 모바일 동행3개와 fire 버튼은 화면 안이며 하단 action과 겹치지 않는다. 창고 이미지 비율2.6482758620689655, 최초 모바일 창고 bounds 오른쪽140.89px로 일부가 보인다.

쉼터 진입 전 창고 요청0→진입 후1, chapter-08 데이터 요청0, 무관4/5장 건물·물·절벽 요청0이다. 새 나무 모션 hook/전투 UI/폭포 hook0이다. 전투·성장·기예·상여 이벤트·저장 호환 검사 및 다른 장 검사는 반복하지 않았다.

증거 `_local/reports/rest-stage8-location-paint/{build.log,checks.json,capture.log,library.json,rest8-desktop.png,rest8-mobile.png}`.

## Library 실제 화면

- rest8-desktop.png: `libfile_702034de1d20819195e2071d06325197`, version0
- rest8-mobile.png: `libfile_8977c3ba8adc819185c10babb3532255`, version0
