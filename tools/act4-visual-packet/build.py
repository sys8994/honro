from pathlib import Path
import json,hashlib,sys,datetime,io
from fontTools.ttLib import TTFont
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as RLFont
from reportlab.lib.utils import ImageReader
from PIL import Image
R=Path(__file__).resolve().parents[2]
OUT=R/'output/pdf/act4-review'; OUT.mkdir(parents=True,exist_ok=True)
TMP=R/'tmp/pdfs/act4-review'; TMP.mkdir(parents=True,exist_ok=True)
I=json.loads((R/'tools/act4-visual-packet/source-inventory.json').read_text())
CAP=Path(sys.argv[1]) if len(sys.argv)>1 else None
assert CAP and CAP.is_dir(),'Pass completed final capture directory'
textpool=''.join(json.dumps(I,ensure_ascii=False))+'''혼로 4막 지형 수정 검토 실제 엔진 화면 사용한 시안 검수본 배포 전 장별 지형과 시안을 함께 보실 수 있도록 정리했습니다. 모든 화면은 동일한 통합 데이터와 실행 코드에서 새로 촬영했습니다. 화면은 고정 카메라로 촬영한 게임 엔진 렌더링이며 브라우저 조작 화면이나 클리어 증거는 아닙니다. 시안은 원본 이미지이며 실제 게임에는 Inkscape 벡터화와 색상 및 윤곽 조정을 거친 자산이 사용됩니다. 전투 완료 저장 이어하기 모바일 성능과 운영 배포 검증은 별도입니다. 원본과 검수 범위 프로젝트 실행 코드 화면 식별값 대표 시안 일부는 공통 자산으로 재사용되었습니다. 이전 미술과 비교하는 화면이 아닙니다. 시안의 검은 영역은 투명 배경입니다. 검수 카메라에서는 등장 직후의 인물이 공중에 보일 수 있습니다. 40장은 앞선 장의 완료 조건을 준비한 개별 진입 화면입니다. 연속 플레이 검증을 대신하지 않습니다. 이 문서의 상태는 제작 시점 기준입니다. 촬영본 파일 SHA256 개별 시안 원본 SHA256 앞 12자리 원본 파일과 전체 해시는 별도 제작 기록에 보존했습니다. 정규 플레이 가능한 표면과 내부 장식의 밀도를 구분했습니다. 푸른 새벽 색감을 적용했습니다. YYYYMMDD0123456789abcdef:.- /()·'''
# Embed a Korean subset as TrueType outlines from installed OFL Noto CJK.
fontpath=TMP/'NotoSansKR-review.ttf'
f=TTFont('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',fontNumber=1)
cmap=f.getBestCmap(); chars=set(map(ord,textpool+Path(__file__).read_text()))|set(range(32,127)); names=['.notdef']+sorted({cmap[c] for c in chars if c in cmap})
gs=f.getGlyphSet(); glyphs={}
for name in names:
 pen=TTGlyphPen(None); q=Cu2QuPen(pen,max_err=1.0,reverse_direction=True); gs[name].draw(q); glyphs[name]=pen.glyph()
b=FontBuilder(f['head'].unitsPerEm,isTTF=True); b.setupGlyphOrder(names); b.setupCharacterMap({c:cmap[c] for c in chars if c in cmap}); b.setupGlyf(glyphs); b.setupHorizontalMetrics({n:f['hmtx'][n] for n in names}); b.setupHorizontalHeader(ascent=f['hhea'].ascent,descent=f['hhea'].descent); b.setupOS2(sTypoAscender=f['OS/2'].sTypoAscender,sTypoDescender=f['OS/2'].sTypoDescender,usWinAscent=f['OS/2'].usWinAscent,usWinDescent=f['OS/2'].usWinDescent); b.setupNameTable({'familyName':'Noto Sans KR Review','styleName':'Regular','uniqueFontIdentifier':'NotoSansKRReviewSubset','fullName':'Noto Sans KR Review','psName':'NotoSansKRReview'}); b.setupPost(); b.setupMaxp(); b.save(fontpath)
pdfmetrics.registerFont(RLFont('KR',str(fontpath)))
W,H=841.89,595.28
out=OUT/'honro-act4-terrain-visual-review.pdf'
c=canvas.Canvas(str(out),pagesize=(W,H),pageCompression=1); c.setTitle('혼로 4막 지형 수정 검토'); c.setAuthor('혼로 제작 검수')
records=[]; sourcehashes=set(); runtimehashes=set()
def text(x,y,s,size=10,col='#202b33'):
 c.setFillColor(col); c.setFont('KR',size); c.drawString(x,y,s)
def wrap(s,maxw,size):
 lines=[]; line=''
 for ch in s:
  if pdfmetrics.stringWidth(line+ch,'KR',size)>maxw and line: lines.append(line);line=ch
  else:line+=ch
 if line:lines.append(line)
 return lines
def para(x,y,s,maxw,size=10,leading=15,col='#202b33'):
 for l in wrap(s,maxw,size):text(x,y,l,size,col);y-=leading
 return y
