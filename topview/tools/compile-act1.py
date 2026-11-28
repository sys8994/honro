"""Compile nine authored battlefields. Units are 180 world units per cell, raster 64×44 per cell."""
import json
import math
import random
import sys
from pathlib import Path
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import unary_union

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'editable/act1'))
from fields import FIELDS, DECKS
TW, TH, CELL = 64,44,180
# Sprite rectangle in projected map pixels, foot registration, physical radius in cells.
SIZES={
 'pine_a':(192,184,.94,.32),'pine_b':(170,158,.94,.29),'rock_large':(99,68,.84,.54),
 'rock_small':(49,37,.85,.23),'shrub':(42,33,.88,0),'stone_lantern':(43,69,.92,.18),
 'shrine':(184,184,.78,.72),'grain_cart':(136,112,.71,.48),'ruin_gate':(176,162,.72,0),
 'hut':(188,143,.85,.83),'shed':(214,160,.86,.97),'well':(85,77,.89,.48),'lookout':(97,166,.91,.42),
 'cargo':(85,54,.86,.4),'broken_pier':(116,85,.86,.38),'altar':(92,69,.85,.46),
 'guardtree':(187,184,.93,.40),'bridgepost':(52,72,.91,.21),'boulder':(107,76,.84,.56)
}
ALIASES={'boulder':'rock_large','bridgepost':'stump'}
def smooth(points,passes=2,closed=False):
    a=list(points)
    for _ in range(passes):
        out=[] if closed else [a[0]]
        for (x,y),(z,w) in zip(a, a[1:]+([a[0]] if closed else [])):
            out.extend([(.76*x+.24*z,.76*y+.24*w),(.24*x+.76*z,.24*y+.76*w)])
        if not closed:out.append(a[-1])
        a=out
    return a
def rings(g):
    if g.is_empty:return []
    return [[[list(map(lambda x:round(x,2),p)) for p in ring.coords[:-1]] for ring in [poly.exterior,*poly.interiors]] for poly in ([g] if g.geom_type=='Polygon' else g.geoms) if poly.geom_type=='Polygon']
def build(id,f):
    nx,ny=f.size;W,H=nx*TW,ny*TH;rng=random.Random(12003+id)
    def spot(s):
        return tuple(map(float,s.split(','))) if ',' in s else f.places[s]
    def project(p):return (p[0]*TW,p[1]*TH)
    def path(s):return [project(spot(k)) for k in s.split()]
    def shape(points):
        # Keep the silhouette weathered while smoothing away sharp drawing knots.
        a=smooth([project(p) for p in points],1,True);out=[]
        for p,q in zip(a,a[1:]+[a[0]]):
            dx=q[0]-p[0];dy=q[1]-p[1];n=max(1,round(math.hypot(dx,dy)/32))
            for i in range(n):
                t=i/n;j=rng.uniform(-4.2,4.2);length=max(1,math.hypot(dx,dy))
                out.append((p[0]+dx*t-dy*j/length,p[1]+dy*t+dx*j/length))
        return Polygon(out).buffer(0)
    drops=[shape(p) for p in f.drops];water=[shape(p) for p in f.water]
    wet=unary_union(water);unwalkable=unary_union([wet,*drops])
    decks=[dict(id=name, start=project(a), end=project(b), width=width, broken=broken)
           for name,a,b,width,broken in DECKS.get(id,[])]
    walkdecks=unary_union([LineString([d['start'],d['end']]).buffer(d['width']/2,cap_style=2) for d in decks])
    unwalkable=unwalkable.difference(walkdecks)
    roads=[dict(id=f'길 {i+1}',width=(48 if i==0 else 34)+rng.randrange(7),points=[[round(x,2),round(y,2)] for x,y in smooth(path(s))]) for i,s in enumerate(f.roads)]
    lanes=unary_union([LineString(t['points']).buffer(t['width']/2+22) for t in roads])
    occupied=[];objects=[]
    def add(asset,x,y,factor=1):
        w,h,ay,r=SIZES[asset];name=ALIASES.get(asset,asset);idx=len(objects)
        blocking=r>0;point=Point(x*TW,y*TH)
        objects.append(dict(id=f'{name}-{idx}',asset=name,x=round(x,3),y=round(y,3),width=round(w*factor,1),height=round(h*factor,1),anchor=[.5,ay],radius=round(r*factor,3),blocksMovement=blocking,blocksProjectile=blocking and name not in ('pine_a','pine_b','guardtree')))
        occupied.append(point.buffer(max(12,w*.21)))
    for asset,x,y in f.structures:add(asset,x,y)
    sites=[project(p) for p in f.places.values()]
    reserve=unary_union([Point(p).buffer(54) for p in sites]+[walkdecks.buffer(24)])
    # The crown rises in screen space. A clear foot alone is insufficient if a
    # foreground tree permanently covers the actor, a binding or the debtor's ledger.
    crown_clearance=unary_union([box(x-64,y-12,x+64,y+104) for x,y in sites])
    for i in range(nx*ny//2):
        x,y=rng.uniform(.4,nx-.4),rng.uniform(.4,ny-.4);p=Point(x*TW,y*TH)
        if reserve.contains(p) or lanes.contains(p) or unwalkable.contains(p) or any(o.contains(p) for o in occupied):continue
        outside=min(x,y,nx-x,ny-y)<3.8
        if not outside and rng.random()>.49:continue
        a=rng.choices(['pine_a','pine_b','rock_large','rock_small','shrub'],weights=[4,4,1.5,1,2] if outside else [1,1.6,2.8,2,4])[0]
        factor=rng.uniform(.9,1.08)
        if a.startswith('pine') and crown_clearance.contains(p):continue
        add(a,x,y,factor)
    cols,rows=math.ceil(W/96)+2,math.ceil(H/24)+3
    grid=[]
    for i in range(cols*rows):
        x,y=(i%cols+.5+.5*(i//cols%2))*96-50,(i//cols+1)*24-24
        v=math.sin(x*.003+y*.008+id)+.8*math.cos(y*.009-x*.001)+rng.uniform(-.4,.4)
        grid.append('rock' if v>.79 else 'dirt' if v<-.36 else 'grass')
    anchors={n:{'x':p[0],'y':p[1]} for n,p in f.places.items()}
    stairs=[[list(project(p)) for p in row] for row in f.steps]
    return dict(width=nx,height=ny,tileWidth=TW,tileHeight=TH,cell=CELL,
        meta=dict(title=f.title,stage=id,revision=2,source='editable/act1/fields.py',climate=f.climate),
        anchors=anchors,placements=f.actors,convoy=[dict(x=p[0]*CELL,y=p[1]*CELL) for p in map(spot,f.convoy)],
        grid=dict(width=cols,height=rows,tileWidth=96,tileHeight=48,offsetX=50,offsetY=24,materials=grid),trails=roads,objects=objects,
        terrain=['water' if wet.contains(Point((x+.5)*TW,(y+.5)*TH)) else 'rock' if unwalkable.contains(Point((x+.5)*TW,(y+.5)*TH)) else 'grass' for y in range(ny) for x in range(nx)],
        river=rings(wet),blockedWater=rings(unwalkable),cliffs=[rings(p)[0][0] for p in drops],stairs=stairs,decks=decks)
if __name__=='__main__':
    for id,f in FIELDS.items():
        m=build(id,f);dest=ROOT/f'data/act1-{id:02}.json';dest.write_text(json.dumps(m,ensure_ascii=False,separators=(',',':'))+'\n')
        print(f"{id}: {len(m['objects'])} props, {len(m['trails'])} routes, {len(m['cliffs'])} cliff groups")
