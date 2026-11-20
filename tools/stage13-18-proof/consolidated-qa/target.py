import sys,json
from pathlib import Path
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'ci'))
from parser import produce,git_blob,sha256
source,target,output=map(Path,sys.argv[1:])
canonical=Path('shared/data/campaign.json')
owner=Path('tools/environment/stage22-vertical-art.mjs')
line=b" box('v22-lower-court','buried-west-foundation',0,5660,1590,940,'#354d48');box('v22-lower-court','buried-east-foundation',1610,4940,3200,1680,'#304a47');\n"
old=(source/canonical).read_bytes(); assert (target/canonical).read_bytes()==old
changed,receipt=produce(old,'canonical')
assert len(old)-len(changed)==350
assert sorted(r['bytes'] for r in receipt['removed'])==[172,178]
assert receipt['oldPlaneCount']==1157 and receipt['newPlaneCount']==1155
author=(source/owner).read_bytes();assert author==(target/owner).read_bytes() and author.count(line)==1
assert git_blob(author)=='4348002cc3e0ee17d7f2ec1cd6e481a81cfc2558'
new=author.replace(line,b'')
assert git_blob(new)=='2b272c0afcb9724ff7f2b15173fb64fc3feef5e3'
(target/canonical).write_bytes(changed);(target/owner).write_bytes(new)
receipt.update(authorBeforeSha256=sha256(author),authorAfterSha256=sha256(new),authorExactOneLine=True,bytesRemoved=350)
output.write_text(json.dumps(receipt,indent=2)+'\n')
