"""Reversible insertion into an exact checked-in common18 response, test only."""
import hashlib
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
HOOK=b'globalThis.__honroStage46PhaseReader'
BEGIN=b'function stage45Body(scene,c,asset,mask){'
END=b'const stage43ContactParts='
S46=b'if(l.asset?.id==="act5:near:46"&&l.asset.shaftExterior&&!l.rotation){'
S43=b'if(l.asset?.id==="act5:near:43"&&l.asset.nativeContinuity&&!l.rotation){'
LOOP=b'for(const part of asset.paintParts||[asset])G.HonroVectorArt.draw(paint,part,{x:0,y:0,scale:1});'
MASK_A=b'mc.fill(mask);raw.save();'
MASK_B=b'raw.drawImage(maskCanvas,0,0);raw.restore();c.save();'
BR=b'stage45Body(this,cc,keep.body,keep.bodyMask);if(keep.tree)stage45Body(this,cc,keep.tree,keep.treeMask);for(const original of keep.originals)stage45Body(this,cc,original.asset,original.mask);G.HonroVectorArt.draw(cc,keep.interior,{x:0,y:0,scale:1})'
# Scope guard for every helper-phase observation; other uses remain real and silent.
CHECK=b'asset.id==="act5:stage46:exterior-body"&&asset.paintParts?.length===6'
def insert(label,ctx):
 return b'if('+CHECK+b')'+HOOK+b'?.("'+label+b'",'+ctx+b',m,x,y,tw,th);'
def output(label):
 return HOOK+b'?.("'+label+b'",G.HonroVisualStyle?.raw(cc)||cc,cc.getTransform(),0,0,cc.canvas.width,cc.canvas.height);'
def patch(blob,pin):
 need(fact(blob)==pin and blob.count(HOOK)==0,'compiled runtime SHA/length or clean observer guard failed')
 def range_of(first,last):
  need(blob.count(first)==1 and blob.count(last)==1,'compiled routine anchor missing or ambiguous')
  a,b=blob.index(first),blob.index(last);need(a<b,'compiled scope reversed');return a,b
 x,y=range_of(BEGIN,END);u,v=range_of(S46,S43)
 need(y<=u,'compiled scopes overlap')
 routine,caller=blob[x:y],blob[u:v]
 need(all(routine.count(p)==1 and blob.count(p)==1 for p in (LOOP,MASK_A,MASK_B)),'unique Stage45 draw/mask anchor changed')
 need(caller.count(BR)==1 and blob.count(BR)==1,'unique Stage46 protect/call order changed')
 # JS non-instrumented order: literally the same draw call, exactly once for each part.
 l=LOOP[:LOOP.index(b')G.Honro')+1]+b'{'+LOOP[LOOP.index(b')G.Honro')+1:]
 for pos,label in ((b'',b'part0'),(b':1',b'part1')):
  l+=b'if(part.id==="act5:stage46:exterior-body'+pos+b'"){'+insert(label,b'raw')+b'}'
 l+=b'}'+insert(b'parts',b'raw')
 a=b'mc.fill(mask);'+insert(b'mask',b'mc')+b'raw.save();'
 b=b'raw.drawImage(maskCanvas,0,0);raw.restore();'+insert(b'after_mask',b'raw')+b'c.save();'
 r=routine.replace(LOOP,l,1).replace(MASK_A,a,1).replace(MASK_B,b,1)
 # Treat protected original a/b as a bucket; the tree is still a separately read phase.
 cc=BR.split(b';')
 need(len(cc)==4,'compiled caller statement count drift')
 c=(cc[0]+b';'+output(b'body_out')+cc[1]+b';'+output(b'tree_out')+
    cc[2]+b';'+output(b'protected_out')+cc[3]+b';'+output(b'interior_out'))
 z=blob[:x]+r+blob[y:u]+caller.replace(BR,c,1)+blob[v:]
 inverted=z.replace(r,routine,1).replace(caller.replace(BR,c,1),caller,1)
 need(inverted==blob and z.count(HOOK)==9,'instrumentation not exactly reversible and scoped')
 return z,{'helperOffset':x,'stage46Offset':u,'activeCompiled':pin,'observedCompiled':fact(z),'copyOnly':True}
if __name__=='__main__':
 from pathlib import Path
 import argparse
 p=argparse.ArgumentParser();p.add_argument('compiled');p.add_argument('sha256');p.add_argument('out');a=p.parse_args()
 src=Path(a.compiled).read_bytes();z,w=patch(src,{'bytes':len(src),'sha256':a.sha256});Path(a.out).write_bytes(z);print(w)
