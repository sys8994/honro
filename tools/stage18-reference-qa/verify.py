import hashlib,json,re,subprocess,sys
from pathlib import Path
from splice import plan,signature
stock,after,out=map(Path,sys.argv[1:])
raw=Path('shared/data/campaign.json')
compact=Path('shared/data/act2/stage18-compact-package.json')
author=Path('tools/map-forge/stage18-short-quest.mjs')
records=[]
for path,scope,blob in [(raw,'raw-campaign','edaf31a5fda2b7db0202bc0efb52dd83e54f6b9e'),(compact,'compact-package','b7866726cc789fad4f596b533e998cbf0c12dcec')]:
 old=(stock/path).read_bytes()
 assert (after/path).read_bytes()==old
 new,proof=plan(old,scope)
 assert proof['oldGitBlob']==blob
 (after/path).write_bytes(new)
 records.append(proof)
old=(stock/author).read_bytes()
assert (after/author).read_bytes()==old
assert subprocess.check_output(['git','-C',stock,'hash-object',author],text=True).strip()=='3304d5d496f1e65cff3a307a920c1e57f6af9c4e'
marker=b' s.anchors.spawn=party.archer;'
patch=b' const present=new Set(s.units.map(u=>u.id));for(const group of s.encounters)group.unitIds=group.unitIds.filter(id=>present.has(id));\n'
assert old.count(marker)==1 and patch not in old
new=old.replace(marker,patch+marker)
(after/author).write_bytes(new)
assert new.replace(patch,b'')==old
for path in [raw,compact,author]:
 assert (stock/path).read_bytes()!= (after/path).read_bytes()
status=subprocess.check_output(['git','-C',after,'diff','--name-only'],text=True)
assert sorted(status.splitlines())==sorted(map(str,(raw,compact,author)))
(out/'splices.json').write_text(json.dumps({'exactPaths':status.splitlines(),'authorAddedBytes':len(patch),'authorOldSHA256':hashlib.sha256(old).hexdigest(),'authorNewSHA256':hashlib.sha256(new).hexdigest(),'maps':records},indent=2))
