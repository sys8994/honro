"""Chromium check of the live stage 17 objective presentation at phone and desktop sizes."""
import os
from contextlib import nullcontext

from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game

out = ROOT / '_local/reports/compact-objective-markers'
out.mkdir(parents=True, exist_ok=True)
public = os.environ.get('HONRO_PUBLIC_QA')
base = nullcontext(public) if public else serve_game()

with sync_playwright() as pw, base as url:
    browser = launch(pw)
    for width, height in [(390, 844), (1280, 800)]:
        page = browser.new_page(viewport={'width': width, 'height': height})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(url + '/HONRO.html?qa=compact-objectives')
        page.wait_for_function('!!window.HonroApp')
        initial = page.evaluate("""async () => {
            const a = HonroApp;
            await HonroCampaignLoader.ensureStage(17);
            a.frame = () => {};
            a.profile.settings.music = a.profile.settings.sound = false;
            for (let id = 1; id < 17; id++) a.profile.cleared[id] = {visits: 1};
            a.profile.recruited = a.profile.party = ['archer', 'mage', 'knight', 'occultist'];
            a.launch(17);
            for (let i = 0; a.dialogue && i < 20; i++) HonroStory.finish(a);
            a.turnNotice = null;
            const e = a.engine, s = a.scene;
            HonroObjectives.refresh(a);
            const targets = s.missionTargets.filter(t => t.kind === 'hostile');
            const required = new Set(targets.map(t => t.id));
            const xs = targets.map(t => t.x), ys = targets.map(t => t.y);
            const view = s.size(e.b);
            const {min, max} = Math;
            Object.assign(s, {
                manual: true, storyTween: null, goalFocus: null,
                scale: min(.75, (view.w - 65) / (max(...xs) - min(...xs) + 70),
                    (view.h * .45) / (max(...ys) - min(...ys) + 70)),
                x: (min(...xs) + max(...xs)) / 2, y: (min(...ys) + max(...ys)) / 2 + 70,
            });
            window.objectiveCamera = {x: s.x, y: s.y, scale: s.scale};
            window.drawObjectiveSample = (mode) => {
                const c = s.ctx, text = [], badges = [];
                const fillText = c.fillText, stroke = c.stroke;
                const unitsBefore = JSON.stringify(e.b.units);
                if (mode === 'away') s.x += view.w / s.scale + 2000;
                if (mode === 'focus') s.goalFocus = targets[0];
                if (mode === 'reduced') {
                    const first = e.unit(targets[0].id);
                    first.hp = 0;
                    first.dead = true;
                    HonroObjectives.refresh(a);
                }
                const progress = HonroObjectives.state(e.b, a.stage).currentInstruction;
                s.render(e);
                const state = JSON.stringify(e.b.units);
                c.fillText = function (label, ...args) {text.push(String(label));return fillText.call(this,label,...args);};
                c.stroke = function (...args) {if (this.strokeStyle === '#f0cf85') badges.push(1);return stroke.apply(this,args);};
                try {HonroObjectives.draw(s,e);}
                finally {c.fillText = fillText; c.stroke = stroke;}
                const unchanged = state === JSON.stringify(e.b.units);
                Object.assign(s, window.objectiveCamera, {goalFocus:null});
                return {text, badges:badges.length, unchanged, progress, changedFixture:unitsBefore!==state};
            };
            s.render(e);
            return {stage:e.b.honroStage, targets:targets.length,
                otherEnemies:e.b.units.filter(u=>u.side===1&&!required.has(u.id)).length};
        }""")
        assert initial['stage'] == 17 and initial['targets'] >= 4 and initial['otherEnemies'] > 0, initial
        page.screenshot(path=out / f"{'pages' if public else 'local'}-{width}.png")
        shown = page.evaluate("drawObjectiveSample('shown')")
        assert shown['badges'] == initial['targets'] and shown['text'] == [], shown
        assert shown['unchanged'] and f"{initial['targets']}명 남음" in shown['progress'], shown
        away = page.evaluate("drawObjectiveSample('away')")
        assert away['badges'] == 0 and len(away['text']) == 1 and '목표 적' in away['text'][0], away
        focus = page.evaluate("drawObjectiveSample('focus')")
        assert focus['badges'] == 0 and len(focus['text']) == 1 and focus['text'][0] != '목표 적', focus
        reduced = page.evaluate("drawObjectiveSample('reduced')")
        assert reduced['badges'] == initial['targets'] - 1 and f"{initial['targets'] - 1}명 남음" in reduced['progress'], reduced
        assert not errors, errors
        print(width, initial, shown, away, reduced, flush=True)
        page.close()
    browser.close()
