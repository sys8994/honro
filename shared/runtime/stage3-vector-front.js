(function(G){'use strict';
// One ferry foreground: bounded native source regions at local actor scale,
// bearing soil shoulders and alluvium authored in world coordinates.
// Existing world tiles cache the finished paths; no raster foreground.
const paths=new Map(),surfaces=new WeakMap(),C=G.HONRO_CORE;
function p(d){if(!paths.has(d))paths.set(d,new Path2D(d));return paths.get(d);}
function fill(c,d,paint){c.fillStyle=paint;c.fill(p(d));}
function grad(c,x,y,w,h,stops){const g=c.createLinearGradient(x,y,x+w,y+h);for(const[a,v]of stops)g.addColorStop(a,v);return g;}
const FIELD=G.HONRO_FERRY_FOREGROUND;
const geometry=FIELD.paths.slice(1).map(n=>({...n,path:p(n.d)}));
const intersects=(a,b)=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];
// Unique source windows follow rock shoulders rather than sheet rectangles.
// 1.8–2.2world/source px maps an adult to 47–58source px (103.5world).
const formations=[[[1001,41,200,226],[3260,910,2.85],"M0,174L11,106L42,52L79,31L143,10L181,0L200,24L189,76L173,137L143,174L104,203L47,226L13,210Z",-0.04,"E"],[[1284,190,220,268],[3790,1110,2.5],"M0,225L12,165L6,106L18,54L51,24L100,14L147,0L209,21L220,42L198,102L191,157L156,211L124,244L73,261L19,268Z",0.04,"C"],[[721,378,383,250],[2660,1380,2.5],"M0,204L19,140L59,78L104,38L167,27L229,11L306,0L370,18L383,42L361,97L340,158L292,216L227,250L162,250L114,229L61,214L27,226Z",-0.02,"B"],[[404,289,278,247],[2070,1510,2.45],"M0,131L36,78L75,53L134,31L207,0L250,10L278,32L250,76L240,129L210,169L166,202L112,225L55,247L4,231Z",0.035,"A"],[[673,316,184,164],[1640,1710,2.6],"M0,131L2,86L28,39L74,18L124,0L163,4L184,22L181,50L160,81L124,111L93,144L39,164Z",-0.08,"J"],[[11,303,155,153],[-1310,1820,4.25],"M0,122L11,66L34,35L79,15L132,0L155,15L151,46L126,85L104,119L52,148L7,153Z",0.04,"M"],[[655,148,196,129],[-730,2050,4.05],"M0,109L5,66L31,31L75,16L146,0L190,13L196,34L178,64L145,90L104,111L49,129L10,126Z",-0.04,"K"],[[135,293,166,146],[-130,2320,3.6],"M0,117L10,74L34,32L80,15L125,0L159,13L166,34L152,72L131,105L85,135L35,146L9,137Z",0.1,"I"],[[49,565,193,150],[430,2520,3.5],"M0,85L19,46L48,23L99,6L147,0L184,13L193,36L176,70L151,98L98,132L42,150L6,133Z",-0.1,"O"],[[289,36,121,168],[1130,2160,4.25],"M8,130L18,75L37,29L86,1L110,0L121,27L111,67L94,115L55,148L16,168L0,156Z",0.12,"D"],[[899,177,148,136],[1600,2470,3.6],"M0,109L8,61L31,28L80,3L121,0L148,19L140,54L116,90L75,120L26,136L3,126Z",-0.13,"R"],[[1271,500,242,216],[2230,2490,2.9],"M0,165L10,109L38,58L88,30L151,7L214,0L242,15L239,59L211,108L188,150L146,192L89,216L32,204Z",0.045,"H"],[[851,658,170,191],[2950,2180,3.7],"M0,144L24,94L42,54L74,24L115,0L147,2L170,18L161,64L144,101L121,144L87,177L35,191L2,174Z",-0.06,"L"],[[1495,214,176,176],[3830,2220,3.35],"M0,126L14,76L38,45L84,15L126,0L163,14L176,34L172,87L150,125L106,156L48,176L5,169Z",0.08,"N"],[[1146,534,160,140],[4400,2560,4.0],"M0,94L21,52L61,15L116,0L153,12L160,42L137,74L109,105L67,129L20,140L0,127Z",-0.1,"Q"],[[100,745,297,196],[-900,2920,4.5],"M0,147L20,86L62,45L117,34L170,9L215,0L265,25L297,52L278,114L251,157L206,194L10,196Z",0.02,"F"],[[1046,691,243,183],[250,3260,3.7],"M0,97L17,58L44,32L93,19L162,0L214,7L243,32L228,77L202,114L157,148L112,168L44,183L3,160Z",0.09,"P"],[[411,685,292,256],[1210,3130,3.7],"M0,139L18,87L56,48L89,24L156,0L209,10L258,19L292,45L280,98L250,141L227,182L193,235L152,256L4,256Z",-0.1,"G"],[[404,289,278,247],[2290,3330,3.45],"M0,131L36,78L75,53L134,31L207,0L250,10L278,32L250,76L240,129L210,169L166,202L112,225L55,247L4,231Z",0.13,"A"],[[1271,500,242,216],[3260,3240,3.65],"M0,165L10,109L38,58L88,30L151,7L214,0L242,15L239,59L211,108L188,150L146,192L89,216L32,204Z",-0.04,"H"],[[721,378,383,250],[4310,3440,3.2],"M0,204L19,140L59,78L104,38L167,27L229,11L306,0L370,18L383,42L361,97L340,158L292,216L227,250L162,250L114,229L61,214L27,226Z",0.08,"B"]].map(([r,w,d,angle,id])=>{const area=[r[0],r[1],r[0]+r[2],r[1]+r[3]],pad=Math.max(r[2],r[3])*w[2]*.18;return{r,w,id,angle,clip:p(d),bounds:[w[0]-pad,w[1]-pad,w[0]+r[2]*w[2]+pad,w[1]+r[3]*w[2]+pad],parts:geometry.filter(g=>intersects(g.bounds,area))};});
function formation(c,f,view){if(view&&!intersects(f.bounds,[view.x,view.y,view.x+view.w,view.y+view.h]))return;const[r,w]=[f.r,f.w];c.save();c.translate(w[0],w[1]);c.rotate(f.angle);c.scale(w[2],w[2]);c.save();c.translate(3,4);c.fillStyle='#3e44375c';c.fill(f.clip);c.restore();c.clip(f.clip);c.fillStyle='#5b5b4e';c.fillRect(0,0,r[2],r[3]);c.translate(-r[0],-r[1]);for(const n of f.parts){c.fillStyle=n.fill;c.fill(n.path,'evenodd');c.strokeStyle=n.fill;c.lineJoin='round';c.lineWidth=.45;c.stroke(n.path);}c.restore();}
function draw(c,b,view){if(b?.honroStage!==3)return;c.save();
 c.fillStyle=grad(c,-600,800,3500,14000,[[0,'#776e58'],[.12,'#716851'],[.3,'#62634f'],[.58,'#505b49'],[1,'#344b3d']]);c.fillRect(-6100,400,16500,25500);
 // Load-bearing soil masses overlap at unequal heights; their lower faces
 // remain opaque all the way through the camera domain.
 fill(c,'M-6100 1800C-3520 1780-2100 1550-850 1660C10 1730 444 1395 1090 1450C1610 1490 1920 1270 2400 1430C2790 1590 3230 1410 3590 1680C4140 2080 4720 2230 5480 2490L10400 5100V27000H-6100Z',grad(c,700,1600,1600,5600,[[0,'#837354'],[.3,'#6c674e'],[.7,'#565d48'],[1,'#3f513e']]));
 fill(c,'M3270 830C3620 710 3930 945 4300 1030C4820 1150 5170 1490 5660 1710L10400 3430V27000H2780C2820 5900 3720 3550 3850 2420C3910 1890 3440 1450 3270 830Z',grad(c,3550,950,2600,5800,[[0,'#8b7957'],[.2,'#776d51'],[.6,'#5b614b'],[1,'#3d523e']]));
 for(const f of formations)formation(c,f,view);
 // Two shallow fans lie between the individual rock masses. Their broad
 // returning surfaces carry sediment around the exposed stone feet.
 fill(c,'M580 1810C880 1760 1170 1950 1310 2170C1470 2410 1760 2540 1910 2820C1600 2710 1380 2580 1180 2410Q970 2140 580 1810Z',grad(c,700,1830,1400,1500,[[0,'#8c7957'],[.4,'#7b6d50'],[1,'#62614b']]));
 fill(c,'M3070 1710Q3200 1770 3290 1910C3460 2160 3540 2410 3740 2570C4010 2800 4050 3010 4260 3280C3930 3110 3830 2800 3610 2650C3400 2490 3350 2200 3240 2060Q3150 1900 3070 1710Z',grad(c,3100,1770,1300,1800,[[0,'#867454'],[.45,'#74694e'],[1,'#5b604a']]));
 // Unequal road shoulders cover the source cuts at the actual contact line.
 const t=b.terrain.find(t=>t.id==='ferry-ground'&&!t.broken);if(t){const q=[[0,31],[240,52],[480,34],[740,67],[980,39],[1220,73],[1480,41],[1730,59],[1990,36],[2240,62],[2480,45],[2730,77],[2980,47],[3210,37],[3430,64],[3660,39],[3890,68],[4100,46],[4276,34]];const d='M'+q.map(([x])=>x+','+(C.topAt(t,x,t.y)+8)).join('L')+'L'+q.toReversed().map(([x,w])=>x+','+(C.topAt(t,x,t.y)+w)).join('L')+'Z';fill(c,d,grad(c,1800,700,1800,1700,[[0,'#8d7955'],[.27,'#81704e'],[.64,'#6e654a'],[1,'#5d5d46']]));}
 c.restore();}
function surfaceData(b){const t=b.terrain.find(t=>t.id==='ferry-ground'&&!t.broken);if(!t)return null;const key=b.sceneVersion+':'+t.x+':'+t.y+':'+t.w+':'+t.h;let data=surfaces.get(b);if(data?.key===key)return data;
 // Width changes belong to a few worn shoulders and runoff mouths. There is
 // no regular sawtooth, leaf field or repeated edge-noise generator.
 const rows=[[0,-7,17],[200,-10,23],[470,-8,15],[730,-12,26],[980,-6,19],[1220,-9,31],[1480,-11,21],[1700,-7,28],[1850,-10,19],[1990,-7,33],[2190,-11,25],[2390,-8,36],[2580,-10,22],[2770,-6,30],[2970,-11,18],[3150,-8,29],[3330,-12,22],[3520,-7,32],[3710,-10,23],[3910,-6,29],[4100,-10,18],[4276,-7,23]];
 const top=rows.map(([x,a])=>[x,C.topAt(t,x,t.y)+a*.5]),bottom=rows.map(([x,,a])=>[x,C.topAt(t,x,t.y)+a*.55]);
 const band=new Path2D();function edge(points,start){if(start)band.moveTo(...points[0]);else band.lineTo(...points[0]);for(let i=1;i<points.length-1;i++){const a=points[i],z=points[i+1];band.quadraticCurveTo(a[0],a[1],(a[0]+z[0])/2,(a[1]+z[1])/2);}band.lineTo(...points.at(-1));}edge(top,true);edge(bottom.toReversed(),false);band.closePath();
 
 const deposit=new Path2D();const strip=rows.slice(8,17);strip.forEach(([x],i)=>{const y=C.topAt(t,x,t.y)+5; i?deposit.lineTo(x,y):deposit.moveTo(x,y);});for(const[x,,width]of strip.toReversed())deposit.lineTo(x,C.topAt(t,x,t.y)+Math.min(14,width*.48));deposit.closePath();
 data={key,t,band,deposit};surfaces.set(b,data);return data;}
function surface(c,b,view){if(b?.honroStage!==3)return;const s=surfaceData(b);if(!s)return;c.save();
 c.fillStyle=grad(c,1900,1050,1200,600,[[0,'#91805e'],[.35,'#998361'],[1,'#8e7e5e']]);c.fill(s.band);
 c.fillStyle='#c3ae8023';c.fill(s.deposit);
 // Broken runoff lips interrupt the thin front edge at two actual hollows.
 const x=2390,y=C.topAt(s.t,x,s.t.y);c.translate(x,y);
 fill(c,'M-63 18L-31 23-12 15 13 24 31 18 59 27 42 36 17 30-9 39-34 30-56 34Z','#756345');
 fill(c,'M-8 28L8 33 1 51-14 64-10 45-23 35Z','#514c37');
 c.restore();
 // Three small, partly buried surface stones. Their unequal faces overlap
 // the surface ribbon, giving the walk edge a few real material breaks.
 const caps=[
  [2231,'M-39 5L-25-8-9-13 11-8 24-11 39 0 31 12 12 15-4 10-23 14Z','M-39 5L-25-8-9-13 11-8 24-11 14-1-7-3-20 4Z','M14-1L24-11 39 0 31 12 12 15 2 8Z'],
  [2930,'M-52 5L-34-5-16-4 7-19 24-16 42-7 52 7 29 12 8 8-15 15-43 12Z','M-52 5L-34-5-16-4 7-19 24-16 12-9 3-6-10 3-32 2Z','M24-16L42-7 52 7 29 12 8 8 19 0Z'],
  [3470,'M-27 6L-25-7-11-20 7-25 22-16 19-3 32 7 12 14-5 9-17 13Z','M-27 6L-25-7-11-20 7-25 22-16 4-12-3-3-16 2Z','M4-12L22-16 19-3 32 7 12 14-5 9 4 2Z']
 ];
 for(const[x,body,light,side]of caps){const y=C.topAt(s.t,x,s.t.y);c.save();c.translate(x,y);fill(c,body,'#586560');fill(c,light,'#87907a');fill(c,side,'#3d4c4a');fill(c,'M-33 10Q-8 7 9 12L33 12 24 17-7 15-26 18Z','#7d7152');c.restore();}
}
G.HonroStage3VectorFront={draw,surface};
})(globalThis);
