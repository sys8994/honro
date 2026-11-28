"""Walk the real chapter under two layered props; count covered actor pixels."""

import argparse, json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--base", required=True)
parser.add_argument("--out", required=True, type=Path)
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)
setup = """async id=>{
 const base=document.baseURI,get=p=>new URL('topview/'+p,base);
 const m=await(await fetch(get('data/yeonmok.json'))).json();
 const {terrainSpace,center}=await import(get('src/terrain.mjs')),space=terrainSpace(m);
 const {sceneryParts,drawScenery}=await import(get('src/canopy.mjs'));
 const {paintSprite,angleRow}=await import(get('src/actors.mjs'));
 const o=m.objects.find(o=>o.id===id),at={x:o.x*m.tileWidth,y:o.y*m.tileHeight};
 const high=o.asset==='shrine'?'roof':'crown',images=new Map();
 for(const [key,path] of [[o.asset,'props/'+o.asset],[o.asset+'-base','props/'+o.asset+'-base'],[o.asset+'-'+high,'props/'+o.asset+'-'+high],['seolo-states','actors/seolo-states']]){
  const img=new Image();img.src=get('assets/'+path+(key==='seolo-states'?'.webp':'.png'));await img.decode();images.set(key,img);
 }
 const upper=sceneryParts(o,at,images).find(p=>p.part===high);
 const canvas=document.createElement('canvas');canvas.width=96;canvas.height=80;const ctx=canvas.getContext('2d',{willReadFrequently:true});
 function coverage(x,y,row=0){
  if(y>=upper.depth)return 0;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,96,80);ctx.globalCompositeOperation='source-over';
  paintSprite(ctx,images,'seolo','idle',row,0,48,71,58);
  ctx.globalCompositeOperation='source-in';ctx.translate(48-x,71-y);drawScenery(ctx,upper);
  const rgba=ctx.getImageData(0,0,96,80).data;let n=0;
  for(let i=3;i<rgba.length;i+=4)if(rgba[i]>90)n++;return n;
 }
 const toWorld=(x,y)=>({x:x*m.cell/m.tileWidth,y:y*m.cell/m.tileHeight});
 const A=HonroApp,u=A.engine.active;
 const margins=o.asset==='shrine'?[[-42,-26],[-15,10]]:[[-45,-27],[3,23]];
 const choices=margins.map(([lo,hi])=>{
  let best=null;
  for(let dx=-o.width*.44;dx<o.width*.45;dx+=6)for(let dy=lo;dy<=hi;dy+=3){
    const x=at.x+dx,y=at.y+dy,world=toWorld(x,y);
    if(!space.legal(world,u.r+2))continue;
    const count=coverage(x,y),score=count-.35*Math.abs(dx)-.40*Math.abs(dy-(lo+hi)/2);
    if(count>0&&(!best||score>best.score))best={x,y,world,count,score};
  }
  if(!best)throw Error('No walkable overhang for '+id+' in '+lo+'..'+hi);return best;
 });
 let front;
 for(let d=12;d<110;d+=5){const x=choices[1].x,y=upper.depth+d,world=toWorld(x,y);if(space.legal(world,u.r+2)){front={x,y,world,count:coverage(x,y)};break;}}
 if(!front)throw Error('No clear approach');
 window.measureOverhang=()=>{
  const u=A.engine.active,foot=center(u),p=HonroTopview.projection.forward(foot.x,foot.y),v=HonroTopview.projection.forward(u.tvHeading.x,u.tvHeading.y);
  return {actor:u.id,px:p.x,py:p.y,world:foot,highDepth:upper.depth,legal:space.legal(foot,u.r),coveredPixels:coverage(p.x,p.y,angleRow(v.x,v.y)),round:A.engine.b.round};
 };
 return {kind:high,at,goals:[...choices,front]};
}"""
with sync_playwright() as pw:
    browser = pw.chromium.launch(
        executable_path=os.getenv("CHROMIUM", "/usr/bin/chromium"),
        args=["--no-sandbox"],
    )
    log = {}
    for target in ["pine_b_010", "shrine-at-fork"]:
        page = browser.new_page(viewport={"width": 1060, "height": 710})
        page.goto(args.base)
        page.locator("#tv-start").click(timeout=20000)
        page.wait_for_function("!!HonroApp.engine")

        def ready():
            end = time.monotonic() + 30
            while time.monotonic() < end:
                btn = page.locator("[data-action=dialogue-next]:visible")
                if btn.count():
                    btn.first.click()
                elif page.evaluate(
                    "HonroApp.canInput()&&!HonroStory.turnPaused(HonroApp)"
                ):
                    return
                else:
                    page.wait_for_timeout(120)
            raise RuntimeError("Player turn unavailable")

        ready()
        plan = page.evaluate(setup, target)
        print(
            target,
            [(round(g["x"]), round(g["y"]), g["count"]) for g in plan["goals"]],
            flush=True,
        )
        values = []
        log[target] = {"kind": plan["kind"], "positions": values}
        for label, goal in zip(["behind", "under", "front"], plan["goals"]):
            for attempt in range(12):
                ready()
                state = page.evaluate(
                    """({x,y})=>{const a=HonroApp,u=a.engine.active;return [Math.hypot(u.x-x,u.y-u.h/2-y),u.moveLeft]}""",
                    goal["world"],
                )
                if state[0] < 5:
                    break
                if state[1] < 3:
                    page.locator("[data-action=defend]:visible").first.click()
                    continue
                # Set only the view, then issue the move as a real click on the game canvas.
                pt = page.evaluate(
                    """({x,y})=>{const s=HonroApp.scene;s.centerAt(x,y);return s.screenPoint(x,y)}""",
                    goal["world"],
                )
                page.mouse.click(pt["x"], pt["y"])
                for _ in range(115):
                    page.wait_for_timeout(85)
                    if page.evaluate(
                        """()=>{const a=HonroApp,u=a.engine.active;return !!a.dialogue||!u?.tvPath?.length||u.moveLeft<2}"""
                    ):
                        break
            else:
                raise RuntimeError((target, label, "goal not reached", state))
            ready()
            page.wait_for_timeout(240)
            measure = page.evaluate("measureOverhang()")
            values.append({"label": label, **measure})
            page.locator("#battlecanvas").screenshot(
                path=str(args.out / (target + "-" + label + ".jpg")), quality=85
            )
            print(label, measure["legal"], measure["coveredPixels"], flush=True)
            assert measure["legal"] and (
                measure["coveredPixels"] > 0
                if label != "front"
                else measure["coveredPixels"] == 0
            ), (target, label, measure)
            (args.out / "overhang.json").write_text(
                json.dumps(log, ensure_ascii=False, indent=2) + "\n"
            )
        page.close()
    browser.close()
