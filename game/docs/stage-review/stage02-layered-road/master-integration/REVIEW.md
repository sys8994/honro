> 이후 사용자 실플레이 지적으로 전략 지형의 퇴보와 공중 배치 문제를 재검토했다. 이 문서의 승인 범위를 지형 전체의 전략적 합격으로 해석하지 않는다. 교정 후보와 새 정상 완주는 [2장 전략 지형 복원 검수](../../stage02-road-strategy/REVIEW.md)에 있다.

# 승인된2장 통합 검증

부모가 직접 검수한 d03ca76c를 master edf712e9 위에 통합했다. 렌더 merge는6ec0e32b이며 실제 런타임/생성 manifest는 승인 후보와 바이트가 같다.5장 진단·12장 후보는 넣지 않았다. 원본 다른29장과 기존 Library, 스킬UI·미리보기·엔진·23장 저장 검사 소스는 master와 같고 미리보기 등록 수는84다. 정확한 해시는 checks/preservation.json과 SOURCES.json에 있다.

실행: build, web-split, stage2-layered-road, stage2-layered-save --stage2-only, stage2-layered-play-evidence, stage2-layered-art-invariants. save 검사의 새 선택 옵션은 기존 다른29장 native sweep만 생략하며 기본 실행과 원래 assertions는 보존한다. 다른 장 실제 플레이/전체30장 화면 검수는 실행하지 않았다.

fresh 상여x180/설오x290, 실제 고지 화살 명중, 의도한 하강과 연속 전면 도로 이동, author 재실행, 이전 master revision6 저장의 성장/SP/장착 보존과2장만 재시작, 현재 Continue 자원/배치 보존을 확인했다. 실제R3와 기존 정상R21 승리 저장은 현재 Scene으로 렌더하고 상태 불변/캐시 재사용을 확인했다. 실제 브라우저에서 새 진입·R3 Continue·기존 승리 저장의 중복 없는 보상/담허 합류·쉼터·3장 진입을 확인했다.

정상 자원21라운드 완주 증거는 기존 실제 플레이 기록을 재사용했다. 이번에 전투21라운드를 다시 실행한 것이 아니다. 기록된 고지 사격/7개 하강 목표/기존5개 이벤트/상여4100도착/공중 적 이동과 queue상한3을 재검사했다. R21 PNG는 그 실제 승리 저장을 복원한 현행 렌더다(영웅HP376, 상여HP1700). 합성 finite route 검사는 정상 전투 승리와 구분한다.

visual의 전체/일반/모바일3장과 navigation의 실제R3 및 R21 화면을 직접 열었다. 이미지 생성/래스터 편집은 없다. 보존한 나머지 UI 캡처는 기존 검증 스크립트의 보상/쉼터/다음 장 증거다. 핵심 앞 도로/뒤 절벽 분리와 보행면/지지 접합의 승인 범위를 반영하며, 전략 다양성·미술 완벽·전 지형 문제의 영구 해결을 주장하지 않는다.

발행 상태는 별도로 확인한다. Actions 목록 CLI 조회(gh run list, sys8994/honro)는 Forbidden으로 거부되어 재시도/우회하지 않았다. 이 기록은 로컬 통합 검증이며 Git push 성공·Pages 실행 성공·공개 화면 검증은 서로 구분해 최종 결과로 보고한다. Pages 설정 API는 호출하지 않는다.

## 원격 반영과 공개 확인 제한

검증 및 증거 커밋445579d7bf3aa229f7e3821f3edf67f14f87a244를 기존 master edf712e9에서 비강제 push했고 ls-remote로 같은 SHA를 확인했다. 이후 추가되는 이 발행 기록은 문서/검증 결과만이며 런타임과 빌드 산출물은 바꾸지 않는다.

공개 Pages `https://sys8994.github.io/honro/`에 새 Chromium으로 한 번 일반 접속했으나 `net::ERR_TUNNEL_CONNECTION_FAILED`로 문서를 받지 못했다. 재시도·대체 경로·Pages 설정 API 호출은 없다. Actions 목록 조회의 Forbidden과 이 공개 연결 실패 때문에 이번 master의 Pages run ID/완료 상태 및 공개 화면은 **미확인**이다. Git master 반영 성공을 배포 성공으로 간주하지 않는다. 정확한 공개 시도 결과는 checks/public-check.json에 보존한다.
