# Native와 브라우저 gradient 관측 분리

Native canvas에서 identity gradient와 동일 source 좌표를 translate한 gradient의 destination-in 결과가 다르게 나타났다. 독립 최소 재현은 게임·사용자 저장·기존 전투를 건드리지 않는다. 로컬 Chrome 실행은 socket 권한 때문에 시작되지 않았으며 보안 설정을 변경하거나 재시도하지 않았다.

별도 GitHub CI에서 설치된 Chrome을 새로운 일회성 profile로 실행해 이 canvas 단위만 비교한다. sandbox 비활성화 플래그를 사용하지 않는다. 이 결과도 실제 공개 Game 검수와 구분한다.

23장 수직 띠의 관측 경계 x871/1045/1174는 contact strip world x1050/1940/2600과 일치한다. 해당 source alpha는 연속이며 bounds도 충분하다. 따라서 현재는 Native strip 합성 의심·공개 미확인으로 분류하고 원본을 수정하지 않는다. source y991 끝에서 기존 fade y964→995의 alpha가 약13% 남는 별도 이음 위험은 정적 관측일 뿐 확정 공개 결함이 아니다.

21장 source 유한 끝, 22장 저작된 매립 기초 사각 경계는 별도 소스 근거가 있는 합성 후보로 보존했지만 공개 UI 합격으로 처리하지 않는다.

## 실제 결과
Chrome 157.0.8103.50의 CI44066126321은 성공했다. identity/translated 모두 alpha [255,255,156,0]으로 동일하다. 동일 fixture를 Native @napi-rs/canvas에서 실행하면 identity [255,255,156,0], translated [0,0,0,0]으로 다르다. 독립 canvas 최소 재현의 backend 차이는 확인됐으나, 이를 모든 지형 관측의 원인으로 일반화하지 않는다.

26장과29장도 원본이 연속인데 관측 빈칸/사각형은 contact strip 경계에 일치한다. 두 장은 이미 source 바닥 전에 투명해지는 fade가 있다. 23·26·29는 생산 수정 보류 상태로 actual production tile의 브라우저 비교를 준비한다. 28/30처럼 별도로 source geometry 끝과 관측 위치가 일치하는 문제는 구분한다.
