"""Read only. Same registered WU points measured on decoded PNGs. Archive and fresh never conflated."""
from pathlib import Path
import json, math,hashlib,os
from PIL import Image
P=Path(os.environ['STAGE26_QA'])
OLD=P/'archive'; NEW=P/'evidence'
def measure(directory,frames,raw_canvas=False):
 rows=[]
 for f in frames:
  filename=f['rawPng'] if raw_canvas else f['name']
  digest=f['rawSha256'] if raw_canvas else f['rasterSha256']
  raw=(directory/filename).read_bytes()
  assert hashlib.sha256(raw).hexdigest()==digest
  with Image.open(directory/filename) as im:
   im.load(); rgb=im.convert('RGB')
   if raw_canvas:assert im.size==tuple(f['backing'])
   else:assert im.width==f['backing'][0] and im.height==math.ceil(f['css']['h'])
   assert f['clamped'] and f['within']
   contact=0 if f['view']=='southwest' else 7000
   direction=1 if contact==0 else -1
   def sample(x,y):
    cw,ch=f['backing'] if raw_canvas else (f['css']['w'],f['css']['h'])
    sx=round((x-f['actual']['x'])*f['actual']['scale']+cw/2)
    sy=round((y-f['actual']['y'])*f['actual']['scale']+ch/2)
    return {'world':[x,y],'canvasPixel':[sx,sy],'rgb':list(rgb.getpixel((sx,sy)))}
   transitions=[]
   for y in [2420,2540,2900,3240,3440]:
    a,b=sample(contact+120*direction,y),sample(contact-120*direction,y)
    diff=math.dist(a['rgb'],b['rgb'])
    transitions.append({'y':y,'inboard':a,'outboard':b,'rgbDist':round(diff,3)})
   rows.append({'file':filename,'sha256':digest,'width':f['width'],'view':f['view'],'camera':f['actual'],'css':f['css'],'backing':f['backing'],'decodedPngSize':[im.width,im.height],'transitions':transitions})
 return rows
is_target=lambda f:f['stage']==26 and f['view'] in ('southwest','southeast')
archive=measure(OLD,[f for f in json.loads((OLD/'proof.json').read_bytes())['frames'] if is_target(f)])
assert len(archive)==4 and all(t['transitions'][1]['rgbDist']>35 and t['transitions'][-1]['rgbDist']<t['transitions'][1]['rgbDist'] for t in archive)
proof=json.loads((NEW/'proof.json').read_bytes())
assert proof['release']=='4416dfb527f810398903d15510ab8ca05a892661'
fresh_frames=[f for f in proof['frames'] if is_target(f)]
assert len(fresh_frames)==4
fresh=measure(NEW,fresh_frames)
raw=measure(NEW,fresh_frames,raw_canvas=True)
assert [(x['width'],x['view']) for x in archive]==[(x['width'],x['view']) for x in fresh]==[(x['width'],x['view']) for x in raw]
for old,new,canvas in zip(archive,fresh,raw):
 new['compareArchiveAtY2540_3440']=[round(new['transitions'][i]['rgbDist']-old['transitions'][i]['rgbDist'],3) for i in (1,4)]
 new['rawContactAtY2540_3440']=[canvas['transitions'][i]['rgbDist'] for i in (1,4)]
receipt=json.loads((P/'archive-receipt.json').read_bytes())
scope='Stock 26 native browser diagnostic only. Same four registered views; samples compare exact coordinates. Different full frames are not waived or mislabeled. Does not qualify gameplay, visual art, alpha of individual vector layers or deployment.'
(NEW/'WITNESSES.json').write_text(json.dumps({'scope':scope,'archiveReference':receipt,'archiveDOM':archive,'currentDOM':fresh,'currentRawCanvas':raw},indent=2))
for tag,items in [('archive DOM',archive),('current DOM',fresh),('current raw',raw)]:
 for a in items:
  print(tag,a['width'],a['view'],[(t['y'],t['rgbDist']) for t in a['transitions']])
