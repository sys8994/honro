# Stage 7 semantic protection plan (read-only)

## Instruction provenance
The prior all-pixels-at-or-above-source-y1065 equality gate was an internal conservative study constraint from this team's parent instructions. The inherited user messages request terrain artwork repair and preservation of meaningful structures; they do not state that every pixel of the last53 source rows must be immutable. The now-supplied parent direction explicitly asks to distinguish actual semantic protection from that self-imposed diagnostic gate. This document changes no production criterion or artwork yet. The safe exclusion178902ea and its tested state remain untouched.

## Source evidence and actual image references
Source public7d tools/map-forge/act1-naru-doldang.mjs; unchanged shared/assets/environment/act1-sites/stage07.json BODY acbffaafb8a346e3c28d039a17f8d1dd1f2f525b1563860727e45d3bf4651193. Source picture body-original.png and actual Chrome stage7-safe-review/stage7-candidate-desktop-br.png were directly re-inspected. Original BODY is1448x1086; source-to-world scale3.13. Last alpha ends near1074.34(source vector), with raster last nonzero row1074 for most interior columns. Therefore 1021→1074.34 is53.34 source pixels, but this is NOT a single uniformly protected or uniformly editable strip.

## Genuine protected semantic areas
1. All37 authored terrains, collision/control/oneWay/thickness/breakability, stage dimensions/play bounds/camera, units/placements and save geometry remain unchanged. No collision extension or fake platform.
2. Actual root-floor walking line is:
[(8,991),(124,1003),(258,1020),(520,1021),(566,1004),(630,985),(1065,981),(1168,977),(1201,950),(1283,912),(1376,899),(1447,884)].
The lowest point1021 occurs around x520, not the full width. Its worldY3195.73. At right x1447 the walking edge is884, so much more of the lower right rock is nonwalking than a horizontal1021 cutoff suggests.
3. Road/cap tops, ochre painted walking rims, olive grass/root descenders and their outlines/AA must remain visually intact. Body paint layers by fill order are0#fdfdfd,1#aca8a8,2#c59b5c,3#ae9056,4#9c842f,5#8b772b,6#614b56,7#665823,8#4b3844,9#43333a,10#342832,11#251d25. These are flattened trace palette layers, NOT semantic object layers. Do not delete/replace an entire path just because its fill appears grass-like or rock-like: underlying compound regions overlap across the whole picture.
4. All arches/holes and their silhouettes, upper yards, source cap stairs,13 added foothold transforms/crops, landmarks/tree/houses remain untouched. Added foothold low walking edge976, fall-caps967; the low added cap's visual crop extends roughly to1000, still above the proposed local safety boundary around1044. They are explicitly protected even if a coarse color classifier misses them.
5. Outer alpha next to playable faces and all original interior holes remain protected. Only nonwalking lower closure and its continuous outer rock continuation may change. The old rectangular lower closing edge is not a gameplay silhouette to preserve forever.

## Grass vs editable rock, measured rather than assumed
Pixel classification below is a conservative DIAGNOSTIC proxy at source resolution, not a production mask: compare visible original colors within RGB max-distance2, alpha>128, then3pixel dilation to preserve AA/near-color outlines. Actual future vector mask needs path/subpath analysis and Chrome coverage validation.
Below y1021, a continuous ochre/olive cap/descender component spans x185..615,y1021..1066 (6028pixels). Other visible components: x755..770,y1021..1036; x904..910,y1021..1024; x946..974,y1021..1036; x1193..1198,y1021..1025. Thus permitting every pixel below1021 to change would damage real grass. Conversely freezing the entire53px band unnecessarily freezes a great deal of plain rock.
Some warm/gray border pixels reach1072/1073 but are outline/closing remnants, not confidently grass. Conservatively protect them until their actual compound subpath is identified; do not infer semantics from fill alone.

