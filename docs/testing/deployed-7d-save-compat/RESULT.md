# 이전 배포본 7d → 연구 후보 B 저장 호환 검증

## 배포 기준 정정

현재 확인된 더 최신 Pages 배포는 `5b2edf0b868a6f4ab656574b036586304eb12808`이며 [CI44280132384](https://github.com/sys8994/honro/actions/runs/44280132384)가 성공했다. 아래 검증은 이전7d만을 대상으로 하며 **최신5b 저장 호환이나5b 변경을 포함한 출시 검증이 아니다**. 최신 기준의 좁은 통합과 저장 검증은 별도로 필요하다.

## 확인된 결과

실제 Chrome CI [44282130340](https://github.com/sys8994/honro/actions/runs/44282130340)는 성공했다. 검증 당시 선택한 이전 Pages 배포 기준 `7d238d20663c3ceffe430eb0304e01516ae625cf`의 공식 런타임에서 독립 생성한 합성 3·7·32장 전투 저장을 연구 후보 `fdac97818c09536f5d0057181d04fbd60d48df18`의 공식 codec으로 직접 복원했다.

세 장 모두 다음 검사가 통과했다.

- 배포본의 자체 저장→복원 결과가 원래 합성 전투 전체와 동일.
- 후보에서 옛 저장을 직접 복원한 전투 전체의 저장 필드·값이 동일.
- 복원 결과를 다시 저장한 표현이 옛 저장 표현과 구조적으로 동일.
- 두 번째 복원도 옛 전투 전체와 동일.
- 필드 삭제, 값 정규화, 현재 artwork로의 자동 치환 없음.
- 두 런타임의 project 입력 불변, 실제 사용자 저장 접근 0회, 오류 0개.

3·7장은 inline 표현이고 32장은 실제 static provider reference를 포함했다. 32장에서도 별도 표준화를 하지 않고 원래 표현 그대로 복원했다. 두 버전 fresh profile schema는 모두5이며 공식 codec 소스 SHA256도 `3b270b6ca132a70559f1c7691d63d6d8a82ca4bfef5d06c69522c20fe6884f2c`로 같았다. 런타임은 각각 자기 checkout에서 구성했고 App main 진입점만 제외했다. codec/helper/provider를 테스트용 소스로 교체하지 않았다.

## 입력과 재검증

- 실행용 연구 커밋: `dd0ae1fd0d92007336aef1d5bf042995ab5da170`.
- 원본 artifact: `14416224640`, `deployed-7d-save-compat`.
- ZIP SHA256: `b0156b92b591f61e923b276e744478364c683f14f570a155ac5e604047defc31`.
- 다운로드 ZIP의 해시는 GitHub artifact digest와 같았으며, 추출 후 동일 checker를 재실행해 결과를 확인했다.
- 단계별 전체 전투/저장 해시, runtime/codec provenance와 표현 종류는 함께 보존한 `evidence.json`에 있다. 합성 전투 전체는 원본 artifact에 있으며 이 문서에 중복하지 않는다.

## 범위와 남은 검증

이는 각 장에서 아군 한 명의 HP를1 낮추고 round2/shots3을 지정한 **합성 저장 3개**의 직접 battle-codec 검증이다. 실제 사용자 저장을 읽지 않았다. 전체 profile migration, 모든 과거 schema, 플레이 중 모든 시점, App.continue/Engine attach, 실제 플레이·시각 결과까지 통과했다고 해석하면 안 된다.

7d 이후 몬스터·지형 수정이 있으므로 후보의 새 fresh 전투를 옛 fresh 전투와 무조건 같다고 요구하지 않았다. 검증 대상은 **옛 snapshot 자체의 보존**이다. 전50장 현재 버전 저장·합본 Scene·App lifecycle·성능 검증은 별도이다. 이 결과는 master 반영 또는 Pages 배포를 의미하지 않는다.
