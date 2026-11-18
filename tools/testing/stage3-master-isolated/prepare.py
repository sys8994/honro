from pathlib import Path
import json,hashlib,shutil
R=Path('stage3-master-isolated');B=Path('stage37-release-scope/master');changes=[]
paths=['shared/build.mjs','shared/runtime/renderer.js','shared/runtime/terrain-readability.js']
for p in paths:
 d=R/'candidate'/p;d.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(B/p,d)
def patch(p,a,b):
 f=R/'candidate'/p;s=f.read_text();assert s.count(a)==1,(p,a);f.write_text(s.replace(a,b));changes.append(dict(path=p,old=a,new=b))
for c in json.load(open('stage3-selective-integration-local/patch-contract.json'))['changes']:
 if c['path']=='shared/build.mjs':patch(c['path'],c['old'],c['new'])
p='shared/runtime/renderer.js'
helper="""        _naruRasterBounds(b){
            const domain={...b.honroTerrainBounds};
            // Only fresh Stage3's explicit approved art may exceed collision bounds.
            // Every other stage keeps the original master path and domain reference.
            for(const l of G.HonroTerrainDomain.materialLandmarks(b)){
                if(l.asset?.params?.paintBeyondTerrainDomain!==true)continue;
                const a=this._landmarkPaintBounds(l);if(!a)continue;
                domain.left=Math.min(domain.left,a.left);domain.top=Math.min(domain.top,a.top);
                domain.right=Math.max(domain.right,a.right);domain.bottom=Math.max(domain.bottom,a.bottom);
            }
            return domain;
        }
"""
patch(p,'        _drawTerrainDomainTiles(c,b,w,h){',helper+'        _drawTerrainDomainTiles(c,b,w,h){')
patch(p,'v=G.HonroBounds.viewport(this,w,h),domain=b.honroTerrainBounds,','v=G.HonroBounds.viewport(this,w,h),domain=b.honroStage===3?this._naruRasterBounds(b):b.honroTerrainBounds,')
p='shared/runtime/terrain-readability.js'
patch(p,' const solids=ts.filter'," const omittedClosures=b.honroStage===3?new Set((b.honroLandmarks||[]).flatMap(l=>l.asset?.params?.omitTerrainClosureIds||[])):null;\n const solids=ts.filter")
patch(p,'if(t.oneWay&&!walkable)continue;','if(t.oneWay&&!walkable)continue;if(!walkable&&omittedClosures?.has(t.id))continue;')
new='tools/map-forge/naru-body-finish.mjs';dst=R/'candidate'/new;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(Path('stage3-selective-integration-local/production')/new,dst)
for p in paths:
 s=(R/'candidate'/p).read_text()
 for c in reversed([c for c in changes if c['path']==p]):assert s.count(c['new'])==1;s=s.replace(c['new'],c['old'])
 assert s==(B/p).read_text()
files=[]
for p in sorted((R/'candidate').rglob('*')):
 if p.is_file():
  b=p.read_bytes();files.append(dict(path=str(p.relative_to(R/'candidate')),local=str(p),bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),blob=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()))
assert len(files)==4
(R/'manifest.json').write_text(json.dumps(dict(ready=False,base='5b2edf0b868a6f4ab656574b036586304eb12808',productionFiles=4,scope='Stage3 approved finish only; explicit3 renderer/readability dispatch; no7/32 or other source changes',files=files),indent=2)+'\n')
(R/'patch-contract.json').write_text(json.dumps(dict(base='5b2edf0b868a6f4ab656574b036586304eb12808',changes=changes,newFiles=[new],inverseExact=True),indent=2)+'\n')
print('Four files; all three existing-file inverse exact to master')
