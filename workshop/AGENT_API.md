# HONRO Workshop v2 — Agent Command API

AI agent도 UI와 동일한 editor data model을 사용한다. raw project JSON 직접 수정보다 `HonroWorkshopAPI` 사용을 권장한다.

## Context

```js
const ctx = HonroWorkshopAPI.getContext();
```

Context에는 world, counts, node counts, selection, asset library, validation 결과가 포함된다.

## Terrain

```json
{"op":"terrain.add","name":"west slope","type":"ground","control":[[0,900],[600,1200],[1200,1800]],"material":"soil","spacing":18,"roughness":8,"seed":12}
```

임의 폐곡선 solid / overhang:

```json
{"op":"terrain.addSolid","id":"cave_roof","name":"Cave roof","points":[[900,700],[1700,680],[1650,900],[1050,940]],"material":"rock"}
```

Node / detail:

```json
{"op":"terrain.moveNode","id":"ground_main","index":4,"x":1400,"y":1900}
{"op":"terrain.roughen","id":"ground_main","roughness":14,"seed":921}
{"op":"terrain.optimize","id":"ground_main","epsilon":6}
```

## Element asset optimization

```json
{"op":"asset.optimize","id":"rock_large","epsilon":7}
```

## Material / Elements / Units

```json
{"op":"material.paint","terrainId":"ground_main","x1":900,"x2":1450,"kind":"water","depth":38}
{"op":"element.place","assetId":"rock_large","x":1600,"scale":1.4,"layer":"interactive"}
{"op":"element.move","id":"element_id","x":1750,"rotation":8,"scale":1.2}
{"op":"element.scatter","assetIds":["grass_tuft","fern","rock_small"],"x1":200,"x2":2200,"count":24,"seed":77,"minScale":0.7,"maxScale":1.5,"layer":"back"}
{"op":"unit.place","kind":"crow","team":"enemy","x":2800}
{"op":"unit.move","id":"unit_id","x":3100,"y":1450}
{"op":"event.place","type":"objective","x":3400,"y":1200,"label":"고리쇠 파괴"}
```

## Preview workflow

```js
const diff = HonroWorkshopAPI.previewCommands(commands);
// 사람이 preview 확인
HonroWorkshopAPI.applyCommands(commands);
// 또는
HonroWorkshopAPI.clearPreview();
```

Agent는 작은 change set 단위로 수정하고 매 변경 뒤 `validate()`를 호출하는 것이 좋다.
