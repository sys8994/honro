"""Assert the production art build retains every exact released gameplay/save authority."""
import hashlib,json,re,subprocess,sys
from pathlib import Path
root=Path(sys.argv[1]); out=Path(sys.argv[2]); old=sys.argv[3]
def git(*args): return subprocess.check_output(['git','-C',str(root),*args])
m=json.loads((root/'web/manifest.json').read_bytes())
was=json.loads(git('show',old+':web/manifest.json'))
assert m['project']==was['project']
q=lambda k:{f['path']:f['sha256'] for f in k['files'] if 'act6-qa-chapter-' in f['path']}
assert q(m)==q(was) and len(q(m))==10
for p,h in q(m).items(): assert hashlib.sha256((root/p).read_bytes()).hexdigest()==h
def main(m):
 return next(r['path'] for r in m['files'] if 'ordered-game-24-normal51.' in r['path'])
s0=git('show',old+':'+main(was)).decode()
s1=(root/main(m)).read_text()
assert 'mountAct6TerrainArt' in s1 and s0!=s1
art=[r for r in m['files'] if 'act6-terrain-art-' in r['path']]
assert len(art)==10
for a in art:
 assert hashlib.sha256((root/a['path']).read_bytes()).hexdigest()==a['sha256']
assert not [r for r in was['files'] if 'act6-terrain-art-' in r['path']]
pat=r'boundary:\{build:"([0-9a-f]{64})",owner:(\{[^}]+\}),layout:(\{.*?\}\}\})'
prior=re.search(pat,s0); now=re.search(pat,s1)
assert prior and now and prior.group(0)==now.group(0)
assert prior.group(1)=='33a76bb72ae121b9786958b6e39d83bf9903fc5450053d1d47a7b6b8e212e36d'
mo=now.group(0)
assert len(re.findall(r'[0-9a-f]{64}',mo))>=16
sha=lambda data:hashlib.sha256(data).hexdigest()
(out/'TERRAIN-AUTHORITY.json').write_text(json.dumps({'predecessor':old,'packets':q(m),'boundaryBuild':now.group(1),'boundaryBlockSHA':sha(mo.encode()),'priorCampaignGraph':m['project'],'releaseRuntime':main(m),'runtimeSHA256':sha(s1.encode()),'visualSidecars':art,'manifestSHA256':sha((root/'web/manifest.json').read_bytes())}, indent=2)+'\n')
