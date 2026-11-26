"""Read actual Scene.unitBody and art bundles, with a controlled comparison pose.
No campaign/storage/engine simulation; --base adds the before panel from a Git ref.
"""
import argparse
import json
import os
import shutil
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright


FILES = [
    "shared/runtime/renderer.js", "shared/runtime/art-dark.js",
    "shared/assets/monsters/monsters.runtime.js", "shared/runtime/monster-vector.js",
    "shared/assets/actors/actors.runtime.js", "shared/runtime/actor-vector.js",
    "shared/runtime/act2-art.js",
]
SETUP = """
globalThis.HONRO_CONTENT={hero:{}};
globalThis.HONRO_CORE={};
const RealPath=Path2D, counts=new WeakMap();
globalThis.Path2D=class extends RealPath {
  constructor(d){super(d);if(typeof d==='string')counts.set(this,
    [...d.matchAll(/([MLQCZ])([^MLQCZ]*)/gi)].reduce((n,[,c,a])=>
      n+(a.match(/[-+]?(?:\\d*\\.)?\\d+/g)||[]).length/({M:2,L:2,Q:4,C:6,Z:1}[c.toUpperCase()]),0));
  }
};
globalThis.collectNodes=c=>{
  let n=0, path=0, done=false,last=null;
  const ctx=new Proxy(c,{get(t,k){
    const v=Reflect.get(t,k,t);
    if(typeof v!=='function')return v;
    return (...args)=>{
      if(k==='beginPath'){path=0;done=false;}
      if(['moveTo','lineTo','quadraticCurveTo','bezierCurveTo'].includes(k))path++;
      if(['ellipse','arc'].includes(k))path+=4;
      if(k==='fill'||k==='stroke'){
        if(args[0] instanceof RealPath){if(args[0]!==last||k==='fill')n+=counts.get(args[0])??0;last=args[0];}
        else if(!done){n+=path;done=true;}
      }
      if(k==='fillRect')n+=4;
      return v.apply(t,args);
    };
  },set(t,k,v){return Reflect.set(t,k,v,t);}});
  return [ctx,()=>n];
};
"""
RENDER = """
const rows=[
 ['minecart','Possessed load cart',84,{honroType:'minecart',honroAct2:true}],
 ['bier_boss','Empty funeral bier',108,{honroType:'bier',id:'boss'}],
 ['colossus','Sealed colossus (legacy)',238,{honroType:'boss',boss:1}],
 ...['archer','mage','knight','occultist'].map(cls=>['legacy_'+cls,'Legacy '+cls,102,{honroType:'compatibility',cls}]),
 ['warden','Jangseung reference',160,{honroMonsterSpecies:'warden',honroType:'warden'}]
];
const finaleIds=['boss_daedosa','grot_hanging','grot_hands','grot_door','wonhon','wonhon_knotted','gate_armor','forepaw'];
if(globalThis.drawFinale)rows.splice(0,rows.length,...finaleIds.map(id=>
  [id,id,HonroActorVisual.assets[id].baseHeight,{honroRigAsset:id,honroType:'ghost'}]));
const comparisons={},size=96,width=340,height=234;
for(const [id,label,h,flags] of rows){
  const row=document.createElement('section'), title=document.createElement('strong');
  title.textContent=label;row.append(title);document.body.append(row);
  const result={frames:{}};
  for(const [name,time,facing,moving,anim,hurt] of [['idle',0,1,0,0,0],['moving',.17,1,1,0,0],
    ['attack',.32,1,0,.74,0],['hit',.47,1,0,0,.58],['mirror',0,-1,0,0,0],['near',0,1,0,0,0]]){
    const canvas=document.createElement('canvas'), scale=(name==='near'?128:size)/h;
    canvas.width=width;canvas.height=height;row.append(canvas);
    const raw=canvas.getContext('2d'),[c,n]=collectNodes(raw);
    raw.translate(width/2,208);raw.scale(scale,scale);
    const s=new HonroScene(canvas);s.time=time;s.walkTime=time;s.scale=scale;
    s.partyVisual ??= new HonroPartyVisual({}, null, null);
    const unit={x:0,y:0,h,id,side:1,cls:'knight',facing,moving,anim,hurt,angle:facing>0?18:162,maxHp:100,hp:100,...flags};
    const before=JSON.stringify(unit);
    if(name==='hit')s.hitBody(c,unit,0);else s.unitBody(c,unit,name==='attack'?.5:0);
    if(JSON.stringify(unit)!==before)throw Error(id+' presentation modified unit');
    const px=raw.getImageData(0,0,width,height).data;
    let amin=width,amax=0,ymin=height,ymax=0,sum=0;
    for(let i=0;i<px.length/4;i++)if(px[i*4+3]>40){
      const x=i%width,y=Math.floor(i/width);amin=Math.min(amin,x);amax=Math.max(amax,x);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);sum++;
    }
    result.frames[name]={nodes:n(),painted:sum,extent:[amin,ymin,amax,ymax],image:canvas.toDataURL()};
    const actor=HonroActorVisual.kind(unit);if(['colossus','bier_boss'].includes(id)&&actor!==id)throw Error(id+' wrong route '+actor);
  }
  if(finaleIds.includes(id)){
    const asset=HonroActorVisual.assets[id], v=HonroActorVisual,time=.17;
    const u={id,side:1,honroRigAsset:id,h,x:0,y:0,facing:1};
    const bind=v.pose(asset,time,v.state(u));
    result.tracks={};
    for(const [k,patch] of Object.entries({move:{moving:1},attack:{anim:.74},hit:{hurt:.58},jump_fall:{airborne:true,vy:-1}})){
      result.tracks[k]=JSON.stringify(bind)!==JSON.stringify(v.pose(asset,time,v.state({...u,...patch})));
    }
  }
  comparisons[id]=result;
}
comparisons;
"""


