# 11장 승인 미술과 분리 계측 기록

부모는 후보4 미술과 최종 소스 `9b69f1f2`를 검토해 채택했다. 이 브랜치의 승인된 인계 HEAD는 `72a8788f`다. 추가 미술 형태 변경은 하지 않는다.

기존 전체 기록·계측 원자료·사진은 [검토 당시 README](https://github.com/sys8994/honro/blob/72a8788f/game/docs/stage11-vector-art-20261022/README.md)와 그 커밋의 evidence 폴더에 Git 이력으로 보존한다. 현재 checkout의 자동 상세 결과/사진은 AGENTS 지침에 따라 `_local/archive/stage11-reviewed-evidence-72a8788f/`로 옮겼다. 이번 통합 결과와 기존 원자료를 같은 실행으로 취급하지 않는다.

부모가 인정한 기존 고정 분리 계측의 한계는 다음과 같다.

- 정상 screen hit의 재질 호출 0, 최대1.65 직접 draw에서 큰 지속 비용 회귀 근거 없음.
- 첫 준비 전체 중앙값의 남은 증가는 서쪽 +4.15ms, 중앙 +2.75ms, 피난처 +8.05ms다. 전체/재질/prepare 시간을 구분한다.
- 이는 고정 Canvas 제출/캐시 경로 계측이다. 동적 FPS 개선·GPU 완료시간·정상 장기 전투·실기기 성능으로 과장하지 않는다. master의 실루엣 개선을 이 미술의 성과로 주장하지 않는다.

최신 master의 실루엣 개선과 BGM을 함께 보존한 최종 소스/빌드·짧은 검사·사진 전달은 [최종 통합 기록](../bgm-stage11-release-20261022/README.md)을 따른다. 승인 재질의 6개 PNG hash만 `tests/fixtures/stage11-approved-material-pixels.json`에 검사 입력으로 남겼다. 이번 통합에서는 긴 기존 계측이나 전체 장 검사를 반복하지 않는다.
