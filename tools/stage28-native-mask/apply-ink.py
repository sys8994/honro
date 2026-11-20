from pathlib import Path
from subprocess import check_output
p=Path('shared/runtime/terrain-readability.js')
assert check_output(['git','hash-object',str(p)],text=True).strip()=='9753f90b3417e02ab023b510a961f00bc6cb79a1'
s=p.read_text()
needle='   const left=Math.min(a.x,z.x),right=Math.max(a.x,z.x),low=Math.min(a.y,z.y),high=Math.max(a.y,z.y),peers='
assert s.count(needle)==1
change="""   if(b.honroStage===28&&t.id==='a3-foundation'&&!walkable&&a.x===16200&&a.y===9000&&z.x===-9000&&z.y===9000)continue;
"""
p.write_text(s.replace(needle,change+needle))
