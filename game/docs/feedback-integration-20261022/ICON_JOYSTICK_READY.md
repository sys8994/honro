# 아이콘 캐시 + 조이스틱 독립 배포 체크포인트

완료. **실제 실행·빌드 SHA: `8f4cfa683fec9e181281a7659661c76a2a16613d`**. 이 문서 도입 커밋은 검사 증거·문서만 추가하므로 같은 런타임이다. 부모는 이 문서 도입 커밋까지만 master에 통합해 독립 배포할 수 있다. 이 브랜치에서 master/Pages에는 쓰지 않았다.

기준 master `c0e323ff3df9c5f4120e48d470c8ca80c679c57e`와 아이콘 완료 입력 `f35fa61de2d9f52c0e38bc8fc8d7b64c55d71654`(runtime `c04218e4f4761b2d19e457131aae2e2a85fae3a6`)만 병합했다. 미완료 여정첩 후속은 포함하지 않는다. BUG_LOG 양쪽 기록을 보존했다. 생성 파일 충돌은 기존 master 기준에서 **통합 소스의 정상 `npm run build`**로 재생성했다. 소스/manifest 해시는 [source.json](evidence/icon-joystick/source.json).

## 검사

- build, game typecheck, web-split 347개 생성 자산, skill-image-icons 84개 원본/수치/이름/효과, camp-persistence 11개, camp-skill-ux 통과.
- joystick-intent 초기 120건 + 전환 380건, charge-input 126건 통과.
- 실제 Chromium 154.0.8037.57: trusted CDP touch → 실제 PointerEvent/포인터 캡처/생산 frame 경로. 320×740, 360×800, 390×844, 844×390에서 총 371개 판정 통과. 상하·좌우 19/20/21° 드래그, 섹터 이탈 즉시 이동/재진입 정지, 초기 수평 의도, 취소·발사 멀티터치·키보드 포함. [결과](evidence/icon-joystick/drag/sector-results.json), [로그](evidence/icon-joystick/browser.txt).
- 실제 통합 빌드에서 30회 클릭 + 30회 갱신: 버튼/아이콘 identity 4/4 유지, 노드 추가/제거 0, SVG 재노출 0, src 변경/decode/resource 추가 0. 장착 순서·기력 부족·스킬 잠금·검사용 cooldown·모닥불 재사용·오류 폴백/재시도 통과. 기준 master는 노드 추가/제거 각 240, identity 소실. [결과](evidence/icon-joystick/icon-results.json).
- `node game/tests/regressions.mjs`는 Stage 8 `bier-knot-0: 2520,3750.4`에서 실패. 기준 master detached worktree에서 동일 실패를 재현했다. 테스트를 수정·삭제하지 않았다. [통합](evidence/icon-joystick/regressions.txt), [기준](evidence/icon-joystick/regressions-baseline.txt).
- 기존 지도 이미지·설정 전체화면 위치/체크박스·사각 아이콘 CSS와 원본은 변경하지 않았다. 최종 [HUD 390×844 JPG](evidence/icon-joystick/hud-390x844.jpg)를 직접 열어 사각 테두리·기예 4칸·조작부를 확인했다. 드래그 JPG도 같은 최종 빌드의 실제 렌더러 캡처이며 모두 1MB 미만이다.

## 한계

허공터/프로필 fixture, deterministic 생산 frame 진행 및 Chromium 터치 에뮬레이션이다. 전체 30장 정상 완주·실물 모바일·Safari·공개 Pages는 검사하지 않았다. 최초 이미지 준비/실제 네트워크 오류의 벡터 폴백은 의도한 동작이다. 부모가 최종 픽셀과 master/Pages 배포를 확인한다. 이후 보고서·여정첩·엔딩 후보 통합은 별도 후속 커밋으로 진행한다.
