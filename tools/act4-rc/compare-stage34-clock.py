"""Compare unpacked, SHA-verified actual stage34 pre/post UI exports."""
import hashlib,json,sys
from pathlib import Path
p=Path(sys.argv[1]);names=['stage34-before-ui-export.json','stage34-after-ui-export.json'];hashes=['9f96357c20c051286561bf5aa2b127a93d9224044f9dfed1944c5b75cd6415c3','c0019d2dd837aa6bce7cbe1dc2b638bfb8e7475cd73b5c956821fa5e16522c12'];states=[]
for n,h in zip(names,hashes):
 raw=(p/n).read_bytes();assert hashlib.sha256(raw).hexdigest()==h;q=json.loads(raw)['honroBattle']['honroAct4PreviewState'];states.append(q)
a,b=states;ca=a.pop('clock');cb=b.pop('clock');assert a==b;print('only preview clock differs:',ca,'->',cb,'all remaining event state equal')
