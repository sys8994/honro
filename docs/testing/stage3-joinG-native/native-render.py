import json,ctypes as C,xml.etree.ElementTree as ET,pathlib
P=pathlib.Path(__file__).parent
r=C.CDLL('librsvg-2.so.2');c=C.CDLL('libcairo.so.2');g=C.CDLL('libgobject-2.0.so.0')
r.rsvg_handle_new_from_data.argtypes=[C.c_char_p,C.c_size_t,C.c_void_p];r.rsvg_handle_new_from_data.restype=C.c_void_p
c.cairo_image_surface_create.argtypes=[C.c_int,C.c_int,C.c_int];c.cairo_image_surface_create.restype=C.c_void_p
c.cairo_create.argtypes=[C.c_void_p];c.cairo_create.restype=C.c_void_p
class Rect(C.Structure):_fields_=[('x',C.c_double),('y',C.c_double),('width',C.c_double),('height',C.c_double)]
r.rsvg_handle_render_document.argtypes=[C.c_void_p,C.c_void_p,C.POINTER(Rect),C.c_void_p];r.rsvg_handle_render_document.restype=C.c_int
c.cairo_surface_write_to_png.argtypes=[C.c_void_p,C.c_char_p];c.cairo_surface_write_to_png.restype=C.c_int
c.cairo_destroy.argtypes=[C.c_void_p];c.cairo_surface_destroy.argtypes=[C.c_void_p];g.g_object_unref.argtypes=[C.c_void_p]
def node(n):
 e=ET.Element(n['tag']);
 for k,v in n.items():
  if k in ['tag','children']:continue
  if k=='transform':e.set(k,'matrix('+','.join(map(str,v))+')')
  elif k=='clipPath':e.set('clip-path','url(#'+v+')')
  elif k=='symbol':e.set('{http://www.w3.org/1999/xlink}href','#'+v)
  elif k=='fillRule':e.set('fill-rule',v)
  else:e.set(k,str(v))
 for ch in n.get('children',[]):e.append(node(ch))
 return e
for name in ['E','G']:
 v=json.load(open(P/(name+'-vector.json')));s=ET.Element('svg',{'xmlns':'http://www.w3.org/2000/svg','viewBox':'1720 610 130 120','width':'520','height':'480'});defs=ET.SubElement(s,'defs')
 for id,ds in v['clips'].items():
  cl=ET.SubElement(defs,'clipPath',{'id':id})
  for d in ds:ET.SubElement(cl,'path',{'d':d})
 for id,n in v['symbols'].items():e=node(n);e.set('id',id);defs.append(e)
 for id,gr in v.get('gradients',{}).items():
  e=ET.SubElement(defs,'linearGradient',{'id':id,'gradientUnits':'userSpaceOnUse',**{k:str(gr[k])for k in ['x1','y1','x2','y2']}})
  for st in gr['stops']:ET.SubElement(e,'stop',{'offset':str(st['offset']),'stop-color':st['color'],'stop-opacity':str(st['opacity'])})
 s.append(node(v['root']));data=ET.tostring(s);(P/(name+'-crop.svg')).write_bytes(data);h=r.rsvg_handle_new_from_data(data,len(data),None);assert h;surf=c.cairo_image_surface_create(0,520,480);ctx=c.cairo_create(surf);assert r.rsvg_handle_render_document(h,ctx,C.byref(Rect(0,0,520,480)),None);assert c.cairo_surface_write_to_png(surf,str(P/(name+'-crop.png')).encode())==0;c.cairo_destroy(ctx);c.cairo_surface_destroy(surf);g.g_object_unref(h)
from PIL import Image
import numpy as np
a=np.array(Image.open(P/'E-crop.png').convert('RGBA'));b=np.array(Image.open(P/'G-crop.png').convert('RGBA'));result=dict(backend='Installed librsvg/Cairo, not Chrome/product Scene',dimensions=[520,480],opaqueE=int(np.count_nonzero(a[:,:,3])),opaqueG=int(np.count_nonzero(b[:,:,3])),alphaDifferent=int(np.count_nonzero(a[:,:,3]!=b[:,:,3])),rgbDifferent=int(np.count_nonzero(np.any(a[:,:,:3]!=b[:,:,:3],axis=2))));print(result);(P/'native-result.json').write_text(json.dumps(result,indent=2)+'\n')
