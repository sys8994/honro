"""Draw the proposed route centerlines and independent contact masks at world scale."""
import itertools
import json
import math
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
DATA=json.loads((HERE/"routes.json").read_text())
LAYOUT=json.loads((ROOT/"shared/act6-b-slice/layout.json").read_text())

def line(points,width=13,color="#8fcbce",dash=""):
    coords=" ".join(f"{x},{y}" for x,y in points)
    return f'<polyline points="{coords}" fill="none" stroke="{color}" stroke-width="{width}" stroke-dasharray="{dash}" stroke-linecap="round" stroke-linejoin="round"/>'

def text(x,y,message,size=20,color="#eae5d1"):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}">{message}</text>'

def rect(x,y,w,h,fill):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>'

def circle(x,y,fill):
    return f'<circle cx="{x}" cy="{y}" r="17" fill="{fill}"/>'

def distance(points):
    return sum(math.dist(a,b) for a,b in itertools.pairwise(points))

def shortest(map_):
    d=distance(map_["main"])
    for f in map_["forks"]:
        alt=distance(f["points"])
        direct=distance(map_["main"][f["leave"]:f["join"]+1])
        d+=min(0,alt-direct)
    return d

def draw():
    svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="694" viewBox="0 0 1440 694">',
         '<title>Stage 53 and 54 proposed routes and isolated B, C, D contact masks</title>',
         '<g font-family="system-ui,sans-serif">',rect(0,0,1440,694,"#222724"),
         text(26,40,"Mumyeongsa · route proposals and threshold contact masks",26),
         text(26,67,"Solid lines are proposed main routes, dotted lines rejoin. The left plans share one world scale.",15,"#aeb7ae")]
    for idx,number in enumerate(("53","54")):
        d=DATA[number]
        x=27+idx*456
        svg += [text(x,105,"Stage "+number+" · "+str(round(shortest(d)))+" world px shortest plan",20),
                f'<g transform="translate({x},123) scale(.139)">',rect(0,0,*d["world"],"#2d3430")]
        room_anchors=(0,3,6,12) if number=="53" else (0,3,8,12)
        for i,anchor in enumerate(room_anchors,1):
            px,py=d["main"][anchor]
            svg.append(f'<rect x="{px-168}" y="{py-177}" width="336" height="354" rx="28" fill="none" stroke="#566c62" stroke-width="12"/>')
            svg.append(text(px-135,py+134,str(i),97,"#b6c2b7"))
        for f in d["forks"]:
            svg.append(line(f["points"],13,"#ddad7a","23 24"))
            for idx in (f["leave"],f["join"]):
                svg.append(circle(*d["main"][idx],"#dbaa75"))
        svg.append(line(d["main"]))
        for n,(px,py) in zip(("A" if number=="53" else "B","B" if number=="53" else "C"),(d["main"][0],d["main"][-1])):
            svg.append(circle(px,py,"#e5ca86"))
            svg.append(text(px-70,py-85,n,106))
        svg.append("</g>")
        svg.extend(text(x,573+i*23,f"{i+1}  {room}",14,"#b7c3b9") for i,room in enumerate(d["rooms"]))
    sx=965
    svg.append(text(sx,105,"B · same geometry across the seam"))
    svg.append(f'<g transform="translate({sx},116) scale(.285)">')
    svg.extend(rect(t["left"],t["top"],t["right"]-t["left"],t["bottom"]-t["top"],"#55534e") for t in LAYOUT["solids"])
    svg.extend([line([(760,206),(760,948)],9),line([(536,710),(760,710)],8,"#ddad7a","18 14"),
                line([(536,620),(760,620)],5,"#baa98c","13 14")])
    svg.append("</g>")
    svg.append(text(sx,457,"B 224 · right gravity · y=710 join",15,"#b7c3b9"))
    svg.append(text(sx,497,"C 236 · up gravity",15))
    svg.append(text(sx+215,497,"D 408 · right gravity",15))
    scale=.285
    svg.extend([rect(sx,521,160,8,"#55534e"),rect(sx,529+236*scale,160,8,"#55534e"),
                line([(sx,529),(sx+160,529)],3),rect(sx+215,520,8,138,"#55534e"),
                rect(sx+223+408*scale,520,8,138,"#55534e"),
                line([(sx+223+408*scale,520),(sx+223+408*scale,658)],3)])
    svg.append("</g></svg>")
    (HERE/"route-plan.svg").write_text("\n".join(svg)+"\n")
    print({n:round(shortest(DATA[n]),2) for n in ("53","54")})

if __name__=="__main__":
    draw()