## Proposed edit-domain envelope, not yet implemented
Define f(x) by linear interpolation of the original root-floor source line. Begin eligible nonwalking rock no earlier than y=f(x)+24source pixels (75.12world), then subtract protected visible grass/road/cap masks plus3source-pixel halo, all meaningful alpha holes, foothold crops and structural silhouettes. The24px margin is a proposed conservative engineering margin, NOT a user-authored constraint. It can be reviewed against the actual art before implementation; do not silently widen it.
Examples of initial rock-only boundary: x258→1044; x520→1045; x630→1009; x1065→1005; x1201→974; x1283→936; x1376→923; x1447→908. Grass descenders such as x458 remain protected to1066+halo even where the local rock envelope starts higher.
This conservative pixel proxy contains85966 original opaque nonwalking pixels, bbox[13,910,1442,1074]. This is a feasibility estimate, not permission to edit that entire bounding box. Its irregular shape and excluded grass islands matter. Inside x24..1410 and y>f(x)+24..1070 there are0 transparent source pixels, supporting that this lower interior region contains no original open arch hole. Near side alpha edges classification must be checked separately.

## Design opportunity
With an irregular semantic edit envelope, a continuous lower rock painting can start inside existing plain maroon rock faces instead of being forced through the artificial9px closure band. Extend each principal original curved rock face with matching tangent, curvature, value and scale, and retain grass islands above it exactly. Terminate/subdivide the old face naturally at varied depths. New outer silhouette can continue below the nonwalking root foundation without imposing a straight horizontal shelf. The flat original bottom closure may then disappear as an intentional nonsemantic paint change.
This does NOT justify generating an entirely new BODY. Work only on the local lower exterior/continuous rock addition, composite original protected regions unchanged, preserve all structures and gameplay geometry. Do not repeat the9px solid fade, row stretch, random triangles, or long columns. No new walkable-looking ledges, arches, bridge, moss trails, houses or trees.

## Future validation gate before use
- First create explicit reviewed vector-domain/semantic-mask IDs with original source hashes and per-domain paint intent; keep the diagnostic pixel classifier separate.
- Preserve all protected semantic source paths/transforms and protected-mask pixels; permitted nonwalking differences must be bounded and listed. Global upper-y1065 equality is no longer the right sole criterion.
- Require original full stage/physics/footholds/landmarks/save-codec contracts. Assert original interior-hole alpha and road/grass/cap coverage, not only aggregate counts.
- Local artwork preview at walking scale, maximum zoom-out, lower left/right and both portrait/desktop proportions, then actual Chrome on baseline/rejected/safe/new variants. No blur-based or purely numerical art acceptance.
- Original and new source/optimized assets each receive mask and contour checks; no Native-only assumptions. Protect existing safe-exclusion fallback until all new art and integration checks pass.
- Public UI/actual input/dynamic states/device/performance remain separate and unverified here.

No production files, generated art, source vector, candidate branch, master or Pages were changed for this study. New local analysis files only in stage7-semantic-study.

