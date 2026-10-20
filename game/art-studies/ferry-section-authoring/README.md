# 네 구간 저작 참조 — 아직 미승인

각 PNG는 이미지 생성 도구로 별도로 저작한 오프라인 참조다. 실제 게임에는 PNG나 SVG image로 넣지 않는다. 네 구간은 같은 원본의 반복 타일이 아니다.

기준 카메라: Stage3, 캔버스1440×2160, scale .72, camera y2200, x=-300/1300/2900/4500. 구간마다 실제 범위2000×3000world를 담는다. 출력1024×1536px에서 성인 H=103.5world는52.992px, 정상 줌.65에서 원본1px는1.26953125화면px다.

실제 물리 윤곽, 인물/동물/건물 위치는 기존 게임 화면을 저작용 정렬 문맥으로 제공했다. 지면 아래만 새 한국 산지 사면으로 저작하도록 요청했다. 일반돌0.2–0.8H, 큰 노출암1–2H, 연결된 흙/암반/접촉틈과 올리브 수풀, 위쪽 왼편 광원, 반복 판석/고립 돌 배열/빈 갈색 면/광대한 조감 바닥/미세 점무늬를 피하도록 요청했다. 출력의 성공 여부는 실제 게임 화면으로 별도 판단한다. 이 요청문이나 이미지 생성 자체를 합격 증거로 삼지 않는다.

`sections.json`에 소스 SHA와 세계 투영을 기록했다. `material-palette.png`는 네 소스의 하단2/3에서 추출한 공통64색 팔레트다. 원본 파일은 보존하고 경로로 변환한다.

재생성은 저장소 루트에서 각 west/landing/shoulder/ridge에 대해 다음 명령을 실행한다(새 설치 없음; 기존 Python Pillow/NumPy/SciPy 사용).

```sh
HONRO_FERRY_SOURCE="$PWD/game/art-studies/ferry-section-authoring/west.png" HONRO_FERRY_PALETTE=game/art-studies/ferry-section-authoring/material-palette.png python tools/environment/derive-ferry-foreground-fidelity.py _local/reports/ferry-sections/west 64 0.55 12 --spatial
```

네 구간을 만든 뒤 `python tools/environment/compile-ferry-sections.py`를 실행하면 실행JSON과 SVG가 생성된다. 경로 명령의 절대/상대/h/v 인코딩만 줄이며 원본 경계점을 버리지 않는다. 구간 이음은 중첩400world 안에서 오프라인 RGB 차이가 낮은 연속 경계를 찾고 넓은 곡선으로 정돈한 것이다. 실행 중 이미지 처리나 필터는 없고 실제 픽셀에서 이음 확인이 필요하다.

원본에 포함된 인물/건물/하늘은 저작 좌표의 문맥이다. 실행 지형은 기존 물리 지형 클립 안에만 그린다. 접촉선 앞 표면은 발 아래30world의 재질을 골라 얇은 전면 어깨로 그리며 물리/유닛/퀘스트 데이터는 바꾸지 않는다. 별도 소스 PNG의 인물을 실제 리그 대체물로 쓰지 않는다.
