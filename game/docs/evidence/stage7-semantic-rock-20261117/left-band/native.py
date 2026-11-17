from pathlib import Path
import xml.etree.ElementTree as E,copy,subprocess,json,base64
P=Path(__file__).parent;N='{http://www.w3.org/2000/svg}'
# Native maroon planes replace only nonwalking material BELOW exact contact.
shapes=[('#43333a','M-383.386581 993 H8 L9 1019 L22 1030 Q-28 1022 -96 1036 Q-185 1056 -258 1065 Q-320 1073 -365 1050 Q-378 1020 -383.386581 1015 Z'),('#533d47','M-381 994 Q-333 997 -281 1006 Q-230 1017 -185 1014 Q-229 1038 -284 1053 Q-327 1066 -365 1050 Q-375 1027 -381 1010 Z'),('#604851','M-146 993 H-15 Q-50 1003 -86 1021 Q-122 1038 -181 1048 Q-147 1028 -121 1015 Q-104 1003 -146 993 Z')]
for name in ['full','portrait-left','desktop-right','join','source-contact']:
 s=E.parse('stage7-semantic-study/explicit-mask/'+name+'.svg').getroot();
 for n in s.iter():
  if n.get('id')=='only-side-gap':list(n)[0].set('d','M-450 991H8L40 994.310344827586V1150H9V1550H-450Z M1400 1000H1434V884H1850V1550H1434V1150H1400Z')
  if n.tag==N+'g' and n.get('clip-path')=='url(#only-side-gap)':E.SubElement(n,N+'path',fill='#43333a',d='M8 991L40 994.310344827586V1032H8Z')
 g=E.SubElement(s,N+'g')
 for fill,d in shapes:E.SubElement(g,N+'path',fill=fill,d=d)
 # Restore only exact original2-source contact edge; lower24source is support, not protected paint.
 # source-precise rectangular top has no new green/grass and is unchanged above993.
 E.ElementTree(s).write(P/(name+'.svg'));subprocess.run(['inkscape',str(P/(name+'.svg')),'--export-filename='+str(P/(name+'.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 b=list(map(float,s.get('viewBox').split()));bg=base64.b64encode(Path('stage7-semantic-study/corrected/background-decoded.png').read_bytes()).decode();s.insert(0,E.Element(N+'image',x=str(b[0]),y=str(b[1]),width=str(b[2]),height=str(b[3]),preserveAspectRatio='none',href='data:image/png;base64,'+bg));E.ElementTree(s).write(P/(name+'-game.svg'));subprocess.run(['inkscape',str(P/(name+'-game.svg')),'--export-filename='+str(P/(name+'-game.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
(P/'native-shapes.json').write_text(json.dumps(shapes,indent=2))