## analysis.json
```json
{
  "scope": "Read-only pixel/source analysis. Semantic candidate region only; no edited art generated.",
  "paletteLowerVisible": [
    {
      "index": 0,
      "fill": "#fdfdfd",
      "lowerVisiblePixels": 0,
      "bboxSourcePixels": null
    },
    {
      "index": 1,
      "fill": "#aca8a8",
      "lowerVisiblePixels": 63,
      "bboxSourcePixels": [
        13,
        981,
        1420,
        1073
      ]
    },
    {
      "index": 2,
      "fill": "#c59b5c",
      "lowerVisiblePixels": 1943,
      "bboxSourcePixels": [
        340,
        987,
        1112,
        1028
      ]
    },
    {
      "index": 3,
      "fill": "#ae9056",
      "lowerVisiblePixels": 2527,
      "bboxSourcePixels": [
        24,
        981,
        1158,
        1072
      ]
    },
    {
      "index": 4,
      "fill": "#9c842f",
      "lowerVisiblePixels": 3986,
      "bboxSourcePixels": [
        170,
        984,
        1213,
        1035
      ]
    },
    {
      "index": 5,
      "fill": "#8b772b",
      "lowerVisiblePixels": 9782,
      "bboxSourcePixels": [
        132,
        981,
        1240,
        1047
      ]
    },
    {
      "index": 6,
      "fill": "#614b56",
      "lowerVisiblePixels": 5979,
      "bboxSourcePixels": [
        11,
        981,
        1438,
        1073
      ]
    },
    {
      "index": 7,
      "fill": "#665823",
      "lowerVisiblePixels": 5983,
      "bboxSourcePixels": [
        109,
        981,
        1265,
        1066
      ]
    },
    {
      "index": 8,
      "fill": "#4b3844",
      "lowerVisiblePixels": 9842,
      "bboxSourcePixels": [
        113,
        981,
        1423,
        1071
      ]
    },
    {
      "index": 9,
      "fill": "#43333a",
      "lowerVisiblePixels": 23884,
      "bboxSourcePixels": [
        13,
        981,
        1436,
        1071
      ]
    },
    {
      "index": 10,
      "fill": "#342832",
      "lowerVisiblePixels": 29056,
      "bboxSourcePixels": [
        14,
        981,
        1437,
        1070
      ]
    },
    {
      "index": 11,
      "fill": "#251d25",
      "lowerVisiblePixels": 21953,
      "bboxSourcePixels": [
        15,
        981,
        1435,
        1070
      ]
    }
  ],
  "rootFloorSource": [
    [
      8,
      991
    ],
    [
      124,
      1003
    ],
    [
      258,
      1020
    ],
    [
      520,
      1021
    ],
    [
      566,
      1004
    ],
    [
      630,
      985
    ],
    [
      1065,
      981
    ],
    [
      1168,
      977
    ],
    [
      1201,
      950
    ],
    [
      1283,
      912
    ],
    [
      1376,
      899
    ],
    [
      1447,
      884
    ]
  ],
  "worldScale": 3.13,
  "sourceRasterSize": [
    1448,
    1086
  ],
  "eligibleNonwalkingPaintPixels": 85966,
  "grassBelow1021Components": [
    {
      "pixels": 6028,
      "bbox": [
        185,
        1021,
        615,
        1066
      ]
    },
    {
      "pixels": 136,
      "bbox": [
        755,
        1021,
        770,
        1036
      ]
    },
    {
      "pixels": 18,
      "bbox": [
        904,
        1021,
        910,
        1024
      ]
    },
    {
      "pixels": 258,
      "bbox": [
        946,
        1021,
        974,
        1036
      ]
    },
    {
      "pixels": 20,
      "bbox": [
        1193,
        1021,
        1198,
        1025
      ]
    }
  ],
  "eligibleBbox": [
    13,
    910,
    1442,
    1074
  ]
}
```

