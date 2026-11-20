import json,sys
from pathlib import Path
from PIL import Image, ImageChops
p=Path(sys.argv[1]);records=[]
a,b=[{f["name"]:f for f in json.loads((p/v/"proof.json").read_text())["frames"]} for v in ("baseline","candidate")]
for n,x in a.items():
 if n not in b:continue
 y=b[n]
 A=Image.open(p/"baseline"/n).convert("RGB"); B=Image.open(p/"candidate"/n).convert("RGB")
 d=ImageChops.difference(A,B); upper=d.crop((0,0,A.width,663))
 def count(i):return sum(any(px) for px in i.getdata())
 records.append(dict(stage=x["stage"], view=x["view"], changed=count(d), protected=count(upper), changedMax=max(v[1] for v in d.getextrema()), protectedMax=max(v[1] for v in upper.getextrema()), bbox=d.getbbox(), replay=x["repeatSameEncoded"] and y["repeatSameEncoded"], stateSame=x["physicsSha256"]==y["physicsSha256"], viewSame=all(x[k]==y[k] for k in ("actual","requested","viewport","css","backing")), imageSetSame={i["src"] for i in x["images"]}=={i["src"] for i in y["images"]}))
(p/"exact-comparison.json").write_text(json.dumps(records,indent=2))
print(json.dumps(records,indent=2))
assert len(records)==4 and all(r["replay"] and r["stateSame"] and r["viewSame"] and r["imageSetSame"] and (r["changed"]==0 if r["stage"]==13 else r["changed"]>0 and r["protected"]==0) for r in records), "Exact acceptance failed"
