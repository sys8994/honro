from pathlib import Path
from hashlib import sha256
import json,subprocess,sys
stock=Path(sys.argv[1]);target=Path(sys.argv[2]);out=Path(sys.argv[3]);files=Path(__file__).parent
rp='shared/runtime/act4-pilot-art.js'
old=(stock/rp).read_bytes()
assert old==(target/rp).read_bytes()
blob=subprocess.check_output(['git','hash-object',str(stock/rp)],text=True).strip()
assert blob=='9ce3713ee7c926d2aba95d92592ba563a9f16d91',blob
source=old.decode()
const='const S=G.HonroScene?.prototype;'
hook="   if(G.HonroVectorArt?.draw(raw,l.asset,l))return;"
assert source.count(const)==source.count(hook)==1
exact=json.loads((files/'clips.json').read_text());assert list(exact)==['s34-pad-bottom','s34-pad-right','s34-pad-upper']
SIGN={'clips.json':'06a1a187be31fb059d43786f0d0bcb2451c7e879e1e0046ffacebf98dc744f5b',
      'independent-support-mask.json':'e2f695a210655c416ba4b9a7a995819a27b67d89bd6909b25cb1bac62e49e03f',
      'old-stitch-anchors.json':'3e558f665013447406bdf89b8e2150394d393d5c7aba38c97244efdf157c2a0f',
      'prior-stock-receipts.json':'07abcb1c0ec6215d0b2b70ba06fc59a05670dbb11565ea71da543ae4d42474da'}
for f,sig in SIGN.items():assert sha256((files/f).read_bytes()).hexdigest()==sig,f
cert=json.loads((files/'independent-support-mask.json').read_text())
assert cert['numPixels']==61035 and min(y for y,*_ in cert['rows'])==562
assert sum(b-a for _,*p in cert['rows'] for a,b in zip(p[::2],p[1::2]))==61035
new=(files/'atomic-insert.txt').read_text().replace('__SIGNED_MASK_DATA__',json.dumps(exact,separators=(',',':'))).replace('__SUPPORT_ROWS__',json.dumps(cert['rows'],separators=(',',':')))
assert all(t not in new for t in ['__SIGNED_MASK_DATA__','__SUPPORT_ROWS__'])
after=source.replace(const,new+const,1).replace(hook,'   if(qa34AtomicFoundation(this,raw,l,b))return;\n'+hook,1)
assert after.replace(new+const,const,1).replace('   if(qa34AtomicFoundation(this,raw,l,b))return;\n'+hook,hook,1).encode()==old
(target/rp).write_text(after)
delta=subprocess.check_output(['git','-C',str(target),'diff','--name-only'],text=True).splitlines()
assert delta==[rp],delta
(out/'patch-shas.json').write_text(json.dumps(dict(pin=blob,path=rp,oldSha=sha256(old).hexdigest(),newSha=sha256(after.encode()).hexdigest(),maskSha=sha256((files/'clips.json').read_bytes()).hexdigest(),supportSha=sha256((files/'independent-support-mask.json').read_bytes()).hexdigest()),indent=2))
