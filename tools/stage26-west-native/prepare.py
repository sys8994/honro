"""Exact optional browser-only paint slot; no product writes, no new geometric form."""
import hashlib,json,os
from pathlib import Path
import xml.etree.ElementTree as ET
p=Path(os.environ['STAGE26_QA']); t=Path(__file__).parent
sha=lambda b:hashlib.sha256(b).hexdigest()
a=(p/'stock-owner.js').read_bytes(); s=(t/'native-west.svg').read_bytes()
assert sha(s)=='c50eea7f8b32431fef8b0971628120e21f641a8f8c167d883f78529f9801fb5f'
assert hashlib.sha1(f'blob {len(a)}\0'.encode()+a).hexdigest()=='1c9add7508d0e2dd1084346729a33b0de0a02eb2'
assert sha(a).startswith('9b8e07dd9a78ec92')
r=ET.fromstring(s); ns={'s':'http://www.w3.org/2000/svg'}
clip=r.find('s:defs/s:clipPath/s:path',ns); assert clip.attrib['clip-rule']=='evenodd'
def paint(el):
 c=el.attrib['stop-color']; assert len(c)==7 and c[0]=='#'
 alpha=float(el.attrib.get('stop-opacity','1')); assert 0<=alpha<=1
 return c if alpha==1 else 'rgba(%d,%d,%d,%s)' % (*bytes.fromhex(c[1:]),alpha)
grad={}
for el in r.findall('s:defs/s:linearGradient',ns):
 assert el.attrib['gradientUnits']=='userSpaceOnUse'
 grad[el.attrib['id']]=[[float(el.attrib[k]) for k in ('x1','y1','x2','y2')],
   [[float(x.attrib['offset']),paint(x)] for x in el.findall('s:stop',ns)]]
shape=[]
for el in r.findall('s:g/s:path',ns):
 assert set(el.attrib)=={'id','d','fill'}
 g=el.attrib['fill'];assert g.startswith('url(#') and g.endswith(')')
 geo,stops=grad[g[5:-1]]
 shape.append([el.attrib['d'],geo,stops])
assert len(shape)==3
site=b'raw.closePath();raw.clip();const minX=-m.e/m.a,maxX=(raw.canvas.width-m.e)/m.a;'
assert a.count(site)==1 and b'act3-handoff:' in a
prefix=b'raw.closePath();raw.clip();'
snippet=(
 'if(b.honroStage===26&&b.honroCanonical&&!b.honroCustom&&asset.id==="act3-handoff:26:kiln-foundation"&&'
 'l.id===asset.id&&l.kind==="canonical-element"&&floor.id==="a3-foundation"&&l.x===0&&l.y===0&&l.scale===1){'
 'globalThis.__stage26WestProofDraws=(globalThis.__stage26WestProofDraws||0)+1;raw.save();try{'
 'raw.clip(new Path2D('+json.dumps(clip.attrib['d'])+'),"evenodd");'
 'for(const[d,coords,stops]of '+json.dumps(shape,separators=(',',':'))+'){'
 'const paint=raw.createLinearGradient(...coords);for(const[at,color]of stops)paint.addColorStop(at,color);'
 'raw.fillStyle=paint;raw.fill(new Path2D(d));}'
 '}finally{raw.restore();}}'
).encode()
b=a.replace(site,prefix+snippet+site[len(prefix):])
assert b.count(snippet)==1 and b.replace(snippet,b'')==a
(p/'west-candidate.js').write_bytes(b)
(p/'paint-receipt.json').write_text(json.dumps({'kind':'one transient browser response in B only, not compiler/build/product','ownerStockSHA256':sha(a),'ownerBSHA256':sha(b),'exactSVG':sha(s),'singleInverseSplice':True,'nativePaintCount':len(shape),'stockSideDepthFadeUntouched':True},indent=2)+'\n')
