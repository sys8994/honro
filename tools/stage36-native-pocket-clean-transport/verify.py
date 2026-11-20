from PIL import Image,ImageChops
from pathlib import Path
from hashlib import sha256
import json,os,math
o=Path(os.environ['OUT'])
a,b=([x for x in json.loads((o/k/'proof.json').read_text())['frames']] for k in ['before','after'])
assert len(a)==len(b)==8
report=[]
for x,y in zip(a,b):
 for key in ['stage','view','actual','viewport','physicsSha256','actorCount','css','backing','name']: assert x[key]==y[key],(key,x['name'])
 files=[o/k/x['name'] for k in ['before','after']]
 for f,m in zip(files,[x,y]): assert sha256(f.read_bytes()).hexdigest()==m['rasterSha256']
 im,jm=[Image.open(f).convert('RGB') for f in files]
 d=ImageChops.difference(im,jm)
 z=x['actual']['scale'];v=x['viewport'];l,t=v['left'],v['top']
 roi=(math.floor((2255-l)*z)-2,math.floor((1720-t)*z)-2,math.ceil((2407-l)*z)+2,math.ceil((1809-t)*z)+2)
 changed=outsideStrong=outsideMinor=maxOutside=skyBefore=skyAfter=0
 for yy in range(im.height):
  for xx in range(im.width):
   mag=max(d.getpixel((xx,yy)))
   inside=roi[0]<=xx<roi[2] and roi[1]<=yy<roi[3]
   if mag:
    changed+=1
    if not inside:
     maxOutside=max(maxOutside,mag)
     if mag<=4: outsideMinor+=1
     else: outsideStrong+=1
   if inside:
    skyBefore+=im.getpixel((xx,yy))[2]>130
    skyAfter+=jm.getpixel((xx,yy))[2]>130
 if x['stage']==36:
  r=tuple(n+q for n,q in zip(roi,[-15,-15,15,15]))
  ic,jc=[f.crop(r) for f in (im,jm)]
  pair=Image.new('RGB',(ic.width*2,ic.height));pair.paste(ic,(0,0));pair.paste(jc,(ic.width,0))
  pair.resize((pair.width*3,pair.height*3),Image.Resampling.NEAREST).save(o/('roi-'+x['view']+'.png'))
 report.append(dict(stage=x['stage'],view=x['view'],changed=changed,bbox=d.getbbox(),roi=roi,outsideMinor=outsideMinor,outsideStrong=outsideStrong,maxOutside=maxOutside,skyBefore=skyBefore,skyAfter=skyAfter))
(o/'pixel-proof.json').write_text(json.dumps(report,indent=2))
assert all(q['changed']==0 for q in report if q['stage']==37),report
assert all(q['changed']>0 and q['outsideStrong']==0 and q['skyBefore']>q['skyAfter'] for q in report if q['stage']==36),report

