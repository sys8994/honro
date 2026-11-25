# 53·54·58 신규 폴리곤 벌크 표본

| 새 구조 | 플레이 ROI의 채움 1× / 2× (world²) | ROI 끝점 | 원본 색면 | 끝점 / 백만 world² (1×) |
|---|---:|---:|---:|---:|
| 53 네 방 마루·기둥과 두 윗마루 | 374,942 / 363,207 | 148 | 23 | 394.73 |
| 53/54 공용 B 문틀·석재 | 745,268 / 740,156 | 130 | 28 | 174.43 |
| 54 N 회랑 두 윗마루 | 15,877 / 15,509 | 40 | 4 | 2,519.34 |
| 58 상층 마루·기둥·처마 | 4,918,151 / 4,907,910 | 310 | 64 | 63.03 |

실제로 빌드에 투입되는 세 장의 신규 벡터를 같은 월드 좌표에서 채웠다. 플레이 ROI 경계로 자르고, 겹치는 픽셀은 한 번 세는 이진 알파 마스크를 쓴다. 배율은 1× `1440/6800`, 2× `2880/6800` 픽셀/월드 단위다. B의 마스크는 53 플레이 폭에 맞췄다. 54 뒤 차트와 C, 58의 원본 하체와 D/R, 원경 그림과 배우는 범위 밖이다. 숫자가 보여 주는 것은 신규 도형의 일부다. SOP의 1·2장 기준과 비교할 수 있는 전체 BODY·엔진 clip 합성, 색면의 실제 가림, 더미 외곽과 능동 화면의 렌더 성능은 아직 미계측이다.

