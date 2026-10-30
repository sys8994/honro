# Stage22 별도 시각 검수

검수일: 2026-10-15. 판정: **사용자 미술 검토용 초안으로 제시 가능. 최종 미술 승인 및 정상 전투 완료 판정은 보류.**

## 검수 역할과 범위

이 검수자는 미술 생성 코드를 작성하지 않았고 아래 PNG의 실제 픽셀을 열어 비교했다. 단, F 서측 마당의 상단 지형과 DF/FD 경로 변경에는 직접 참여했으므로 지형 구현 전체에 대한 완전히 독립적인 검수자로 간주해서는 안 된다. 새 F/G 하단 실루엣은 다른 구현자가 수정한 뒤 확인했다.

## 전후 결과

- 기존의 조밀한 가로 석축과 매우 긴 건물 기둥이 줄어 건물·적·통로가 더 잘 구분된다. 기록고의 핵심 수직 구조는 유지된다.
- 추가 수정에서 F의 뾰족한 삼각 하단과 G의 긴 직선 밑면이 넓은 불규칙 암반 어깨로 바뀌었다. 첫 초안의 거대한 사다리꼴 판 인상이 완화되었다.
- F 서측 두 경사 사이의 짧은 평탄부가 확대 화면에서 확인된다. 상단 이동면과 아래쪽 석축 장식은 구분된다.
- 모바일 서측 PNG는 이제 실제 서측 경사를 보여 준다. 앞선 잘못된 시작마당 캡처 문제는 해소되었다. browser/report.json은 요청 카메라와 actualCamera를 함께 기록한다.

## 남은 제한과 승인 전 판단

- 확대하면 큰 단색 다각형과 굵은 전경 외곽이 여전히 두드러진다. 암반의 자연스러운 접합과 깊이 표현까지 완성되었다고 평가하지 않는다. 개선은 확인했지만 이 절제된 벡터 형태가 원하는 완성도인지 사용자 미술 판단이 필요하다.
- 모바일 화면에서는 암반 면이 넓은 비중을 차지하고 위쪽 목표는 미니맵/화면 가장자리와 겹쳐 일부만 보인다. 모든 목표가 한 화면에 보여야 한다는 의미는 아니며, 이 한 장으로 모바일 이동·전투 가독성 전반을 통과 처리할 수 없다.
- 서측 desktop/mobile 이미지는 수동 카메라 검수 장면이다. 조작 캐릭터가 새 마당에 실제로 도착하거나 왕복했다는 브라우저 증거는 아니다. 현재 화면 밖 목표 안내도 남아 있다.
- 정상 자원 전투, 적 군집과 증원의 실효성, 전체 목표 완료 및 저장 복원의 이번 버전 통과 여부는 본 검수에서 판정하지 않았다. 사용자 미술 승인도 아직 없다.

## 재실행한 지형 검사

현재 소스에서 stage22-vertical-traversal.mjs를 각각 --route=DF --class=knight, --route=FD --class=knight로 실행했다. 두 실행 모두 전체 authored walk segment의 headroom 검사와 해당 왕복 경로를 통과했다. DF 이동 비용 1408.2, FD 1409.2. 적을 제거한 단일 캐릭터의 기본 이동/점프 검사이며 정상 전투는 아니다.

원시 결과: /tmp/stage22-route-review-df-final/, /tmp/stage22-route-review-fd-final/. 이 경로는 executor 로컬이며 브랜치에 포함된 증거 파일은 아니다.

## 직접 확인한 이미지 SHA-256

- [before/after-overview.png](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage22/before/after-overview.png): `84c0613a7633019ea804954980c4c00085449134c5e5933c656082d6fb5dd06f`
- [after/after-overview.png](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage22/after/after-overview.png): `8cbf6e2dc6abbd6fe3196e07aac82ea52c695afac34652f394ddb8e6620b0c3d`
- [after/after-register-ascent.png](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage22/after/after-register-ascent.png): `9807b51678b30b509a7cd7fc19c99f68aee498e57d11561bf06b9098ea166d5a`
- [browser/after-desktop-west-court.png](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage22/browser/after-desktop-west-court.png): `c5de45e54d0ef754311e5058ff34f718f3767f4273c1211c4dfa160a5abd7a7a`
- [browser/after-mobile-west-court.png](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage22/browser/after-mobile-west-court.png): `2e9bc3b33b6c1283bd6d13c106a09a8a968963d50e6df6d8a287c3d2a3680e80`

검사 지형 소스 SHA-256: `642ad2e47b963b9ceb85cdec63fc31efe9c9237c15d8e4e29236298983be22c1`
