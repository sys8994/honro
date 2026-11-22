from pathlib import Path
import base64,json,sys,hashlib,math,struct,traceback
import numpy as np
from PIL import Image,ImageDraw
from playwright.sync_api import sync_playwright

r=Path(sys.argv[1]).resolve()
tmp=Path(sys.argv[2]).resolve()
D=Path(__file__).resolve().parent
R=json.loads((D/'RECIPE.json').read_text())
P=json.loads((D/'PINS.json').read_text()); assert P['enabled'] is True
out=tmp/'out'; out.mkdir(exist_ok=True)
arms=('A','A0','E0','E','B')
receipt={'scope':'Chromium native Canvas2d isolated stock painter; not HONRO normal entry, no product/terrain/save mutation',
         'historicalRawPoseReferences':[{k:v[k] for k in ('view','rawSha256','camera','backing')} for v in R['registered']['views']],
         'views':{},'faults':[]}
def attribute(a,e,b,m):
 de=e.astype('int16')-a;db=b.astype('int16')-a
 x=np.any(de!=0,axis=2);y=np.any(db!=0,axis=2);q=np.all(de==db,axis=2)
 groups={'Eonly':x&~y,'Bonly':y&~x,'bothSame':x&y&q,'bothDifferent':x&y&~q}
 result={}
 for n,u in groups.items():
  u=u&m
  result[n]={'count':int(u.sum()),'maxRGB_AE':int(np.abs(de[:,:,:3][u]).max(initial=0)),
             'maxRGB_AB':int(np.abs(db[:,:,:3][u]).max(initial=0)),
             'maxRGB_EB':int(np.abs((db-de)[:,:,:3][u]).max(initial=0))}
 ij=np.argwhere((x|y)&m)
 result['xySigned']=[[int(j),int(i),de[i,j].tolist(),db[i,j].tolist()] for i,j in ij] if len(ij)<=20000 else None
 return result
def sample(row,pixels):
 h,w=pixels['A'].shape[:2]
 orig=R['registered'];v=row['viewport'];z=row['scale']
 def tr(seq): return [( (x-v['left'])*z,(y-v['top'])*z ) for x,y in seq]
 mask=Image.new('1',(w,h));ImageDraw.Draw(mask).polygon(tr(orig['sampleWorld']),fill=1);mask=np.array(mask)
 protect=Image.new('1',(w,h));g=ImageDraw.Draw(protect);q=tr(orig['protectedFaultWorld']);rad=orig['protectionCorridorNominalWorldRadius']*z
 g.line(q,fill=1,width=round(rad*2)+1,joint='curve')
 for x,y in q:g.ellipse((x-rad,y-rad,x+rad,y+rad),fill=1)
 protect=np.array(protect)
 a=pixels['A']; alpha={k:int(np.count_nonzero(pixels[k][:,:,3]!=a[:,:,3])) for k in arms if k!='A'}
 ap={}
 for k in arms:
  if k=='A':continue
  moved=np.any(pixels[k]!=a,axis=2)
  ap[k]={'rgba':int(moved.sum()),'outside':int((moved&~mask).sum()),'fault':int((moved&protect).sum()),'alpha':alpha[k]}
 verdict={'neutralExact':ap['A0']['rgba']==ap['E0']['rgba']==0,
          'candidateStrict':ap['B']['outside']==ap['B']['fault']==ap['B']['alpha']==0}
 return ap,verdict,{n:attribute(a,pixels['E'],pixels['B'],m) for n,m in (('outside',~mask),('fault',protect))}
def float32(v):
 return struct.unpack('!f',struct.pack('!f',v))[0]
def observe_ctm(d,pin,diag,arm):
 expected=pin['idealCTM'];actual=d['ctm'];f32=pin['binary32CTM']
 e={'actualCTM':actual,'backing':d['backing'],'dpr':d['dpr']}
 diag['arms'][arm]=e
 assert d['backing']==pin['expectedBacking'] and d['dpr']==1, f'{arm}: backing or DPR differs from exact pose'
 assert len(actual)==len(expected)==6 and all(isinstance(v,(float,int)) and not isinstance(v,bool) and math.isfinite(v) for v in actual), f'{arm}: malformed native Canvas transform'
 e['coordinateRepresentation']=['double-exact' if a==e else 'binary32-exact' if a==f else 'unexpected' for a,e,f in zip(actual,expected,f32)]
 e['signedActualMinusIdeal']=[a-i for a,i in zip(actual,expected)]
 xy=[(x,y)for x in pin['idealCornerWorldX'] for y in pin['idealCornerWorldY']]
 q=e['signedActualMinusIdeal']
 e['maxAbsRasterDisplacementPx']=[max(abs(q[0]*x+q[2]*y+q[4])for x,y in xy),max(abs(q[1]*x+q[3]*y+q[5])for x,y in xy)]
 assert 'unexpected' not in e['coordinateRepresentation'], f'{arm}: CTM must be exact expected IEEE double or rounded IEEE binary32 per coordinate; no epsilon'
 assert diag['arms']['A']['actualCTM']==actual, f'{arm}: actual rendered CTM differs from arm A'