54 윗마루의 높은 밀도는 얇은 띠의 작은 채움에 끝점 40개가 모인 값이다. 58의 경우 큰 배경 구조면이 넓은 면적을 차지한다. 화면상 덩어리와 가독성은 [실제 캡처 다섯 항목](../gate-checklist.md#실제-캡처를-다시-본-다섯-항목)에 기록했다.

[원자료와 에셋 범위·용량](bulk.json) · [53 마스크](53-1x.png) · [B 마스크](53-54-1x.png) · [54 마스크](54-1x.png) · [58 마스크](58-1x.png)

```bash
python game/docs/act6/mumyeongsa-p00-p10/baseline/hall_bulk.py --out /tmp/honro-hall-bulk
```

## 1막과 동일한 채움·끝점 기준의 추가 계측

1막 1·2장의 고정 배포 BODY 패킷을 해시로 확인하고, 53·54 본편 N·58의 실제 앱에서 그려진 지형 BODY·받침 인스턴스를 수집했다. 똑같은 카메라 독립 월드 배율 1440/6800 및 2880/6800, 실제 캔버스 clip과 알파 면적, 각 장의 원래 Play Bounds 절단 규칙을 적용했다. 색이 투명한 부분은 면적에서 빠지고 겹친 면적은 한 번 센다. 플레이와 바깥 더미의 분자·분모를 분리했다. 원래 렌더 경로의 일반 HUD, 원경, 배우와 별도 소품은 제외했다. [원자료·ROI·인스턴스·해시](comparison/density.json)

| BODY | 플레이 채움 면적 1× / 2× (world²) | 플레이 끝점 / 백만 world² (1×) | 바깥 채움 1× / 끝점 밀도 | 활성 자산 정규화 / 개별 gzip 합계 (bytes) |
|---|---:|---:|---:|---:|
| 1막 1장 | 4,731,876 / 4,727,686 | 5,253 / 1,110.13 | 미계측 | 107,442 / 32,811 |
| 1막 2장 | 2,234,591 / 2,225,980 | 2,875 / 1,286.59 | 미계측 | 269,807 / 98,454 |
| 53 | 6,063,152 / 6,066,040 | 333 / 54.92 | 3,519,572 / 13.64 | 12,376 / 3,719 |
| 54 본편 N | 4,272,288 / 4,253,175 | 2,745 / 642.51 | 2,549,667 / 103.94 | 91,694 / 21,153 |
| 58 | 16,726,897 / 16,695,096 | 3,737 / 223.41 | 84,586,277 / 25.65 | 167,866 / 49,293 |

1×의 끝점 밀도에서 53은 두 참조의 약 4–5%, 54는 50–58%, 58은 17–20%다. 53 큰 암면과 58 넓은 BODY의 적은 끝점 수는 실제 원경을 벌크에 포함해서 나온 값이 아니다. 54의 색면 구성이 가장 조밀하다. 코드가 그리는 원본 색 경로 수는 1장 9, 2장 13, 53은 49, 54는 517, 58은 502다. SVG 구멍을 포함한 닫힌 윤곽 수와 실제 캔버스 성분은 별도 필드다. 경계 끝점과 알파 문턱 아래 끝점은 비귀속으로 남겼고, 렌더 명령을 면별로 가린 뒤 실제 보이는 색면 수는 미계측이다.

이 캔버스 재실행은 고정 SOP 원래 면적과 0.4% 이내다. 2장의 낮은 해상도 성분은 이번 렌더에서 11개, 높은 해상도에서 8개다. 원래 표의 8/8과 구분했다. 성분은 알파 128 이상을 4연결, 홀은 미만을 8연결로 세었다. 같은 단말의 실제 프레임 예산과 모든 54 차트별 이 지표는 아직 미계측이다.

[1장 1×](comparison/act1-01-1x.png) · [2장 1×](comparison/act1-02-1x.png) · [53 1×](comparison/53-1x.png) · [54 1×](comparison/54-N-1x.png) · [58 1×](comparison/58-1x.png)

```bash
p=game/docs/act6/mumyeongsa-p00-p10
python "$p/baseline/body_density.py" --build "$PWD" --out /tmp/honro-body-density --b-proof "$p/visual-atlas/capture-input-b.json" --d-proof "$p/visual-atlas/capture-input-d.json"
```

## 53 기단·볼트와 58 마루·처마의 국소 조형

53의 원래 암면 clip 안에서 기단의 하중을 받는 석면 14개와 볼트의 사선 이음 13개를 얹었다. 기단의 작은 면들은 수평 돌턱에서 실제 오르막 각도를 따라 돌아가고, 천장 면은 넓은 암면과 경계의 좁은 띠를 연결한다. 58에는 마루 받침의 돌과 기둥 하부 11면, 처마 속 목재의 이음 10면을 넣었다. 마루 받침은 실제 윗면 아래, 처마 무늬는 뒤집힌 실제 접촉면 위에 그렸다. 59 수신 R의 동쪽 수직 닫힘선 제거를 보존했다.

| 동일 본편 카메라 | 색면 전후 | 충돌 표시 전후 | warmed renderer CPU p95 ms | warmed 화면 간격 p95 ms |
|---|---|---|---:|---:|
| 53 기단 PC | [전](details/53-foundation-before-plain.webp) · [후](details/53-foundation-after-plain.webp) | [전](details/53-foundation-before-outline.webp) · [후](details/53-foundation-after-outline.webp) | 5.1 → 4.7 | 21.3 → 22.8 |
| 53 볼트 모바일 390 DPR2 | [전](details/53-vault-before-plain.webp) · [후](details/53-vault-after-plain.webp) | [전](details/53-vault-before-outline.webp) · [후](details/53-vault-after-outline.webp) | 3.4 → 1.4 | 21.7 → 18.1 |
| 58 석단 PC | [전](details/58-stone-step-before-plain.webp) · [후](details/58-stone-step-after-plain.webp) | [전](details/58-stone-step-before-outline.webp) · [후](details/58-stone-step-after-outline.webp) | 5.5 → 5.3 | 27.1 → 28.4 |
| 58 천장 처마 모바일 390 DPR2 | [전](details/58-soffit-before-plain.webp) · [후](details/58-soffit-after-plain.webp) | [전](details/58-soffit-before-outline.webp) · [후](details/58-soffit-after-outline.webp) | 2.2 → 3.9 | 20.4 → 20.2 |

고정 카메라의 투영 좌표·viewport·DPR·정상 저장·충돌 마스크 해시가 전후 모두 같다. 첫 15프레임과 안정화 뒤 80프레임 원자료를 남겼다. 같은 Chromium 호스트에서 다른 플레이 검수가 함께 실행돼 프레임 간격을 실기기 수치로 해석할 수 없다. 58 처마의 렌더 CPU p95는 1.7 ms 증가했다. [한 화면 비교](details/paired.webp) · [전 원자료](details/frames-before.json) · [후 원자료](details/frames-after.json)

BODY 재측정의 53 끝점 밀도는 같은 1×/2× ROI에서 54.92/54.90 → 84.44/84.40, 58은 223.41/223.84 → 230.95/231.39다. 현재 1막 두 기준 대비 53은 6.6–7.6%, 58은 18.0–20.8%다. 54 N은 같은 면적과 끝점 수를 재확인했다. 58의 마루 아래 색면으로 1× 채움 면적이 약 0.26% 늘었다. 다섯 번의 기존 B·천장·R 화면 검수는 별도로 보존했다. 이 국소 조형을 반영한 P10 감독 판정은 대기 중이다. [같은 마스크 및 도형 원자료](details/density.json)

직전 대조 앱은 `583037e8`의 런타임이다. 그 앱에서 변경된 53 벡터 원본·파생본 및 58 색면 소스만 적용해 재빌드했다. 같은 도구와 자료로 전후를 각각 실행한다.

```bash
npm run build
p=game/docs/act6/mumyeongsa-p00-p10
python "$p/baseline/visual_edges.py" --build "$PWD" --out /tmp/honro-p10-details --details --d-proof "$p/visual-atlas/capture-input-d.json"
python "$p/baseline/body_density.py" --build "$PWD" --out /tmp/honro-p10-density --b-proof "$p/visual-atlas/capture-input-b.json" --d-proof "$p/visual-atlas/capture-input-d.json"
```
