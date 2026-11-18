# Residual SS dependence: exhaustive pixel localization

Every RGB-different pixel from the three existing Native on/off captures was mapped by the exact inverse pose transform to BODY source coordinates. No new render, image editing, allowed region or gate relaxation. `all-difference-points.json` retains every pixel, source point, original Native topmost path owner and distance to the nearest actual `honroWalkEdges` segment in world units. Source ownership honors original path order, fill rules and apron, but pixel-center membership does not describe all AA/filter coverage. Native near-coincident curve classification is not a Chrome continuous-geometry proof.

Clustering is diagnostic single-linkage within 12 source units (minimum pose uses max(12,1.5/device-scale), here still12). It is not an author/art component classification, and low zoom sparsity can fragment a continuous boundary. All clusters, including singletons, are reported.

| Pose | Changed pixels | Center roles gray/grass | Source bbox | Minimum actual walk-edge distance (world) |
|---|---:|---|---|---:|
| .6 | 463 | 395 / 68 | x55.30..649.24,y649.24..779.55 | 191.96 |
| maximum1.65 | 394 | 315 / 79 | x54.27..309.64,y649.17..712.26 | 365.94 |
| minimum.05735 | 350 | 333 / 17 | x58.68..1509.03,y652.45..771.33 | 108.37 |

Maximum view is concentrated: 271/394 pixels (69%) form the long left-tail group x54..176,y665..712. Another84 lie at x273..310,y671..686. This supports reassessing SS after the thin tail correction, but not deleting SS now.

The .6 view is materially broader: only147/463 are at x<320. Its largest120-pixel group is x579..647,y673..732; other distinct groups include x390..437,y769..780 (40pixels), x612..642,y775..780 (38), and x410..483,y649..666 (45). These are multiple boundaries, not just the maximum-view tail.

The minimum view spans nearly the full scene source width: only71/350 are at x<320. Major right-side groups occur at x827..891,y668..755 (28), x1287..1390,y700..732 (14), and x1374..1469,y724..755 (13). A left-tail-only correction cannot be presumed to replace these dependencies.

No center owner is road/pale/outside BODY, and all centers are over108world units from declared walk edges in these captures. This does not grant permission to change grass centers: their original fill/AA role and actual Scene compositing must be checked. Source coordinates match the SS nonwalk band; the result identifies where current rendering still depends on SS, not which changes are safe or whether removal improves performance. After the next candidate, rerun this exact ablation and classify residual boundaries before any removal decision.
