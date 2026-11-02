"""Fail closed: image aspect alone is never sufficient for terrain acceptance."""
import argparse,hashlib,json,struct,sys
from pathlib import Path

def check(source,image):
 raw=image.read_bytes()
 if raw[:8]!=b'\x89PNG\r\n\x1a\n':raise ValueError('PNG required')
 iw,ih=struct.unpack('>II',raw[16:24]);w,h=source['width'],source['height']
 # One raster-pixel rounding allowance. Never arbitrary stretch or aspect repair.
 error=abs(ih-iw*h/w)
 return {'schema':'honro-terrain-scale-check-v1','imageSha256':hashlib.sha256(raw).hexdigest(),'sourceGeometryDigest':source['geometryDigest'],'imagePixels':[iw,ih],'worldBounds':[w,h],'imageToWorldUniformScale':w/iw,'aspectHeightErrorPixels':error,'aspectRoundingAllowancePixels':1,'checks':{'worldAspect':'PASS' if error<=1 else 'FAIL','contactRegistration':'UNMEASURED','characterAndCameraUnchanged':'UNMEASURED','normalZoomVisualReview':'UNMEASURED'},'accepted':False,'nextStepAllowed':False,'reason':'Aspect is a prerequisite only. Source contact registration and actual assembled-view verification remain mandatory.'}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('image',type=Path);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 result=check(json.loads(a.source.read_text()),a.image);a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result));sys.exit(0 if result['accepted'] else 1)
