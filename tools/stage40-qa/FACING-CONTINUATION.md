# R4 facing correction and registered continuation

Run 41621782011, source 4b5e31931249f8fe194047fa22ef5f6def3ab8fd (native d215e3e), stopped at R4 with 37 enemies alive, all four heroes and four residents alive, nine actual shots, and no JavaScript errors. This is a controller assertion failure, not a completed stage or a time-budget result. Original result and exact final local-storage profile are archived unchanged.

After an initial leftward plan, normal ArrowLeft moved/turned the knight. Replanning chose a rightward S06 without checking facing again. Actual joystick input correctly clamped at 90 degrees. The controller now constrains this post-facing replan to the actual current facing. No game source, statistics, trajectory, UI or difficulty changes.

Focused exact-save native regression selected leftward S06 at 163.956 degrees, power 0.5471, minimum sampled damage 729, no sampled friendly damage. Live battle JSON remained unchanged. These bounded detached calculations are not player-visible information or a universal input guarantee.

Register ONE normal JSON-import/Continue continuation from the exact failed R4 profile. Profile SHA256 a5b4f3a9fab47b0350e2690ac9188b973bd7fa39ab000588eece4194f6671810. Verify round, HP, deaths, movement resources, ranks and equipment match the original saved values. Any saved/live aim difference is normal save timing; never patch the save to match a live state. Preserve original failure, resources, elapsed rounds and all later failures.

The outcome must be described as R1-to-R4 failed execution followed by normal-save continuation, never uninterrupted first-entry acceptance. Original total completion target remains 18–20 including safe return, story, settlement and reload. Diagnostic ceiling remains R24/60 minutes, not acceptance. Final A2-integrated normal-entry acceptance, terrain/fun and mobile HUD threat readability remain open.
