from pathlib import Path
import xml.etree.ElementTree as E,copy,subprocess,json,base64
P=Path(__file__).resolve().parent;NS='{http://www.w3.org/2000/svg}';orig=E.parse(P.parent/'source-original.svg').getroot();defs=E.parse(P/'mask-defs.svg').getroot()
svg=E.Element('svg',xmlns='http://www.w3.org/2000/svg',width='3848',height='3600',viewBox='-1200 0 3848 3600');svg.append(copy.deepcopy(defs))
for g in list(orig)[1:]:svg.append(copy.deepcopy(g))
E.SubElement(svg,'image',x='-1200',y='0',width='3848',height='3600',preserveAspectRatio='none',href='data:image/png;base64,'+base64.b64encode((P.parent/'generated.png').read_bytes()).decode(),mask='url(#editable)')
for name,box,width in [('full',[-1200,0,3848,3600],1280),('source',[0,0,1448,1086],1448),('zoom-join',[0,950,1448,200],2896),('join',[0,850,1448,500],1448),('portrait-left',[-1086,-798,2172,3876],390),('desktop-right',[362,518,2172,1245],1331),('desktop-join',[-100,850,1648,500],1010)]:
 s=copy.deepcopy(svg);s.set('viewBox',' '.join(map(str,box)));s.set('width',str(width));s.set('height',str(round(width*box[3]/box[2])));E.ElementTree(s).write(P/(name+'.svg'));subprocess.run(['inkscape',str(P/(name+'.svg')),'--export-filename='+str(P/(name+'.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
