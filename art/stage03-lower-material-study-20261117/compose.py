from lxml import etree as E
from pathlib import Path
S='http://www.w3.org/2000/svg';ns={'s':S}
root=E.Element('{%s}svg'%S,nsmap={None:S},width='4174',height='3400',viewBox='-1200 0 4174 3400')
field=E.parse('/tmp/honro-stage3-field-native-clean/04-palette-matched-raw.svg').getroot()
body=E.parse('stage3-exterior-study/body-original.svg').getroot()
g=E.SubElement(root,'{%s}g'%S,transform='translate(-1200 887) scale(2.582920792079208)')
for n in field:g.append(n)
g=E.SubElement(root,'{%s}g'%S)
for n in body:g.append(n)
Path('stage3-exterior-study/v1-preview/composite.svg').write_bytes(E.tostring(root))
