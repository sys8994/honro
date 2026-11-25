# 53·54·58 전체 덩어리와 B·R의 접촉 명암

## 전체와 네 모서리

정상 앱에 실제 53 새 저장, 이전 54 N, 실제 53→54 B 저장, 수문지기를 이겨 도착한 54 N, 57→58 D 실측 저장을 각각 열었다. 배경과 배우를 포함한 실제 게임 화면을 짝으로 저장했다. 렌더 검사용으로만 카메라 중심을 이동했으며 월드 좌표가 프레임에 포함되는지, 저장 바이트가 달라지지 않는지 확인했다. 53의 네 방향 충돌과 공유 B 네 마스크, 58의 실제 충돌은 변경 전 레코드와 도형 단위로 일치한다.

| 구간 | 전체 | 상·하·좌·우와 네 모서리의 충돌 오버레이 | 플레이/외곽 벌크 1× (world²) | 화면 소견 |
|---|---|---|---:|---|
| 53-B | [전](53-world-before-body.webp) · [후](53-world-plain.webp) | [9시점](53-edges-outline.webp) | 6,125,417 / 3,967,641 | B 북편의 원래 y=−320을 지형 범위에 넣어 단일 지형 렌더를 다시 활성화했다. 편암 띠가 저층에서 높은 난간 방향으로 이어진다. 상·하부 바깥의 직선 폐합과 서벽의 원경 전환은 보인다. |
| 54 B | [전체](54-B-world-plain.webp) | [9시점](54-B-edges-outline.webp) | 499,671 / 599,480 | 접촉 벽의 광원이 맞닿는 물체를 구분한다. 더미 네 면은 53과 동일한 월드 보정 도형이다. |
| 54 본편 N | [전체](54-native-N-world-plain.webp) | [9시점](54-native-N-edges-outline.webp) | 4,042,397 / 2,481,995 | 실제 게임에서 두 윗마루가 켜졌고 3200×3000을 유지한다. 오른쪽 척추의 직선 폐합은 낮은 줌에서 남는다. |
| 54 이전 N | [전체](54-legacy-N-world-plain.webp) | [9시점](54-legacy-N-edges-outline.webp) | 4,042,394 / 2,481,995 | 이전 저장도 자동 변환 없이 기존 N에 도착한다. |
| 58-B | [전체](58-world-plain.webp) | [9시점](58-edges-outline.webp) | 16,444,615 / 84,586,277 | 석단·처마·중층 법당, 긴 외곽 암면을 별도로 읽을 수 있다. 전체 축소에서 벽/천장 접촉선은 상세 컷보다 약하다. |

벌크는 실제 Scene 지형 렌더와 선택한 BODY·암반 면 인스턴스를 알파 캔버스에 합성해 쟀다. 비전투 원경, UI, 배우, 재사용 소품과 신규 걸을 수 있는 목조 발판은 제외했다. 좌표와 실제 포함 ID, 노드, 1×/2× 해상도, 마스크 해시는 [원자료](edges.json)에 있다. 실제 렌더 알파 합계와 별도로 색층의 연결 성분별 노드 귀속 및 Act 1 원본 기준과의 밀도 비교는 미계측이다. 53의 편암 마스크는 원래 월드 네 고체 클립을 참조하며 새로운 충돌 자산이 없다. Inkscape SVG와 기존 저장소 importer 출력의 [원본](../../../../../shared/act6-mumyeongsa/art/stage53-bedrock.svg)을 보관했다.

## 같은 카메라로 전후를 대조한 다섯 컷

| 확인 | 전 → 후 | 직접 비교 |
|---|---|---|
| 54 B 터치 | [전](before-B-touch.webp) → [후](after-B-touch.webp) | 주 접촉선이 밝아져 담허의 신발과 돌면 사이 위치가 좁은 화면에서 구분된다. |
| 54 B PC | [전](before-B-wall.webp) → [후](after-B-wall.webp) | 옆 더미를 저채도 어두운 암반으로 분리했다. 주 벽 높이와 발점 위치는 같다. |
| 58 천장 터치 | [전](before-58-soffit-touch.webp) → [후](after-58-soffit-touch.webp) | 빛 띠의 밑변을 실제 y=2570 접촉선에 맞췄다. 장식 들보는 낮은 명도를 유지한다. |
| 58 R PC | [전](before-R-58-send.webp) → [후](after-R-58-send.webp) | 원래 같은 돌턱 아래에 명암 두 면을 더해 지지면 두께가 읽힌다. |
| 59 R 터치 | [전](before-R-59-receive-touch.webp) → [후](after-R-59-receive-touch.webp) | 같은 돌턱 명암이 수신 쪽 녹청색 외벽에서 분리돼 보인다. 수신 외벽의 아래·동쪽 끝 수직 절단은 보인다. |

[다섯 접점의 전후 발췌](seam-detail-review.webp) · [이전 프레임 좌표·화면 크기·저장 해시](before-seams.json) · [변경 후 같은 프레임 좌표·화면 크기·저장 해시](after-seams.json)

위 다섯 컷의 카메라 월드 좌표·배율·저장 해시는 전후 정확히 같다. 같은 수정의 다섯 대조 지점이다. SOP의 본편 미술 수정·재검수 5회와 54의 L/C/뒤 다시 L 전 영역 외곽, 58의 live R 모바일 송신은 남아 있다.

```bash
npm run build
python game/docs/act6/mumyeongsa-p00-p10/baseline/visual_edges.py --build "$PWD" --out /tmp/honro-hull --b-proof game/docs/act6/mumyeongsa-p00-p10/visual-atlas/capture-input-b.json --d-proof game/docs/act6/mumyeongsa-p00-p10/visual-atlas/capture-input-d.json
python game/docs/act6/mumyeongsa-p00-p10/baseline/visual_edges.py --build "$PWD" --out /tmp/honro-seams --seams --b-proof game/docs/act6/mumyeongsa-p00-p10/visual-atlas/capture-input-b.json --d-proof game/docs/act6/mumyeongsa-p00-p10/visual-atlas/capture-input-d.json --r-proof game/docs/act6/mumyeongsa-p00-p10/mobile-seams/captured-r-source.json
```

B 입력은 표준 53 일반 저장에서 실제 진목과 B를 통과해 작성한 `checkpoint54`를 옮긴 JSON, D 입력은 표준 57에서 실제 네 몸이 통과한 `baseline/interior_join.py`의 `exterior.checkpoint58`을 옮긴 JSON이다. 새 코드에서도 저장 원문을 바꾸지 않고 열 수 있다.
