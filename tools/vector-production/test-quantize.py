import math,subprocess,tempfile,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path
with tempfile.TemporaryDirectory() as folder:
 a=Path(folder)/'raw.svg';b=Path(folder)/'candidate.svg'
 d='m10.123 20.456 c.123 4.567 8.911 -3.456 10.111 2.345 s5.777 10.111 20.555 1.111 q1.123 2.345 3.456 4.567 t7.891 8.912'
 a.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="{d}"/></svg>');subprocess.run(['python','tools/vector-production/quantize-svg.py',str(a),'--output',str(b),'--grid','.01'],check=True,capture_output=True)
 old=parse_path(d);new=parse_path(next(e for e in E.parse(b).getroot().iter() if e.tag.endswith('}path')).get('d'));assert len(old)==len(new)
 maximum=max(abs(x.point(i/200)-y.point(i/200)) for x,y in zip(old,new) for i in range(201));assert maximum<=.01/math.sqrt(2)+1e-9,maximum
 print(f'PASS: absolute cubic/S/quadratic/T quantization, sampled displacement {maximum:.8f} <= .00707107')
