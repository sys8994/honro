# HONRO ACT1 RC21

RC20 맵/밸런스를 유지하면서 정적 배경·랜드마크·terrain/material rendering을 cache하여 줌아웃 렉을 해결한 성능 패스. 자세한 내용은 `HONRO_RC21_REPORT.md`.

# HONRO — Act 1 RC20

RC20은 Stage 1·2의 자연 지형 표현을 다시 만든 버전이다. 고밀도 collision geometry, support-bound material/scenery, irregular rocks, 얕은 물 depression, 거대 고목과 실제 gameplay branch, 비대칭 협곡 route를 추가했다.

## 실행

루트 `HONRO.html`을 브라우저에서 연다.

## 주요 문서

- `MAP_NATURALISM_RC20.md` — 자연 지형 설계 원칙
- `PATCH_NOTES_RC20.md` — 변경 내역
- `HONRO_RC20_REPORT.md` — 검증 결과

## 빌드 / 검사

```sh
npm --prefix game ci
npm --prefix game run typecheck
npm --prefix game run build
npm --prefix game run test:rc20
```

RC20 map/save revision은 20이다. 이전 진행 중 battle snapshot은 스테이지 입구에서 다시 시작되며 성장 정보는 유지된다.
