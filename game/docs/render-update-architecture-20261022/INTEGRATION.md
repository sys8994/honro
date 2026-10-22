# 마지막 통합 · 2026-10-22

브랜치 `integration/render-update-release-20261022`. 원격 master `a091c6bd5e64eff748f5028fb6d0080faea3da87`를 다시 확인한 뒤 아키텍처 최종 `546f3e1ffcf41e1facc50db99495dad4d36b2ddc`를 fast-forward했다. 별도 성능 브랜치 전체를 병합하지 않고 source-only `b8487309`를 `d0db99ad`로 cherry-pick했다. source3줄과 실제 Engine lifecycle/browser 검사만 포함한다.

이 통합에서는 settledHits 정리가 포함된다. [이전 아키텍처 보고서](README.md)의 '별도 통합 대상' 문구는546f3e1f 당시 상태다. [연속 전투/참조 경계 기록](../battle-runtime-performance-20261022/CONTINUOUS_AND_REFERENCES.md)의 f8 실행 수치·사진·manifest는 역사적 증거이며 새 통합 빌드의 실행 수치가 아니다. 문서에서 직접 참조한 증거와 재현에 필요한 round1 fixture/continuous 도구를 선택 보존했다. 오래된 generated HTML/web는 가져오지 않았다.

원래 점증 렉은 미재현/미해결이고, 일반 pause/DOM의 확정된 중복 작업 제거와 작은 조건부 참조 정리만 채택한다. 새 실루엣/궤적/지형 미술 변경은 없다. master/Pages는 부모 최종 확인 대상이며 이 브랜치에서 변경하지 않는다.

공통 build와 통합 집중 검수 결과를 아래에 추가한다. 긴3회 성능 표본은 같은 렌더 아키텍처의 기존 최종 결과를 보존하고 다시 반복하지 않는다.
