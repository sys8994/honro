import json,sys,pathlib,hashlib
from PIL import Image,ImageChops
root=pathlib.Path(sys.argv[1]);cfg=json.loads((pathlib.Path(__file__).parent/'config.json').read_text());errors=[];rows=[];startup=[]
def require(v,m):
 if not v:errors.append(m)
for pose in cfg['poses']:
 name=pose['name'];a=json.loads((root/('original-'+name+'.json')).read_text());b=json.loads((root/('candidate-'+name+'.json')).read_text());require(a['ok'] and b['ok'],'capture '+name)
 for x in [a,b]:
  require(not x['storage'] and not x['errors'] and not x['violations'],'runtime/storage '+name);require(x['contract']['ownSaveRoundtripExact'],'codec');require(x['width']==pose['width'] and x['height']==pose['height'],'backing');require(x['provenance']['sourceRef']==cfg['sourceRef'],'source pin')
 for x in [a,b]:startup.append({'pose':name,'variant':x['variant'],'helperBytes':x['provenance']['helperBytes'],'wholeRuntimeParseEvalWallMs':x.get('runtimeParseEvalWallMs'),'firstRenderMs':x['performanceReport']['first']['ms']})
 require(a['initialization']==b['initialization'] and a['contract']==b['contract'],'initialgameplay '+name);require(a['provenance']['originalRuntimeSHA']==b['provenance']['originalRuntimeSHA'],'same runtime');require(a['provenance']['helperSHA256']==cfg['registeredHelperSHA256'] and b['provenance']['helperSHA256']==cfg['candidateSHA256'],'helper pins')
 frames=lambda x:[x['performanceReport']['first'],x['performanceReport']['cold']]+x['performanceReport']['pan']+[x['performanceReport']['edge']];aa,bb=frames(a),frames(b);require(len(aa)==len(bb)==9,'frame counts')
 hashes=set()
 for x,y in zip(aa,bb):
  require(x['camera']==y['camera'] and x['backing']==y['backing'],'same camera '+name+x['name']);i=Image.open(root/('original-'+name+'-'+x['name']+'-mask.png')).convert('RGBA');j=Image.open(root/('candidate-'+name+'-'+x['name']+'-mask.png')).convert('RGBA');ib,jb=i.tobytes(),j.tobytes();hashes.add(hashlib.sha256(ib).hexdigest());require(hashlib.sha256(ib).hexdigest()==x['rgbaSHA256'] and hashlib.sha256(jb).hexdigest()==y['rgbaSHA256'],'PNG/frame hashes');changed=sum(ib[k:k+4]!=jb[k:k+4] for k in range(0,len(ib),4));alpha=sum(ib[k]!=jb[k] for k in range(3,len(ib),4));delta=max(abs(u-v)for u,v in zip(ib,jb));bbox=ImageChops.difference(i.convert('RGB'),j.convert('RGB')).getbbox();colors=i.convert('RGB').getcolors(i.width*i.height);require(colors and len(colors)>16,'Positive reference painted colors');require(alpha==0,name+'/'+x['name']+' Scene alpha');rows.append({'pose':name,'frame':x['name'],'camera':x['camera'],'changed':changed,'alpha':alpha,'maxDelta':delta,'bbox':bbox,'originalMs':x['ms'],'candidateMs':y['ms'],'fieldWindow':y['after'].get('fieldWindow'),'logicalBytes':y['after'].get('totalLogicalBytes')})
 require(len(hashes)>2,'Actual motion visible '+name);
 perf=b['performanceReport'];cold=perf['cold']['after']['fieldWindow'];last=perf['pan'][-1]['after']['fieldWindow'];require(last['hits']>cold['hits'],'actual cache hits');require(last['misses']>cold['misses'],'actual long-pan rebuild');
 for y in bb:
  st=y['after'];fw=st['fieldWindow'];require(st['totalLogicalBytes']==st['bytes']+st['transition']['bytes']+st['supersample']['scratchBytes']+fw['bytes'],'inclusive logical memory');require(st['totalLogicalBytes']<=48*1024*1024,'48MiB logical budget')
 for x,y in zip(aa,bb):
  n=x['name'];t=Image.open(root/('original-'+name+'-terrain-'+n+'-mask.png')).convert('RGBA');u=Image.open(root/('candidate-'+name+'-terrain-'+n+'-mask.png')).convert('RGBA');ta,ua=t.tobytes(),u.tobytes();sa=Image.open(root/('original-'+name+'-'+n+'-mask.png')).convert('RGBA').tobytes();sb=Image.open(root/('candidate-'+name+'-'+n+'-mask.png')).convert('RGBA').tobytes();alphaDiff=sum(ta[k]!=ua[k] for k in range(3,len(ta),4));empty=[k for k in range(0,len(ta),4) if ta[k+3]==0];outside=sum(ta[k:k+4]!=ua[k:k+4] for k in empty);sceneOutside=sum(sa[k:k+4]!=sb[k:k+4] for k in empty);require(alphaDiff==0,'terrain alpha '+n);require(outside==0 and sceneOutside==0,'terrain/Scene exterior '+n)
  rows.append({'pose':name,'terrainFrame':n,'alphaChanged':alphaDiff,'emptyPixels':len(empty),'partialPixels':sum(0<ta[k]<255 for k in range(3,len(ta),4)),'terrainOutsideChanged':outside,'sceneOutsideChanged':sceneOutside})
  if n=='edge':require(len(empty)>0 and any(0<ta[k]<255 for k in range(3,len(ta),4)),'positive exterior edge reference')

out={'startup':startup,'startupScope':'Whole runtime script load/parse/eval wall before capture, not pure helperparse; source bytes separately recorded','passed':not errors,'errors':errors,'rows':rows,'scope':'Two-page fieldwindow diagnostic; RGB differences recorded, alpha/exterior strict, no partial foreground acceptance, readback-influenced timing not clean performance/acceptance','qualityAccepted':False,'performanceAccepted':False};(root/'fieldwindow-result.json').write_text(json.dumps(out,indent=2));print(json.dumps({'passed':not errors,'errors':errors}));sys.exit(bool(errors))
