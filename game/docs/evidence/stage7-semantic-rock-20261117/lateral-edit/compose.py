from pathlib import Path
import xml.etree.ElementTree as E,copy,subprocess,base64
P=Path(__file__).parent;N='{http://www.w3.org/2000/svg}';b=E.parse(P/'target.svg').getroot();D=b[1]
c=E.SubElement(D,N+'clipPath',id='only-side-gap',clipPathUnits='userSpaceOnUse');E.SubElement(c,N+'path',d='M-450 991H9V1019H40V1150H9V1550H-450Z M1400 1000H1434V884H1850V1550H1434V1150H1400Z')
g=E.Element(N+'g',{'clip-path':'url(#only-side-gap)'});E.SubElement(g,N+'image',x='-450',y='750',width='2300',height='800',preserveAspectRatio='none',href='data:image/png;base64,'+base64.b64encode((P/'generated.png').read_bytes()).decode());E.SubElement(g,N+'path',d='M-383.386581 991 H-375 V1021 Q-379 1020 -381 1017 Q-383.386581 1016 -383.386581 1015 Z',fill='#43333a');b.insert(2,g)
for name,box,w in [('join',[-450,750,2300,800],2300),('full',[-1200,0,3848,3600],1280),('portrait-left',[-1086,-798,2172,3876],390),('desktop-right',[362,518,2172,1245],1331),('source-contact',[-450,750,2300,800],4600)]:
 s=copy.deepcopy(b);s.set('viewBox',' '.join(map(str,box)));s.set('width',str(w));s.set('height',str(round(w*box[3]/box[2])));E.ElementTree(s).write(P/(name+'.svg'));subprocess.run(['inkscape',str(P/(name+'.svg')),'--export-filename='+str(P/(name+'.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
