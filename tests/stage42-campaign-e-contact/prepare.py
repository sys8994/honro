"""Local disposable fixture only. No fetch/push/build/server. Execute only after review."""
import argparse, hashlib, io, json, pathlib, subprocess, tarfile
HERE=pathlib.Path(__file__).resolve().parent
m=json.loads((HERE/'manifest.json').read_text())
p=argparse.ArgumentParser();p.add_argument('checkout',type=pathlib.Path);p.add_argument('destination',type=pathlib.Path);a=p.parse_args()
head=subprocess.check_output(['git','-C',str(a.checkout),'rev-parse','HEAD'],text=True).strip()
assert head==m['pin'],('wrong checkout',head)
assert not a.destination.exists(),'Destination must not exist; existing work will never be replaced'
for row in m['inputs'].values():assert hashlib.sha256((HERE/row['path']).read_bytes()).hexdigest()==row['sha256']
d=json.loads((HERE/m['inputs']['domain-proof.json']['path']).read_text());grade=json.loads((HERE/m['inputs']['local-deck-grade.json']['path']).read_text())
ring=d['original'];assert len(d['world'])==88
for path,digest in m['stockSha256'].items():
 b=subprocess.check_output(['git','-C',str(a.checkout),'show',head+':'+path]);assert hashlib.sha256(b).hexdigest()==digest,path
subprocess.run(['node',str(HERE/'verify-domain.cjs'),str(a.checkout),str(HERE/'domain-proof.json')],check=True)
assert [ring[i] for i in grade['changed']]==grade['after']
assert len(ring)==64 and d['play']==dict(left=0,top=0,right=6500,bottom=4300)
assert ring[-2]['y']==ring[-1]['y']==4300
source=subprocess.check_output(['git','-C',str(a.checkout),'show',head+':shared/act5-world.mjs']).decode()
assert hashlib.sha256(source.encode()).hexdigest()==m['stockSha256']['shared/act5-world.mjs'],'Pinned source byte mismatch'
def replace(old,new):
 global source
 assert source.count(old)==1,('unexpected seam count',old[:100],source.count(old))
 source=source.replace(old,new)
replace("import {terrain} from './data/act5/terrain.mjs';", "import {terrain} from './data/act5/terrain.mjs';\nimport {witness42,support42} from './data/act5/stage42-ground-domain.witness.mjs';")
replace('height=Math.ceil(vector.viewBox[3]*g.width/vector.viewBox[2])+360;', 'height=id===42?witness42.play.bottom:Math.ceil(vector.viewBox[3]*g.width/vector.viewBox[2])+360;')
replace('const contact=(x,y)=>toWorld([x,snap(g.lines,x,y)]);','const contact=(x,y)=>id===42?support42(toWorld([x,y]).x):toWorld([x,snap(g.lines,x,y)]);')
replace('  library.push({id:assetId,','  if(id!==42)library.push({id:assetId,')
replace('  const surfaces=g.lines.map(',"  const surfaces=id===42?[{id:'stage42-engineering-ground',name:'Engineering witness only',type:'solid',points:witness42.world,playProjection:{bounds:witness42.play,start:witness42.original[0]},oneWay:false,baseMaterial:'rock',breakable:false,layer:'terrain'}]:g.lines.map(")
replace('const links=(crossings[id]||[]).flatMap(', 'const links=(id===42?[]:crossings[id]||[]).flatMap(')
replace("terrainBounds:{left:-1800,top:-2400,right:g.width+1800,bottom:height+2200},", "terrainBounds:id===42?witness42.terrain:{left:-1800,top:-2400,right:g.width+1800,bottom:height+2200},")
replace("elements:[{id:'a5-near',assetId", "elements:id===42?[]:[{id:'a5-near',assetId")
# Export tracked committed files only, without altering the supplied checkout.
archive=subprocess.check_output(['git','-C',str(a.checkout),'archive',head]);a.destination.mkdir(parents=True)
with tarfile.open(fileobj=io.BytesIO(archive)) as t:t.extractall(a.destination,filter='data')
(a.destination/'shared/act5-world.mjs').write_text(source)
module='// TEST ONLY. Engineering witness, no approved art or final geometry.\nexport const witness42='+json.dumps(d,separators=(',',':'))+';\n'
module+="""export function support42(x){
 const top=witness42.original.slice(0,-2);
 for(let i=1;i<top.length;i++){const a=top[i-1],b=top[i];
  if(x>=a.x&&x<=b.x&&b.x>a.x)return {x,y:Math.round((a.y+(x-a.x)*(b.y-a.y)/(b.x-a.x))*100)/100};
 }throw Error('No witness42 support '+x);
}
"""
(a.destination/'shared/data/act5/stage42-ground-domain.witness.mjs').write_text(module)
(a.destination/'LOCAL-ENGINEERING-WITNESS-NOT-RELEASE.json').write_text(json.dumps(m,indent=2))
print(a.destination)
