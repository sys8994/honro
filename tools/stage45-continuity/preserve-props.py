"""Actual Inkscape alpha booleans preserve wall and complete the cropped shrub.
No source colour path or collision edits. Source PNG coordinates are registration only.
"""
from pathlib import Path
from lxml import etree as E
import json,os,subprocess
R=Path(__file__).resolve().parents[2];o=R/'_local/stage45';v=json.loads((o/'source.json').read_text())['vector'];k=1997/2172
polys={'wall':('body-a',[(1600,638),(1610,590),(1650,573),(1652,548),(1718,528),(1756,510),(1785,510),(1804,527),(1799,578),(1823,610),(1860,660),(1772,653),(1710,639)],'path-intersection'),'props':('props-a',[(-10,500),(140,500),(140,648),(-10,663)],'path-difference'),'shrub':('props-a',[(25,720),(182,720),(182,790),(25,790)],'path-intersection')}
# Measured visible stone outline in a native source crop (viewBox1400,430,400,220; rendered1600x880).
wallpx=[(90,598),(96,550),(150,520),(243,506),(280,520),(320,518),(326,464),(355,433),(410,409),(525,389),(555,404),(605,410),(611,372),(628,348),(689,330),(757,313),(757,240),(770,220),(815,211),(835,197),(972,153),(1018,153),(1033,222),(1000,244),(1000,600),(1025,650),(1015,720),(975,755),(910,738),(810,690),(730,651),(600,620),(470,603)]
# Convert diagnostic crop coordinates to the same canonical PNG coordinate convention.
polys['wall']=('body-a',[((1400+x/4)/k,(430+y/4)/k) for x,y in wallpx],'path-intersection')
out={}
for name,(clip,points,op) in polys.items():
 r=E.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox='0 0 1997 788');E.SubElement(r,'path',id='a',d=' '.join(v['clips'][clip]));E.SubElement(r,'path',id='m',d='M'+'L'.join(f'{x*k},{y*k/1.0012706480304956}'for x,y in points)+'Z');f=o/(name+'-mask-input.svg');E.ElementTree(r).write(str(f));dest=o/(name+'-alpha.svg');p=subprocess.run(['/usr/bin/inkscape',str(f),'--batch-process','--actions='+f'select-by-id:a,m;{op};select-clear;export-plain-svg;export-filename:{dest};export-do'],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True);p.check_returncode();out[name]=[e.get('d') for e in E.parse(str(dest)).findall('.//{*}path')]
(R/'shared/assets/environment/act5/stage45-preserved-clips.json').write_text(json.dumps(out,separators=(',',':'))+'\n')
