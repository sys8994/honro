from pathlib import Path
import xml.etree.ElementTree as E,json,re,copy
S='http://www.w3.org/2000/svg';E.register_namespace('',S)
for name,src,palette,w,h in [('floor','stage34-floor-silhouette-v4/floor34-source.svg',['#526477','#344b5d','#2b4052','#243949'],2172,724),('roof','stage34-silhouette-v4/roof34-source.svg',['#526477','#405568','#304758','#243949'],1680,936)]:
 p=Path('art')/src; d=p.parent; original=E.parse(p).getroot();r=E.Element('{'+S+'}svg',{'viewBox':f'0 0 {w} {h}','width':str(w),'height':str(h)})
 for e in original.findall('.//{'+S+'}path'):r.append(copy.deepcopy(e))
 E.ElementTree(r).write(d/'raw.svg',encoding='utf-8',xml_declaration=True)
 for e,color in zip(r,palette):e.set('style','fill:'+color)
 E.ElementTree(r).write(d/'palette.svg',encoding='utf-8',xml_declaration=True)
 (d/'import-config.json').write_text(json.dumps({'id':f's34-authored-v4:{name}-source','name':f'34 authored {name}','category':'rock','semanticLayer':'BODY','bounds':{'x':0,'y':0,'w':w,'h':h},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':h},'params':{'sourceConcept':'concept.png','nativeTrace':p.name}}))
