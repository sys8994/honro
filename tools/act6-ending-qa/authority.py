"""Verify the new normal release reuses all signed gameplay and save data."""
from hashlib import sha256
import json,re,subprocess,sys
from pathlib import Path
root,out,base=Path(sys.argv[1]),Path(sys.argv[2]),sys.argv[3]
def git(arg): return subprocess.check_output(['git','-C',str(root),'show',base+':'+arg])
m=json.loads((root/'web/manifest.json').read_bytes()); old=json.loads(git('web/manifest.json'))
assert old['project']==m['project']
oldrows={i['path']:i for i in old['files']}; rows={i['path']:i for i in m['files']}
def scope(rows,pattern): return {p:v for p,v in rows.items() if pattern in p}
assert len(scope(rows,'act6-qa-chapter-'))==10
for item in ('act6-qa-chapter-','act6-terrain-art-','journey-map-act6.','act6-ending-dawn-'):
 x,y=scope(oldrows,item),scope(rows,item);assert x and x==y,item
 for p,record in y.items():
  b=(root/p).read_bytes();assert len(b)==record['bytes'] and sha256(b).hexdigest()==record['sha256'],p
def main(m):return next(p for p in (x['path'] for x in m['files']) if 'ordered-game-24-normal51.' in p)
s0=git(main(old)).decode();s1=(root/main(m)).read_text()
pat=r'boundary:\{build:"([0-9a-f]{64})",owner:(\{[^}]+\}),layout:(\{.*?\}\}\})'
before=re.search(pat,s0);now=re.search(pat,s1)
assert before and now and before.group(0)==now.group(0)
assert before.group(1)=='33a76bb72ae121b9786958b6e39d83bf9903fc5450053d1d47a7b6b8e212e36d'
assert 'mountAct6TerrainArt' in s1 and 'HonroAct6Journey' in s1 and 'act6EndingReplan' in s1
views=scope(rows,'act6-ending-preview-')
places={**scope(rows,'act6-ending-shore-dawn'),**scope(rows,'act6-ending-dossier-room')}
actors={p:record for p,record in rows.items() if any(x in p for x in (
 'portrait-seoro-action-lower_bow.349c5a541a01528e.','portrait-hwigyeom-action-inspect_record.c719ee39c460ba5e.',
 'npc-portrait-yeonsil.6a79ba32cc70096d.'))}
assert len(places)==4 and len(actors)==3
for p,record in {**places,**actors}.items():
 data=(root/p).read_bytes()
 assert sha256(data).hexdigest()==record['sha256'] and len(data)==record['bytes'],p
assert len(views)==6
for p,r in views.items():
 b=(root/p).read_bytes();assert sha256(b).hexdigest()==r['sha256'],p
t=sha256((root/'assets/bgm/main.mp3').read_bytes()).hexdigest()
assert t=='a2ffcceb9b0045f72e6baeab7292fd503fd92c4969d727009c057a60cbaca5fd'
added=set(rows)-set(oldrows)
assert not any('/data/' in p or 'journey-map-act6.' in p for p in added),added
(out/'RELEASE-AUTHORITY.json').write_text(json.dumps({'base':base,'project':m['project'],
 'boundaryBuild':before.group(1),'boundaryBlockSHA':sha256(before.group(0).encode()).hexdigest(),
 'packets':scope(rows,'act6-qa-chapter-'),'journeyMap':scope(rows,'journey-map-act6.'),
 'previewMedia':views,'cinemaPlates':places,'existingActors':actors,'tempTrackSHA256':t,'newPaths':sorted(added),'entry':m['gameEntry']},ensure_ascii=False,indent=2)+'\n')
