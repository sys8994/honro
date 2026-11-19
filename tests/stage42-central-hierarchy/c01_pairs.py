import base64, hashlib, json
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageChops

KEY='stage42C01CleanFar'
G=Path(__file__).with_name('game-c01.js')
CAMS=([{'id':k,'requested':v} for k,v in [
 ('corner-nw',[0,0,.5]),('corner-ne',[6500,0,.5]),('corner-sw',[0,2861,.5]),('corner-se',[6500,2861,.5]),
 ('portrait-center',[3250,1650,.5]),('portrait-gate',[6000,1140,.5])]])

def compare(a,b):
 d=ImageChops.difference(a.convert('RGB'),b.convert('RGB'))
 pp=list(d.getdata())
 return {'changed':sum(p!=(0,0,0) for p in pp),'max_channel_error':max(map(max,pp)),'box':d.getbbox()}

def review(q,slug,out):
 w,h=q['w'],q['h']
 shots=q.pop('shots')
 assert q['dpr']==1,slug
 ims={}
 for label,v in shots.items():
  b=base64.b64decode(v.pop('png').split(',',1)[1],validate=True)
  ims[label]=Image.open(BytesIO(b)).convert('RGBA')
  assert ims[label].size==(w,h)
  (out/f'c01-{slug}-{label}.png').write_bytes(b)
  v['sha256']=hashlib.sha256(b).hexdigest()
 assert all(v['actual']==shots['c01']['actual'] for v in shots.values()),slug
 assert all(shots[x]['owners']==shots['c01']['owners'] for x in ['neutral-1','neutral-2','alpha-neutral','alpha-c01']),slug
 a,b=ims['alpha-neutral'],ims['alpha-c01']
 a0,b0=a.getchannel('A'),b.getchannel('A')
 assert ImageChops.difference(a0,b0).getbbox() is None,slug
 # Compare opaque and antialiased foreground independently of the far-color discussion.
 mask=a0.point(lambda v:255 if v>0 else 0)
 assert ImageChops.multiply(ImageChops.difference(a.convert('RGB'),b.convert('RGB')),mask.convert('RGB')).getbbox() is None,slug
 f=shots['bg-c01']['frames']
 assert len(f)==1 and f[0]['key']==KEY and f[0]['alpha']==1,slug
 box=f[0]['frame']
 assert box['x']<=.01 and box['y']<=.01 and box['x']+box['w']>=w-.01 and box['y']+box['h']>=h-.01,slug
 assert ims['bg-c01'].getchannel('A').getextrema()==(255,255),slug
 assert not shots['bg-c01']['owners'] and shots['bg-c01']['far'],slug
 neutral=compare(ims['neutral-1'],ims['neutral-2'])
 delta=compare(ims['neutral-1'],ims['c01'])
 assert delta['changed']>neutral['changed'],slug
 return {'shots':shots,**q,'neutral_AA':neutral,'composite_delta':delta,'foreground_coverage':a0.histogram()[0]!=(w*h)}

def capture(page,expected,base,detail,gate,cameras,out):
 assert base=='a9f3200d572681ad29a0e80449f916f49565faf90d9bd8506e6d274d7eaf37e5'
 assert detail=='2298b3fecbc0a43a346a0ebfb4e6a6d7e990f68af0a8bc0ae1b2cc17940d9ef4'
 assert gate=='90d619172a48c6feb5269887e59c887965de5244a4dcb158396f20f123e5633f'
 reviewed=[q for q in cameras if q['id'] in {'whole','center-body','gate'}]+[q for q in CAMS if q['id']=='portrait-gate']
 results={}
 for q in reviewed:
  slug=q['id']; w,h=(390,844) if slug.startswith('portrait') else (1280,800)
  d=page.evaluate(G.read_text(),dict(expected=expected,proof=dict(base=base,detail=detail,gate=gate),requested=q['requested'],w=w,h=h))
  v=review(d,slug,out);results[slug]=v
  (out/'c01-reviewed.json').write_text(json.dumps({'base':base,'detail':detail,'cameras':results},indent=2))
 assert len(results)==4 and results['whole']['foreground_coverage']
 assert all(results[k]['foreground_coverage'] for k in ['center-body','gate','portrait-gate'])
 # An empty bounded corner or portrait cannot be used as foreground preservation evidence.
 return {'result':'all-case stock C01 visual QA, same reopened geometry, not gameplay','base':base,'detail':detail,'cameras':results}
