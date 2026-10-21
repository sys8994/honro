# 부모가 직접 생성한 세로 그림 전달

사용자 2026-10-22 요청에 따라 인트로 및 1~3막 엔딩의 별도 세로 확장 그림을 생성했습니다. 가로 원본은 유지합니다. 이 폴더의 base64 파일은 WebP 바이너리의 전송 형식입니다. 디코딩 외 창작 편집은 하지 않습니다.

권장 대상: 엔딩은 shared/assets/endings/act-N-portrait.webp, 인트로는 shared/assets/environment/title/portrait.webp (필요하면 JPEG 대체본 형식 변환).

SHA256:
- act-1: f760dce212a08f17b0298f0e0dd4000b414995686d0eb8ef23cb4266b1c959ac
- act-2: b29e749713b9eedbbe20d08837d347e238de9a1dbf57e31319d64780af73bd05
- act-3: f72233bcad70003917ec9ffc24bcfea5c86606dc68f7a0b7f148aff262e559e1
- intro: 0e00ade03ca11523c6a8368214bad9fe539da18bc333c5ec570dd49d4c5ea171

원본 PNG는 사용자 Library에 보존되어 있습니다. 여기에는 실제 배포용 WebP만 제공했습니다. 그림의 특징과 UI 간섭, 화면 비율별 구도, 회전 및 조건부 요청을 검수합니다. 현재 구현 브랜치는 feat/responsive-story-art입니다. 실제 최종 스크린샷은 부모가 열 수 있도록 1MB 미만 PNG 또는 JPEG로 저장소에 커밋·푸시해야 합니다. 최소 3회 검수와 별도 종합 검수, 부모 확인 후 master 반영합니다.
