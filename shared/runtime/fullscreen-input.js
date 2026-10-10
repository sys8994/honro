/* Fullscreen owns the entire Escape press before any game/editor UI handler. */
(function (G) {
    'use strict';
    if (G.HonroFullscreenInput || typeof document === 'undefined' || typeof window === 'undefined') return;
    let wasFullscreen = !!document.fullscreenElement;
    let escapeHeld = false, fullscreenPress = false, explicitExit = false;
    let nativeExitUntil = 0;
    const now = () => performance.now();
    const isEscape = e => e.code === 'Escape' || e.key === 'Escape';
    const consume = e => { e.preventDefault(); e.stopImmediatePropagation(); };
    async function exit() {
        // Button/API exits must not consume the next independent Escape.
        explicitExit = true;
        nativeExitUntil = 0;
        try { await document.exitFullscreen?.(); }
        catch (error) { explicitExit = false; throw error; }
    }
    document.addEventListener('fullscreenchange', () => {
        const active = !!document.fullscreenElement;
        // Some browsers remove fullscreen before delivering Escape keydown.
        // Retain only a short race window, ended immediately by keyup or a new
        // pointer/other-key action. Never swallow an unrelated later press.
        if (wasFullscreen && !active && !explicitExit && !fullscreenPress)
            nativeExitUntil = now() + 300;
        if (active) nativeExitUntil = 0;
        explicitExit = false;
        wasFullscreen = active;
    });
    window.addEventListener('keydown', e => {
        if (!isEscape(e)) { nativeExitUntil = 0; return; }
        if (e.repeat || escapeHeld) { consume(e); return; }
        escapeHeld = true;
        if (!document.fullscreenElement && now() >= nativeExitUntil) return;
        fullscreenPress = true;
        nativeExitUntil = 0;
        consume(e);
        if (document.fullscreenElement) {
            // Consume even if the browser refuses this attempt. This press must
            // never open/close a game modal as a side effect of leaving fullscreen.
            void exit().catch(() => {});
        }
    }, { capture: true, passive: false });
    window.addEventListener('keyup', e => {
        if (!isEscape(e)) return;
        if (fullscreenPress) consume(e);
        escapeHeld = false;
        fullscreenPress = false;
        nativeExitUntil = 0;
    }, { capture: true, passive: false });
    window.addEventListener('pointerdown', () => { nativeExitUntil = 0; }, { capture: true });
    window.addEventListener('blur', () => { escapeHeld = false; fullscreenPress = false; nativeExitUntil = 0; });
    G.HonroFullscreenInput = Object.freeze({ exit });
})(globalThis);
