# Act 4 side-view pilot authoring

See `game/docs/ACT4_SIDEVIEW_P1.md` for scope and evidence limits. These tools are
offline authoring/isolated QA tools, excluded from Pages. Python dependencies:
Pillow, numpy, lxml, svgpathtools, Playwright; actual Inkscape 1.4.4 is required for
tracing and optimizer renders. Reuse the repository browser harness.

1. `python tools/act4-sideview/scaffold.py` reads immutable world.parts geometry.
2. The selected ImageGen source PNGs and exact prompts are in
   `shared/assets/environment/act4-sideview/source/`. Do not substitute a new
   image for a recorded raw. `reference.py` exports the original native BODY.
3. For exact reproduction, copy `source/production/33` and `40` raw SVG/trace
   records into `_local/reports/act4-sideview-p1-20261116/trace33-front-extended`
   and `trace40-front`. Or execute `trace.py 33 front-extended` / `trace.py 40 front`.
   It refuses to overwrite a different existing raw/source.
4. Run `register.py 33`, then `register.py 40`. For each `registeredN-v2`, run
   `tools/terrain-node-optimizer/optimize_svg.py color-registered.svg color-opt005.svg
   --epsilon .05 --render-widths 1536,3072`, using complete paths. Append Inkscape's
   directory to PATH; do not select its unrelated Python by prepending it.
5. Run `compact.py`, `compile.py`, `node tools/act4-sideview/check.mjs`, then
   `npm run build`. Stop on any nonzero exit. No geometry/save/revision migration.
6. `measure-contact.py` checks alpha contact samples. `render-proof.py` compares
   static SVG raw/final (not gameplay). `qa.py final [33|40]` captures the built game
   in disposable browser storage. `play-save.py` uses baseline and final fixture
   saves and real keys; a complete campaign is not simulated.

All Python commands above are under `tools/act4-sideview/`. Source/trace paths,
hashes and optimizer metrics are tracked with the art. Diagnostic output goes
to ignored `_local/reports/act4-sideview-p1-20261116/`. A baseline save must come
from the actual pre-change build (`4b4e771...`); do not generate one from the final
build and label it baseline. No script accesses a personal browser profile.