def picture(p,x,y,w,h,bg=None):
 im=Image.open(p); iw,ih=im.size; scale=min(w/iw,h/ih); ww,hh=iw*scale,ih*scale
 if bg: c.setFillColor(bg);c.rect(x,y,w,h,fill=1,stroke=0)
 # Delivery-only raster embedding: sources untouched; text remains vector.
 target=(max(1,round(ww*2.4)),max(1,round(hh*2.4)))
 im.thumbnail(target,Image.Resampling.LANCZOS)
 if im.mode in ('RGBA','LA') or 'transparency' in im.info:
  rgba=im.convert('RGBA'); flat=Image.new('RGB',rgba.size,bg or '#ffffff'); flat.paste(rgba,mask=rgba.getchannel('A')); im=flat
 else: im=im.convert('RGB')
 data=io.BytesIO();im.save(data,format='JPEG',quality=90,optimize=True,subsampling=0);data.seek(0)
 c.drawImage(ImageReader(data),x+(w-ww)/2,y+(h-hh)/2,ww,hh)
 return hashlib.sha256(Path(p).read_bytes()).hexdigest()
for idx,d in enumerate(I):
 n=d['stage']; stagecap=Path(sys.argv[3]) if n==39 and len(sys.argv)>3 else (Path(sys.argv[2]) if n==32 and len(sys.argv)>2 else CAP); m=json.loads((stagecap/str(n)/'manifest.json').read_text()); assert len(m['frames'])==1
 frame=m['frames'][0]; p=stagecap/str(n)/frame['file']; assert p.exists(); sourcehashes.add(m['projectSHA256']);runtimehashes.add(m['runtimeSHA256'])
 text(30,565,'혼로 4막 지형 수정 검토',10,'#56616b');text(30,532,f'{n}장  {d["name"]}',23,'#000000')
 para(30,506,d['change'],780,11,16)
 text(30,475,'실제 엔진 화면',11,'#000000'); text(615,475,'통합 검수본 사용 시안',11,'#000000')
 ih=picture(p,30,113,555,347)
 cs=d['concepts']; totalh=347; gap=11; slot=(totalh-gap*(len(cs)-1))/len(cs)
 for j,a in enumerate(cs):
  cy=460-j*(slot+gap);text(615,cy-11,a['label'],9,'#253541')
  picture(R/a['path'],615,cy-slot,197,slot-19,bg='#e9eef1')
 text(30,94,'게임 엔진 고정 카메라 화면 · 배포 전 검수본',9,'#50606b')
 extra='시안은 원본이며, 화면에는 벡터화와 색상·윤곽 조정 후의 자산이 사용되었습니다.'
 para(30,73,extra,780,9,13,'#50606b')
 text(30,29,'기능 검증 및 운영 배포 상태는 별도입니다.',8,'#68747c');text(780,29,f'{idx+1} / 11',8,'#68747c')
 c.showPage();records.append({'stage':n,'image':str(p.relative_to(R)) if p.is_relative_to(R) else str(p),'imageSHA256':ih,'captureManifest':m,'concepts':cs})
assert len(sourcehashes)==1 and len(runtimehashes)==1,'All10 captures must share exact source/runtime'
text(30,554,'원본과 검수 범위',24,'#000000')
y=520
for s in ['모든 화면은 동일한 통합 데이터와 실행 코드에서 새로 촬영했습니다.','화면은 고정 카메라의 게임 엔진 렌더링이며, 브라우저 조작이나 전투 완료 증거가 아닙니다.','40장은 앞선 장의 완료 조건을 준비한 개별 진입 화면입니다. 연속 플레이 검증을 대신하지 않습니다.', '등장 직후의 고정 시점 촬영으로, 일부 적은 공중에 보입니다. 인물 위치를 보정하지 않았습니다.','시안은 이번 통합 검수본에 실제 사용한 원본입니다. 중간 시험 시안은 제외했습니다. 공통 자산은 재사용되었습니다.']:
 y=para(30,y,s,780,10,15)-5
text(30,y-4,'프로젝트  '+next(iter(sourcehashes))[:20],9);text(430,y-4,'실행 코드  '+next(iter(runtimehashes))[:20],9)
y-=38
text(30,y,'촬영본 식별값',12,'#000000');text(430,y,'시안 원본 식별값',12,'#000000');y-=24
for r,d in zip(records,I):
 text(30,y,f'{r["stage"]}장  {d["name"]}',10);text(235,y,r['imageSHA256'][:16],9)
 sy=y
 vals=' / '.join(a['sha256'][:8] for a in r['concepts'])
 text(430,sy,f'{r["stage"]}장  {vals}',8)
 y-=24
para(30,75,'식별값은 SHA256 앞부분입니다. 원본 파일과 전체 해시는 별도 제작 기록에 보존했습니다.',780,9,13,'#50606b')
text(30,29,'이 문서의 상태는 제작 시점 기준입니다.',8,'#68747c');text(780,29,'11 / 11',8,'#68747c');c.showPage();c.save()
manifest={'createdUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'projectSHA256':next(iter(sourcehashes)),'runtimeSHA256':next(iter(runtimehashes)),'scope':'Actual App Native Canvas fixed cameras; not browser/HUD/continuous play or deployment proof. Concepts original files.','pdf':str(out.relative_to(R)),'pdfSHA256':hashlib.sha256(out.read_bytes()).hexdigest(),'records':records}
binding=CAP/'source-binding.json'
if binding.exists():
 manifest['sourceBinding']=json.loads(binding.read_text())
 assert manifest['sourceBinding']['projectNormalizedSHA256']==manifest['projectSHA256']
 assert manifest['sourceBinding']['runtimeSHA256']==manifest['runtimeSHA256']
(OUT/'provenance-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(out);print(manifest['pdfSHA256']);print(out.stat().st_size)
