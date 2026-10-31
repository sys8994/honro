# Published runtime source synchronization / 배포 런타임 소스 동기화

Commit `cc33f68a` published the compiled game and Workshop before its matching source was synchronized. Commit `f86d149de3d39e46b613cd4ab5b03f7aab77c2d7` restores the preserved matching runtime sources and the exact Act 4 world from verified source parts. A normal build reproduces all 732 active published files and all 40 chapter JSON objects; see [the recovery and verification record](game/docs/ACT4_PUBLISHED_SOURCE_PARITY.md).

This restores source/build parity for the existing published game. It does not introduce the later Act 4 art candidates, establish full mission or art approval, or claim that every historical authoring asset and review record has been synchronized. The Stage 31 release guard still requires evidence for a changed stage.

기존 배포본의 런타임 소스와 4막 월드 원본을 복원해 정식 빌드 결과가 배포된 활성 파일 732개와 일치함을 확인했습니다. 새 미술 후보의 배포나 4막 전체 플레이 합격은 아닙니다. 과거 제작 원본·검수 기록 전체가 동기화됐다는 뜻도 아닙니다.
