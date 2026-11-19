"""Local disposable fixture only. No fetch/push/build/server. Execute only after review."""
import argparse, hashlib, json, os, pathlib, subprocess
HERE=pathlib.Path(__file__).resolve().parent
m=json.loads((HERE/'manifest.json').read_text())
p=argparse.ArgumentParser();p.add_argument('checkout',type=pathlib.Path);a=p.parse_args()
temp=pathlib.Path(os.environ['RUNNER_TEMP']).resolve(strict=True)
checkout=a.checkout.resolve(strict=True)
assert checkout==temp/'g-entry-fixture' and not a.checkout.is_symlink(),'Only exact RUNNER_TEMP/g-entry-fixture is writable'
assert checkout!=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve(strict=True),'Never patch original checkout'
assert (checkout/'.git').is_file(),'A linked disposable worktree is required'
def git(*args):return subprocess.check_output(['git','-C',str(checkout),*args],text=True).strip()
head=git('rev-parse','HEAD');assert head==m['pin'],('wrong checkout',head)
assert git('rev-parse','--show-toplevel')==str(checkout)
assert subprocess.run(['git','-C',str(checkout),'symbolic-ref','-q','HEAD'],capture_output=True).returncode==1,'HEAD must be detached'
assert not git('status','--porcelain','--untracked-files=all'),'Fixture must start completely pristine'
owned=checkout/'shared/act5-world.mjs';new=checkout/'shared/data/act5/stage42-g-domain.witness.mjs'
assert owned.resolve()==owned and new.parent.resolve()==new.parent and not new.exists() and not new.is_symlink(),'Owned path must be pristine and nonsymlink'
assert hashlib.sha256(owned.read_bytes()).hexdigest()==m['stockSha256']['shared/act5-world.mjs']
assert hashlib.sha256((HERE/'g-domain.json').read_bytes()).hexdigest()==m['inputSha256']
d=json.loads((HERE/'g-domain.json').read_text());ring=d['original'];assert len(d['world'])==100
for path,digest in m['stockSha256'].items():
 b=subprocess.check_output(['git','-C',str(checkout),'show',head+':'+path]);assert hashlib.sha256(b).hexdigest()==digest,path
subprocess.run(['node',str(HERE/'verify-domain.cjs'),str(checkout),str(HERE/'g-domain.json')],check=True)
assert len(ring)==76 and d['play']==dict(left=0,top=0,right=6500,bottom=4420)
assert ring[-2]['y']==ring[-1]['y']==4420
source=subprocess.check_output(['git','-C',str(checkout),'show',head+':shared/act5-world.mjs']).decode()
assert hashlib.sha256(source.encode()).hexdigest()==m['stockSha256']['shared/act5-world.mjs'],'Pinned source byte mismatch'
def replace(old,new):
 global source
 assert source.count(old)==1,('unexpected seam count',old[:100],source.count(old))
 source=source.replace(old,new)
replace("import {terrain} from './data/act5/terrain.mjs';", "import {terrain} from './data/act5/terrain.mjs';\nimport {gWitness42,gSupport42} from './data/act5/stage42-g-domain.witness.mjs';")
replace('height=Math.ceil(vector.viewBox[3]*g.width/vector.viewBox[2])+360;', 'height=id===42?gWitness42.play.bottom:Math.ceil(vector.viewBox[3]*g.width/vector.viewBox[2])+360;')
replace('const contact=(x,y)=>toWorld([x,snap(g.lines,x,y)]);','const contact=(x,y)=>id===42?gSupport42(toWorld([x,y]).x):toWorld([x,snap(g.lines,x,y)]);')
replace('  library.push({id:assetId,','  if(id!==42)library.push({id:assetId,')
replace('  const surfaces=g.lines.map(',"  const surfaces=id===42?[{id:'stage42-g-engineering-ground',name:'G engineering witness only',type:'solid',points:gWitness42.world,playProjection:{bounds:gWitness42.play,start:gWitness42.original[0]},oneWay:false,baseMaterial:'rock',breakable:false,layer:'terrain'}]:g.lines.map(")
replace('const links=(crossings[id]||[]).flatMap(', 'const links=(id===42?[]:crossings[id]||[]).flatMap(')
replace("terrainBounds:{left:-1800,top:-2400,right:g.width+1800,bottom:height+2200},", "terrainBounds:id===42?gWitness42.terrain:{left:-1800,top:-2400,right:g.width+1800,bottom:height+2200},")
replace("elements:[{id:'a5-near',assetId", "elements:id===42?[]:[{id:'a5-near',assetId")
# Write only the two reviewed source-owned paths in this detached temporary worktree.
owned.write_text(source)
module='// TEST ONLY. Engineering witness, no approved art or final geometry.\nexport const gWitness42='+json.dumps(d,separators=(',',':'))+';\n'
module+="""export function gSupport42(x){
 const top=gWitness42.original.slice(0,-2);
 for(let i=1;i<top.length;i++){const a=top[i-1],b=top[i];
  if(x>=a.x&&x<=b.x&&b.x>a.x)return {x,y:Math.round((a.y+(x-a.x)*(b.y-a.y)/(b.x-a.x))*100)/100};
 }throw Error('No gWitness42 support '+x);
}
"""
new.write_text(module)
assert git('rev-parse','HEAD')==head
assert git('diff','--name-only')=='shared/act5-world.mjs'
assert git('ls-files','--others','--exclude-standard')=='shared/data/act5/stage42-g-domain.witness.mjs'
print(checkout)
