"""Exact B→S transform: strictly detached use by carrier only, reusable offline."""
import pathlib,json,hashlib
D=pathlib.Path(__file__).resolve().parent
B='13995f7a9c56912e74917dcd3454477a8cfbb05d'
COMPACT='ac4fb9854c5bf713507564755848b6c2af1f8f1b'
def gitsha(v):return hashlib.sha1(b'blob '+str(len(v)).encode()+b'\0'+v).hexdigest()
def sha(v):return hashlib.sha256(v).hexdigest()
def extend(b,src):
 assert gitsha(b)==B and gitsha(src)==COMPACT
 pin=json.loads((D/'signed-mask.json').read_bytes())
 assert pin['targetCompiledSource']['sha256']==sha(src)
 assert pin['minMaskedY']==4588.44 and pin['minusAuthoredSolidArea']==0 and pin['westAlphaProtection']['minVisibilityMarginAfterGutter']==1104
 polygons=[pin['signedUnionGeoJSON']['coordinates']]
 def area(r):return sum(x*Y-X*y for (x,y),(X,Y)in zip(r,r[1:]))
 for ring in polygons:
  for i,r in enumerate(ring):
   assert r[0]==r[-1]
   if (area(r)>0)!=(i>0):r.reverse()
 south={'bounds':[-4920,4588.44,10800,6402],'polygons':polygons}
 base=json.loads(src)['assets'][0]['vector']['symbols']['compact15-source-world']['children'][0]['children'][0]
 flat=base['children'][0],base['children'][1]['children'][0]['children'][0]['children'][0]
 assert all(n['fill']=='#283b46' for n in flat) and [sha(n['d'].encode())for n in flat]==[n['sha256'] for n in pin['activeFlatNodes']]
 text=b.decode()
 def once(a,z):
  nonlocal text
  assert text.count(a)==1,a
  text=text.replace(a,z,1)
 once('_stage15NorthQaTiles(b,domain,stock,view,rs) {','_stage15NorthQaTiles(b,domain,stock,view,rs,south=false) {')
 once('const mask={"polygons":[','const mask=south?'+json.dumps(south,separators=(',',':'))+':{"polygons":[')
 once('t:Math.max(-2102-g,view.top-g)','t:Math.max(south?mask.bounds[1]:-2102-g,view.top-g)')
 once('box.t>=box.b||view.top>=0','box.t>=box.b||(south?view.top<0:view.top>=0)')
 once('const proof=this._stage15NorthQaProof??=','const proof=south?(this._stage15SouthQaProof??={stock:0,candidate:0,lowerStock:0}):this._stage15NorthQaProof??=')
 once('const cache=this._stage15NorthQaClones??=new WeakMap();','const cache=south?(this._stage15SouthQaClones??=new WeakMap()):this._stage15NorthQaClones??=new WeakMap();')
 call='landmarks=this._stage15NorthQaTiles(b,domain,landmarks,view,rs);'
 once(call,call+'\n                    if(view.top>=0)landmarks=this._stage15NorthQaTiles(b,domain,landmarks,view,rs,true);')
 assert 0<len(text.encode())-len(b)<=196608-193985
 return text.encode()
if __name__=='__main__':
 import sys
 sys.stdout.buffer.write(extend(pathlib.Path(sys.argv[1]).read_bytes(),pathlib.Path(sys.argv[2]).read_bytes()))
