# J native field subpath culling study

Not product accepted. Source J helper6823 remains unchanged. Cached renderer is byte-identical. Native field material still uses the original bitmap, original 12 compound fills and colors, and identical downstream clipping/compositing.

Author-time exact cubic/segment bounds are calculated with svgpathtools. Every original subpath is closed. For a subpath wholly outside the viewport expanded by four device pixels and outward quantized to64 field-source units, only its original first moveto coordinate pair and close command remain. This preserves relative parser current/subpath-start arithmetic without recomputing absolute coordinates. Enclosing contours and intersecting holes remain; no shape/color simplification is used. Selected original curve source strings remain verbatim. Each original field path is still submitted as one compound nonzero fill.

One prepared selection is retained by resolved field geometry identity and quantized rectangle. clear releases this selection. Matrix/style material cache remains in place. Static bounds/source table and selected Path2D memory are additional JS/native memory, not included in helper canvas bytes; no additional canvas/readback is added. Actual cold parsing and movement across selection changes require measurement.

Native four finite poses (maximum,renderer-above,cached,native-walk) have zero RGBA differences. 107/161/115 of1777 curves remain on three native poses. This is not Chrome proof or timing acceptance.

The distinct normalized-control retains all curves but converts initial relative moveto to absolute coordinates. Its max1/walk16 RGB1 changes reproduce the earlier absolute-cull differences, separating parser roundoff from removal. The final stub candidate avoids that normalization. Historical absolute and relative-prefix failures are not accepted or overwritten.

Study should compare original/normalized-control/stub at identical actual J native views and pan phases. Expected exactness is required for original versus stub; normalized-control differences are diagnostic and never waived for the stub. Nativewalk contains positive original road/grass surfaces. Source geometry, physics, latest master monster reward behavior and user storage are not modified. Final integration must preserve newer master5eb, not replace it with J's older5b parent.
