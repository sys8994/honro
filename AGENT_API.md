# Workshop Agent API

`window.HonroWorkshopAPI`를 사용합니다. 인간 UI와 같은 canonical Project·geometry·검증·히스토리를 사용합니다.

```javascript
const api = HonroWorkshopAPI;
api.queryScene(); // Stage 전체, camera, selection, validation
api.getContext(); // 개수, 실제 asset/unit 목록, 명령 목록
api.validateMap();
api.previewCommands([
  {op:'placeElement',id:'agent-rock',assetId:'rock_small',x:1500},
  {op:'placeUnit',id:'agent-guard',kind:'ally:guard',x:1800}
]);
api.applyPreview(); // preview에서 생성된 ID까지 그대로 적용
api.undo();
api.redo();
api.previewCommands([{op:'move',id:'agent-rock',x:1700}]);
api.discardPreview();
const json = api.exportProject();
api.importProject(JSON.parse(json));
```

명령별 `stageId`를 생략하면 active Stage입니다. ID 생략 시 생성한 ID는 preview/apply/undo/redo 동안 유지됩니다.

| op / 별칭 | 주요 입력 |
|---|---|
| `world.set` | name/width/height/backdrop |
| `createTerrain` / `terrain.add` | type, control 또는 points, floor/thickness, material, oneWay/breakable, spacing/roughness/seed/optimizeEpsilon |
| `editTerrain` / `terrain.moveNode` | id/index/x/y |
| `simplifyTerrain` / `terrain.optimize` | id/epsilon, 명시적 간소화 |
| `roughenTerrain` / `terrain.roughen` | id/roughness/seed |
| `paintMaterial` / `material.paint` | terrainId/x1/x2/kind/depth/reference? |
| `placeElement` / `element.place` | assetId/x/y/rotation(degrees)/scale/layer/snap |
| `scatterElements` / `element.scatter` | assetIds/count/x1/x2/y/seed/minScale/maxScale/rotationVariance(radians) |
| `placeUnit` / `unit.place` | kind/team/x/y/snap 및 유닛 인스펙터 속성 |
| `unit.update` | id/kind?/values |
| `createEncounter` / `encounter.add` | unitIds/key/behavior |
| `createTrigger` / `event.place` | type/x/y/radius/when?/action?/lines?/unit? |
| `createObjective` / `objective.add` | type/label/targetId/flag/x/y/radius/required |
| `move` / `element.move` / `unit.move` | id, x/y 또는 dx/dy. 지형은 dx/dy 사용 |
| `rotate`, `scale` | 요소 id, degrees 또는 factor |
| `rename` | id/newId, Stage 내부의 일치하는 문자열 참조도 갱신 |
| `delete` / `element.delete` | id, 종속 재질·encounter 멤버 참조 정리 |
| `asset.update`, `asset.optimize` | library id, values 또는 epsilon |

`applyCommands([...])`는 preview 없는 즉시 적용 API입니다. 기본 UI 흐름은 Preview → Apply/Discard입니다. 전체 배열을 복제본에 적용하고 검증하므로 실패 시 부분 변경이 남지 않습니다. Change Set은 컬렉션 증감 또는 속성 변경 안내를 표시합니다.

`getProject()`는 복제본입니다. `exportHonroSpec()`은 구 이름 호환용이며 이제 단일 Stage canonical Project를 반환합니다. 별도 ground/ribbon draft는 내보내지 않습니다.

`select(type,id)`, `selectStage(id)`, `setCamera({x,y,zoom})`, `setOverlay(false)`, `startPlaytest('start'|'selected'|'camera')`, `stopPlaytest()`를 지원합니다. `getRuntime/getPlayApp`은 진단용 실제 실행 객체이므로 직접 변경해도 작성 원본에 반영되지 않습니다.
