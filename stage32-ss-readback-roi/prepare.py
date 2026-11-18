from pathlib import Path
import hashlib,json
p=Path('stage32-ss-readback-roi');s=Path('stage32-upper-long-diagonal/candidate.js').read_text();changes=[]
def sub(a,b):
 global s
 assert s.count(a)==1,(a,s.count(a));s=s.replace(a,b);changes.append({'old':a,'new':b})
sub('let anyEligible=false;','let anyEligible=false,minX=w,minY=count,maxX=-1,maxY=-1;')
sub('for(let y=0;y<count&&!anyEligible;y++)for(let x=0;x<w;x++){','/* ROI full eligibility scan */ for(let y=0;y<count;y++)for(let x=0;x<w;x++){')
sub('anyEligible=true;break;','anyEligible=true;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);')
sub('ssStats.highRasterStripes++;','ssStats.highRasterStripes++;\n  const rx=minX*SS,ry=minY*SS,rw=(maxX-minX+1)*SS,rh=(maxY-minY+1)*SS;')
sub('const colors=hi.getImageData(0,0,hw,hh).data;','const colors=hi.getImageData(rx,ry,rw,rh).data;')
sub('const labels=hi.getImageData(0,0,hw,hh).data;','const labels=hi.getImageData(rx,ry,rw,rh).data;')
sub('if(colors.length!==hw*hh*4||labels.length!==hw*hh*4)','if(colors.length!==rw*rh*4||labels.length!==rw*rh*4)')
sub('ssStats.readbackBytes=(2*hw*hh+3*w*h)*4;','ssStats.readbackBytes=(2*rw*rh+3*w*h)*4;')
sub('const label=boxMean(labels,hw,x,y,SS),color=boxMean(colors,hw,x,y,SS);','const label=boxMean(labels,rw,x-minX,y-minY,SS),color=boxMean(colors,rw,x-minX,y-minY,SS);')
base=Path('stage32-upper-long-diagonal/candidate.js').read_text();r=s
for c in reversed(changes):assert r.count(c['new'])==1;r=r.replace(c['new'],c['old'])
assert r==base
(p/'candidate.js').write_text(s);(p/'contract.json').write_text(json.dumps({'baselineSHA256':hashlib.sha256(base.encode()).hexdigest(),'candidateSHA256':hashlib.sha256(s.encode()).hexdigest(),'changes':changes,'inverseExact':True},indent=2))
# Reuse Native direct harness without affecting previous experiment.
n=Path('stage32-staged-lower-clip/native.cjs').read_text().replace("root='stage32-staged-lower-clip/'","root='stage32-ss-readback-roi/'")
a="const contract=JSON.parse(fs.readFileSync(root+'inverse-contract.json')),base=fs.readFileSync(contract.baseline,'utf8'),candidate=fs.readFileSync(root+'candidate.js','utf8');if(sha(base)!==contract.baselineSHA256||sha(candidate)!==contract.candidateSHA256||candidate.replace(contract.new,contract.old)!==base)throw Error('Source contract');"
b="const contract=JSON.parse(fs.readFileSync(root+'contract.json')),base=fs.readFileSync('stage32-upper-long-diagonal/candidate.js','utf8'),candidate=fs.readFileSync(root+'candidate.js','utf8');let reversed=candidate;for(const c of [...contract.changes].reverse())reversed=reversed.replace(c.new,c.old);if(sha(base)!==contract.baselineSHA256||sha(candidate)!==contract.candidateSHA256||reversed!==base)throw Error('Source contract');"
assert a in n;n=n.replace(a,b);(p/'native.cjs').write_text(n)
