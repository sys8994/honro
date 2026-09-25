# HONRO Workshop Project Schema v2

## Project

```text
Project
 ├ version
 ├ name
 ├ library[]
 ├ stages[]
 ├ activeStageId
 └ settings
      ├ grid
      ├ snap
      ├ autosave
      └ adaptiveLOD
```

## Element definition

```text
id / name / category
visual[]             여러 closed polygon 허용
collision[]
anchor{x,y}
sockets[]
breakable
oneWay
tags[]
params
```

Element Editor에서 polygon 내부를 클릭하면 polygon 단위로 이동할 수 있다. `+ Polygon` / Polygon tool로 visual polygon을 추가한다.

## Stage

```text
id / name
width / height
backdrop
terrains[]
materials[]
elements[]
units[]
events[]
layers[]
meta
```

## Terrain

### Ground
사용자가 `control[]`로 상단 surface를 편집하며 아래는 자동 solid다.

```text
type: ground
control[]
floor
detail.spacing
detail.roughness
detail.seed
detail.optimizeEpsilon
```

`optimizeEpsilon`은 authored control을 보존하면서 generated/export node를 RDP 방식으로 줄인다.

### Platform

```text
type: platform
control[]
thickness
oneWay
breakable
```

### Solid

```text
type: solid
points[]             arbitrary closed polygon
breakable
baseMaterial
```

Solid는 Ground와 달리 아래 전체를 자동으로 채우지 않는다. 따라서 동굴 천장, overhang, arch, floating rock, 벽 같은 임의의 폐곡선을 만들 수 있다.

## Material

```text
terrainId
x1 / x2
kind
depth
alpha
```

Material은 terrain surface에 종속된다.

## Element instance

```text
assetId
x / y
rotation
scale
layer
snap
```

`snap=true`이면 anchor가 가장 가까운 terrain surface에 붙는다.
# 현재 schema

현재 작성·저장 스키마는 루트 [MAP_SCHEMA.md](../MAP_SCHEMA.md)의 canonical v3입니다. 아래 V2 문서는 이관 전 기록입니다.
