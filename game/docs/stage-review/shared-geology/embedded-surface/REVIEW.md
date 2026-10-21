# 매립 암턱 중복 칠 제거 — 좁은 수정 검토

실행 소스 ad86ac0b0326b4bc4d7598eae0913d080af26c66, 이전 후보 bbe8acea8fa403b1f16df31a86dbae4c1f6d2069. master/Pages에는 반영하지 않았다.

공통 인스턴스의 surfaceAttachment.mode=embedded와 자산의 surfaceCoverage.rootPath로 실제 불투명 지지 몸체를 지정한다. geology-art.js는 그 몸체가 이미 덮는 부분에서만 물리 slab 중복 칠을 생략한다. 지원 범위 밖의 노출부 및 exposed 면은 기존 공통 재질로 채우고, 실제 walk rim은 그대로 그린다. 겹친 각 몸체의 바깥을 독립적으로 clip해 겹침이 구멍으로 취소되지 않게 한다. coverage/exclusion Path2D는 캐시한다. 장 번호/지형 ID 렌더 예외는 추가하지 않았다.

SVG 형상·소켓 위치·배율·물리 polygon·상면·통과성·목재 표현·시나리오는 변경하지 않았다. 공통 자산 등록에는 coverage 메타데이터만 추가했다. 장식 배치 version3은 이전 동일 revision Continue에도 새 메타데이터를 렌더 뷰로 읽게 하며 저장을 수정하지 않는다.

직접 연 화면은 after의 동일 서/동 근접·일반·전체·모바일 영웅/전체6장과 같은 실제3라운드 Continue 한 장이다. before에는 이전 후보의 서/동 근접·전체·같은 Continue 원본을 바이트 그대로 보존했다. 서쪽의 사각형 덧칠 경계가 없어졌고 지지 밖 동쪽 노출 가장자리는 재질이 남는다. 일반/전체/모바일에서 상면 rim과 영웅의 보행 위치를 확인했다. 부모의 최종 픽셀 판단은 대기하며 전체 스테이지 미술 합격으로 확대하지 않는다.

6장 캡처 당시 미커밋 내용은 위 실행 소스와 해시가 같다. 이후 깨끗한 ad86ac0b HEAD에서 서쪽 근접을 다시 찍은 capture-committed.json과 stage02-embedded-ledge-close.png를 추가했다. 그 PNG는 앞서 직접 연 서쪽 결과와 바이트까지 동일하다. 모든 PNG는 실제 렌더 원본이며 이미지 생성/편집이나 새 자산 제작은 하지 않았다.

검사: build, web-split, geology-composition, 기존 stage2-layered-art-invariants를 실행했다. fresh/실제R3/기존R21 렌더 상태 불변, warm Path2D 할당0, 정지 캐시 재사용을 확인했다. 좁은 coverage 검사에서는 실제 cap의 지원 내부(x1000,y1242)가 덧칠되지 않고 노출부(x828,y1222)는 불투명하게 채워지는지 확인했다. 겹친 지원 몸체가 취소되지 않으며 explicitly exposed 면은 계속 그려진다. 목재 surface PNG 해시는 이전 후보와 완전히 동일하다. 합성 coverage 검사는 실제 플레이 승리로 취급하지 않는다.

같은 정상 자원 R3 저장의 Continue 대표만 다시 확인했다. 전체 전투/보상/다음 장/전30장 검수는 반복하지 않았다. 기존21라운드 정상 승리 근거는 보존한다. 새 미술 전체 통과/배포/공개판 검증을 주장하지 않는다. 정확한 소스·PNG·검사 결과·Library 식별자는 동봉 JSON에 기록했다.