from pathlib import Path
known=json.loads(r'{"before": [{"name": "act45-s36-1440x900-overview.png", "physicsSha256": "1de8d37f9444c119e4425e762f7eeb77124878ab749b92be42a83d3633a8f271", "rasterSha256": "210e014e5a968ec75f8b1fb424897967853717636469bb7fef804ca7f6685adc", "actual": {"x": 1689.6000000000001, "y": 1126.4, "scale": 0.21176470588235294}, "viewport": {"left": -1710.3999999999999, "right": 5089.6, "top": -689.7371527777777, "bottom": 2942.537152777778}, "backing": [1440, 769], "actorCount": 13, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s36-1440x900-south.png", "physicsSha256": "1de8d37f9444c119e4425e762f7eeb77124878ab749b92be42a83d3633a8f271", "rasterSha256": "bd4fef02ac120c867a83de3878f66c3aed7a807ba23ec68c1e12e67607d240a3", "actual": {"x": 1689.6000000000001, "y": 2492.8, "scale": 0.21176470588235294}, "viewport": {"left": -1710.3999999999999, "right": 5089.6, "top": 676.6628472222224, "bottom": 4308.9371527777785}, "backing": [1440, 769], "actorCount": 13, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s36-1440x900-southwest.png", "physicsSha256": "1de8d37f9444c119e4425e762f7eeb77124878ab749b92be42a83d3633a8f271", "rasterSha256": "8721e6d171cbc6750f0450606a13b58e6d75f8828e78a0adf1f92cc5c2290b6a", "actual": {"x": -320, "y": 2492.8, "scale": 0.21176470588235294}, "viewport": {"left": -3720, "right": 3080, "top": 676.6628472222224, "bottom": 4308.9371527777785}, "backing": [1440, 769], "actorCount": 13, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s36-1440x900-southeast.png", "physicsSha256": "1de8d37f9444c119e4425e762f7eeb77124878ab749b92be42a83d3633a8f271", "rasterSha256": "15f2845af4037546c283dbed153e7869446548d76868eaa13010ed55d0e2fe51", "actual": {"x": 3699.2000000000003, "y": 2492.8, "scale": 0.21176470588235294}, "viewport": {"left": 299.2000000000003, "right": 7099.200000000001, "top": 676.6628472222224, "bottom": 4308.9371527777785}, "backing": [1440, 769], "actorCount": 13, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s37-1440x900-overview.png", "physicsSha256": "361ff06f4f58fe869d03b1d6364c181a36679a9ff33d032bb2fef603788d6269", "rasterSha256": "95b650022ed249d3f1b5896011b2a55fc121ab02f87405e13a9dc5ab3e829021", "actual": {"x": 1228.8000000000002, "y": 819.2, "scale": 0.21176470588235294}, "viewport": {"left": -2171.2, "right": 4628.8, "top": -996.9371527777778, "bottom": 2635.337152777778}, "backing": [1440, 769], "actorCount": 34, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s37-1440x900-south.png", "physicsSha256": "361ff06f4f58fe869d03b1d6364c181a36679a9ff33d032bb2fef603788d6269", "rasterSha256": "5f89d6c08f842c17e90610089258fda60b6422c53311a34fa186de680d9662c5", "actual": {"x": 1228.8000000000002, "y": 1878.4, "scale": 0.21176470588235294}, "viewport": {"left": -2171.2, "right": 4628.8, "top": 62.26284722222226, "bottom": 3694.537152777778}, "backing": [1440, 769], "actorCount": 34, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s37-1440x900-southwest.png", "physicsSha256": "361ff06f4f58fe869d03b1d6364c181a36679a9ff33d032bb2fef603788d6269", "rasterSha256": "d07316489b88cfa4c2f1d78eb0fb1a95296be19ddcbae037c71df8dbd4d2067f", "actual": {"x": -320, "y": 1878.4, "scale": 0.21176470588235294}, "viewport": {"left": -3720, "right": 3080, "top": 62.26284722222226, "bottom": 3694.537152777778}, "backing": [1440, 769], "actorCount": 34, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s37-1440x900-southeast.png", "physicsSha256": "361ff06f4f58fe869d03b1d6364c181a36679a9ff33d032bb2fef603788d6269", "rasterSha256": "f261d80c92fe79630fc09e90bc28edf5aa3cde2b872cb73efaa4b9720c0c58f9", "actual": {"x": 2777.6000000000004, "y": 1878.4, "scale": 0.21176470588235294}, "viewport": {"left": -622.3999999999996, "right": 6177.6, "top": 62.26284722222226, "bottom": 3694.537152777778}, "backing": [1440, 769], "actorCount": 34, "css": {"w": 1440, "h": 769.1875}}], "after": [{"name": "act45-s36-1440x900-overview.png", "physicsSha256": "1de8d37f9444c119e4425e762f7eeb77124878ab749b92be42a83d3633a8f271", "rasterSha256": "f58e9d24814654cee04cad33f03b8d83daaa479bdb357992b04d114e533aa733", "actual": {"x": 1689.6000000000001, "y": 1126.4, "scale": 0.21176470588235294}, "viewport": {"left": -1710.3999999999999, "right": 5089.6, "top": -689.7371527777777, "bottom": 2942.537152777778}, "backing": [1440, 769], "actorCount": 13, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s36-1440x900-south.png", "physicsSha256": "1de8d37f9444c119e4425e762f7eeb77124878ab749b92be42a83d3633a8f271", "rasterSha256": "7cb5f06688c403798ce16d0a2e067d48276906295fdef4dc3faa23593606dec9", "actual": {"x": 1689.6000000000001, "y": 2492.8, "scale": 0.21176470588235294}, "viewport": {"left": -1710.3999999999999, "right": 5089.6, "top": 676.6628472222224, "bottom": 4308.9371527777785}, "backing": [1440, 769], "actorCount": 13, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s36-1440x900-southwest.png", "physicsSha256": "1de8d37f9444c119e4425e762f7eeb77124878ab749b92be42a83d3633a8f271", "rasterSha256": "727a976ef0a0168f31cf9c291f4f06be18b43fdd9f647c043fd894b6f71297d6", "actual": {"x": -320, "y": 2492.8, "scale": 0.21176470588235294}, "viewport": {"left": -3720, "right": 3080, "top": 676.6628472222224, "bottom": 4308.9371527777785}, "backing": [1440, 769], "actorCount": 13, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s36-1440x900-southeast.png", "physicsSha256": "1de8d37f9444c119e4425e762f7eeb77124878ab749b92be42a83d3633a8f271", "rasterSha256": "aadc8d71f9113091227830e08e5881f118744ad92c7137ef303a5ac53ed2b475", "actual": {"x": 3699.2000000000003, "y": 2492.8, "scale": 0.21176470588235294}, "viewport": {"left": 299.2000000000003, "right": 7099.200000000001, "top": 676.6628472222224, "bottom": 4308.9371527777785}, "backing": [1440, 769], "actorCount": 13, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s37-1440x900-overview.png", "physicsSha256": "361ff06f4f58fe869d03b1d6364c181a36679a9ff33d032bb2fef603788d6269", "rasterSha256": "95b650022ed249d3f1b5896011b2a55fc121ab02f87405e13a9dc5ab3e829021", "actual": {"x": 1228.8000000000002, "y": 819.2, "scale": 0.21176470588235294}, "viewport": {"left": -2171.2, "right": 4628.8, "top": -996.9371527777778, "bottom": 2635.337152777778}, "backing": [1440, 769], "actorCount": 34, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s37-1440x900-south.png", "physicsSha256": "361ff06f4f58fe869d03b1d6364c181a36679a9ff33d032bb2fef603788d6269", "rasterSha256": "5f89d6c08f842c17e90610089258fda60b6422c53311a34fa186de680d9662c5", "actual": {"x": 1228.8000000000002, "y": 1878.4, "scale": 0.21176470588235294}, "viewport": {"left": -2171.2, "right": 4628.8, "top": 62.26284722222226, "bottom": 3694.537152777778}, "backing": [1440, 769], "actorCount": 34, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s37-1440x900-southwest.png", "physicsSha256": "361ff06f4f58fe869d03b1d6364c181a36679a9ff33d032bb2fef603788d6269", "rasterSha256": "d07316489b88cfa4c2f1d78eb0fb1a95296be19ddcbae037c71df8dbd4d2067f", "actual": {"x": -320, "y": 1878.4, "scale": 0.21176470588235294}, "viewport": {"left": -3720, "right": 3080, "top": 62.26284722222226, "bottom": 3694.537152777778}, "backing": [1440, 769], "actorCount": 34, "css": {"w": 1440, "h": 769.1875}}, {"name": "act45-s37-1440x900-southeast.png", "physicsSha256": "361ff06f4f58fe869d03b1d6364c181a36679a9ff33d032bb2fef603788d6269", "rasterSha256": "f261d80c92fe79630fc09e90bc28edf5aa3cde2b872cb73efaa4b9720c0c58f9", "actual": {"x": 2777.6000000000004, "y": 1878.4, "scale": 0.21176470588235294}, "viewport": {"left": -622.3999999999996, "right": 6177.6, "top": 62.26284722222226, "bottom": 3694.537152777778}, "backing": [1440, 769], "actorCount": 34, "css": {"w": 1440, "h": 769.1875}}]}')
resources={
'before':('2333545a1c7351644f6b6e6644b5977bf752afeda5eb662a22fb2f0eb0d2c24f','5114ae34297c77fab749fe506c840e241356b57587c3b5cc5e5426bcfd65b53f'),
'after':('8f11aa6896577b768f3845315a170d2804b3570383147b04ed3affc4e7484f83','322b7f65860fa731699ef930f00a74d949be75a892b20fa8e7ac3d7aa3e99d71')}
refs=[]
for phase in ('before','after'):
 frames=json.loads((o/phase/'proof.json').read_text())['frames']
 assert len(frames)==len(known[phase])
 for got,want in zip(frames,known[phase]):
  compared={k:got[k]==v for k,v in want.items()}
  if got['stage']==36:
   assert (got['ownerSha'],got['ownerMaskSha'])==resources[phase],(phase,got['ownerSha'],got['ownerMaskSha'])
  refs.append({'phase':phase,'file':got['name'],'fieldsEqual':compared})
(o/'prior-qa-proof.json').write_text(json.dumps(refs,indent=2))
assert all(all(x['fieldsEqual'].values()) for x in refs),refs
