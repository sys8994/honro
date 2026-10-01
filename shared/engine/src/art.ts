import {drawWarriorProjectile,drawSwordCut,drawCirculation} from './warriorVisuals';
import {drawAimDirection,drawRedesignProjectile,drawRedesignGuide,drawGuideContinuation,drawEchoGuides,guidePrediction,drawInkGeometry,drawInkImpact,drawLightningBolt,drawQiBurst,drawFireBloom,SKILL_FX_SECONDS} from './skillVisuals';
import type { Unit, Terrain, Battle, FX, Event, Profile, ClassId } from './types';
import { THEMES, CLASSES, SKILLS } from './data';
import { Engine } from './engine';
import { WORLD_W, clamp, lerp, rng, topAt, poly, rad } from './math';
type C = CanvasRenderingContext2D;
function path(c: C, p: number[][], fill: string, stroke?: string, width = 1) { c.beginPath(); p.forEach((v, i) => i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1])); c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
} }
function line(c: C, x1: number, y1: number, x2: number, y2: number, color: string, w = 1) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = w; c.stroke(); }
function circle(c: C, x: number, y: number, r: number, fill: string, stroke?: string, w = 1) { if (r <= 0)
    return; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = w;
    c.stroke();
} }
function ellipse(c: C, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1.5;
    c.stroke();
} }
function rect(c: C, x: number, y: number, w: number, h: number, fill: string, stroke?: string) { c.fillStyle = fill; c.fillRect(x, y, w, h); if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1;
    c.strokeRect(x, y, w, h);
} }
function roundRect(c: C, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1;
    c.stroke();
} }
function txt(c: C, text: string, x: number, y: number, color: string, size = 14, align: CanvasTextAlign = 'center', weight = '500') { c.font = `${weight} ${size}px "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(text, x, y); }
function tower(c: C, x: number, y: number, w: number, h: number, color: string, theme: number, detail = true) {
    rect(c, x, y - h, w, h, color);
    path(c, [[x + w * .72, y - h], [x + w, y - h + 6], [x + w, y], [x + w * .72, y]], 'rgba(5,12,25,.17)');
    if (theme === 1 || theme === 5) {
        path(c, [[x - 9, y - h], [x + w * .5, y - h - 38], [x + w + 9, y - h]], color);
        line(c, x + w * .5, y - h - 38, x + w * .5, y - h - 58, color, 2);
    }
    else {
        for (let j = 0; j < 5; j++)
            rect(c, x + j * w / 5, y - h - 9, w / 8, 12, color);
    }
    if (detail) {
        for (let j = 0; j < Math.floor(h / 35); j++) {
            rect(c, x + w * .43, y - h + 20 + j * 36, Math.max(3, w * .1), 12, 'rgba(4,13,23,.40)');
            line(c, x + 3, y - h + 34 + j * 36, x + w - 3, y - h + 34 + j * 36, 'rgba(192,190,166,.08)');
        }
        rect(c, x + w * .32, y - 24, w * .32, 24, 'rgba(4,13,23,.27)');
    }
}
function tree(c: C, x: number, y: number, h: number, color: string, random: () => number, pine = false) { line(c, x, y, x - 2, y - h, color, 3); if (pine) {
    for (let k = 0; k < 5; k++) {
        const yy = y - h + k * h * .17;
        path(c, [[x - 2, yy - 15], [x - 20 - k * 7, yy + 30], [x + 18 + k * 7, yy + 30]], color);
    }
}
else {
    for (let i = 0; i < 7; i++) {
        const yy = y - h * .25 - random() * h * .65, dir = i % 2 ? 1 : -1;
        line(c, x, yy, x + dir * (15 + random() * 30), yy - 15 - random() * 20, color, 2);
        line(c, x + dir * 15, yy - 10, x + dir * 12, yy - 30, color, 1);
    }
} }
function background(region: number, variant: number): HTMLCanvasElement {
    const can = document.createElement('canvas');
    can.width = 1440;
    can.height = 900;
    const c = can.getContext('2d')!, p = THEMES[region], R = rng(4729 + region * 119 + variant * 13);
    const sky = c.createLinearGradient(0, 0, 0, 690);
    sky.addColorStop(0, p.sky[0]);
    sky.addColorStop(.55, p.sky[1]);
    sky.addColorStop(1, p.sky[2]);
    rect(c, 0, 0, 1440, 900, sky as unknown as string);
    const sunX = 1070 - variant * 16, sunY = 146 + variant * 12;
    const glow = c.createRadialGradient(sunX, sunY, 2, sunX, sunY, 200);
    glow.addColorStop(0, region === 5 ? 'rgba(221,221,255,.17)' : 'rgba(245,208,151,.19)');
    glow.addColorStop(1, 'rgba(240,209,153,0)');
    rect(c, 0, 0, 1440, 650, glow as unknown as string);
    if (region !== 3) {
        circle(c, sunX, sunY, region === 5 ? 35 : 52, region === 5 ? '#c9c9d7' : 'rgba(230,211,167,.48)');
        if (region === 5)
            circle(c, sunX - 14, sunY - 9, 36, p.sky[0]);
    }
    if (region === 5 || region === 4) {
        for (let i = 0; i < 110; i++)
            circle(c, R() * 1440, R() * 350, .3 + R(), `rgba(230,227,218,${.12 + R() * .5})`);
    }
    for (let layer = 0; layer < 3; layer++) {
        const y = 390 + layer * 62;
        const points: number[][] = [[0, 900], [0, y]];
        for (let x = 0; x <= 1510; x += 85) {
            points.push([x, y - (25 + R() * 110) * (layer === 0 ? 1.5 : 1)]);
        }
        points.push([1440, 900]);
        path(c, points, [p.far, p.mid, region === 3 ? '#1c2639' : '#2f444b'][layer]);
        if (layer === 0) {
            c.globalAlpha = .32;
            for (let i = 0; i < 8; i++)
                tower(c, 90 + i * 174, y - 20, 25 + R() * 25, 70 + R() * 145, p.mid, region);
            c.globalAlpha = 1;
        }
    }
    // Architecture: a distant city rather than an empty gradient.
    c.save();
    c.globalAlpha = .76;
    if (region === 0 || region === 4) {
        tower(c, 905, 494, 86, 225, p.mid, region);
        tower(c, 1085, 492, 68, 165, p.mid, region);
        rect(c, 945, 405, 173, 90, p.mid);
        for (let i = 0; i < 6; i++) {
            rect(c, 952 + i * 27, 395, 17, 15, p.mid);
            rect(c, 967 + i * 26, 438, 7, 17, 'rgba(7,19,26,.3)');
        }
        tower(c, 680, 507, 47, 132, p.mid, region);
    }
    if (region === 1) {
        tower(c, 935, 508, 95, 228, p.mid, 1);
        tower(c, 1100, 470, 53, 177, p.mid, 1);
        path(c, [[742, 435], [1210, 382], [1210, 406], [742, 458]], p.mid);
        for (let x = 785; x < 1190; x += 54)
            line(c, x, 417, x + 11, 482, p.mid, 5);
        tower(c, 330, 510, 54, 183, p.mid, 1);
    }
    if (region === 2) {
        for (let i = 0; i < 8; i++) {
            const x = 690 + i * 88, h = 60 + R() * 125;
            tower(c, x, 520, 63, h, p.mid, 2);
            line(c, x + 10, 520 - h - 15, x + 10, 520 - h - 48, p.mid, 9);
        }
        c.strokeStyle = p.mid;
        c.lineWidth = 11;
        c.beginPath();
        c.moveTo(260, 480);
        c.lineTo(260, 350);
        c.arcTo(260, 320, 320, 320, 30);
        c.lineTo(520, 320);
        c.lineTo(520, 505);
        c.stroke();
    }
    if (region === 3) {
        for (let i = 0; i < 24; i++) {
            const x = i * 65;
            path(c, [[x, 0], [x + 60, 0], [x + 45, 55 + R() * 165], [x + 25, 25]], '#222b3f');
        }
        for (let i = 0; i < 11; i++) {
            const x = R() * 1400, y = 280 + R() * 200;
            line(c, x, y, x + 40, y - 70, 'rgba(154,131,211,.25)', 3);
            line(c, x + 40, y - 70, x + 25, y - 95, 'rgba(154,131,211,.25)', 2);
        }
        for (let x = 400; x < 1340; x += 220) {
            line(c, x, 520, x + 30, 294, p.mid, 18);
            line(c, x - 10, 294, x + 185, 294, p.mid, 15);
        }
    }
    if (region === 5) {
        tower(c, 925, 512, 125, 255, p.mid, 5);
        c.strokeStyle = '#647393';
        c.lineWidth = 4;
        c.beginPath();
        c.ellipse(984, 264, 123, 64, -.55, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.ellipse(984, 264, 97, 102, .5, 0, Math.PI * 2);
        c.stroke();
        line(c, 970, 255, 1040, 133, '#647393', 3);
        tower(c, 740, 520, 70, 160, p.mid, 5);
        tower(c, 1180, 505, 68, 180, p.mid, 5);
    }
    c.restore();
    // Haze bands and scattered life.
    for (let i = 0; i < 5; i++) {
        const g = c.createLinearGradient(0, 365 + i * 38, 0, 429 + i * 38);
        g.addColorStop(0, 'rgba(200,210,199,0)');
        g.addColorStop(.6, region === 3 ? 'rgba(130,142,163,.04)' : 'rgba(201,211,193,.07)');
        g.addColorStop(1, 'rgba(200,210,199,0)');
        rect(c, 0, 365 + i * 38, 1440, 64, g as unknown as string);
    }
    for (let i = 0; i < 19; i++) {
        const x = R() * 1440;
        tree(c, x, 525 + R() * 30, 25 + R() * 70, region === 3 ? '#27303d' : '#34494a', R, region === 1);
    }
    for (let i = 0; i < 15; i++) {
        const x = R() * 1400, y = 120 + R() * 190;
        line(c, x, y, x + 4, y + 2, 'rgba(27,43,49,.25)');
        line(c, x + 4, y + 2, x + 8, y, 'rgba(27,43,49,.25)');
    }
    return can;
}
export class Renderer {
    canvas: HTMLCanvasElement;
    ctx: C;
    width = 0;
    height = 0;
    dpr = 1;
    fxs: FX[] = [];
    time = 0;
    scale = 1;
    ox = 0;
    oy = 0;
    shake = 0;
    private backgrounds = new Map<string, HTMLCanvasElement>();
    private terrainCache = new Map<string, HTMLCanvasElement>();
    private decorCache = new Map<string, HTMLCanvasElement>();
    private currentBg = '';
    private previewKey = '';
    private preview: ReturnType<Engine['predict']> | null = null;
    private cssW = 0;
    private cssH = 0;
    private R = rng(99231);
    cameraX = 450;
    cameraY = 760;
    manual = false;
    private cameraReady = false;
    viewLeft = 0;
    viewRight = 1440;
    zoom = 1;
    private baseScale = 1;
    private worldWidth = 4800;
    private worldHeight = 1520;
    private weatherX = 0;
    private wind = 0;
    private chargeColor = '#b7def5';
    private low = false;
    constructor(canvas: HTMLCanvasElement) { this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false })!; }
    resize(low = false) { const r = this.canvas.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, low ? 1 : 1.8); if (r.width === this.cssW && r.height === this.cssH && this.dpr === d)
        return; this.cssW = r.width; this.cssH = r.height; this.width = r.width; this.height = r.height; this.dpr = d; this.canvas.width = Math.round(r.width * d); this.canvas.height = Math.round(r.height * d); }
    event(e: Event) {
        if (e.type !== 'fx')
            return;
        const x = e.x || 0, y = e.y || 0, color = e.color || '#ffd5a3', size = e.size || 40, kind = e.name || 'burst';
        if (kind === 'burst' || kind === 'spark') {
            const count = kind === 'spark' ? 9 : Math.min(34, Math.round(size * .28));
            for (let i = 0; i < count; i++) {
                const a = this.R() * Math.PI * 2, v = 30 + this.R() * size * 2;
                this.fxs.push({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, age: 0, life: .4 + this.R() * .65, color, size: 1.2 + this.R() * 3.5 });
            }
            if (size > 65)
                this.shake = Math.max(this.shake, Math.min(size / 35, 4));
        }
        if (kind === 'swordCut' || kind === 'circulation' || kind === 'qiBurst' || kind === 'fireBloom' || kind === 'lightningBolt' || kind === 'inkImpact' || kind === 'inkLine' || kind === 'skillGeometry' || kind === 'ring' || kind === 'rune' || kind === 'meteor' || kind === 'slash' || kind === 'text' || kind === 'line')
            this.fxs.push({ kind: kind as FX['kind'], x, y, vx: 0, vy: kind === 'text' ? -32 : 0, age: 0, life: SKILL_FX_SECONDS[kind as keyof typeof SKILL_FX_SECONDS] ?? (kind === 'text' ? 1.35 : kind === 'meteor' ? 1.4 : .6), color, size, text: e.text, critical:e.critical, x2: e.x2, y2: e.y2 });
        if (this.fxs.length > 370)
            this.fxs.splice(0, this.fxs.length - 370);
    }

    /** Reuse the production ARCFALL projectile/fx rendering inside other shells. */
    worldFx(c: C, dt: number, paused = false, visualDt=dt) {
        for (const f of this.fxs) {
            if (!paused) {
                f.age += f.kind in SKILL_FX_SECONDS ? visualDt : dt; f.x += f.vx * dt; f.y += f.vy * dt;
                if (f.kind === 'spark') f.vy += 260 * dt;
            }
            const t=f.age/f.life, alpha=Math.max(0,1-t); c.save(); c.globalAlpha=alpha;
            if(f.kind==='swordCut')drawSwordCut(c,f.x,f.y,f.size,t,f.x2,f.y2,f.color,f.text);
            else if(f.kind==='circulation')drawCirculation(c,f.x,f.y,f.size,t);
            else if(f.kind==='qiBurst')drawQiBurst(c,f.x,f.y,f.size,t);
            else if(f.kind==='fireBloom')drawFireBloom(c,f.x,f.y,f.size,t);
            else if(f.kind==='lightningBolt')drawLightningBolt(c,f.x,f.y,f.x2??f.x,f.y2??f.y,f.size,t);
            if(f.kind==='inkLine')line(c,f.x,f.y,f.x2??f.x,f.y2??f.y,f.color,f.size);
            if(f.kind==='skillGeometry'&&f.text)drawInkGeometry(c,JSON.parse(f.text),t);
            if(f.kind==='inkImpact')drawInkImpact(c,f.x,f.y,f.size,t);
            if(f.kind==='spark') line(c,f.x,f.y,f.x-f.vx*.028,f.y-f.vy*.028,f.color,f.size);
            if(f.kind==='ring'){c.strokeStyle=f.color;c.lineWidth=2.5*(1-t)+.5;c.beginPath();c.arc(f.x,f.y,Math.max(1,f.size*(.25+.75*t)),0,Math.PI*2);c.stroke();if(t<.3)circle(c,f.x,f.y,f.size*(.2+t),f.color+'19');}
            if(f.kind==='rune') this.rune(c,f.x,f.y,f.size*(.6+.4*t),f.color,t*.4);
            if(f.kind==='text'){if(f.critical){c.font=`900 ${f.size}px "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.strokeStyle='#62241d';c.lineWidth=3;c.strokeText(f.text||'',f.x,f.y);c.shadowColor='#ef6e39';c.shadowBlur=8;}txt(c,f.text||'',f.x,f.y,f.color,f.size,'center',f.critical?'900':'700');}
            if(f.kind==='meteor'){line(c,f.x,f.y-500,f.x,f.y,'rgba(253,207,141,.32)',2);this.rune(c,f.x,f.y,55,f.color,t);}
            if(f.kind==='slash'){c.save();c.translate(f.x,f.y);c.rotate(-.35+t*.8);c.strokeStyle=f.color;c.lineWidth=8*(1-t);c.beginPath();c.arc(0,0,Math.max(10,f.size*.7),Math.PI*.85,Math.PI*1.85);c.stroke();c.restore();}
            if(f.kind==='line'&&f.x2!==undefined)this.lightning(c,f.x,f.y,f.x2,f.y2??f.y,f.color,f.size||2,f.age*4);
            else if(f.kind==='line'){c.strokeStyle=f.color;c.lineWidth=2;c.beginPath();c.moveTo(f.x,f.y);for(let i=1;i<7;i++)c.lineTo(f.x+Math.sin(i*13+t)*14,f.y-i*13);c.stroke();}
            c.restore();
        }
        this.fxs=this.fxs.filter(f=>f.age<f.life);
    }
    /** Production guide: dotted collision path and faint solid continuation beyond units. */
    predictionGuide(c:C, engine:Engine, active:Unit, skillId:string, power:number, charging:boolean, throughUnits=false) {
        const sk=SKILLS[skillId]||SKILLS[active.loadout[0]]; if(!sk||sk.passive)return;
        const guidePower=charging?power:(active.lastPower??power??.5);
        const zoom=Math.max(.12,this.scale||1);
        drawAimDirection(c,engine,active,sk,guidePower,charging,this.time,zoom);
        drawGuideContinuation(c,engine,active,sk,guidePower,zoom);
        if(drawRedesignGuide(c,engine,active,sk,guidePower,zoom))return;
        const pr=guidePrediction(engine,active,sk,guidePower);
        if(!pr)return;
        drawEchoGuides(c,engine,active,sk,guidePower,zoom,pr);
        c.save();c.globalAlpha=.65;
        pr.points.forEach((v,i)=>{if(i%2===0)circle(c,v.x,v.y,1.6/zoom,sk.color);});
        const r=engine.effective(sk,active).radius;
        c.globalAlpha=.62;c.setLineDash([4/zoom,5/zoom]);c.lineWidth=1.35/zoom;
        if(r){c.strokeStyle=sk.color;c.beginPath();c.arc(pr.x,pr.y,r,0,Math.PI*2);c.stroke();c.globalAlpha=.16;circle(c,pr.x,pr.y,r,sk.color);}
        c.setLineDash([]);c.globalAlpha=.72;line(c,pr.x-8,pr.y,pr.x+8,pr.y,sk.color,1.2);line(c,pr.x,pr.y-8,pr.x,pr.y+8,sk.color,1.2);
        if(sk.mode.startsWith('summon')||sk.mode==='spiritConverge'){
            c.globalAlpha=.7;c.setLineDash([3/zoom,5/zoom]);c.lineWidth=1.35/zoom;c.strokeStyle=sk.color;c.beginPath();c.arc(pr.x,pr.y,14/zoom,0,Math.PI*2);c.stroke();c.setLineDash([]);
        }
        if(pr.apex&&(sk.mode==='cluster'||sk.mode==='rain'||sk.mode==='seekRain'))this.rune(c,pr.apex.x,pr.apex.y,12,sk.color);
        c.restore();
    }
    bg(region: number, variant = 0) { const key = region + ':' + variant; let c = this.backgrounds.get(key); if (!c) {
        c = background(region, variant);
        // Bake atmospheric perspective once; keep gameplay geometry/sprites unfiltered.
        const a=c.getContext('2d')!, im=a.getImageData(0,0,c.width,c.height), data=im.data;
        for(let i=0;i<data.length;i+=4){const l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
            data[i]=(.32*data[i]+.68*l)*.80+53*.20;
            data[i+1]=(.32*data[i+1]+.68*l)*.80+69*.20;
            data[i+2]=(.32*data[i+2]+.68*l)*.80+82*.20;}
        a.putImageData(im,0,0);
        this.backgrounds.set(key, c);
        if (this.backgrounds.size > 5)
            this.backgrounds.delete(this.backgrounds.keys().next().value!);
    } return c; }
    backdrop(region = 0, variant = 0) {
        this.resize();
        const c = this.ctx;
        this.time += 1 / 60;
        c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        const w = this.width, h = this.height;
        const img = this.bg(region, variant);
        const s = Math.max(w / 1440, h / 770);
        c.drawImage(img, (w - 1440 * s) / 2, h - 770 * s, 1440 * s, 900 * s);
        const g = c.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, 'rgba(6,15,24,.88)');
        g.addColorStop(.5, 'rgba(6,15,24,.42)');
        g.addColorStop(1, 'rgba(6,15,24,.05)');
        rect(c, 0, 0, w, h, g as unknown as string);
        const ground = h * .88;
        for (let j = 0; j < 4; j++) {
            const x = w * .65 + j * 43;
            const fake = { cls: (['mage', 'archer', 'knight', 'occultist'] as ClassId[])[j], role: (['mage', 'archer', 'knight', 'occultist'] as ClassId[])[j], side: 0, x: 0, y: 0, h: 74, r: 17, angle: 70, facing: -1, hurt: 0, anim: 0, airborne: false, dead: false } as Unit;
            c.save();
            c.translate(x, ground + (j === 1 ? 5 : 0));
            c.scale(1.35, 1.35);
            this.human(c, fake, false, 0);
            c.restore();
        }
        // Floating ember motes, quiet rather than a particle wall.
        c.globalAlpha = .45;
        for (let i = 0; i < 24; i++) {
            const x = (i * 149.3 + Math.sin(this.time * .18 + i) * 22) % w, y = (h - (this.time * (4 + i % 3) + i * 61) % (h + 30));
            circle(c, x, y, .8 + i % 2 * .4, '#d9bf91');
        }
        c.globalAlpha = 1;
    }
    render(engine: Engine, dt: number, selected: string, power: number, charging: boolean, settings: Profile['settings'], paused = false) {
        this.resize(settings.quality === 'low');
        this.time += dt;
        const c = this.ctx, w = this.width, h = this.height;
        if (!w || !h)
            return;
        const b = engine.b, region = engine.stage.region, p = THEMES[region];
        c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        rect(c, 0, 0, w, h, p.sky[0]);
        this.low = settings.quality === 'low';
        this.wind = b.wind;
        this.weatherX += b.wind * dt;
        this.worldWidth = b.width;this.worldHeight=b.height;
        this.baseScale = w / (w < 600 ? 770 : 1120);
        this.scale = this.baseScale * this.zoom;
        const s = this.scale, vw = w / s, vh = h / s;
        const followed = b.phase === 'flight' ? b.projectiles.find(p => !p.child) || b.projectiles[0] : undefined;
        const active = engine.active;
        const player = b.side === 0 ? active : engine.alive(0)[0];
        if (!this.manual) {
            const reviewing=(b.phase==='review'||b.phase==='summon')&&b.reviewFocus;
            const target = reviewing || followed || active || player;
            const tx = target ? target.x + (followed ? Math.sign(followed.vx) * 70 : reviewing ? 0 : (active?.facing || 1) * 190) : 450, ty = followed ? followed.y : (target?.y || 970) - vh * .15;
            if (!this.cameraReady) {
                this.cameraX = tx;
                this.cameraY = ty;
                this.cameraReady = true;
            }
            const f = 1 - Math.exp(-dt * (followed ? 6 : 8));
            this.cameraX = lerp(this.cameraX, tx, f);
            this.cameraY = lerp(this.cameraY, ty, f);
        }
        this.cameraX = vw >= b.width ? b.width * .5 : clamp(this.cameraX, vw * .5, b.width - vw * .5);
        this.cameraY = vh >= b.height+40 ? b.height * .5 : clamp(this.cameraY, -700 + vh * .5, b.height - vh * .18);
        this.ox = w * .5 - this.cameraX * s;
        this.oy = h * .5 - this.cameraY * s;
        this.viewLeft = this.cameraX - vw * .5 - 160;
        this.viewRight = this.cameraX + vw * .5 + 160;
        const bg = this.bg(region, engine.stage.local);
        const bgscale = Math.max(w / 1200, h / 720);
        const parallax = (this.cameraX / b.width - .5) * 80;
        c.drawImage(bg, (w - bgscale * 1440) / 2 - parallax, h - 690 * bgscale, 1440 * bgscale, 900 * bgscale);
        const haze = c.createLinearGradient(0, h * .62, 0, h);
        haze.addColorStop(0, 'rgba(15,23,32,0)');
        haze.addColorStop(1, 'rgba(12,19,29,.4)');
        rect(c, 0, 0, w, h, haze as unknown as string);
        this.weather(c, w, h, region, b.wind);
        c.save();
        c.translate(this.ox, this.oy);
        c.scale(s, s);
        if (settings.shake && this.shake > .15 && !paused) {
            c.translate(Math.sin(this.time * 71) * this.shake, Math.cos(this.time * 83) * this.shake * .6);
            this.shake *= .86;
        }
        else
            this.shake = 0;
        if(b.vertical){
            c.save();c.globalAlpha=.21;
            const y0=Math.max(0,Math.floor((this.cameraY-vh*.6)/240)*240),y1=Math.min(b.height,this.cameraY+vh*.7);
            for(let yy=y0;yy<y1;yy+=240){
                for(let xx=140;xx<b.width;xx+=540){rect(c,xx,yy,30,240,'#758697');rect(c,xx+6,yy+10,5,220,'#b1a88b');
                    c.strokeStyle='#879d9b';c.lineWidth=4;c.beginPath();c.arc(xx+270,yy+150,205,Math.PI,Math.PI*2);c.stroke();}
            }
            c.restore();
        }
        for (const d of b.drafts) {
            if (d.device && !b.terrain.some(t => t.id === d.device && !t.broken))
                continue;
            const grad = c.createLinearGradient(d.x, 0, d.x + d.w, 0);
            grad.addColorStop(0, 'rgba(190,223,221,0)');
            grad.addColorStop(.5, 'rgba(190,223,221,.045)');
            grad.addColorStop(1, 'rgba(190,223,221,0)');
            rect(c, d.x, d.y, d.w, d.h, grad as unknown as string);
            for (let i = 0; i < 9; i++) {
                const x = d.x + 12 + (i * 23) % d.w, y = d.y + ((i * 61 - this.time * 53) % d.h + d.h) % d.h;
                c.strokeStyle = 'rgba(193,230,227,.30)';
                c.lineWidth = 1;
                c.beginPath();
                c.moveTo(x, y + 36);
                c.quadraticCurveTo(x + 16, y + 19, x + 6, y);
                c.stroke();
            }
        }
        c.save();
        for (const d of b.decor)
            if (d.x > this.viewLeft - 250 && d.x < this.viewRight + 250 && d.y > this.cameraY-vh*.5-400 && d.y < this.cameraY+vh*.5+450)
                {c.globalAlpha=d.kind==='torch'&&d.variant>=100?1:.53;this.decoration(c, d, region, b);}
        c.restore();
        for (const t of b.terrain)
            if (!t.broken && t.x + t.w > this.viewLeft && t.x < this.viewRight && t.y+t.h > this.cameraY-vh*.5-100 && t.y<this.cameraY+vh*.5+150)
                this.terrain(c, t, region, b.round);
        for (const water of b.waters) {
            if (water.x + water.w < this.viewLeft || water.x > this.viewRight)
                continue;
            const lava = water.kind === 'lava';
            const frozen = water.frozen >= b.round;
            c.save();
            const col = lava ? 'rgba(240,103,54,.63)' : frozen ? 'rgba(154,214,224,.39)' : 'rgba(88,164,171,.30)';
            rect(c, water.x, water.y, water.w, Math.max(10, water.depth), col);
            line(c, water.x, water.y, water.x + water.w, water.y, lava ? '#ffc081' : frozen ? '#a5dce5' : '#7eb9b6', 2);
            for (let i = 0; i < water.w / 26; i++) {
                const x = water.x + i * 27, y = water.y + 4 + (i * 13) % 35;
                if (frozen) {
                    line(c, x, y, x + 13, y + 10, 'rgba(202,237,241,.4)');
                    line(c, x + 13, y + 10, x + 25, y + 3, 'rgba(202,237,241,.3)');
                }
                else
                    line(c, x + Math.sin(this.time + i) * 3, y, x + 15 + Math.cos(this.time + i) * 4, y, lava ? 'rgba(255,207,128,.6)' : 'rgba(165,215,211,.28)');
            }
            c.restore();
        }
        for (const t of b.terrain)
            if (!t.broken && t.moving) {
                const m = t.moving;
                const nx = m.x + (b.round % 2 === 0 ? 0 : m.dx), ny = m.y + (b.round % 2 === 0 ? 0 : m.dy);
                c.save();
                c.setLineDash([8, 7]);
                c.strokeStyle = 'rgba(205,221,219,.3)';
                c.strokeRect(nx, ny, t.w, t.h);
                c.restore();
            }
        for (const f of b.fields)
            if (f.x + f.radius > this.viewLeft && f.x - f.radius < this.viewRight)
                this.field(c, f);
        for (const z of b.zones) {
            const cc = z.kind === 'frost' ? '#a5dce5' : z.kind === 'fire' ? '#b9a5ed' : z.kind === 'delay' ? '#cbb5f2' : '#efa1a1';
            c.save();
            c.globalAlpha = .15 + Math.sin(this.time * 3) * .025;
            ellipse(c, z.x, z.y, Math.max(18, z.radius), z.kind === 'fire' ? 13 : 18, cc);
            c.globalAlpha = .8;
            c.setLineDash(z.kind === 'delay' || z.kind === 'bomb' ? [5, 4] : [1, 4]);
            c.strokeStyle = cc;
            c.lineWidth = 1.5;
            c.beginPath();
            c.ellipse(z.x, z.y, z.radius, 18, 0, 0, Math.PI * 2);
            c.stroke();
            c.restore();
            if (z.kind === 'delay' || z.kind === 'bomb') {
                this.rune(c, z.x, z.y, 28, cc, this.time * .3);
                txt(c, '◷', z.x, z.y - 29, '#f0b4ad', 20);
            }
            else if (z.kind === 'fire') {
                for (let i = 0; i < 7; i++) {
                    const xx = z.x + (i - 3) * z.radius / 4, hh = 14 + Math.sin(this.time * 5 + i) * 7;
                    line(c, xx - 5, z.y, xx + 3, z.y - hh * .5, 'rgba(208,186,255,.65)', 1.5);
                    line(c, xx + 3, z.y - hh * .5, xx - 2, z.y - hh * .6, 'rgba(208,186,255,.65)', 1.5);
                    line(c, xx - 2, z.y - hh * .6, xx + 5, z.y - hh, 'rgba(208,186,255,.65)', 1.5);
                }
            }
        }
        if (active && b.phase === 'aim') {
            const sk = SKILLS[selected] || SKILLS[active.loadout[0]];
            if(sk)drawAimDirection(c,engine,active,sk,power,charging,this.time,this.scale);
            if (settings.assist || b.mode === 'practice') {
                // The guide is a *prediction* for the currently selected shot, not a replay of
                // the previous projectile. While charging it tracks live charge power; while idle
                // it stays visible at the unit's last committed power so the player can aim first.
                const guidePower = charging ? power : (active.lastPower || power || .5);
                const key = [b.shot, b.sceneVersion, b.physics?.revision||0, active.id, active.x.toFixed(1), active.y.toFixed(1), active.angle.toFixed(1), guidePower.toFixed(2), b.wind, sk.id].join(':');
                if (key !== this.previewKey) {
                    this.previewKey = key;
                    this.preview = engine.predict(active, sk, active.angle, guidePower);
                }
                const pr = this.preview;
                if (pr) {
                    c.save();
                    c.globalAlpha = .65;
                    pr.points.forEach((v, i) => { if (i % 2 === 0)
                        circle(c, v.x, v.y, 1.6, sk.color); });
                    c.globalAlpha = .55;
                    const r = engine.effective(sk, active).radius;
                    c.setLineDash([4, 5]);
                    if (r) {
                        c.strokeStyle = sk.color;
                        c.beginPath();
                        c.arc(pr.x, pr.y, r, 0, Math.PI * 2);
                        c.stroke();
                    }
                    line(c, pr.x - 8, pr.y, pr.x + 8, pr.y, sk.color, 1.2);
                    line(c, pr.x, pr.y - 8, pr.x, pr.y + 8, sk.color, 1.2);
                    if (pr.apex && (sk.mode === 'cluster' || sk.mode === 'rain')) {
                        this.rune(c, pr.apex.x, pr.apex.y, 12, sk.color);
                    }
                    c.restore();
                }
            }
        }
        this.chargeColor = SKILLS[selected]?.color || '#b7def5';
        for (const u of [...b.units].filter(u => u.x > this.viewLeft && u.x < this.viewRight && u.y>this.cameraY-vh*.5-220 && u.y<this.cameraY+vh*.5+260).sort((a, d) => a.y - d.y))
            this.unit(c, u, u.id === b.active && !['won','lost'].includes(b.phase), b.round, charging && u.id === b.active ? power : 0);
        for (const pjt of b.projectiles) {
            if (pjt.body) {
                this.bodyTrail(c, pjt);
                if (pjt.mode === 'recall')
                    this.rune(c, pjt.returnX, pjt.returnY, 27, '#cabbed', this.time * .2);
                continue;
            }
            this.projectile(c, pjt);
        }
        if (active && b.phase === 'aim' && active.moveTarget !== undefined) {
            const sf = engine.surface(active.moveTarget);
            const yy = sf?.y || active.y;
            this.rune(c, active.moveTarget, yy, 22, '#cce1c0', this.time);
            c.save();
            c.setLineDash([5, 8]);
            line(c, active.x, active.y + 5, active.moveTarget, yy + 5, 'rgba(199,220,183,.4)', 2);
            c.restore();
        }
        if(b.phase==='review')for(const [id,damage] of Object.entries(b.reviewDamage||{})){
            const u=engine.unit(id);if(!u||damage<=0)continue;
            c.save();c.translate(u.x,u.y-u.h-85);const k=clamp(1/s,.85,1.8);c.scale(k,k);
            roundRect(c,-42,-20,84,30,8,'#17232de8','#da9b8955');txt(c,'−'+Math.round(damage),0,0,'#ffd6bd',20,'center','800');c.restore();
        }
        // World-space feedback.
        for (const f of this.fxs) {
            if (!paused) {
                f.age += dt;
                f.x += f.vx * dt;
                f.y += f.vy * dt;
                if (f.kind === 'spark')
                    f.vy += 260 * dt;
            }
            const t = f.age / f.life, alpha = Math.max(0, 1 - t);
            c.save();
            c.globalAlpha = alpha;
            if(f.kind==='skillGeometry'&&f.text)drawInkGeometry(c,JSON.parse(f.text),t);
            if(f.kind==='inkImpact')drawInkImpact(c,f.x,f.y,f.size,t);
            if(f.kind==='swordCut')drawSwordCut(c,f.x,f.y,f.size,t,f.x2,f.y2,f.color,f.text);
            else if(f.kind==='circulation')drawCirculation(c,f.x,f.y,f.size,t);
            else if(f.kind==='qiBurst')drawQiBurst(c,f.x,f.y,f.size,t);
            else if(f.kind==='fireBloom')drawFireBloom(c,f.x,f.y,f.size,t);
            else if(f.kind==='lightningBolt')drawLightningBolt(c,f.x,f.y,f.x2??f.x,f.y2??f.y,f.size,t);
            if (f.kind === 'spark') {
                line(c, f.x, f.y, f.x - f.vx * .028, f.y - f.vy * .028, f.color, f.size);
            }
            if (f.kind === 'ring') {
                c.strokeStyle = f.color;
                c.lineWidth = 2.5 * (1 - t) + .5;
                c.beginPath();
                c.arc(f.x, f.y, Math.max(1, f.size * (.25 + .75 * t)), 0, Math.PI * 2);
                c.stroke();
                if (t < .3)
                    circle(c, f.x, f.y, f.size * (.2 + t), f.color + '19');
            }
            if (f.kind === 'rune')
                this.rune(c, f.x, f.y, f.size * (.6 + .4 * t), f.color, t * .4);
            if (f.kind === 'text') {
                if(f.critical){c.strokeStyle='#62241d';c.lineWidth=3;c.font=`900 ${f.size}px "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.strokeText(f.text||'',f.x,f.y);}txt(c, f.text || '', f.x, f.y, f.color, f.size, 'center', f.critical?'900':'700');
            }
            if (f.kind === 'meteor') {
                line(c, f.x, f.y - 500, f.x, f.y, 'rgba(253,207,141,.32)', 2);
                this.rune(c, f.x, f.y, 55, f.color, t);
            }
            if (f.kind === 'slash') {
                c.save();
                c.translate(f.x, f.y);
                c.rotate(-.35 + t * .8);
                c.strokeStyle = f.color;
                c.lineWidth = 8 * (1 - t);
                c.beginPath();
                c.arc(0, 0, Math.max(10, f.size * .7), Math.PI * .85, Math.PI * 1.85);
                c.stroke();
                c.restore();
            }
            if (f.kind === 'line' && f.x2 !== undefined) {
                this.lightning(c, f.x, f.y, f.x2, f.y2 ?? f.y, f.color, f.size || 2, f.age * 4);
            }
            else if (f.kind === 'line') {
                c.strokeStyle = f.color;
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(f.x, f.y);
                for (let i = 1; i < 7; i++)
                    c.lineTo(f.x + Math.sin(i * 13 + t) * 14, f.y - i * 13);
                c.stroke();
            }
            c.restore();
        }
        this.fxs = this.fxs.filter(f => f.age < f.life);
        c.restore();
        // Vignette and subtle edge framing.
        const v = c.createLinearGradient(0, 0, 0, h);
        v.addColorStop(0, 'rgba(8,16,26,.22)');
        v.addColorStop(.18, 'rgba(8,16,26,0)');
        v.addColorStop(.87, 'rgba(8,16,26,0)');
        v.addColorStop(1, 'rgba(8,16,26,.32)');
        rect(c, 0, 0, w, h, v as unknown as string);
        if (b.phase === 'flight' && b.projectiles.some(p => p.y * this.scale + this.oy < 8)) {
            txt(c, '↑  투사체 비행 중', w / 2, 20, '#f0d4a2', 13);
        }
    }
    zoomAt(factor: number, x: number, y: number) { if (!Number.isFinite(factor) || factor <= 0)
        return; const world = this.toWorld(x, y), min = Math.min(.25, (this.width / this.baseScale) / (this.worldWidth + 60), (this.height/this.baseScale)/(this.worldHeight+100)); this.zoom = clamp(this.zoom * factor, min, 2.7); this.scale = this.baseScale * this.zoom; this.cameraX = world.x - (x - this.width * .5) / this.scale; this.cameraY = world.y - (y - this.height * .5) / this.scale; this.ox = this.width * .5 - this.cameraX * this.scale; this.oy = this.height * .5 - this.cameraY * this.scale; this.manual = true; }
    follow() { this.manual = false; }
    pan(dx: number, dy: number) { this.manual = true; this.cameraX -= dx / this.scale; this.cameraY -= dy / this.scale; this.ox = this.width * .5 - this.cameraX * this.scale; this.oy = this.height * .5 - this.cameraY * this.scale; }
    lookAt(x: number, y: number) { this.manual = true; this.cameraX = x; this.cameraY = y; this.cameraReady = true; this.ox = this.width * .5 - this.cameraX * this.scale; this.oy = this.height * .5 - this.cameraY * this.scale; }
    decoration(c: C, d: Battle['decor'][number], region: number, b: Battle) {
        c.save();
        c.translate(d.x, d.y);
        c.scale(d.size, d.size);
        const v = d.variant, rr = rng(v * 914 + d.x), p = THEMES[region];
        if (d.kind === 'tree' || d.kind === 'pine') {
            const key = d.kind + ':' + v;
            let sprite = this.decorCache.get(key);
            if (!sprite) {
                sprite = document.createElement('canvas');
                sprite.width = 290;
                sprite.height = 385;
                const a = sprite.getContext('2d')!;
                a.translate(145, 370);
                const random = rng(5147 + v * 871), pine = d.kind === 'pine', h = 190 + v * 17;
                path(a, [[-20, 3], [-7, -h * .5], [-9, -h], [-2, -h - 7], [7, -h * .47], [19, 3], [5, -7], [-5, -9]], '#3c4840', '#263b35', 1.1);
                line(a, -4, -h * .75, -1, -10, '#83907a', 1.1);
                for (let k = 0; k < 12; k++) {
                    const y = -h * .24 - k * h * .058, dir = k % 2 ? 1 : -1, x = dir * (22 + random() * 40);
                    line(a, -3, y, x, y - 30 - random() * 27, '#465447', 5 - k * .23);
                    line(a, x, y - 40, x + dir * 15, y - 60, '#4b5a4b', 1.5);
                }
                if (pine) {
                    for (let k = 0; k < 8; k++) {
                        const y = -h + k * h * .105, sp = 14 + k * 8.5, pts = [[-3, y - 29]];
                        for (let i = 0; i < 8; i++)
                            pts.push([-sp + i * sp / 4, y + 26 + random() * 14]);
                        pts.push([-3, y - 29]);
                        path(a, pts, ['#294c48', '#33574e', '#416551', '#365a4e'][k % 4]);
                        for (let j = 0; j < 16; j++) {
                            const x = (random() - .5) * sp * 1.85;
                            line(a, x, y + 12 + random() * 20, x + 7, y + 15 + random() * 20, '#75907744', 1);
                        }
                    }
                }
                else {
                    for (let k = 0; k < 23; k++) {
                        const cx = (random() - .5) * 158, cy = -h * .61 - random() * h * .34, r = 16 + random() * 25, pts: number[][] = [];
                        for (let i = 0; i < 14; i++) {
                            const ang = i * Math.PI / 7, rr = r * (.7 + random() * .35);
                            pts.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * .70]);
                        }
                        path(a, pts, ['#304f43', '#3b5b48', '#49654b', '#526f51', '#3a5948'][k % 5]);
                        for (let j = 0; j < 12; j++) {
                            const x = cx + (random() - .5) * r * 1.7, y = cy + (random() - .5) * r * .9;
                            line(a, x, y, x + 3 + random() * 5, y - 2, '#9ba68033', 1.2);
                        }
                    }
                }
                for (let i = 0; i < 11; i++)
                    line(a, -23 + i * 4, 0, -25 + i * 4, -4 - random() * 11, '#849372', 1);
                this.decorCache.set(key, sprite);
            }
            c.drawImage(sprite, -145, -370);
        }
        else if (d.kind === 'waterfall') {
            const g = c.createLinearGradient(0, 0, 0, 270);
            g.addColorStop(0, 'rgba(172,219,224,.50)');
            g.addColorStop(.8, 'rgba(123,196,213,.28)');
            g.addColorStop(1, 'rgba(134,195,203,0)');
            rect(c, -21, 0, 42, 300, g as unknown as string);
            for (let i = 0; i < 8; i++) {
                const y = ((this.time * 115 + i * 41) % 310);
                line(c, -18 + i * 5, y, -17 + i * 5, y + 27, 'rgba(206,236,236,.55)', 1.6);
            }
            for (let i = 0; i < 5; i++)
                ellipse(c, (i - 2) * 15, 267 + Math.sin(this.time + i) * 4, 21, 8, 'rgba(170,213,218,.12)');
        }
        else if (d.kind === 'house') {
            const w = 95 + v % 3 * 13, h = 100 + v % 2 * 40;
            rect(c, -w / 2, -h, w, h, '#4f6362', '#82918a');
            path(c, [[-w / 2 - 10, -h], [0, -h - 50], [w / 2 + 10, -h]], '#465860', '#9bada2', 2);
            for (let x = -w * .3; x <= w * .3; x += w * .3) {
                rect(c, x - 8, -h + 28, 16, 28, '#223a41', '#8c9f95');
                line(c, x, -h + 28, x, -h + 56, '#87958b');
            }
            rect(c, -12, -42, 24, 42, '#263b3c');
            line(c, -w / 2, -12, w / 2, -12, '#899a8c', 2);
        }
        else if (d.kind === 'spire') {
            tower(c, -29, 0, 58, 160 + v % 3 * 30, p.mid, region, true);
            line(c, 0, -185, 0, -235, p.top, 2);
            this.rune(c, 0, -208, 28, p.accent + 'aa', this.time * .07);
        }
        else if (d.kind === 'arch') {
            rect(c, -98, -120, 27, 120, '#505d66', '#85948e');
            rect(c, 71, -120, 27, 120, '#505d66', '#85948e');
            c.strokeStyle = '#667580';
            c.lineWidth = 27;
            c.beginPath();
            c.arc(0, -119, 85, Math.PI, 0);
            c.stroke();
            c.strokeStyle = '#a4aaa1';
            c.lineWidth = 2;
            c.beginPath();
            c.arc(0, -119, 100, Math.PI, 0);
            c.stroke();
        }
        else if (d.kind === 'banner') {
            line(c, 0, 0, 0, -125, '#929685', 3);
            path(c, [[1, -124], [46, -116 + Math.sin(this.time * 2 + v) * 5], [38, -69], [1, -78]], p.flag, '#b1a18c');
            this.rune(c, 18, -101, 10, p.accent);
        }
        else if (d.kind === 'crystal') {
            for (let i = 0; i < 4; i++) {
                const x = (i - 1.5) * 16, hh = 38 + rr() * 55;
                path(c, [[x - 10, 0], [x - 9, -hh], [x, -hh - 18], [x + 10, -hh + 2], [x + 8, 0]], '#675777', '#baa2c7', 1);
                line(c, x, -hh - 17, x, 0, '#d1b0dd', 1);
            }
        }
        else if (d.kind === 'torch') {
            const camp = v >= 100, used = camp && b.awardIds.includes(`camp:${v - 100}`);
            if (camp) {
                line(c, -15, 0, 12, -9, '#775c43', 7);
                line(c, 15, 0, -12, -9, '#95816a', 6);
                const glow = c.createRadialGradient(0, -10, 3, 0, -10, 64);
                glow.addColorStop(0, used ? 'rgba(158,205,149,.19)' : 'rgba(254,183,97,.20)');
                glow.addColorStop(1, 'rgba(241,164,83,0)');
                circle(c, 0, -10, 64, glow as unknown as string);
            }
            else
                line(c, 0, 0, 0, -54, '#8d7760', 5);
            const y = camp ? -5 : -52;
            for (let i = 0; i < 3; i++) {
                const hh = 19 + Math.sin(this.time * 6 + i) * 6;
                path(c, [[-10 + i * 5, y], [i * 3 - 8, y - hh], [10 - i * 2, y]], used ? '#b2dca7' : ['#e8a768', '#f2c184', '#db7650'][i]);
            }
        }
        else {
            tower(c, -22, 0, 44, 72 + v % 3 * 22, '#5e6d67', 0);
            for (let i = 0; i < 5; i++)
                rect(c, -44 + i * 19, -5 - rr() * 12, 15, 12, '#66746d');
        }
        c.restore();
    }
    terrain(c: C, t: Terrain, region: number, round: number) {
        const p = THEMES[region];
        if (t.mat === 'barrel') {
            c.save();
            c.translate(t.x, t.y);
            roundRect(c, 1, 0, t.w - 2, t.h, 7, '#795344', '#b18763');
            for (let i = 1; i < 4; i++)
                line(c, t.w * i / 4, 4, t.w * i / 4, t.h - 4, '#a67c54', 1);
            rect(c, -2, 8, t.w + 4, 4, '#38424a');
            rect(c, -2, t.h - 12, t.w + 4, 4, '#38424a');
            circle(c, t.w / 2, t.h / 2, 5, '#d8a565');
            c.restore();
            return;
        }
        if (t.mat === 'device') {
            c.save();
            c.translate(t.x + t.w / 2, t.y + t.h);
            rect(c, -t.w * .7, -9, t.w * 1.4, 9, '#444f5c', '#8d9caa');
            path(c, [[-13, -9], [-9, -48], [0, -65], [9, -48], [13, -9]], '#304857', '#9ebeba');
            const col = t.device === 'ward' ? '#d1b5e9' : t.device === 'wind' ? '#b6dbda' : '#abd0b2';
            path(c, [[0, -54], [7, -36], [0, -23], [-7, -36]], col);
            c.globalAlpha = .2 + .08 * Math.sin(this.time * 2);
            circle(c, 0, -37, 21, col);
            c.globalAlpha = 1;
            this.rune(c, 0, -37, 21, col, this.time * .5);
            c.restore();
            return;
        }
        const key = [region, t.id, t.x, t.y, t.w, t.h, t.mat, t.slope, t.hp < t.maxHp * .5].join(':');
        let tex = this.terrainCache.get(key);
        if (!tex) {
            const pad = 5, minY = Math.min(0, t.slope || 0) - 12, ww = Math.ceil(t.w + pad * 2), hh = Math.ceil(t.h - minY + pad * 2);
            tex = document.createElement('canvas');
            tex.width = ww;
            tex.height = hh;
            const a = tex.getContext('2d')!;
            a.translate(pad, pad - minY);
            const pts = poly({ ...t, x: 0, y: 0 }).map(v => [v.x, v.y]);
            const grad = a.createLinearGradient(0, 0, 0, Math.min(t.h, 200));
            const isWood = t.mat === 'wood' || t.mat === 'support', isIce = t.mat === 'ice';
            grad.addColorStop(0, isWood ? '#8b7156' : isIce ? '#739aa9' : t.mat === 'metal' ? '#66747a' : t.mat === 'rock' && region === 0 ? '#586451' : p.stone);
            grad.addColorStop(1, isWood ? '#493f39' : isIce ? '#445e75' : t.mat === 'rock' && region === 0 ? '#303d38' : '#283946');
            path(a, pts, grad as unknown as string, t.mat === 'rock' ? undefined : '#192a35', 2);
            a.save();
            a.beginPath();
            pts.forEach((v, i) => i ? a.lineTo(v[0], v[1]) : a.moveTo(v[0], v[1]));
            a.closePath();
            a.clip();
            const R = rng(t.id.split('').reduce((s, x) => s + x.charCodeAt(0), 0) * 193 + t.w);
            if (isWood) {
                for (let i = 0; i < t.w; i += 15)
                    line(a, i, 0, i + (R() - .5) * 8, t.h, 'rgba(33,29,28,.42)', 2);
                for (let y = 9; y < t.h; y += 35)
                    rect(a, 0, y, t.w, 5, '#424647');
                if (t.mat === 'support') {
                    line(a, 1, 10, t.w - 1, t.h - 10, '#b19570', 3);
                    line(a, t.w - 1, 10, 1, t.h - 10, '#514e42', 3);
                }
            }
            else if (isIce) {
                for (let i = 0; i < 8; i++) {
                    const x = R() * t.w, y = R() * t.h;
                    line(a, x, y, x + 20, y + 35, 'rgba(211,247,254,.5)', 1);
                    line(a, x + 20, y + 35, x + 7, y + 56, 'rgba(200,239,253,.3)', 1);
                }
                path(a, [[0, 0], [t.w * .28, 0], [t.w * .8, t.h], [t.w * .5, t.h]], 'rgba(191,231,244,.17)');
            }
            else if (t.mat === 'metal') {
                for (let x = 9; x < t.w; x += 35) {
                    circle(a, x, 9, 2.4, '#c0c8c6');
                    circle(a, x, Math.min(t.h - 9, 37), 2.4, '#374957');
                }
                for (let y = 28; y < t.h; y += 42)
                    line(a, 2, y, t.w - 2, y, 'rgba(29,43,53,.4)', 2);
            }
            else if (t.mat === 'rock') {
                for (let y = Math.min(0, t.slope || 0) - 20; y < t.h; y += 40 + R() * 20) {
                    const pts: number[][] = [[0, y]];
                    for (let x = 0; x < t.w + 30; x += 30)
                        pts.push([x, y + Math.sin(x * .017 + y * .03) * 6 + R() * 9]);
                    a.beginPath();
                    pts.forEach((v, i) => i ? a.lineTo(v[0], v[1]) : a.moveTo(v[0], v[1]));
                    a.strokeStyle = 'rgba(14,29,33,.22)';
                    a.lineWidth = 2;
                    a.stroke();
                }
                for (let i = 0; i < t.w * t.h / 160; i++) {
                    const x = R() * t.w, y = Math.min(0, t.slope || 0) + R() * (t.h - Math.min(0, t.slope || 0));
                    line(a, x, y, x + 2 + R() * 5, y - R() * 2, 'rgba(172,179,158,.11)', .7);
                }
                for (let i = 0; i < Math.ceil(t.w / 70); i++) {
                    const x = R() * t.w, y = 25 + R() * 200;
                    path(a, [[x, y], [x + 22, y - 8], [x + 43, y + 4], [x + 39, y + 24], [x + 10, y + 21]], 'rgba(15,30,35,.11)');
                    line(a, x, y, x + 22, y - 8, 'rgba(187,195,173,.10)', 1);
                }
            }
            else {
                let row = 0;
                for (let y = 14; y < Math.min(320, t.h); y += 31) {
                    line(a, 0, y, t.w, y, 'rgba(18,30,39,.25)', 1.5);
                    for (let x = -40 + (row % 2) * 28; x < t.w; x += 59) {
                        line(a, x, y, x + 4, y + 30, 'rgba(18,30,39,.28)', 1.4);
                        if (R() > .55)
                            line(a, x + 5, y + 6, x + 35, y + 8, 'rgba(174,190,190,.08)', 1);
                    }
                    row++;
                }
                for (let i = 0; i < Math.min(100, t.w * t.h / 550); i++) {
                    const x = R() * t.w, y = R() * Math.min(t.h, 220);
                    line(a, x, y, x + 7 + R() * 17, y - 4 + R() * 8, 'rgba(172,190,194,.12)', .8);
                }
            }
            a.restore();
            line(a, 0, 0, t.w, t.slope || 0, isIce ? '#b8e6ed' : isWood ? '#bf9b73' : t.mat === 'metal' ? '#c4d3d9' : p.top, 3);
            line(a, 0, 4, t.w, 4 + (t.slope || 0), 'rgba(11,24,29,.36)', 1.5);
            if (t.hp < t.maxHp * .5) {
                line(a, t.w * .5, 0, t.w * .35, t.h * .36, '#182630', 2);
                line(a, t.w * .35, t.h * .36, t.w * .7, t.h * .65, '#182630', 2);
            }
            if (t.mat === 'rock' && region !== 3) {
                for (let x = 8; x < t.w - 7; x += 18 + R() * 15) {
                    const y = (t.slope || 0) * x / t.w;
                    line(a, x, y, x - 3, y - 4 - R() * 6, p.top, .8);
                    line(a, x, y, x + 4, y - 2 - R() * 5, p.top, .9);
                }
            }
            this.terrainCache.set(key, tex);
            if (this.terrainCache.size > 190)
                this.terrainCache.delete(this.terrainCache.keys().next().value!);
        }
        c.drawImage(tex, t.x - 5, t.y - 5 + Math.min(0, t.slope || 0) - 12);
        // Readable traversable upper edge, with a dark separation line beneath it.
        c.save();
        const edge=t.mat==='ice'?'#c6edf1':t.mat==='wood'?'#cfb18c':t.mat==='metal'?'#b5c6cc':'#b8baa3';
        line(c,t.x,t.y+.6,t.x+t.w,t.y+(t.slope||0)+.6,'#101b24',4.5);
        line(c,t.x,t.y-1,t.x+t.w,t.y+(t.slope||0)-1,edge,1.7);
        if(t.mat!=='rock'){line(c,t.x,t.y+1,t.x,t.y+t.h,'#131d28',1.7);line(c,t.x+t.w,t.y+(t.slope||0)+1,t.x+t.w,t.y+t.h,'#131d28',1.7);}
        c.restore();
        if (t.expires) {
            txt(c, `${Math.max(1, t.expires - round)}R`, t.x + t.w / 2, t.y - 13, '#b6e3eb', 11);
        }
        if (t.hp < t.maxHp && t.hp > 0 && t.hp < 9999) {
            roundRect(c, t.x + t.w / 2 - 17, t.y + 8, 34, 3, 1, '#182831');
            rect(c, t.x + t.w / 2 - 17, t.y + 8, 34 * t.hp / t.maxHp, 3, '#c2b39a');
        }
    }
    rune(c: C, x: number, y: number, r: number, color: string, rot = 0) { c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = color; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke(); c.beginPath(); for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        c.moveTo(Math.cos(a) * r * .62, Math.sin(a) * r * .62);
        c.lineTo(Math.cos(a) * r * 1.16, Math.sin(a) * r * 1.16);
    } c.stroke(); c.rotate(Math.PI / 4); c.strokeRect(-r * .52, -r * .52, r * 1.04, r * 1.04); c.restore(); }
    human(c: C, u: Unit, selected: boolean, charge: number) {
        const enemy = u.side === 1, cls = u.cls, co = enemy ? (u.elite?'#d6a457':'#b84e4b') : CLASSES[cls].color, dark = enemy ? '#291820' : cls === 'mage' ? '#263c51' : cls === 'archer' ? '#263f39' : cls === 'occultist' ? '#2b243b' : '#394958', face = enemy ? '#9c897b' : cls === 'occultist' ? '#d2c5c8' : '#cfb095';
        const moving = (u.moving || 0) > 0, phase = u.walkPhase || 0, air = u.airborne || u.jumping, landing = Math.min(1, (u.landing || 0) * 4), recoil = Math.max(0, (u.anim || 0) - .50) * 2;
        const gait = moving ? Math.sin(phase) : 0, lift = moving ? Math.abs(Math.cos(phase)) * 2 : 0, breath = Math.sin(this.time * 2.2 + (u.x || 0)) * .6;
        const swing = gait * 14, lean = (moving ? 5 : 0) + (air ? 8 : 0) - (u.hurt > 0 ? 5 : 0), duck = charge * (cls === 'knight' ? 6 : 2) + landing * 8;
        c.save();
        c.scale((u.h || 76) / 76, (u.h || 76) / 76);
        c.scale(u.facing || 1, 1);
        if (u.dead) {
            c.rotate(Math.PI * .46);
            c.translate(-30, 0);
            c.globalAlpha = .32;
        }
        c.translate(0, -lift);
        const angle = (u.facing || 1) > 0 ? u.angle : 180 - u.angle;
        const cape = Math.sin(this.time * 4 + (u.x || 0) * .1) * 2 + this.wind * .08 + (moving ? -12 : 0) + (air ? -14 : 0);
        // Tailored cloak with independent folds and a trailing edge.
        path(c, [[-12 + lean, -55 + duck], [-21, -39], [-22 + cape, -19], [-29 + cape, -3], [-15 + cape, -8], [-4, -2], [12, -12], [10 + lean, -52 + duck]], dark, '#101f2b', 1.3);
        line(c, -12 + lean, -48 + duck, -19 + cape, -9, co + '55', 1.2);
        line(c, -7 + lean, -46 + duck, -7, -8, '#a1b2af28', 1);
        // Two-bone legs articulate even when locomotion does not set the attack timer.
        for (const side of [-1, 1]) {
            const hip = side * 6, kneeX = hip + (air ? side === 1 ? 14 : -7 : side * swing * .45), kneeY = air ? -19 : -15 + Math.max(0, side * gait) * 4, footX = hip + (air ? side === 1 ? 5 : -18 : side * swing), footY = air ? -8 : Math.min(0, -side * gait * 5);
            line(c, hip, -29 + duck, kneeX, kneeY, enemy ? (side<0?'#432733':'#72505b') : side < 0 ? '#263342' : '#405467', 7.5);
            line(c, kneeX, kneeY, footX, footY - 3, enemy ? (side<0?'#49313b':'#876470') : side < 0 ? '#273847' : '#43596b', 6.5);
            circle(c, kneeX, kneeY, 3.2, cls === 'knight' ? (enemy?'#ae8b86':'#8a9ba5') : '#5c6b64');
            line(c, footX - 3, footY, footX + 8, footY, '#16242f', 5.5);
            line(c, footX, footY - 9, footX + 2, footY - 4, '#9fa98e', 1);
        }
        c.save();
        c.translate(lean, duck + breath);
        c.rotate(moving ? .055 : air ? .09 : recoil * -.06);
        // Rear arm and elbow counter-swing against the gait.
        const backElbowX = -18 - (moving ? gait * 5 : 0), backElbowY = -35 + charge * 3;
        line(c, -10, -49, backElbowX, backElbowY, dark, 7);
        line(c, backElbowX, backElbowY, -10 - charge * 7, -29, dark, 6);
        circle(c, -10 - charge * 7, -29, 3, face);
        if (cls === 'mage') {
            path(c, [[-12, -52], [-17, -15], [-10, -10], [-2, -16], [11, -10], [16, -18], [10, -52]], enemy?'#90464f':'#536779', '#21333f', 1.5);
            path(c, [[-10, -50], [-8, -15], [0, -20], [3, -50]], enemy?'#5c2d3b':'#3a4e62');
            line(c, -8, -47, -7, -16, co, 1.2);
            line(c, 9, -45, 10, -16, '#baa784', 1.1);
            line(c, -12, -32, 13, -33, '#8c6f52', 4);
            circle(c, 0, -33, 3, '#d3bc85');
            path(c, [[-16, -49], [-7, -56], [10, -54], [19, -47], [10, -42], [-8, -44]], dark, '#152632');
        }
        else if (cls === 'archer') {
            path(c, [[-15, -29], [-26, -32], [-20, -65], [-10, -61]], '#695646', '#182c30');
            for (let i = 0; i < 4; i++) {
                line(c, -20 + i * 3, -58, -18 + i * 3, -76 + i % 2 * 3, '#c6b999', 1);
                path(c, [[-18 + i * 3, -74], [-23 + i * 3, -77], [-22 + i * 3, -71]], '#a8b9a3');
            }
            path(c, [[-11, -52], [10, -52], [14, -33], [8, -25], [-12, -27]], enemy?'#a2574b':'#667b65', '#213833', 1.6);
            path(c, [[-10, -50], [-4, -45], [-3, -28], [-10, -29]], enemy?'#70343c':'#3e574b');
            line(c, -8, -48, 11, -31, '#b59a70', 3.5);
            line(c, -12, -28, 12, -28, '#263d34', 4);
            path(c, [[-12, -57], [-6, -61], [10, -60], [17, -53], [6, -47], [-8, -48]], enemy?'#61343e':'#38574d');
            line(c, -8, -53, -20 + cape, -29, co, 2.2);
        }
        else if (cls === 'occultist') {
            path(c, [[-14,-54],[-18,-34],[-12,-20],[-3,-26],[10,-19],[18,-34],[12,-55]], enemy?'#6f384e':'#443553', '#171b2a', 1.5);
            path(c, [[-9,-53],[-5,-22],[2,-28],[7,-52]], enemy?'#452034':'#2e2940');
            line(c,-10,-47,10,-29,enemy?'#ad6f76':'#9e83bb',1.2);
            for(let i=0;i<3;i++){const yy=-43+i*8;path(c,[[11,yy],[24,yy+2],[22,yy+8],[9,yy+6]],'#d9ccae','#6e5f58',.7);line(c,15,yy+4,20,yy+4,'#744b61',.8);}
            path(c,[[-16,-53],[-8,-60],[8,-59],[18,-52],[10,-46],[-9,-47]],enemy?'#482332':'#272235','#151a27');
        }
        else {
            path(c, [[-12, -52], [9, -53], [18, -41], [12, -27], [-8, -25], [-17, -39]], enemy ? '#81505a' : '#758ba1', '#1d2f40', 1.8);
            path(c, [[-8, -47], [8, -48], [11, -36], [1, -29], [-9, -35]], enemy?'#aa8787':'#a2b4c2', enemy?'#62434d':'#506275');
            line(c, 1, -46, 1, -31, '#ecdfc3', 1);
            path(c, [[-17, -55], [-5, -53], [-7, -42], [-22, -42]], enemy?'#95636c':'#8598a9', '#283d4c');
            path(c, [[8, -55], [20, -49], [22, -41], [9, -43]], enemy?'#b08c88':'#acb9c2', '#394c60');
            line(c, -10, -27, 12, -26, '#a88b60', 4);
            for (let i = 0; i < 3; i++)
                line(c, -7, -40 + i * 4, 0, -36 + i * 3, '#e0d9c042', .8);
        }
        rect(c, -4, -61, 8, 10, face);
        ellipse(c, 0, -65, 7, 9.5, face);
        line(c, 3, -65, 6, -65, '#23333c', 1);
        if (cls === 'mage') {
            path(c, [[-9, -60], [-11, -72], [-7, -80], [2, -83], [10, -77], [11, -59], [5, -67], [1, -74], [-5, -69]], dark, '#182938', 1);
            line(c, -8, -71, -8, -62, co, 1);
        }
        else if (cls === 'archer') {
            path(c, [[-8, -65], [-9, -74], [-3, -79], [7, -77], [11, -67], [4, -72], [-4, -69]], '#21352f');
            line(c, -8, -67, 8, -67, '#759579', 2.5);
        }
        else if (cls === 'occultist') {
            path(c,[[-10,-64],[-10,-77],[-3,-83],[8,-80],[12,-67],[6,-59],[3,-72],[-5,-71],[-6,-60]],enemy?'#8d5366':'#53435e','#1b2030',1);
            path(c,[[-5,-68],[0,-74],[6,-68],[4,-61],[-4,-61]],'#ded5c9','#66546d',.8);
            line(c,-2,-66,5,-66,enemy?'#d7868e':'#c8a8e7',1.2);
            for(let i=0;i<2;i++)line(c,-13-i*3,-70-i*3,-20-i*5,-76-i*2,co,1);
        }
        else {
            path(c, [[-9, -65], [-8, -76], [0, -82], [9, -76], [10, -64], [5, -59], [5, -70], [-5, -70], [-6, -60]], enemy ? '#ad7f82' : '#adbcc6', '#334657', 1);
            line(c, -4, -66, 7, -66, '#102936', 2);
            line(c, 0, -80, 0, -74, '#e3d8bd', 1.2);
        }
        let ax = 15 + Math.cos(rad(angle)) * (8 + charge * 3) + recoil * 6, ay = -44 - Math.sin(rad(angle)) * 11;
        if (moving) {
            ax = 13 - gait * 6;
            ay = -39 + gait * 3;
        }
        if (air && cls === 'knight') {
            ax = 21;
            ay = -56;
        }
        const elbowX = (12 + ax) * .5 - 3, elbowY = (-48 + ay) * .5 + 5;
        line(c, 12, -48, elbowX, elbowY, enemy ? (cls==='knight'?'#ab8585':'#97515b') : cls === 'knight' ? '#9bafbd' : cls === 'mage' ? '#657d94' : cls === 'occultist' ? '#7a668a' : '#789172', 7);
        line(c, elbowX, elbowY, ax, ay, cls === 'knight' ? (enemy?'#76535e':'#6c8499') : dark, 6);
        circle(c, ax, ay, 3.3, face);
        const effect = selected ? this.chargeColor : co;
        if (cls === 'mage') {
            line(c, ax - 5, ay + 23, ax + 7, ay - 37, '#796549', 3.4);
            line(c, ax - 4, ay + 23, ax + 8, ay - 35, '#d2bd86', .8);
            path(c, [[ax + 2, ay - 34], [ax, ay - 41], [ax + 7, ay - 49], [ax + 14, ay - 41], [ax + 12, ay - 34]], '#526f85', '#c9b993', 1.1);
            circle(c, ax + 7, ay - 40, 3.5, co);
            if (charge > 0)
                this.chargeEffect(c, ax + 7, ay - 40, effect, charge, cls);
            else
                this.glow(c, ax + 7, ay - 40, 11, co, .27);
        }
        else if (cls === 'archer') {
            c.save();
            c.translate(ax, ay);
            c.rotate(-rad(moving ? 12 : angle));
            c.beginPath();
            c.moveTo(1, -26);
            c.bezierCurveTo(9, -20, 25 + charge * 5, -8, 21, 0);
            c.bezierCurveTo(25 + charge * 5, 8, 9, 20, 1, 26);
            c.strokeStyle = '#ccb38b';
            c.lineWidth = 2.4;
            c.stroke();
            line(c, 1, -26, -6 - charge * 17, 0, '#dae1c9', .9);
            line(c, -6 - charge * 17, 0, 1, 26, '#dae1c9', .9);
            line(c, -15 - charge * 13, 0, 27, 0, '#e6d6b3', 1.1);
            path(c, [[32, 0], [25, -3], [25, 3]], '#d4e5df');
            if (charge > 0)
                this.chargeEffect(c, 29, 0, effect, charge, cls);
            c.restore();
            if (u.role === 'crossbow' || u.role === 'ballista')
                rect(c, ax - 8, ay - 4, 28, 8, '#343d49', '#b4a98b');
        }
        else if (cls === 'occultist') {
            c.save();c.translate(ax,ay);c.rotate(-rad(moving?18:angle));
            line(c,-5,23,7,-31,'#5d4d48',3.2);line(c,-4,22,8,-30,'#c1a77b',.7);
            this.rune(c,9,-34,8+charge*5,co,-this.time*(.8+charge));
            this.glow(c,9,-34,18+charge*34,co,.22+charge*.45);
            for(let i=0;i<3;i++){const a=this.time*(1.2+i*.2)+i*2.1,r=12+charge*18;circle(c,9+Math.cos(a)*r,-34+Math.sin(a)*r*.65,1.5+charge*1.4,i===1?'#dfd3ef':co);}
            path(c,[[-2,-4],[-13,-10],[-17,-3],[-10,5]],'#d8caa8','#5a4658',.7);
            c.restore();
        }
        else {
            c.save();
            c.translate(ax, ay);
            c.rotate(-rad(air ? 58 : angle + charge * 20) + recoil * .95);
            path(c, [[0, -3], [35, -3], [49, 0], [35, 3], [0, 3]], '#c9d7df', '#526978', .8);
            line(c, 2, 0, 44, 0, '#fff0ce', .8);
            line(c, -1, -9, -1, 9, '#c4a878', 3);
            line(c, -4, 0, -14, 0, '#403e38', 4);
            circle(c, -16, 0, 2.6, '#ccb88c');
            if (charge > 0) {
                this.glow(c, 20, 0, 27 + charge * 16, effect, .24 + charge * .3);
                line(c, 0, 0, 45, 0, effect, 1 + charge * 2);
                for (let i = 0; i < 3; i++)
                    line(c, i * 13 - 10, 8 + Math.sin(this.time * 7 + i) * 2, i * 13 + 8, 8, effect + '77', 1);
            }
            c.restore();
            if (u.role === 'guard' || u.role === 'knight') {
                const sx = u.shield > 0 ? 13 : -20;
                path(c, [[sx - 8, -46], [sx + 7, -43], [sx + 8, -23], [sx, -15], [sx - 10, -24]], enemy?'#622d3b':'#405e76', '#bfbdab', 1.4);
                path(c, [[sx - 5, -40], [sx + 3, -40], [sx + 3, -25], [sx, -21], [sx - 6, -28]], enemy?'#ad6364':'#70899e');
                line(c, sx - 1, -42, sx - 1, -24, '#d6c298', 1);
            }
        }
        // 7.0 art pass: readable material hierarchy and less toy-like faction silhouettes.
        c.save();
        if (enemy) {
            // Blackened steel gorget + crimson campaign sash distinguish enemies even at low zoom.
            path(c, [[-13,-54],[-5,-58],[8,-57],[15,-50],[10,-45],[-10,-45]], u.elite?'#5a4031':'#30242a', u.elite?'#d5ad69':'#783f45', 1.05);
            line(c,-12,-25,13,-25,u.elite?'#c39c5b':'#9c4f48',3.2);
            line(c,-5,-65,6,-65,u.elite?'#ffd18a':'#d76b61',1.15);
            for (const x of [-8,0,8]) circle(c,x,-49,1.25,u.elite?'#d7bc82':'#80636a');
        } else {
            // Class heraldry is restrained and geometric, more military than cartoon.
            const sig=cls==='mage'?'#a6c8dc':cls==='archer'?'#a7b795':cls==='occultist'?'#c0a1da':'#c3cbd0';
            line(c,-10,-30,10,-30,'#1a2730',2.4);
            if(cls==='mage'){this.rune(c,0,-39,5.3,sig,.6);}
            else if(cls==='archer'){line(c,-5,-41,5,-33,sig,1.1);line(c,5,-41,-5,-33,sig,1.1);}else if(cls==='occultist'){this.rune(c,0,-37,5.4,sig,-this.time*.25);}
            else {path(c,[[-5,-42],[0,-47],[5,-42],[0,-32]],sig,'#5a6871',.7);}
        }
        // Scratches and edge wear break the flat vector surfaces.
        c.globalAlpha=.45;
        line(c,-8,-50,-2,-47,'#e6dcc2',.55);
        line(c,5,-37,11,-40,'#111b22',.65);
        c.restore();
        if (charge > .15 && cls === 'knight') {
            c.save();
            c.scale(1, .24);
            this.rune(c, -lean, (1 - duck) / .24, 24 + charge * 12, effect, this.time * .6);
            c.restore();
        }
        if (u.hurt > .35) {
            c.globalAlpha = .19;
            ellipse(c, 0, -40, 21, 36, '#ffdebd');
        }
        c.restore();
        c.restore();
    }
    boss(c: C, u: Unit, round: number) {
        const t = this.time, open = round % 2 === 0, pulse = .75 + Math.sin(t * 2) * .15;
        c.save();
        c.scale(u.h / 182, u.h / 182);
        if (u.dead)
            c.globalAlpha = .24;
        const plate = (pts: number[][], fill = '#4b5764', edge = '#98a6aa') => path(c, pts, fill, edge, 1.1);
        if (u.boss === 1) {
            // Weathered cathedral guardian: asymmetric rock plates, glowing fault lines, carved facets.
            this.glow(c, 0, -87, 95, '#eea267', .20 * pulse);
            for (const side of [-1, 1]) {
                c.save();
                c.scale(side, 1);
                plate([[6, -56], [30, -60], [41, -33], [44, -5], [33, 0], [8, -3], [15, -20]], '#394b50');
                plate([[15, -53], [29, -51], [34, -32], [19, -30]], '#7b8179');
                plate([[19, -27], [34, -28], [39, -8], [17, -9]], '#626e69');
                plate([[28, -136], [50, -140], [72, -112], [65, -82], [54, -72], [31, -92]], side === 1 ? '#818780' : '#576b6b');
                plate([[51, -92], [73, -81], [78, -41], [70, -29], [48, -36], [40, -63]], '#516368');
                plate([[48, -73], [67, -77], [70, -52], [56, -49]], '#889187');
                for (let i = 0; i < 3; i++)
                    plate([[49 + i * 8, -41], [56 + i * 8, -39], [57 + i * 8, -22], [51 + i * 8, -25]], '#556669');
                line(c, 51, -93, 60, -76, '#e3b477', 1.2);
                c.restore();
            }
            plate([[-38, -131], [-22, -150], [12, -146], [38, -129], [28, -67], [4, -51], [-30, -67]], '#627370');
            plate([[-24, -125], [1, -136], [27, -119], [21, -74], [-5, -64], [-26, -86]], '#33484d');
            plate([[-16, -158], [-9, -177], [13, -174], [24, -160], [18, -140], [-14, -143]], '#8d9485');
            plate([[-17, -169], [-31, -181], [-24, -153], [-14, -149]], '#4b6465');
            plate([[17, -171], [33, -183], [25, -155], [17, -151]], '#70837a');
            line(c, -8, -158, 13, -158, '#ffc278', 2);
            this.glow(c, 3, -156, 18, '#ffc278', .34);
            this.rune(c, 0, -101, 25, '#c3a679', t * .12);
            plate([[0, -125], [15, -105], [2, -79], [-14, -100]], open ? '#f6b575' : '#725a45', '#e0b27c');
            for (const side of [-1, 1]) {
                c.save();
                c.scale(side, 1);
                plate([[open ? 20 : 5, -129], [34, -120], [28, -83], [open ? 24 : 8, -76]], '#7f8b81');
                line(c, 25, -123, 18, -111, '#cbbd8b');
                line(c, 18, -111, 23, -91, '#d0a66d', 1.2);
                c.restore();
            }
            for (let i = 0; i < 10; i++) {
                const x = -25 + (i * 17) % 55, y = -124 + (i * 19) % 53;
                line(c, x, y, x + 4, y + 6, '#263d42', .9);
            }
            line(c, -22, -61, 15, -59, '#cfb37f', 1.5);
        }
        else if (u.boss === 2) {
            // Bell hierophant, not a wheeled cannon: hood, gilded arches, chains and swinging censers.
            this.glow(c, 0, -97, 102, '#deb475', .12);
            for (const side of [-1, 1]) {
                c.save();
                c.scale(side, 1);
                plate([[8, -135], [30, -124], [43, -83], [62, -20], [42, -4], [18, -16], [4, -37]], '#3d3947', '#9c876a');
                plate([[22, -115], [34, -90], [47, -24], [38, -14], [22, -53]], '#786855');
                for (let i = 0; i < 3; i++)
                    line(c, 22 + i * 6, -92, 27 + i * 9, -31, '#c0a27a', 1);
                const sw = Math.sin(t * 1.9 + side) * 8;
                line(c, 48, -104, 53 + sw, -50, '#ad9672', 1.7);
                ellipse(c, 54 + sw, -44, 11, 12, '#544c49', '#c9b082');
                this.glow(c, 54 + sw, -43, 17, '#ffbd7a', .37);
                c.restore();
            }
            plate([[-24, -134], [-19, -154], [0, -169], [20, -152], [26, -132], [14, -75], [-15, -75]], '#333643', '#cab17d');
            plate([[-13, -137], [0, -148], [13, -137], [10, -109], [-10, -109]], '#171f2c');
            line(c, -7, -130, 7, -130, '#eec58e', 1.8);
            plate([[-27, -82], [-16, -111], [17, -111], [29, -79], [35, -59], [-33, -59]], '#917851', '#d2b988');
            ellipse(c, 0, -60, 35, 10, '#39404b', '#d1b585');
            ellipse(c, 0, -62, 26, 6, '#1a2c37');
            line(c, 0, -86, 0, -54, '#e4c887', 2.6);
            circle(c, 0, -55, 4, '#f6d69a');
            for (let i = -2; i <= 2; i++) {
                const x = i * 9;
                line(c, x, -158, x, -174 - Math.abs(i) * 2, '#c6ac76', 2);
                circle(c, x, -177 - Math.abs(i) * 2, 2.5, '#dcc38b');
            }
            this.rune(c, 0, -167, 27, '#d5b57966', -t * .15);
        }
        else if (u.boss === 3) {
            this.glow(c, 0, -92, 110, '#5bcfc1', .17 * pulse);
            // Ancient water engine with curved ribs and organic tendrils.
            for (let j = 0; j < 6; j++) {
                const side = j % 2 ? 1 : -1, x = side * (20 + j * 3), tip = side * (53 + j * 4 + Math.sin(t * 1.3 + j) * 5);
                c.beginPath();
                c.moveTo(x, -94);
                c.bezierCurveTo(side * 96, -103, side * 73, -38, tip, -4);
                c.strokeStyle = j % 2 ? '#43696c' : '#294c57';
                c.lineWidth = 10 - j * .6;
                c.stroke();
                c.strokeStyle = '#83b3a0';
                c.lineWidth = 1.3;
                c.stroke();
            }
            plate([[-45, -121], [-35, -146], [-10, -156], [23, -149], [48, -124], [32, -61], [0, -43], [-30, -66]], '#264957', '#8db5a3');
            for (const side of [-1, 1]) {
                c.save();
                c.scale(side, 1);
                for (let i = 0; i < 4; i++) {
                    const y = -137 + i * 20;
                    plate([[10, y], [37, y - 9], [50 - i * 4, y + 3], [23, y + 13]], i % 2 ? '#456f71' : '#577f7a', '#acc4a0');
                }
                c.restore();
            }
            plate([[0, -160], [19, -122], [9, -65], [0, -48], [-13, -81], [-18, -125]], open ? '#93dfc9' : '#547e76', '#bfdfb9');
            this.glow(c, 0, -105, 34, '#a4f2d6', .50);
            this.rune(c, 0, -105, 23, '#c7e7c1', t * .22);
            for (let i = 0; i < 3; i++) {
                const x = (i - 1) * 15;
                plate([[x - 4, -158], [x, -181 - Math.abs(i - 1) * 5], [x + 5, -156]], '#5a8d84', '#c7cfa3');
            }
            for (let i = 0; i < 10; i++) {
                const a = t * .6 + i * .63;
                circle(c, Math.cos(a) * 56, -102 + Math.sin(a) * 53, 1.7, '#c4e7c4');
            }
        }
        else if (u.boss === 4) {
            this.glow(c, 0, -102, 100, '#a898ef', .16);
            for (const side of [-1, 1]) {
                c.save();
                c.scale(side, 1);
                for (let i = 0; i < 2; i++) {
                    const x = 30 + i * 12;
                    plate([[x, -104 + i * 20], [74 + i * 10, -87 + i * 21], [55 + i * 18, -32], [79 + i * 7, -1], [59 + i * 7, -17], [44 + i * 14, -38]], '#313547', '#9892b6');
                    line(c, x, -100 + i * 20, 68 + i * 10, -84 + i * 21, '#baacdc', 1);
                }
                plate([[16, -153], [40, -174], [33, -133], [55, -145], [45, -112], [19, -91]], '#4f4e6e', '#b0a9cf');
                c.restore();
            }
            plate([[-34, -127], [-15, -157], [15, -156], [39, -123], [22, -71], [0, -46], [-25, -80]], '#272f45', '#7f819f');
            plate([[-19, -144], [0, -167], [22, -139], [11, -94], [0, -65], [-13, -102]], open ? '#b4a2e5' : '#575678', '#b3aed1');
            this.glow(c, 0, -119, 32, '#dbbcff', open ? .5 : .24);
            path(c, [[-10, -133], [0, -144], [10, -132], [0, -106]], '#ecdcff');
            for (let i = 0; i < 7; i++) {
                const a = t * .18 + i * .9, x = Math.cos(a) * 52, y = -123 + Math.sin(a) * 34;
                plate([[x, y - 8], [x + 5, y], [x, y + 10], [x - 4, y]], '#67617e', '#c6b4dd');
            }
        }
        else if (u.boss === 5) {
            c.save();
            c.scale(182 / 112, 182 / 112);
            const sway = Math.sin(t * 2) * 4;
            plate([[-13, -84], [-32, -76], [-34, -22], [-45 + sway, -3], [-14, -12], [2, -28]], '#362c37', '#756365');
            this.human(c, { ...u, h: 112, boss: undefined, role: 'knight' }, false, 0);
            const face = u.facing || -1;
            c.save();
            c.scale(face, 1);
            plate([[-13, -106], [-18, -127], [-7, -119], [0, -130], [9, -116], [19, -121], [14, -101]], '#464856', '#bcb29b');
            line(c, -8, -106, 8, -106, '#f6b67a', 1.5);
            this.glow(c, 2, -105, 14, '#d89e7e', .25);
            plate([[-22, -75], [-31, -81], [-25, -55], [-13, -57]], '#526172', '#b3b6ad');
            for (let i = 0; i < 3; i++)
                circle(c, -22 + i * 4, -69, 1, '#d1b68b');
            c.restore();
            c.restore();
        }
        else {
            this.glow(c, 0, -105, 145, '#9db5ed', .16);
            // Broken astrolabe and constellation cloak; the silhouette reads as a sovereign mage.
            c.save();
            c.translate(0, -117);
            for (let i = 0; i < 3; i++) {
                c.save();
                c.rotate(t * (i % 2 ? -.10 : .12) + i * .9);
                c.strokeStyle = ['#c7b68499', '#93afd2a0', '#dfd0a266'][i];
                c.lineWidth = 1.2;
                c.beginPath();
                c.ellipse(0, 0, 70 + i * 9, 26 + i * 15, 0, 0, Math.PI * 2);
                c.stroke();
                for (let j = 0; j < 6; j++) {
                    const a = j * Math.PI / 3;
                    circle(c, Math.cos(a) * (70 + i * 9), Math.sin(a) * (26 + i * 15), i === 1 ? 3 : 2, '#e2d7b0');
                }
                c.restore();
            }
            c.restore();
            for (const side of [-1, 1]) {
                c.save();
                c.scale(side, 1);
                plate([[8, -129], [26, -122], [33, -86], [52 + Math.sin(t * 1.6) * 3, -21], [33, -6], [21, -19], [6, -14]], '#25374e', '#788b9f');
                plate([[18, -119], [25, -79], [38, -22], [30, -16], [13, -74]], '#415874', '#b6b69d');
                line(c, 27, -113, 52, -89, '#bcc3c5', 5);
                circle(c, 54, -88, 4, '#d5c4a6');
                const yy = -108 + Math.sin(t * 1.7 + side) * 6;
                plate([[61, yy - 13], [70, yy], [62, yy + 16], [55, yy]], '#617aa0', '#dbd1a1');
                this.glow(c, 62, yy, 17, '#bddbff', .44);
                c.restore();
            }
            plate([[-17, -131], [-12, -157], [0, -169], [14, -155], [20, -129], [11, -105], [-11, -105]], '#202f45', '#b7b89e');
            plate([[-9, -147], [0, -154], [10, -146], [5, -127], [-5, -128]], '#c7c9b5', '#e5d8ae');
            line(c, -6, -141, 6, -141, '#344c6b', 1.5);
            plate([[-15, -157], [-25, -178], [-9, -170], [0, -190], [9, -170], [25, -180], [15, -155]], '#62718b', '#d7cba1');
            circle(c, 0, -166, 3, '#e9d9a6');
            for (let i = 0; i < 9; i++) {
                const y = -102 + i * 9, x = Math.sin(i * 2.7) * 13;
                circle(c, x, y, 1.3, '#c5d1e4');
                if (i > 0)
                    line(c, x, y, Math.sin((i - 1) * 2.7) * 13, y - 9, '#a9bec64d', .8);
            }
        }
        // 7.0 boss art pass: oversized weapons, material wear and asymmetry give each boss a stronger silhouette.
        c.save();
        c.lineCap='round';
        if(u.boss===1){
            // Broken cathedral-pillar hammer.
            c.save();c.rotate(-.16);
            line(c,58,-118,91,-18,'#3a4648',10);line(c,58,-118,91,-18,'#a18c6c',2);
            path(c,[[42,-139],[72,-146],[83,-127],[72,-105],[43,-107],[34,-125]],'#59625e','#c2aa79',2);
            for(let i=0;i<4;i++)line(c,45+i*8,-136,56+i*6,-111,'#282f31',1);
            c.restore();
        }else if(u.boss===2){
            // Ritual bell frame and hanging seals.
            c.strokeStyle='#b99b6a';c.lineWidth=3;c.beginPath();c.arc(0,-118,61,Math.PI*1.08,Math.PI*1.92);c.stroke();
            for(const x of [-42,42]){line(c,x,-99,x,-41,'#78654e',1.5);path(c,[[x-6,-43],[x+6,-43],[x+9,-30],[x,-24],[x-9,-30]],'#6f5840','#c1a675',1);}
        }else if(u.boss===3){
            // Pressure ribs and translucent fluid gauges.
            for(const x of [-31,31]){roundRect(c,x-5,-131,10,62,5,'#183d48','#83bcae');rect(c,x-2,-123,4,39,'#65c7b6');circle(c,x,-80,4,'#b3ead0');}
            for(let i=0;i<5;i++)circle(c,-18+i*9,-52+(i%2)*3,1.8,'#b5d8b7');
        }else if(u.boss===4){
            // Obsidian lance establishes a readable attack axis.
            c.save();c.rotate(.13);
            path(c,[[44,-145],[50,-148],[86,-21],[79,-17]],'#37314f','#c3b2e6',1.4);
            path(c,[[85,-32],[99,-9],[81,-17]],'#9a83d0','#e2d6ff',1.2);
            c.restore();
        }else if(u.boss===5){
            // Knight-commander greatblade and torn command pennant.
            c.save();c.rotate(-.28);
            path(c,[[37,-124],[43,-125],[74,-19],[66,-17]],'#bdc6c9','#514a49',1.4);
            line(c,28,-98,53,-105,'#c5a06d',4);
            c.restore();
            path(c,[[-43,-101],[-68,-96],[-61,-58],[-44,-69]],'#5a2730','#b56c65',1);
        }else if(u.boss===6){
            // Astrolabe staff: fewer decorative lines, one dominant arcane weapon.
            c.save();c.rotate(-.08);
            line(c,48,-143,75,-22,'#657a8d',7);line(c,48,-143,75,-22,'#c8bb91',1.3);
            c.strokeStyle='#c6b67c';c.lineWidth=2;c.beginPath();c.arc(44,-151,23,0,Math.PI*2);c.stroke();
            c.beginPath();c.ellipse(44,-151,30,12,.5,0,Math.PI*2);c.stroke();
            circle(c,44,-151,5,'#d7e4ff');this.glow(c,44,-151,26,'#a9c8ef',.32);
            c.restore();
        }
        // Shared surface wear: sparse, high-contrast marks instead of dense decorative noise.
        c.globalAlpha=.38;
        for(let i=0;i<6;i++){const x=-31+i*13,y=-72-(i%3)*19;line(c,x,y,x+8,y-3,'#f0dfbd',.65);}
        c.restore();
        if (u.hurt > .25) {
            this.glow(c, 0, -100, 90, '#fff3cc', u.hurt * .2);
        }
        c.restore();
    }
    spirit(c:C,u:Unit,selected:boolean){
        const kind=u.summonKind||'stalker', t=this.time, col=kind==='warden'?'#a8d8dd':kind==='charger'?'#d3a8e7':kind==='lantern'?'#c6e7c4':'#bda0db';
        c.save();c.globalCompositeOperation='lighter';
        const bob=Math.sin(t*2.4+(u.x||0)*.01)*5;
        this.glow(c,0,-u.h*.48+bob,u.r*2.6,col,.24);
        if(kind==='lantern'){
            this.rune(c,0,-u.h*.55+bob,u.r*.9,col,-t*.55);circle(c,0,-u.h*.55+bob,u.r*.42,'#eef7e8');
            for(let i=0;i<4;i++)line(c,(i-1.5)*4,-u.h*.43+bob,(i-1.5)*7,-5+bob,col+'88',1);
        }else{
            path(c,[[-u.r*.65,-u.h*.24+bob],[-u.r*.85,-u.h*.58+bob],[-u.r*.35,-u.h*.85+bob],[0,-u.h+bob],[u.r*.38,-u.h*.82+bob],[u.r*.82,-u.h*.55+bob],[u.r*.62,-u.h*.20+bob],[u.r*.28,-4],[0,-u.h*.13],[-u.r*.3,-3]],col+'66',col,1.1);
            circle(c,-u.r*.22,-u.h*.66+bob,1.8,'#f4eaff');circle(c,u.r*.22,-u.h*.66+bob,1.8,'#f4eaff');
            if(kind==='charger'){for(let i=0;i<3;i++)line(c,-u.r*1.5-i*10,-u.h*.55+i*4,-u.r*.7,-u.h*.55,col+'77',3-i*.6);}
            if(kind==='warden'){c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();c.arc(0,-u.h*.48+bob,u.r*1.25,0,Math.PI*2);c.stroke();}
            if(kind==='host'){this.rune(c,0,-u.h*.52+bob,u.r*1.12,col,t*.35);}
        }
        c.globalCompositeOperation='source-over';
        if(selected){path(c,[[-9,-u.h-28],[0,-u.h-18],[9,-u.h-28],[0,-u.h-34]],'#e4c5ff','#15202c',1);}
        c.restore();
    }
    unit(c: C, u: Unit, selected: boolean, round: number, charge = 0) {
        c.save();
        c.translate(u.x, u.y);
        ellipse(c, 0, 2, u.r * 1.45, 6, 'rgba(3,11,20,.35)');
        if(!u.dead&&u.role!=='dummy'){
            if(u.side===1){const q=u.elite?'#efc17b':'#f08b79';path(c,[[-8,7],[8,7],[0,15]],q,'#311923',1.3);if(u.elite)path(c,[[-6,17],[6,17],[0,23]],q,'#311923',1);}
            else if(u.side===0){line(c,-10,9,10,9,'#a8e0d0',2);line(c,-6,13,6,13,'#a8e0d0',2);}
        }
        if (u.summoned) { this.spirit(c,u,selected); }
        else if (u.role === 'dummy') {
            line(c, 0, 0, 0, -74, '#967e60', 8);
            line(c, -24, -4, 24, -4, '#715f4b', 7);
            circle(c, 0, -49, 27, '#978873', '#c2b18a', 2);
            circle(c, 0, -49, 18, '#686e66', '#c6bca0', 1);
            circle(c, 0, -49, 7, '#b79c72');
            line(c, -32, -48, 32, -48, '#9e8e75', 4);
        }
        else if (u.role === 'escort') {
            rect(c, -42, -34, 84, 27, '#73614f', '#c0a27d');
            for (let i = 0; i < 4; i++)
                line(c, -39 + i * 23, -32, -39 + i * 23, -7, '#a38a68', 2);
            circle(c, -27, -4, 13, '#344651', '#a68b69', 3);
            circle(c, 28, -4, 13, '#344651', '#a68b69', 3);
            for (let i = 0; i < 6; i++) {
                const a = i * Math.PI / 3;
                line(c, -27, -4, -27 + Math.cos(a) * 11, -4 + Math.sin(a) * 11, '#a48d70', 1);
                line(c, 28, -4, 28 + Math.cos(a) * 11, -4 + Math.sin(a) * 11, '#a48d70', 1);
            }
            path(c, [[-40, -34], [-30, -54], [24, -54], [40, -34]], '#687b76', '#b0b3a0');
        }
        else if (u.role === 'defend') {
            line(c, 0, 0, 0, -88, '#b3a183', 3);
            path(c, [[1, -87], [47, -81 + Math.sin(this.time * 2) * 3], [39, -59], [1, -65]], '#8a6b63', '#ad9480');
            this.rune(c, 18, -75, 7, '#d7c599');
        }
        else if (u.boss)
            this.boss(c, u, round);
        else
            this.human(c, u, selected, charge);
        if (selected && !u.dead) {
            c.save();
            c.scale(1, .35);
            this.rune(c, 0, 4, 39, u.side===1?'#ef9890':'#dfc187', this.time * .3);
            c.restore();
            const marker=u.side===1?'#ff9690':'#ffdd98', bob=Math.sin(this.time*3.4)*3, size=clamp(1/this.scale,.8,1.8);
            c.save();c.translate(0,-u.h-48+bob);c.scale(size,size);
            path(c,[[-12,-10],[0,-3],[12,-10],[9,0],[0,9],[-9,0]],marker,'#14242c',1.5);
            c.restore();
            c.save();
            c.setLineDash([2, 8]);
            c.strokeStyle = 'rgba(225,199,147,.22)';
            c.beginPath();
            c.arc(0, -u.h * .55, 72, Math.PI * 1.05, Math.PI * 1.95);
            c.stroke();
            c.restore();
        }
        if (u.shield > 0 && !u.dead) {
            c.save();
            c.globalAlpha = .48;
            c.strokeStyle = '#b1d4e8';
            c.lineWidth = 1.5;
            c.beginPath();
            c.ellipse(0, -u.h * .48, u.r + 8, u.h * .54, 0, 0, Math.PI * 2);
            c.stroke();
            c.restore();
        }
        if (!u.dead) {
            const barW = u.boss ? 104 : u.side === 2 ? 80 : 68, by = -u.h - 20;
            roundRect(c, -barW / 2, by, barW, 5, 2, '#13222d', '#263943');
            rect(c, -barW / 2 + 1, by + 1, (barW - 2) * u.hp / u.maxHp, 3, u.side === 1 ? (u.elite?'#ecc17a':'#ec8475') : u.side === 2 ? '#b9bd9b' : '#9bcebb');
            if (u.shield > 0)
                rect(c, -barW / 2, by - 3, barW * Math.min(u.shield / u.maxHp, 1), 2, '#a5cbe9');
            txt(c, u.side === 0 ? `Lv.${u.level}` : u.boss ? u.name : u.elite ? `정예 · ${u.level}` : `${u.level}`, 0, by - 11, u.side === 1 ? (u.elite?'#f3d59a':'#efb9ad') : '#d7e1df', 12, 'center', '600');
            if (u.side === 0) {
                rect(c, -barW / 2, by + 8, barW, 3, '#182632');
                rect(c, -barW / 2, by + 8, barW * u.focus / u.maxFocus, 3, '#82b8db');
                if (u.acted)
                    txt(c, '✓', 0, 18, '#a0b2b4', 14);
            }
            if (u.side === 1 && u.role !== 'dummy' && !u.awake)
                txt(c, '···', 0, by - 29, '#87979b', 15);
            if ((u.stun || 0) > 0) {
                for (let i = 0; i < 3; i++) {
                    const a = this.time * 3 + i * Math.PI * 2 / 3;
                    txt(c, '✦', Math.cos(a) * 18, -u.h - 5 + Math.sin(a) * 4, '#f4d88e', 13);
                }
            }
            let statuses = [];
            if (u.stun)
                statuses.push('기절');
            if (u.bound)
                statuses.push('구속');
            if (u.breaks)
                statuses.push('파갑');
            if (u.mark)
                statuses.push('표식');
            if ((u.curseTurns||0)>0) statuses.push((u.betrayalUntil||0)>=round?'원한':'저주');
            if (statuses.length)
                txt(c, statuses.join(' · '), 0, 19, '#e2c9a8', 10);
        }
        c.restore();
    }
    glow(c: C, x: number, y: number, r: number, color: string, alpha = .5) { c.save(); c.globalAlpha *= alpha; const g = c.createRadialGradient(x, y, 0, x, y, Math.max(1, r)); g.addColorStop(0, color); g.addColorStop(.3, color + '70'); g.addColorStop(1, color + '00'); circle(c, x, y, r, g as unknown as string); c.restore(); }
    lightning(c: C, x: number, y: number, x2: number, y2: number, color: string, width = 2, phase = 0) {
        const dx = x2 - x, dy = y2 - y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, points: number[][] = [];
        for (let i = 0; i <= 9; i++) {
            const f = i / 9, j = i === 0 || i === 9 ? 0 : Math.sin(i * 31.7 + Math.floor(phase * 4) * .3) * Math.min(13, len * .085);
            points.push([x + dx * f + nx * j, y + dy * f + ny * j]);
        }
        c.save();
        c.lineJoin = 'round';
        for (const [w, a] of [[width * 4, .15], [width * 1.5, .5], [Math.max(.7, width * .55), 1]]) {
            c.globalAlpha = a;
            c.strokeStyle = color;
            c.lineWidth = w;
            c.beginPath();
            points.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py));
            c.stroke();
        }
        c.restore();
    }
    chargeEffect(c: C, x: number, y: number, color: string, p: number, cls: ClassId) {
        const radius = (cls === 'mage' ? 17 : cls==='occultist'?15:10) + p * (cls === 'mage' ? 31 : cls==='occultist'?28:18);
        this.glow(c, x, y, radius * 1.8, color, .24 + p * .4);
        c.save();
        c.globalCompositeOperation = 'lighter';
        const count = this.low ? 6 : 11;
        for (let i = 0; i < count; i++) {
            const f = (this.time * 1.1 + i / count) % 1, a = i * 2.399 + this.time * .35, r = radius * (1.7 - f * 1.55), px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
            c.globalAlpha = .25 + f * .65;
            line(c, px - Math.cos(a) * 6, py - Math.sin(a) * 6, px, py, color, 1 + f * .9);
        }
        c.globalAlpha = .7;
        this.rune(c, x, y, radius * .72, color, -this.time * (.5 + p));
        c.globalAlpha = 1;
        circle(c, x, y, 3 + p * 6, color);
        circle(c, x - 1, y - 1, 1.5 + p * 2.5, '#fff4de');
        if (p > .86) {
            c.globalAlpha = (p - .86) * 4;
            line(c, x - radius, y, x + radius, y, '#ffe8bf', 1.5);
            line(c, x, y - radius * .55, x, y + radius * .55, '#fff4d9', 1);
        }
        c.restore();
    }
    bodyTrail(c: C, p: Battle['projectiles'][number]) { if(drawWarriorProjectile(c,p))return; if (p.trail.length < 2)
        return; c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 1; i < p.trail.length; i++) {
        const a = p.trail[i - 1], b = p.trail[i], f = i / p.trail.length;
        c.globalAlpha = f * .22;
        line(c, a.x, a.y, b.x, b.y, p.color, 10 * f + 2);
        c.globalAlpha = f * .7;
        line(c, a.x, a.y + 4, b.x, b.y + 4, p.color, 1.1);
    } c.restore(); if (p.mode === 'slam') this.glow(c, p.x, p.y, 40, '#ffcf94', .25);
    if(p.mode==='cataclysmCharge'){this.glow(c,p.x,p.y-28,75,'#d2a4ff',.36);c.save();c.globalCompositeOperation='lighter';for(let i=0;i<3;i++){c.globalAlpha=.35-i*.08;line(c,p.x-75-i*20,p.y-38+i*8,p.x+18,p.y-28,'#d9bcff',8-i*2);}c.restore();} }
    projectile(c: C, p: Battle['projectiles'][number]) {
        if(drawRedesignProjectile(c,p))return;
        const angle = Math.atan2(p.vy, p.vx), occult=p.skill?.[0]==='O'||p.skill?.startsWith('LO')||['nightParade','nightBolt','spiritRain'].includes(p.mode), ultimate=['arcaneJudgment','starHunt','arcBolt','hunterBolt','nightParade','nightBolt'].includes(p.mode)||p.skill==='M99'||p.skill==='A99'||p.skill==='O99', advanced = ['meteor', 'emberOrb', 'frostOrb', 'stormOrb','arcaneJudgment','starHunt','reverseGhost','nightParade'].includes(p.mode), arrow = p.skill[0] === 'A' || p.mode==='hunterBolt', color = p.color;
        c.save();
        c.lineCap = 'round';
        c.lineJoin = 'round';
        if (p.trail.length > 1) {
            c.globalCompositeOperation = 'lighter';
            const width = p.mode === 'meteor' ? 22 : ultimate ? 18 : advanced ? 14 : arrow ? 2.5 : 4;
            for (let i = 1; i < p.trail.length; i++) {
                const a = p.trail[i - 1], b = p.trail[i], f = i / p.trail.length;
                c.globalAlpha = f * (advanced ? .17 : .22);
                line(c, a.x, a.y, b.x, b.y, color, width * (.2 + f));
                c.globalAlpha = f * .65;
                line(c, a.x, a.y, b.x, b.y, color, advanced ? 2.4 : 1.1);
            }
            if (advanced && !this.low) {
                for (let i = 2; i < p.trail.length; i += 4) {
                    const v = p.trail[i], f = i / p.trail.length;
                    c.globalAlpha = .4 * f;
                    circle(c, v.x + Math.sin(i + p.age * 9) * 10, v.y + Math.cos(i * 2) * 9, 1.4 + f, color);
                }
            }
            c.globalAlpha = 1;
            c.globalCompositeOperation = 'source-over';
        }
        if (p.mode === 'stormBolt') {
            const a = p.trail[0] || p;
            this.lightning(c, a.x, a.y, p.x, p.y, color, 2, p.id);
            this.glow(c, p.x, p.y, 14, color, .7);
            c.restore();
            return;
        }
        if (p.mode === 'arcBolt') {
            const a=p.trail[Math.max(0,p.trail.length-3)]||p;
            this.lightning(c,a.x,a.y,p.x,p.y,'#d9b4ff',3,p.id+p.age*7);
            this.glow(c,p.x,p.y,22,'#b96cff',.85);circle(c,p.x,p.y,4,'#f6e8ff');c.restore();return;
        }
        if (p.mode === 'nightBolt' || p.mode==='spiritRain' || p.mode==='summonBolt') {
            const a=p.trail[Math.max(0,p.trail.length-4)]||p;
            c.globalCompositeOperation='lighter';c.globalAlpha=.72;line(c,a.x,a.y,p.x,p.y,p.mode==='nightBolt'?'#cf8cff':'#b7a6e8',p.mode==='nightBolt'?4.5:2.2);c.globalAlpha=1;c.globalCompositeOperation='source-over';
            this.glow(c,p.x,p.y,p.mode==='nightBolt'?24:15,p.mode==='nightBolt'?'#b367e8':'#a89bd7',.68);this.rune(c,p.x,p.y,p.mode==='nightBolt'?8:5,'#eadcff',p.age*2);c.restore();return;
        }
        if (p.mode === 'hunterBolt') {
            if(p.trail.length>1){const a=p.trail[Math.max(0,p.trail.length-4)];c.globalCompositeOperation='lighter';c.globalAlpha=.7;line(c,a.x,a.y,p.x,p.y,'#ffe99c',5);c.globalAlpha=1;c.globalCompositeOperation='source-over';}
            c.save();c.translate(p.x,p.y);c.rotate(angle);this.glow(c,0,0,25,'#f5dd8c',.7);line(c,-34,0,13,0,'#fff1b8',2.4);path(c,[[18,0],[6,-5],[8,0],[6,5]],'#fff0a8');c.restore();c.restore();return;
        }
        if (p.mode === 'honroSonic' || p.mode === 'honroEchoNeedle') {
            c.save();c.translate(p.x,p.y);c.rotate(angle);c.globalCompositeOperation='lighter';
            const rings=p.mode==='honroSonic'?4:2;for(let i=0;i<rings;i++){c.globalAlpha=.62-i*.10;c.strokeStyle=i%2?'#d3e6d6':'#9eb8aa';c.lineWidth=p.mode==='honroSonic'?1.8:1.1;c.beginPath();c.arc(-i*11,0,12+i*7,-.72,.72);c.stroke();}
            this.glow(c,0,0,p.mode==='honroSonic'?26:14,'#a7bda9',.32);c.restore();c.restore();return;
        }
        if (p.mode === 'honroDeadBreath' || p.mode === 'honroFuneralShade') {
            this.glow(c,p.x,p.y,p.mode==='honroFuneralShade'?34:24,'#a99ab4',.28);c.save();c.translate(p.x,p.y);c.rotate(angle);c.globalAlpha=.72;path(c,[[14,0],[-2,-8],[-14,0],[-2,8]],'#8e819866','#cbbfd0',1);for(let i=0;i<3;i++)circle(c,-12-i*9,Math.sin(p.age*6+i)*4,2,'#b9afbf88');c.restore();c.restore();return;
        }
        if (p.mode === 'honroRootShard' || p.mode === 'honroEarthRoar') {
            c.save();c.translate(p.x,p.y);c.rotate(angle);path(c,[[18,0],[4,-7],[-14,-5],[-20,4],[1,8]],p.mode==='honroEarthRoar'?'#6d765b':'#8d8767','#c0b68d',1.1);for(let i=0;i<3;i++)circle(c,-10-i*8,4+(i%2)*4,2.2,'#6c645255');c.restore();c.restore();return;
        }
        if (p.mode === 'honroSoulFlame' || p.mode === 'honroMistSeed') {
            this.glow(c,p.x,p.y,p.mode==='honroMistSeed'?38:27,p.mode==='honroSoulFlame'?'#c9c997':'#9cae9d',.36);c.save();c.translate(p.x,p.y);this.rune(c,0,0,p.mode==='honroMistSeed'?13:8,p.color||'#b8bd93',p.age*.8);circle(c,0,0,p.mode==='honroMistSeed'?6:4,'#e6e0bd');c.restore();c.restore();return;
        }
        if (p.mode === 'honroShroudNeedle' || p.mode === 'honroShroudKnot') {
            c.save();c.translate(p.x,p.y);c.rotate(angle);path(c,[[22,0],[5,-3],[-18,-7],[-9,0],[-18,7],[5,3]],'#a99da777','#d5c9cf',1);c.restore();c.restore();return;
        }
        if (p.mode === 'honroRotFeather' || p.mode === 'honroFeatherBurst') {
            c.save();c.translate(p.x,p.y);c.rotate(angle);path(c,[[15,0],[3,-5],[-12,-2],[-4,1],[-12,6],[3,4]],'#69766c','#a2ab98',1);c.restore();c.restore();return;
        }
        if (p.mode === 'honroWoodSpike' || p.mode === 'honroWardGust') {
            c.save();c.translate(p.x,p.y);c.rotate(angle);if(p.mode==='honroWardGust'){for(let i=0;i<3;i++){c.strokeStyle='#a89c78';c.globalAlpha=.52-i*.12;c.lineWidth=1.3;c.beginPath();c.arc(-i*9,0,11+i*7,-.65,.65);c.stroke();}}else path(c,[[19,0],[2,-6],[-15,-3],[-18,4],[3,5]],'#7f6b4d','#b7a783',1);c.restore();c.restore();return;
        }
        if (p.mode === 'honroMournerWail' || p.mode === 'honroBierWeight') {
            c.save();c.translate(p.x,p.y);c.rotate(angle);if(p.mode==='honroMournerWail'){c.strokeStyle='#b27e80';c.lineWidth=2;for(let i=0;i<3;i++){c.globalAlpha=.55-i*.12;c.beginPath();c.arc(-i*12,0,13+i*8,-.75,.75);c.stroke();}}else path(c,[[15,0],[5,-8],[-13,-7],[-18,5],[2,9]],'#705c4c','#a68e70',1);c.restore();c.restore();return;
        }
        if(occult){
            if(p.mode!=='convergeSpirit')this.glow(c,p.x,p.y,p.mode==='spiritConverge'?38:19,color,.25);
            c.save();c.translate(p.x,p.y);c.rotate(angle);
            if(['curseWeak','curseBetray','curseDot','curseBind','curseChain','curseManifest','curseEnthrall','curseEarth'].includes(p.mode)){
                path(c,[[-11,-7],[9,-6],[11,7],[-9,6]],'#d6c9aa',color,1);line(c,-4,-4,4,3,'#554b3e',1.1);line(c,4,-3,-3,4,'#554b3e',.8);
            }else if(p.mode.startsWith('summon')){
                c.strokeStyle=color;c.globalAlpha=.78;c.lineWidth=1.5;c.beginPath();c.arc(0,0,8,0,Math.PI*2);c.stroke();line(c,-9,-7,9,7,color,1.3);line(c,-9,7,9,-7,color,1.3);circle(c,0,0,2,'#e7deca');
            }else if(p.mode==='convergeSpirit'){
                c.globalAlpha=.75;path(c,[[11,0],[-3,-4],[-10,0],[-3,4]],color+'aa','#d9d7c6',.6);
            }else {path(c,[[13,0],[-2,-7],[-11,0],[-2,7]],color+'aa','#e6e7d8',1);for(let i=0;i<2;i++)circle(c,-10-i*8,Math.sin(p.age*5+i)*3,1.5,color+'88');}
            c.restore();c.restore();return;
        }
        c.translate(p.x, p.y);
        c.rotate(angle);
        if (p.mode === 'meteor') {
            this.glow(c, 0, 0, 75, '#ffc882', .55);
            for (let j = 0; j < 3; j++) {
                const length = 130 + j * 37;
                const g = c.createLinearGradient(-length, 0, 15, 0);
                g.addColorStop(0, '#ffb15900');
                g.addColorStop(1, j === 0 ? '#ffb85d88' : '#ffe8a444');
                path(c, [[-length, -2 - j * 3], [-16, -24 - j * 5], [24, 0], [-16, 24 + j * 5]], g as unknown as string);
            }
            path(c, [[-22, -13], [-8, -27], [16, -21], [29, -5], [21, 20], [-6, 28], [-25, 11]], '#80514b', '#f6cc87', 2);
            path(c, [[-8, -21], [11, -16], [21, -2], [3, 3], [-11, -5]], '#b98662');
            line(c, -14, -12, -2, -2, '#ffd89e', 2);
            line(c, -2, -2, 6, 19, '#ffe0a0', 2);
            line(c, -2, -2, 21, 6, '#f4ad71', 1.7);
        }
        else if (advanced) {
            this.glow(c, 0, 0, 52, color, .65);
            this.rune(c, 0, 0, 19, color, this.time * .6);
            circle(c, 0, 0, 12, color + 'b0');
            circle(c, -3, -3, 5, '#fff0db');
            if(p.mode==='arcaneJudgment'){
                this.glow(c,0,0,82,'#b45fff',.45);this.rune(c,0,0,35,'#e5c6ff',-this.time*1.7);this.rune(c,0,0,47,'#8e5fd8aa',this.time*.9);
                for(let i=0;i<6;i++){const a=this.time*1.4+i*Math.PI/3;c.strokeStyle=i%2?'#d9b7ff99':'#8e64db88';c.lineWidth=2;c.beginPath();c.moveTo(Math.cos(a)*20,Math.sin(a)*20);c.lineTo(Math.cos(a)*45,Math.sin(a)*45);c.stroke();}
            }
            if(p.mode==='starHunt'){
                this.glow(c,0,0,70,'#f5dd8c',.42);for(let i=0;i<7;i++){const a=this.time*.7+i*Math.PI*2/7;c.save();c.rotate(a);path(c,[[35,0],[23,-3],[18,0],[23,3]],'#ffeaa4');c.restore();}
            }
            if (p.mode === 'frostOrb') {
                for (let i = 0; i < 7; i++) {
                    const a = this.time * 1.6 + i * Math.PI * 2 / 7, r = 20 + Math.sin(i + p.age * 3) * 4, x = Math.cos(a) * r, y = Math.sin(a) * r;
                    c.save();
                    c.translate(x, y);
                    c.rotate(a);
                    path(c, [[7, 0], [-2, -3], [-5, 0], [-2, 3]], '#ceeefe', '#7bb6dc');
                    c.restore();
                }
            }
            if (p.mode === 'emberOrb') {
                for (let i = 0; i < 5; i++) {
                    const y = (i - 2) * 7, l = 34 + Math.sin(p.age * 8 + i) * 9;
                    path(c, [[-l, y], [-4, y - 5], [14, 0], [-5, y + 5]], color + '60');
                }
                circle(c, 0, 0, 7, '#ffe5ac');
            }
            if (p.mode === 'stormOrb') {
                c.save();
                c.rotate(-angle);
                for (let i = -1; i <= 1; i++)
                    ellipse(c, i * 10, -3 + Math.sin(p.age * 5 + i) * 2, 12, 9, color + '99');
                this.lightning(c, -19, -9, 17, 12, '#f3d9ff', 1.8, p.age);
                c.restore();
            }
        }
        else if (p.mode === 'marker' || p.mode === 'delay' || p.mode === 'resonate' || p.mode === 'wall') {
            this.glow(c, 0, 0, 24, color, .45);
            this.rune(c, 0, 0, 11, color, this.time * 2);
            this.rune(c, 0, 0, 16, color + '80', -this.time);
            circle(c, 0, 0, 3, '#fff0d0');
        }
        else if (arrow) {
            const fast = clamp(Math.hypot(p.vx, p.vy) / 950, 0, 1);
            if (p.skill !== 'A01')
                this.glow(c, 9, 0, 16 + fast * 8, color, .42);
            line(c, -27, 0, 8, 0, '#d6c99d', 1.7);
            line(c, -26, -.8, 7, -.8, '#fbf1cc', .6);
            path(c, [[14, 0], [6, -3.5], [7, 0], [6, 3.5]], '#e3efea');
            path(c, [[-18, 0], [-28, -5], [-31, -4], [-27, 0]], color);
            path(c, [[-18, 0], [-28, 5], [-31, 4], [-27, 0]], color);
            if (p.skill === 'A07' || p.skill === 'A10')
                this.rune(c, 7, 0, 8, color, p.age * 2);
        }
        else if (p.mode === 'iceShard') {
            path(c, [[11, 0], [-4, -4], [-9, 0], [-4, 4]], '#dcf5ff', color);
            this.glow(c, 3, 0, 11, color, .32);
        }
        else if (p.mode === 'crescent' || p.mode === 'groundwave') {
            this.glow(c, 5, 0, 33, color, .3);
            for (let i = 0; i < 3; i++) {
                c.strokeStyle = i === 0 ? '#f6eaca' : color + (i === 1 ? 'b0' : '50');
                c.lineWidth = 3 - i * .6;
                c.beginPath();
                c.arc(-7 - i * 8, 0, 21 + i * 4, -Math.PI * .37, Math.PI * .37);
                c.stroke();
            }
        }
        else if (p.mode === 'shieldthrow') {
            ellipse(c, 0, 0, 6, 17, '#718fa8', '#e0d7ba');
            line(c, 0, -14, 0, 14, '#e0d7ba', 2);
            this.glow(c, 0, 0, 23, color, .25);
        }
        else {
            this.glow(c, 0, 0, 21, color, .6);
            circle(c, 0, 0, p.radius + 2, color);
            circle(c, 1, -1, Math.max(2, p.radius * .5), '#fff0d9');
            if (p.blast > 90)
                this.rune(c, 0, 0, 12, color + '88', p.age);
        }
        if ((p.amplification || 1) > 1.01) {
            c.globalAlpha = .7;
            this.rune(c, 0, 0, advanced ? 30 : 19, '#eed2ff', this.time * 1.5);
        }
        c.restore();
    }
    weather(c: C, w: number, h: number, region: number, wind: number) {
        const count = this.low ? 22 : 44, dx = this.weatherX * 2.8, sign = Math.sign(wind) || 1;
        c.save();
        const rainy = region === 1 || region === 2;
        // Shafts of light lean with the SAME visible wind, across the entire scrollable world.
        if (region !== 3) {
            c.globalAlpha = .055;
            for (let i = 0; i < 4; i++) {
                const x = w * (.17 + i * .26) + (this.weatherX * .18) % 140, tilt = wind * 3;
                const g = c.createLinearGradient(x, 0, x + tilt, h);
                g.addColorStop(0, region === 5 ? '#b9cbff' : '#f2d5a1');
                g.addColorStop(1, '#aac5c900');
                path(c, [[x, 0], [x + 26, 0], [x + tilt + 100, h], [x + tilt + 44, h]], g as unknown as string);
            }
        }
        for (let i = 0; i < count; i++) {
            const rate = rainy ? 150 + i % 7 * 8 : region === 3 ? -28 - i % 5 * 3 : 20 + i % 5 * 3;
            const x = (((i * 113.77 + dx + (this.cameraX || 0) * -.045) % (w + 100)) + (w + 100)) % (w + 100) - 50, y = (((i * 61.3 + this.time * rate) % (h + 80)) + (h + 80)) % (h + 80) - 40;
            if (rainy) {
                const len = 12 + i % 4 * 4;
                c.globalAlpha = .14 + (i % 3) * .065;
                line(c, x, y, x + wind * .21, y + len, region === 2 ? '#9dc6d5' : '#d1e6dd', .65 + i % 2 * .3);
            }
            else if (region === 3) {
                c.globalAlpha = .25 + i % 4 * .12;
                circle(c, x, y, 1 + i % 3 * .6, i % 3 === 0 ? '#eeb585' : '#c0948d');
                if (i % 4 === 0)
                    line(c, x, y, x - wind * .16, y + 6, '#df9f7d', .8);
            }
            else if (region === 5) {
                c.globalAlpha = .2 + i % 4 * .08;
                line(c, x, y, x + sign * (7 + Math.abs(wind) * .35), y + 4, '#ccd9ee', .7);
                if (i % 5 === 0)
                    circle(c, x, y, 1.5, '#f5dfb8');
            }
            else {
                c.globalAlpha = .3 + i % 3 * .12;
                c.save();
                c.translate(x, y);
                c.rotate(Math.atan2(rate, wind * 2.8 || .1) + Math.sin(this.time + i) * .5);
                ellipse(c, 0, 0, region === 0 ? 3.5 : 2.5, 1.2, region === 0 ? ['#c7b888', '#a8be94', '#d3c5a0'][i % 3] : '#bdc3b1');
                c.restore();
            }
        }
        c.restore();
    }
    field(c: C, f: Battle['fields'][number]) {
        const t = this.time, col = f.kind === 'gravity' ? '#b4a1ec' : f.kind === 'storm' ? '#cbb8ff' : '#80d8d1';
        c.save();
        c.translate(f.x, f.y);
        this.glow(c, 0, 0, f.radius, col, .075);
        c.setLineDash([5, 13]);
        c.strokeStyle = col + '55';
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(0, 0, f.radius, 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
        if (f.kind === 'gravity') {
            this.glow(c, 0, 0, 47, col, .4);
            circle(c, 0, 0, 13, '#101b30');
            for (let j = 0; j < 3; j++) {
                c.save();
                c.rotate(-t * .8 + j * 2.1);
                c.strokeStyle = col + 'b0';
                c.lineWidth = 2;
                c.beginPath();
                c.ellipse(0, 0, 28 + j * 3, 13 + j * 2, .5, 0, Math.PI * 1.5);
                c.stroke();
                c.restore();
            }
        }
        else if (f.kind === 'storm') {
            for (let i = 0; i < 3; i++) {
                const xx = (i - 1) * 32;
                this.lightning(c, xx, -45, xx + 12, 45, col, 1.5, t * .5 + i);
            }
            this.rune(c, 0, 0, 40, col + '80', -t * .2);
        }
        else {
            this.glow(c, 0, 0, 43, col, .2);
            this.rune(c, 0, 0, 24, col, t * .4);
            for (let i = 0; i < 6; i++) {
                const a = i * Math.PI / 3, r = 40 + (t * 23) % 55;
                c.globalAlpha = 1 - ((t * 23) % 55) / 55;
                line(c, Math.cos(a) * (r - 8), Math.sin(a) * (r - 8), Math.cos(a) * r, Math.sin(a) * r, col, 1.5);
            }
            c.globalAlpha = 1;
        }
        if (this.zoom > .45) {
            txt(c, f.kind === 'gravity' ? '중력 우물' : f.kind === 'storm' ? '뇌전 증폭장' : '반발장', 0, 65, col, 11);
        }
        c.restore();
    }
    toWorld(x: number, y: number) { return { x: (x - this.ox) / this.scale, y: (y - this.oy) / this.scale }; }
    portrait(cls: ClassId, size = 160) { const can = document.createElement('canvas'); can.width = size * 2; can.height = size * 2; const c = can.getContext('2d')!; c.scale(2, 2); const co = CLASSES[cls].color; const g = c.createRadialGradient(size * .5, size * .55, 0, size * .5, size * .55, size * .65); g.addColorStop(0, co + '2b'); g.addColorStop(1, co + '00'); rect(c, 0, 0, size, size, g as unknown as string); c.translate(size * .48, size * .89); c.scale(size / 105, size / 105); this.human(c, { cls, role: cls, side: 0, h: 76, r: 17, angle: 55, facing: 1, hurt: 0, anim: 0, airborne: false, dead: false, x: 1 } as Unit, false, 0); return can.toDataURL('image/png'); }
}
