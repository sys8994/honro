import copy,xml.etree.ElementTree as E,subprocess,json
from pathlib import Path
NS='{http://www.w3.org/2000/svg}';P=Path(__file__).resolve().parent;original=E.parse(P.parent/'source-original.svg').getroot();rootline=json.load(open(P.parent/'semantic-analysis.json'))['rootFloorSource'];protected={2,3,4,5,7}
svg=E.Element('svg',xmlns='http://www.w3.org/2000/svg',width='1448',height='1086',viewBox='0 0 1448 1086');defs=copy.deepcopy(original.find(NS+'defs'));svg.append(defs)
# Exact original paths/transforms/clips; only semantic coverage paints differ.
g=copy.deepcopy(list(original)[1]);i=0
for e in g.iter():
 if e.tag==NS+'path':e.set('fill','#fff' if i in protected else '#000');i+=1
assert i==12
f=E.SubElement(defs,'filter',id='visible-protection-halo',x='-10%',y='-10%',width='120%',height='120%',**{'color-interpolation-filters':'sRGB'})
E.SubElement(f,'feColorMatrix',type='matrix',values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .2126 .7152 .0722 0 0')
E.SubElement(f,'feMorphology',operator='dilate',radius='3')
t=E.SubElement(f,'feComponentTransfer');E.SubElement(t,'feFuncA',type='discrete',tableValues='0 1')
# Protect even partial coverage via an explicit below-half threshold of1/255.
# Replace threshold with table so positive source AA survives after halo.
t.remove(list(t)[0]);E.SubElement(t,'feFuncA',type='linear',slope='255',intercept='0')
mask=E.SubElement(defs,'mask',id='grass-protection',maskUnits='userSpaceOnUse',x='-1200',y='0',width='3848',height='3600',style='mask-type:alpha')
# Exclude the original artificial lower perimeter from semantic grass coverage.
# Exact source-alpha geometry, eroded4source px; this is NOT a road or hole edit.
ef=E.SubElement(defs,'filter',id='inner-alpha-4',x='-10%',y='-10%',width='120%',height='120%');E.SubElement(ef,'feMorphology',operator='erode',radius='4')
im=E.SubElement(defs,'mask',id='semantic-interior',maskUnits='userSpaceOnUse',x='0',y='0',width='1448',height='1086',style='mask-type:alpha')
ig=E.SubElement(im,'g',filter='url(#inner-alpha-4)');sc=E.SubElement(ig,'g',transform='matrix(1.666283084004603,0,0,1.665644171779141,0,0)')
for ap in original.find(NS+'defs')[0]:
 q=copy.deepcopy(ap);q.set('fill','white');sc.append(q)
gc=E.SubElement(defs,'clipPath',id='grass-semantic-bottom',clipPathUnits='userSpaceOnUse');E.SubElement(gc,'rect',x='0',y='0',width='1448',height='1070')
wrap=E.SubElement(mask,'g',{'clip-path':'url(#grass-semantic-bottom)'})
hg=E.SubElement(wrap,'g',filter='url(#visible-protection-halo)');mg=E.SubElement(hg,'g',mask='url(#semantic-interior)');mg.append(g)
clip=E.SubElement(defs,'clipPath',id='nonwalk-envelope',clipPathUnits='userSpaceOnUse');pts=[(-1200,rootline[0][1]+28)]+[(x,y+28) for x,y in rootline]+[(2648,rootline[-1][1]+28),(2648,3600),(-1200,3600)]
E.SubElement(clip,'path',d='M '+' L '.join(f'{x},{y}' for x,y in pts)+' Z')
m=E.SubElement(defs,'mask',id='editable',maskUnits='userSpaceOnUse',x='-1200',y='0',width='3848',height='3600',style='mask-type:luminance')
E.SubElement(m,'rect',x='-1200',y='0',width='3848',height='3600',fill='black')
e=E.SubElement(m,'g',{'clip-path':'url(#nonwalk-envelope)'});E.SubElement(e,'rect',x='-1200',y='0',width='3848',height='3600',fill='white');E.SubElement(e,'rect',x='-1200',y='0',width='3848',height='3600',fill='black',mask='url(#grass-protection)')
# Footprint crops of13 added footholds are above the envelope, verified independently.
for n in list(original)[1:]:svg.append(copy.deepcopy(n))
E.SubElement(svg,'rect',x='-1200',y='0',width='3848',height='3600',fill='#ff0000',mask='url(#editable)')
E.ElementTree(svg).write(P/'probe.svg');E.ElementTree(defs).write(P/'mask-defs.svg')
for name,kind in [('probe','probe'),('eligible','editable'),('grass','grass-protection')]:
 s=copy.deepcopy(svg)
 if kind!='probe':
  for q in list(s)[1:]:s.remove(q)
  E.SubElement(s,'rect',x='0',y='0',width='1448',height='1086',fill='#fff',mask='url(#'+kind+')')
 E.ElementTree(s).write(P/(name+'.svg'));subprocess.run(['inkscape',str(P/(name+'.svg')),'--export-filename='+str(P/(name+'.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
