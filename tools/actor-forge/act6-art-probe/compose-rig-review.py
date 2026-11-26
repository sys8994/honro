from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
monsters=['boss_daedosa','grot_hanging','grot_hands','grot_door','wonhon','wonhon_knotted','gate_armor','forepaw']
titles=['Daedosa','Hanging mourner','Hundred-handed spirit','Maw gate','Spilled revenant','Knotted revenant','Threshold armor','Forepaw']
out=Image.new('RGB',(1420,1036),'#213037'); draw=ImageDraw.Draw(out)
for i,(n,title) in enumerate(zip(monsters,titles)):
  d=Path('rig-parts')/n
  f=d/'compact-renderer.png'
  if not f.exists(): f=d/'actual-renderer.png'
  im=Image.open(f).convert('RGB')
  width=im.width//4
  j=(i%2)*710;y=(i//2)*257
  draw.text((j+10,y+8),title+'   /   idle and cast',fill='#ede4ce',font=font)
  for k in [0,2]:
    piece=im.crop((k*width,476,(k+1)*width,803))
    piece.thumbnail((348,215),Image.Resampling.LANCZOS)
    out.paste(piece,(j+(k//2)*353+(348-piece.width)//2,y+30+(218-piece.height)//2))
out.save('rig-parts/honro-act6-monster-motion-review.png')
