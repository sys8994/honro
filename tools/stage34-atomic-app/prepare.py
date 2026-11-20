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
new=(files/'atomic-insert.txt').read_text().replace('__SIGNED_MASK_DATA__',json.dumps(exact,separators=(',',':')))
assert '__SIGNED_MASK_DATA__' not in new
after=source.replace(const,new+const,1).replace(hook,'   if(qa34AtomicFoundation(this,raw,l,b))return;\n'+hook,1)
assert after.replace(new+const,const,1).replace('   if(qa34AtomicFoundation(this,raw,l,b))return;\n'+hook,hook,1).encode()==old
(target/rp).write_text(after)
delta=subprocess.check_output(['git','-C',str(target),'diff','--name-only'],text=True).splitlines()
assert delta==[rp],delta
(out/'patch-shas.json').write_text(json.dumps(dict(pin=blob,path=rp,oldSha=sha256(old).hexdigest(),newSha=sha256(after.encode()).hexdigest(),maskSha=sha256((files/'clips.json').read_bytes()).hexdigest(),supportSha=sha256((files/'independent-support-mask.json').read_bytes()).hexdigest()),indent=2))
