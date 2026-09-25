# HONRO Map Workshop v2

HONRO 맵을 **사람과 AI agent가 같은 데이터/명령 체계 위에서 공동 편집**하기 위한 local-first standalone 웹 에디터다.

## 실행

`HONRO_MAP_WORKSHOP.html`을 브라우저에서 연다. 서버나 외부 라이브러리가 필요 없다.

## v2 핵심 기능

### ELEMENTS
- 기본 Element Library
- polygon vertex 직접 편집
- polygon 내부 클릭 → 전체 polygon 선택/drag
- `Polygon` tool / `+ Polygon`으로 한 asset에 polygon 추가
- double-click으로 edge에 vertex 추가
- Anchor / Socket
- Collision / Breakable / One-way
- Duplicate / Randomize
- **Node simplify threshold ε**
- **Ctrl+drag vertex → Grid snap**
- Grid size 변경

### STAGE
- Width / Height
- Freehand Ground draw
- control point 편집
- **Ground 외에 arbitrary closed `Solid Polygon` 작성**
  - overhang
  - cave roof / cave wall
  - arch / floating rock
  - 다층 solid
- Terrain body click → 전체 terrain drag
- Terrain control node drag
- **Ctrl+drag node → Grid snap**
- configurable Grid size
- Material Paint
- Element place + surface snap
- 요소 배치 후 자동 Select mode 복귀
- Element / Unit / Event click-select + drag
- Scatter
- Layer visibility / lock
- Undo / Redo
- JSON import/export
- HONRO Draft Spec export

### PERFORMANCE
- Terrain derived node count 표시
- Element vector node count 표시
- 전체 scene node count 표시
- Terrain `Optimize ε` — authored controls는 유지하고 derived/export node 감소
- Element `Simplify ε` — polygon node 직접 단순화, Undo 가능
- Adaptive LOD — zoom-out draw geometry 임시 단순화
- viewport element culling
- derived terrain caching

실제 HONRO Stage 1 렉은 node 수만이 아니라 **background + landmark vector drawing**이 주 병목이었다. 자세한 측정은 `PERFORMANCE_ANALYSIS.md` 참고.

### PLAYTEST
- A/D 또는 ←/→
- Space jump
- Ground / Platform / Solid collision preview
- solid underside ceiling collision 지원

본게임 전체 전투엔진은 아직 포함하지 않은 lightweight physics preview다.

## AI Cowork

```js
window.HonroWorkshopAPI
```

주요 API:
- `getProject()`
- `getContext()`
- `getEditorState()`
- `getPlayState()`
- `validate()`
- `previewCommands(commands)`
- `applyCommands(commands)`
- `exportHonroSpec()`

사람 UI와 AI API 모두 같은 Project schema와 Undo history를 사용한다.

## 문서
- `WORKSHOP_DESIGN.md`
- `SCHEMA.md`
- `AGENT_API.md`
- `PERFORMANCE_ANALYSIS.md`
- `VALIDATION.md`