## alpha.json
```json
{
  "opaqueBounds": [
    8,
    346,
    1447,
    1074
  ],
  "bottomAlphaByX": [
    {
      "sourceX": 15,
      "lastNonzeroY": 1066,
      "alpha": 13,
      "lastOpaqueY": 1063
    },
    {
      "sourceX": 124,
      "lastNonzeroY": 1074,
      "alpha": 51,
      "lastOpaqueY": 1073
    },
    {
      "sourceX": 258,
      "lastNonzeroY": 1074,
      "alpha": 51,
      "lastOpaqueY": 1073
    },
    {
      "sourceX": 458,
      "lastNonzeroY": 1074,
      "alpha": 68,
      "lastOpaqueY": 1073
    },
    {
      "sourceX": 520,
      "lastNonzeroY": 1074,
      "alpha": 68,
      "lastOpaqueY": 1073
    },
    {
      "sourceX": 630,
      "lastNonzeroY": 1074,
      "alpha": 85,
      "lastOpaqueY": 1073
    },
    {
      "sourceX": 755,
      "lastNonzeroY": 1074,
      "alpha": 85,
      "lastOpaqueY": 1073
    },
    {
      "sourceX": 970,
      "lastNonzeroY": 1074,
      "alpha": 85,
      "lastOpaqueY": 1073
    },
    {
      "sourceX": 1065,
      "lastNonzeroY": 1074,
      "alpha": 85,
      "lastOpaqueY": 1073
    },
    {
      "sourceX": 1201,
      "lastNonzeroY": 1074,
      "alpha": 85,
      "lastOpaqueY": 1073
    },
    {
      "sourceX": 1283,
      "lastNonzeroY": 1074,
      "alpha": 85,
      "lastOpaqueY": 1073
    },
    {
      "sourceX": 1376,
      "lastNonzeroY": 1074,
      "alpha": 85,
      "lastOpaqueY": 1073
    },
    {
      "sourceX": 1420,
      "lastNonzeroY": 1065,
      "alpha": 3,
      "lastOpaqueY": 1051
    }
  ],
  "transparentPixelsInConservativeInnerLowerRegion": 0
}
```

## analyze.py
```python
from PIL import Image
import numpy as np,json
from pathlib import Path
p=Path('stage7-semantic-study');a=np.array(Image.open('stage7-exterior-study/body-original.png').convert('RGBA'));h,w,_=a.shape
palette=['#fdfdfd','#aca8a8','#c59b5c','#ae9056','#9c842f','#8b772b','#614b56','#665823','#4b3844','#43333a','#342832','#251d25']
rows=[];grass=np.zeros((h,w),bool)
for i,col in enumerate(palette):
 rgb=np.array([int(col[j:j+2],16) for j in(1,3,5)]);mask=(abs(a[:,:,:3].astype(int)-rgb).max(axis=2)<=2)&(a[:,:,3]>128)
 if i in [2,3,4,5,7]:grass|=mask
 low=mask & (np.arange(h)[:,None]>=981);yy,xx=np.where(low)
 rows.append({'index':i,'fill':col,'lowerVisiblePixels':int(low.sum()),'bboxSourcePixels':[int(xx.min()),int(yy.min()),int(xx.max()),int(yy.max())] if len(xx) else None})
root=np.array([[8,991],[124,1003],[258,1020],[520,1021],[566,1004],[630,985],[1065,981],[1168,977],[1201,950],[1283,912],[1376,899],[1447,884]])
yline=np.interp(np.arange(w),root[:,0],root[:,1]);below=np.arange(h)[:,None]>=yline[None,:]+24
# Semantic protected grass proxy derives from exact visible source paints, not full path indices.
# Dilation supplies a diagnostic AA/halo margin. This mask is not a production clipping asset.
from scipy.ndimage import binary_dilation,label,find_objects
protect=binary_dilation(grass,iterations=3);alpha=a[:,:,3]>0;eligible=below&alpha&~protect
# Last 53.34px not globally immutable: locate grass descenders surviving there.
late=grass & (np.arange(h)[:,None]>=1021);labs,n=label(late);comps=[]
for k,s in enumerate(find_objects(labs),1):
 if s is None:continue
 count=int(np.count_nonzero(labs[s]==k))
 if count>=4:comps.append({'pixels':count,'bbox':[s[1].start,s[0].start,s[1].stop-1,s[0].stop-1]})
result={'scope':'Read-only pixel/source analysis. Semantic candidate region only; no edited art generated.','paletteLowerVisible':rows,'rootFloorSource':root.tolist(),'worldScale':3.13,'sourceRasterSize':[w,h],'eligibleNonwalkingPaintPixels':int(eligible.sum()),'grassBelow1021Components':comps,'eligibleBbox':None}
yy,xx=np.where(eligible);result['eligibleBbox']=[int(xx.min()),int(yy.min()),int(xx.max()),int(yy.max())]
(p/'analysis.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))

```
