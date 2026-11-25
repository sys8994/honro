async ({reference, scale}) => {
  const a = HonroApp, b = a.engine.b, scene = a.scene;
  const play = reference?.play ?? b.honroPlayBounds;
  const outer = reference?.play ?? b.honroTerrainBounds;
  const painted = new Map();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((outer.right - outer.left) * scale);
  canvas.height = Math.round((outer.bottom - outer.top) * scale);
  const c = canvas.getContext('2d');
  c.setTransform(scale, 0, 0, scale, -outer.left * scale, -outer.top * scale);

  if (reference) {
    const asset = reference.asset, inst = {id: asset.id, asset, x: 0, y: 0, scale: 1};
    HonroVectorArt.draw(c, asset, inst);
    painted.set(inst.id, inst);
  } else {
    const select = {
      53: /^art-(m53-grey-bedrock|m53-walk-fascia|approved-upper-door-sill-extension|mumyeongsa-broken-rail)$/,
      54: /^art-(g(?:00|1[0-6]|28)-|m54-observation-balconies$)/,
      58: /-(body|facets)$|^art-m58-(suspended-hall|tile-eaves)$/,
    }[b.honroStage];
    const visible = HonroTerrainDomain.materialLandmarks(b).filter(l => select.test(l.id));
    const draw = scene.landmark;
    scene.landmark = function (ctx, inst) {
      painted.set(inst.id, inst);
      return draw.call(this, ctx, inst);
    };
    try {
      for (const layer of ['back', 'structural-back', 'mid', 'prop', 'front', 'foreground']) {
        scene._landmarkLayer(c, visible, layer);
      }
    } finally {
      scene.landmark = draw;
    }
  }
  if (!painted.size) throw Error('No active BODY paint');

  const scratch = document.createElement('canvas').getContext('2d');
  const include = (p, rect) => p.x >= rect.left && p.x < rect.right && p.y >= rect.top && p.y < rect.bottom;
  const arity = {M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7};
  function endpoints(d) {
    const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[Ee][-+]?\d+)?/g);
    const out = [];
    let cmd, p = {x: 0, y: 0}, first = p, closed = 0;
    for (let i = 0; i < tokens.length;) {
      if (/^[a-z]$/i.test(tokens[i])) cmd = tokens[i++];
      const kind = cmd.toUpperCase();
      if (kind === 'Z') {
        p = first;
        cmd = null;
        closed++;
        continue;
      }
      const n = arity[kind], values = tokens.slice(i, i + n).map(Number);
      if (values.length !== n || values.some(v => !Number.isFinite(v))) throw Error('Malformed BODY path');
      i += n;
      const relative = kind !== cmd;
      const x = relative ? p.x : 0;
      const y = relative ? p.y : 0;
      p = kind === 'H' ? {x: x + values[0], y: p.y}
        : kind === 'V' ? {x: p.x, y: y + values[0]}
        : {x: x + values[n - 2], y: y + values[n - 1]};
      if (kind === 'M') {
        first = p;
        cmd = relative ? 'l' : 'L';
      }
      out.push(p);
    }
    return {out, closed};
  }

  const rows = [];
  for (const inst of painted.values()) {
    const asset = inst.asset;
    const row = {id: inst.id, asset: asset.id, layer: inst.layer ?? null,
      transform: [inst.x, inst.y, inst.scale ?? 1, inst.rotation ?? 0],
      sourceEndpoints: 0, sourcePaths: 0, closedContours: 0, colorPaths: 0,
      clips: [], playPoints: [], outerPoints: []};
    const wire = new TextEncoder().encode(JSON.stringify(asset));
    row.normalizedBytes = wire.length;
    row.gzipBytes = (await new Response(new Blob([wire]).stream()
      .pipeThrough(new CompressionStream('gzip'))).arrayBuffer()).byteLength;
    row.assetSHA256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', wire)),
      n => n.toString(16).padStart(2, '0')).join('');
    const ownerClips = inst.honroTerrainMaterialClip ? [inst.honroTerrainMaterialClip] : [];
    if (ownerClips.length) row.clips.push('engine-material-ownership');
    function count(points, clips) {
      row.sourceEndpoints += points.length;
      for (const p of points) {
        if (!include(p, outer) || !clips.every(clip => scratch.isPointInPath(clip, p.x, p.y))) continue;
        (include(p, play) ? row.playPoints : row.outerPoints).push([p.x, p.y]);
      }
    }
    if (asset.vector) {
      const v = asset.vector, identity = new DOMMatrix().translate(inst.x, inst.y)
        .rotate((inst.rotation ?? 0) * 180 / Math.PI).scale(inst.scale ?? 1)
        .translate(-(asset.anchor?.x ?? 0), -(asset.anchor?.y ?? 0));
      function walk(node, matrix, clips, fill = '#000000', stroke = 'none') {
        if (node.transform) matrix = matrix.multiply(new DOMMatrix(node.transform));
        if (node.clipPath) {
          const world = new Path2D();
          world.addPath(new Path2D(v.clips[node.clipPath].join(' ')), matrix);
          clips = [...clips, world];
          if (!row.clips.includes(node.clipPath)) row.clips.push(node.clipPath);
        }
        fill = node.fill ?? fill;
        stroke = node.stroke ?? stroke;
        if (node.opacity === 0) return;
        if (node.tag === 'use') return walk(v.symbols[node.symbol], matrix, clips, fill, stroke);
        if (node.children) {
          for (const child of node.children) walk(child, matrix, clips, fill, stroke);
        } else if (fill !== 'none' || stroke !== 'none') {
          const path = endpoints(node.dParts?.join(' ') ?? node.d);
          row.sourcePaths++;
          row.closedContours += path.closed;
          if (fill !== 'none') row.colorPaths++;
          count(path.out.map(p => new DOMPoint(p.x, p.y).matrixTransform(matrix)), clips);
        }
      }
      walk(v.root, identity, ownerClips);
    } else {
      for (const face of HonroGeometry.shapes(asset, inst)) {
        if ((!face.fill && !face.stroke) || face.alpha === 0) continue;
        row.sourcePaths++;
        if (face.closed !== false) row.closedContours++;
        if (face.fill) row.colorPaths++;
        count(face.points, ownerClips);
      }
    }
    rows.push(row);
  }
  return {play, outer, scale, paint: canvas.toDataURL(), rows};
}
