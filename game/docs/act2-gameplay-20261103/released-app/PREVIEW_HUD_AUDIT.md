# Preview/HUD and skill-count audit

The actual Renderer.predictionGuide callback and detached scoring are not enough if HUD selection is stubbed. Production main.js updateHUD first reconciles selectedByUnit and the current actor's available skills. The old harness suppressed that entire function. After an automatic actor switch, idle native frames could therefore preview a stale skill from another class. Complex18 logs concretely show occultist/A09. Its observation-dependent run is invalid; no restored flags or silent continuation is permitted.

Generic12 was interrupted at R15 (exit130, no game-death/clear claim), preserving initial/checkpoint/process log. No stage12 prediction narrative wrapper is implicated, but it is not a completed validated-App test. Stage19 noncombat result is unaffected: production targeting preview is disabled by noncombatWalk, no shots/preview calls occurred.

Independent audit confirmed generic candidate scoring contains no lingering live e.predict/shotViable/shotSeeds; full live-battle equality guard precedes input. The preview calls the actual production guide and its own WeakMap/100ms cache. The remaining fix belongs to source-exact harness HUD-selection semantics, followed by a fresh trial.

Earlier result.skills counted all logs with a skill field (selectSkill + App fire + controller fire + preview records), not actual uses. Example smoke16 A02:3/M11:3 means one accepted shot each. Existing raw results remain unchanged; use accepted `app-operation/fire` records for actual launch counts. Current runner's skills field now counts only accepted charged launches; secondary/interrupt events remain separately logged, not fabricated launches.
