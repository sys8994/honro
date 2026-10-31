#!/usr/bin/env python3
"""Copy read-only browser storage captures losslessly; do not modify originals."""
import base64,hashlib,json,lzma,sys
from pathlib import Path
source=Path(sys.argv[1]);destination=Path(sys.argv[2]);destination.mkdir(parents=True,exist_ok=True)
for mpath in sorted(source.glob('*-manifest.json')):
 manifest=json.loads(mpath.read_text()); archived=[]
 for item in manifest['items']:
  raw=(source/item['path']).read_bytes();assert len(raw)==item['bytes'] and hashlib.sha256(raw).hexdigest()==item['sha256']
  packed=lzma.compress(raw,preset=9);name=item['path']+'.xz.b64';target=destination/name;encoded=base64.b64encode(packed)+b'\n'
  if target.exists():assert target.read_bytes()==encoded
  else:target.write_bytes(encoded)
  archived.append({**item,'compressedPath':name,'xzBytes':len(packed),'xzSha256':hashlib.sha256(packed).hexdigest()})
 output={**manifest,'items':archived};target=destination/mpath.name;encoded=(json.dumps(output,ensure_ascii=False,indent=2)+'\n').encode()
 if target.exists():assert target.read_bytes()==encoded
 else:target.write_bytes(encoded)
 print(mpath.name,[(x['key'],x['sha256'],x['saved']) for x in archived])