def pose_browser(b,row,diag):
 w,h=row['backing'];vw,vh=(390,844) if w==390 else (1440,900) if w==1440 else (w,h)
 v=row['viewport'];z=row['scale']; expected=[z,0,0,z,-v['left']*z,-v['top']*z]
 pin={'expectedBacking':row['backing'],'idealCTM':expected,'binary32CTM':[float32(x)for x in expected],
      'idealCornerWorldX':[v['left'],v['left']+w/z],'idealCornerWorldY':[v['top'],v['top']+h/z],
      'requestedContextViewport':[vw,vh],'requestedDPR':1}
 diag.update(pin);diag['arms']={};diag['stage']='create offline context'
 ctx=b.new_context(viewport={'width':vw,'height':vh},device_scale_factor=1,offline=True,service_workers='block')
 try:
  diag['stage']='load exact shared Canvas scripts'
  pg=ctx.new_page();requests=[];pg.on('request',lambda q:requests.append(q.url))
  pg.set_content('<!doctype html><meta charset="utf-8"><title>Isolated renderer raster attribution</title>')
  for src in [r/'shared/map/visual-style.js',r/'shared/map/vector-art.js',D/'painter.js',r/'shared/runtime/act5-edge-art.js']:
   pg.add_script_tag(content=src.read_text(encoding='utf8'))
  pg.evaluate('(text)=>{globalThis.frozenStage46=JSON.parse(text)}',(tmp/'private-provider.json').read_text(encoding='utf8'))
  pixels,hashes={},{}
  for arm in arms:
   diag['stage']=arm+': native draw (frozen)'
   text=None if arm=='A' else (tmp/f'private-{arm}-part3.json').read_text(encoding='utf8')
   d=pg.evaluate('({pose,text})=>stage46Attribution(frozenStage46,text===null?null:JSON.parse(text),pose)',{'pose':row,'text':text})
   diag['stage']=arm+': observe Canvas geometry'
   observe_ctm(d,pin,diag,arm)
   diag['stage']=arm+': decode RAW readback'
   raw=base64.b64decode(d['rgba'],validate=True)
   assert len(raw)==w*h*4, f'{arm}: RAW byte length {len(raw)} vs {w*h*4}'
   pixels[arm]=np.frombuffer(raw,dtype=np.uint8).reshape(h,w,4)
   im=Image.frombytes('RGBA',(w,h),raw)
   im.save(out/f'{row["name"]}-{arm}-RAW.png')
   if w==390:
    refs=[x for x in R['registered']['views'] if row['name']=='390-'+x['view']]
    assert len(refs)==1
    im.crop(refs[0]['cropRaw']).save(out/f'{row["name"]}-{arm}-CROP.png')
   hashes[arm]=hashlib.sha256(raw).hexdigest()
  assert not requests,requests
  diag['stage']='compare unchanged ideal-coordinate masks'
  dif,g,at=sample(row,pixels)
  diag['stage']='complete'
  return {'backing':row['backing'],'camera':row['viewport'],'ctm':expected,'unpremultipliedCanvasRGBA':hashes,
          'delta':dif,'gate':g,'signedOutsideAndFaultAttribution':at,
          'classification': 'A0/E0 are neutral; E is removal from existing single compound fill, not an added draw; B is same signed local author variant'}
 finally:ctx.close()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,chromium_sandbox=True,timeout=30000)
 receipt['chromium']=b.version
 receipt['geometryDiagnostics']={}
 for row in R['poses']:
  diag={};receipt['geometryDiagnostics'][row['name']]=diag
  try:receipt['views'][row['name']]=pose_browser(b,row,diag)
  except Exception as e:
   trace=traceback.extract_tb(e.__traceback__)
   receipt['faults'].append({'view':row['name'],'stage':diag.get('stage'),'type':type(e).__name__,'message':str(e)[:900], 'line':trace[-1].lineno if trace else None})
 b.close()
qualified=not receipt['faults'] and len(receipt['views'])==4 and all(all(x['gate'].values()) for x in receipt['views'].values())
receipt['status']='PASS_ISOLATED_BROWSER_CANVAS_ONLY' if qualified else 'HOLD_ISOLATED_BROWSER_CANVAS'
(out/'CANVAS-ATTRIBUTION.json').write_text(json.dumps(receipt,indent=2)+'\n')
if not qualified:sys.exit('Strict Chromium Canvas attribution did not qualify; inspect sealed artifact.')
