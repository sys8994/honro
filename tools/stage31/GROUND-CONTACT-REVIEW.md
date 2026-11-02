# Ground contact and route slope are separate checks

The production card used the walkable-surface selector for both E01 (enemy
ground contact) and T03 (walkable route points). This incorrectly rejected two
authored Stage31 actors already observed standing and acting on exposed slopes:
`pilot31-ridge-court-7` and `pilot31-lookout-return-5`. Their actual browser
observations are preserved in `RELEASE-CANDIDATE-AUDIT.md`; a role declaration
alone still does not establish combat effectiveness.

E01 now uses the production engine's unlimited-slope contact query on the
**named** support, then checks that the contact is exposed in the complete
terrain union. The existing eight-unit authored-coordinate tolerance is
unchanged. T03 and placement helpers retain the walkable slope limit of 1.35.
No terrain, unit, HP, activation or route coordinates are changed.

Regression fixtures check exposed steep contact, rejected steep walking routes,
floating enemies, invented support IDs and buried named supports. The old
production-contract test also depended on two obsolete campaign details:
an underground cut at x6280 and a removed `a4-31-land` support. Those test cases
now construct explicit malformed/valid geometry instead of requiring the
current campaign to retain an old defect. The internal-cut rejection and
scenery foot-placement assertions remain mandatory.

This is a measurement correction, not release approval. Probe fingerprints,
the final runtime digest, four actual visual reviews and the production build
guard must still pass for the candidate.