def load_files(base=None):
    def read(f):
        return (subprocess.check_output(["git", "show", f"{base}:{f}"], text=True)
                if base else Path(f).read_text(encoding="utf-8"))
    adapter=read("shared/assets/rebuild-game-adapter.mjs").replace("export ", "")
    adapter+="\nglobalThis.resolveRebuildCharacter=resolveRebuildCharacter;"
    return "\n".join([adapter]+[read(f) for f in FILES])


def html(data, label):
    chunks = []
    for name, record in data.items():
        line = f'<strong>{name}</strong>'
        for key, frame in record["frames"].items():
            line += f'<figure><img src="{frame["image"]}"><figcaption>{key} · {frame["nodes"]}</figcaption></figure>'
        chunks.append(f"<section>{line}</section>")
    return """<!doctype html><meta charset=utf-8><style>body{background:#1e2828;color:#dfd4c0;font:14px system-ui;margin:20px}section{display:grid;grid-template-columns:142px repeat(6,1fr);gap:10px;align-items:center;min-height:145px;border-bottom:1px solid #4e5852}img{width:100%;min-width:0;display:block}figure{margin:0}figcaption{text-align:center;color:#8d9c90}h1{font-size:22px}</style>""" + f'<h1>{label}</h1>' + "".join(chunks)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base")
    ap.add_argument("--finale",action="store_true")
    ap.add_argument("--out", default="_local/reports/monster-detail-seven")
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        results = {}
        art = {}
        for label, version in ([("before",args.base)] if args.base else []) + [("after",None)]:
            browser = p.chromium.launch(executable_path=os.environ.get("HONRO_BROWSER") or shutil.which("chromium"),
                                       args=["--no-sandbox","--single-process","--no-zygote","--disable-gpu"])
            tab = browser.new_page(viewport={"width": 1440, "height": 1180})
            tab.set_content("<!doctype html><meta charset=utf-8><body></body>")
            tab.add_script_tag(content=SETUP+"\n"+load_files(version))
            if args.finale: tab.evaluate("() => { globalThis.drawFinale=true; }")
            data = tab.evaluate("() => {"+RENDER.rsplit("comparisons;",1)[0]+"return comparisons; }")
            art[label]=data
            tab.set_content(html(data,label))
            tab.screenshot(path=str(out/(label+".png")),full_page=True,animations="disabled")
            results[label] = {
                name:{k:{m:v for m,v in f.items() if m!="image"} for k,f in row["frames"].items()}
                for name,row in data.items()
            }
            for name,row in data.items():
                if label=="after" and name!="warden":
                    assert row["frames"]["idle"]["image"] != row["frames"]["moving"]["image"], name
                    assert row["frames"]["idle"]["image"] != row["frames"]["mirror"]["image"], name
                    if name!="minecart":  # exact same per-weapon scene swing/aim path is retained
                        assert row["frames"]["idle"]["image"] != row["frames"]["attack"]["image"], name
            if label=="after" and "before" in art:
                tab=tab if not args.finale else None
                if tab:tab.set_viewport_size({"width":1180,"height":1500})
                if tab:
                    from html import escape
                    labels={'minecart':'들린 운반수레','bier_boss':'빈 상여','colossus':'봉인 거신',
                            'legacy_archer':'구형 궁수','legacy_mage':'구형 술사','legacy_knight':'구형 무사',
                            'legacy_occultist':'구형 주술사','warden':'들린 장승 (기준)'}
                    groups=[]
                    for id in data:
                        images=[]
                        for version,key,lit in [('before','near','수정 전'),('after','near','수정 후'),('after','moving','이동'),('after','attack','행동')]:
                            frame=art[version][id]["frames"][key]
                            images.append(f'<figure><img src="{frame["image"]}"><figcaption>{lit} / {frame["nodes"]}</figcaption></figure>')
                        groups.append(f'<section><strong>{escape(labels[id])}</strong>{"".join(images)}</section>')
                    document="""<!doctype html><meta charset=utf-8><style>body{background:#1e2828;color:#e4dac7;font:17px system-ui,sans-serif;margin:28px}h1{font-size:25px}section{display:grid;grid-template-columns:145px repeat(4,1fr);align-items:center;border-bottom:1px solid #4e5852}figure{margin:0}img{width:100%;display:block}figcaption{text-align:center;color:#a7b5aa}</style><h1>혼로 몬스터 벡터 7종 전후 비교</h1>"""+''.join(groups)
                    tab.set_content(document)
                    tab.screenshot(path=str(out/"comparison.png"),full_page=True,animations="disabled")
                    (out/"comparison.html").write_text(document)
            browser.close()
    if args.finale:
        motion={name:row["tracks"] for name,row in art["after"].items()}
        assert len(motion)==8 and all(r["attack"] and r["hit"] for r in motion.values()),motion
        print(json.dumps(motion))
        (out/"motions.json").write_text(json.dumps(motion,indent=2)+"\n")
        return
    floors={"minecart":301,"bier_boss":647,"colossus":277,"legacy_archer":193,"legacy_mage":153,"legacy_knight":127,"legacy_occultist":171}
    after=results["after"]
    for id,floor in floors.items():
        roof={"minecart":601,"bier_boss":1293,"colossus":552,"legacy_archer":384,"legacy_mage":305,"legacy_knight":252,"legacy_occultist":340}[id]
        assert floor <= after[id]["idle"]["nodes"] <= roof, (id,after[id]["idle"]["nodes"],floor,roof)
        assert min(after[id]["near"]["extent"][0:2])>0, (id,"near silhouette clipping")
        if args.base:
            # Compare the painted bounds at the same scale, not the non-comparable art extents across poses.
            before=results["before"][id]["idle"]
            assert max(abs(a-b) for a,b in zip(before["extent"],after[id]["idle"]["extent"])) <= 6, (id,before,after[id]["idle"])
    (out/"metrics.json").write_text(json.dumps(results,indent=2)+"\n")
    print(json.dumps({label:{k:v["idle"]["nodes"] for k,v in items.items()} for label,items in results.items()}))


if __name__ == "__main__":
    main()
