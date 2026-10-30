#!/usr/bin/env python3
"""Review overlay only; these proposed support profiles are not game collision."""
from pathlib import Path
import json
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parents[2]/'art/act4-pilot-modules-v2'
profiles={'ascending':[[45.1,365],[110,337],[180,316],[250,288],[320,264],[389,229],[458,204],[527,170],[595,136],[666,109],[705,97.7],[735.9,105]],'plateau':[[819.1,175],[870,152],[960,133],[1040,116],[1090,111.1],[1145,126],[1218,133],[1275,152],[1346,167],[1372,187],[1430,201],[1513.1,229]],'descending':[[65.2,556],[101,546.5],[130,547],[164,562],[220,571],[260,584],[283,602],[343,629],[414,656],[490,686],[565,713],[642,742],[706,773],[758,797],[768.9,801]],'overhang':[[939,593],[970,582],[1035,572],[1118,561.3],[1160,563],[1220,574],[1290,590],[1360,598],[1420,608],[1475,620],[1497,628]]}
report={'status':'PROPOSED, ROOT REVIEW REQUIRED, not exact final profile','convention':'upper silhouette of moss cap is proposed contact edge; interior cap/body boundary is NOT the walktop','profiles':profiles,'reuse':{'ascending':['west-step','broken-crossing','ridge-shoulder'],'plateau':['west-ledge','ridge-court'],'descending':['middle-west','middle-junction'],'overhang':['east-overhang','east-middle','east-low']},'notes':['After review, densify/snap anchors to actual native outer boundary within explicit tolerance before fitting.','Descending rightmost support ends slightly before body maxX; endpoint extension is provisional and must be reviewed, not assumed actual contact.','Avoid changing support collider profiles; only native art fitted.']}
(P/'proposed-anchors.json').write_text(json.dumps(report,indent=2)+'\n')
im=Image.open('/tmp/modules-v2-raw.png').convert('RGBA');base=Image.new('RGBA',im.size,'#405360');base.alpha_composite(im);d=ImageDraw.Draw(base)
for name,points in profiles.items():
 d.line([tuple(p) for p in points],fill='#ffdb66',width=3)
 for i,(x,y) in enumerate(points):d.ellipse((x-4,y-4,x+4,y+4),fill='#ff5656');d.text((x+3,y-22),str(i),fill='white')
 x,y=points[len(points)//2];d.text((x-70,y-60),name+' - PROPOSED TOP',fill='white')
base.convert('RGB').save(P/'proposed-anchors.png')
