from pathlib import Path
import xml.etree.ElementTree as E,copy,subprocess
P=Path(__file__).parent;N='{http://www.w3.org/2000/svg}'
b=E.parse('stage7-semantic-study/lateral/baseline-collage.svg').getroot();q=E.parse('stage7-semantic-study/corrected/desktop-join.svg').getroot()
s=E.Element('svg',xmlns='http://www.w3.org/2000/svg',width='2300',height='800',viewBox='-450 750 2300 800')
s.append(copy.deepcopy(q.find(N+'defs')));s.append(copy.deepcopy(b.find(N+'defs')))
for node in list(b)[1:15]:s.append(copy.deepcopy(node))
s.append(copy.deepcopy(list(q)[-1]))
D=s[1]
for name,index,x,y,w,h in [('left',15,-381,991,390,24),('right',16,1434,880,400,28)]:
 c=E.SubElement(D,'clipPath',id='protected-'+name,clipPathUnits='userSpaceOnUse');E.SubElement(c,'rect',x=str(x),y=str(y),width=str(w),height=str(h));g=E.SubElement(s,'g',**{'clip-path':'url(#protected-'+name+')'});g.append(copy.deepcopy(b[index]))
E.ElementTree(s).write(P/'target.svg');subprocess.run(['inkscape',str(P/'target.svg'),'--export-filename='+str(P/'target.png')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
g=copy.deepcopy(s)
E.SubElement(g,'path',d='M-383.386581,991H8 M1447,884H1831.386581',fill='none',stroke='#00ffff',**{'stroke-width':'3'})
E.SubElement(g,'path',d='M-383.386581,991V1100 M1831.386581,884V1000',fill='none',stroke='#ff00ff',**{'stroke-width':'2','stroke-dasharray':'5 4'})
E.ElementTree(g).write(P/'guide.svg');subprocess.run(['inkscape',str(P/'guide.svg'),'--export-filename='+str(P/'guide.png')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
