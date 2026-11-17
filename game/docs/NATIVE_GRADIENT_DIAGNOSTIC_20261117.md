# Native와 브라우저 gradient 관측 분리

Native canvas에서 identity gradient와 동일 source 좌표를 translate한 gradient의 destination-in 결과가 다르게 나타났다. 독립 최소 재현은 게임·사용자 저장·기존 전투를 건드리지 않는다. 로컬 Chrome 실행은 socket 권한 때문에 시작되지 않았으며 보안 설정을 변경하거나 재시도하지 않았다.

별도 GitHub CI에서 설치된 Chrome을 새로운 일회성 profile로 실행해 이 canvas 단위만 비교한다. sandbox 비활성화 플래그를 사용하지 않는다. 이 결과도 실제 공개 Game 검수와 구분한다.

23장 수직 띠의 관측 경계 x871/1045/1174는 contact strip world x1050/1940/2600과 일치한다. 해당 source alpha는 연속이며 bounds도 충분하다. 따라서 현재는 Native strip 합성 의심·공개 미확인으로 분류하고 원본을 수정하지 않는다. source y991 끝에서 기존 fade y964→995의 alpha가 약13% 남는 별도 이음 위험은 정적 관측일 뿐 확정 공개 결함이 아니다.

21장 source 유한 끝, 22장 저작된 매립 기초 사각 경계는 별도 소스 근거가 있는 합성 후보로 보존했지만 공개 UI 합격으로 처리하지 않는다.
