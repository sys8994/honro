"""Compile the authored 1-1 Tiled map. Ground/prop import inherited from the asset lab."""
import argparse
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

PROP_SPECS={p.stem for p in (ROOT/'assets/props').glob('*.png')}
def propdict(items):return {p['name']:p['value'] for p in items or []}
def import_tiled(path: Path):
    m=json.loads(path.read_text(encoding="utf-8"))
    W,H,TW,TH=(m[k] for k in ("width","height","tilewidth","tileheight"))
    if m.get("orientation")!="isometric" or m.get("infinite") or min(W,H,TW,TH)<=0:
        raise ValueError("Expected a finite isometric ground grid.")
    gidmap={}
    for ref in m["tilesets"]:
        ts=json.loads((path.parent/ref["source"]).read_text(encoding="utf-8")) if "source" in ref else ref
        if "tiles" not in ts:
            raise ValueError("Only image-collection tilesets are supported.")
        for t in ts["tiles"]:
            gidmap[ref["firstgid"]+t["id"]]=propdict(t.get("properties"))
    layers={l["name"]:l for l in m["layers"]}
    ground=layers["Ground"]
    if ground["type"]!="tilelayer" or len(ground["data"])!=W*H:
        raise ValueError("Ground dimensions and native GID count disagree.")
    terrain=[]
    for gid in ground["data"]:
        if gid not in gidmap or "terrain" not in gidmap[gid]:
            raise ValueError(f"Unsupported/flipped/missing terrain GID: {gid}")
        terrain.append(gidmap[gid]["terrain"])
    objects=[]
    prop_sources=layers["Props"]["objects"]+layers.get("Ground decorations",{}).get("objects",[])
    for o in sorted(prop_sources,key=lambda obj:obj["id"]):
        if o.get("rotation",0)!=0 or o.get("gid") not in gidmap:
            raise ValueError("Rotated, flipped, non-tile, or missing props are unsupported.")
        p={**gidmap[o["gid"]],**propdict(o.get("properties"))}
        asset=p["asset"]
        if asset not in PROP_SPECS:
            raise ValueError(f"Unknown prop asset: {asset}")
        ax,ay=p.get("anchorX",.5),p.get("anchorY",1)
        dx=(.5-ax)*o["width"];dy=(1-ay)*o["height"]
        objects.append({"id":o["name"],"asset":asset,"x":round((o["x"]-dy-dx/2)/TH,6),"y":round((o["y"]-dy+dx/2)/TH,6),
                        "width":o["width"],"height":o["height"],"anchor":[ax,ay],
                        "blocksMovement":p.get("blocksMovement",False),"radius":p.get("radius",.3),"blocksProjectile":p.get("blocksProjectile",False)})
        if p.get("groundDecoration",False):objects[-1]["groundDecoration"]=True
    spawn=None; targets=[]
    for o in layers["Spawn and targets"]["objects"]:
        point={"x":o["x"]/TH,"y":o["y"]/TH}
        category=o.get('class') or o.get('type')
        if category=="Spawn":spawn=point
        elif category=="Target":targets.append({"id":o["name"],**point})
    if spawn is None:raise ValueError("Map requires a Spawn point.")
    return {"width":W,"height":H,"tileWidth":TW,"tileHeight":TH,"terrain":terrain,"walkable":[t!="water" for t in terrain],
            "objects":objects,"spawn":spawn,"targets":targets}


parser=argparse.ArgumentParser(description='연목 고갯길 Tiled 지도 컴파일')
parser.add_argument('source',nargs='?',type=Path,default=ROOT/'editable/yeonmok.tmj')
parser.add_argument('--output',type=Path,default=ROOT/'data/yeonmok.json')
args=parser.parse_args()
p=args.source
mapdata=import_tiled(p)
src=json.loads(p.read_text())
layer=next(l for l in src['layers'] if l['name']=='Chapter 1')
anchors={o['name']:{'x':o['x']/mapdata['tileHeight'],'y':o['y']/mapdata['tileHeight']} for o in layer['objects'] if o['point']}
if len(anchors)!=len(layer['objects']):raise ValueError('Duplicate or missing chapter point')
mapdata.update(meta={'title':'연목 고갯길','revision':1,'source':'editable/yeonmok.tmj'},anchors=anchors,cell=180)
args.output.write_text(json.dumps(mapdata,ensure_ascii=False,separators=(',',':'))+'\n')
