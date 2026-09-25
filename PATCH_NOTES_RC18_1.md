# HONRO ACT 1 — RC18.1 HUD hotfix

## Scope
Only the battle bottom HUD layout was changed. Stage/map geometry, combat balance, VFX/SFX and mission logic are untouched.

## Wide landscape layout
Activation condition: `orientation: landscape` and viewport width >= 700 px.

Layout is now one horizontal control rail:

`joystick | 2x2 party chips | 3 stacked vitals | 4 skills | jump/defend/fire`

- footer height reduced to about 106 px in 844x390 and 1280x720 test viewports
- party chips use a 2-column grid
- HP / focus / movement bars are stacked vertically
- skill buttons and actions remain on the same row
- portrait / narrow mobile layout is unchanged

## Browser smoke check
- 844x390 landscape: footer 106 px, HUD variable 108 px, no runtime error
- 1280x720 landscape: footer 106 px, HUD variable 108 px, no runtime error
- 390x844 portrait: existing three-band layout remains active (footer 215 px), no runtime error

## Regression
`npm run test:rc18` passed after the HUD change.
